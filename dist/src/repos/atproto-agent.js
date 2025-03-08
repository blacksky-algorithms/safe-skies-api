"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActorFeedsData = exports.getActorFeeds = exports.AtprotoAgent = void 0;
const api_1 = require("@atproto/api");
class AtpAgentSingleton {
    constructor() { }
    static getInstance() {
        if (!AtpAgentSingleton.instance) {
            this.instance = new api_1.AtpAgent({
                service: process.env.BSKY_BASE_API_URL,
            });
        }
        return this.instance;
    }
}
exports.AtprotoAgent = AtpAgentSingleton.getInstance();
/**
 * Retrieves the user's actor feeds via the AtprotoAgent
 * using Bluesky's getActorFeeds endpoint.
 */
const getActorFeeds = async (actor) => {
    if (!actor) {
        return;
    }
    try {
        const response = await exports.AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching feed generator data:', error);
        throw new Error('Failed to fetch feed generator data.');
    }
};
exports.getActorFeeds = getActorFeeds;
/**
 * Retrieve the actor's feeds from Bluesky.
 */
const getActorFeedsData = async (actor) => {
    try {
        const response = await exports.AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
        return response.data?.feeds || [];
    }
    catch (error) {
        console.error('Error fetching Bluesky feeds:', error);
        return [];
    }
};
exports.getActorFeedsData = getActorFeedsData;
