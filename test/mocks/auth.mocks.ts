export const mockBlueskyOAuthClient = {
  authorize: jest.fn<Promise<URL>, [string]>(),
  callback: jest.fn<Promise<{ session: { sub: string } }>, [unknown]>(),
};

export const mockAtprotoAgent = {
  getProfile: jest.fn<
    Promise<{
      success: boolean;
      data: { did: string; handle: string; displayName: string };
    }>,
    [unknown]
  >(),
};

export const mockGetActorFeeds = jest.fn<
  Promise<{
    feeds: { uri: string; displayName: string; creator: { did: string } }[];
  }>,
  [unknown]
>();

export const mockGetProfile = jest.fn<
  Promise<{ did: string; handle: string; displayName: string } | null>,
  [string]
>();
export const mockSaveProfile = jest.fn<Promise<boolean>, [unknown, unknown]>();

export const mockJwtSign = jest.fn<
  string,
  [object, string, { expiresIn: string }]
>();
