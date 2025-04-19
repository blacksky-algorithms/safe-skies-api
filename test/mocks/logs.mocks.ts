import { LogEntry, LogFilters } from "../../src/lib/types/logs";
import { mockLogEntries } from "../fixtures/logs.fixtures";

export const mockGetLogs = jest
	.fn<Promise<LogEntry[]>, [LogFilters]>()
	.mockResolvedValue(mockLogEntries);

export const mockGetLogsFailed = jest
	.fn<Promise<Error>, [LogFilters]>()
	.mockResolvedValue(new Error("Database error"));

export const mockCreateModerationLog = jest.fn().mockResolvedValue(undefined);

export const mockCreateFeedGenLog = jest.fn().mockResolvedValue(undefined);

// Setup function for logs mocks
export const setupLogsMocks = (): void => {
	jest.mock("../../src/repos/logs", () => ({
		getLogs: mockGetLogs,
		createModerationLog: mockCreateModerationLog,
		createFeedGenLog: mockCreateFeedGenLog,
	}));
};
