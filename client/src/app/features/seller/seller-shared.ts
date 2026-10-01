/**
 * ค่ากลางของเมนู Seller — ป้ายชื่อ Action ใน Audit log, สีกลุ่ม, Export CSV (เปิดด้วย Excel ได้)
 */
import { Seller } from '../../core/models/seller.model';

export const ACTION_LABEL: Record<string, string> = {
  CREATE_GROUP: 'สร้างกลุ่ม',
  UPDATE_GROUP: 'แก้ไขกลุ่ม',
  DELETE_GROUP: 'ลบกลุ่ม',
  MOVE: 'ย้ายผู้ขาย',
  BIND: 'ผูก Campaign',
  UNBIND: 'ถอด Campaign',
  IMPORT: 'Import',
  COPY: 'คัดลอกกลุ่ม',
  SYNC_REMOVE: 'Removed by sync',
};

export const SOURCE_LABEL: Record<string, string> = { UI: 'UI', IMPORT: 'Import', COPY: 'Copy', SYNC: 'Sync' };

/** สีกลุ่มให้เลือก (BR-PM-003) */
export const GROUP_COLORS = ['#2854a7', '#0f8a5f', '#b45309', '#7c3aed', '#be123c', '#0e7490', '#4d7c0f', '#475569'];

export const TYPE_LABEL: Record<Seller['sellerType'], string> = { AGENT: 'ตัวแทน', EMPLOYEE: 'พนักงาน' };

export const STATUS_LABEL: Record<Seller['status'], string> = { ACTIVE: 'Active', SUSPENDED: 'พักงาน', TERMINATED: 'สิ้นสุด' };

/** ข้อความสถานะพร้อมขายของผู้ขาย 1 คน */
export function readiness(s: Seller): { text: string; tone: 'ok' | 'warn' | 'bad' } {
  if (!s.ready) return { text: s.reason ?? 'ไม่พร้อมขาย', tone: 'bad' };
  if (s.licenseWarning) return { text: 'ใบอนุญาตหมดใน 30 วัน', tone: 'warn' };
  return { text: 'พร้อมขาย', tone: 'ok' };
}

/** YYYY-MM-DD → MM/YYYY */
export function monthYear(d: string | null): string {
  if (!d) return '';
  const [y, m] = d.split('-');
  return `${m}/${y}`;
}

/** 2026-09-24 10:02:00 → 24/09/2026 10:02 */
export function dateTime(v: string | null): string {
  if (!v) return '–';
  const [d, t = ''] = v.split(' ');
  return `${d.split('-').reverse().join('/')} ${t.slice(0, 5)}`.trim();
}

/** ดาวน์โหลด CSV (UTF-8 BOM ให้ Excel อ่านภาษาไทยได้) */
export function downloadCsv(fileName: string, rows: (string | number | null | undefined)[][]): void {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** อ่าน CSV อย่างง่าย (รองรับ "…" ครอบค่า) — ใช้กับไฟล์ Import */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') (row.push(cell), (cell = ''));
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}
