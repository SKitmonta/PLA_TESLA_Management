// Reset the database: drop everything, recreate tables and load sample data.
// Usage: npm run seed
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const sqlFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../../database/${name}`, import.meta.url)), 'utf8');

try {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(sqlFile('schema.sql'));
  await pool.query(sqlFile('seed.sql'));
  console.log('✔ Database reset with sample data');
} catch (err: any) {
  console.error('✘ Seed failed:', err.message);
  if (err.code === 'ECONNREFUSED') console.error('  Is PostgreSQL running? Try: npm run db');
  process.exitCode = 1;
} finally {
  await pool.end();
}
