import { buildFeedPermissions } from '../../src/repos/permissions';
import { ExistingPermission } from '../../src/lib/types/permission';

import { getModerationServicesConfig } from '../../src/repos/moderation';
import { computeAllowedServicesForFeed } from '../../src/lib/utils/permissions';
import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

import {
  mockGetModerationServicesConfig,
  mockComputeAllowedServicesForFeed,
  mockServicesConfig,
} from '../helpers/mocks';
import {
  sampleExistingPermission,
  sampleGeneratorView,
  sampleGeneratorViewNoDisplayName,
} from '../helpers/fixtures';

jest.mock('../../src/repos/moderation', () => ({
  getModerationServicesConfig: jest.fn(),
}));

jest.mock('../../src/lib/utils/permissions', () => ({
  computeAllowedServicesForFeed: jest.fn(),
}));

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

  it('should override admin role for existing permissions on feeds not created by the user', async () => {
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
    expect(result[0].role).toBe('user');
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

  it('should call getModerationServicesConfig only once', async () => {
    const userDid = 'user:123';
    const createdFeeds: GeneratorView[] = [
      sampleGeneratorView,
      sampleGeneratorViewNoDisplayName,
    ];
    const existingPermissions: ExistingPermission[] = [
      sampleExistingPermission,
      {
        uri: 'feed:admin',
        feed_name: 'Admin Feed',
        role: 'admin',
        admin_did: 'admin2',
      },
    ];

    await buildFeedPermissions(userDid, createdFeeds, existingPermissions);
    expect(getModerationServicesConfig).toHaveBeenCalledTimes(1);
  });

  it('should call computeAllowedServicesForFeed for each valid feed and permission', async () => {
    const userDid = 'user:123';
    // Two created feeds (both valid) and one existing permission (for a different URI).
    const createdFeeds: GeneratorView[] = [
      sampleGeneratorView,
      sampleGeneratorViewNoDisplayName,
    ];
    const existingPermissions: ExistingPermission[] = [
      {
        uri: 'feed:extra',
        feed_name: 'Extra Feed',
        role: 'mod',
        admin_did: 'admin3',
      },
    ];

    await buildFeedPermissions(userDid, createdFeeds, existingPermissions);

    // computeAllowedServicesForFeed should be called once for each created feed and once for each non-duplicated existing permission.
    // In this case: 2 (created feeds) + 1 (existing permission) = 3 calls.
    expect(mockComputeAllowedServicesForFeed).toHaveBeenCalledTimes(3);
    // Check that it was called with the correct parameters:
    expect(mockComputeAllowedServicesForFeed).toHaveBeenCalledWith(
      sampleGeneratorView.creator.did,
      mockServicesConfig
    );
    // And for the existing permission:
    expect(mockComputeAllowedServicesForFeed).toHaveBeenCalledWith(
      'admin3',
      mockServicesConfig
    );
  });
});
