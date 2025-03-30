import { mockDb, setupDbMocks } from '../../mocks/db.mocks';
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached value if available', async () => {
    // Setup cache to return a value
    mockCacheGet.mockReturnValue(sampleModerationServices);

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    expect(mockDb).not.toHaveBeenCalled();
  });

  it('should query the database and cache the result if not in cache', async () => {
    // Setup cache to not return a value
    mockCacheGet.mockReturnValue(null);

    // Setup database to return sample data
    mockDb.mockReturnValue({
      select: jest.fn().mockResolvedValue(sampleModerationServices),
    });

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    expect(mockDb).toHaveBeenCalledWith('moderation_services');
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
    mockDb.mockReturnValue({
      select: jest.fn().mockRejectedValue(testError),
    });

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(getModerationServicesConfig()).rejects.toThrow('DB Error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
