/**
 * สิทธิ์เข้าเมนูตาม Role (doc 09 §3 Role & Permission)
 *  none    = ไม่เห็นเมนู
 *  view    = ดูอย่างเดียว
 *  edit    = สร้าง / แก้ไข / ส่งอนุมัติ
 *  approve = อนุมัติ / ตีกลับ (ห้ามอนุมัติงานตัวเอง — D-06)
 * Overview: edit = ตั้ง Target ได้ (Executive / Seller Admin) · Dashboard ทุก Role ดูได้ เนื้อหาตาม Role (OV-03)
 */
import { RoleCode } from '../models/user.model';
import { MenuKey } from '../navigation/menu.config';

export type AccessLevel = 'none' | 'view' | 'edit' | 'approve';

export const MENU_ACCESS: Record<RoleCode, Record<MenuKey, AccessLevel>> = {
  SYS_ADMIN:         { overview: 'edit', package: 'edit',    campaign: 'edit',    seller: 'edit', master: 'edit', guide: 'view' }, // + อนุมัติได้ทุกเมนู (SessionService.canApprove)
  CONTENT_MAKER:     { overview: 'view', package: 'edit',    campaign: 'view',    seller: 'none', master: 'view', guide: 'view' },
  CONTENT_APPROVER:  { overview: 'view', package: 'approve', campaign: 'view',    seller: 'none', master: 'view', guide: 'view' },
  CAMPAIGN_MAKER:    { overview: 'view', package: 'view',    campaign: 'edit',    seller: 'view', master: 'view', guide: 'view' },
  CAMPAIGN_APPROVER: { overview: 'view', package: 'view',    campaign: 'approve', seller: 'view', master: 'view', guide: 'view' },
  PEOPLE_ADMIN:      { overview: 'edit', package: 'view',    campaign: 'view',    seller: 'edit', master: 'view', guide: 'view' },
  EXECUTIVE:         { overview: 'edit', package: 'view',    campaign: 'view',    seller: 'view', master: 'none', guide: 'view' },
};

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  none: 'ไม่มีสิทธิ์',
  view: 'ดู',
  edit: 'สร้าง / แก้ไข',
  approve: 'อนุมัติ',
};
