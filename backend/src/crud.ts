import { Router, type Request } from 'express';
import { z } from 'zod';
import { query } from './db.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function parseId(req: Request): number {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id');
  return id;
}

export const statusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']);

interface CrudOptions<S extends z.ZodObject> {
  table: string;
  schema: S;
  /** Columns searched by ?q= */
  searchColumns: string[];
  /** Custom SELECT for list/get; must expose the table as alias `t` */
  select?: string;
}

/** Generic list / get / create / update / delete router for a single table. */
export function crudRouter<S extends z.ZodObject>(opts: CrudOptions<S>) {
  const router = Router();
  const select = opts.select ?? `SELECT t.* FROM ${opts.table} t`;
  const fields = Object.keys(opts.schema.shape);

  router.get('/', async (req, res) => {
    const where: string[] = [];
    const params: unknown[] = [];
    const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
    if (q) {
      params.push(`%${q}%`);
      where.push('(' + opts.searchColumns.map((c) => `t.${c} ILIKE $1`).join(' OR ') + ')');
    }
    const status = req.query['status'];
    if (typeof status === 'string' && statusSchema.safeParse(status).success) {
      params.push(status);
      where.push(`t.status = $${params.length}`);
    }
    const sql = `${select} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.id DESC`;
    res.json(await query(sql, params));
  });

  router.get('/:id', async (req, res) => {
    const rows = await query(`${select} WHERE t.id = $1`, [parseId(req)]);
    if (!rows.length) throw new HttpError(404, 'Not found');
    res.json(rows[0]);
  });

  router.post('/', async (req, res) => {
    const data = opts.schema.parse(req.body) as Record<string, unknown>;
    const cols = fields.filter((f) => data[f] !== undefined);
    const sql = `INSERT INTO ${opts.table} (${cols.join(', ')})
                 VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
    const rows = await query(sql, cols.map((c) => data[c]));
    res.status(201).json(rows[0]);
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req);
    const data = opts.schema.partial().parse(req.body) as Record<string, unknown>;
    const cols = fields.filter((f) => data[f] !== undefined);
    if (!cols.length) throw new HttpError(400, 'No fields to update');
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const rows = await query(
      `UPDATE ${opts.table} SET ${sets}, updated_at = now() WHERE id = $${cols.length + 1} RETURNING *`,
      [...cols.map((c) => data[c]), id],
    );
    if (!rows.length) throw new HttpError(404, 'Not found');
    res.json(rows[0]);
  });

  router.delete('/:id', async (req, res) => {
    const rows = await query(`DELETE FROM ${opts.table} WHERE id = $1 RETURNING id`, [parseId(req)]);
    if (!rows.length) throw new HttpError(404, 'Not found');
    res.status(204).end();
  });

  return router;
}
