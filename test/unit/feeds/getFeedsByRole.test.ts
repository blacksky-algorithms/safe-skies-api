import {
  mockDb,
  mockDbSelect,
  mockDbWhere,
  setupSuccessfulQuery,
  setupFailedQuery,
  setupDbMocks,
} from '../../mocks/db.mocks';

setupDbMocks();

// Import after setting up mocks
import { getFeedsByRole } from '../../../src/repos/feed';

describe('getFeedsByRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return an empty array if did is not provided', async () => {
    const result = await getFeedsByRole(undefined, 'admin');
    expect(result).toEqual([]);
    expect(mockDb).not.toHaveBeenCalled();
  });

  it('should return an empty array if role is "user"', async () => {
    const result = await getFeedsByRole('did:example:123', 'user');
    expect(result).toEqual([]);
    expect(mockDb).not.toHaveBeenCalled();
  });

  it('should return feed permissions for a valid did and role', async () => {
    const expectedRows = [
      { uri: 'feed1', feed_name: 'Feed One', admin_did: 'did:example:123' },
    ];
    setupSuccessfulQuery(expectedRows);

    const result = await getFeedsByRole('did:example:123', 'admin');

    expect(mockDb).toHaveBeenCalledWith('feed_permissions');
    expect(mockDbSelect).toHaveBeenCalledWith('uri', 'feed_name', 'admin_did');
    expect(mockDbWhere).toHaveBeenCalledWith({
      did: 'did:example:123',
      role: 'admin',
    });
    expect(result).toEqual(expectedRows);
  });

  it('should return an empty array when a database error occurs', async () => {
    setupFailedQuery(new Error('DB error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await getFeedsByRole('did:example:123', 'admin');

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in getFeedsByRole:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
