// src/repos/permission.ts

import { db } from '../config/db'; // Your Knex instance
export type UserRole = 'user' | 'mod' | 'admin';
export type ModAction = 'mod_promote' | 'mod_demote';

/**
 * Checks whether a user with a given DID can perform the specified action
 * on a feed identified by URI.
 */
export async function canPerformAction(
  userDid: string,
  action: ModAction,
  uri: string | null
): Promise<boolean> {
  if (!userDid || !uri) return false;

  try {
    // SELECT role FROM feed_permissions WHERE did = ? AND uri = ? LIMIT 1
    const row = await db('feed_permissions')
      .select('role')
      .where({ did: userDid, uri })
      .first();

    if (!row) return false;

    // Simplified permissions:
    // admin => can do anything
    // mod => can mod_promote
    if (row.role === 'admin') return true;
    if (row.role === 'mod' && action === 'mod_promote') return true;

    return false;
  } catch (error) {
    console.error('Error in canPerformAction:', error);
    return false;
  }
}

/**
 * Inserts or updates a feed_permissions record for the given user/feed combination.
 * Uses an upsert approach via onConflict([...]).merge([...]).
 *
 * Assumes you have a unique or primary key on (did, uri) in feed_permissions,
 * or some composite constraint that allows onConflict to work.
 */
export async function setFeedRole(
  targetUserDid: string,
  uri: string,
  role: UserRole,
  setByUserDid: string,
  feedName: string
): Promise<boolean> {
  try {
    // Insert or update feed_permissions
    // If there's a unique constraint on (did, uri), onConflict merges the changes.
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

    // Optionally log moderation event here if needed
    return true;
  } catch (error) {
    console.error('Error in setFeedRole:', error);
    return false;
  }
}
