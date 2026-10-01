/**
 * Content จำลอง (ข้อมูลตั้งต้นของหน้า Package management) — แก้/เพิ่มได้ที่นี่ แล้วรัน npm run db:reset
 * ตั้งใจเว้น MOCK-PA01 (OL_PA), MOCK-OB03 (OL_OB) ไว้ให้ทดลองกด "+ Add"
 * CT000006 / CT000007 (AGENT Approved) = Workspace ของเมนู Seller ช่องทางตัวแทน (ALL / CUSTOM — Figma 15:1392)
 */
import type { DatabaseSync } from 'node:sqlite';

type Row = [code: string, pkg: string, channel: string, template: string, status: string, start: string | null, end: string | null, createdBy: string, approvedBy: string | null, rejectReason?: string];

const CONTENTS: Row[] = [
  ['CT000001', 'ST000007', 'CHN04', 'OL_OB', 'APPROVED', '2026-01-01', '2026-12-31', 'U002', 'U003'],
  ['CT000002', 'MOCK-OB02', 'CHN04', 'OL_OB', 'PENDING', '2026-10-01', '2026-12-31', 'U002', null],
  ['CT000003', 'MOCK-MC01', 'CHN01', 'AGENT', 'DRAFT', null, null, 'U004', null],
  ['CT000004', 'MOCK-MC01', 'CHN04', 'OL_OB', 'REJECTED', '2026-10-15', null, 'U002', null, 'รูปหน้าปกไม่ตรงกับแบบประกัน'],
  ['CT000005', 'MOCK-AG02', 'CHN01', 'AGENT', 'INACTIVE', '2023-01-01', '2025-12-31', 'U002', 'U003'],
  ['CT000006', 'ST000006', 'CHN01', 'AGENT', 'APPROVED', '2026-09-01', null, 'U002', 'U003'],
  ['CT000007', 'ST000014', 'CHN01', 'AGENT', 'APPROVED', '2026-09-15', null, 'U002', 'U003'],
];

export function seedContent(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO content
       (content_code, package_code, channel_code, template_code, status, display_start_date, display_end_date,
        created_by, approved_by, approved_at, reject_reason, is_mock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  );
  for (const [code, pkg, ch, tpl, status, start, end, by, approver, reason] of CONTENTS) {
    insert.run(code, pkg, ch, tpl, status, start, end, by, approver, approver ? start : null, reason ?? null);
  }
}

// ---------------------------------------------------------------- เนื้อหา + Version (หน้าอนุมัติ CT-06)
const OB_V1 = {
  display: { startDate: '2026-10-01', endDate: '2026-12-31' },
  page: { slug: 'max-three-one', category: 'ออมทรัพย์', order: 2, seoTitle: 'แม็กซ์ ทรี วัน 3/1 เอ็กซ์ตร้า', seoDescription: '' },
  card: { image: 'thumb-max31.webp', label: 'ประกันสะสมทรัพย์', name: 'แม็กซ์ ทรี วัน 3/1', bullets: ['จ่ายเบี้ยครั้งเดียว', 'คุ้มครอง 3 ปี', ''] },
  hero: { bgDesktop: 'hero-max31-d.webp', bgMobile: 'hero-max31-m.webp', label: 'ประกันสะสมทรัพย์', displayName: 'แม็กซ์ ทรี วัน 3/1 เอ็กซ์ตร้า', headline: 'ลดหย่อนภาษี คุ้มค่ากว่าที่คิด', subHeadline: 'จัดการภาษีได้ก่อนใคร' },
  featureIcon: 'icons-max31.zip',
  features: [
    { icon: '', topic: 'CUSTOM', value: 'เริ่มต้นเพียง 5,000 บาท', active: true },
    { icon: '', topic: 'CUSTOM', value: '3 ปี', active: true },
    { icon: '', topic: 'CUSTOM', value: '105%', active: true },
  ],
  advantages: { header: 'จุดเด่นของแผน', cards: [{ image: 'adv1.webp', topic: 'ลดหย่อนภาษี', title: 'ลดหย่อนภาษี', subtitle: 'สูงสุด 100,000 บาท' }] },
  recommend: { header: 'ประกันอื่นที่น่าสนใจ', contents: [] },
  documents: [{ name: 'เงื่อนไขทั่วไป-max31.pdf', size: 820000 }],
};

const OB_V2 = {
  ...OB_V1,
  hero: { ...OB_V1.hero, headline: 'ลดหย่อนภาษี...ไม่ต้องรอสิ้นปี!' },
  features: [...OB_V1.features, { icon: '', topic: 'TAX', value: 'ลดหย่อนภาษีสูงสุด 100,000 บาท', active: true }],
  advantages: { ...OB_V1.advantages, header: 'คุ้มเต็มแม็กซ์' },
  recommend: { header: 'ประกันอื่นที่น่าสนใจ', contents: ['CT000001'] },
};

const OB_APPROVED = {
  display: { startDate: '2026-01-01', endDate: '2026-12-31' },
  page: { slug: 'max-ten-one-xtra', category: 'ออมทรัพย์', order: 1, seoTitle: 'แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า', seoDescription: '' },
  card: { image: 'thumb-max10.webp', label: 'ประกันสะสมทรัพย์', name: 'แม็กซ์ เท็น วัน 10/1', bullets: ['จ่ายเบี้ยครั้งเดียว', 'คุ้มครอง 10 ปี', 'รับเงินคืนทุกปี'] },
  hero: { bgDesktop: 'hero-max10-d.webp', bgMobile: 'hero-max10-m.webp', label: 'ประกันสะสมทรัพย์', displayName: 'แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า', headline: 'ออมสั้น คุ้มครองยาว', subHeadline: 'จ่ายครั้งเดียว คุ้มครอง 10 ปี' },
  featureIcon: 'icons-max10.zip',
  features: [
    { icon: '', topic: 'CUSTOM', value: 'เริ่มต้นเพียง 5,000 บาท', active: true },
    { icon: '', topic: 'CUSTOM', value: '10 ปี', active: true },
    { icon: '', topic: 'CUSTOM', value: '110%', active: true },
  ],
  advantages: { header: 'จุดเด่นของแผน', cards: [] },
  recommend: { header: 'ประกันอื่นที่น่าสนใจ', contents: [] },
  documents: [],
};

/** เนื้อหา / Version / ประวัติตั้งต้น — CT000002 = v2 รออนุมัติ (มี v1 ที่อนุมัติแล้วให้เทียบ) */
export function seedContentVersions(db: DatabaseSync): void {
  const setData = db.prepare("UPDATE content SET content_data = ?, version_no = ? WHERE content_code = ? AND content_data = '{}'");
  setData.run(JSON.stringify(OB_APPROVED), 1, 'CT000001');
  setData.run(JSON.stringify(OB_V2), 2, 'CT000002');

  const version = db.prepare(
    `INSERT OR IGNORE INTO content_version (content_code, version_no, content_data, display_start_date, display_end_date, approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, 'U003', ?)`,
  );
  version.run('CT000001', 1, JSON.stringify(OB_APPROVED), '2026-01-01', '2026-12-31', '2025-12-20 10:00:00');
  version.run('CT000002', 1, JSON.stringify(OB_V1), '2026-10-01', '2026-12-31', '2026-09-20 14:10:00');
  version.run('CT000005', 1, '{}', '2023-01-01', '2025-12-31', '2022-12-15 09:00:00');
  version.run('CT000006', 1, '{}', '2026-09-01', null, '2026-08-28 10:00:00');
  version.run('CT000007', 1, '{}', '2026-09-15', null, '2026-09-12 10:00:00');

  const logged = db.prepare("SELECT COUNT(*) AS n FROM approval_log WHERE object_type = 'CONTENT'").get() as { n: number };
  if (logged.n) return;
  const log = db.prepare("INSERT INTO approval_log (object_type, object_code, version_no, action, reason, actor_id, created_at) VALUES ('CONTENT', ?, ?, ?, ?, ?, ?)");
  log.run('CT000002', 1, 'SUBMIT', null, 'U002', '2026-09-18 09:00:00');
  log.run('CT000002', 1, 'REJECT', 'รูป Mobile ไม่ครบ', 'U003', '2026-09-18 09:45:00');
  log.run('CT000002', 1, 'SUBMIT', null, 'U002', '2026-09-19 16:00:00');
  log.run('CT000002', 1, 'APPROVE', null, 'U003', '2026-09-20 14:10:00');
  log.run('CT000002', 2, 'NEW_VERSION', null, 'U002', '2026-09-23 10:00:00');
  log.run('CT000002', 2, 'SUBMIT', null, 'U002', '2026-09-24 11:20:00');
  log.run('CT000004', 1, 'SUBMIT', null, 'U002', '2026-09-22 10:00:00');
  log.run('CT000004', 1, 'REJECT', 'รูปหน้าปกไม่ตรงกับแบบประกัน', 'U003', '2026-09-23 15:30:00');
  log.run('CT000001', 1, 'APPROVE', null, 'U003', '2025-12-20 10:00:00');
}
