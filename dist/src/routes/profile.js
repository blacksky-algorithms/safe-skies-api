"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const profile_controller_1 = require("../controllers/profile.controller");
const router = (0, express_1.Router)();
router.get('/profile', auth_middleware_1.authenticateJWT, profile_controller_1.getProfile);
exports.default = router;
