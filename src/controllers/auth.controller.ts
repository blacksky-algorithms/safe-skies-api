import { Request, Response } from 'express';
import { BlueskyOAuthClient } from '../repos/oauth-client';
import { AtprotoAgent } from '../repos/atproto-agent';
import { getProfile, upsertProfile } from '../repos/profile';
import { query } from '../config/db';
import { FeedRoleInfo } from '../lib/types/permission';

const getActorFeeds = async (did: string) => {
  try {
    const result = await query(
      'SELECT uri, feed_name as name, role FROM feed_permissions WHERE did = $1',
      [did]
    );
    return { feeds: result.rows };
  } catch (error) {
    console.error('Error fetching actor feeds:', error);
    return { feeds: [] };
  }
};

const getUsersBlueskyProfileData = async (
  oAuthCallbackParams: URLSearchParams
) => {
  const { session } = await BlueskyOAuthClient.callback(oAuthCallbackParams);

  if (!session?.sub) {
    throw new Error('Invalid session: No DID found.');
  }

  try {
    const response = await AtprotoAgent.api.app.bsky.actor.getProfile({
      actor: session.sub,
    });
    return {
      did: session.sub,
      handle: response.data.handle,
      displayName: response.data.displayName,
      avatar: response.data.avatar,
    };
  } catch (error) {
    console.error('Error fetching Bluesky profile:', error);
    throw new Error('Failed to fetch profile data');
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Change from req.body to req.query
    const { handle } = req.query;

    if (!handle) {
      res.status(400).json({ error: 'Handle is required' });
      return;
    }

    const url = await BlueskyOAuthClient.authorize(handle as string);
    res.json({ url: url.toString() });
  } catch (err) {
    console.error('Error initiating Bluesky auth:', err);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error in logout:', err);
    res.status(500).json({ error: 'Failed to log out' });
  }
};

export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get initial profile data
    const profileData = await getUsersBlueskyProfileData(
      new URLSearchParams(req.query as Record<string, string>)
    );

    // Get user's feeds
    const feedsResponse = await getActorFeeds(profileData.did);
    const createdFeeds = feedsResponse?.feeds || [];

    // Initialize basic profile data
    const initialUser = {
      ...profileData,
      rolesByFeed: createdFeeds.reduce(
        (acc: Record<string, FeedRoleInfo>, feed) => {
          if (feed.uri && feed.role) {
            acc[feed.uri] = feed.role as FeedRoleInfo;
          }
          return acc;
        },
        {}
      ),
    };

    // Save profile
    const success = await upsertProfile(initialUser);
    if (!success) {
      throw new Error('Failed to save profile data');
    }

    // Get complete profile
    const completeProfile = await getProfile(profileData.did);
    if (!completeProfile) {
      throw new Error('Failed to retrieve complete profile');
    }

    // Set session cookie
    res.cookie(
      'session',
      JSON.stringify({
        did: completeProfile.did,
        handle: completeProfile.handle,
        rolesByFeed: completeProfile.rolesByFeed || {},
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      }
    );

    // Redirect to client
    res.redirect(`${process.env.CLIENT_URL}/?redirected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    res.redirect(
      `${process.env.CLIENT_URL}/oauth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
};
