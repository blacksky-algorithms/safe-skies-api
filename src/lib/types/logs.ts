import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { ModAction } from './moderation';

export interface LogEntry {
  id: string;
  uri: string;
  performed_by: string;
  action: string;
  target_post_uri?: string;
  target_user_did?: string;
  metadata?: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  reason?: string;
  to_services?: string[];

  performed_by_profile?: {
    did: string;
    handle: string;
    display_name?: string;
    avatar?: string;
  };
  target_user_profile?: {
    did: string;
    handle: string;
    display_name?: string;
    avatar?: string;
  };
}
export interface LogFilters {
  action?: ModAction | null;
  performedBy?: string;
  targetUser?: string;
  targetPost?: string;
  dateRange?: { fromDate: string; toDate: string };
  sortBy: 'ascending' | 'descending';
  uri?: string;
}

export type FilteredLogEntry = Omit<LogEntry, 'performed_by'>;
