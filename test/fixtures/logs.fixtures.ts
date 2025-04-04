import { LogEntry } from '../../src/lib/types/logs';
import { ModAction } from '../../src/lib/types/moderation';
import {
  mockActingAdminUser,
  mockModUser,
  mockTargetPostUri,
  mockTargetUser,
} from './user.fixtures';

export const mockLogEntries: LogEntry[] = [
  {
    id: '1',
    uri: 'feed:1',
    performed_by: mockModUser.did,
    action: 'user_ban' as ModAction,
    target_user_did: mockTargetUser.did,
    created_at: '2023-01-01T00:00:00Z',
    performed_by_profile: {
      ...mockModUser,
      display_name: mockModUser.displayName,
      avatar: 'avatar1.jpg',
    },
    target_user_profile: {
      ...mockTargetUser,
      display_name: mockTargetUser.displayName,
      avatar: 'avatar2.jpg',
    },
  },
  {
    id: '2',
    uri: 'feed:1',
    performed_by: mockModUser.did,
    action: 'post_delete' as ModAction,
    target_user_did: mockTargetUser.did,
    target_post_uri: mockTargetPostUri,
    created_at: '2023-01-02T00:00:00Z',
    performed_by_profile: {
      ...mockModUser,
      display_name: mockModUser.displayName,
      avatar: 'avatar1.jpg',
    },
  },
  {
    id: '3',
    uri: 'feed:2',
    performed_by: mockActingAdminUser.did,
    action: 'mod_promote' as ModAction,
    target_user_did: mockModUser.did,
    created_at: '2023-01-03T00:00:00Z',
    performed_by_profile: {
      ...mockActingAdminUser,
      display_name: mockActingAdminUser.displayName,
      avatar: 'avatar1.jpg',
    },
  },
];
