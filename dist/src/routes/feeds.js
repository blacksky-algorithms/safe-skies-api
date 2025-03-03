"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/feeds.ts
const express_1 = require("express");
const feed_controller_1 = require("../controllers/feed.controller");
const router = (0, express_1.Router)();
router.get('/user-feeds', feed_controller_1.getUserFeeds);
exports.default = router;
