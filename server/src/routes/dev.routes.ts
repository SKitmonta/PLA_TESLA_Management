/**
 * /api/dev — เครื่องมือช่วยพัฒนา (ใช้บน localhost เท่านั้น)
 * POST /api/dev/figma-asset { name, content }  → บันทึกไฟล์ SVG จาก Figma ลง client/public/assets/figma/
 * ใช้ตอน Claude ดึง Icon/Logo จาก Figma มาใส่โปรเจค (Figma asset URL หมดอายุใน 7 วัน จึงต้องเก็บไฟล์ไว้ในโปรเจค)
 * POST /api/dev/reset-data  → ล้างข้อมูลทั้งหมดแล้ว Seed ใหม่ (เหมือน npm run db:reset แต่ไม่ต้องหยุด Server)
 * POST /api/dev/guide-image { name, dataUrl } → บันทึกภาพหน้าจอของ User guide ลง client/public/assets/guide/ (JPEG / PNG)
 */
import { Router } from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppError } from '../middleware/error-handler.js';
import { resetData } from '../db/database.js';

const ASSET_DIR = join(import.meta.dirname, '..', '..', '..', 'client', 'public', 'assets', 'figma');
const GUIDE_DIR = join(import.meta.dirname, '..', '..', '..', 'client', 'public', 'assets', 'guide');

export const devRoutes = Router();

devRoutes.post('/figma-asset', (req, res) => {
  const { name, content } = req.body as { name?: string; content?: string };
  if (!name || !/^[a-z0-9-]+\.svg$/.test(name)) throw new AppError(400, 'ชื่อไฟล์ต้องเป็น a-z0-9- และลงท้าย .svg');
  if (!content || !content.trimStart().startsWith('<svg')) throw new AppError(400, 'เนื้อหาไม่ใช่ SVG');
  mkdirSync(ASSET_DIR, { recursive: true });
  writeFileSync(join(ASSET_DIR, name), content, 'utf8');
  res.json({ saved: `client/public/assets/figma/${name}`, bytes: content.length });
});

devRoutes.post('/reset-data', (_req, res) => {
  resetData();
  res.json({ message: 'ล้างข้อมูลและ Seed ใหม่เรียบร้อย' });
});

devRoutes.post('/guide-image', (req, res) => {
  const { name, dataUrl } = req.body as { name?: string; dataUrl?: string };
  if (!name || !/^[a-z0-9-]+\.(jpg|png)$/.test(name)) throw new AppError(400, 'ชื่อไฟล์ต้องเป็น a-z0-9- และลงท้าย .jpg / .png');
  const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(dataUrl ?? '');
  if (!m) throw new AppError(400, 'dataUrl ต้องเป็นรูป JPEG / PNG แบบ base64');
  mkdirSync(GUIDE_DIR, { recursive: true });
  const buf = Buffer.from(m[2], 'base64');
  writeFileSync(join(GUIDE_DIR, name), buf);
  res.json({ saved: `client/public/assets/guide/${name}`, bytes: buf.length });
});

/** สคริปต์ช่วยจับภาพ User guide (ใช้ตอนพัฒนาเท่านั้น) */
devRoutes.get('/guide-helpers.js', (_req, res) => {
  const file = join(GUIDE_DIR, '..', '..', 'dev', 'guide-helpers.js');
  if (!existsSync(file)) throw new AppError(404, 'ไม่พบ guide-helpers.js');
  res.type('application/javascript').send(readFileSync(file, 'utf8'));
});
