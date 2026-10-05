/**
 * เทียบเนื้อหา Content 2 Version (หน้าอนุมัติ CT-06 — "สิ่งที่เปลี่ยนจาก vN")
 * เทียบทีละ Field (ค่าเดี่ยว) · รายการ (Array) เทียบทั้งชุดแล้วแสดงจำนวนแถว / รายการที่เพิ่ม-ลบ
 * Section ของแต่ละ Field ตาม NAV ของ Template (content-editor/content-form.ts)
 */
import { TemplateCode } from '../../../core/models/master.model';

export interface DiffRow {
  section: string;
  field: string;
  before: string;
  after: string;
}

type Obj = Record<string, unknown>;

/** Field (ส่วนหัวของ path) → รหัส Section ในแต่ละ Template */
const SECTION: Record<TemplateCode, Record<string, string>> = {
  OL_OB: { display: 'CI', page: 'CI', tagFilter: 'CI', card: 'TH', hero: 'BN', featureIcon: 'KF', features: 'KF', advantages: 'KA', recommend: 'PR', documents: 'DOC' },
  OL_PA: {
    plans: 'PA-00', display: 'OB-01', page: 'OB-01', hero: 'OB-02', quickFacts: 'PA-03', coverage: 'PA-03', sticky: 'OB-04', calculator: 'PA-05',
    highlights: 'PA-06', coverageTable: 'PA-07', promotion: 'OB-08', important: 'OB-09', summary: 'OB-10', recommend: 'OB-11', card: 'OB-12',
  },
  AGENT: {
    display: 'OB-01', page: 'OB-01', hero: 'OB-02', keyFeatures: 'OB-03', sticky: 'OB-04', agentCard: 'AG-01', calculator: 'OB-05', highlights: 'OB-06',
    benefits: 'OB-07', promotion: 'OB-08', important: 'OB-09', summary: 'OB-10', recommend: 'OB-11', card: 'OB-12', sellingPoints: 'AG-02',
    salesKit: 'AG-03', social: 'AG-04',
  },
};

/** ชื่อ Field ที่อ่านง่าย (ไม่มีในรายการ = แสดง path) */
const LABEL: Record<string, string> = {
  'display.startDate': 'Start Date',
  'display.endDate': 'End Date',
  'page.slug': 'URL slug',
  'page.category': 'หมวดสินค้า',
  'page.order': 'ลำดับการแสดงผล',
  'page.seoTitle': 'SEO title',
  'page.seoDescription': 'SEO description',
  'tagFilter.coverageTypes': 'Tag Filter: ประเภทความคุ้มครอง',
  'tagFilter.featureTags': 'Tag Filter: จุดเด่น',
  'card.image': 'รูป Thumbnail',
  'card.label': 'ป้ายการ์ด',
  'card.name': 'ชื่อบนการ์ด',
  'card.bullets': 'ข้อความ Thumbnail',
  'hero.bgDesktop': 'Banner Desktop',
  'hero.bgMobile': 'Banner Mobile',
  'hero.label': 'Label',
  'hero.displayName': 'ชื่อแสดงผล',
  'hero.headline': 'Headline',
  'hero.subHeadline': 'Sub headline',
  featureIcon: 'Icon Asset',
  features: 'Key Features',
  keyFeatures: 'Key Features',
  'advantages.header': 'Header จุดเด่น',
  'advantages.cards': 'การ์ดจุดเด่น',
  'recommend.header': 'Header',
  'recommend.contents': 'ประกันอื่นที่น่าสนใจ',
  'recommend.packages': 'Package recommend',
  documents: 'เอกสารเงื่อนไข',
  'sticky.minPremium': 'เบี้ยเริ่มต้น',
  'quickFacts.premium': 'เบี้ยประกันเริ่มต้น',
  'quickFacts.coveragePeriod': 'ระยะเวลาคุ้มครอง',
  coverage: 'Coverage highlights',
  plans: 'แผนใน Package',
  'highlights.cards': 'การ์ดจุดเด่น',
  'coverageTable.groups': 'ตารางความคุ้มครอง',
  'sellingPoints.points': 'จุดขายหลัก',
  'sellingPoints.faqs': 'คำถามที่พบบ่อย',
  'sellingPoints.tags': 'กลุ่มลูกค้าเป้าหมาย',
  salesKit: 'Sales kit',
  'social.message': 'ข้อความสำเร็จรูป',
};

/** แตก Object เป็น path → ค่า (Array ถือเป็นค่าเดียว) */
function flatten(o: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o as Obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (prefix) {
    out[prefix] = o;
  }
  return out;
}

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

function text(v: unknown): string {
  if (empty(v)) return '–';
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== 'object')) return v.filter((x) => x !== '' && x !== null).join(', ') || '–';
    return `${v.length} แถว`;
  }
  if (typeof v === 'boolean') return v ? 'ใช่' : 'ไม่';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  return String(v);
}

/** รายการที่เพิ่ม (มีใน after ไม่มีใน before) — ใช้สรุปการเปลี่ยนของ Array แบบแถว */
function added(before: unknown, after: unknown): string {
  if (!Array.isArray(before) || !Array.isArray(after)) return '';
  const b = new Set(before.map((x) => JSON.stringify(x)));
  const plus = after.filter((x) => !b.has(JSON.stringify(x)));
  const pick = (x: unknown) => {
    if (typeof x !== 'object' || !x) return String(x);
    const o = x as Obj;
    return String(o['value'] || o['title'] || o['name'] || o['point'] || o['q'] || o['topic'] || '').trim();
  };
  return plus.length ? ` (+ ${plus.map(pick).filter(Boolean).join(', ') || plus.length + ' แถว'})` : '';
}

export function diffContent(template: TemplateCode, before: Obj | null, after: Obj): DiffRow[] {
  const a = flatten(before ?? {});
  const b = flatten(after);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const rows: DiffRow[] = [];
  for (const k of keys) {
    const x = a[k];
    const y = b[k];
    if (JSON.stringify(x ?? null) === JSON.stringify(y ?? null) || (empty(x) && empty(y))) continue;
    const head = k.split('.')[0];
    rows.push({
      section: SECTION[template][head] ?? '–',
      field: LABEL[k] ?? LABEL[head] ?? k,
      before: text(x),
      after: Array.isArray(y) && y.some((v) => typeof v === 'object') ? `${text(y)}${added(x, y)}` : text(y),
    });
  }
  // เรียงตามลำดับ Section ของ Template
  const order = [...new Set(Object.values(SECTION[template]))];
  return rows.sort((p, q) => order.indexOf(p.section) - order.indexOf(q.section));
}
