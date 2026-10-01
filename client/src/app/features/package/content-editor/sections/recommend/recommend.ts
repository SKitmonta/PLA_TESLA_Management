/**
 * OB-11 ประกันอื่นที่น่าสนใจ — Header + เลือก Content ที่ Approved ช่องทางเดียวกัน (AGENT: เฉพาะ Content AGENT)
 */
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail, ContentRow } from '../../../../../core/models/content.model';
import { ContentApiService } from '../../../../../core/services/content-api.service';
import { ContentFormData } from '../../content-form';
import { FORM_LOCK } from '../../../../../shared/components/form/form-lock';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../../../shared/components/form/select-field/select-field';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-sec-recommend',
  imports: [FormsModule, TextField, SelectField, ChipModule],
  templateUrl: './recommend.html',
  styleUrl: '../section-form.scss',
})
export class SecRecommend implements OnInit {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  /** ฟอร์มถูกล็อก (สถานะรออนุมัติ / Role ดูอย่างเดียว) */
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  private readonly api = inject(ContentApiService);
  readonly options = signal<ContentRow[]>([]);

  /** ค่าใน Dropdown "เลือก Content" (ล้างกลับเป็นว่างหลังเลือก) */
  readonly pickValue = signal<string | null>(null);

  /** Content ที่ยังเลือกเพิ่มได้ (ไม่ใช่ตัวเอง และยังไม่ถูกเลือก) */
  available(): (ContentRow & { text: string })[] {
    const chosen = new Set(this.form().recommend.contents);
    const list = this.options()
      .filter((o) => o.contentCode !== this.content().contentCode && !chosen.has(o.contentCode))
      .map((o) => ({ ...o, text: `${o.contentCode} · ${o.nameTh}` }));
    // คืน Array เดิมถ้ารายการไม่เปลี่ยน (ไม่ให้ Dropdown สร้างตัวเลือกใหม่ทุกรอบ)
    const key = list.map((o) => o.contentCode).join('|');
    if (key !== this.cacheKey) {
      this.cacheKey = key;
      this.cache = list;
    }
    return this.cache;
  }
  private cacheKey = '#';
  private cache: (ContentRow & { text: string })[] = [];

  ngOnInit(): void {
    const c = this.content();
    this.api.list({ status: 'ACTIVE', channel: c.channelCode, pageSize: 100 }).subscribe((res) =>
      this.options.set(res.items.filter((o) => c.template !== 'AGENT' || o.template === 'AGENT')),
    );
  }

  label(code: string): string {
    const o = this.options().find((x) => x.contentCode === code);
    return o ? `${o.contentCode} · ${o.nameTh}` : code;
  }

  pick(code: string | null): void {
    if (code) this.form().recommend.contents.push(code);
    this.pickValue.set(code);
    setTimeout(() => this.pickValue.set(null));
  }

  remove(i: number): void {
    this.form().recommend.contents.splice(i, 1);
  }
}
