import { DEFAULT_FEED } from "../lib/constants";
import { UserRole } from "../lib/types/permission";
import { getActorFeeds } from "./atproto";
import { getFeedGenerator } from "./atproto";
import { db } from "../config/db";
import { createFeedGenLog } from "./logs";
import { GeneratorView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

/**
 * Fetches feeds for a given user (did) with a specific role ('mod' or 'admin').
 * If did is not provided or role === 'user', returns an empty array.
 */
export const getFeedsByRole = async (
	did: string | undefined,
	role: UserRole,
) => {
	if (!did || role === "user") return [];
	try {
		return await db("feed_permissions")
			.select("uri", "feed_name", "admin_did")
			.where({ did, role });
	} catch (error) {
		console.error("Error in getFeedsByRole:", error);
		return [];
	}
};

/**
 * Helper to update a feed’s display name in the local DB and record the change.
 * This is used for both mod and admin feeds.
 */
export async function updateFeedNameIfChanged(
	did: string,
	uri: string,
	localName: string,
	newName: string,
): Promise<void> {
	if (newName !== localName) {
		await db("feed_permissions")
			.where({ did, uri })
			.update({ feed_name: newName });
		await createFeedGenLog({
			uri,
			previous: localName,
			current: newName,
			metadata: { updatedBy: "BlueSky" },
		});
	}
}

/**
 * Process an admin feed: verify BlueSky confirms the feed exists.
 * If BlueSky data exists and its display name differs from the local record,
 * update the local record (and log the change). If BlueSky data is missing,
 * return the permission demoted to 'user'.
 */
export async function processAdminFeed(
	feed: { uri: string; feed_name: string },
	did: string,
	blueskyFeedsMap: Map<string, GeneratorView>,
): Promise<{
	uri: string;
	displayName?: string;
	description?: string;
	did?: string;
	type: UserRole;
}> {
	const bsFeed = blueskyFeedsMap.get(feed.uri);
	if (!bsFeed) {
		// BlueSky does not confirm this admin feed; demote to 'user'.
		return {
			uri: feed.uri,
			displayName: feed.feed_name,
			description: undefined,
			did: undefined,
			type: "user",
		};
	}
	// If display name differs, update and log.
	await updateFeedNameIfChanged(
		did,
		feed.uri,
		feed.feed_name,
		bsFeed.displayName,
	);
	return {
		uri: feed.uri,
		displayName: bsFeed.displayName,
		description: bsFeed.description,
		did: bsFeed.did,
		type: "admin",
	};
}

/**
 * Process a mod feed: attempt to fetch generator data and update if needed.
 */
export async function processModFeed(
	feed: { uri: string; feed_name: string },
	did: string,
): Promise<{
	uri: string;
	displayName?: string;
	description?: string;
	did?: string;
	type: UserRole;
}> {
	try {
		const generatorData = await getFeedGenerator(feed.uri);
		if (generatorData && generatorData.displayName) {
			await updateFeedNameIfChanged(
				did,
				feed.uri,
				feed.feed_name,
				generatorData.displayName,
			);
			return {
				uri: feed.uri,
				displayName: generatorData.displayName,
				description: generatorData.description,
				did: generatorData.did,
				type: "mod",
			};
		}
		return {
			uri: feed.uri,
			displayName: feed.feed_name,
			description: undefined,
			did: undefined,
			type: "mod",
		};
	} catch (error) {
		// On error, fall back to local data.
		console.error("Error fetching feed generator data:", error);
		return {
			uri: feed.uri,
			displayName: feed.feed_name,
			description: undefined,
			did: undefined,
			type: "mod",
		};
	}
}

/**
 * Returns enriched feed data for a user by merging local permissions with BlueSky data.
 * - For admin feeds: verifies that the feed appears in BlueSky’s created feeds; if so, updates
 *   the display name if needed; otherwise, demotes it to 'user'.
 * - For mod feeds: uses getFeedGenerator to check and update the local feed name if needed.
 */
export async function getEnrichedFeedsForUser(userDid: string): Promise<{
	feeds: {
		uri: string;
		displayName?: string;
		description?: string;
		type: UserRole;
	}[];
	defaultFeed: typeof DEFAULT_FEED;
}> {
	// Retrieve local permissions for mod and admin roles.
	const [modFeeds, adminFeeds] = await Promise.all([
		getFeedsByRole(userDid, "mod"),
		getFeedsByRole(userDid, "admin"),
	]);

	// Fetch BlueSky created feeds.
	const actorResponse = await getActorFeeds(userDid);
	const blueskyFeeds = actorResponse?.feeds || [];
	const blueskyFeedsMap = new Map(blueskyFeeds.map((feed) => [feed.uri, feed]));

	// Process feeds.
	const enrichedAdminFeeds = await Promise.all(
		adminFeeds.map((feed) => processAdminFeed(feed, userDid, blueskyFeedsMap)),
	);
	const enrichedModFeeds = await Promise.all(
		modFeeds.map((feed) => processModFeed(feed, userDid)),
	);

	// Combine and deduplicate feeds by URI.
	const combinedFeeds = [...enrichedAdminFeeds, ...enrichedModFeeds];
	const uniqueFeeds = Array.from(
		new Map(combinedFeeds.map((feed) => [feed.uri, feed])).values(),
	);

	return { feeds: uniqueFeeds, defaultFeed: DEFAULT_FEED };
}
