// test/unit/buildFeedPermissions.test.ts

import { buildFeedPermissions } from '../../src/repos/permissions';
import { ExistingPermission } from '../../src/lib/types/permission';
// Import the mocked functions so we can override their implementations.
import { getModerationServicesConfig } from '../../src/repos/moderation';
import { computeAllowedServicesForFeed } from '../../src/lib/utils/permissions';
import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

// Import our reusable mocks.
import {
  mockGetModerationServicesConfig,
  mockComputeAllowedServicesForFeed,
  mockServicesConfig,
} from '../helpers/mocks';

// Mock the modules that export the helper functions.
jest.mock('../../src/repos/moderation', () => ({
  getModerationServicesConfig: jest.fn(),
}));

jest.mock('../../src/lib/utils/permissions', () => ({
  computeAllowedServicesForFeed: jest.fn(),
}));

// Sample GeneratorView fixture
const sampleGeneratorView: GeneratorView = {
  uri: 'feed:1',
  cid: 'cid1',
  did: 'did1',
  creator: {
    did: 'admin1',
    displayName: 'Admin One',
    handle: '@admin1',
  },
  displayName: 'Feed One',
  indexedAt: '2025-03-24T00:00:00.000Z',
};

// A feed without a displayName should default to 'Unnamed'
const sampleGeneratorViewNoDisplayName: GeneratorView = {
  ...sampleGeneratorView,
  uri: 'feed:2',
  displayName: '',
};

// Sample ExistingPermission fixture
const sampleExistingPermission: ExistingPermission = {
  uri: 'feed:3',
  feed_name: 'Existing Feed',
  role: 'mod',
  admin_did: 'admin2',
};

beforeEach(() => {
  // Reset mocks before each test.
  jest.resetAllMocks();

  // Override the implementations of the mocked functions.
  (getModerationServicesConfig as jest.Mock).mockImplementation(
    mockGetModerationServicesConfig
  );
  (computeAllowedServicesForFeed as jest.Mock).mockImplementation(
    mockComputeAllowedServicesForFeed
  );
});

describe('buildFeedPermissions', () => {
  it('should build permissions for created feeds only', async () => {
    const userDid = 'user:123';
    const createdFeeds: GeneratorView[] = [sampleGeneratorView];
    const existingPermissions: ExistingPermission[] = [];

    const result = await buildFeedPermissions(
      userDid,
      createdFeeds,
      existingPermissions
    );

    expect(result).toHaveLength(1);
    const permission = result[0];
    expect(permission.did).toBe(userDid);
    expect(permission.uri).toBe(sampleGeneratorView.uri);
    // When a displayName is provided, use it.
    expect(permission.feed_name).toBe(sampleGeneratorView.displayName);
    expect(permission.role).toBe('admin');
    // Ensure computeAllowedServicesForFeed was called with the feed creator's did.
    expect(mockComputeAllowedServicesForFeed).toHaveBeenCalledWith(
      sampleGeneratorView.creator.did,
      mockServicesConfig
    );
  });

  it('should default feed_name to "Unnamed" when displayName is missing', async () => {
    const userDid = 'user:123';
    const createdFeeds: GeneratorView[] = [sampleGeneratorViewNoDisplayName];
    const existingPermissions: ExistingPermission[] = [];

    const result = await buildFeedPermissions(
      userDid,
      createdFeeds,
      existingPermissions
    );

    expect(result).toHaveLength(1);
    expect(result[0].feed_name).toBe('Unnamed');
  });

  it('should include existing permissions when not overlapping with created feeds', async () => {
    const userDid = 'user:123';
    const createdFeeds: GeneratorView[] = [sampleGeneratorView];
    const existingPermissions: ExistingPermission[] = [
      sampleExistingPermission,
    ];

    const result = await buildFeedPermissions(
      userDid,
      createdFeeds,
      existingPermissions
    );

    // Expect two permissions (one from created feed, one from existing permission)
    expect(result).toHaveLength(2);

    const adminPermission = result.find(
      (perm) => perm.uri === sampleGeneratorView.uri
    );
    expect(adminPermission).toBeDefined();
    expect(adminPermission?.role).toBe('admin');

    const existingPerm = result.find(
      (perm) => perm.uri === sampleExistingPermission.uri
    );
    expect(existingPerm).toBeDefined();
    expect(existingPerm?.role).toBe(sampleExistingPermission.role);
    expect(mockComputeAllowedServicesForFeed).toHaveBeenCalledWith(
      sampleExistingPermission.admin_did,
      mockServicesConfig
    );
  });

  it('should give precedence to created feeds when there is an overlap with existing permissions', async () => {
    const userDid = 'user:123';
    const overlappingFeed: GeneratorView = {
      ...sampleGeneratorView,
      uri: 'feed:overlap',
    };
    const overlappingPermission: ExistingPermission = {
      uri: 'feed:overlap',
      feed_name: 'Old Feed Name',
      role: 'mod',
      admin_did: 'admin2',
    };

    const createdFeeds: GeneratorView[] = [overlappingFeed];
    const existingPermissions: ExistingPermission[] = [overlappingPermission];

    const result = await buildFeedPermissions(
      userDid,
      createdFeeds,
      existingPermissions
    );

    expect(result).toHaveLength(1);
    const permission = result[0];
    expect(permission.uri).toBe('feed:overlap');
    // The role should be 'admin' from the created feed.
    expect(permission.role).toBe('admin');
  });

  it('should skip created feeds without a valid URI', async () => {
    const userDid = 'user:123';
    const invalidFeed: GeneratorView = { ...sampleGeneratorView, uri: '' };
    const createdFeeds: GeneratorView[] = [invalidFeed];
    const existingPermissions: ExistingPermission[] = [];

    const result = await buildFeedPermissions(
      userDid,
      createdFeeds,
      existingPermissions
    );

    expect(result).toHaveLength(0);
  });

  it.skip('should override admin role for existing permissions on feeds not created by the user', async () => {
    const userDid = 'user:123';
    // No created feed for this URI.
    const existingPermissionAdmin: ExistingPermission = {
      uri: 'feed:admin',
      feed_name: 'Admin Feed',
      role: 'admin',
      admin_did: 'admin2',
    };
    const existingPermissions: ExistingPermission[] = [existingPermissionAdmin];

    const result = await buildFeedPermissions(userDid, [], existingPermissions);

    expect(result).toHaveLength(1);
    // Expect that the role is overridden to 'mod' (per our intended behavior)
    expect(result[0].role).toBe('mod');
  });

  it('should return an empty array if no feeds are provided', async () => {
    const userDid = 'user:123';
    const result = await buildFeedPermissions(userDid, [], []);
    expect(result).toHaveLength(0);
  });

  it('should include allowed_services as computed for each feed', async () => {
    const userDid = 'user:123';
    const createdFeeds: GeneratorView[] = [sampleGeneratorView];
    const result = await buildFeedPermissions(userDid, createdFeeds, []);
    expect(result).toHaveLength(1);
    // Verify that allowed_services matches the output of our mockComputeAllowedServicesForFeed.
    expect(result[0].allowed_services).toEqual(
      await mockComputeAllowedServicesForFeed(
        sampleGeneratorView.creator.did,
        mockServicesConfig
      )
    );
  });
});
