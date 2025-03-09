"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActorFeeds = void 0;
exports.getFeedRole = getFeedRole;
exports.canPerformAction = canPerformAction;
exports.createModerationLog = createModerationLog;
exports.getUserRoleForFeed = getUserRoleForFeed;
exports.setFeedRole = setFeedRole;
exports.fetchFeedModsWithProfiles = fetchFeedModsWithProfiles;
exports.fetchModsForAdminFeeds = fetchModsForAdminFeeds;
exports.blackskyServiceGate = blackskyServiceGate;
const db_1 = require("../config/db");
const permissions_1 = require("../lib/utils/permissions");
/**
 * Helper: Fetch the actor's feeds from the 'feed_permissions' table using Knex.
 */
const getActorFeeds = async (did) => {
    try {
        const feeds = await (0, db_1.db)('feed_permissions')
            .select({ name: 'feed_name' }, 'uri', 'role')
            .where({ did });
        return { feeds };
    }
    catch (error) {
        console.error('Error fetching actor feeds:', error);
        return { feeds: [] };
    }
};
exports.getActorFeeds = getActorFeeds;
/**
 * Retrieves the current role for a user on a given feed.
 * Returns 'user' if no record is found.
 */
async function getFeedRole(userDid, uri) {
    try {
        const row = await (0, db_1.db)('feed_permissions')
            .select('role')
            .where({ did: userDid, uri })
            .first();
        return row ? row.role : 'user';
    }
    catch (error) {
        console.error('Error in getFeedRole:', error);
        return 'user';
    }
}
/* Checks whether a user (identified by userDid) can perform a specified action on a feed (uri).
 */
async function canPerformAction(userDid, action, uri) {
    if (!userDid || !uri)
        return false;
    const role = await getFeedRole(userDid, uri);
    return (0, permissions_1.canPerformWithRole)(role, action);
}
/**
 * Creates a moderation log entry.
 */
async function createModerationLog(log) {
    try {
        console.log('Inserting moderation log with data:', JSON.stringify(log, null, 2));
        const result = await (0, db_1.db)('logs').insert({
            id: db_1.db.raw('gen_random_uuid()'),
            uri: log.uri,
            performed_by: log.performed_by,
            action: log.action,
            target_user_did: log.target_user_did,
            target_post_uri: log.target_post_uri,
            reason: log.reason,
            to_services: log.to_services,
            metadata: JSON.stringify(log.metadata),
            created_at: new Date().toISOString(),
        });
        console.log('Database insertion result for moderation log:', result);
    }
    catch (error) {
        console.error('Error creating moderation log:', error);
        throw error;
    }
}
/**
 * Retrieves the current role for a user on a given feed.
 * Since roles are defined per feed, we query the feed_permissions table.
 */
async function getUserRoleForFeed(userDid, uri) {
    try {
        const row = await (0, db_1.db)('feed_permissions')
            .select('role')
            .where({ did: userDid, uri })
            .first();
        return row ? row.role : 'user';
    }
    catch (error) {
        console.error('Error in getUserRoleForFeed:', error);
        return 'user';
    }
}
/**
 * Upserts a feed permission record for a target user.
 * It first checks whether the target user's profile exists (and creates one if necessary),
 * then upserts the record in the feed_permissions table, and finally logs the action. Next iteration will create the concept of an Invitation.
 * Needs front end support for onboarding with an invitation acception.
 */
async function setFeedRole(targetUserDid, uri, role, setByUserDid, feedName) {
    try {
        // 1. Check if the target user's profile exists.
        const existingProfile = await (0, db_1.db)('profiles')
            .select('*')
            .where({ did: targetUserDid })
            .first();
        // 2. If no profile exists, create a minimal profile.
        if (!existingProfile) {
            // TODO: replace with invitation logic
            const minimalProfile = {
                did: targetUserDid,
                handle: targetUserDid,
            };
            await (0, db_1.db)('profiles').insert(minimalProfile);
        }
        // 3. Upsert the feed permission record.
        await (0, db_1.db)('feed_permissions')
            .insert({
            did: targetUserDid,
            uri,
            feed_name: feedName,
            role,
            created_by: setByUserDid,
            created_at: new Date().toISOString(),
        })
            .onConflict(['did', 'uri'])
            .merge({
            feed_name: feedName,
            role,
            created_by: setByUserDid,
            created_at: new Date().toISOString(),
        });
        // 4. Create a moderation log.
        const action = role === 'mod' ? 'mod_promote' : 'mod_demote';
        await createModerationLog({
            uri,
            performed_by: setByUserDid,
            action,
            target_user_did: targetUserDid,
            metadata: { role, feed_name: feedName },
        });
        return true;
    }
    catch (error) {
        console.error('Error in setFeedRole:', error);
        return false;
    }
}
/**
 * Retrieves moderator profiles for each feed provided.
 * For each feed:
 *   - Queries the feed_permissions table for records with role = 'mod'
 *   - Groups permissions by feed URI using groupModeratorsByFeed
 *   - Uses getBulkProfileDetails to fetch full profile details for each moderator
 *   - Maps each moderator into an object matching ModeratorData:
 *         { did, uri, feed_name, role, profiles }
 *
 * @param feeds An array of Feed objects.
 * @returns A Promise that resolves to an array of objects { feed, moderators }.
 */
async function fetchFeedModsWithProfiles(feeds) {
    if (!feeds.length)
        return [];
    try {
        const feedUris = feeds.map((feed) => feed.uri);
        // Query for permissions with role 'mod' on the specified feeds.
        const permissions = await (0, db_1.db)('feed_permissions')
            .select('uri', 'did as user_did', 'feed_name', 'role')
            .whereIn('uri', feedUris)
            .andWhere({ role: 'mod' });
        if (!permissions.length) {
            return feeds.map((feed) => ({ feed, moderators: [] }));
        }
        // Group permissions by feed URI.
        const moderatorsByFeedUri = (0, permissions_1.groupModeratorsByFeed)(permissions);
        // For each feed, fetch moderator profile details and map to ModeratorData.
        const results = await Promise.all(feeds.map(async (feed) => {
            const feedPermissions = moderatorsByFeedUri[feed.uri] || [];
            const userDids = feedPermissions.map((mod) => mod.user_did);
            const profiles = await (0, permissions_1.getBulkProfileDetails)(userDids);
            // Map each fetched profile into a ModeratorData object.
            const moderators = profiles.map((profile, index) => ({
                did: profile.did,
                uri: feedPermissions[index].uri,
                feed_name: feedPermissions[index].feed_name,
                role: feedPermissions[index].role,
                profile: profile,
            }));
            return { feed, moderators };
        }));
        return results;
    }
    catch (error) {
        console.error('Error fetching moderators by feeds:', error);
        throw error;
    }
}
/**
 * Retrieves all moderator profiles for feeds where the acting admin has admin privileges.
 * Steps:
 *   1. Retrieve feed URIs from feed_permissions where the admin (adminDid) has role 'admin'.
 *   2. Query for permission records on those feeds (joined with profiles) where role is either 'mod' or 'admin'.
 *   3. Deduplicate the results by the profile DID and build ModeratorData objects.
 *
 * @param adminDid - The DID of the admin.
 * @returns A Promise that resolves to an array of ModeratorData.
 */
async function fetchModsForAdminFeeds(adminDid) {
    try {
        // Get feeds where the admin has admin role.
        const adminFeeds = await (0, db_1.db)('feed_permissions')
            .select('uri')
            .where({ did: adminDid, role: 'admin' });
        if (!adminFeeds.length)
            return [];
        const feedUris = adminFeeds.map((feed) => feed.uri);
        const rows = await (0, db_1.db)('feed_permissions')
            .select('feed_permissions.did as user_did', 'feed_permissions.uri', 'feed_permissions.feed_name', 'feed_permissions.role', 'p.did as profile_did', 'p.handle', 'p.display_name', 'p.avatar')
            .leftJoin('profiles as p', 'feed_permissions.did', 'p.did')
            .whereIn('feed_permissions.uri', feedUris)
            .andWhere(function () {
            this.where('feed_permissions.role', 'mod').orWhere('feed_permissions.role', 'admin');
        });
        if (!rows.length)
            return [];
        // Deduplicate moderator profiles and construct ModeratorData objects.
        const moderatorMap = new Map();
        for (const row of rows) {
            const key = row.profile_did;
            if (!key)
                continue;
            if (!moderatorMap.has(key)) {
                moderatorMap.set(key, {
                    did: row.profile_did,
                    uri: row.uri,
                    feed_name: row.feed_name,
                    role: row.role,
                    profile: {
                        did: row.profile_did,
                        handle: row.handle,
                        displayName: row.display_name,
                        avatar: row.avatar,
                    },
                });
            }
            else {
                const existing = moderatorMap.get(key);
                if (existing.role !== 'admin' && row.role === 'admin') {
                    existing.role = 'admin';
                    existing.uri = row.uri;
                    existing.feed_name = row.feed_name;
                }
            }
        }
        return Array.from(moderatorMap.values());
    }
    catch (error) {
        console.error('Error fetching moderators for admin:', error);
        throw error;
    }
}
function blackskyServiceGate() {
    return false;
}
