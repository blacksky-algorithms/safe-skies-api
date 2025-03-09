// src/controllers/dev.controller.ts

import { Request, Response } from 'express';
import { AtprotoAgent, getActorFeeds } from '../repos/atproto';
import { saveProfile } from '../repos/profile';
import { getProfile } from '../repos/profile';
import { rudy } from '../../temp/rudy';

export const devLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, profile_did } = req.body;

    if (!accessToken || !profile_did) {
      res
        .status(400)
        .json({ error: 'Access token and profile_did are required' });
      return;
    }

    // 1. Set access token on AtprotoAgent
    AtprotoAgent.setHeader('Authorization', `Bearer ${accessToken}`);

    // 2. Get profile data from Bluesky
    const response = await AtprotoAgent.app.bsky.actor.getProfile({
      actor: profile_did,
    });

    if (!response.success) {
      res.status(401).json({ error: 'Invalid access token or DID' });
      return;
    }

    // 3. Extract partial profile data (like in your normal callback)
    const profileData = {
      did: profile_did,
      handle: response.data.handle,
      displayName: response.data.displayName,
      avatar: response.data.avatar,
      // If you store associated, labels, etc. then add them here
      associated: response.data.associated,
      labels: response.data.labels,
    };

    // 4. Also get user's feed generator data from the official Bluesky API, if desired
    // If your normal "getActorFeeds" is from the actor feedGenerators, do it:
    const actorFeedsResponse = await getActorFeeds(profile_did);
    const createdFeeds = actorFeedsResponse?.feeds || [];

    // 5. Save (upsert) the profile + feed permissions
    //    (mirroring your normal callback's "saveProfile" usage)
    const success = await saveProfile(profileData, createdFeeds);
    if (!success) {
      throw new Error('Failed to save profile data');
    }

    // 6. Retrieve the complete profile after upsert,
    //    so we can fill rolesByFeed or additional data
    const completeProfile = await getProfile(profile_did);
    if (!completeProfile) {
      throw new Error('Failed to retrieve complete profile');
    }

    // 7. Build a minimal user object to put in the session cookie
    //    If your real callback sets rolesByFeed, do so:
    //    completeProfile already might have rolesByFeed from the getProfile call
    const userSessionData = {
      did: completeProfile.did,
      handle: completeProfile.handle,
      rolesByFeed: completeProfile.rolesByFeed || {},
    };

    // 8. Set a session cookie (less strict settings for dev)
    res.cookie('session', JSON.stringify(userSessionData), {
      httpOnly: true,
      secure: false, // dev
      sameSite: 'lax', // dev
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 9. Return JSON so dev can see the result
    res.json({
      success: true,
      profile: completeProfile,
      sessionSet: true,
    });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({
      error: 'Failed to set up development session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getRudyActiveFeeds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await getActorFeeds(rudy.did);
    res.json(data);
  } catch (error) {
    console.error('Error fetching rudy data:', error);
    res.status(500).json({
      error: 'Failed to fetch rudy data',
    });
  }
};
