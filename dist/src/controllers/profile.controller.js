"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = void 0;
const profile_1 = require("../repos/profile");
const getProfile = async (req, res) => {
    try {
        const userDid = req.user?.did;
        if (!userDid) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const enrichedProfile = await (0, profile_1.getEnrichedProfile)(userDid);
        res.status(200).json({ profile: enrichedProfile });
    }
    catch (error) {
        console.error('Error fetching enriched profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
