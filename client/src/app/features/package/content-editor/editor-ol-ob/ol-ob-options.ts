/**
 * ตัวเลือกและกฎของ Editor OL_OB (Figma V2 — 27 ก.ย. 2569)
 *  - หัวข้อ Key Features: ค่า (Value) ดึงจาก Package อัตโนมัติ (DRV · อ่านอย่างเดียว) ยกเว้น "กำหนดเอง"
 *    หัวข้อที่ Package ไม่มีข้อมูล (เช่น Contractual payout) แสดง null + สวิตช์ Active (ปิดไว้ = ไม่แสดงบนเว็บ)
 *  - เครื่องหมาย ✓ ใน List content = Section นั้นกรอกครบแล้ว
 * แก้หัวข้อ / ที่มาของค่า ได้ที่ไฟล์นี้
 */
import { ContentDetail } from '../../../../core/models/content.model';
import { ContentFormData } from '../content-form';

export interface FeatureTopic {
  code: string;
  label: string;
  /** ค่าจาก Package — null = Package ไม่มีข้อมูล · undefined = กรอกเอง */
  value?: (c: ContentDetail) => string | null;
}

const num = (n: number | null | undefined) => (n === null || n === undefined ? '' : n.toLocaleString('en-US'));

export const FEATURE_TOPICS: FeatureTopic[] = [
  {
    code: 'SUM_INSURED',
    label: 'ทุนประกันภัย',
    value: (c) => {
      const p = c.package.plans.find((x) => x.planRole === 'MASTER');
      return p ? `${num(p.minSumInsured)} – ${num(p.maxSumInsured)} บาท` : null;
    },
  },
  { code: 'ISSUE_AGE', label: 'อายุที่รับประกัน', value: (c) => c.package.derived.ageDisplay },
  { code: 'UNDERWRITE', label: 'การตรวจสุขภาพ', value: (c) => c.package.derived.underwriteDisplay },
  { code: 'TAX', label: 'การลดหย่อนภาษี', value: (c) => c.package.derived.taxDisplay },
  { code: 'PAYMENT_MODE', label: 'การชำระเบี้ย', value: (c) => c.package.paymentModes.map((m) => m.name ?? m.code).join(', ') || null },
  { code: 'PAYMENT_METHOD', label: 'ช่องทางชำระเบี้ย', value: (c) => c.paymentMethodsShown.map((m) => m.text).join(', ') || null },
  { code: 'FREE_LOOK', label: 'ระยะเวลาพิจารณากรมธรรม์ (Free look)', value: (c) => (c.package.freeLookPeriod ? `${c.package.freeLookPeriod} วัน` : null) },
  { code: 'RIDER', label: 'สัญญาเพิ่มเติม', value: (c) => c.package.derived.riderDisplay },
  { code: 'CONTRACTUAL_PAYOUT', label: 'Contractual payout (เงินคืนตามสัญญา)', value: () => null },
  { code: 'CUSTOM', label: 'กำหนดเอง' },
];

export function findTopic(code: string): FeatureTopic | undefined {
  return FEATURE_TOPICS.find((t) => t.code === code);
}

/** หัวข้อของการ์ด Key Advantages (สมมติฐาน — รอรายการจริง) */
export const ADVANTAGE_TOPICS = ['ความคุ้มครอง', 'ผลตอบแทน', 'ลดหย่อนภาษี', 'สมัครง่าย', 'ความยืดหยุ่น'];

/** Section นี้กรอกครบหรือยัง (แสดง ✓ ใน List content) */
export function sectionDone(id: string, f: ContentFormData): boolean {
  switch (id) {
    case 'CI':
      return !!(f.display.startDate && f.page.slug && f.page.category);
    case 'TH':
      return !!(f.card.image && f.card.bullets.some((b) => b.trim()));
    case 'BN':
      return !!(f.hero.bgDesktop && f.hero.bgMobile && f.hero.headline.trim());
    case 'KF':
      return f.features.some((r) => r.topic && r.active);
    case 'KA':
      return f.advantages.cards.some((a) => a.title.trim());
    case 'PR':
      return f.recommend.contents.length > 0;
    case 'DOC':
      return f.documents.length > 0;
    default:
      return false;
  }
}
