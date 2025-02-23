import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { UserRole } from '../types/permission';

export interface FeedRoleInfo {
  role: UserRole;
  displayName: string;
  uri: string;
}

export interface User extends ProfileViewBasic {
  rolesByFeed: Record<string, FeedRoleInfo>;
}

export interface ModeratorData {
  did: string;
  uri: string;
  feed_name: string;
  role: UserRole;
  profiles: ProfileViewBasic;
}
