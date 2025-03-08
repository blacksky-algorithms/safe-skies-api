import { Request, Response } from 'express';
import { BlueskyOAuthClient } from '../repos/oauth-client';
import { AtprotoAgent } from '../repos/atproto-agent';
import { getProfile, saveProfile } from '../repos/profile';
import { db } from '../config/db'; // Knex instance
import { FeedRoleInfo } from '../lib/types/permission';
import jwt from 'jsonwebtoken';
import { SessionPayload } from '../lib/types/session';

/**
 * Helper: Fetch the actor's feeds from the 'feed_permissions' table using Knex.
 */
const getActorFeeds = async (did: string) => {
  try {
    const feeds = await db('feed_permissions')
      .select({ name: 'feed_name' }, 'uri', 'role')
      .where({ did });

    return { feeds };
  } catch (error) {
    console.error('Error fetching actor feeds:', error);
    return { feeds: [] };
  }
};

/**
 * Helper: Retrieve the user's Bluesky profile data by exchanging the OAuth callback parameters.
 */
const getUsersBlueskyProfileData = async (
  oAuthCallbackParams: URLSearchParams
) => {
  const { session } = await BlueskyOAuthClient.callback(oAuthCallbackParams);

  if (!session?.sub) {
    throw new Error('Invalid session: No DID found.');
  }

  try {
    const response = await AtprotoAgent.getProfile({
      actor: session.sub,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch profile data');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching profile data:', error);
    throw new Error('Failed to fetch profile data');
  }
};

/**
 * Initiates the Bluesky OAuth flow.
 * Expects a 'handle' query parameter and returns a JSON object containing the authorization URL.
 */
export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
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

/**
 * Logs the user out by clearing the custom JWT session cookie.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('session_token', {
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

/**
 * Handles the OAuth callback from Bluesky.
 * 1. Obtains the user's Bluesky profile data.
 * 2. Retrieves local feed permissions.
 * 3. Upserts (saves) the user profile (with feed permissions) into the database.
 * 4. Creates a JWT session and sets it in an HTTP‑only cookie.
 * 5. Redirects the user back to the client.
 */
export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Obtain initial profile data from Bluesky using OAuth callback parameters.
    const profileData = await getUsersBlueskyProfileData(
      new URLSearchParams(req.query as Record<string, string>)
    );

    // 2. Retrieve local feed permissions for the user.
    const feedsResponse = await getActorFeeds(profileData.did);
    const createdFeeds = feedsResponse?.feeds || [];

    // 3. Build the initial user object merging local feed roles.
    const initialUser = {
      ...profileData,
      rolesByFeed: createdFeeds.reduce(
        (acc: Record<string, FeedRoleInfo>, feed) => {
          if (feed.uri && feed.role) {
            acc[feed.uri] = feed.role as FeedRoleInfo;
          }
          return acc;
        },
        {} as Record<string, FeedRoleInfo>
      ),
    };

    // 4. Upsert (save) the user profile along with feed permissions.
    const upsertSuccess = await saveProfile(initialUser, createdFeeds);
    if (!upsertSuccess) {
      throw new Error('Failed to save profile data');
    }

    // 5. Retrieve the complete profile (including any feed role updates).
    const completeProfile = await getProfile(profileData.did);
    if (!completeProfile) {
      throw new Error('Failed to retrieve complete profile');
    }

    // 6. Create a session payload and sign a JWT.
    const sessionPayload: SessionPayload = {
      did: completeProfile.did,
      handle: completeProfile.handle,
      displayName: completeProfile.displayName,
      rolesByFeed: completeProfile.rolesByFeed || {},
    };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    const token = jwt.sign(sessionPayload, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    // 7. Redirect the user back to the client.
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    res.redirect(
      `${process.env.CLIENT_URL}/oauth/login?error=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
};
