import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_HOST: z.string(),
  DB_NAME: z.string(),
  ENCRYPTION_KEY: z.string().min(32),
  NEXT_PUBLIC_BSKY_BASE_API_URL: z.enum(['https://bsky.social']),
  CLIENT_URL: z.string(),
});

export const config = envSchema.parse(process.env);
