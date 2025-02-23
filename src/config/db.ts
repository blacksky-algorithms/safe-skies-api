import { Pool } from 'pg';
import { config } from '.';

const pool = new Pool({
  host: config.PGHOST,
  user: config.PGUSER,
  password: config.PGPASSWORD,
  database: config.PGDATABASE,
  port: config.PGPORT,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
