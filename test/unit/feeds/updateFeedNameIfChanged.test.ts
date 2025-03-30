import { tracker, setupDbMocks, cleanupDbMocks } from '../../mocks/db.mocks';
import { mockCreateFeedGenLog, setupLogsMocks } from '../../mocks/logs.mocks';

// Set up mocks before importing the function
setupDbMocks();
setupLogsMocks();

// Import after setting up mocks
import { updateFeedNameIfChanged } from '../../../src/repos/feed';

describe('updateFeedNameIfChanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tracker.install();
  });

  afterEach(() => {
    tracker.uninstall();
  });

  afterAll(() => {
    cleanupDbMocks();
    jest.restoreAllMocks();
  });

  it('should update feed name when it has changed', async () => {
    const did = 'did:example:123';
    const uri = 'feed:1';
    const localName = 'Old Feed Name';
    const newName = 'New Feed Name';

    // Set up mock response for database update
    tracker.on('query', function (query) {
      expect(query.method).toBe('update');
      // Check if the query is operating on the right table with the right conditions
      expect(query.sql).toMatch(/update.*feed_permissions/i);
      expect(query.bindings).toContain(did);
      expect(query.bindings).toContain(uri);
      expect(query.bindings).toContain(newName);

      // Respond with one row affected
      query.response([1]);
    });

    // Call the function
    await updateFeedNameIfChanged(did, uri, localName, newName);

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

    // Set up a spy to count query events
    let queryCount = 0;
    tracker.on('query', function () {
      queryCount++;
    });

    await updateFeedNameIfChanged(did, uri, localName, newName);

    // Verify no database interactions occurred
    expect(queryCount).toBe(0);

    // Verify no log was created
    expect(mockCreateFeedGenLog).not.toHaveBeenCalled();
  });
});
