"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogsController = void 0;
const logs_1 = require("../repos/logs");
const permissions_1 = require("../repos/permissions");
/**
 * GET /api/logs
 * Query parameters must include "uri" (the feed identifier).
 * Access rules:
 *  - Admins see all logs for the feed.
 *  - Moderators see only logs for actions: 'user_unban', 'user_ban', 'post_delete', 'post_restore'
 *    and the "performed_by" field is omitted.
 *  - Regular users are forbidden.
 */
const getLogsController = async (req, res) => {
    try {
        const sessionPayload = req.user;
        if (!sessionPayload) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const userDid = sessionPayload.did;
        // Construct an absolute URL using the host header.
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const url = new URL(req.url, baseUrl);
        const uri = url.searchParams.get('uri');
        if (!uri) {
            res.status(400).json({ error: 'Feed URI is required to view logs' });
            return;
        }
        // Determine the user's role for this feed.
        const role = await (0, permissions_1.getUserRoleForFeed)(userDid, uri);
        if (role === 'user') {
            res
                .status(403)
                .json({ error: 'Not authorized to view logs for this feed' });
            return;
        }
        // Build filters.
        const filters = {
            uri,
            action: url.searchParams.get('action') || undefined,
            performedBy: url.searchParams.get('performedBy') || undefined,
            targetUser: url.searchParams.get('targetUser') || undefined,
            targetPost: url.searchParams.get('targetPost') || undefined,
            sortBy: (url.searchParams.get('sortBy') || 'descending'),
            dateRange: url.searchParams.has('fromDate') && url.searchParams.has('toDate')
                ? {
                    fromDate: url.searchParams.get('fromDate'),
                    toDate: url.searchParams.get('toDate'),
                }
                : undefined,
        };
        // Fetch logs.
        let logs = await (0, logs_1.getLogs)(filters);
        // For moderators, filter logs to only show allowed actions and remove the performed_by field.
        if (role === 'mod') {
            const allowedActions = [
                'user_unban',
                'user_ban',
                'post_delete',
                'post_restore',
            ];
            logs = logs.filter((log) => allowedActions.includes(log.action));
            // Create a new type that omits performed_by
            const filteredLogs = logs.map(({ performed_by, ...rest }) => rest);
            res.json({ logs: filteredLogs });
            return;
        }
        // Admins see all logs.
        res.json({ logs });
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};
exports.getLogsController = getLogsController;
