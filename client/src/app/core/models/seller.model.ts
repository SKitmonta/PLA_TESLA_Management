/**
 * Seller (เดิม People management) — doc 07 · ตรงกับ server/src/services/people.service.ts
 */

export type SelectionMode = 'ALL' | 'CUSTOM';

/** P-01 — 1 แถว = Package × Channel ที่มี Content Approved */
export interface WorkspaceRow {
  packageCode: string;
  nameTh: string;
  channelCode: string;
  channelName: string | null;
  mode: SelectionMode;
  sellerCount: number;
  groupCount: number;
  ungrouped: number;
  notReady: number;
  campaignCount: number;
  updatedAt: string | null;
}

export interface WorkspaceInfo {
  packageCode: string;
  nameTh: string;
  channelCode: string;
  channelName: string | null;
  mode: SelectionMode;
}

/** ผู้ขาย 1 คน (SL-01…SL-11) — เบอร์ / อีเมลแสดงแบบ Mask (PDPA) */
export interface Seller {
  sellerCode: string;
  sellerName: string;
  sellerType: 'AGENT' | 'EMPLOYEE';
  branch: string | null;
  team: string | null;
  level: string | null;
  licenseNo: string | null;
  licenseExpiry: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  phone: string | null;
  email: string | null;
  /** พร้อมขาย (PM-02, PM-06) */
  ready: boolean;
  reason: string | null;
  /** ใบอนุญาตหมดใน 30 วัน */
  licenseWarning: boolean;
  groupId: number | null;
}

export interface BoardGroup {
  groupId: number;
  groupName: string;
  description: string | null;
  color: string;
  memberCount: number;
  notReadyCount: number;
  campaigns: { campaignCode: string; nameTh: string; typeCode: string }[];
  updatedAt: string;
}

export interface Board {
  workspace: WorkspaceInfo;
  groups: BoardGroup[];
  sellers: Seller[];
}

export interface MoveResult {
  moved: number;
  skipped: { sellerCode: string; reason: string }[];
  board: Board;
}

export interface GroupCampaign {
  campaignCode: string;
  nameTh: string;
  typeCode: string;
  typeName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  boundAt?: string;
  boundByName?: string | null;
  bindable?: boolean;
  reason?: string | null;
}

export interface AuditEntry {
  logId: number;
  action: string;
  packageCode: string;
  channelCode: string;
  groupId: number | null;
  groupName: string | null;
  sellerCode: string | null;
  campaignCode: string | null;
  detail: string | null;
  actorName: string;
  source: 'UI' | 'IMPORT' | 'COPY' | 'SYNC';
  createdAt: string;
}

export interface GroupDetail {
  groupId: number;
  groupName: string;
  description: string | null;
  color: string;
  workspace: WorkspaceInfo;
  members: Seller[];
  campaigns: GroupCampaign[];
  candidates: GroupCampaign[];
  logs: AuditEntry[];
  updatedAt: string;
}

export interface GroupPayload {
  groupName: string;
  description: string | null;
  color: string;
}

export interface ReferralStats {
  activeLinks: number;
  totalLinks: number;
  groupCount: number;
  clicks: number;
  applications: number;
  approved: number;
}

export interface ReferralRow extends ReferralStats {
  campaignCode: string;
  nameTh: string;
  startDate: string | null;
  endDate: string | null;
  packageCodes: string[];
  channelCodes: string[];
}

export interface ReferralLink {
  sellerCode: string;
  sellerName: string;
  groupId: number;
  groupName: string;
  groupColor: string;
  url: string;
  clicks: number;
  applications: number;
  approved: number;
  active: boolean;
  reason: string | null;
}

export interface ReferralDetail {
  campaignCode: string;
  nameTh: string;
  displayStatus: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  startDate: string | null;
  endDate: string | null;
  packageCodes: string[];
  channelCodes: string[];
  attributionDays: number;
  agentContentCode: string | null;
  stats: ReferralStats;
  links: ReferralLink[];
}

export interface CopyPlanGroup {
  groupName: string;
  description: string | null;
  color: string;
  sourceCount: number;
  copyCount: number;
  skipNotInTarget: number;
  skipNotReady: number;
}

export interface ImportRow {
  row: number;
  sellerCode: string;
  groupName: string;
  ok: boolean;
  message: string;
  newGroup: boolean;
}

export interface ImportResult {
  committed: boolean;
  rows: ImportRow[];
  passed: number;
  failed: number;
}

export interface AuditQuery {
  pkg?: string;
  ch?: string;
  groupId?: number;
  q?: string;
  from?: string;
  to?: string;
}
