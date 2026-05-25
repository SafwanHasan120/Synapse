import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './index.js';

// Avoid using import.meta.url so this file can be compiled to CommonJS.
// Determine migrations path relative to project root (process.cwd()).
const migrationsDir = join(process.cwd(), 'src', 'db', 'migrations');

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    const sqlPath = join(migrationsDir, '001_initial.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    console.log('Running 001_initial.sql...');
    await client.query(sql);
    console.log('✓ Migration complete.');
  } catch (err) {
    console.error('✗ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));