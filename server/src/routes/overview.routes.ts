/**
 * /api/overview — Dashboard, ตั้ง Target (doc 08)
 *   GET  /dashboard   ข้อมูลทุก Section ที่ Role มีสิทธิ์ (?from&to&channel&package&productType&campaignType&metric)
 *                     Executive = OV-A…E · Role อื่น = OV-D + OV-F (Section ที่ไม่มีสิทธิ์ไม่ถูกส่งมา — BR-OV-001)
 *   GET  /options     ตัวเลือกตัวกรอง (Package, Channel, ประเภทสินค้า, ประเภท Campaign)
 *   GET  /targets     Target ตามระดับ (?level=CHANNEL|GROUP|SELLER&pkg&ch&metric&from=YYYY-MM&to=YYYY-MM)
 *   PUT  /targets     บันทึก Target { level, pkg, ch, metric, values[{refId, period, value|null}] } — Executive / Seller Admin
 */
import { Router } from 'express';
import { requireRole } from '../middleware/require-role.js';
import { dashboard, getTargets, options, saveTargets, type DashboardQuery, type TargetQuery } from '../services/overview.service.js';

export const overviewRoutes = Router();

overviewRoutes.get('/dashboard', (req, res) => {
  res.json(dashboard(req.query as DashboardQuery, req.actor));
});

overviewRoutes.get('/options', (_req, res) => {
  res.json(options());
});

overviewRoutes.get('/targets', (req, res) => {
  res.json(getTargets(req.query as TargetQuery));
});

overviewRoutes.put('/targets', requireRole('EXECUTIVE', 'PEOPLE_ADMIN'), (req, res) => {
  res.json(saveTargets(req.body ?? {}, req.actor.userId));
});
