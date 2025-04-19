import { UserRole } from "../types/permission";

export const preferredLanguages = "en-US, en";

export const ROLE_PRIORITY = {
	admin: 3,
	mod: 2,
	user: 1,
} as const;

export const DEFAULT_FEED = {
	uri: "at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky",
	displayName: "Blacksy",
	type: "user" as UserRole,
} as const;
