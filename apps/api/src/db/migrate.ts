import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './index.js';

// Avoid using import.meta.url so this file can be compiled to CommonJS.
// Determine migrations path relative to project root (process.cwd()).
const migrationsDir = join(process.cwd(), 'src', 'db', 'migrations');

// All migrations run in order on a fresh schema
const MIGRATIONS = [
  '001_initial.sql',
  '002_context_units.sql',
];

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const file of MIGRATIONS) {
      const sql = readFileSync(
        join(migrationsDir, file),
        'utf8'
      );
      console.log(`Running ${file}...`);
      await client.query(sql);
      console.log(`✓ ${file} complete.`);
    }
  } catch (err) {
    console.error('✗ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
