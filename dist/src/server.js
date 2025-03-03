"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const clientMetadata_1 = __importDefault(require("./routes/clientMetadata"));
const feeds_1 = __importDefault(require("./routes/feeds"));
const dev_1 = __importDefault(require("./routes/dev"));
const profile_1 = __importDefault(require("./routes/profile"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const logs_1 = __importDefault(require("./routes/logs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Incoming request: ${req.method} ${req.url}`);
    }
    next();
});
app.use('/auth', auth_1.default);
app.use('/oauth', clientMetadata_1.default);
app.use('/feeds', feeds_1.default);
app.use('/api', profile_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/logs', logs_1.default);
if (process.env.NODE_ENV === 'development') {
    app.use('/dev', dev_1.default);
}
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
