import { DEFAULT_FEED } from '../../../src/lib/constants';
import {
  mockGetEnrichedFeedsForUser,
  mockFeedData,
  setupFeedMocks,
} from '../../mocks/feed.mocks';

// Set up mocks before importing the function
setupFeedMocks();

// Import after setting up mocks
import { getUserFeeds } from '../../../src/controllers/feed.controller';
import {
  createMockRequest,
  createMockResponse,
  mockJson,
  mockStatus,
} from '../../mocks/express.mock';

describe('getUserFeeds controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return empty feeds array when userDid is not provided', async () => {
    // Create request and response
    const req = createMockRequest();
    const res = createMockResponse();

    // Call the controller
    await getUserFeeds(req, res);

    // Verify response
    expect(mockJson).toHaveBeenCalledWith({
      feeds: [],
      defaultFeed: DEFAULT_FEED,
    });

    // Verify getEnrichedFeedsForUser wasn't called
    expect(mockGetEnrichedFeedsForUser).not.toHaveBeenCalled();
  });

  it('should return enriched feeds when userDid is provided', async () => {
    // Create request with userDid
    const req = createMockRequest({ query: { userDid: 'did:example:123' } });
    const res = createMockResponse();

    // Mock the return value for this test
    mockGetEnrichedFeedsForUser.mockResolvedValueOnce(mockFeedData);

    // Call the controller
    await getUserFeeds(req, res);

    // Verify getEnrichedFeedsForUser was called with the right parameter
    expect(mockGetEnrichedFeedsForUser).toHaveBeenCalledWith('did:example:123');

    // Verify response
    expect(mockJson).toHaveBeenCalledWith(mockFeedData);
  });

  it('should handle errors and return 500 status', async () => {
    // Create request with userDid
    const req = createMockRequest({ query: { userDid: 'did:example:123' } });
    const res = createMockResponse();

    // Mock an error
    const mockError = new Error('Test error');
    mockGetEnrichedFeedsForUser.mockRejectedValueOnce(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Call the controller
    await getUserFeeds(req, res);

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
