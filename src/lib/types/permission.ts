export type UserRole = "admin" | "mod" | "user";

export type FeedRoleInfo = {
	role: UserRole;
	displayName: string;
	uri: string;
	feed_name?: string;
};

export interface ExistingPermission {
	uri: string;
	feed_name: string;
	role: UserRole;
	allowed_services?: string;
	admin_did: string;
}
