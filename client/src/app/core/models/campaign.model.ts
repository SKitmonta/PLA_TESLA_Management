/**
 * Campaign — เมนู Campaign › Campaign list / Add Campaign (doc 06)
 * ตรงกับ server/src/services/campaign.service.ts
 */

/** สถานะบนหน้าจอ — APPROVED แยกเป็น Scheduled (ยังไม่ถึงวันเริ่ม) / Active / Expired ตามวันที่ */
export type CampaignDisplayStatus = 'ACTIVE' | 'SCHEDULED' | 'PENDING' | 'DRAFT' | 'EXPIRED' | 'SUSPENDED' | 'CLOSED' | 'INACTIVE';

export type CampaignTypeCode =
  | 'VOUCHER'
  | 'DISCOUNT'
  | 'CASHBACK'
  | 'FREE_GIFT'
  | 'INSTALLMENT'
  | 'REWARD_POINTS'
  | 'REFERRAL'
  | 'BUNDLE'
  | 'LUCKY_DRAW';

export interface CampaignRow {
  campaignCode: string;
  typeCode: CampaignTypeCode;
  typeNameTh: string | null;
  typeNameEn: string | null;
  nameTh: string;
  nameEn: string | null;
  status: 'DRAFT' | 'REJECTED' | 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED' | 'INACTIVE';
  displayStatus: CampaignDisplayStatus;
  versionNo: number;
  startDate: string | null;
  endDate: string | null;
  packageCodes: string[];
  channelCodes: string[];
  channels: { code: string; name: string | null }[];
  budget: number | null;
  budgetUsed: number;
  quotaTotal: number | null;
  quotaUsed: number;
  createdBy: string | null;
  createdByName: string | null;
  approvedByName: string | null;
  rejectReason: string | null;
  isMock: boolean;
  updatedAt: string;
}

/** ข้อมูลใน Wizard ที่เก็บเป็น JSON (campaign_data) */
export interface CampaignData {
  objective?: string | null;
  description?: string;
  budget?: number | null;
  quotaTotal?: number | null;
  quotaPerPolicy?: number | null;
  rewardTiming?: string | null;
  clawback?: string | null;
  promoCode?: string;
  tncTemplate?: string | null;
  tncTh?: string;
  tncEn?: string;
  bannerDesktop?: string;
  bannerMobile?: string;
  thumbnail?: string;
  sortOrder?: number | null;
  costCenter?: string | null;
  attachment?: string;
  benefit?: Record<string, unknown>;
  rules?: CampaignRule[];
}

/** 1 ข้อใน Rule builder (CP-ELG) — ต่อกันแบบ AND */
export interface CampaignRule {
  attribute: string | null;
  operator: string | null;
  value: unknown;
  value2?: unknown;
}

export interface CampaignDetail extends CampaignRow {
  data: CampaignData;
  /** Stock ที่จองไว้ตอนอนุมัติ (Voucher MS-10 / ของขวัญ MS-16) — null = ไม่ได้จอง */
  stock?: CampaignStock | null;
  /** ปิด Campaign ถาวรแล้ว */
  closed?: { closedAt: string; closedBy: string | null; reason: string | null } | null;
}

/** deliveredQty / releasedQty = null ระหว่างที่ยังจองอยู่ · ได้ค่าเมื่อปิด Campaign */
export interface CampaignStock {
  typeCode: string;
  itemCode: string;
  qty: number;
  deliveredQty: number | null;
  releasedQty: number | null;
}

export interface CampaignListQuery {
  code?: string;
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  channel?: string;
  status?: CampaignDisplayStatus | 'ENDED' | 'EXPIRING' | '';
  createdBy?: string;
  approvedBy?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CampaignListResponse {
  items: CampaignRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: { total: number; expiring: number; active: number; scheduled: number; pending: number; draft: number; ended: number };
}

/** Package ที่เลือกได้ใน Wizard (CP-COM-08 — เฉพาะ Content Approved) */
export interface CampaignPackageOption {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  productTypeName: string | null;
  channels: { code: string; name: string | null }[];
  contents: { contentCode: string; channelCode: string; template: string }[];
  isMock: boolean;
}

export interface SaveCampaignPayload {
  typeCode?: CampaignTypeCode;
  nameTh: string;
  nameEn: string | null;
  startDate: string | null;
  endDate: string | null;
  packageCodes: string[];
  channelCodes: string[];
  data: CampaignData;
}

/** Campaign ประเภทเดียวกันที่ช่วงวันทับกัน (ตรวจสดในขั้น 2) */
export interface CampaignOverlap {
  campaignCode: string;
  nameTh: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  sharedPackages: string[];
}

/** สถานะสิทธิ์ต่อ 1 ใบคำขอ × 1 Campaign (doc 06 §3A) */
export type GrantStatus = 'RESERVED' | 'CONFIRMED' | 'FULFILLED' | 'RELEASED' | 'CLAWED_BACK' | 'NOT_GRANTED';

export interface CampaignGrant {
  grantId: number;
  applicationNo: string;
  policyNo: string | null;
  sellerCode: string | null;
  sellerName: string | null;
  fyp: number;
  benefitValue: number;
  status: GrantStatus;
  campaignVersion: number;
  submittedDate: string;
}

export interface CampaignGrantSummary {
  stats: Record<GrantStatus, { count: number; value: number }>;
  budget: { total: number | null; used: number; reserved: number };
  quota: { total: number | null; used: number; reserved: number; unit: string };
  items: CampaignGrant[];
}

export interface ApprovalLog {
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESUME' | 'CLOSE';
  versionNo: number;
  reason: string | null;
  actorName: string | null;
  createdAt: string;
}
