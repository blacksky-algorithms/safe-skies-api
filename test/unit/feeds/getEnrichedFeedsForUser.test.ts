import { DEFAULT_FEED } from '../../../src/lib/constants';
import {
  mockActorFeeds,
  mockFeedGenerator,
  mockGetActorFeeds,
  mockGetFeedGenerator,
  mockGetFeedsByRole,
  setupAtprotoMocks,
} from '../../mocks/atproto.mocks';

import { setupLogsMocks } from '../../mocks/logs.mocks';

import { getEnrichedFeedsForUser } from '../../../src/repos/feed';
import { mockUser } from '../../fixtures/user.fixtures';
import { mockFeedsByRole } from '../../fixtures/feed.fixtures';

describe('getEnrichedFeedsForUser', () => {
  beforeEach(() => {
    setupLogsMocks();
    setupAtprotoMocks();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return enriched feeds combining admin and mod feeds', async () => {
    const result = await getEnrichedFeedsForUser(mockUser.did);

    // Verify expected calls
    expect(mockGetFeedsByRole).toHaveBeenCalledWith(mockUser.did, 'mod');
    expect(mockGetFeedsByRole).toHaveBeenCalledWith(mockUser.did, 'admin');
    expect(mockGetActorFeeds).toHaveBeenCalledWith(mockUser.did);
    expect(mockGetFeedGenerator).toHaveBeenCalledWith('feed:3');

    // Verify result structure
    expect(result).toHaveProperty('feeds');
    expect(result).toHaveProperty('defaultFeed', DEFAULT_FEED);

    // Verify admin feeds
    const adminFeed1 = result.feeds.find((f) => f.uri === 'feed:1');
    expect(adminFeed1).toEqual({
      uri: 'feed:1',
      displayName: mockActorFeeds.feeds[0].displayName,
      description: mockActorFeeds.feeds[0].description,
      did: mockActorFeeds.feeds[0].did,
      type: 'admin',
    });

    const adminFeed2 = result.feeds.find((f) => f.uri === 'feed:2');
    expect(adminFeed2).toEqual({
      uri: mockActorFeeds.feeds[1].uri,
      displayName: mockActorFeeds.feeds[1].displayName,
      description: mockActorFeeds.feeds[1].description,
      did: mockActorFeeds.feeds[1].did,
      type: 'admin',
    });

    // Verify mod feed
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: mockFeedGenerator.displayName,
      description: mockFeedGenerator.description,
      did: mockFeedGenerator.did,
      type: 'mod',
    });
  });

  it('should handle missing BlueSky data by demoting admin feeds', async () => {
    // Override getActorFeeds for this test only
    mockGetActorFeeds.mockResolvedValueOnce({
      feeds: [],
    });

    const result = await getEnrichedFeedsForUser(mockUser.did);

    // All admin feeds should be demoted to 'user'
    const adminFeed1 = result.feeds.find((f) => f.uri === 'feed:1');
    expect(adminFeed1?.type).toBe('user');

    const adminFeed2 = result.feeds.find((f) => f.uri === 'feed:2');
    expect(adminFeed2?.type).toBe('user');

    // Mod feed should still be type 'mod'
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed?.type).toBe('mod');
  });

  it('should handle missing feed generator data', async () => {
    // Override getFeedGenerator for this test only
    mockGetFeedGenerator.mockResolvedValueOnce(null);

    const result = await getEnrichedFeedsForUser(mockUser.did);

    // Mod feed should fall back to local data
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: mockFeedsByRole.mod[0].feed_name,
      description: undefined,
      did: undefined,
      type: 'mod',
    });
  });

  it('should handle errors from getActorFeeds', async () => {
    // Override getActorFeeds for this test only
    mockGetActorFeeds.mockResolvedValueOnce(null);

    const result = await getEnrichedFeedsForUser(mockUser.did);

    // Verify admin feeds are demoted
    const adminFeeds = result.feeds.filter((f) => f.type === 'admin');
    expect(adminFeeds.length).toBe(0);

    // All original admin feeds should be demoted to user
    const userFeeds = result.feeds.filter((f) => f.type === 'user');
    expect(userFeeds.length).toBe(2);
  });

  it('should handle errors from getFeedGenerator', async () => {
    // Override getFeedGenerator for this test only
    mockGetFeedGenerator.mockRejectedValueOnce(new Error('API error'));

    const result = await getEnrichedFeedsForUser(mockUser.did);

    // Mod feed should still be present with local data
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: mockFeedsByRole.mod[0].feed_name,
      description: undefined,
      did: undefined,
      type: 'mod',
    });
  });
});
