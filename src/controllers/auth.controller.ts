import { Request, Response } from 'express';
import { SessionData } from 'express-session';
import { BlueskyOAuthClient } from '../repos/oauth-client';
import { AtprotoAgent } from '../repos/atproto-agent';
import { getProfile, saveProfile } from '../repos/profile';
import { db } from '../config/db'; // Knex instance
import { FeedRoleInfo } from '../lib/types/permission';

interface CustomSessionData extends SessionData {
  user?: {
    did: string;
    handle: string;
    rolesByFeed: Record<string, FeedRoleInfo>;
  };
}

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
      actor: session.did,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch profile data');
    }

    return response.data;
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
};

/**
 * Logs the user out by clearing the session cookie.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    console.log('logout: Session cookie cleared.');
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
 * 4. Sets session data using express-session.
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

    // 6. Set session data using express-session.
    //    We assume that express-session middleware has been set up on the server.
    (req.session as CustomSessionData).user = {
      did: completeProfile.did,
      handle: completeProfile.handle,
      rolesByFeed: completeProfile.rolesByFeed || {},
    };
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      } else {
        console.log('callback: Session data saved successfully.');
      }
      // 7. Redirect the user back to the client with the session cookie and profile data.
      // res.send({ success: true, profile: completeProfile });
      res.redirect(`${process.env.CLIENT_URL}`);
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    res.redirect(
      `${process.env.CLIENT_URL}/oauth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
};
