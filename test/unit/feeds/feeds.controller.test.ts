// test/unit/controllers/user-feeds.controller.test.ts
import { Request, Response } from 'express';
import { DEFAULT_FEED } from '../../../src/lib/constants';
import * as feedRepo from '../../../src/repos/feed';
import { getUserFeeds } from '../../../src/controllers/feed.controller';

// Mock the getEnrichedFeedsForUser function
jest.mock('../../../src/repos/feed', () => ({
  getEnrichedFeedsForUser: jest.fn(),
}));

describe('getUserFeeds controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Setup mock request and response
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      query: {},
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return empty feeds array when userDid is not provided', async () => {
    await getUserFeeds(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      feeds: [],
      defaultFeed: DEFAULT_FEED,
    });

    // Verify getEnrichedFeedsForUser wasn't called
    expect(feedRepo.getEnrichedFeedsForUser).not.toHaveBeenCalled();
  });

  it('should return enriched feeds when userDid is provided', async () => {
    // Setup the mock request with userDid
    mockRequest.query = { userDid: 'did:example:123' };

    // Mock the return value of getEnrichedFeedsForUser
    const mockFeeds = {
      feeds: [
        {
          uri: 'feed:1',
          displayName: 'Test Feed',
          type: 'admin',
        },
      ],
      defaultFeed: DEFAULT_FEED,
    };

    (feedRepo.getEnrichedFeedsForUser as jest.Mock).mockResolvedValue(
      mockFeeds
    );

    // Call the controller
    await getUserFeeds(mockRequest as Request, mockResponse as Response);

    // Verify getEnrichedFeedsForUser was called with the right parameter
    expect(feedRepo.getEnrichedFeedsForUser).toHaveBeenCalledWith(
      'did:example:123'
    );

    // Verify response
    expect(mockJson).toHaveBeenCalledWith(mockFeeds);
  });

  it('should handle errors and return 500 status', async () => {
    // Setup the mock request with userDid
    mockRequest.query = { userDid: 'did:example:123' };

    // Mock an error
    const mockError = new Error('Test error');
    (feedRepo.getEnrichedFeedsForUser as jest.Mock).mockRejectedValue(
      mockError
    );

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Call the controller
    await getUserFeeds(mockRequest as Request, mockResponse as Response);

    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching user feeds:',
      mockError
    );

    // Verify response status and body
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Failed to fetch user feeds',
      feeds: [],
      defaultFeed: DEFAULT_FEED,
    });

    // Restore console.error
    consoleSpy.mockRestore();
  });
});
