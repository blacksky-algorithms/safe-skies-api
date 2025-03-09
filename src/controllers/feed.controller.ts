import { Request, Response } from 'express';
import { DEFAULT_FEED } from '../lib/constants';
import { getEnrichedFeedsForUser } from '../repos/feed';

/**
 * Handles a GET request to fetch a user's local feed permissions,
 * merges them with the latest data from Bluesky,
 * and optionally updates local feed data if there's a mismatch.
 */
export const getUserFeeds = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userDid = req.query.userDid;
  if (!userDid) {
    res.json({ feeds: [], defaultFeed: DEFAULT_FEED });
    return;
  }

  try {
    const data = await getEnrichedFeedsForUser(userDid.toString());
    res.json(data);
  } catch (error) {
    console.error('Error fetching user feeds:', error);
    res.status(500).json({
      error: 'Failed to fetch user feeds',
      feeds: [],
      defaultFeed: DEFAULT_FEED,
    });
  }
};
