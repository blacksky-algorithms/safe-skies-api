// test/mocks/feed.mocks.ts
import { DEFAULT_FEED } from '../../src/lib/constants';

// Mock data
export const mockFeedData = {
  feeds: [
    {
      uri: 'feed:1',
      displayName: 'Test Feed',
      type: 'admin',
    },
  ],
  defaultFeed: DEFAULT_FEED,
};

// Mock functions
export const mockGetEnrichedFeedsForUser = jest
  .fn()
  .mockResolvedValue(mockFeedData);

// Setup function
export const setupFeedMocks = (): void => {
  jest.mock('../../src/repos/feed', () => ({
    getEnrichedFeedsForUser: mockGetEnrichedFeedsForUser,
  }));
};
