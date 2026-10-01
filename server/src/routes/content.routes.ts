/**
 * /api/content — เมนู Package › Add Package (Package management) — doc 05 §0.2, §2
 *   GET  /                 รายการ Content (กรอง / เรียง / แบ่งหน้า + การ์ดสรุป Total/Active/Pending/Draft/Inactive)
 *   GET  /add-candidates   ตัวเลือกใน Popup Add Package (Package × Channel ที่ยังไม่มี Content)
 *   GET  /:code            รายละเอียด Content (หน้า Content Editor)
 *   POST /                 สร้าง Content ใหม่ สถานะ Draft (Content Maker)
 *   PUT  /:code            บันทึกร่าง (Content Maker · เฉพาะ Draft / ตีกลับ)
 *   POST /:code/submit     ส่งอนุมัติ → Pending (Content Maker)
 *   GET  /:code/review     หน้าอนุมัติ (Content + Version ที่อนุมัติล่าสุด + ประวัติ — CT-06)
 *   POST /:code/approve    อนุมัติ (Content Approver · ต้องไม่ใช่ผู้สร้าง)
 *   POST /:code/reject     ตีกลับ { reason } (Content Approver · ต้องไม่ใช่ผู้สร้าง)
 *   POST /:code/new-version  สร้าง Version ใหม่จาก Content ที่อนุมัติแล้ว (Content Maker — D-07)
 */
import { Router } from 'express';
import { requireRole } from '../middleware/require-role.js';
import { addCandidates, approveContent, contentReview, createContent, newContentVersion, rejectContent, getContent, listContents, saveContent, submitContent, type ContentListQuery } from '../services/content.service.js';

export const contentRoutes = Router();

contentRoutes.get('/', (req, res) => {
  res.json(listContents(req.query as unknown as ContentListQuery));
});

contentRoutes.get('/add-candidates', (_req, res) => {
  res.json(addCandidates());
});

contentRoutes.get('/:code', (req, res) => {
  res.json(getContent(req.params.code));
});

contentRoutes.post('/', requireRole('CONTENT_MAKER'), (req, res) => {
  res.status(201).json(createContent(req.body ?? {}, req.actor.userId));
});

contentRoutes.put('/:code', requireRole('CONTENT_MAKER'), (req, res) => {
  res.json(saveContent(req.params.code, req.body ?? {}, req.actor.userId));
});

contentRoutes.post('/:code/submit', requireRole('CONTENT_MAKER'), (req, res) => {
  res.json(submitContent(req.params.code, req.body ?? {}, req.actor.userId));
});

contentRoutes.get('/:code/review', (req, res) => {
  res.json(contentReview(req.params.code));
});

contentRoutes.post('/:code/approve', requireRole('CONTENT_APPROVER'), (req, res) => {
  res.json(approveContent(req.params.code, req.actor.userId));
});

contentRoutes.post('/:code/reject', requireRole('CONTENT_APPROVER'), (req, res) => {
  res.json(rejectContent(req.params.code, (req.body ?? {}).reason, req.actor.userId));
});

contentRoutes.post('/:code/new-version', requireRole('CONTENT_MAKER'), (req, res) => {
  res.json(newContentVersion(req.params.code, req.actor.userId));
});
