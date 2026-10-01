/**
 * Mapping ข้อความแสดงผล (MS-03) — ค่าตั้งต้นตามหน้าเว็บจริง online.philliplife.com
 */
import type { DatabaseSync } from 'node:sqlite';

export function seedDisplayMapping(db: DatabaseSync): void {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO display_mapping (mapping_type, code, channel_code, display_text, is_shown, icon, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'SYSTEM', '2026-09-24 09:00:00')`,
  );
  // การพิจารณารับประกัน → "การตรวจสุขภาพ" (OB-09)
  stmt.run('UNDERWRITE', 'GIO', '*', 'ไม่ต้องตรวจสุขภาพ', 1, null);
  stmt.run('UNDERWRITE', 'SIO', '*', 'ตอบคำถามสุขภาพ', 1, null);
  stmt.run('UNDERWRITE', 'FUW', '*', 'ตรวจสุขภาพตามเกณฑ์บริษัท', 1, null);

  // ช่องทางชำระเบี้ยที่แสดงบน Online (CHN04) — เว็บจริงแสดง 3 วิธี
  const online: Record<string, [string, number, string | null]> = {
    PMT01: ['', 0, null],
    PMT02: ['บัตรเครดิตและเดบิต', 1, 'card'],
    PMT03: ['', 0, null],
    PMT04: ['', 0, null],
    PMT05: ['QR PromptPay', 1, 'qr'],
    PMT06: ['ผ่อนชำระ 0%', 1, 'installment'],
    PMT07: ['', 0, null],
    PMT08: ['', 0, null],
    PMT09: ['', 0, null],
  };
  for (const [code, [text, shown, icon]] of Object.entries(online)) {
    stmt.run('PAYMENT_METHOD', code, 'CHN04', text, shown, icon);
  }
}
