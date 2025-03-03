"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dev_only_middleware_1 = require("../middleware/dev-only.middleware");
const dev_controller_1 = require("../controllers/dev.controller");
const router = (0, express_1.Router)();
router.post('/login', dev_only_middleware_1.developmentOnly, dev_controller_1.devLogin);
exports.default = router;
