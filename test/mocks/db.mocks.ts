import mockKnex from "mock-knex";
import knex from "knex";

// Create a knex instance
export const db = knex({
	client: "pg", // or whatever client you're using
});

// Get the tracker
export const tracker = mockKnex.getTracker();

// Initialize tracking
export const setupDbMocks = (): void => {
	// Attach mock to knex instance
	mockKnex.mock(db);

	// Initialize tracker
	tracker.install();

	// Mock the db module
	jest.mock("../../src/config/db", () => ({
		db,
	}));
};

// Helper function to set up successful query
export const setupSuccessfulQuery = (returnValue: unknown[]): void => {
	tracker.on("query", (query) => {
		query.response(returnValue);
	});
};

// Helper function to set up a specific query response
export const setupQueryResponse = (
	matcher: RegExp,
	returnValue: unknown[],
): void => {
	tracker.on("query", (query) => {
		if (query.sql.match(matcher)) {
			query.response(returnValue);
		}
	});
};

// Helper function to set up failed query
export const setupFailedQuery = (error: Error): void => {
	tracker.on("query", (query) => {
		query.reject(error);
	});
};

// Cleanup function
export const cleanupDbMocks = (): void => {
	tracker.uninstall();
	mockKnex.unmock(db);
};
