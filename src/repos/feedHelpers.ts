// src/repos/feedHelpers.ts
import { db } from '../config/db';
import { AtprotoAgent } from './atproto-agent';
import { DEFAULT_FEED } from '../lib/constants';
import { UserRole } from '../lib/types/permission';

/**
 * Retrieve local feed permissions from the database.
 */
export const getFeedsByRole = async (did: string, role: UserRole) => {
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
 * Retrieve the actor's feeds from Bluesky.
 */
export const getActorFeedsData = async (actor: string) => {
  try {
    const response = await AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
    return response.data?.feeds || [];
  } catch (error) {
    console.error('Error fetching Bluesky feeds:', error);
    return [];
  }
};

/**
 * Combines local feed permissions with Bluesky feed data
 * and returns an enriched feed object.
 */
export const getEnrichedFeedsForUser = async (userDid: string) => {
  // Retrieve 'mod' and 'admin' feeds from your database.
  const [modFeeds, adminFeeds] = await Promise.all([
    getFeedsByRole(userDid, 'mod'),
    getFeedsByRole(userDid, 'admin'),
  ]);

  // Get feeds data from Bluesky.
  const blueskyFeeds = await getActorFeedsData(userDid);

  // Create a Map for quick lookup from Bluesky feeds.
  const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));

  // Merge and format mod feeds.
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

  // Merge and format admin feeds.
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

  // Combine both lists and remove duplicates.
  const allFeeds = [...adminFeedsList, ...modFeedsList];
  const uniqueFeeds = Array.from(
    new Map(allFeeds.map((feed) => [feed.uri, feed])).values()
  );

  return { feeds: uniqueFeeds, defaultFeed: DEFAULT_FEED };
};
