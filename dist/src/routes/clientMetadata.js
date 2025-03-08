"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_config_1 = require("../lib/constants/oauth-config");
const router = (0, express_1.Router)();
router.get('/client-metadata.json', (req, res) => {
    res.header('Content-Type', 'application/json');
    res.json(oauth_config_1.BLUE_SKY_CLIENT_META_DATA);
});
exports.default = router;
