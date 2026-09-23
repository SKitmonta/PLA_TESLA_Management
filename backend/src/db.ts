import pg from 'pg';
import 'dotenv/config';

// Return NUMERIC as JS number and DATE as 'YYYY-MM-DD' string
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T extends pg.QueryResultRow = any>(text: string, params: unknown[] = []) {
  const res = await pool.query<T>(text, params);
  return res.rows;
}
