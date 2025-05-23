import { ExistingPermission } from "../../../src/lib/types/permission";
import { GeneratorView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { setupPermissionsMocks } from "../../mocks/permissions.mocks";
import { mockExistingPermission } from "../../fixtures/permissions.fixtures";

// Call setup function before importing the modules being tested
setupPermissionsMocks();

// Now import the modules
import { buildFeedPermissions } from "../../../src/repos/permissions";
import { getModerationServicesConfig } from "../../../src/repos/moderation";
import { computeAllowedServicesForFeed } from "../../../src/lib/utils/permissions";
import { mockServicesConfig } from "../../fixtures/moderation.fixtures";
import {
	mockGeneratorView,
	mockGeneratorViewNoDisplayName,
} from "../../fixtures/feed.fixtures";

describe("buildFeedPermissions", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it("should build permissions for created feeds only", async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [mockGeneratorView];
		const existingPermissions: ExistingPermission[] = [];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		expect(result).toHaveLength(1);
		const permission = result[0];
		expect(permission.did).toBe(userDid);
		expect(permission.uri).toBe(mockGeneratorView.uri);
		// When a displayName is provided, it should be used.
		expect(permission.feed_name).toBe(mockGeneratorView.displayName);
		expect(permission.role).toBe("admin");

		// Instead of verifying a mock call, compute the expected allowed_services using the real function.
		const expectedAllowed = await computeAllowedServicesForFeed(
			mockGeneratorView.creator.did,
			mockServicesConfig,
		);
		expect(permission.allowed_services).toEqual(expectedAllowed);
	});

	it('should default feed_name to "Unnamed" when displayName is missing', async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [mockGeneratorViewNoDisplayName];
		const existingPermissions: ExistingPermission[] = [];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		expect(result).toHaveLength(1);
		expect(result[0].feed_name).toBe("Unnamed");
	});

	it("should include existing permissions when not overlapping with created feeds", async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [mockGeneratorView];
		const existingPermissions: ExistingPermission[] = [mockExistingPermission];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		// Expect two permissions (one from created feed, one from existing permission).
		expect(result).toHaveLength(2);

		const createdPermission = result.find(
			(perm) => perm.uri === mockGeneratorView.uri,
		);
		expect(createdPermission).toBeDefined();
		expect(createdPermission?.role).toBe("admin");

		const existingPerm = result.find(
			(perm) => perm.uri === mockExistingPermission.uri,
		);
		expect(existingPerm).toBeDefined();
		expect(existingPerm?.role).toBe(mockExistingPermission.role);

		// Verify allowed services for the existing permission.
		const expectedExistingAllowed = await computeAllowedServicesForFeed(
			mockExistingPermission.admin_did,
			mockServicesConfig,
		);
		expect(existingPerm?.allowed_services).toEqual(expectedExistingAllowed);
	});

	it("should give precedence to created feeds when there is an overlap with existing permissions", async () => {
		const userDid = "user:123";
		const overlappingFeed: GeneratorView = {
			...mockGeneratorView,
			uri: "feed:overlap",
		};
		const overlappingPermission: ExistingPermission = {
			uri: "feed:overlap",
			feed_name: "Old Feed Name",
			role: "mod",
			admin_did: "admin2",
		};

		const createdFeeds: GeneratorView[] = [overlappingFeed];
		const existingPermissions: ExistingPermission[] = [overlappingPermission];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		// Only one permission should be present for the overlapping feed.
		expect(result).toHaveLength(1);
		const permission = result[0];
		expect(permission.uri).toBe("feed:overlap");
		// The role should be 'admin' since the feed is in the created feeds.
		expect(permission.role).toBe("admin");
	});

	it("should skip created feeds without a valid URI", async () => {
		const userDid = "user:123";
		const invalidFeed: GeneratorView = { ...mockGeneratorView, uri: "" };
		const createdFeeds: GeneratorView[] = [invalidFeed];
		const existingPermissions: ExistingPermission[] = [];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		expect(result).toHaveLength(0);
	});

	it("should override admin role for existing permissions on feeds not created by the user", async () => {
		const userDid = "user:123";
		// An existing permission with role 'admin' for a feed not in createdFeeds.
		const existingPermissionAdmin: ExistingPermission = {
			uri: "feed:admin",
			feed_name: "Admin Feed",
			role: "admin",
			admin_did: "admin2",
		};
		const existingPermissions: ExistingPermission[] = [existingPermissionAdmin];

		const result = await buildFeedPermissions(userDid, [], existingPermissions);

		expect(result).toHaveLength(1);
		// Per our updated spec, the role should be overridden to 'user'.
		expect(result[0].role).toBe("user");
	});

	it("should return an empty array if no feeds are provided", async () => {
		const userDid = "user:123";
		const result = await buildFeedPermissions(userDid, [], []);
		expect(result).toHaveLength(0);
	});

	it("should include allowed_services as computed for each feed", async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [mockGeneratorView];
		const result = await buildFeedPermissions(userDid, createdFeeds, []);
		expect(result).toHaveLength(1);
		const expectedAllowed = await computeAllowedServicesForFeed(
			mockGeneratorView.creator.did,
			mockServicesConfig,
		);
		expect(result[0].allowed_services).toEqual(expectedAllowed);
	});

	it("should call getModerationServicesConfig only once", async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [
			mockGeneratorView,
			mockGeneratorViewNoDisplayName,
		];
		const existingPermissions: ExistingPermission[] = [
			mockExistingPermission,
			{
				uri: "feed:admin",
				feed_name: "Admin Feed",
				role: "admin",
				admin_did: "admin2",
			},
		];

		await buildFeedPermissions(userDid, createdFeeds, existingPermissions);
		// Since getModerationServicesConfig is still mocked, verify that it's called only once.
		expect(getModerationServicesConfig).toHaveBeenCalledTimes(1);
	});

	// For the pure function calls (computeAllowedServicesForFeed), we can verify their outcomes via the computed allowed_services.
	it("should compute allowed_services correctly for each valid feed and permission", async () => {
		const userDid = "user:123";
		const createdFeeds: GeneratorView[] = [
			mockGeneratorView,
			mockGeneratorViewNoDisplayName,
		];
		const existingPermissions: ExistingPermission[] = [
			{
				uri: "feed:extra",
				feed_name: "Extra Feed",
				role: "mod",
				admin_did: "admin3",
			},
		];

		const result = await buildFeedPermissions(
			userDid,
			createdFeeds,
			existingPermissions,
		);

		expect(result).toHaveLength(3);
		// For each feed/permission, compute expected allowed_services.
		const expectedCreated1 = await computeAllowedServicesForFeed(
			mockGeneratorView.creator.did,
			mockServicesConfig,
		);
		const expectedCreated2 = await computeAllowedServicesForFeed(
			mockGeneratorViewNoDisplayName.creator.did,
			mockServicesConfig,
		);
		const expectedExtra = await computeAllowedServicesForFeed(
			"admin3",
			mockServicesConfig,
		);

		// Find and assert each one.
		const perm1 = result.find((p) => p.uri === mockGeneratorView.uri);
		const perm2 = result.find(
			(p) => p.uri === mockGeneratorViewNoDisplayName.uri,
		);
		const permExtra = result.find((p) => p.uri === "feed:extra");

		expect(perm1?.allowed_services).toEqual(expectedCreated1);
		expect(perm2?.allowed_services).toEqual(expectedCreated2);
		expect(permExtra?.allowed_services).toEqual(expectedExtra);
	});
});
