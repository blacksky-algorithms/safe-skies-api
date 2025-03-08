"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedsByRole = void 0;
exports.getEnrichedFeedsForUser = getEnrichedFeedsForUser;
const db_1 = require("../config/db");
const constants_1 = require("../lib/constants");
const atproto_agent_1 = require("./atproto-agent");
/**
 * Fetches feeds for a given user (did) with a specific role ('mod' or 'admin').
 * If did is not provided or role === 'user', returns an empty array.
 */
const getFeedsByRole = async (did, role) => {
    if (!did || role === 'user')
        return [];
    try {
        return await (0, db_1.db)('feed_permissions')
            .select('uri', 'feed_name')
            .where({ did, role });
    }
    catch (error) {
        console.error('Error in getFeedsByRole:', error);
        return [];
    }
};
exports.getFeedsByRole = getFeedsByRole;
/**
 * Combines local feed permissions with Bluesky feed data
 * and returns an enriched feed object.
 */
/**
 * Returns enriched feed data for a user by merging local permissions with Bluesky data.
 */
async function getEnrichedFeedsForUser(userDid) {
    // Retrieve local feed permissions for both mod and admin roles.
    const [modFeeds, adminFeeds] = await Promise.all([
        (0, exports.getFeedsByRole)(userDid, 'mod'),
        (0, exports.getFeedsByRole)(userDid, 'admin'),
    ]);
    // Fetch the latest feed data from Bluesky.
    const blueskyFeeds = await (0, atproto_agent_1.getActorFeedsData)(userDid);
    const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));
    // Map the mod permissions into enriched feeds.
    const modFeedsList = modFeeds.map((feed) => {
        const bsFeed = blueskyFeedsMap.get(feed.uri);
        return {
            uri: feed.uri,
            displayName: bsFeed?.displayName || feed.feed_name,
            description: bsFeed?.description,
            did: bsFeed?.did,
            type: 'mod',
        };
    });
    // Map the admin permissions into enriched feeds.
    const adminFeedsList = adminFeeds.map((feed) => {
        const bsFeed = blueskyFeedsMap.get(feed.uri);
        return {
            uri: feed.uri,
            displayName: bsFeed?.displayName || feed.feed_name,
            description: bsFeed?.description,
            did: bsFeed?.did,
            type: 'admin',
        };
    });
    // Optionally update the local DB if the display names differ.
    const updatePromises = [...modFeeds, ...adminFeeds].map(async (feed) => {
        const bsFeed = blueskyFeedsMap.get(feed.uri);
        if (bsFeed && bsFeed.displayName !== feed.feed_name) {
            await (0, db_1.db)('feed_permissions')
                .where({ uri: feed.uri, did: userDid })
                .update({ feed_name: bsFeed.displayName });
        }
    });
    await Promise.all(updatePromises);
    // Combine both lists and remove duplicates by URI.
    const allFeeds = [...adminFeedsList, ...modFeedsList];
    const uniqueFeeds = Array.from(new Map(allFeeds.map((feed) => [feed.uri, feed])).values());
    return { feeds: uniqueFeeds, defaultFeed: constants_1.DEFAULT_FEED };
}
