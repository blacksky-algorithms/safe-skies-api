"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: Number(process.env.PGPORT),
            ssl: false,
        },
        migrations: {
            directory: './migrations',
            extension: 'ts',
        },
    },
    production: {
        client: 'pg',
        connection: {
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: Number(process.env.PGPORT),
            ssl: { rejectUnauthorized: false },
        },
        migrations: {
            directory: './migrations',
            extension: 'ts',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
};
exports.default = config;
