"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportModerationEvents = exports.getModerationServices = exports.getReportOptions = void 0;
const moderation_1 = require("../repos/moderation");
const permissions_1 = require("../repos/permissions");
const getReportOptions = async (req, res) => {
    try {
        const options = await (0, moderation_1.fetchReportOptions)();
        res.status(200).json({ options });
        return;
    }
    catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReportOptions = getReportOptions;
const getModerationServices = async (req, res) => {
    try {
        const actingUser = req.user;
        if (!actingUser) {
            res.status(401).json({ error: 'Unauthorized: No valid session' });
            return;
        }
        const allServices = await (0, moderation_1.fetchModerationServices)();
        const services = allServices.filter((service) => {
            if (service.value === 'blacksky') {
                return (0, permissions_1.blackskyServiceGate)();
            }
            if (service.value === 'ozone') {
                return true;
            }
            return false;
        });
        res.status(200).json({ services });
    }
    catch (error) {
        console.error('Error in getModerationServices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getModerationServices = getModerationServices;
/**
 * Processes a bulk array of moderation reports. For each report, we:
 */
const reportModerationEvents = async (req, res) => {
    try {
        // Use the authenticated user's DID as performed_by.
        const actingUser = req.user;
        if (!actingUser) {
            console.error('No acting user found in request.');
            res.status(401).json({ error: 'Unauthorized: No valid session' });
            return;
        }
        // Ensure the request body is an array. If not, wrap it.
        let reports = req.body;
        if (!Array.isArray(reports)) {
            reports = [reports];
        }
        const summary = await Promise.all(reports.map(async (report, idx) => {
            const payload = {
                targetedPostUri: report.targetedPostUri,
                reason: report.reason,
                toServices: report.toServices,
                targetedUserDid: report.targetedUserDid,
                uri: report.uri,
                feedName: report.feedName,
                additionalInfo: report.additionalInfo || '',
                action: report.action,
                targetedPost: report.targetedPost,
                targetedProfile: report.targetedProfile,
                performed_by: actingUser.did,
            };
            const resultDetails = [];
            if (payload.toServices.some((s) => s.value === 'blacksky')) {
                if ((0, permissions_1.blackskyServiceGate)()) {
                    try {
                        const blackskyResult = await (0, moderation_1.reportToBlacksky)([
                            { uri: payload.targetedPostUri },
                        ]);
                        resultDetails.push({
                            service: 'blacksky',
                            result: blackskyResult,
                        });
                    }
                    catch (bsError) {
                        console.error(`Report ${idx}: Error reporting to Blacksky:`, bsError);
                        resultDetails.push({
                            service: 'blacksky',
                            error: bsError.message,
                        });
                    }
                }
                else {
                    console.warn(`Report ${idx}: Blacksky service gate not passed.`);
                    resultDetails.push({
                        service: 'blacksky',
                        error: 'Service gate not passed',
                    });
                }
            }
            if (payload.toServices.some((s) => s.value === 'ozone')) {
                try {
                    const ozoneResult = await (0, moderation_1.reportToOzone)();
                    resultDetails.push({ service: 'ozone', result: ozoneResult });
                }
                catch (ozError) {
                    console.error(`Report ${idx}: Error reporting to Ozone:`, ozError);
                    resultDetails.push({ service: 'ozone', error: ozError.message });
                }
            }
            try {
                await (0, permissions_1.createModerationLog)({
                    uri: payload.uri,
                    performed_by: actingUser.did,
                    action: payload.action,
                    target_user_did: payload.targetedUserDid,
                    metadata: {
                        reason: payload.reason,
                        feedName: payload.feedName,
                        additionalInfo: payload.additionalInfo,
                        targetedPost: payload.targetedPost,
                        targetedProfile: payload.targetedProfile,
                    },
                    target_post_uri: payload.targetedPostUri,
                });
                resultDetails.push({ service: 'log', result: 'logged' });
            }
            catch (logError) {
                console.error(`Report ${idx}: Error creating moderation log:`, logError);
                resultDetails.push({ service: 'log', error: logError.message });
            }
            return { report: payload, status: 'success', details: resultDetails };
        }));
        res.json({ summary });
    }
    catch (error) {
        console.error('Error reporting moderation events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.reportModerationEvents = reportModerationEvents;
