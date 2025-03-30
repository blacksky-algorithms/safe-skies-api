export const mockBlueskyOAuthClient = {
  authorize: jest.fn().mockResolvedValue(new URL('http://example.com')),
  callback: jest
    .fn()
    .mockResolvedValue({ session: { sub: 'did:example:123' } }),
};

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

  jest.mock('../../src/repos/atproto', () => ({
    AtprotoAgent: mockAtprotoAgent,
    getActorFeeds: mockGetActorFeeds,
  }));

  jest.mock('../../src/repos/profile', () => ({
    getProfile: mockGetProfile,
    saveProfile: mockSaveProfile,
  }));

  jest.mock('jsonwebtoken', () => ({
    sign: mockJwtSign,
  }));
};
