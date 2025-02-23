// src/controllers/feedController.ts
import { Request, Response } from 'express';
import { AtprotoAgent } from '../repos/atproto-agent';
import { DEFAULT_FEED } from '../lib/constants';
import { UserRole } from '../lib/types/permission';
import { query } from '../config/db';

const getFeedsByRole = async (userDid: string | undefined, role: UserRole) => {
  if (!userDid || role === 'user') return [];
  try {
    const result = await query(
      'SELECT uri, feed_name FROM feed_permissions WHERE did = $1 AND role = $2',
      [userDid, role]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getFeedsByRole:', error);
    return [];
  }
};

export const getActorFeeds = async (actor?: string) => {
  if (!actor) {
    return;
  }
  try {
    const response = await AtprotoAgent.app.bsky.feed.getActorFeeds({
      actor,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feed generator data:', error);
    throw new Error('Failed to fetch feed generator data.');
  }
};

export const getUserFeeds = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userDid = req.query.userDid as string;

  if (!userDid) {
    res.json({ feeds: [], defaultFeed: DEFAULT_FEED });
    return;
  }

  try {
    // 1. Get feed permissions from database
    const [modFeeds, adminFeeds] = await Promise.all([
      getFeedsByRole(userDid, 'mod'),
      getFeedsByRole(userDid, 'admin'),
    ]);

    // 2. Get latest feed data from Bluesky
    const blueskyFeedsResponse = await getActorFeeds(userDid);
    const blueskyFeeds = blueskyFeedsResponse?.feeds || [];

    // 3. Create a map of feed URIs to their latest Bluesky data
    const blueskyFeedsMap = new Map(
      blueskyFeeds.map((feed) => [feed.uri, feed])
    );

    // 4. Merge database permissions with latest Bluesky feed data
    const modFeedsList = modFeeds.map((feed) => {
      const blueskyFeed = blueskyFeedsMap.get(feed.uri);
      return {
        uri: feed.uri,
        displayName: blueskyFeed?.displayName || feed.feed_name,
        description: blueskyFeed?.description,
        did: blueskyFeed?.did,
        type: 'mod' as UserRole,
      };
    });

    const adminFeedsList = adminFeeds.map((feed) => {
      const blueskyFeed = blueskyFeedsMap.get(feed.uri);
      return {
        uri: feed.uri,
        displayName: blueskyFeed?.displayName || feed.feed_name,
        description: blueskyFeed?.description,
        did: blueskyFeed?.did,
        type: 'admin' as UserRole,
      };
    });

    // 5. Update database with latest feed data
    await Promise.all([
      ...modFeeds.map(async (feed) => {
        const blueskyFeed = blueskyFeedsMap.get(feed.uri);
        if (blueskyFeed && blueskyFeed.displayName !== feed.feed_name) {
          await query(
            'UPDATE feed_permissions SET feed_name = $1 WHERE uri = $2 AND did = $3',
            [blueskyFeed.displayName, feed.uri, userDid]
          );
        }
      }),
      ...adminFeeds.map(async (feed) => {
        const blueskyFeed = blueskyFeedsMap.get(feed.uri);
        if (blueskyFeed && blueskyFeed.displayName !== feed.feed_name) {
          await query(
            'UPDATE feed_permissions SET feed_name = $1 WHERE uri = $2 AND did = $3',
            [blueskyFeed.displayName, feed.uri, userDid]
          );
        }
      }),
    ]);

    const allFeeds = [...adminFeedsList, ...modFeedsList];
    const uniqueFeeds = Array.from(
      new Map(allFeeds.map((feed) => [feed.uri, feed])).values()
    );

    res.json({
      feeds: uniqueFeeds,
      defaultFeed: DEFAULT_FEED,
    });
  } catch (error) {
    console.error('Error fetching user feeds:', error);
    res.status(500).json({
      error: 'Failed to fetch user feeds',
      feeds: [],
      defaultFeed: DEFAULT_FEED,
    });
  }
};
