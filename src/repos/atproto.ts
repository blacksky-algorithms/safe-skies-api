import { AtpAgent } from "@atproto/api";

class AtpAgentSingleton {
	private static instance: AtpAgent;
	private constructor() {}
	public static getInstance(): AtpAgent {
		if (!AtpAgentSingleton.instance) {
			this.instance = new AtpAgent({
				service: process.env.BSKY_BASE_API_URL!,
			});
		}
		return this.instance;
	}
}

export const AtprotoAgent = AtpAgentSingleton.getInstance();

/**
 * Retrieves the user's actor feeds via the AtprotoAgent
 * using Bluesky's getActorFeeds endpoint.
 */
export const getActorFeeds = async (actor?: string) => {
	if (!actor) {
		return;
	}
	try {
		const response = await AtprotoAgent.app.bsky.feed.getActorFeeds({ actor });
		return response.data;
	} catch (error) {
		console.error("Error fetching feed generator data:", error);
		throw new Error("Failed to fetch feed generator data.");
	}
};
/**
 *
 * Retrieves the feed generator data for a given feed.
 * @param feed the uri
 */

export const getFeedGenerator = async (feed: string) => {
	try {
		const response = await AtprotoAgent.app.bsky.feed.getFeedGenerator({
			feed,
		});
		return response.data.view;
	} catch (error) {
		console.error("Error fetching feed generator data:", error);
		throw new Error("Failed to fetch feed generator data.");
	}
};
