"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const knex_1 = __importDefault(require("knex"));
const _1 = require(".");
exports.db = (0, knex_1.default)({
    client: 'pg',
    connection: {
        host: _1.config.PGHOST,
        user: _1.config.PGUSER,
        password: _1.config.PGPASSWORD,
        database: _1.config.PGDATABASE,
        port: _1.config.PGPORT,
        ssl: _1.config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
        min: 2,
        max: 10,
        // Handle connection errors
        afterCreate: (conn, done) => {
            conn.on('error', (err) => {
                console.error('Unexpected database error:', err);
                process.exit(-1);
            });
            done();
        },
    },
});
