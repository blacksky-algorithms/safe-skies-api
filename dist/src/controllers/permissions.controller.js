"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFeedRole = exports.listModerators = exports.demoteModerator = exports.promoteModerator = void 0;
const permissions_1 = require("../repos/permissions");
const promoteModerator = async (req, res) => {
    try {
        // The authentication middleware should have set req.user.
        const actingUser = req.user;
        if (!actingUser) {
            res.status(401).json({ error: 'Unauthorized: No valid session' });
            return;
        }
        // Extract required fields from the request body.
        const { targetUserDid, uri, feedName } = req.body;
        if (!targetUserDid || !uri || !feedName) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        // Check if the acting user can perform a promotion.
        const hasPermission = await (0, permissions_1.canPerformAction)(actingUser.did, 'mod_promote', uri);
        if (!hasPermission) {
            res
                .status(403)
                .json({ error: 'Insufficient permissions to promote moderator' });
            return;
        }
        // Update the role for the target user to "mod".
        const success = await (0, permissions_1.setFeedRole)(targetUserDid, uri, 'mod', actingUser.did, feedName);
        if (!success) {
            res.status(500).json({ error: 'Failed to promote moderator' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error in promoteModerator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.promoteModerator = promoteModerator;
const demoteModerator = async (req, res) => {
    try {
        // The authentication middleware should have set req.user.
        const actingUser = req.user;
        if (!actingUser) {
            res.status(401).json({ error: 'Unauthorized: No valid session' });
            return;
        }
        // Extract required fields from the request body.
        const { modDid, uri, feedName } = req.body;
        if (!modDid || !uri || !feedName) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        // Check if the acting user can perform a demotion.
        const hasPermission = await (0, permissions_1.canPerformAction)(actingUser.did, 'mod_demote', uri);
        if (!hasPermission) {
            res
                .status(403)
                .json({ error: 'Insufficient permissions to demote moderator' });
            return;
        }
        // Update the role for the target moderator to "user".
        const success = await (0, permissions_1.setFeedRole)(modDid, uri, 'user', actingUser.did, feedName);
        if (!success) {
            res.status(500).json({ error: 'Failed to demote moderator' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error in demoteModerator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.demoteModerator = demoteModerator;
/**
 * - If a "feed" query parameter is provided (as a string feed URI), then the function
 *   first checks that the acting user has admin privileges on that feed. If so, it returns
 *   the moderators for that specific feed.
 * - If no "feed" parameter is provided, then it returns all moderator profiles for feeds
 *   where the acting admin (from the JWT) has admin privileges.
 */
const listModerators = async (req, res) => {
    try {
        const actingUser = req.user;
        if (!actingUser) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const feedParam = req.query.feed;
        if (feedParam && typeof feedParam === 'string') {
            // Verify the acting user is an admin for the requested feed.
            const actingUserRole = await (0, permissions_1.getFeedRole)(actingUser.did, feedParam);
            if (actingUserRole !== 'admin') {
                res
                    .status(403)
                    .json({
                    error: 'Insufficient permissions: Only admins can view moderators for this feed.',
                });
                return;
            }
            // If the acting user is admin, get the moderators for that feed.
            const result = await (0, permissions_1.getModeratorsByFeeds)([{ uri: feedParam }]);
            const moderators = result.length ? result[0].moderators : [];
            res.json({ moderators });
        }
        else {
            // No feed provided – list moderators for all feeds where the acting user has admin privileges.
            const moderators = await (0, permissions_1.getAllModeratorsForAdmin)(actingUser.did);
            res.json({ moderators });
        }
    }
    catch (error) {
        console.error('Error in listModerators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.listModerators = listModerators;
const checkFeedRole = async (req, res) => {
    try {
        // Ensure the acting user is authenticated.
        const actingUser = req.user;
        if (!actingUser) {
            res.status(401).json({ error: 'Unauthorized: No valid session' });
            return;
        }
        // Extract query parameters.
        const { targetDid, uri } = req.query;
        if (!targetDid ||
            typeof targetDid !== 'string' ||
            !uri ||
            typeof uri !== 'string') {
            res.status(400).json({
                error: 'Missing or invalid parameters: targetDid and uri are required.',
            });
            return;
        }
        // Verify that the acting user has admin privileges on the feed.
        const actingUserRole = await (0, permissions_1.getFeedRole)(actingUser.did, uri);
        if (actingUserRole !== 'admin') {
            res.status(403).json({
                error: 'Insufficient permissions: Only admins can check feed roles.',
            });
            return;
        }
        // Retrieve the role for the target user on the specified feed.
        const targetUserRole = await (0, permissions_1.getFeedRole)(targetDid, uri);
        res.json({ role: targetUserRole });
    }
    catch (error) {
        console.error('Error checking feed role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkFeedRole = checkFeedRole;
