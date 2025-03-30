export const mockAtprotoAgent = {
  getProfile: jest.fn().mockResolvedValue({
    success: true,
    data: {
      did: 'did:example:123',
      handle: 'testHandle',
      displayName: 'Test User',
    },
  }),
};

export const mockFeedGenerator = {
  uri: 'feed:1',
  displayName: 'Test Feed',
  description: 'Test Description',
  did: 'did:feed:1',
};

export const mockActorFeeds = {
  feeds: [
    {
      uri: 'feed:1',
      displayName: 'BlueSky Admin Feed 1',
      description: 'Admin description 1',
      did: 'did:feed:1',
      creator: { did: 'admin1' },
    },
    {
      uri: 'feed:2',
      displayName: 'Admin Feed 2',
      description: 'Admin description 2',
      did: 'did:feed:2',
      creator: { did: 'admin2' },
    },
  ],
};

// Mock the getFeedsByRole function
export const mockFeedsByRole = {
  admin: [
    { uri: 'feed:1', feed_name: 'Admin Feed 1', admin_did: 'admin1' },
    { uri: 'feed:2', feed_name: 'Admin Feed 2', admin_did: 'admin2' },
  ],
  mod: [{ uri: 'feed:3', feed_name: 'Mod Feed 1', admin_did: 'admin3' }],
  user: [],
};

export const mockGetFeedsByRole = jest.fn().mockImplementation((did, role) => {
  if (role === 'admin') {
    return Promise.resolve(mockFeedsByRole.admin);
  }
  if (role === 'mod') {
    return Promise.resolve(mockFeedsByRole.mod);
  }
  return Promise.resolve(mockFeedsByRole.user);
});

export const mockGetActorFeeds = jest.fn().mockResolvedValue(mockActorFeeds);

export const mockGetFeedGenerator = jest
  .fn()
  .mockResolvedValue(mockFeedGenerator);

// Helper to setup all mocks at once
export const setupAtprotoMocks = () => {
  jest
    .spyOn(require('../../src/repos/feed'), 'getFeedsByRole')
    .mockImplementation(mockGetFeedsByRole);

  jest
    .spyOn(require('../../src/repos/atproto'), 'getActorFeeds')
    .mockImplementation(mockGetActorFeeds);

  jest
    .spyOn(require('../../src/repos/atproto'), 'getFeedGenerator')
    .mockImplementation(mockGetFeedGenerator);
};
