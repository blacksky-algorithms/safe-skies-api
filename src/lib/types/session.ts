import { FeedRoleInfo } from './permission';

export interface SessionPayload {
  did: string;
  handle: string;
  displayName?: string;
  rolesByFeed?: Record<string, FeedRoleInfo>;
}
