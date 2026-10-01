/**
 * /api/people — เมนู Seller (เดิม People management — doc 07)
 *   GET    /workspaces                      P-01 รายการ Workspace (?search&channel&mode)
 *   GET    /workspaces/:pkg/:ch             P-02 Board: กลุ่ม + รายชื่อผู้ขาย
 *   POST   /workspaces/:pkg/:ch/groups      สร้างกลุ่ม { groupName, description, color }
 *   POST   /workspaces/:pkg/:ch/move        ย้ายผู้ขาย { sellerCodes[], groupId | null }
 *   POST   /workspaces/:pkg/:ch/import      Import { rows[{sellerCode, groupName}], commit }
 *   GET    /groups/:id                      P-03 รายละเอียดกลุ่ม + Campaign ที่ผูก / ผูกได้ + ประวัติ
 *   PUT    /groups/:id                      แก้ชื่อ / คำอธิบาย / สี
 *   DELETE /groups/:id                      ลบกลุ่ม (สมาชิกกลับเป็น "ยังไม่มีกลุ่ม", ถอด Campaign)
 *   POST   /groups/:id/campaigns            ผูก Campaign { campaignCode } (D-03 ไม่ต้องอนุมัติ)
 *   DELETE /groups/:id/campaigns/:code      ถอด Campaign
 *   GET    /referrals · /referrals/:code    P-04 Referral links
 *   POST   /copy                            P-05 คัดลอกกลุ่ม { fromPackage, fromChannel, toPackage, toChannel, preview }
 *   GET    /audit                           Audit log (?pkg&ch&groupId&q&from&to)
 * แก้ไขข้อมูลได้เฉพาะ Seller Admin (PEOPLE_ADMIN) · Role อื่นดูอย่างเดียว
 */
import { Router } from 'express';
import { requireRole } from '../middleware/require-role.js';
import {
  auditLog,
  bindCampaign,
  copyGroups,
  createGroup,
  deleteGroup,
  getBoard,
  getGroup,
  importRows,
  listReferrals,
  listWorkspaces,
  moveSellers,
  referralDetail,
  unbindCampaign,
  updateGroup,
  type AuditQuery,
  type WorkspaceQuery,
} from '../services/people.service.js';

export const peopleRoutes = Router();
const admin = requireRole('PEOPLE_ADMIN');

peopleRoutes.get('/workspaces', (req, res) => {
  res.json(listWorkspaces(req.query as WorkspaceQuery));
});

peopleRoutes.get('/workspaces/:pkg/:ch', (req, res) => {
  res.json(getBoard(req.params.pkg, req.params.ch));
});

peopleRoutes.post('/workspaces/:pkg/:ch/groups', admin, (req, res) => {
  res.status(201).json(createGroup(req.params.pkg, req.params.ch, req.body ?? {}, req.actor.userId));
});

peopleRoutes.post('/workspaces/:pkg/:ch/move', admin, (req, res) => {
  const body = req.body ?? {};
  res.json(moveSellers(req.params.pkg, req.params.ch, body.sellerCodes, body.groupId, req.actor.userId));
});

peopleRoutes.post('/workspaces/:pkg/:ch/import', admin, (req, res) => {
  const body = req.body ?? {};
  res.json(importRows(req.params.pkg, req.params.ch, body.rows, body.commit === true, req.actor.userId));
});

peopleRoutes.get('/groups/:id', (req, res) => {
  res.json(getGroup(Number(req.params.id)));
});

peopleRoutes.put('/groups/:id', admin, (req, res) => {
  res.json(updateGroup(Number(req.params.id), req.body ?? {}, req.actor.userId));
});

peopleRoutes.delete('/groups/:id', admin, (req, res) => {
  res.json(deleteGroup(Number(req.params.id), req.actor.userId));
});

peopleRoutes.post('/groups/:id/campaigns', admin, (req, res) => {
  res.json(bindCampaign(Number(req.params.id), (req.body ?? {}).campaignCode, req.actor.userId));
});

peopleRoutes.delete('/groups/:id/campaigns/:code', admin, (req, res) => {
  res.json(unbindCampaign(Number(req.params.id), req.params.code, req.actor.userId));
});

peopleRoutes.get('/referrals', (_req, res) => {
  res.json(listReferrals());
});

peopleRoutes.get('/referrals/:code', (req, res) => {
  res.json(referralDetail(req.params.code));
});

peopleRoutes.post('/copy', admin, (req, res) => {
  res.json(copyGroups(req.body ?? {}, req.actor.userId));
});

peopleRoutes.get('/audit', (req, res) => {
  res.json(auditLog(req.query as unknown as AuditQuery));
});
