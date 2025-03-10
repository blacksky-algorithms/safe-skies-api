import { db } from '../config/db';
import { ExtendedProfile, User } from '../lib/types/user';
import { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { getEnrichedFeedsForUser } from './feed';
import { buildFeedPermissions } from './permissions';

/**
 * Saves (upserts) a user's basic profile data and feed permissions
 */
export async function saveProfile(
  blueSkyProfileData: ExtendedProfile,
  createdFeeds: GeneratorView[]
): Promise<boolean> {
  try {
    // 1. Upsert the "profiles" record
    await db('profiles')
      .insert({
        did: blueSkyProfileData.did,
        handle: blueSkyProfileData.handle,
        avatar: blueSkyProfileData.avatar,
        display_name: blueSkyProfileData.displayName,
        associated: blueSkyProfileData.associated || null,
        labels: blueSkyProfileData.labels || null,
      })
      .onConflict('did')
      .merge({
        handle: blueSkyProfileData.handle,
        avatar: blueSkyProfileData.avatar,
        display_name: blueSkyProfileData.displayName,
        associated: blueSkyProfileData.associated || null,
        labels: blueSkyProfileData.labels || null,
      });

    // 2. Fetch existing feed permissions for this user
    const existingPermissions = await db('feed_permissions')
      .select('uri', 'feed_name', 'role')
      .where({ did: blueSkyProfileData.did });

    // 3. Build feed permissions, merging with existing ones
    const feedPermissions = await buildFeedPermissions(
      blueSkyProfileData.did,
      createdFeeds,
      existingPermissions
    );

    // 4. Upsert new feed permissions
    if (feedPermissions.length > 0) {
      await db('feed_permissions')
        .insert(feedPermissions)
        .onConflict(['did', 'uri'])
        .merge();
    }

    return true;
  } catch (error) {
    console.error('Error in saveProfile:', error);
    return false;
  }
}
// getProfile fetches a user by DID from the 'profiles' table
export async function getProfile(did: string): Promise<User | null> {
  try {
    const result = await db('profiles').select('*').where({ did }).first();

    if (!result) return null;

    return result as User;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function upsertProfile(profile: Partial<User>): Promise<boolean> {
  try {
    // Map TypeScript fields to DB columns
    const dbProfile: Record<string, any> = {
      did: profile.did,
      handle: profile.handle,
      display_name: profile.displayName,
      avatar: profile.avatar,
      associated: {
        ...(profile.associated || {}),
        rolesByFeed: profile.rolesByFeed || [],
      },
      labels: profile.labels || null,
    };

    // Perform UPSERT using did as the conflict key
    await db('profiles').insert(dbProfile).onConflict('did').merge(dbProfile);

    return true;
  } catch (error) {
    console.error('Error upserting profile:', error);
    return false;
  }
}

export const getEnrichedProfile = async (did: string) => {
  // 1. Retrieve the basic profile.
  const profile = await getProfile(did);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // 2. Retrieve enriched feed data.
  const feedsData = await getEnrichedFeedsForUser(did);

  // 3. Combine both into one object.
  return {
    ...profile,
    rolesByFeed: feedsData.feeds,
    defaultFeed: feedsData.defaultFeed,
  };
};
