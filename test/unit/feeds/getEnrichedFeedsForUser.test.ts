// test/unit/feeds/getEnrichedFeedsForUser.test.ts
import { DEFAULT_FEED } from '../../../src/lib/constants';

// First, set up mocks for all the dependencies
jest.mock('../../../src/repos/logs', () => ({
  createFeedGenLog: jest.fn(),
}));

// Import these separately so we can mock them
import * as atprotoRepo from '../../../src/repos/atproto';
import * as feedRepo from '../../../src/repos/feed';

// Mock the dependencies
jest.spyOn(feedRepo, 'getFeedsByRole').mockImplementation((did, role) => {
  if (role === 'admin') {
    return Promise.resolve([
      { uri: 'feed:1', feed_name: 'Admin Feed 1', admin_did: 'admin1' },
      { uri: 'feed:2', feed_name: 'Admin Feed 2', admin_did: 'admin2' },
    ]);
  }
  if (role === 'mod') {
    return Promise.resolve([
      { uri: 'feed:3', feed_name: 'Mod Feed 1', admin_did: 'admin3' },
    ]);
  }
  return Promise.resolve([]);
});

jest.spyOn(atprotoRepo, 'getActorFeeds').mockResolvedValue({
  feeds: [
    {
      uri: 'feed:1',
      displayName: 'BlueSky Admin Feed 1',
      description: 'Admin description 1',
      did: 'did:feed:1',
      creator: { did: 'admin1', handle: 'admin1' },
      cid: '',
      indexedAt: '',
    },
    {
      uri: 'feed:2',
      displayName: 'Admin Feed 2',
      description: 'Admin description 2',
      did: 'did:feed:2',
      creator: { did: 'admin2', handle: 'admin2' },
      cid: '',
      indexedAt: '',
    },
  ],
});

jest.spyOn(atprotoRepo, 'getFeedGenerator').mockResolvedValue({
  uri: 'feed:3',
  displayName: 'BlueSky Mod Feed 1',
  description: 'Mod description',
  did: 'did:feed:3',
  creator: { did: 'admin3', handle: 'admin3' },
  cid: '',
  indexedAt: '',
});

// Now import the function we want to test
import { getEnrichedFeedsForUser } from '../../../src/repos/feed';

describe('getEnrichedFeedsForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  it('should return enriched feeds combining admin and mod feeds', async () => {
    const userDid = 'did:example:123';

    const result = await getEnrichedFeedsForUser(userDid);

    // // Verify expected calls
    expect(feedRepo.getFeedsByRole).toHaveBeenCalledWith(userDid, 'mod');
    expect(feedRepo.getFeedsByRole).toHaveBeenCalledWith(userDid, 'admin');
    expect(atprotoRepo.getActorFeeds).toHaveBeenCalledWith(userDid);
    expect(atprotoRepo.getFeedGenerator).toHaveBeenCalledWith('feed:3');

    // Verify result structure
    expect(result).toHaveProperty('feeds');
    expect(result).toHaveProperty('defaultFeed', DEFAULT_FEED);

    // Verify admin feeds
    const adminFeed1 = result.feeds.find((f) => f.uri === 'feed:1');
    expect(adminFeed1).toEqual({
      uri: 'feed:1',
      displayName: 'BlueSky Admin Feed 1',
      description: 'Admin description 1',
      did: 'did:feed:1',
      type: 'admin',
    });

    const adminFeed2 = result.feeds.find((f) => f.uri === 'feed:2');
    expect(adminFeed2).toEqual({
      uri: 'feed:2',
      displayName: 'Admin Feed 2',
      description: 'Admin description 2',
      did: 'did:feed:2',
      type: 'admin',
    });

    // Verify mod feed
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: 'BlueSky Mod Feed 1',
      description: 'Mod description',
      did: 'did:feed:3',
      type: 'mod',
    });
  });

  it('should handle missing BlueSky data by demoting admin feeds', async () => {
    const userDid = 'did:example:123';

    // Override getActorFeeds for this test only
    (atprotoRepo.getActorFeeds as jest.Mock).mockResolvedValueOnce({
      feeds: [],
    });

    const result = await getEnrichedFeedsForUser(userDid);

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
    const userDid = 'did:example:123';

    // Override getFeedGenerator for this test only
    (atprotoRepo.getFeedGenerator as jest.Mock).mockResolvedValueOnce(null);

    const result = await getEnrichedFeedsForUser(userDid);

    // Mod feed should fall back to local data
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: 'Mod Feed 1', // From mockFeedsByRole
      description: undefined,
      did: undefined,
      type: 'mod',
    });
  });

  it('should handle errors from getActorFeeds', async () => {
    const userDid = 'did:example:123';

    // Override getActorFeeds for this test only
    (atprotoRepo.getActorFeeds as jest.Mock).mockResolvedValueOnce(null);

    const result = await getEnrichedFeedsForUser(userDid);

    // Verify admin feeds are demoted
    const adminFeeds = result.feeds.filter((f) => f.type === 'admin');
    expect(adminFeeds.length).toBe(0);

    // All original admin feeds should be demoted to user
    const userFeeds = result.feeds.filter((f) => f.type === 'user');
    expect(userFeeds.length).toBe(2);
  });

  it('should handle errors from getFeedGenerator', async () => {
    const userDid = 'did:example:123';

    // Override getFeedGenerator for this test only
    (atprotoRepo.getFeedGenerator as jest.Mock).mockRejectedValueOnce(
      new Error('API error')
    );

    const result = await getEnrichedFeedsForUser(userDid);

    // Mod feed should still be present with local data
    const modFeed = result.feeds.find((f) => f.uri === 'feed:3');
    expect(modFeed).toEqual({
      uri: 'feed:3',
      displayName: 'Mod Feed 1',
      description: undefined,
      did: undefined,
      type: 'mod',
    });
  });
});
