import { UserRole } from '../types/permission';

export const preferredLanguages = 'en-US, en';

export const ROLE_PRIORITY = {
  admin: 3,
  mod: 2,
  user: 1,
} as const;

export const DEFAULT_FEED = {
  uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
  displayName: "What's Hot",
  type: 'user' as UserRole,
} as const;
