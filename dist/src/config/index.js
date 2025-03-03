"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']),
    PGPORT: zod_1.z.string().transform(Number),
    PGUSER: zod_1.z.string(),
    PGPASSWORD: zod_1.z.string(),
    PGHOST: zod_1.z.string(),
    PGDATABASE: zod_1.z.string(),
    ENCRYPTION_KEY: zod_1.z.string().min(32),
    BS_BASE_URL: zod_1.z.enum(['https://bsky.social']),
    CLIENT_URL: zod_1.z.string(),
    PORT: zod_1.z.string().transform(Number),
});
exports.config = envSchema.parse(process.env);
