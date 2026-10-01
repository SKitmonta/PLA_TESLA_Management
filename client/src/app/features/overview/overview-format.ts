/**
 * รูปแบบตัวเลขของเมนู Overview — ล้านบาท / จำนวนกรมธรรม์ / ชื่อเดือนภาษาไทย
 */
import { Metric } from '../../core/models/overview.model';

export const METRIC_LABEL: Record<Metric, string> = { FYP: 'FYP', APE: 'APE', POLICY: 'จำนวนกรมธรรม์' };
export const METRIC_UNIT: Record<Metric, string> = { FYP: 'บาท', APE: 'บาท', POLICY: 'ฉบับ' };

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** 2026-09 → ก.ย. (withYear = ก.ย. 2026) */
export function monthLabel(period: string, withYear = false): string {
  const [y, m] = period.split('-').map(Number);
  return `${TH_MONTH[m - 1]}${withYear ? ' ' + y : ''}`;
}

/** มูลค่าแบบย่อ: เงิน ≥ 1 ล้าน → "2.9 ล้าน" · จำนวนกรมธรรม์ → "356" */
export function short(v: number | null | undefined, metric: Metric): string {
  if (v === null || v === undefined) return '–';
  if (metric === 'POLICY') return Math.round(v).toLocaleString('en-US');
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, '')} ล้าน`;
  return Math.round(v).toLocaleString('en-US');
}

export function full(v: number | null | undefined): string {
  return v === null || v === undefined ? '–' : Math.round(v).toLocaleString('en-US');
}

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function thDate(s: string): string {
  return s.split('-').reverse().join('/');
}
