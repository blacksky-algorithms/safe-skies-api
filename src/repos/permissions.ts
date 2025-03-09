import { db } from '../config/db';
import { ModAction } from '../lib/types/moderation';
import { UserRole } from '../lib/types/permission';
import { ModeratorData } from '../lib/types/user';
import {
  canPerformWithRole,
  getBulkProfileDetails,
  groupModeratorsByFeed,
} from '../lib/utils/permissions';
import { Feed } from '@atproto/api/dist/client/types/app/bsky/feed/describeFeedGenerator';

/**
 * Helper: Fetch the actor's feeds from the 'feed_permissions' table using Knex.
 */

export const getActorFeeds = async (did: string) => {
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
 * Retrieves the current role for a user on a given feed.
 * Returns 'user' if no record is found.
 */
export async function getFeedRole(
  userDid: string,
  uri: string
): Promise<UserRole> {
  try {
    // Assuming the feed_permissions table uses the column "did" for the user's DID.
    const row = await db('feed_permissions')
      .select('role')
      .where({ did: userDid, uri })
      .first();
    return row ? row.role : 'user';
  } catch (error) {
    console.error('Error in getFeedRole:', error);
    return 'user';
  }
}

/* Checks whether a user (identified by userDid) can perform a specified action on a feed (uri).
 */
export async function canPerformAction(
  userDid: string,
  action: ModAction,
  uri: string | null
): Promise<boolean> {
  if (!userDid || !uri) return false;
  const role = await getFeedRole(userDid, uri);
  return canPerformWithRole(role, action);
}

/**
 * Creates a moderation log entry.
 * Adjust the table name and columns based on your schema.
 */
export async function createModerationLog(log: {
  uri: string;
  performed_by: string;
  action: ModAction;
  target_user_did: string;
  target_post_uri?: string;
  reason?: string;
  to_services?: string[];
  metadata: any;
}): Promise<void> {
  try {
    console.log(
      'Inserting moderation log with data:',
      JSON.stringify(log, null, 2)
    );
    const result = await db('logs').insert({
      id: db.raw('gen_random_uuid()'),
      uri: log.uri,
      performed_by: log.performed_by,
      action: log.action,
      target_user_did: log.target_user_did,
      target_post_uri: log.target_post_uri,
      reason: log.reason,
      to_services: log.to_services,
      metadata: JSON.stringify(log.metadata),
      created_at: new Date().toISOString(),
    });
    console.log('Database insertion result for moderation log:', result);
  } catch (error) {
    console.error('Error creating moderation log:', error);
    throw error;
  }
}
/**
 * Retrieves the current role for a user on a given feed.
 * Since roles are defined per feed, we query the feed_permissions table.
 */
export async function getUserRoleForFeed(
  userDid: string,
  uri: string
): Promise<'admin' | 'mod' | 'user'> {
  try {
    const row = await db('feed_permissions')
      .select('role')
      .where({ did: userDid, uri })
      .first();
    return row ? row.role : 'user';
  } catch (error) {
    console.error('Error in getUserRoleForFeed:', error);
    return 'user';
  }
}
/**
 * Upserts a feed permission record for a target user.
 * It first checks whether the target user's profile exists (and creates one if necessary),
 * then upserts the record in the feed_permissions table, and finally logs the action.
 */
export async function setFeedRole(
  targetUserDid: string,
  uri: string,
  role: UserRole,
  setByUserDid: string,
  feedName: string
): Promise<boolean> {
  try {
    // 1. Check if the target user's profile exists.
    const existingProfile = await db('profiles')
      .select('*')
      .where({ did: targetUserDid })
      .first();

    // 2. If no profile exists, create a minimal profile.
    if (!existingProfile) {
      const minimalProfile = {
        did: targetUserDid,
        handle: targetUserDid, // Use the DID as a placeholder.
        // Add any additional required default fields here.
      };
      await db('profiles').insert(minimalProfile);
    }

    // 3. Upsert the feed permission record.
    await db('feed_permissions')
      .insert({
        did: targetUserDid,
        uri,
        feed_name: feedName,
        role,
        created_by: setByUserDid,
        created_at: new Date().toISOString(),
      })
      .onConflict(['did', 'uri'])
      .merge({
        feed_name: feedName,
        role,
        created_by: setByUserDid,
        created_at: new Date().toISOString(),
      });

    // 4. Create a moderation log.
    const action: ModAction = role === 'mod' ? 'mod_promote' : 'mod_demote';
    await createModerationLog({
      uri,
      performed_by: setByUserDid,
      action,
      target_user_did: targetUserDid,
      metadata: { role, feed_name: feedName },
    });

    return true;
  } catch (error) {
    console.error('Error in setFeedRole:', error);
    return false;
  }
}

/**
 * Retrieves moderator profiles for each feed provided.
 * For each feed:
 *   - Queries the feed_permissions table for records with role = 'mod'
 *   - Groups permissions by feed URI using groupModeratorsByFeed
 *   - Uses getBulkProfileDetails to fetch full profile details for each moderator
 *   - Maps each moderator into an object matching ModeratorData:
 *         { did, uri, feed_name, role, profiles }
 *
 * @param feeds An array of Feed objects.
 * @returns A Promise that resolves to an array of objects { feed, moderators }.
 */

export async function getModeratorsByFeeds(
  feeds: Feed[]
): Promise<{ feed: Feed; moderators: ModeratorData[] }[]> {
  if (!feeds.length) return [];
  try {
    const feedUris = feeds.map((feed) => feed.uri);
    // Query for permissions with role 'mod' on the specified feeds.
    const permissions = await db('feed_permissions')
      .select('uri', 'did as user_did', 'feed_name', 'role')
      .whereIn('uri', feedUris)
      .andWhere({ role: 'mod' });
    if (!permissions.length) {
      return feeds.map((feed) => ({ feed, moderators: [] }));
    }
    // Group permissions by feed URI.
    const moderatorsByFeedUri = groupModeratorsByFeed(permissions);
    // For each feed, fetch moderator profile details and map to ModeratorData.
    const results = await Promise.all(
      feeds.map(async (feed) => {
        const feedPermissions = moderatorsByFeedUri[feed.uri] || [];
        const userDids = feedPermissions.map((mod) => mod.user_did);
        const profiles = await getBulkProfileDetails(userDids);
        // Map each fetched profile into a ModeratorData object.
        const moderators: ModeratorData[] = profiles.map((profile, index) => ({
          did: profile.did,
          uri: feedPermissions[index].uri,
          feed_name: feedPermissions[index].feed_name,
          role: feedPermissions[index].role,
          profile: profile,
        }));
        return { feed, moderators };
      })
    );
    return results;
  } catch (error) {
    console.error('Error fetching moderators by feeds:', error);
    throw error;
  }
}

/**
 * Retrieves all moderator profiles for feeds where the acting admin has admin privileges.
 * Steps:
 *   1. Retrieve feed URIs from feed_permissions where the admin (adminDid) has role 'admin'.
 *   2. Query for permission records on those feeds (joined with profiles) where role is either 'mod' or 'admin'.
 *   3. Deduplicate the results by the profile DID and build ModeratorData objects.
 *
 * @param adminDid - The DID of the admin.
 * @returns A Promise that resolves to an array of ModeratorData.
 */
export async function getAllModeratorsForAdmin(
  adminDid: string
): Promise<ModeratorData[]> {
  try {
    // Get feeds where the admin has admin role.
    const adminFeeds = await db('feed_permissions')
      .select('uri')
      .where({ did: adminDid, role: 'admin' });
    if (!adminFeeds.length) return [];
    const feedUris = adminFeeds.map((feed) => feed.uri);
    // Query for permission records on those feeds (for roles 'mod' or 'admin') with profile details.
    const rows = await db('feed_permissions')
      .select(
        'feed_permissions.did as user_did',
        'feed_permissions.uri',
        'feed_permissions.feed_name',
        'feed_permissions.role',
        'p.did as profile_did',
        'p.handle',
        'p.display_name',
        'p.avatar'
      )
      .leftJoin('profiles as p', 'feed_permissions.did', 'p.did')
      .whereIn('feed_permissions.uri', feedUris)
      .andWhere(function () {
        this.where('feed_permissions.role', 'mod').orWhere(
          'feed_permissions.role',
          'admin'
        );
      });
    if (!rows.length) return [];
    // Deduplicate moderator profiles and construct ModeratorData objects.
    const moderatorMap = new Map<string, ModeratorData>();
    for (const row of rows) {
      const key = row.profile_did;
      if (!key) continue;
      // Create the moderator data if it doesn't exist; otherwise update with higher privileges.
      if (!moderatorMap.has(key)) {
        moderatorMap.set(key, {
          did: row.profile_did,
          uri: row.uri,
          feed_name: row.feed_name,
          role: row.role,
          profile: {
            did: row.profile_did,
            handle: row.handle,
            displayName: row.display_name,
            avatar: row.avatar,
          },
        });
      } else {
        const existing = moderatorMap.get(key)!;
        if (existing.role !== 'admin' && row.role === 'admin') {
          existing.role = 'admin';
          existing.uri = row.uri;
          existing.feed_name = row.feed_name;
        }
      }
    }
    return Array.from(moderatorMap.values());
  } catch (error) {
    console.error('Error fetching moderators for admin:', error);
    throw error;
  }
}

// Placeholder gate function for Blacksky service.
export function blackskyServiceGate(): boolean {
  // Replace with your actual logic later.
  return false;
}
