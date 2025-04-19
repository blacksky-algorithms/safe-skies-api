import { getLogsController } from "../../../src/controllers/logs.controller";
import { getUserRoleForFeed } from "../../../src/repos/permissions";
import { getLogs } from "../../../src/repos/logs";
import { setupLogsMocks } from "../../mocks/logs.mocks";
import {
	createMockRequest,
	createMockResponse,
	mockJson,
	mockStatus,
} from "../../mocks/express.mock";
import { ModAction } from "../../../src/lib/types/moderation";
import { mockUser } from "../../fixtures/user.fixtures";
import { mockLogEntries } from "../../fixtures/logs.fixtures";

// Mock the permissions repository
jest.mock("../../../src/repos/permissions");
jest.mock("../../../src/repos/logs");

// Get mock functions
const mockGetUserRoleForFeed = getUserRoleForFeed as jest.MockedFunction<
	typeof getUserRoleForFeed
>;
const mockGetLogs = getLogs as jest.MockedFunction<typeof getLogs>;

// Set up logs mocks
setupLogsMocks();

describe("getLogsController", () => {
	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	it("should return 401 if user is not authenticated", async () => {
		// Arrange
		const req = createMockRequest({
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1",
			user: undefined, // No authenticated user
		});
		const res = createMockResponse();

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockStatus).toHaveBeenCalledWith(401);
		expect(mockJson).toHaveBeenCalledWith({ error: "Not authenticated" });
	});

	it("should return 400 if uri parameter is missing", async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs", // No uri parameter
		});
		const res = createMockResponse();

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockStatus).toHaveBeenCalledWith(400);
		expect(mockJson).toHaveBeenCalledWith({
			error: "Feed URI is required to view logs",
		});
	});

	it('should return 403 if user role is "user"', async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1",
		});
		const res = createMockResponse();

		mockGetUserRoleForFeed.mockResolvedValue("user");

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockGetUserRoleForFeed).toHaveBeenCalledWith(mockUser.did, "feed:1");
		expect(mockStatus).toHaveBeenCalledWith(403);
		expect(mockJson).toHaveBeenCalledWith({
			error: "Not authorized to view logs for this feed",
		});
	});

	it("should filter logs for moderators", async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1",
		});
		const res = createMockResponse();

		mockGetUserRoleForFeed.mockResolvedValue("mod");
		mockGetLogs.mockResolvedValue(mockLogEntries);

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockGetLogs).toHaveBeenCalled();

		// Extract the arguments
		const callArgs = mockJson.mock.calls[0][0];
		expect(callArgs).toBeDefined();
		const returnedLogs = callArgs.logs;

		// Should only include allowed actions for moderators
		expect(returnedLogs.length).toBe(2); // Only user_ban and post_delete are allowed

		// Verify actions are filtered correctly
		const actions = returnedLogs.map(
			(log: { action: ModAction }) => log.action,
		);
		expect(actions).toContain("user_ban");
		expect(actions).toContain("post_delete");
		expect(actions).not.toContain("mod_promote");

		// Verify performed_by_profile is omitted
		expect(returnedLogs[0]).not.toHaveProperty("performed_by_profile");
	});

	it("should return all logs for admins", async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1",
		});
		const res = createMockResponse();

		mockGetUserRoleForFeed.mockResolvedValue("admin");
		mockGetLogs.mockResolvedValue(mockLogEntries);

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockGetLogs).toHaveBeenCalled();
		expect(mockJson).toHaveBeenCalledWith({ logs: mockLogEntries });
	});

	it("should pass query parameters as filters", async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1&action=user_ban&performedBy=did:example:admin1&targetUser=did:example:user2&targetPost=at://post/1&sortBy=ascending&fromDate=2023-01-01&toDate=2023-01-31",
		});
		const res = createMockResponse();

		mockGetUserRoleForFeed.mockResolvedValue("admin");
		mockGetLogs.mockResolvedValue([]);

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockGetLogs).toHaveBeenCalledWith(
			expect.objectContaining({
				uri: "feed:1",
				action: "user_ban",
				performedBy: "did:example:admin1",
				targetUser: "did:example:user2",
				targetPost: "at://post/1",
				sortBy: "ascending",
				dateRange: {
					fromDate: "2023-01-01",
					toDate: "2023-01-31",
				},
			}),
		);
	});

	it("should handle errors gracefully", async () => {
		// Arrange
		const req = createMockRequest({
			user: { did: mockUser.did, handle: mockUser.handle },
			protocol: "http",
			get: jest.fn().mockReturnValue("example.com"),
			url: "/api/logs?uri=feed:1",
		});
		const res = createMockResponse();

		mockGetUserRoleForFeed.mockRejectedValue(new Error("Database error"));

		// Mock console.error to prevent test output pollution
		const originalConsoleError = console.error;
		console.error = jest.fn();

		// Act
		await getLogsController(req, res);

		// Assert
		expect(mockStatus).toHaveBeenCalledWith(500);
		expect(mockJson).toHaveBeenCalledWith({ error: "Failed to fetch logs" });

		// Restore console.error
		console.error = originalConsoleError;
	});
});
