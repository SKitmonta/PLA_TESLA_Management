/**
 * Campaign จำลอง (ข้อมูลตั้งต้นของหน้า Campaign list) — แก้/เพิ่มได้ที่นี่ แล้วรัน npm run db:reset
 * ใช้ Package ST000007 (CHN04) เพราะเป็น Package เดียวใน Seed ที่มี Content Approved (CT000001)
 * ครอบคลุมทุกสถานะ: Active, Scheduled, Pending, Draft, ตีกลับ, Expired
 */
import type { DatabaseSync } from 'node:sqlite';

type Row = {
  code: string;
  type: string;
  th: string;
  en?: string;
  status: 'DRAFT' | 'REJECTED' | 'PENDING' | 'APPROVED';
  start?: string;
  end?: string;
  by: string;
  approver?: string;
  reason?: string;
  /** ค่าเริ่มต้น ST000007 / CHN04 */
  pkg?: string;
  ch?: string;
  data: Record<string, unknown>;
};

const COMMON = {
  objective: 'NEW_SALES',
  rewardTiming: 'AFTER_FL',
  clawback: 'FL_CANCEL',
  tncTemplate: 'TNC-GENERAL',
  tncTh: '1. สิทธิ์นี้สำหรับผู้เอาประกันภัยที่ยื่นใบคำขอในช่วงระยะเวลา Campaign และกรมธรรม์ได้รับการอนุมัติ',
  costCenter: 'MKT-DIGITAL',
  bannerDesktop: 'banner-desktop.webp',
  bannerMobile: 'banner-mobile.webp',
  thumbnail: 'thumbnail.webp',
  sortOrder: 1,
};

const CAMPAIGNS: Row[] = [
  {
    code: 'CMP-VOU-2609-0001', type: 'VOUCHER', th: 'รับ e-Voucher 1,000 บาท เมื่อซื้อแม็กซ์ เท็น วัน', en: 'Get 1,000 THB e-Voucher',
    status: 'APPROVED', start: '2026-09-01', end: '2026-12-31', by: 'U002', approver: 'U003',
    data: {
      ...COMMON, tncTemplate: 'TNC-VOUCHER', description: 'e-Voucher 1,000 บาท สำหรับเบี้ยปีแรกตั้งแต่ 30,000 บาท', budget: 500000, quotaTotal: 500, quotaPerPolicy: 1,
      benefit: { voucherCode: 'VOU-001', mode: 'FIXED', perPolicy: 1, allocated: 250, deliveryChannel: 'EMAIL', validDays: 90, codeSource: 'SYSTEM' },
      rules: [{ attribute: 'FYP', operator: 'GTE', value: 30000 }],
    },
  },
  {
    code: 'CMP-DIS-2609-0001', type: 'DISCOUNT', th: 'ลดเบี้ยปีแรก 5% ช่องทางออนไลน์', en: '5% first-year discount',
    status: 'PENDING', start: '2026-10-01', end: '2026-12-31', by: 'U002',
    data: {
      ...COMMON, rewardTiming: 'ON_APPROVE', description: 'ส่วนลด 5% ของเบี้ยปีแรก สูงสุด 3,000 บาท', budget: 300000,
      benefit: { discountType: 'PERCENT', value: 5, basis: 'FYP', maxPerPolicy: 3000, rounding: 'FLOOR' },
      rules: [{ attribute: 'PAYMENT_MODE', operator: 'IN', value: ['PMM02'] }],
    },
  },
  {
    code: 'CMP-CSB-2609-0001', type: 'CASHBACK', th: 'เงินคืน 3% ตลอดไตรมาส 4', status: 'DRAFT', by: 'U002',
    data: { description: 'ร่าง — รอยืนยันงบประมาณ', benefit: { cashbackType: 'PERCENT', value: 3 } },
  },
  {
    code: 'CMP-CSB-2609-0002', type: 'CASHBACK', th: 'เงินคืน 1,500 บาท เบี้ยครบ 50,000', status: 'REJECTED', start: '2026-10-15', end: '2026-12-31',
    by: 'U002', reason: 'ข้อกำหนดและเงื่อนไขยังไม่ครบตามหลักเกณฑ์การโฆษณาของ คปภ.',
    data: {
      ...COMMON, budget: 150000,
      benefit: { cashbackType: 'AMOUNT', value: 1500, basis: 'FYP', payoutMethod: 'PROMPTPAY', payoutTiming: 'AFTER_FL', recipient: 'PAYER' },
      rules: [{ attribute: 'FYP', operator: 'GTE', value: 50000 }],
    },
  },
  {
    code: 'CMP-REF-2609-0001', type: 'REFERRAL', th: 'ลิงก์ขายแม็กซ์ เท็น วัน ปลายปี', en: 'Year-end referral link',
    status: 'APPROVED', start: '2026-11-01', end: '2027-03-31', by: 'U002', approver: 'U003',
    data: {
      objective: 'NEW_SALES', tncTemplate: 'TNC-GENERAL', tncTh: COMMON.tncTh, costCenter: 'MKT-DIGITAL',
      benefit: { landingContent: 'CT000001', attributionDays: 30, qrCode: true, utmSource: 'seller', utmMedium: 'referral' },
    },
  },
  {
    code: 'CMP-VOU-2606-0001', type: 'VOUCHER', th: 'e-Voucher 500 บาท กลางปี', status: 'APPROVED', start: '2026-06-01', end: '2026-08-31',
    by: 'U002', approver: 'U003',
    data: {
      ...COMMON, tncTemplate: 'TNC-VOUCHER', budget: 100000,
      benefit: { voucherCode: 'VOU-002', mode: 'FIXED', perPolicy: 1, allocated: 200, deliveryChannel: 'SMS', codeSource: 'SYSTEM' },
      rules: [],
    },
  },
  // ---- ST000006 × CHN01 (ตัวแทน) — ใช้กับเมนู Seller: ผูก Campaign กับกลุ่ม + Referral links (Figma 17:224, 17:496)
  {
    code: 'CMP-VOU-2609-0002', type: 'VOUCHER', th: 'Voucher 1,000 บาท เมื่อซื้อแฮปปี้ แวลู ผ่านตัวแทน', en: 'Agent e-Voucher 1,000 THB',
    status: 'APPROVED', start: '2026-09-01', end: '2026-11-30', by: 'U002', approver: 'U003', pkg: 'ST000006', ch: 'CHN01',
    data: {
      ...COMMON, tncTemplate: 'TNC-VOUCHER', costCenter: 'MKT-AGENCY', budget: 200000, quotaTotal: 200, quotaPerPolicy: 1,
      benefit: { voucherCode: 'VOU-001', mode: 'FIXED', perPolicy: 1, allocated: 100, deliveryChannel: 'SMS', codeSource: 'SYSTEM' },
      rules: [{ attribute: 'FYP', operator: 'GTE', value: 20000 }],
    },
  },
  {
    code: 'CMP-REF-2609-0002', type: 'REFERRAL', th: 'ลิงก์ขาย แฮปปี้ แวลู 90/20', en: 'Happy Value referral link',
    status: 'APPROVED', start: '2026-09-01', by: 'U002', approver: 'U003', pkg: 'ST000006', ch: 'CHN01',
    data: {
      objective: 'NEW_SALES', tncTemplate: 'TNC-GENERAL', tncTh: COMMON.tncTh, costCenter: 'MKT-AGENCY',
      benefit: { landingContent: 'CT000006', attributionDays: 30, qrCode: true, utmSource: 'seller', utmMedium: 'referral' },
    },
  },
  {
    code: 'CMP-GFT-2609-0001', type: 'FREE_GIFT', th: 'ของแถมกระบอกน้ำ', status: 'DRAFT', by: 'U002', pkg: 'ST000006', ch: 'CHN01',
    data: { description: 'ร่าง — ยังไม่ส่งอนุมัติ' },
  },
];

export function seedCampaign(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO campaign
       (campaign_code, type_code, name_th, name_en, status, start_date, end_date, package_codes, channel_codes, campaign_data,
        reject_reason, created_by, approved_by, approved_at, is_mock, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '2026-09-20 10:00:00', '2026-09-20 10:00:00')`,
  );
  for (const c of CAMPAIGNS) {
    insert.run(
      c.code, c.type, c.th, c.en ?? null, c.status, c.start ?? null, c.end ?? null,
      JSON.stringify([c.pkg ?? 'ST000007']), JSON.stringify([c.ch ?? 'CHN04']), JSON.stringify(c.data),
      c.reason ?? null, c.by, c.approver ?? null, c.approver ? '2026-09-22 14:00:00' : null,
    );
  }
}

/** สิทธิ์ (Grant) จำลองของ Campaign ที่ Approved — แสดงในหน้ารายละเอียด (CP-07) */
const GRANTS: [campaign: string, app: string, policy: string | null, fyp: number, value: number, status: string, date: string][] = [
  ['CMP-VOU-2609-0001', 'APP-000121', 'POL-000981', 45000, 1000, 'FULFILLED', '2026-09-05'],
  ['CMP-VOU-2609-0001', 'APP-000128', 'POL-000990', 32000, 1000, 'FULFILLED', '2026-09-08'],
  ['CMP-VOU-2609-0001', 'APP-000134', 'POL-001002', 38500, 1000, 'CONFIRMED', '2026-09-12'],
  ['CMP-VOU-2609-0001', 'APP-000137', 'POL-001011', 30000, 1000, 'CONFIRMED', '2026-09-15'],
  ['CMP-VOU-2609-0001', 'APP-000140', null, 52000, 1000, 'RESERVED', '2026-09-20'],
  ['CMP-VOU-2609-0001', 'APP-000141', null, 31000, 1000, 'RESERVED', '2026-09-21'],
  ['CMP-VOU-2609-0001', 'APP-000142', null, 30500, 1000, 'RELEASED', '2026-09-21'],
  ['CMP-VOU-2609-0001', 'APP-000150', 'POL-001030', 36000, 1000, 'CLAWED_BACK', '2026-09-22'],
  ['CMP-VOU-2606-0001', 'APP-000061', 'POL-000702', 18000, 500, 'FULFILLED', '2026-06-18'],
  ['CMP-VOU-2606-0001', 'APP-000077', 'POL-000745', 22000, 500, 'FULFILLED', '2026-07-02'],
  ['CMP-VOU-2606-0001', 'APP-000093', 'POL-000812', 15000, 500, 'FULFILLED', '2026-08-11'],
];

export function seedCampaignGrants(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO campaign_grant (campaign_code, application_no, policy_no, fyp, benefit_value, status, submitted_date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '2026-09-26 09:00:00')`,
  );
  for (const g of GRANTS) insert.run(...g);
}
