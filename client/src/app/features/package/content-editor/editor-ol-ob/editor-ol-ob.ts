/**
 * Content Editor — Template OL_OB (Channel มีคำว่า online + Ordinary Life — FD-12)
 * Figma V2 "Content · Editor OL_OB" (27 ก.ย. 2569): 7 Section
 *   Content information · Thumbnail · Banner display · Key Features of the Insurance Plan
 *   Key Advantages · Package recommend · Document General Terms & Conditions
 * หัวข้อ Key Features / Key Advantages เลือกจาก Master ของ API (ONLINE) → ./ol-ob-options.ts
 */
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../core/models/content.model';
import { MasterApiService, apiError } from '../../../../core/services/master-api.service';
import { ChannelPackage, ContentMasterItem, ContentMasterType, KeyTopic } from '../../../../core/models/master.model';
import { ContentFormData, insuranceTypePath } from '../content-form';
import { UploadBox } from '../upload-box/upload-box';
import { ContentUploadService } from '../upload.service';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { MultiSelectField } from '../../../../shared/components/form/multiselect-field/multiselect-field';
import { DateField } from '../../../../shared/components/form/date-field/date-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { TopicOption, TopicPicker } from './ol-ob-options';

const MAX_DOCS = 10;
const MAX_DOC_MB = 10;

@Component({
  selector: 'app-editor-ol-ob',
  imports: [FormsModule, UploadBox, TextField, SelectField, MultiSelectField, DateField, NumberField, ButtonModule],
  templateUrl: './editor-ol-ob.html',
  styleUrl: './editor-ol-ob.scss',
})
export class EditorOlOb implements OnInit {
  private readonly masters = inject(MasterApiService);
  private readonly uploads = inject(ContentUploadService);
  /** ฟอร์มถูกล็อก (สถานะรออนุมัติ / Role ดูอย่างเดียว) */
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);

  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();

  /** หมวดสินค้า (insurance-types) + Tag Filter (coverage-types / feature-tags) จาก Master */
  readonly insuranceTypes = signal<ContentMasterItem[]>([]);
  readonly coverageTypes = signal<ContentMasterItem[]>([]);
  readonly featureTags = signal<ContentMasterItem[]>([]);
  readonly masterError = signal('');
  /** หัวข้อจาก Master (ONLINE) — Key Features = FEATURE · Key Advantages = ADVANTAGE */
  readonly featureTopics = new TopicPicker();
  readonly advantageTopics = new TopicPicker();

  // ---------- Package recommend
  /** Package ที่ขายในช่องทางเดียวกัน (ไม่รวม Package ของ Content นี้) */
  readonly options = signal<ChannelPackage[]>([]);
  readonly optionsError = signal('');
  readonly search = signal('');
  // ---------- Documents
  docError = '';
  dragging = false;

  ngOnInit(): void {
    const c = this.content();
    this.masters.channelPackages(c.channelCode).subscribe({
      next: (list) => this.options.set(list.filter((p) => p.packageCode !== c.packageCode)),
      error: (err: unknown) => this.optionsError.set(apiError(err)),
    });
    this.loadMaster('insurance-types', this.insuranceTypes);
    this.loadMaster('coverage-types', this.coverageTypes);
    this.loadMaster('feature-tags', this.featureTags);
    this.loadTopics(this.featureTopics, 'FEATURE', () => this.syncFeatures());
    this.loadTopics(this.advantageTopics, 'ADVANTAGE', () => this.syncAdvantages());
  }

  private loadMaster(type: ContentMasterType, target: { set(list: ContentMasterItem[]): void }): void {
    this.masters.contentMaster(type).subscribe({
      next: (list) => target.set(list),
      error: (err: unknown) => this.masterError.set(apiError(err)),
    });
  }

  /** โหลดหัวข้อ แล้วให้แถวที่เลือกไว้ตรงกับ Master ปัจจุบัน (ฟอร์มที่ล็อกไม่แตะ) */
  private loadTopics(picker: TopicPicker, type: KeyTopic['topicType'], sync: () => void): void {
    this.masters.keyTopics(type, 'ONLINE').subscribe({
      next: (list) => {
        picker.list.set(list);
        if (!this.locked()) sync();
      },
      error: (err: unknown) => picker.error.set(apiError(err)),
    });
  }

  // ---------- Content information
  prefix(): string {
    return `/products/${insuranceTypePath(this.categoryStale() ? '' : this.form().page.category)}/`;
  }

  /** หมวดที่บันทึกไว้ไม่อยู่ใน Master (ข้อมูลเดิมเก็บเป็นชื่อ เช่น "ออมทรัพย์") */
  categoryStale(): boolean {
    const code = this.form().page.category;
    return !!code && this.insuranceTypes().length > 0 && !this.insuranceTypes().some((t) => t.code === code);
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
  featureOptions(): TopicOption[] {
    return this.featureTopics.options(this.form().features.map((r) => r.topic));
  }

  setTopic(i: number, code: string | null): void {
    const row = this.form().features[i];
    fillFeature(row, this.featureTopics.find(code));
    row.active = true;
  }

  private syncFeatures(): void {
    for (const row of this.form().features) {
      const t = this.featureTopics.find(row.topic);
      if (t) fillFeature(row, t);
    }
  }

  addFeature(): void {
    this.form().features.push({ icon: '', topic: '', name: '', value: '', active: true });
  }

  removeFeature(i: number): void {
    this.form().features.splice(i, 1);
  }

  // ---------- Key Advantages
  advantageOptions(): TopicOption[] {
    return this.advantageTopics.options(this.form().advantages.cards.map((a) => a.topic));
  }

  setAdvantage(i: number, code: string | null): void {
    fillAdvantage(this.form().advantages.cards[i], this.advantageTopics.find(code));
  }

  private syncAdvantages(): void {
    for (const card of this.form().advantages.cards) {
      const t = this.advantageTopics.find(card.topic);
      if (t) fillAdvantage(card, t);
    }
  }

  addAdvantage(): void {
    this.form().advantages.cards.push({ image: '', topic: '', title: '', subtitle: '' });
  }

  removeAdvantage(i: number): void {
    this.form().advantages.cards.splice(i, 1);
  }

  // ---------- Package recommend (Package ที่ขายในช่องทางเดียวกัน → คลิกเพื่อเพิ่มใน Package Display)
  results(): ChannelPackage[] {
    const q = this.search().trim().toLowerCase();
    const chosen = new Set(this.form().recommend.packages);
    return this.options().filter(
      (o) =>
        !chosen.has(o.packageCode) &&
        (!q || o.packageCode.toLowerCase().includes(q) || o.packageNameTh.toLowerCase().includes(q) || (o.packageNameEn ?? '').toLowerCase().includes(q)),
    );
  }

  /** Package ที่เลือกแล้ว ตามลำดับที่เลือก — รหัสที่ไม่อยู่ในช่องทางนี้แล้วยังแสดงไว้ (ลบออกได้) */
  selected(): ChannelPackage[] {
    return this.form().recommend.packages.map(
      (code) =>
        this.options().find((o) => o.packageCode === code) ?? {
          packageCode: code,
          packageNameTh: 'ไม่พบใน Channel นี้แล้ว',
          packageNameEn: null,
          subProductTypeNameTh: null,
          saleStartDate: null,
        },
    );
  }

  pickRecommend(code: string): void {
    if (this.locked()) return;
    this.form().recommend.packages.push(code);
  }

  removeRecommend(code: string): void {
    const list = this.form().recommend.packages;
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
      if (this.uploads.enabled()) {
        this.uploadDoc(file);
      } else {
        docs.push({ name: file.name, size: file.size });
      }
    }
  }

  /** โหมด Tesla API: ส่ง PDF ไป API (tc_doc ลำดับที่ว่างอยู่) แล้วเก็บ URL ที่ได้ — ลำดับ 1–10 ห้ามซ้ำกันเพื่อไม่ให้ทับไฟล์เดิม */
  private uploadDoc(file: File): void {
    const used = new Set(this.form().documents.map((d) => d.index).filter((n): n is number => n != null));
    let index = 1;
    while (used.has(index) && index <= MAX_DOCS) index++;
    if (index > MAX_DOCS) {
      this.docError = `อัปโหลดได้สูงสุด ${MAX_DOCS} ไฟล์`;
      return;
    }
    // จองลำดับไว้ก่อนส่ง กันการลากหลายไฟล์พร้อมกันได้ลำดับเดียวกัน
    const doc = { name: file.name, size: file.size, index } as ContentFormData['documents'][number];
    this.form().documents.push(doc);
    this.uploads.upload(file, { slot: 'tc_doc', kind: 'pdf', index }).subscribe({
      next: (url) => (doc.url = url),
      error: (message: string) => {
        this.docError = `${file.name}: ${message}`;
        const list = this.form().documents;
        const at = list.indexOf(doc);
        if (at >= 0) list.splice(at, 1);
      },
    });
  }

  removeDoc(i: number): void {
    this.form().documents.splice(i, 1);
  }

  size(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
}

type FeatureRow = ContentFormData['features'][number];
type AdvantageCard = ContentFormData['advantages']['cards'][number];

/** คัดลอกชื่อ / ค่า / ไอคอนจากหัวข้อ (ไม่มีหัวข้อ = ล้างแถว) */
function fillFeature(row: FeatureRow, t: KeyTopic | undefined): void {
  row.topic = t?.code ?? '';
  row.name = t?.nameTh ?? '';
  row.value = t?.formatTemplate ?? '';
  row.icon = t?.imageUrl ?? '';
}

/** คัดลอกชื่อ / คำอธิบาย / รูปพื้นการ์ดจากหัวข้อ (ไม่มีหัวข้อ = ล้างการ์ด) */
function fillAdvantage(card: AdvantageCard, t: KeyTopic | undefined): void {
  card.topic = t?.code ?? '';
  card.title = t?.nameTh ?? '';
  card.subtitle = t?.descriptionTh ?? '';
  card.image = t?.imageUrl ?? '';
}
