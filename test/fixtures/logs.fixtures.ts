import { LogEntry, LogFilters } from '../../src/lib/types/logs';
import { ModAction } from '../../src/lib/types/moderation';

// Sample log entries for testing
export const sampleLogEntries: LogEntry[] = [
  {
    id: '1',
    uri: 'feed:1',
    performed_by: 'did:example:moderator1',
    action: 'user_ban' as ModAction,
    target_user_did: 'did:example:user1',
    created_at: '2023-01-01T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:moderator1',
      handle: 'moderator1',
      display_name: 'Moderator One',
      avatar: 'avatar1.jpg',
    },
    target_user_profile: {
      did: 'did:example:user1',
      handle: 'user1',
      display_name: 'User One',
      avatar: 'avatar2.jpg',
    },
  },
  {
    id: '2',
    uri: 'feed:1',
    performed_by: 'did:example:moderator1',
    action: 'post_delete' as ModAction,
    target_user_did: 'did:example:user1',
    target_post_uri: 'at://did:example:user1/post/1',
    created_at: '2023-01-02T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:moderator1',
      handle: 'moderator1',
      display_name: 'Moderator One',
      avatar: 'avatar1.jpg',
    },
  },
  {
    id: '3',
    uri: 'feed:2',
    performed_by: 'did:example:admin1',
    action: 'mod_promote' as ModAction,
    target_user_did: 'did:example:user2',
    created_at: '2023-01-03T00:00:00Z',
    performed_by_profile: {
      did: 'did:example:admin1',
      handle: 'admin1',
      display_name: 'Admin User',
      avatar: 'avatar3.jpg',
    },
  },
];

// Sample database rows that correspond to the log entries
export const sampleDbRows = [
  {
    id: '1',
    uri: 'feed:1',
    performed_by: 'did:example:moderator1',
    action: 'user_ban',
    target_user_did: 'did:example:user1',
    created_at: '2023-01-01T00:00:00Z',
    performed_by_did: 'did:example:moderator1',
    performed_by_handle: 'moderator1',
    performed_by_display_name: 'Moderator One',
    performed_by_avatar: 'avatar1.jpg',
    target_user_did_joined: 'did:example:user1',
    target_user_handle: 'user1',
    target_user_display_name: 'User One',
    target_user_avatar: 'avatar2.jpg',
  },
  {
    id: '2',
    uri: 'feed:1',
    performed_by: 'did:example:moderator1',
    action: 'post_delete',
    target_user_did: 'did:example:user1',
    target_post_uri: 'at://did:example:user1/post/1',
    created_at: '2023-01-02T00:00:00Z',
    performed_by_did: 'did:example:moderator1',
    performed_by_handle: 'moderator1',
    performed_by_display_name: 'Moderator One',
    performed_by_avatar: 'avatar1.jpg',
    target_user_did_joined: null,
    target_user_handle: null,
    target_user_display_name: null,
    target_user_avatar: null,
  },
  {
    id: '3',
    uri: 'feed:2',
    performed_by: 'did:example:admin1',
    action: 'mod_promote',
    target_user_did: 'did:example:user2',
    created_at: '2023-01-03T00:00:00Z',
    performed_by_did: 'did:example:admin1',
    performed_by_handle: 'admin1',
    performed_by_display_name: 'Admin User',
    performed_by_avatar: 'avatar3.jpg',
    target_user_did_joined: null,
    target_user_handle: null,
    target_user_display_name: null,
    target_user_avatar: null,
  },
];

// Sample filters for testing
export const sampleFilters: LogFilters = {
  uri: 'feed:1',
  sortBy: 'descending',
};

export const emptyFilters: LogFilters = { sortBy: 'descending' };

export const complexFilters: LogFilters = {
  uri: 'feed:1',
  action: 'user_ban' as ModAction,
  performedBy: 'did:example:moderator1',
  dateRange: {
    fromDate: '2023-01-01T00:00:00Z',
    toDate: '2023-01-02T00:00:00Z',
  },
  sortBy: 'ascending',
};
