import { getModerationServicesConfig } from '../../../src/repos/moderation';
import { db } from '../../../src/config/db';
import NodeCache from 'node-cache';
import { sampleModerationServices } from '../../fixtures/permissions.fixtures';
import {
  createMockCache,
  createMockDb,
  createMockDbReject,
} from '../../mocks/permissions.mocks';

// Mock NodeCache using our helper.
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
});

// Mock the database module using the named export 'db'.
jest.mock('../../../src/config/db', () => ({
  __esModule: true,
  db: jest.fn(),
}));

describe('getModerationServicesConfig', () => {
  let cacheInstance: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    jest.resetModules();
    const NodeCacheMock = NodeCache as unknown as jest.MockedClass<
      typeof NodeCache
    >;
    cacheInstance = NodeCacheMock.mock.results[0].value;
  });

  it('should return cached value if available', async () => {
    cacheInstance.get.mockReturnValue(sampleModerationServices);

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    expect(db).not.toHaveBeenCalled();
  });

  it('should query the database and cache the result if not in cache', async () => {
    cacheInstance.get.mockReturnValue(undefined);
    (db as unknown as jest.Mock).mockImplementation(
      createMockDb(sampleModerationServices)
    );

    const result = await getModerationServicesConfig();

    expect(result).toEqual(sampleModerationServices);
    expect(cacheInstance.set).toHaveBeenCalledWith(
      'moderationServices',
      sampleModerationServices
    );
    expect(db).toHaveBeenCalledWith('moderation_services');
  });

  it('should throw an error if the database query fails', async () => {
    cacheInstance.get.mockReturnValue(undefined);
    (db as unknown as jest.Mock).mockImplementation(
      createMockDbReject(new Error('DB Error'))
    );
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(getModerationServicesConfig()).rejects.toThrow('DB Error');

    consoleSpy.mockRestore();
  });
});
