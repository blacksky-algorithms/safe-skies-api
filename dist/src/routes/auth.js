"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.get('/signin', auth_controller_1.signin);
router.get('/callback', auth_controller_1.callback);
router.post('/logout', auth_controller_1.logout);
exports.default = router;
