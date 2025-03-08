"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/permissions.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_controller_1 = require("../controllers/permissions.controller");
const router = (0, express_1.Router)();
// Promote a user to moderator (set their role to 'mod').
router.post('/admin/promote', auth_middleware_1.authenticateJWT, permissions_controller_1.promoteModerator);
// Demote a moderator (set their role to 'user').
router.post('/admin/demote', auth_middleware_1.authenticateJWT, permissions_controller_1.demoteModerator);
// If a "feed" query parameter is provided, lists moderators for that feed;
// otherwise, lists all moderators for the admin.
router.get('/admin/moderators', auth_middleware_1.authenticateJWT, permissions_controller_1.listModerators);
router.get('/admin/check-role', auth_middleware_1.authenticateJWT, permissions_controller_1.checkFeedRole);
exports.default = router;
