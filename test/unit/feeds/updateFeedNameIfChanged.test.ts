import {
  mockDb,
  mockDbWhere,
  mockDbUpdate,
  setupDbMocks,
} from '../../mocks/db.mocks';

import { mockCreateFeedGenLog, setupLogsMocks } from '../../mocks/logs.mocks';

// Set up mocks before importing the function
setupDbMocks();
setupLogsMocks();

// Import after setting up mocks
import { updateFeedNameIfChanged } from '../../../src/repos/feed';

describe('updateFeedNameIfChanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the mock chain properly
    mockDbWhere.mockReturnValue({ update: mockDbUpdate });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should update feed name when it has changed', async () => {
    const did = 'did:example:123';
    const uri = 'feed:1';
    const localName = 'Old Feed Name';
    const newName = 'New Feed Name';

    // Set up mock return value
    mockDbUpdate.mockResolvedValue([1]);

    // Call the function
    await updateFeedNameIfChanged(did, uri, localName, newName);

    // Verify database interactions
    expect(mockDb).toHaveBeenCalledWith('feed_permissions');
    expect(mockDbWhere).toHaveBeenCalledWith({ did, uri });
    expect(mockDbUpdate).toHaveBeenCalledWith({ feed_name: newName });

    // Verify log was created
    expect(mockCreateFeedGenLog).toHaveBeenCalledWith({
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

    // Verify no database interactions
    expect(mockDb).not.toHaveBeenCalled();

    // Verify no log was created
    expect(mockCreateFeedGenLog).not.toHaveBeenCalled();
  });
});
