import knex from "knex";
import { config } from ".";

export const db = knex({
	client: "pg",
	connection: {
		host: config.PGHOST,
		user: config.PGUSER,
		password: config.PGPASSWORD,
		database: config.PGDATABASE,
		port: config.PGPORT,
		ssl:
			config.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
	},
	pool: {
		min: 2,
		max: 10,
		afterCreate: (
			conn: { on: (arg0: string, arg1: (err: Error) => never) => void },
			done: () => void,
		) => {
			conn.on("error", (err: Error) => {
				console.error("Unexpected database error:", err);
				process.exit(-1);
			});
			done();
		},
	},
});
