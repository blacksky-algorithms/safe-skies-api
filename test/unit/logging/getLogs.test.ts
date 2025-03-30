import { tracker, setupDbMocks, cleanupDbMocks } from '../../mocks/db.mocks';
import {
  mockCacheGet,
  mockCacheSet,
  setupNodeCacheMocks,
} from '../../mocks/cache.mocks';
import { sampleModerationServices } from '../../fixtures/permissions.fixtures';

// Setup mocks before importing
setupNodeCacheMocks();
setupDbMocks();

// Import after setting up mocks
import { getModerationServicesConfig } from '../../../src/repos/moderation';

describe('getModerationServicesConfig', () => {
  // Keep track of query count with our own counter
  let queryCount = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    queryCount = 0;
    tracker.install();
  });

  afterEach(() => {
    tracker.uninstall();
  });

  afterAll(() => {
    cleanupDbMocks();
  });

  it('should return cached value if available', async () => {
    // Setup cache to return a value
    mockCacheGet.mockReturnValue(sampleModerationServices);

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    // We expect zero queries when cache is hit
    expect(queryCount).toBe(0);
  });

  it('should query the database and cache the result if not in cache', async () => {
    // Setup cache to not return a value
    mockCacheGet.mockReturnValue(null);

    // Setup database to return sample data
    tracker.on('query', function (query) {
      queryCount++;
      expect(query.method).toBe('select');
      query.response(sampleModerationServices);
    });

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    expect(queryCount).toBe(1);
    expect(mockCacheSet).toHaveBeenCalledWith(
      'moderationServices',
      sampleModerationServices
    );
  });

  it('should throw an error if the database query fails', async () => {
    // Setup cache to not return a value
    mockCacheGet.mockReturnValue(null);

    // Setup database to throw an error
    const testError = new Error('DB Error');
    tracker.on('query', function (query) {
      queryCount++;
      query.reject(testError);
    });

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(getModerationServicesConfig()).rejects.toThrow('DB Error');
    expect(consoleSpy).toHaveBeenCalled();
    expect(queryCount).toBe(1);

    consoleSpy.mockRestore();
  });
});
