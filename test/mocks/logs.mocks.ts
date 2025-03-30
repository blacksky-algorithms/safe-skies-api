import { LogEntry, LogFilters } from '../../src/lib/types/logs';

// Sample log entries for testing
export const mockLogEntries: LogEntry[] = [
  {
    id: '1',
    uri: 'feed:1',
    performed_by: 'did:example:123',
    action: 'user_ban',
    target_user_did: 'did:example:456',
    created_at: '2023-01-01T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:123',
      handle: 'moderator',
      display_name: 'Moderator One',
      avatar: 'avatar1.jpg',
    },
    target_user_profile: {
      did: 'did:example:456',
      handle: 'user1',
      display_name: 'User One',
      avatar: 'avatar2.jpg',
    },
  },
  {
    id: '2',
    uri: 'feed:1',
    performed_by: 'did:example:123',
    action: 'post_delete',
    target_user_did: 'did:example:456',
    target_post_uri: 'at://did:example:456/post/1',
    created_at: '2023-01-02T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:123',
      handle: 'moderator',
      display_name: 'Moderator One',
      avatar: 'avatar1.jpg',
    },
  },
  {
    id: '3',
    uri: 'feed:1',
    performed_by: 'did:example:789',
    action: 'mod_promote',
    target_user_did: 'did:example:456',
    created_at: '2023-01-03T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:789',
      handle: 'admin',
      display_name: 'Admin User',
      avatar: 'avatar3.jpg',
    },
  },
];

export const mockGetLogs = jest
  .fn<Promise<LogEntry[]>, [LogFilters]>()
  .mockResolvedValue(mockLogEntries);

export const mockCreateModerationLog = jest.fn().mockResolvedValue(undefined);

export const mockCreateFeedGenLog = jest.fn().mockResolvedValue(undefined);

// Setup function for logs mocks
export const setupLogsMocks = (): void => {
  jest.mock('../../src/repos/logs', () => ({
    getLogs: mockGetLogs,
    createModerationLog: mockCreateModerationLog,
    createFeedGenLog: mockCreateFeedGenLog,
  }));
};
