"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrichedProfile = void 0;
exports.saveProfile = saveProfile;
exports.getProfile = getProfile;
exports.upsertProfile = upsertProfile;
// src/repos/profile.ts
const db_1 = require("../config/db");
const permissions_1 = require("../lib/utils/permissions");
const feedHelpers_1 = require("./feedHelpers");
/**
 * Saves (upserts) a user's basic profile data and feed permissions,
 * mirroring the old Next "saveProfile" approach.
 */
async function saveProfile(blueSkyProfileData, createdFeeds) {
    try {
        // 1. Upsert the "profiles" record
        await (0, db_1.db)('profiles')
            .insert({
            did: blueSkyProfileData.did,
            handle: blueSkyProfileData.handle,
            avatar: blueSkyProfileData.avatar,
            // If your table uses "display_name" for "displayName"
            display_name: blueSkyProfileData.displayName,
            associated: blueSkyProfileData.associated || null,
            labels: blueSkyProfileData.labels || null,
        })
            .onConflict('did')
            .merge({
            handle: blueSkyProfileData.handle,
            avatar: blueSkyProfileData.avatar,
            display_name: blueSkyProfileData.displayName,
            associated: blueSkyProfileData.associated || null,
            labels: blueSkyProfileData.labels || null,
        });
        // 2. Build feed permissions for newly created feeds
        // If you want to merge existing feed perms, fetch them first
        // e.g., const existingPermissions = await db('feed_permissions').where({ user_did: blueSkyProfileData.did });
        // Then pass existingPermissions into buildFeedPermissions
        const feedPermissions = (0, permissions_1.buildFeedPermissions)(blueSkyProfileData.did, createdFeeds, 
        /* existingPermissions */ []);
        // 3. Upsert new feed permissions
        if (feedPermissions.length > 0) {
            // If your table uses (did, uri) or (user_did, uri) as the unique conflict, adjust accordingly
            await (0, db_1.db)('feed_permissions')
                .insert(feedPermissions)
                .onConflict(['did', 'uri'])
                .merge();
        }
        return true;
    }
    catch (error) {
        console.error('Error in saveProfile:', error);
        return false;
    }
}
// getProfile fetches a user by DID from the 'profiles' table
async function getProfile(did) {
    try {
        const result = await (0, db_1.db)('profiles').select('*').where({ did }).first();
        if (!result)
            return null;
        return result;
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}
async function upsertProfile(profile) {
    try {
        // Map TypeScript fields to DB columns
        const dbProfile = {
            did: profile.did,
            handle: profile.handle,
            display_name: profile.displayName,
            avatar: profile.avatar,
            associated: {
                ...(profile.associated || {}),
                rolesByFeed: profile.rolesByFeed || {},
            },
            labels: profile.labels || null,
        };
        // Perform UPSERT using did as the conflict key
        await (0, db_1.db)('profiles').insert(dbProfile).onConflict('did').merge(dbProfile);
        return true;
    }
    catch (error) {
        console.error('Error upserting profile:', error);
        return false;
    }
}
const getEnrichedProfile = async (did) => {
    // 1. Retrieve the basic profile.
    const profile = await getProfile(did);
    if (!profile) {
        throw new Error('Profile not found');
    }
    // 2. Retrieve enriched feed data.
    const feedsData = await (0, feedHelpers_1.getEnrichedFeedsForUser)(did);
    // 3. Combine both into one object.
    return {
        ...profile,
        rolesByFeed: feedsData.feeds,
        defaultFeed: feedsData.defaultFeed,
    };
};
exports.getEnrichedProfile = getEnrichedProfile;
