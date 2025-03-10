import {
  ProfileViewBasic,
  ProfileViewDetailed,
} from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { FeedRoleInfo, UserRole } from '../types/permission';

export interface User extends ProfileViewBasic {
  rolesByFeed: FeedRoleInfo[];
}

export interface ModeratorData {
  did: string;
  uri: string;
  feed_name?: string;
  role: UserRole;
  profile: ProfileViewBasic;
}

export interface ExtendedProfile extends ProfileViewDetailed {
  associated?: any;
  labels?: any;
}
