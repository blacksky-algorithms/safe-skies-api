import { db } from '../config/db';

import { DEFAULT_FEED } from '../lib/constants';
import { UserRole } from '../lib/types/permission';
import { getActorFeedsData } from './atproto-agent';

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
      .select('uri', 'feed_name')
      .where({ did, role });
  } catch (error) {
    console.error('Error in getFeedsByRole:', error);
    return [];
  }
};

/**
 * Combines local feed permissions with Bluesky feed data
 * and returns an enriched feed object.
 */
/**
 * Returns enriched feed data for a user by merging local permissions with Bluesky data.
 */
export async function getEnrichedFeedsForUser(userDid: string): Promise<{
  feeds: {
    uri: string;
    displayName?: string;
    description?: string;
    did?: string;
    type: UserRole;
  }[];
  defaultFeed: {
    uri: string;
    displayName?: string;
    description?: string;
    did?: string;
    type: UserRole;
  };
}> {
  // Retrieve local feed permissions for both mod and admin roles.
  const [modFeeds, adminFeeds] = await Promise.all([
    getFeedsByRole(userDid, 'mod'),
    getFeedsByRole(userDid, 'admin'),
  ]);

  // Fetch the latest feed data from Bluesky.
  const blueskyFeeds = await getActorFeedsData(userDid);
  const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));

  // Map the mod permissions into enriched feeds.
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

  // Map the admin permissions into enriched feeds.
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

  // Optionally update the local DB if the display names differ.
  const updatePromises = [...modFeeds, ...adminFeeds].map(async (feed) => {
    const bsFeed = blueskyFeedsMap.get(feed.uri);
    if (bsFeed && bsFeed.displayName !== feed.feed_name) {
      await db('feed_permissions')
        .where({ uri: feed.uri, did: userDid })
        .update({ feed_name: bsFeed.displayName });
    }
  });
  await Promise.all(updatePromises);

  // Combine both lists and remove duplicates by URI.
  const allFeeds = [...adminFeedsList, ...modFeedsList];
  const uniqueFeeds = Array.from(
    new Map(allFeeds.map((feed) => [feed.uri, feed])).values()
  );

  return { feeds: uniqueFeeds, defaultFeed: DEFAULT_FEED };
}
