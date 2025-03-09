import { Feed } from '@atproto/api/dist/client/types/app/bsky/feed/describeFeedGenerator';
import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

export type UserRole = 'admin' | 'mod' | 'user';

export type FeedRoleInfo = {
  role: UserRole;
  displayName: string;
  uri: string;
  feed_name?: string;
};
