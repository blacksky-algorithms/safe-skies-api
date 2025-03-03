import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PGPORT: z.string().transform(Number),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGHOST: z.string(),
  PGDATABASE: z.string(),
  ENCRYPTION_KEY: z.string().min(32),
  BS_BASE_URL: z.enum(['https://bsky.social']),
  CLIENT_URL: z.string(),
  PORT: z.string().transform(Number),
});

export const config = envSchema.parse(process.env);
