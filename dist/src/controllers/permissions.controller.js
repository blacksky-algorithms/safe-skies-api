"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoteModerator = exports.promoteModerator = void 0;
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
