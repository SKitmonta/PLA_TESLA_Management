/**
 * Master ที่ Sync จากระบบต้นทาง (MS-04) — Prototype ใช้ข้อมูลจำลองตามโครงสร้าง Payload
 * Channel อ้างอิงรายการจาก Payload ตัวอย่าง (planCommissionChannel)
 */
import type { DatabaseSync } from 'node:sqlite';

type Row = [type: string, code: string, nameTh: string | null, nameEn: string | null, parent?: string | null, status?: 'OK' | 'INCOMPLETE'];

const ROWS: Row[] = [
  ['CHANNEL', 'CHN01', 'ตัวแทนของบริษัท', 'Agent'],
  ['CHANNEL', 'CHN02', 'นายหน้าประกันชีวิต', 'Broker'],
  ['CHANNEL', 'CHN03', 'ธนาคาร', 'Bancassurance'],
  ['CHANNEL', 'CHN04', 'ลูกค้าติดต่อโดยตรงกับบริษัททางอิเล็กทรอนิกส์', 'Direct Online'],
  ['CHANNEL', 'CHN05', 'ขายตรง', 'Direct Marketing'],
  ['CHANNEL', 'CHN06', 'การขายผ่านองค์กร', 'Work Site'],
  ['CHANNEL', 'CHN07', 'ตัวแทนของบริษัท (ขายช่องทางออนไลน์)', 'Agent Online'],
  ['CHANNEL', 'CHN08', 'นายหน้าประกันชีวิต (ขายช่องทางออนไลน์)', 'Broker Online'],
  ['CHANNEL', 'CHN09', 'ช่องทางจัดจำหน่าย/ขยายธุรกิจผ่านพันธมิตร', 'Partnership'],
  ['CHANNEL', 'CHN11', null, null, null, 'INCOMPLETE'],

  ['PAYMENT_MODE', 'PMM01', 'ชำระครั้งเดียว', 'Single premium'],
  ['PAYMENT_MODE', 'PMM02', 'รายปี', 'Annual'],
  ['PAYMENT_MODE', 'PMM03', 'ราย 6 เดือน', 'Semi-annual'],
  ['PAYMENT_MODE', 'PMM04', 'ราย 3 เดือน', 'Quarterly'],
  ['PAYMENT_MODE', 'PMM05', 'รายเดือน', 'Monthly'],

  ['PAYMENT_METHOD', 'PMT01', 'เช็ค', 'Cheque'],
  ['PAYMENT_METHOD', 'PMT02', 'บัตรเครดิต', 'Credit card'],
  ['PAYMENT_METHOD', 'PMT03', 'ชำระบิล', 'Bill payment'],
  ['PAYMENT_METHOD', 'PMT04', 'หักผ่านบัญชีธนาคาร', 'Direct debit'],
  ['PAYMENT_METHOD', 'PMT05', 'คิวอาร์/พร้อมเพย์', 'QR / PromptPay'],
  ['PAYMENT_METHOD', 'PMT06', 'ผ่อนชำระ', 'Installment'],
  ['PAYMENT_METHOD', 'PMT07', 'ชำระผ่านระบบธนาคารออนไลน์', 'Internet banking'],
  ['PAYMENT_METHOD', 'PMT08', 'เงินสด', 'Cash'],
  ['PAYMENT_METHOD', 'PMT09', 'หักจากเงินเดือน', 'Payroll deduction'],

  ['GENDER', 'M', 'ชาย', 'Male'],
  ['GENDER', 'F', 'หญิง', 'Female'],

  ['OCCUPATION_CLASS', 'OCC01', 'ชั้นอาชีพ 1', 'Class 1'],
  ['OCCUPATION_CLASS', 'OCC02', 'ชั้นอาชีพ 2', 'Class 2'],
  ['OCCUPATION_CLASS', 'OCC03', 'ชั้นอาชีพ 3', 'Class 3'],
  ['OCCUPATION_CLASS', 'OCC04', 'ชั้นอาชีพ 4', 'Class 4'],

  ['PRODUCT_TYPE', 'PTY01', 'ประกันชีวิตสามัญ', 'Ordinary life'],
  ['PRODUCT_TYPE', 'PTY08', 'ประกันภัยอุบัติเหตุ', 'Personal accident'],

  ['SUB_PRODUCT_TYPE', 'SPT02', 'ตลอดชีพ', 'Whole life', 'PTY01'],
  ['SUB_PRODUCT_TYPE', 'SPT03', 'สะสมทรัพย์', 'Endowment', 'PTY01'],
  ['SUB_PRODUCT_TYPE', 'SPT-PA', '[Sub type PA]', '[Sub type PA]', 'PTY08'],

  ['UNDERWRITE_TYPE', 'GIO', 'รับประกันโดยไม่ต้องตรวจสุขภาพ', 'Guaranteed Issue Offer'],
  ['UNDERWRITE_TYPE', 'SIO', 'รับประกันโดยตอบคำถามสุขภาพ', 'Simplified Issue Offer'],
  ['UNDERWRITE_TYPE', 'FUW', 'พิจารณารับประกันเต็มรูปแบบ', 'Full Underwriting'],
];

export function seedSyncedMaster(db: DatabaseSync): void {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO synced_master (master_type, code, name_th, name_en, parent_code, data_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const [type, code, th, en, parent, status] of ROWS) {
    stmt.run(type, code, th, en, parent ?? null, status ?? 'OK');
  }
  const hasLog = db.prepare("SELECT COUNT(*) AS n FROM sync_log WHERE scope = 'MASTER'").get() as { n: number };
  if (hasLog.n === 0) {
    db.prepare("INSERT INTO sync_log (scope, synced_at, synced_by, note) VALUES ('MASTER', '2026-09-24 09:00:00', 'SYSTEM', 'Initial seed')").run();
    db.prepare("INSERT INTO sync_log (scope, synced_at, synced_by, note) VALUES ('PACKAGE', '2026-09-24 09:00:00', 'SYSTEM', 'Initial seed')").run();
  }
}
