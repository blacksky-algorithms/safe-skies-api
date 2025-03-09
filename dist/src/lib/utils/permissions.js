"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canPerformWithRole = exports.getBulkProfileDetails = exports.groupModeratorsByFeed = exports.buildFeedPermissions = void 0;
const profile_1 = require("../../repos/profile");
const permission_1 = require("../constants/permission");
const buildFeedPermissions = (userDid, createdFeeds, existingPermissions = []) => {
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
            // Only upgrade role if the new one has higher priority
            if (permission_1.ROLE_PRIORITY[existing.role] < permission_1.ROLE_PRIORITY[defaultRole]) {
                existing.role = defaultRole;
            }
            // Always update the feed_name if available
            if (feed.displayName) {
                existing.feed_name = feed.displayName;
            }
        }
    }
    // Return as an array of permissions with the user DID
    return Array.from(permissionsMap.values()).map((perm) => ({
        did: userDid,
        uri: perm.uri,
        feed_name: perm.feed_name,
        role: perm.role,
    }));
};
exports.buildFeedPermissions = buildFeedPermissions;
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
const canPerformWithRole = (role, action) => {
    switch (action) {
        case 'mod_promote':
        case 'mod_demote':
        case 'user_unban':
        case 'user_ban':
            return role === 'admin';
        case 'post_delete':
        case 'post_restore':
            return role === 'mod' || role === 'admin';
        default:
            return false;
    }
};
exports.canPerformWithRole = canPerformWithRole;
