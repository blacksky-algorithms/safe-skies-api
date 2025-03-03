// src/repos/permission.ts
import { db } from '../config/db'; // Your Knex instance
import { ModAction } from '../lib/types/moderation';
import { UserRole } from '../lib/types/permission';

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

/**
 * Determines if a user with a given role can perform the specified moderation action.
 */
export function canPerformWithRole(role: UserRole, action: ModAction): boolean {
  switch (action) {
    // Only admins may promote or demote moderators, ban or unban users.
    case 'mod_promote':
    case 'mod_demote':
    case 'user_unban':
    case 'user_ban':
      return role === 'admin';
    // For post deletion or restoration, mods and admins are allowed.
    case 'post_delete':
    case 'post_restore':
      return role === 'mod' || role === 'admin';
    default:
      return false;
  }
}

/**
 * Checks whether a user (identified by userDid) can perform a specified action on a feed (uri).
 */
export async function canPerformAction(
  userDid: string,
  action: ModAction,
  uri: string | null
): Promise<boolean> {
  if (!userDid || !uri) return false;
  const feedRole = await getFeedRole(userDid, uri);
  return canPerformWithRole(feedRole, action);
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
  metadata: any;
}): Promise<void> {
  try {
    await db('logs').insert({
      id: db.raw('gen_random_uuid()'),
      uri: log.uri,
      performed_by: log.performed_by,
      action: log.action,
      target_user_did: log.target_user_did,
      metadata: JSON.stringify(log.metadata),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating moderation log:', error);
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
