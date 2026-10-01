/**
 * Content — เมนู Package › Add Package (Package management) — doc 05 §0.2, §2
 * ตรงกับ server/src/services/content.service.ts
 */
import { PackageDetail, TemplateCode } from './master.model';

/** สถานะบนหน้าจอ (FD-03): Active = Approved · Pending = รออนุมัติ · Draft = Draft + ตีกลับ · Inactive */
export type ContentDisplayStatus = 'ACTIVE' | 'PENDING' | 'DRAFT' | 'INACTIVE';

export interface ContentRow {
  contentCode: string;
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  channelCode: string;
  channelName: string | null;
  template: TemplateCode;
  status: 'DRAFT' | 'REJECTED' | 'PENDING' | 'APPROVED' | 'INACTIVE';
  displayStatus: ContentDisplayStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  createdByName: string | null;
  approvedByName: string | null;
  rejectReason: string | null;
  versionNo: number;
  isMock: boolean;
  updatedAt: string;
}

export interface ContentListQuery {
  code?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  channel?: string;
  status?: ContentDisplayStatus | '';
  createdBy?: string;
  approvedBy?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ContentListResponse {
  items: ContentRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: { total: number; active: number; pending: number; draft: number; inactive: number };
}

/** ตัวเลือกใน Popup Add Package — 1 แถว = Package × Channel ที่ยังไม่มี Content */
export interface AddCandidate {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  channelCode: string;
  channelName: string | null;
  productTypeCode: string;
  productTypeName: string | null;
  subProductTypeCode: string | null;
  subProductTypeName: string | null;
  template: TemplateCode;
  isMock: boolean;
}

/** รายละเอียด Content (หน้า Content Editor) */
export interface ContentDetail extends ContentRow {
  saleStartDate: string | null;
  saleEndDate: string | null;
  productTypeCode: string | null;
  productTypeName: string | null;
  subProductTypeCode: string | null;
  subProductTypeName: string | null;
  plans: { planCode: string; planName: string | null }[];
  /** ข้อมูล Package ทั้งหมด (ใช้เติมค่า PKG / DRV ในฟอร์ม) */
  package: PackageDetail;
  /** ช่องทางชำระเบี้ยที่แสดงบนหน้าเว็บตาม Mapping MS-03 (DRV — OB-09) */
  paymentMethodsShown: { code: string; text: string }[];
  /** เนื้อหาใน Editor (JSON) — โครงอยู่ที่ features/package/content-editor/content-form.ts */
  data: Record<string, unknown>;
}

export interface SaveContentPayload {
  data: unknown;
  startDate: string | null;
  endDate: string | null;
}

/** ประวัติ ส่งอนุมัติ / อนุมัติ / ตีกลับ / สร้าง Version ใหม่ */
export interface ContentLog {
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'NEW_VERSION';
  versionNo: number;
  reason: string | null;
  actorName: string | null;
  createdAt: string;
}

/** หน้าอนุมัติ Content (CT-06) */
export interface ContentReview {
  content: ContentDetail;
  /** Version ล่าสุดที่อนุมัติแล้ว (ใช้งานอยู่บนเว็บ) — null = Version แรก */
  previous: {
    versionNo: number;
    data: Record<string, unknown>;
    startDate: string | null;
    endDate: string | null;
    approvedByName: string | null;
    approvedAt: string | null;
  } | null;
  submittedAt: string;
  history: ContentLog[];
}
