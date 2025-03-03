"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrichedFeedsForUser = exports.getActorFeedsData = exports.getFeedsByRole = void 0;
// src/repos/feedHelpers.ts
const db_1 = require("../config/db");
const atproto_agent_1 = require("./atproto-agent");
const constants_1 = require("../lib/constants");
/**
 * Retrieve local feed permissions from the database.
 */
const getFeedsByRole = async (did, role) => {
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
 * Retrieve the actor's feeds from Bluesky.
 */
const getActorFeedsData = async (actor) => {
    try {
        const response = await atproto_agent_1.AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
        return response.data?.feeds || [];
    }
    catch (error) {
        console.error('Error fetching Bluesky feeds:', error);
        return [];
    }
};
exports.getActorFeedsData = getActorFeedsData;
/**
 * Combines local feed permissions with Bluesky feed data
 * and returns an enriched feed object.
 */
const getEnrichedFeedsForUser = async (userDid) => {
    // Retrieve 'mod' and 'admin' feeds from your database.
    const [modFeeds, adminFeeds] = await Promise.all([
        (0, exports.getFeedsByRole)(userDid, 'mod'),
        (0, exports.getFeedsByRole)(userDid, 'admin'),
    ]);
    // Get feeds data from Bluesky.
    const blueskyFeeds = await (0, exports.getActorFeedsData)(userDid);
    // Create a Map for quick lookup from Bluesky feeds.
    const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));
    // Merge and format mod feeds.
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
    // Merge and format admin feeds.
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
    // Combine both lists and remove duplicates.
    const allFeeds = [...adminFeedsList, ...modFeedsList];
    const uniqueFeeds = Array.from(new Map(allFeeds.map((feed) => [feed.uri, feed])).values());
    return { feeds: uniqueFeeds, defaultFeed: constants_1.DEFAULT_FEED };
};
exports.getEnrichedFeedsForUser = getEnrichedFeedsForUser;
