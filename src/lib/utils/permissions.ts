import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { UserRole } from '../types/permission';
import { ModAction } from '../types/moderation';
import { getProfile } from '../../repos/profile';

interface Feed {
  uri: string;
  displayName?: string;
}

interface ExistingPermission {
  uri: string;
  feed_name: string;
  role: UserRole;
}

export const buildFeedPermissions = (
  userDid: string,
  createdFeeds: Feed[],
  existingPermissions: ExistingPermission[] = []
) => {
  const permissionsMap = new Map<string, ExistingPermission>();

  // Convert existing permissions array into a Map keyed by URI
  for (const perm of existingPermissions) {
    permissionsMap.set(perm.uri, perm);
  }

  // For each newly created feed, set user as admin if not present or if new role is higher
  for (const feed of createdFeeds) {
    // If no feed.uri, skip
    if (!feed.uri) continue;
    const existing = permissionsMap.get(feed.uri);
    // By default, we set admin if none or a lower role
    const defaultRole: UserRole = 'admin';

    if (!existing) {
      permissionsMap.set(feed.uri, {
        uri: feed.uri,
        feed_name: feed.displayName || feed.uri.split('/').pop() || 'Unnamed',
        role: defaultRole,
      });
    } else {
      // If existing role is 'user', we can raise it to admin if you want
      // Or preserve 'mod' if it’s “higher.” Adjust logic as you see fit
      // e.g., if ROLE_PRIORITY[existing.role] < ROLE_PRIORITY['admin'], then upgrade
    }
  }

  // Return as an array of permissions with the user DID
  return Array.from(permissionsMap.values()).map((perm) => ({
    did: userDid,
    uri: perm.uri,
    feed_name: perm.feed_name,
    role: perm.role,
  }));
};

export const groupModeratorsByFeed = (
  permissions: {
    uri: string;
    user_did: string;
    role: UserRole;
  }[]
) => {
  return permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.uri]) {
        acc[perm.uri] = [];
      }
      acc[perm.uri].push(perm);
      return acc;
    },
    {} as Record<
      string,
      {
        uri: string;
        user_did: string;
        role: UserRole;
        feed_name?: string;
      }[]
    >
  );
};

export const getBulkProfileDetails = async (
  userDids: string[]
): Promise<ProfileViewBasic[]> => {
  // Deduplicate DIDs
  const uniqueDids = [...new Set(userDids)];

  // Get all profiles in parallel
  const profiles = await Promise.all(uniqueDids.map((did) => getProfile(did)));

  // Map back to original order
  return userDids.map(
    (did) =>
      profiles.find((profile) => profile?.did === did) || { did, handle: did }
  );
};

/**
 * Determines if a user with a given role can perform the specified moderation action.
 */
export const canPerformWithRole = (
  role: UserRole,
  action: ModAction
): boolean => {
  switch (action) {
    case 'mod_promote':
    case 'mod_demote':
    case 'user_unban':
    case 'user_ban':
      return role === 'admin';
    case 'post_delete':
    case 'post_restore':
      return role === 'mod' || role === 'admin';
    default:
      return false;
  }
};
