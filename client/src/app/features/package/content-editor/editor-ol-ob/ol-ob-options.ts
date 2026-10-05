/**
 * ตัวเลือกและกฎของ Editor OL_OB (Figma V2 — 27 ก.ย. 2569)
 *  - หัวข้อ Key Features / Key Advantages: เลือกจาก Master ของ API อย่างเดียว (GET /api/master/key-topics · FEATURE / ADVANTAGE + ONLINE)
 *    ค่า ข้อความ และรูปมาจากหัวข้อที่เลือก — แก้ที่ Master ไม่ใช่ที่ Content
 *  - เครื่องหมาย ✓ ใน List content = Section นั้นกรอกครบแล้ว
 */
import { signal } from '@angular/core';
import { KeyTopic } from '../../../../core/models/master.model';
import { ContentFormData } from '../content-form';

export type TopicOption = KeyTopic & { used: boolean };

/** หัวข้อจาก Master สำหรับ Dropdown ของแถว / การ์ด — หัวข้อที่แถวอื่นเลือกแล้วกดไม่ได้ (used) */
export class TopicPicker {
  readonly list = signal<KeyTopic[]>([]);
  readonly error = signal('');
  private cacheKey = '#';
  private cacheSrc: KeyTopic[] | null = null;
  private cache: TopicOption[] = [];

  find(code: string | null | undefined): KeyTopic | undefined {
    return this.list().find((t) => t.code === code);
  }

  /** หัวข้อที่ไม่อยู่ใน Master แล้ว (ข้อมูลเดิม / หัวข้อถูกปิด) */
  isStale(code: string): boolean {
    return !!code && this.list().length > 0 && !this.find(code);
  }

  /** คืน Array เดิมถ้าไม่เปลี่ยน (ไม่ให้ Dropdown สร้างตัวเลือกใหม่ทุกรอบ) */
  options(usedCodes: string[]): TopicOption[] {
    const used = new Set(usedCodes.filter(Boolean));
    const key = [...used].sort().join('|');
    if (key !== this.cacheKey || this.list() !== this.cacheSrc) {
      this.cacheKey = key;
      this.cacheSrc = this.list();
      this.cache = this.cacheSrc.map((t) => ({ ...t, used: used.has(t.code) }));
    }
    return this.cache;
  }
}

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
      return f.recommend.packages.length > 0;
    case 'DOC':
      return f.documents.length > 0;
    default:
      return false;
  }
}
