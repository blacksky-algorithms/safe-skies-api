export type UserRole = 'admin' | 'mod' | 'user';

export type FeedRoleInfo = {
  role: UserRole;
  displayName: string;
  uri: string;
  feed_name?: string;
};
