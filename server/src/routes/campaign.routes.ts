/**
 * /api/campaign — เมนู Campaign (doc 06)
 *   GET  /                  รายการ Campaign (กรอง / เรียง / แบ่งหน้า + การ์ดสรุป)
 *   GET  /package-options   Package ที่เลือกได้ใน Wizard (เฉพาะ Content Approved + ช่องทาง + กรอบวันขาย)
 *   GET  /:code             รายละเอียด Campaign (เปิดใน Wizard)
 *   POST /                  บันทึกร่างครั้งแรก → สร้าง Campaign Code (Campaign Maker)
 *   PUT  /:code             บันทึกร่าง (Campaign Maker · เฉพาะ Draft / ตีกลับ)
 *   POST /:code/submit      ส่งอนุมัติ → Pending (Campaign Maker)
 *   GET  /overlap           Campaign ประเภทเดียวกันที่ช่วงวันทับกัน (?type&packages&start&end&exclude) — ตรวจสดในขั้น 2
 *   GET  /:code/grants      รายการสิทธิ์ (Grant) + สรุปงบ / โควตา (CP-07)
 *   GET  /:code/history     ประวัติส่งอนุมัติ / อนุมัติ / ตีกลับ
 *   POST /:code/approve     อนุมัติ (Campaign Approver · ต้องไม่ใช่ผู้สร้าง)
 *   POST /:code/reject      ตีกลับ { reason } (Campaign Approver · ต้องไม่ใช่ผู้สร้าง)
 *   POST /:code/suspend     หยุดชั่วคราว / POST /:code/resume เปิดใช้อีกครั้ง (Campaign Maker)
 * ถัดไป: Version ใหม่ของ Campaign ที่อนุมัติแล้ว, รับผลพิจารณากรมธรรม์ผ่าน API (นอกขอบเขตรอบนี้)
 */
import { Router } from 'express';
import { requireRole } from '../middleware/require-role.js';
import {
  approvalHistory,
  approveCampaign,
  campaignGrants,
  findOverlaps,
  rejectCampaign,
  suspendCampaign,
  type OverlapQuery,
  createCampaign,
  getCampaign,
  listCampaigns,
  packageOptions,
  saveCampaign,
  submitCampaign,
  type CampaignListQuery,
} from '../services/campaign.service.js';

export const campaignRoutes = Router();

campaignRoutes.get('/', (req, res) => {
  res.json(listCampaigns(req.query as unknown as CampaignListQuery));
});

campaignRoutes.get('/package-options', (_req, res) => {
  res.json(packageOptions());
});

campaignRoutes.get('/overlap', (req, res) => {
  res.json(findOverlaps(req.query as unknown as OverlapQuery));
});

campaignRoutes.get('/:code', (req, res) => {
  res.json(getCampaign(req.params.code));
});

campaignRoutes.post('/', requireRole('CAMPAIGN_MAKER'), (req, res) => {
  res.status(201).json(createCampaign(req.body ?? {}, req.actor.userId));
});

campaignRoutes.put('/:code', requireRole('CAMPAIGN_MAKER'), (req, res) => {
  res.json(saveCampaign(req.params.code, req.body ?? {}, req.actor.userId));
});

campaignRoutes.post('/:code/submit', requireRole('CAMPAIGN_MAKER'), (req, res) => {
  res.json(submitCampaign(req.params.code, req.body ?? {}, req.actor.userId));
});

campaignRoutes.get('/:code/grants', (req, res) => {
  res.json(campaignGrants(req.params.code));
});

campaignRoutes.get('/:code/history', (req, res) => {
  res.json(approvalHistory(req.params.code));
});

campaignRoutes.post('/:code/approve', requireRole('CAMPAIGN_APPROVER'), (req, res) => {
  res.json(approveCampaign(req.params.code, req.actor.userId));
});

campaignRoutes.post('/:code/reject', requireRole('CAMPAIGN_APPROVER'), (req, res) => {
  res.json(rejectCampaign(req.params.code, (req.body ?? {}).reason, req.actor.userId));
});

campaignRoutes.post('/:code/suspend', requireRole('CAMPAIGN_MAKER'), (req, res) => {
  res.json(suspendCampaign(req.params.code, true, req.actor.userId));
});

campaignRoutes.post('/:code/resume', requireRole('CAMPAIGN_MAKER'), (req, res) => {
  res.json(suspendCampaign(req.params.code, false, req.actor.userId));
});
