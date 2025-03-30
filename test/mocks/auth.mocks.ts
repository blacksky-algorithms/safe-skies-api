export const mockBlueskyOAuthClient = {
  authorize: jest.fn().mockResolvedValue(new URL('http://example.com')),
  callback: jest.fn(async (params: URLSearchParams) => {
    const code = params.get('code');
    const state = params.get('state');
    if (code === 'validCode' && state === 'validState') {
      return { session: { sub: 'did:example:123' } };
    }
    throw new Error('Test error');
  }),
};

export const mockGetActorFeeds = jest.fn().mockResolvedValue({
  feeds: [
    {
      uri: 'feed:1',
      displayName: 'Feed One',
      creator: { did: 'admin1' },
    },
  ],
});

export const mockGetProfile = jest.fn().mockResolvedValue({
  did: 'did:example:123',
  handle: 'testHandle',
  displayName: 'Test User',
});

export const mockSaveProfile = jest.fn().mockResolvedValue(true);

export const mockJwtSign = jest.fn().mockReturnValue('fake.jwt.token');

// Setup helper for all auth-related mocks
export const setupAuthMocks = (): void => {
  jest.mock('../../src/repos/oauth-client', () => ({
    BlueskyOAuthClient: mockBlueskyOAuthClient,
  }));

  jest.mock('../../src/repos/profile', () => ({
    getProfile: mockGetProfile,
    saveProfile: mockSaveProfile,
  }));

  jest.mock('jsonwebtoken', () => ({
    sign: mockJwtSign,
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
    // getFeedGenerator: jest.fn(async (feed: string) => {
    //   // Here you define responses based on the feed URI.
    //   if (feed === 'feed:1') {
    //     return {
    //       displayName: 'BlueSky Feed One',
    //       description: 'Updated Desc 1',
    //       did: 'did:example:456',
    //     };
    //   } else if (feed === 'feed:2') {
    //     return {
    //       displayName: 'BlueSky Feed Two',
    //       description: 'Updated Desc 2',
    //       did: 'did:example:456',
    //     };
    //   }
    //   // For any other feed, simulate a not found scenario.
    //   throw new Error('Feed not found');
    // }),
  }));
};
