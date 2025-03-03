"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/permissions.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_controller_1 = require("../controllers/permissions.controller");
const router = (0, express_1.Router)();
router.post('/promote', auth_middleware_1.authenticateJWT, permissions_controller_1.promoteModerator);
router.post('/demote', auth_middleware_1.authenticateJWT, permissions_controller_1.demoteModerator);
exports.default = router;
