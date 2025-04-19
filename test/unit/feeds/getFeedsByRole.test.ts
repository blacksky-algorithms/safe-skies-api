import { tracker, setupDbMocks, cleanupDbMocks } from "../../mocks/db.mocks";

setupDbMocks();

// Import after setting up mocks
import { getFeedsByRole } from "../../../src/repos/feed";
import { mockUser } from "../../fixtures/user.fixtures";

describe("getFeedsByRole", () => {
	// Track query count
	let queryCount = 0;

	beforeEach(() => {
		jest.clearAllMocks();
		queryCount = 0;
		tracker.install();
	});

	afterEach(() => {
		tracker.uninstall();
	});

	afterAll(() => {
		cleanupDbMocks();
		jest.restoreAllMocks();
	});

	it("should return an empty array if did is not provided", async () => {
		const result = await getFeedsByRole(undefined, "admin");
		expect(result).toEqual([]);
		expect(queryCount).toBe(0); // No queries should be executed
	});

	it('should return an empty array if role is "user"', async () => {
		const result = await getFeedsByRole(mockUser.did, "user");
		expect(result).toEqual([]);
		expect(queryCount).toBe(0); // No queries should be executed
	});

	it("should return feed permissions for a valid did and role", async () => {
		const expectedRows = [
			{ uri: "feed1", feed_name: "Feed One", admin_did: mockUser.did },
		];

		// Setup tracker to intercept queries
		tracker.on("query", function (query) {
			queryCount++;

			// Verify query details
			expect(query.method).toBe("select");
			expect(query.sql).toMatch(/select.*from.*feed_permissions/i);

			// Check bindings for the where clause
			const bindingsStr = JSON.stringify(query.bindings);
			expect(bindingsStr).toContain(mockUser.did);
			expect(bindingsStr).toContain("admin");

			// Return the expected result
			query.response(expectedRows);
		});

		const result = await getFeedsByRole(mockUser.did, "admin");

		expect(queryCount).toBe(1); // One query should be executed
		expect(result).toEqual(expectedRows);
	});

	it("should return an empty array when a database error occurs", async () => {
		// Setup tracker to intercept and reject the query
		tracker.on("query", function (query) {
			queryCount++;
			query.reject(new Error("DB error"));
		});

		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		const result = await getFeedsByRole(mockUser.did, "admin");

		expect(queryCount).toBe(1); // One query should be executed
		expect(result).toEqual([]);
		expect(consoleSpy).toHaveBeenCalledWith(
			"Error in getFeedsByRole:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});
});
