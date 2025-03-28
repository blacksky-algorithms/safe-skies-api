// Stub external modules for integration tests.
jest.mock('../../src/repos/oauth-client', () => ({
  BlueskyOAuthClient: {
    // For authorize, always return a fixed URL.

    authorize: jest.fn(async () => {
      return new URL('http://example.com');
    }),
    // For callback, expect URLSearchParams; return a valid session for valid params; otherwise, throw error.
    callback: jest.fn(async (params: URLSearchParams) => {
      const code = params.get('code');
      const state = params.get('state');
      if (code === 'validCode' && state === 'validState') {
        return { session: { sub: 'did:example:123' } };
      }
      throw new Error('Test error');
    }),
  },
}));

jest.mock('../../src/repos/atproto', () => ({
  AtprotoAgent: {
    // Return a fixed profile based on the actor.
    getProfile: jest.fn(async (params: { actor: string }) => {
      return {
        success: true,
        data: {
          did: params.actor,
          handle: 'testHandle',
          displayName: 'Test User',
        },
      };
    }),
  },
  // Return a fixed set of feeds.
  getActorFeeds: jest.fn(async () => ({
    feeds: [
      { uri: 'feed:1', displayName: 'Feed One', creator: { did: 'admin1' } },
    ],
  })),
  getFeedGenerator: jest.fn(async (feed: string) => {
    // Here you define responses based on the feed URI.
    if (feed === 'feed:1') {
      return {
        displayName: 'BlueSky Feed One',
        description: 'Updated Desc 1',
        did: 'did:example:456',
      };
    } else if (feed === 'feed:2') {
      return {
        displayName: 'BlueSky Feed Two',
        description: 'Updated Desc 2',
        did: 'did:example:456',
      };
    }
    // For any other feed, simulate a not found scenario.
    throw new Error('Feed not found');
  }),
}));

jest.mock('../../src/repos/profile', () => ({
  getProfile: jest.fn(async () => {
    // If GET_PROFILE_FAIL is set, simulate failure by returning null.
    return process.env.GET_PROFILE_FAIL === 'true'
      ? null
      : {
          did: 'did:example:123',
          handle: 'testHandle',
          displayName: 'Test User',
        };
  }),
  saveProfile: jest.fn(async () => {
    // If SAVE_PROFILE_FAIL is set, simulate failure.
    return process.env.SAVE_PROFILE_FAIL === 'true' ? false : true;
  }),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'fake.jwt.token'),
}));

// Optionally, suppress known warnings.
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
