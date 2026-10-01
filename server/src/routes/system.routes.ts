/**
 * /api/system — สถานะระบบ และผู้ใช้จำลองสำหรับสลับ Role
 */
import { Router } from 'express';
import { getDb } from '../db/database.js';

export const systemRoutes = Router();

/** GET /api/system/health — ใช้เช็คว่า API + ฐานข้อมูลพร้อม (แสดงที่มุมล่างของ Sidebar) */
systemRoutes.get('/health', (_req, res) => {
  const row = getDb().prepare('SELECT COUNT(*) AS users FROM app_user').get() as { users: number };
  res.json({
    status: 'ok',
    version: '0.1.0',
    sprint: 0,
    node: process.version,
    database: 'sqlite',
    users: row.users,
    time: new Date().toISOString(),
  });
});

/** GET /api/system/users — ผู้ใช้จำลอง + Role ของแต่ละคน */
systemRoutes.get('/users', (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT u.user_id, u.user_name, u.position, GROUP_CONCAT(r.role_code) AS roles
         FROM app_user u
         LEFT JOIN app_user_role r ON r.user_id = u.user_id
        WHERE u.is_active = 1
        GROUP BY u.user_id
        ORDER BY u.user_id`,
    )
    .all() as { user_id: string; user_name: string; position: string; roles: string | null }[];

  res.json(
    rows.map((r) => ({
      userId: r.user_id,
      userName: r.user_name,
      position: r.position,
      roles: r.roles ? r.roles.split(',') : [],
    })),
  );
});
