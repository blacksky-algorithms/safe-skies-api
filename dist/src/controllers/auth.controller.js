"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callback = exports.logout = exports.signin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const oauth_client_1 = require("../repos/oauth-client");
const atproto_1 = require("../repos/atproto");
const permissions_1 = require("../repos/permissions");
const profile_1 = require("../repos/profile");
/**
 * Helper: Retrieve the user's Bluesky profile data by exchanging the OAuth callback parameters.
 */
const getUsersBlueskyProfileData = async (oAuthCallbackParams) => {
    const { session } = await oauth_client_1.BlueskyOAuthClient.callback(oAuthCallbackParams);
    if (!session?.sub) {
        throw new Error('Invalid session: No DID found.');
    }
    try {
        const response = await atproto_1.AtprotoAgent.getProfile({
            actor: session.sub,
        });
        if (!response.success || !response.data) {
            throw new Error('Failed to fetch profile data');
        }
        return response.data;
    }
    catch (error) {
        console.error('Error fetching profile data:', error);
        throw new Error('Failed to fetch profile data');
    }
};
/**
 * Initiates the Bluesky OAuth flow.
 * Expects a 'handle' query parameter and returns a JSON object containing the authorization URL.
 */
const signin = async (req, res) => {
    try {
        const { handle } = req.query;
        if (!handle) {
            res.status(400).json({ error: 'Handle is required' });
            return;
        }
        const url = await oauth_client_1.BlueskyOAuthClient.authorize(handle);
        res.json({ url: url.toString() });
    }
    catch (err) {
        console.error('Error initiating Bluesky auth:', err);
        res.status(500).json({ error: 'Failed to initiate authentication' });
    }
};
exports.signin = signin;
/**
 * Logs the user out by clearing the custom JWT session cookie.
 */
const logout = async (req, res) => {
    try {
        res.clearCookie('session_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (err) {
        console.error('Error in logout:', err);
        res.status(500).json({ error: 'Failed to log out' });
    }
};
exports.logout = logout;
/**
 * Handles the OAuth callback from Bluesky.
 */
const callback = async (req, res) => {
    try {
        // 1. Obtain initial profile data from Bluesky using OAuth callback parameters.
        const profileData = await getUsersBlueskyProfileData(new URLSearchParams(req.query));
        // 2. Retrieve local feed permissions for the user.
        const feedsResponse = await (0, permissions_1.getActorFeeds)(profileData.did);
        const createdFeeds = feedsResponse?.feeds || [];
        // 3. Build the initial user object merging local feed roles.
        const initialUser = {
            ...profileData,
            rolesByFeed: createdFeeds.reduce((acc, feed) => {
                if (feed.uri && feed.role) {
                    acc[feed.uri] = feed.role;
                }
                return acc;
            }, {}),
        };
        // 4. Upsert (save) the user profile along with feed permissions.
        const upsertSuccess = await (0, profile_1.saveProfile)(initialUser, createdFeeds);
        if (!upsertSuccess) {
            throw new Error('Failed to save profile data');
        }
        // 5. Retrieve the complete profile (including any feed role updates).
        const completeProfile = await (0, profile_1.getProfile)(profileData.did);
        if (!completeProfile) {
            throw new Error('Failed to retrieve complete profile');
        }
        // 6. Create a session payload and sign a JWT.
        const sessionPayload = {
            did: completeProfile.did,
            handle: completeProfile.handle,
            displayName: completeProfile.displayName,
            rolesByFeed: completeProfile.rolesByFeed || {},
        };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('Missing JWT_SECRET environment variable');
        }
        const token = jsonwebtoken_1.default.sign(sessionPayload, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        // 7. Redirect the user back to the client.
        res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
    }
    catch (err) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        res.redirect(`${process.env.CLIENT_URL}/oauth/login?error=${encodeURIComponent(errorMessage)}`);
    }
};
exports.callback = callback;
