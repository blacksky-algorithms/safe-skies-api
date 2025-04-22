import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	PGPORT: z.string().transform(Number),
	PGUSER: z.string(),
	PGPASSWORD: z.string(),
	PGHOST: z.string(),
	PGDATABASE: z.string(),
	ENCRYPTION_KEY: z.string().min(32),
	BSKY_BASE_API_URL: z.enum(["https://api.bsky.app"]),
	CLIENT_URL: z.string(),
	PORT: z.string().transform(Number),
	RSKY_FEEDGEN: z.string(),
	RSKY_API_KEY: z.string(),
});

export const config = envSchema.parse(process.env);
