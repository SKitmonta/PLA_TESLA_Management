/**
 * Master ที่สร้างเอง (MS-02 หน้าจอ) — ตัวอย่างข้อมูลตั้งต้นของ MS-01…MS-22
 * [ชื่อในวงเล็บเหลี่ยม] = ค่าตัวอย่าง รอข้อมูลจริงจากทีม Marketing / บัญชี
 */
import type { DatabaseSync } from 'node:sqlite';

type Item = [type: string, code: string, th: string, en: string | null, attrs?: Record<string, unknown>, active?: boolean];

const ITEMS: Item[] = [
  ['MS-01', 'VOUCHER', 'Voucher', 'Voucher', { benefit_kind: 'สิ่งของ', description: 'มอบ e-Voucher / บัตรกำนัล' }],
  ['MS-01', 'DISCOUNT', 'ส่วนลดเบี้ย', 'Discount', { benefit_kind: 'มูลค่าเงิน', description: 'ลดเบี้ยประกันโดยตรง' }],
  ['MS-01', 'CASHBACK', 'เงินคืน', 'Cashback', { benefit_kind: 'มูลค่าเงิน', description: 'คืนเงินหลังพ้น Free look' }],
  ['MS-01', 'FREE_GIFT', 'ของแถม', 'Free gift', { benefit_kind: 'สิ่งของ' }],
  ['MS-01', 'INSTALLMENT', 'ผ่อน 0%', 'Installment', { benefit_kind: 'ผ่อนชำระ' }],
  ['MS-01', 'REWARD_POINTS', 'คะแนนสะสม', 'Reward points', { benefit_kind: 'คะแนน' }],
  ['MS-01', 'REFERRAL', 'แนะนำเพื่อน / ลิงก์ผู้ขาย', 'Referral', { benefit_kind: 'ลิงก์ติดตาม' }],
  ['MS-01', 'BUNDLE', 'ซื้อคู่ลดเพิ่ม', 'Bundle', { benefit_kind: 'มูลค่าเงิน' }],
  ['MS-01', 'LUCKY_DRAW', 'ลุ้นรางวัล', 'Lucky draw', { benefit_kind: 'สิทธิ์ลุ้นรางวัล' }],

  ['MS-02', 'NEW_SALES', 'เพิ่มยอดขายใหม่', 'New sales'],
  ['MS-02', 'RETENTION', 'รักษาฐานลูกค้า', 'Retention'],
  ['MS-02', 'LAUNCH', 'เปิดตัวสินค้า', 'Product launch'],

  ['MS-03', 'ON_APPROVE', 'ให้สิทธิ์เมื่ออนุมัติกรมธรรม์', 'On policy approval', { reference_point: 'อนุมัติกรมธรรม์', offset_days: 0 }],
  ['MS-03', 'AFTER_FL', 'ให้สิทธิ์หลังพ้น Free look', 'After free look', { reference_point: 'พ้น Free look', offset_days: 7 }],

  ['MS-04', 'FL_CANCEL', 'ยกเลิกในช่วง Free look', 'Cancel in free look', { event: 'ยกเลิกใน Free look', period_months: 0, method: 'เรียกคืน' }],
  ['MS-04', 'SURRENDER_12', 'เวนคืนภายใน 12 เดือน', 'Surrender within 12 months', { event: 'เวนคืน', period_months: 12, method: 'หักจากเงินคืน' }],

  ['MS-07', 'AGE', 'อายุผู้เอาประกัน', 'Insured age', { data_type: 'ตัวเลข', operators: '=, ≥, ≤, ระหว่าง' }],
  ['MS-07', 'PREMIUM', 'เบี้ยประกันปีแรก', 'First year premium', { data_type: 'ตัวเลข', operators: '≥, ≤, ระหว่าง' }],
  ['MS-07', 'PAYMENT_MODE', 'งวดการชำระ', 'Payment mode', { data_type: 'รหัส (Master)', operators: 'อยู่ใน', ref_master: 'Payment Mode (Sync)' }],

  ['MS-08', 'NEW', 'ลูกค้าใหม่', 'New customer', { definition: 'ไม่มีกรมธรรม์ Inforce กับบริษัท' }],
  ['MS-08', 'EXISTING', 'ลูกค้าเดิม', 'Existing customer', { definition: 'มีกรมธรรม์ Inforce อย่างน้อย 1 ฉบับ' }],

  ['MS-22', 'ELIGIBLE', 'เข้าเงื่อนไข', 'Eligible', { budget_effect: 'จอง', is_terminal: false }],
  ['MS-22', 'GRANTED', 'ให้สิทธิ์แล้ว', 'Granted', { budget_effect: 'ตัด', is_terminal: true }],
  ['MS-22', 'RELEASED', 'คืนสิทธิ์ (ไม่อนุมัติ)', 'Released', { budget_effect: 'คืน', is_terminal: true }],
  ['MS-22', 'CLAWED_BACK', 'เรียกคืนสิทธิ์', 'Clawed back', { budget_effect: 'คืน', is_terminal: true }],

  ['MS-09', 'PARTNER-A', '[ร้านค้า A]', null, { partner_type: 'ร้านค้า', contact: '[ผู้ติดต่อ]', contract_end: '2027-12-31' }],
  ['MS-09', 'PARTNER-B', '[ร้านค้า B]', null, { partner_type: 'ร้านค้า', contact: '[ผู้ติดต่อ]', contract_end: '2027-06-30' }],

  ['MS-10', 'VOU-001', 'e-Voucher 1,000 บาท', null, { partner: '[ร้านค้า A]', voucher_type: 'e-Voucher', face_value: 1000, total_qty: 500, reserved_qty: 50, delivered_qty: 200, expiry_date: '2026-12-31' }],
  ['MS-10', 'VOU-002', 'e-Voucher 500 บาท', null, { partner: '[ร้านค้า B]', voucher_type: 'e-Voucher', face_value: 500, total_qty: 1000, reserved_qty: 0, delivered_qty: 0, expiry_date: '2027-06-30' }],
  ['MS-10', 'VOU-003', 'บัตรกำนัล 300 บาท', null, { partner: '[ร้านค้า C]', voucher_type: 'กระดาษ', face_value: 300, total_qty: 200, reserved_qty: 0, delivered_qty: 200, expiry_date: '2026-10-31' }, false],

  ['MS-16', 'GIFT-001', 'กระเป๋าผ้า PhillipLife', null, { sku: 'GF-BAG-01', unit_value: 350, total_qty: 300, reserved_qty: 20, delivered_qty: 40 }],

  ['MS-17', 'KBANK', 'ธนาคารกสิกรไทย', 'Kasikornbank', { card_types: 'Visa, Mastercard' }],
  ['MS-17', 'SCB', 'ธนาคารไทยพาณิชย์', 'SCB', { card_types: 'Visa, Mastercard, JCB' }],
  ['MS-17', 'KTC', 'เคทีซี', 'KTC', { card_types: 'Visa, Mastercard' }],

  ['MS-18', 'M3', 'ผ่อน 3 เดือน', '3 months', { months: 3 }],
  ['MS-18', 'M6', 'ผ่อน 6 เดือน', '6 months', { months: 6 }],
  ['MS-18', 'M10', 'ผ่อน 10 เดือน', '10 months', { months: 10 }],

  ['MS-11', 'SMS', 'SMS', 'SMS', { usage: 'ส่งมอบ' }],
  ['MS-11', 'EMAIL', 'อีเมล', 'Email', { usage: 'ทั้งสองแบบ' }],
  ['MS-11', 'LINE', 'LINE', 'LINE', { usage: 'ทั้งสองแบบ' }],
  ['MS-11', 'POST', 'ไปรษณีย์', 'Post', { usage: 'ส่งมอบ' }],
  ['MS-11', 'BRANCH', 'รับที่สาขา', 'Branch', { usage: 'ส่งมอบ' }],
  ['MS-11', 'WEB', 'เว็บไซต์', 'Website', { usage: 'ประกาศผล' }],

  ['MS-13', 'FYP', 'เบี้ยปีแรก', 'First year premium'],
  ['MS-13', 'ALL_YEARS', 'เบี้ยทุกปี', 'All years'],
  ['MS-13', 'FIRST_INSTALLMENT', 'งวดแรก', 'First installment'],

  ['MS-14', 'FLOOR', 'ปัดลงเป็นจำนวนเต็ม', 'Round down', { method: 'ปัดลง', decimals: 0 }],
  ['MS-14', 'CEIL', 'ปัดขึ้นเป็นจำนวนเต็ม', 'Round up', { method: 'ปัดขึ้น', decimals: 0 }],
  ['MS-14', 'ROUND2', 'ปัดทศนิยม 2 ตำแหน่ง', 'Round 2 decimals', { method: 'ปัดตามหลักคณิตศาสตร์', decimals: 2 }],

  ['MS-15', 'BANK_TRANSFER', 'โอนเข้าบัญชีผู้ชำระเบี้ย', 'Bank transfer', { required_info: 'เลขบัญชี' }],
  ['MS-15', 'PROMPTPAY', 'พร้อมเพย์', 'PromptPay', { required_info: 'เลขพร้อมเพย์' }],
  ['MS-15', 'CARD_REFUND', 'คืนเข้าบัตรเครดิต', 'Card refund', { required_info: 'บัตรที่ใช้ชำระ' }],

  // Campaign Wizard ขั้น 2 / 3 (เพิ่ม 27 ก.ย.) — [ค่าตัวอย่าง] รอข้อมูลจริงจาก Compliance / บัญชี
  ['MS-05', 'TNC-GENERAL', 'ข้อกำหนดทั่วไปของ Campaign', 'General campaign terms', {
    campaign_type: 'ทุกประเภท', version: '1.0', effective_date: '2026-01-01',
    content_th: '1. สิทธิ์นี้สำหรับผู้เอาประกันภัยที่ยื่นใบคำขอในช่วงระยะเวลา Campaign และกรมธรรม์ได้รับการอนุมัติ\n2. บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า\n3. [เงื่อนไขเพิ่มเติมตามหลักเกณฑ์การโฆษณาของ คปภ.]',
    content_en: '1. This offer applies to applications submitted within the campaign period and approved by the company.\n2. [Additional terms]',
  }],
  ['MS-05', 'TNC-VOUCHER', 'ข้อกำหนด Voucher / ของแถม', 'Voucher & gift terms', {
    campaign_type: 'Voucher, Free gift', version: '1.0', effective_date: '2026-01-01',
    content_th: '1. บริษัทจะส่ง Voucher ภายใน 30 วันหลังพ้นระยะเวลาปลดเปลื้องกรมธรรม์ (Free look)\n2. Voucher ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้\n3. หากยกเลิกกรมธรรม์ในช่วง Free look บริษัทจะเรียกคืนสิทธิ์',
  }],
  ['MS-06', 'MKT-DIGITAL', 'ฝ่ายการตลาดดิจิทัล', 'Digital Marketing', { cost_center: '[CC-4100]', gl_account: '[5301-01]', campaign_type: 'ทุกประเภท' }],
  ['MS-06', 'MKT-AGENCY', 'ฝ่ายการตลาดช่องทางตัวแทน', 'Agency Marketing', { cost_center: '[CC-4200]', gl_account: '[5301-02]', campaign_type: 'ทุกประเภท' }],
  ['MS-19', 'PL-POINTS', 'PhillipLife Points', 'PhillipLife Points', { partner: 'บริษัท', baht_per_point: 0.1, expiry_months: 24 }],
  ['MS-19', 'KTC-FOREVER', 'KTC Forever', 'KTC Forever', { partner: 'เคทีซี', baht_per_point: 0.2, expiry_months: 36 }],
  ['MS-21', 'PRIZE-IPHONE', 'iPhone 17', 'iPhone 17', { value: 39900, quantity: 1, partner: '[ร้านค้า A]' }],
  ['MS-21', 'PRIZE-GOLD', 'ทองคำ 1 บาท', 'Gold 1 baht', { value: 45000, quantity: 3 }],
  ['MS-21', 'PRIZE-VOUCHER', 'e-Voucher 1,000 บาท', 'e-Voucher 1,000', { value: 1000, quantity: 50 }],
];

export function seedCustomMaster(db: DatabaseSync): void {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO custom_master_item (type_code, item_code, name_th, name_en, sort_order, is_active, attributes, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'SYSTEM', '2026-09-24 09:00:00')`,
  );
  const order = new Map<string, number>();
  for (const [type, code, th, en, attrs, active] of ITEMS) {
    const n = (order.get(type) ?? 0) + 1;
    order.set(type, n);
    stmt.run(type, code, th, en, n, active === false ? 0 : 1, JSON.stringify(attrs ?? {}));
  }
}
