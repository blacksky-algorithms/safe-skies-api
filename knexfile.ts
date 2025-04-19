// knexfile.ts
import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
	development: {
		client: "pg",
		connection: {
			host: process.env.PGHOST,
			user: process.env.PGUSER,
			password: process.env.PGPASSWORD,
			database: process.env.PGDATABASE,
			port: Number(process.env.PGPORT),
			ssl: false,
		},
		migrations: {
			directory: "./migrations",
			extension: "ts",
		},
	},

	production: {
		client: "pg",
		connection: {
			host: process.env.PGHOST,
			user: process.env.PGUSER,
			password: process.env.PGPASSWORD,
			database: process.env.PGDATABASE,
			port: Number(process.env.PGPORT),
			ssl: { rejectUnauthorized: false },
		},
		migrations: {
			directory: "./migrations",
			extension: "ts",
		},
		pool: {
			min: 2,
			max: 10,
		},
	},
};

export default config;
