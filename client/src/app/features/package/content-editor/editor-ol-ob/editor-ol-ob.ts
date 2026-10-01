/**
 * Content Editor — Template OL_OB (Channel มีคำว่า online + Ordinary Life — FD-12)
 * Figma V2 "Content · Editor OL_OB" (27 ก.ย. 2569): 7 Section
 *   Content information · Thumbnail · Banner display · Key Features of the Insurance Plan
 *   Key Advantages · Package recommend · Document General Terms & Conditions
 * หัวข้อ Key Features และที่มาของค่า → ./ol-ob-options.ts
 */
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ContentDetail, ContentRow } from '../../../../core/models/content.model';
import { ContentApiService } from '../../../../core/services/content-api.service';
import { CATEGORIES, ContentFormData, slugPrefix } from '../content-form';
import { UploadBox } from '../upload-box/upload-box';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { DateField } from '../../../../shared/components/form/date-field/date-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { ADVANTAGE_TOPICS, FEATURE_TOPICS, findTopic } from './ol-ob-options';

const MAX_DOCS = 10;
const MAX_DOC_MB = 10;

@Component({
  selector: 'app-editor-ol-ob',
  imports: [FormsModule, UploadBox, TextField, SelectField, DateField, NumberField, ButtonModule, ToggleSwitchModule],
  templateUrl: './editor-ol-ob.html',
  styleUrl: './editor-ol-ob.scss',
})
export class EditorOlOb implements OnInit {
  private readonly api = inject(ContentApiService);
  /** ฟอร์มถูกล็อก (สถานะรออนุมัติ / Role ดูอย่างเดียว) */
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);

  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();

  readonly categories = CATEGORIES;
  readonly topics = FEATURE_TOPICS;
  readonly advantageTopics = ADVANTAGE_TOPICS;

  // ---------- Package recommend
  readonly options = signal<ContentRow[]>([]);
  readonly search = signal('');
  // ---------- Documents
  docError = '';
  dragging = false;

  ngOnInit(): void {
    const c = this.content();
    this.api.list({ status: 'ACTIVE', channel: c.channelCode, pageSize: 100 }).subscribe((res) => this.options.set(res.items));
  }

  // ---------- Content information
  prefix(): string {
    return slugPrefix('OL_OB', this.form().page.category);
  }

  /** FD-09: เริ่มได้ต่ำสุด = max(วันนี้, วันเริ่มขาย Package) · สิ้นสุดไม่เกินวันสิ้นสุด Package */
  minStart(): string {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const sale = this.content().saleStartDate;
    return sale && sale > today ? sale : today;
  }
  maxEnd(): string {
    return this.content().saleEndDate ?? '';
  }

  // ---------- Key Features
  isCustom(code: string): boolean {
    return code === 'CUSTOM';
  }

  /** ค่าของหัวข้อจาก Package — null = Package ไม่มีข้อมูล */
  topicValue(code: string): string | null {
    const t = findTopic(code);
    return t?.value ? t.value(this.content()) : null;
  }

  topicLabel(code: string): string {
    return findTopic(code)?.label ?? code;
  }

  setTopic(i: number, code: string): void {
    const row = this.form().features[i];
    row.topic = code;
    row.value = '';
    // หัวข้อที่ Package ไม่มีข้อมูล → ปิดไว้ก่อน
    row.active = this.isCustom(code) || this.topicValue(code) !== null;
  }

  addFeature(): void {
    this.form().features.push({ icon: '', topic: 'CUSTOM', value: '', active: true });
  }

  removeFeature(i: number): void {
    this.form().features.splice(i, 1);
  }

  // ---------- Key Advantages
  addAdvantage(): void {
    this.form().advantages.cards.push({ image: '', topic: '', title: '', subtitle: '' });
  }

  removeAdvantage(i: number): void {
    this.form().advantages.cards.splice(i, 1);
  }

  // ---------- Package recommend (เลือกได้เฉพาะ Content ที่ Approved ช่องทางเดียวกัน)
  results(): ContentRow[] {
    const q = this.search().trim().toLowerCase();
    const chosen = new Set(this.form().recommend.contents);
    return this.options().filter(
      (o) =>
        o.contentCode !== this.content().contentCode &&
        !chosen.has(o.contentCode) &&
        (!q || o.packageCode.toLowerCase().includes(q) || o.nameTh.toLowerCase().includes(q) || (o.nameEn ?? '').toLowerCase().includes(q)),
    );
  }

  selected(): ContentRow[] {
    return this.form()
      .recommend.contents.map((code) => this.options().find((o) => o.contentCode === code))
      .filter((o): o is ContentRow => !!o);
  }

  pickRecommend(code: string): void {
    this.form().recommend.contents.push(code);
  }

  removeRecommend(code: string): void {
    const list = this.form().recommend.contents;
    list.splice(list.indexOf(code), 1);
  }

  // ---------- Documents (PDF ≤ 10 MB · สูงสุด 10 ไฟล์ — Prototype เก็บชื่อไฟล์)
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    if ((event.currentTarget as HTMLElement).closest('fieldset')?.disabled) return;
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onPick(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.addFiles(Array.from(el.files ?? []));
    el.value = '';
  }

  private addFiles(files: File[]): void {
    this.docError = '';
    const docs = this.form().documents;
    for (const file of files) {
      if (docs.length >= MAX_DOCS) {
        this.docError = `อัปโหลดได้สูงสุด ${MAX_DOCS} ไฟล์`;
        break;
      }
      if (!/\.pdf$/i.test(file.name)) {
        this.docError = `${file.name}: รองรับเฉพาะไฟล์ PDF`;
        continue;
      }
      if (file.size > MAX_DOC_MB * 1024 * 1024) {
        this.docError = `${file.name}: ใหญ่เกิน ${MAX_DOC_MB} MB`;
        continue;
      }
      docs.push({ name: file.name, size: file.size });
    }
  }

  removeDoc(i: number): void {
    this.form().documents.splice(i, 1);
  }

  size(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
}
