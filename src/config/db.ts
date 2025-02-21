import { Pool } from 'pg';
import { config } from '.';

const pool = new Pool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: 5432,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
