"use strict";
// src/controllers/feed.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFeeds = exports.getActorFeeds = void 0;
const atproto_agent_1 = require("../repos/atproto-agent");
const constants_1 = require("../lib/constants");
const db_1 = require("../config/db"); // Replacing the old `query` import
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
/**
 * Retrieves the user's actor feeds via the AtprotoAgent
 * using Bluesky's getActorFeeds endpoint.
 */
const getActorFeeds = async (actor) => {
    if (!actor) {
        return;
    }
    try {
        const response = await atproto_agent_1.AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching feed generator data:', error);
        throw new Error('Failed to fetch feed generator data.');
    }
};
exports.getActorFeeds = getActorFeeds;
/**
 * Handles a GET request to fetch a user's local feed permissions,
 * merges them with the latest data from Bluesky,
 * and optionally updates local feed data if there's a mismatch.
 */
const getUserFeeds = async (req, res) => {
    const userDid = req.query.userDid;
    // If userDid is missing, return an empty feed list and the default feed
    if (!userDid) {
        res.json({ feeds: [], defaultFeed: constants_1.DEFAULT_FEED });
        return;
    }
    try {
        // 1. Retrieve 'mod' and 'admin' feed permissions for this user
        const [modFeeds, adminFeeds] = await Promise.all([
            getFeedsByRole(userDid, 'mod'),
            getFeedsByRole(userDid, 'admin'),
        ]);
        // 2. Fetch the user's feed data from Bluesky (optionally requires auth)
        const blueskyFeedsResponse = await (0, exports.getActorFeeds)(userDid);
        const blueskyFeeds = blueskyFeedsResponse?.feeds || [];
        // 3. Create a Map of feed URIs to Bluesky feed objects for quick lookup
        const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));
        // 4. Merge the local database permissions with the Bluesky data
        // Build lists for 'mod' feeds and 'admin' feeds
        const modFeedsList = modFeeds.map((feed) => {
            const blueskyFeed = blueskyFeedsMap.get(feed.uri);
            return {
                uri: feed.uri,
                displayName: blueskyFeed?.displayName || feed.feed_name,
                description: blueskyFeed?.description,
                did: blueskyFeed?.did,
                type: 'mod',
            };
        });
        const adminFeedsList = adminFeeds.map((feed) => {
            const blueskyFeed = blueskyFeedsMap.get(feed.uri);
            return {
                uri: feed.uri,
                displayName: blueskyFeed?.displayName || feed.feed_name,
                description: blueskyFeed?.description,
                did: blueskyFeed?.did,
                type: 'admin',
            };
        });
        // 5. Update the local 'feed_permissions' table with the latest displayName from Bluesky if different
        await Promise.all([
            ...modFeeds.map(async (feed) => {
                const blueskyFeed = blueskyFeedsMap.get(feed.uri);
                if (blueskyFeed && blueskyFeed.displayName !== feed.feed_name) {
                    // Equivalent to: UPDATE feed_permissions SET feed_name = ? WHERE uri = ? AND did = ?
                    await (0, db_1.db)('feed_permissions')
                        .where({ uri: feed.uri, did: userDid })
                        .update({ feed_name: blueskyFeed.displayName });
                }
            }),
            ...adminFeeds.map(async (feed) => {
                const blueskyFeed = blueskyFeedsMap.get(feed.uri);
                if (blueskyFeed && blueskyFeed.displayName !== feed.feed_name) {
                    await (0, db_1.db)('feed_permissions')
                        .where({ uri: feed.uri, did: userDid })
                        .update({ feed_name: blueskyFeed.displayName });
                }
            }),
        ]);
        // Combine both feed lists, removing duplicates by URI
        const allFeeds = [...adminFeedsList, ...modFeedsList];
        const uniqueFeeds = Array.from(new Map(allFeeds.map((feed) => [feed.uri, feed])).values());
        // Return the feed list and the default feed
        res.json({
            feeds: uniqueFeeds,
            defaultFeed: constants_1.DEFAULT_FEED,
        });
    }
    catch (error) {
        console.error('Error fetching user feeds:', error);
        res.status(500).json({
            error: 'Failed to fetch user feeds',
            feeds: [],
            defaultFeed: constants_1.DEFAULT_FEED,
        });
    }
};
exports.getUserFeeds = getUserFeeds;
