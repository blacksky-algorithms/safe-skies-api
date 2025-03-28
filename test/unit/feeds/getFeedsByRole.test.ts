// test/unit/feeds/getFeedsByRole.test.ts
import { getFeedsByRole } from '../../../src/repos/feed';
import { db } from '../../../src/config/db';

// Mock the DB module.
jest.mock('../../../src/config/db', () => ({
  __esModule: true,
  db: jest.fn(),
}));

describe('getFeedsByRole', () => {
  let mockedDb: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb = db as unknown as jest.Mock;
  });

  it('should return an empty array if did is not provided', async () => {
    const result = await getFeedsByRole(undefined, 'admin');
    expect(result).toEqual([]);
  });

  it('should return an empty array if role is "user"', async () => {
    const result = await getFeedsByRole('did:example:123', 'user');
    expect(result).toEqual([]);
  });

  it('should return feed permissions for a valid did and role', async () => {
    const expectedRows = [
      { uri: 'feed1', feed_name: 'Feed One', admin_did: 'did:example:123' },
    ];
    const fakeQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(expectedRows),
    };
    mockedDb.mockReturnValue(fakeQueryBuilder);

    const result = await getFeedsByRole('did:example:123', 'admin');
    expect(result).toEqual(expectedRows);
  });

  it('should return an empty array when a database error occurs', async () => {
    const fakeQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error('DB error')),
    };
    mockedDb.mockReturnValue(fakeQueryBuilder);

    const result = await getFeedsByRole('did:example:123', 'admin');
    expect(result).toEqual([]);
  });
});
