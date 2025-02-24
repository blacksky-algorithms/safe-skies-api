// src/repos/profile.ts
import { db } from '../config/db';
import { User } from '../lib/types/user';
import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

import { buildFeedPermissions } from '../lib/utils/permissions';
import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

interface ExtendedProfile extends ProfileViewBasic {
  // match your table columns if you store associated, labels, etc.
  associated?: any;
  labels?: any;
}

/**
 * Saves (upserts) a user's basic profile data and feed permissions,
 * mirroring the old Next "saveProfile" approach.
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
        // If your table uses "display_name" for "displayName"
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

    // 2. Build feed permissions for newly created feeds
    // If you want to merge existing feed perms, fetch them first
    // e.g., const existingPermissions = await db('feed_permissions').where({ user_did: blueSkyProfileData.did });
    // Then pass existingPermissions into buildFeedPermissions
    const feedPermissions = buildFeedPermissions(
      blueSkyProfileData.did,
      createdFeeds,
      /* existingPermissions */ []
    );

    // 3. Upsert new feed permissions
    if (feedPermissions.length > 0) {
      // If your table uses (did, uri) or (user_did, uri) as the unique conflict, adjust accordingly
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

    // If your 'profiles' table uses different column names than your User interface,
    // map them here if necessary. Otherwise, just cast directly:
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
      display_name: profile.displayName, // store "displayName" in "display_name"
      avatar: profile.avatar,
      // Put rolesByFeed in the associated JSON if you want to preserve it
      associated: {
        ...(profile.associated || {}),
        rolesByFeed: profile.rolesByFeed || {},
      },
      // If you have separate 'labels' field, map that too
      labels: profile.labels || null,
      // "created_at" is set by default in migrations if needed
    };

    // Perform UPSERT using did as the conflict key
    await db('profiles').insert(dbProfile).onConflict('did').merge(dbProfile);

    return true;
  } catch (error) {
    console.error('Error upserting profile:', error);
    return false;
  }
}
