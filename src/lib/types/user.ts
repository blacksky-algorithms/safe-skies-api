import {
  ProfileViewBasic,
  ProfileViewDetailed,
} from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { FeedRoleInfo, UserRole } from '../types/permission';

export interface User extends ProfileViewDetailed {
  rolesByFeed: FeedRoleInfo[];
}

export interface ModeratorData {
  did: string;
  uri: string;
  feed_name?: string;
  role: UserRole;
  profile: ProfileViewBasic;
}
