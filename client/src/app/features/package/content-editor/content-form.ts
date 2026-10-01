/**
 * โครงข้อมูลในหน้า Content Editor (เก็บเป็น JSON ใน content.content_data)
 * ใช้ร่วมทั้ง 3 Template — แต่ละ Template ใช้เฉพาะส่วนที่มีในหน้า (doc 05 §5–6, doc 10)
 * buildForm() = เติมค่าตั้งต้นจาก Package (PKG / DRV) แล้วทับด้วยค่าที่บันทึกไว้
 */
import { ContentDetail } from '../../../core/models/content.model';
import { TemplateCode } from '../../../core/models/master.model';

export interface ContentFormData {
  /** ช่วงแสดงผล Content (FD-04, FD-09) — บันทึกลงคอลัมน์ display_start/end_date */
  display: { startDate: string; endDate: string };
  page: { slug: string; category: string; order: number | null; seoTitle: string; seoDescription: string };
  hero: { bgDesktop: string; bgMobile: string; label: string; displayName: string; headline: string; subHeadline: string };
  keyFeatures: { icon: string; topic: string; value: string }[];
  sticky: { icon: string; minPremium: number | null };
  calculator: { minPremium: number | null; maxPremium: number | null };
  highlights: { header: string; cards: { image: string; title: string; value: string }[] };
  benefits: { rates: (number | null)[]; samplePremium: number | null; note: string };
  promotion: { header: string };
  important: { coverageYears: number | null };
  summary: { attachment: string };
  recommend: { header: string; contents: string[] };
  card: { image: string; label: string; name: string; bullets: string[] };
  // ---------- OL_OB (Figma V2 — Content · Editor OL_OB, 27 ก.ย.)
  /** Icon Asset ของ Key Features */
  featureIcon: string;
  /** Key Features: topic = รหัสหัวข้อ (ค่า DRV จาก Package) หรือ 'CUSTOM' (กรอกเอง) · active = แสดงบนหน้าเว็บ */
  features: { icon: string; topic: string; value: string; active: boolean }[];
  advantages: { header: string; cards: { image: string; topic: string; title: string; subtitle: string }[] };
  /** Document General Terms & Conditions (PDF ≤ 10 MB · สูงสุด 10 ไฟล์) */
  documents: { name: string; size: number }[];
  // ---------- OL_PA
  plans: { planCode: string; displayName: string; premium: number | null }[];
  quickFacts: { premium: number | null; coveragePeriod: string };
  coverage: { topic: string; amount: number | null; unit: string }[];
  coverageTable: { header: string; groups: { name: string; rows: { name: string; amounts: Record<string, number | null> }[] }[] };
  // ---------- AGENT
  agentCard: { showPhone: boolean; showLine: boolean; showEmail: boolean; position: string };
  sellingPoints: { tags: string[]; points: { point: string; how: string }[]; faqs: { q: string; a: string }[] };
  salesKit: { name: string; file: string; shareable: boolean }[];
  social: { img11: string; img916: string; img191: string; message: string; hashtag: string };
}

/** หมวดสินค้า (OB-01) → ส่วนของ URL */
export const CATEGORIES: { name: string; path: string }[] = [
  { name: 'ออมทรัพย์', path: 'savings' },
  { name: 'ตลอดชีพ', path: 'whole-life' },
  { name: 'อุบัติเหตุ', path: 'accident' },
  { name: 'สุขภาพ', path: 'health' },
  { name: 'ลดหย่อนภาษี', path: 'tax' },
];

export const AGENT_POSITIONS = ['ใต้ Hero Banner', 'ท้าย Key Features', 'เหนือฟอร์มติดต่อกลับ'];

export function slugPrefix(template: TemplateCode, category: string): string {
  if (template === 'AGENT') return '/agent/products/';
  const path = CATEGORIES.find((c) => c.name === category)?.path ?? '…';
  return `/products/${path}/`;
}

/** หน่วยแสดงผลเบี้ย (DRV จาก Payment mode) — PMM01 = จ่ายเบี้ยครั้งเดียว */
export function premiumUnit(c: ContentDetail): string {
  const modes = c.package.paymentModes.map((m) => m.code);
  if (modes.length === 1 && modes[0] === 'PMM01') return 'จ่ายเบี้ยครั้งเดียว';
  return c.package.paymentModes.map((m) => m.name ?? m.code).join(', ') || '–';
}

function defaults(c: ContentDetail): ContentFormData {
  const label = c.subProductTypeName ? `ประกัน${c.subProductTypeName}` : '';
  const category = c.template === 'OL_PA' ? 'อุบัติเหตุ' : '';
  return {
    display: { startDate: c.startDate ?? '', endDate: c.endDate ?? '' },
    page: { slug: '', category, order: 1, seoTitle: c.nameTh, seoDescription: '' },
    hero: { bgDesktop: '', bgMobile: '', label, displayName: c.nameTh, headline: '', subHeadline: '' },
    keyFeatures: [{ icon: '', topic: '', value: '' }],
    sticky: { icon: '', minPremium: null },
    calculator: { minPremium: null, maxPremium: null },
    highlights: { header: '', cards: [0, 1, 2].map(() => ({ image: '', title: '', value: '' })) },
    benefits: { rates: [], samplePremium: null, note: '' },
    promotion: { header: 'โปรดี ๆ ที่ไม่ควรพลาด!' },
    important: { coverageYears: null },
    summary: { attachment: '' },
    recommend: { header: '', contents: [] },
    card: { image: '', label, name: c.nameTh, bullets: ['', '', ''] },
    featureIcon: '',
    features: [
      { icon: '', topic: 'SUM_INSURED', value: '', active: true },
      { icon: '', topic: 'ISSUE_AGE', value: '', active: true },
      { icon: '', topic: 'UNDERWRITE', value: '', active: true },
      { icon: '', topic: 'TAX', value: '', active: true },
      { icon: '', topic: 'CONTRACTUAL_PAYOUT', value: '', active: false },
      { icon: '', topic: 'CUSTOM', value: '', active: true },
    ],
    advantages: { header: '', cards: [0, 1, 2].map(() => ({ image: '', topic: '', title: '', subtitle: '' })) },
    documents: [],
    plans: c.plans.map((p, i) => ({ planCode: p.planCode, displayName: `แผน ${i + 1}`, premium: null })),
    quickFacts: { premium: null, coveragePeriod: '' },
    coverage: [{ topic: '', amount: null, unit: 'บาท' }],
    coverageTable: { header: '', groups: [{ name: '', rows: [{ name: '', amounts: {} }] }] },
    agentCard: { showPhone: true, showLine: true, showEmail: false, position: AGENT_POSITIONS[0] },
    sellingPoints: { tags: [], points: [{ point: '', how: '' }], faqs: [{ q: '', a: '' }] },
    salesKit: [],
    social: {
      img11: '',
      img916: '',
      img191: '',
      message: '[ข้อความแนะนำแบบประกัน] สอบถามได้ที่ {ชื่อตัวแทน} โทร {เบอร์โทร} ดูรายละเอียด {ลิงก์}',
      hashtag: '',
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** รวมค่าที่บันทึกไว้ทับค่าตั้งต้น (Object รวมทีละชั้น · Array ใช้ของที่บันทึกทั้งชุด) */
function merge<T>(base: T, saved: unknown): T {
  if (!isObj(base) || !isObj(saved)) return (saved === undefined ? base : (saved as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(saved)) out[k] = k in out ? merge(out[k], v) : v;
  return out as T;
}

export function buildForm(c: ContentDetail): ContentFormData {
  const form = merge(defaults(c), c.data);
  // ช่วงแสดงผลอ่านจากคอลัมน์ของ Content เสมอ
  form.display = { startDate: c.startDate ?? '', endDate: c.endDate ?? '' };
  // แผนของ OL_PA ต้องตรงกับแผนใน Package (เพิ่ม/ลดแผนทำที่ระบบต้นทาง — FD-08)
  form.plans = c.plans.map((p, i) => form.plans.find((x) => x.planCode === p.planCode) ?? { planCode: p.planCode, displayName: `แผน ${i + 1}`, premium: null });
  return form;
}

/** ย้ายรายการในตาราง (ลากเพื่อเรียงลำดับ) */
export function moveItem<T>(list: T[], from: number, to: number): void {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

/** Section ในแถบนำทางซ้าย (ลำดับตาม Figma ของแต่ละ Template) */
export interface NavItem {
  id: string;
  title: string;
}

export const NAV: Record<TemplateCode, NavItem[]> = {
  // Figma V2 (27 ก.ย.) — "List content" ไม่มีรหัส Section
  OL_OB: [
    { id: 'CI', title: 'Content information' },
    { id: 'TH', title: 'Thumbnail' },
    { id: 'BN', title: 'Banner display' },
    { id: 'KF', title: 'Key Features of the Insurance Plan' },
    { id: 'KA', title: 'Key Advantages' },
    { id: 'PR', title: 'Package recommend' },
    { id: 'DOC', title: 'Document Terms & Conditions' },
  ],
  OL_PA: [
    { id: 'PA-00', title: 'แผนใน Package' },
    { id: 'OB-01', title: 'ตั้งค่าหน้า' },
    { id: 'OB-02', title: 'Hero Banner' },
    { id: 'PA-03', title: 'Hero Quick facts' },
    { id: 'OB-04', title: 'Sticky bar' },
    { id: 'PA-05', title: 'Premium Calculator' },
    { id: 'PA-06', title: 'จุดเด่นของแผน' },
    { id: 'PA-07', title: 'ตารางความคุ้มครอง' },
    { id: 'OB-08', title: 'โปรโมชัน' },
    { id: 'OB-09', title: 'ข้อมูลสำคัญอื่นๆ' },
    { id: 'OB-10', title: 'สรุปสาระสำคัญ' },
    { id: 'OB-11', title: 'ประกันอื่นที่น่าสนใจ' },
    { id: 'OB-12', title: 'การ์ดสินค้า' },
  ],
  AGENT: [
    { id: 'OB-01', title: 'ตั้งค่าหน้า' },
    { id: 'OB-02', title: 'Hero Banner' },
    { id: 'OB-03', title: 'Key Features' },
    { id: 'OB-04', title: 'Sticky bar' },
    { id: 'AG-01', title: 'การ์ดตัวแทน' },
    { id: 'OB-05', title: 'Premium Calculator' },
    { id: 'OB-06', title: 'จุดเด่นของแผน' },
    { id: 'OB-07', title: 'ผลประโยชน์' },
    { id: 'OB-08', title: 'โปรโมชัน' },
    { id: 'OB-09', title: 'ข้อมูลสำคัญอื่นๆ' },
    { id: 'OB-10', title: 'สรุปสาระสำคัญ' },
    { id: 'OB-11', title: 'ประกันอื่นที่น่าสนใจ' },
    { id: 'OB-12', title: 'การ์ดสินค้า' },
    { id: 'AG-02', title: 'จุดขาย & กลุ่มเป้าหมาย' },
    { id: 'AG-03', title: 'Sales kit' },
    { id: 'AG-04', title: 'ชุดแชร์โซเชียล' },
  ],
};

/**
 * ลากแถวเพื่อเรียงลำดับ (กดค้างที่ ⋮⋮ แล้วลาก) — ใช้ร่วมทุกตารางใน Editor
 * <tr [attr.draggable]="drag.armed === i" (dragstart)="drag.start(i)" (dragover)="drag.over(i, $event)"
 *     (drop)="drag.drop(list)" (dragend)="drag.end()" [class.dragging]="drag.from === i" [class.drop-target]="drag.isTarget(i)">
 *   <td class="handle"><span class="grip" (mousedown)="drag.arm(i)"></span></td>
 */
export class RowDrag {
  armed = -1;
  from = -1;
  to = -1;

  arm(i: number): void {
    this.armed = i;
  }
  start(i: number): void {
    this.from = i;
  }
  over(i: number, event: DragEvent): void {
    if (this.from < 0) return;
    event.preventDefault();
    this.to = i;
  }
  drop<T>(list: T[]): void {
    moveItem(list, this.from, this.to);
    this.end();
  }
  end(): void {
    this.armed = this.from = this.to = -1;
  }
  isTarget(i: number): boolean {
    return this.from >= 0 && this.to === i && this.from !== i;
  }
}
