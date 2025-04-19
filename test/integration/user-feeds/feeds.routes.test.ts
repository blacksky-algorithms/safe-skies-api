import request from "supertest";
import app from "../../../src/app";
import * as feedRepo from "../../../src/repos/feed";
import { DEFAULT_FEED } from "../../../src/lib/constants";

// Mock the feed repository module
jest.mock("../../../src/repos/feed");

describe("Feed Routes Integration", () => {
	const mockFeedData = {
		feeds: [{ uri: "feed:1", displayName: "Test Feed" }],
		defaultFeed: DEFAULT_FEED,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		// Set up default successful response
		(feedRepo.getEnrichedFeedsForUser as jest.Mock).mockResolvedValue(
			mockFeedData,
		);
	});

	describe("GET /user-feeds", () => {
		it("should return empty feeds when userDid is not provided", async () => {
			// Make the request without userDid
			const response = await request(app).get("/api/feeds/user-feeds");

			// Assert response
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				feeds: [],
				defaultFeed: DEFAULT_FEED,
			});

			// Mock should not be called when userDid is missing
			expect(feedRepo.getEnrichedFeedsForUser).not.toHaveBeenCalled();
		});

		it("should return user feeds when userDid is provided", async () => {
			// Make the request with userDid
			const response = await request(app)
				.get("/api/feeds/user-feeds")
				.query({ userDid: "did:example:123" });

			// Assert response
			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockFeedData);

			// Verify the mock was called with the correct userDid
			expect(feedRepo.getEnrichedFeedsForUser).toHaveBeenCalledWith(
				"did:example:123",
			);
		});

		it("should handle errors gracefully", async () => {
			// Setup the mock to throw an error for this test
			(feedRepo.getEnrichedFeedsForUser as jest.Mock).mockRejectedValueOnce(
				new Error("Test error"),
			);

			// Make the request with userDid to trigger the error
			const response = await request(app)
				.get("/api/feeds/user-feeds")
				.query({ userDid: "did:example:123" });

			// Assert error response
			expect(response.status).toBe(500);
			expect(response.body).toHaveProperty("error");
			expect(response.body).toHaveProperty("feeds");
			expect(response.body).toHaveProperty("defaultFeed");
		});
	});
});
