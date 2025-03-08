import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { FeedRoleInfo, UserRole } from '../types/permission';

export interface User extends ProfileViewBasic {
  rolesByFeed: Record<string, FeedRoleInfo>;
}

export interface ModeratorData {
  did: string;
  uri: string;
  feed_name?: string;
  role: UserRole;
  profile: ProfileViewBasic;
}
