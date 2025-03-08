"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBulkProfileDetails = exports.groupModeratorsByFeed = void 0;
exports.buildFeedPermissions = buildFeedPermissions;
exports.canPerformWithRole = canPerformWithRole;
const profile_1 = require("../../repos/profile");
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
const groupModeratorsByFeed = (permissions) => {
    return permissions.reduce((acc, perm) => {
        if (!acc[perm.uri]) {
            acc[perm.uri] = [];
        }
        acc[perm.uri].push(perm);
        return acc;
    }, {});
};
exports.groupModeratorsByFeed = groupModeratorsByFeed;
const getBulkProfileDetails = async (userDids) => {
    // Deduplicate DIDs
    const uniqueDids = [...new Set(userDids)];
    // Get all profiles in parallel
    const profiles = await Promise.all(uniqueDids.map((did) => (0, profile_1.getProfile)(did)));
    // Map back to original order
    return userDids.map((did) => profiles.find((profile) => profile?.did === did) || { did, handle: did });
};
exports.getBulkProfileDetails = getBulkProfileDetails;
/**
 * Determines if a user with a given role can perform the specified moderation action.
 */
function canPerformWithRole(role, action) {
    switch (action) {
        // Only admins may promote or demote moderators, ban or unban users.
        case 'mod_promote':
        case 'mod_demote':
        case 'user_unban':
        case 'user_ban':
            return role === 'admin';
        // For post deletion or restoration, mods and admins are allowed.
        case 'post_delete':
        case 'post_restore':
            return role === 'mod' || role === 'admin';
        default:
            return false;
    }
}
