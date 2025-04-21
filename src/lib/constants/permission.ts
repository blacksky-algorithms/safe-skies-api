import { UserRole } from "../types/permission";

export const ROLE_PRIORITY: Record<UserRole, number> = {
	user: 1,
	mod: 2,
	admin: 3,
};
