"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFeedPermissions = buildFeedPermissions;
function buildFeedPermissions(userDid, createdFeeds, existingPermissions = []) {
    const permissionsMap = new Map();
    // Convert existing permissions array into a Map keyed by URI
    for (const perm of existingPermissions) {
        permissionsMap.set(perm.uri, perm);
    }
    // For each newly created feed, set user as admin if not present or if new role is higher
    for (const feed of createdFeeds) {
        // If no feed.uri, skip
        if (!feed.uri)
            continue;
        const existing = permissionsMap.get(feed.uri);
        // By default, we set admin if none or a lower role
        const defaultRole = 'admin';
        if (!existing) {
            permissionsMap.set(feed.uri, {
                uri: feed.uri,
                feed_name: feed.displayName || feed.uri.split('/').pop() || 'Unnamed',
                role: defaultRole,
            });
        }
        else {
            // If existing role is 'user', we can raise it to admin if you want
            // Or preserve 'mod' if it’s “higher.” Adjust logic as you see fit
            // e.g., if ROLE_PRIORITY[existing.role] < ROLE_PRIORITY['admin'], then upgrade
        }
    }
    // Return as an array of permissions with the user DID
    return Array.from(permissionsMap.values()).map((perm) => ({
        did: userDid,
        uri: perm.uri,
        feed_name: perm.feed_name,
        role: perm.role,
    }));
}
