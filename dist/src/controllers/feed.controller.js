"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFeeds = void 0;
const constants_1 = require("../lib/constants");
const feed_1 = require("../repos/feed");
/**
 * Handles a GET request to fetch a user's local feed permissions,
 * merges them with the latest data from Bluesky,
 * and optionally updates local feed data if there's a mismatch.
 */
const getUserFeeds = async (req, res) => {
    // Extract the user DID from query parameters.
    const userDid = req.query.userDid;
    if (!userDid) {
        res.json({ feeds: [], defaultFeed: constants_1.DEFAULT_FEED });
        return;
    }
    try {
        // Delegate the heavy lifting to the repository function.
        const data = await (0, feed_1.getEnrichedFeedsForUser)(userDid);
        res.json(data);
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
