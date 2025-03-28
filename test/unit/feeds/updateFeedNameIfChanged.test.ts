// test/unit/feeds/updateFeedNameIfChanged.test.ts
import { updateFeedNameIfChanged } from '../../../src/repos/feed';
import { createFeedGenLog } from '../../../src/repos/logs';

// Create mock functions outside the mock setup
const mockUpdate = jest.fn().mockResolvedValue([1]);
const mockWhere = jest.fn().mockReturnValue({ update: mockUpdate });
const mockDb = jest.fn().mockImplementation(() => ({ where: mockWhere }));

// Mock the dependencies
jest.mock('../../../src/config/db', () => ({
  db: (table: string) => {
    mockDb(table);
    return { where: mockWhere };
  },
}));

jest.mock('../../../src/repos/logs', () => ({
  createFeedGenLog: jest.fn(),
}));

describe('updateFeedNameIfChanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should update feed name when it has changed', async () => {
    const did = 'did:example:123';
    const uri = 'feed:1';
    const localName = 'Old Feed Name';
    const newName = 'New Feed Name';

    // Call the function
    await updateFeedNameIfChanged(did, uri, localName, newName);

    // Verify database interactions
    expect(mockDb).toHaveBeenCalledWith('feed_permissions');
    expect(mockWhere).toHaveBeenCalledWith({ did, uri });
    expect(mockUpdate).toHaveBeenCalledWith({ feed_name: newName });

    // Verify log was created
    expect(createFeedGenLog).toHaveBeenCalledWith({
      uri,
      previous: localName,
      current: newName,
      metadata: { updatedBy: 'BlueSky' },
    });
  });

  it('should not update or log when feed name has not changed', async () => {
    const did = 'did:example:123';
    const uri = 'feed:1';
    const localName = 'Same Feed Name';
    const newName = 'Same Feed Name';

    await updateFeedNameIfChanged(did, uri, localName, newName);

    expect(mockDb).not.toHaveBeenCalled();

    expect(createFeedGenLog).not.toHaveBeenCalled();
  });
});
