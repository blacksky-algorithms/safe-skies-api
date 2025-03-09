import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { UserRole } from '../types/permission';
import { ModAction } from '../types/moderation';
import { getProfile } from '../../repos/profile';
import { ROLE_PRIORITY } from '../constants/permission';
import { getModerationServicesConfig } from '../../repos/moderation';

interface Feed {
  uri: string;
  displayName?: string;
}

interface ExistingPermission {
  uri: string;
  feed_name: string;
  role: UserRole;
  allowed_services?: string;
}

/**
 * Computes the allowed services for a given feed URI using the moderation services config.
 * Always includes 'ozone' by default.
 *
 * @param feedUri - The feed URI from feed_permissions.
 * @param servicesConfig - Array of moderation service configuration objects.
 * @returns An array of allowed service values.
 */
async function computeAllowedServicesForFeed(
  feedUri: string,
  servicesConfig: { value: string; admin_did?: string }[]
): Promise<string[]> {
  const allowed: string[] = ['ozone']; // Ozone is always allowed.
  for (const service of servicesConfig) {
    if (service.value === 'ozone') continue;
    if (service.admin_did && feedUri.includes(service.admin_did)) {
      allowed.push(service.value);
    }
  }
  return allowed || ['ozone'];
}

/**
 * Builds feed permission records for a user by merging created feeds with any existing permissions.
 * Now also computes the allowed_services for each feed permission.
 *
 * @param userDid - The user's DID.
 * @param createdFeeds - Array of Feed objects representing new feeds.
 * @param existingPermissions - Array of existing permission records (if any).
 * @returns An array of feed permission objects ready for insertion/upsert.
 */
export async function buildFeedPermissions(
  userDid: string,
  createdFeeds: Feed[],
  existingPermissions: ExistingPermission[] = []
): Promise<
  {
    did: string;
    uri: string;
    feed_name: string;
    role: UserRole;
    allowed_services: string[]; // Now an array of strings.
  }[]
> {
  const permissionsMap = new Map<string, ExistingPermission>();
  for (const perm of existingPermissions) {
    permissionsMap.set(perm.uri, perm);
  }

  const servicesConfig = await getModerationServicesConfig();

  const permissionsPromises = createdFeeds.map(async (feed) => {
    if (!feed.uri) return null;
    const existing = permissionsMap.get(feed.uri);
    const defaultRole: UserRole = 'user';
    let role: UserRole;
    let feedName: string;

    if (!existing) {
      role = defaultRole;
      feedName = feed.displayName || feed.uri.split('/').pop() || 'Unnamed';
    } else {
      role =
        ROLE_PRIORITY[existing.role] < ROLE_PRIORITY[defaultRole]
          ? defaultRole
          : existing.role;
      feedName = feed.displayName || existing.feed_name;
    }

    const allowedServices = await computeAllowedServicesForFeed(
      feed.uri,
      servicesConfig
    );

    return {
      did: userDid,
      uri: feed.uri,
      feed_name: feedName,
      role,
      allowed_services: allowedServices,
    };
  });

  const permissions = (await Promise.all(permissionsPromises)).filter(Boolean);
  return permissions as {
    did: string;
    uri: string;
    feed_name: string;
    role: UserRole;
    allowed_services: string[];
  }[];
}

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
