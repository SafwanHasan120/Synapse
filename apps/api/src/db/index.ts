import { Pool } from 'pg';
import { config } from '../config.js';

export const pool = new Pool({
  connectionString:      config.DATABASE_URL,
  max:                   10,
  idleTimeoutMillis:     30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
  process.exit(-1);
});

// Typed query helper — returns rows as T[]
export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

// Returns first row or null
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Wraps multiple queries in a transaction
export async function withTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}