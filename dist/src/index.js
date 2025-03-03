"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
// import { router } from './routes';
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.disable('x-powered-by');
// Request logging
app.use((0, morgan_1.default)(config_1.config.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Rate limiting
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
}));
// Routes
// app.use('/api', router);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.listen(config_1.config.PORT, () => {
    console.log(`Server running in ${config_1.config.NODE_ENV} mode on port ${config_1.config.PORT}`);
});
