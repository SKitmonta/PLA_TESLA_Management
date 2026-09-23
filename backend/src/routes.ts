import { Router } from 'express';
import { z } from 'zod';
import { pool, query } from './db.js';
import { crudRouter, HttpError, parseId, statusSchema } from './crud.js';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = z.string().trim().nullish();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const packagesRouter = crudRouter({
  table: 'packages',
  searchColumns: ['code', 'name'],
  schema: z.object({
    code: text(30),
    name: text(150),
    description: optionalText,
    price: z.coerce.number().min(0),
    status: statusSchema.optional(),
  }),
});

export const campaignsRouter = crudRouter({
  table: 'campaigns',
  searchColumns: ['code', 'name'],
  schema: z.object({
    code: text(30),
    name: text(150),
    description: optionalText,
    discount_type: z.enum(['PERCENT', 'AMOUNT', 'NONE']).optional(),
    discount_value: z.coerce.number().min(0).optional(),
    start_date: isoDate,
    end_date: isoDate,
    status: statusSchema.optional(),
  }),
});

export const agentsRouter = crudRouter({
  table: 'agents',
  searchColumns: ['code', 'name', 'email'],
  select: `SELECT t.*, COALESCE(
             (SELECT json_agg(json_build_object('id', g.id, 'name', g.name) ORDER BY g.name)
                FROM agent_group_members m JOIN agent_groups g ON g.id = m.group_id
               WHERE m.agent_id = t.id), '[]') AS groups
           FROM agents t`,
  schema: z.object({
    code: text(30),
    name: text(150),
    email: z.union([z.email(), z.literal('')]).nullish().transform((v) => (v === '' ? null : v)),
    phone: optionalText,
    status: statusSchema.optional(),
  }),
});

// Agent groups: CRUD + member management
const groupCrud = crudRouter({
  table: 'agent_groups',
  searchColumns: ['code', 'name'],
  select: `SELECT t.*,
             COALESCE((SELECT array_agg(m.agent_id ORDER BY m.agent_id)
                         FROM agent_group_members m WHERE m.group_id = t.id), '{}') AS agent_ids
           FROM agent_groups t`,
  schema: z.object({
    code: text(30),
    name: text(150),
    description: optionalText,
    status: statusSchema.optional(),
  }),
});

export const agentGroupsRouter = Router();
agentGroupsRouter.put('/:id/members', async (req, res) => {
  const id = parseId(req);
  const { agent_ids } = z.object({ agent_ids: z.array(z.number().int().positive()) }).parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT 1 FROM agent_groups WHERE id = $1 FOR UPDATE', [id]);
    if (!found.rowCount) throw new HttpError(404, 'Not found');
    await client.query('DELETE FROM agent_group_members WHERE group_id = $1', [id]);
    if (agent_ids.length) {
      await client.query(
        'INSERT INTO agent_group_members (group_id, agent_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING',
        [id, agent_ids],
      );
    }
    await client.query('UPDATE agent_groups SET updated_at = now() WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  res.json({ id, agent_ids });
});
agentGroupsRouter.use(groupCrud);

export const combinationsRouter = crudRouter({
  table: 'combinations',
  searchColumns: ['name'],
  select: `SELECT t.*, p.name AS package_name, p.price AS package_price,
             g.name AS agent_group_name, c.name AS campaign_name,
             c.discount_type, c.discount_value,
             (SELECT count(*)::int FROM agent_group_members m WHERE m.group_id = t.agent_group_id) AS agent_count
           FROM combinations t
           JOIN packages p ON p.id = t.package_id
           JOIN agent_groups g ON g.id = t.agent_group_id
           LEFT JOIN campaigns c ON c.id = t.campaign_id`,
  schema: z.object({
    name: text(150),
    package_id: z.number().int().positive(),
    agent_group_id: z.number().int().positive(),
    campaign_id: z.number().int().positive().nullable().optional(),
    status: statusSchema.optional(),
    note: optionalText,
  }),
});

export const dashboardRouter = Router();
dashboardRouter.get('/', async (_req, res) => {
  const countBy = (table: string) =>
    query(`SELECT count(*)::int AS total,
                  count(*) FILTER (WHERE status = 'ACTIVE')::int AS active
             FROM ${table}`).then((r) => r[0]);

  const [packages, campaigns, agents, groups, combinations, campaignTimeline, topGroups, packageUsage, recent] =
    await Promise.all([
      countBy('packages'),
      countBy('campaigns'),
      countBy('agents'),
      countBy('agent_groups'),
      countBy('combinations'),
      query(`SELECT id, code, name, start_date, end_date, status,
                    CASE WHEN CURRENT_DATE < start_date THEN 'UPCOMING'
                         WHEN CURRENT_DATE > end_date THEN 'ENDED'
                         ELSE 'RUNNING' END AS phase,
                    (end_date - CURRENT_DATE) AS days_left
               FROM campaigns ORDER BY start_date DESC LIMIT 8`),
      query(`SELECT g.id, g.name,
                    (SELECT count(*)::int FROM agent_group_members m WHERE m.group_id = g.id) AS agent_count,
                    (SELECT count(*)::int FROM combinations c WHERE c.agent_group_id = g.id) AS combination_count
               FROM agent_groups g ORDER BY agent_count DESC, g.name LIMIT 6`),
      query(`SELECT p.id, p.name, count(c.id)::int AS combination_count
               FROM packages p LEFT JOIN combinations c ON c.package_id = p.id
              GROUP BY p.id ORDER BY combination_count DESC, p.name LIMIT 6`),
      query(`SELECT t.id, t.name, t.status, t.updated_at, p.name AS package_name,
                    g.name AS agent_group_name, c.name AS campaign_name
               FROM combinations t
               JOIN packages p ON p.id = t.package_id
               JOIN agent_groups g ON g.id = t.agent_group_id
               LEFT JOIN campaigns c ON c.id = t.campaign_id
              ORDER BY t.updated_at DESC LIMIT 5`),
    ]);

  res.json({
    counts: { packages, campaigns, agents, groups, combinations },
    campaignTimeline,
    topGroups,
    packageUsage,
    recent,
  });
});
