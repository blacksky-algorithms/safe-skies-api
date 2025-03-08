import { Feed } from '@atproto/api/dist/client/types/app/bsky/feed/describeFeedGenerator';
import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

export type UserRole = 'admin' | 'mod' | 'user';

export type FeedRoleInfo = {
  role: UserRole;
  displayName: string;
  uri: string;
  feed_name?: string;
};

export type ModeratorWithProfile = ProfileViewBasic & { role: UserRole };

export type FeedWithModerators = {
  feed: Feed;
  moderators: ModeratorWithProfile[];
};

export type FeedPermission = {
  role: UserRole;
  uri: string;
  feed_name: string;
  did: string;
  created_by?: string;
  created_at?: string;
};
