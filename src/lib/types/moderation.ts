import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { Feed } from '@atproto/api/dist/client/types/app/bsky/feed/describeFeedGenerator';
import { UserRole } from './permission';
import { PostRecord } from '@atproto/api';
import { User } from './user';

export type ModAction =
  | 'post_delete'
  | 'post_restore'
  | 'user_ban'
  | 'user_unban'
  | 'mod_promote'
  | 'mod_demote';

export interface ReportOption {
  id: string;
  title: string;
  description: string;
  reason: string;
}

export interface ModerationService {
  value: string;
  label: string;
  feed_gen_endpoint: string | null;
}
