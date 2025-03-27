import { db } from '../config/db';

import { DEFAULT_FEED } from '../lib/constants';
import { UserRole } from '../lib/types/permission';
import { getActorFeeds } from './atproto';

/**
 * Fetches feeds for a given user (did) with a specific role ('mod' or 'admin').
 * If did is not provided or role === 'user', returns an empty array.
 */
export const getFeedsByRole = async (
  did: string | undefined,
  role: UserRole
) => {
  if (!did || role === 'user') return [];
  try {
    return await db('feed_permissions')
      .select('uri', 'feed_name', 'admin_did')
      .where({ did, role });
  } catch (error) {
    console.error('Error in getFeedsByRole:', error);
    return [];
  }
};

/**
 * Returns enriched feed data for a user by merging local permissions with Bluesky data.
 * Only feeds for which the user has local 'mod' or 'admin' permissions are returned.
 */
export async function getEnrichedFeedsForUser(userDid: string): Promise<{
  feeds: {
    uri: string;
    displayName?: string;
    description?: string;
    did?: string;
    type: UserRole;
  }[];
  defaultFeed: typeof DEFAULT_FEED;
}> {
  // 1. Retrieve local permissions for 'mod' and 'admin' roles.
  const [modFeeds, adminFeeds] = await Promise.all([
    getFeedsByRole(userDid, 'mod'),
    getFeedsByRole(userDid, 'admin'),
  ]);

  // 2. Combine local feeds (permissions) and create a Set of allowed URIs.
  const localFeeds = [...adminFeeds, ...modFeeds];
  const allowedUris = new Set(localFeeds.map((feed) => feed.uri));

  // 3. Fetch the actor's feeds from BlueSky.
  const response = await getActorFeeds(userDid);
  const blueskyFeeds = response?.feeds || [];

  // 4. Filter BlueSky feeds to only those that are in allowedUris.
  const filteredBlueskyFeeds = blueskyFeeds.filter((feed) =>
    allowedUris.has(feed.uri)
  );

  // 5. Create a lookup Map from feed URI to the corresponding BlueSky feed.
  const blueskyFeedsMap = new Map(
    filteredBlueskyFeeds.map((feed) => [feed.uri, feed])
  );

  // 6. Enrich local permissions with BlueSky data.
  const modFeedsList = modFeeds.map((feed) => {
    const bsFeed = blueskyFeedsMap.get(feed.uri);
    return {
      uri: feed.uri,
      displayName: bsFeed?.displayName || feed.feed_name,
      description: bsFeed?.description,
      did: bsFeed?.did,
      type: 'mod' as UserRole,
    };
  });

  const adminFeedsList = adminFeeds.map((feed) => {
    const bsFeed = blueskyFeedsMap.get(feed.uri);
    return {
      uri: feed.uri,
      displayName: bsFeed?.displayName || feed.feed_name,
      description: bsFeed?.description,
      did: bsFeed?.did,
      type: 'admin' as UserRole,
    };
  });

  // 7. Combine and deduplicate (if needed).
  const allFeeds = [...adminFeedsList, ...modFeedsList];
  const uniqueFeeds = Array.from(
    new Map(allFeeds.map((feed) => [feed.uri, feed])).values()
  );

  return { feeds: uniqueFeeds, defaultFeed: DEFAULT_FEED };
}
