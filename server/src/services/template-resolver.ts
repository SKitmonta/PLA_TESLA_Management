/**
 * Template Resolution (doc 05 §3, FD-12 — พี่ฟิล์ม 27 ก.ย. 2569)
 *   1. Channel ที่ชื่อมีคำว่า "online" + Product type = Ordinary Life      → OL_OB
 *   2. Channel ที่ชื่อมีคำว่า "online" + Product type = Personal Accident  → OL_PA
 *   3. Channel ที่ชื่อไม่มีคำว่า "online" (ทุก Product type)             → AGENT
 *   Channel online + Product type อื่น / Channel ที่ข้อมูลไม่ครบ           → null (ไม่แสดงใน Add Package)
 * ชื่ออ่านจาก Master ที่ Sync (synced_master.name_en / name_th) · product_Type_Code อ่านจากแผน plan_Role = MASTER
 * ต้องการเปลี่ยนเงื่อนไข → แก้ที่ไฟล์นี้ที่เดียว
 */
import { getDb } from '../db/database.js';

export type TemplateCode = 'OL_OB' | 'OL_PA' | 'AGENT';

/** คำที่ใช้ตัดสินว่าเป็นช่องทาง Online (ไม่สนตัวพิมพ์เล็ก/ใหญ่) */
const ONLINE_WORDS = ['online', 'ออนไลน์'];

/** Product type (ชื่อภาษาอังกฤษ) → Template ของช่องทาง Online */
const ONLINE_PRODUCT_RULES: { match: string; template: TemplateCode }[] = [
  { match: 'ordinary life', template: 'OL_OB' },
  { match: 'personal accident', template: 'OL_PA' },
];

interface MasterName {
  name_th: string | null;
  name_en: string | null;
  data_status: string | null;
}

function masterName(type: string, code: string): MasterName | undefined {
  return getDb()
    .prepare('SELECT name_th, name_en, data_status FROM synced_master WHERE master_type = ? AND code = ?')
    .get(type, code) as MasterName | undefined;
}

function isComplete(m: MasterName | undefined): m is MasterName {
  return !!m && m.data_status !== 'INCOMPLETE' && !!(m.name_en || m.name_th);
}

/** ช่องทางนี้เป็น Online หรือไม่ (null = ข้อมูล Channel ไม่ครบ) */
export function isOnlineChannel(channelCode: string): boolean | null {
  const ch = masterName('CHANNEL', channelCode);
  if (!isComplete(ch)) return null;
  const text = `${ch.name_en ?? ''} ${ch.name_th ?? ''}`.toLowerCase();
  return ONLINE_WORDS.some((w) => text.includes(w));
}

export function resolveTemplate(channelCode: string, productTypeCode: string | null | undefined): TemplateCode | null {
  const online = isOnlineChannel(channelCode);
  if (online === null) return null;
  if (!online) return 'AGENT';
  if (!productTypeCode) return null;
  const pt = masterName('PRODUCT_TYPE', productTypeCode);
  const name = `${pt?.name_en ?? ''}`.toLowerCase();
  return ONLINE_PRODUCT_RULES.find((r) => name.includes(r.match))?.template ?? null;
}

/** รายการ Template ที่ช่องทางนี้ใช้ได้ (ใช้ในหน้า Master ที่ Sync) */
export function templatesForChannel(channelCode: string): TemplateCode[] {
  const online = isOnlineChannel(channelCode);
  if (online === null) return [];
  return online ? ONLINE_PRODUCT_RULES.map((r) => r.template) : ['AGENT'];
}
