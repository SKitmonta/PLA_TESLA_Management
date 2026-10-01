/**
 * Content Editor — Template AGENT (Channel ที่ไม่มีคำว่า online — FD-12) · doc 10
 * Figma "Content · Editor AGENT": ฐานเดียวกับ OL_OB — Section ที่ต่างจาก OL_OB เปิดไว้ (OB-01, OB-04, OB-08)
 * Section ใหม่: AG-01 การ์ดตัวแทน (หน้าลูกค้า) · AG-02…AG-04 เฉพาะตัวแทน (ไม่แสดงต่อลูกค้า)
 */
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { TextareaField } from '../../../../shared/components/form/textarea-field/textarea-field';
import { ContentDetail } from '../../../../core/models/content.model';
import { AGENT_POSITIONS, ContentFormData, RowDrag } from '../content-form';
import { EditorSection } from '../editor-section/editor-section';
import { UploadBox } from '../upload-box/upload-box';
import { SecPageSettings } from '../sections/page-settings/page-settings';
import { SecHeroBanner } from '../sections/hero-banner/hero-banner';
import { SecKeyFeatures } from '../sections/key-features/key-features';
import { SecStickyBar } from '../sections/sticky-bar/sticky-bar';
import { SecPremiumCalculator } from '../sections/premium-calculator/premium-calculator';
import { SecHighlights } from '../sections/highlights/highlights';
import { SecBenefits } from '../sections/benefits/benefits';
import { SecPromotion } from '../sections/promotion/promotion';
import { SecImportantInfo } from '../sections/important-info/important-info';
import { SecSummary } from '../sections/summary/summary';
import { SecRecommend } from '../sections/recommend/recommend';
import { SecProductCard } from '../sections/product-card/product-card';

@Component({
  selector: 'app-editor-agent',
  imports: [FormsModule, ButtonModule, CheckboxModule, ChipModule, TagModule, TextField, SelectField, TextareaField, EditorSection, UploadBox, SecPageSettings, SecHeroBanner, SecKeyFeatures, SecStickyBar, SecPremiumCalculator, SecHighlights, SecBenefits, SecPromotion, SecImportantInfo, SecSummary, SecRecommend, SecProductCard],
  templateUrl: './editor-agent.html',
  styleUrls: ['../sections/section-form.scss', './editor-agent.scss'],
})
export class EditorAgent {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();

  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly positions = AGENT_POSITIONS;
  readonly shareOptions = [
    { label: 'ได้', value: true },
    { label: 'ไม่ได้', value: false },
  ];
  readonly pointDrag = new RowDrag();
  readonly faqDrag = new RowDrag();
  readonly kitDrag = new RowDrag();
  readonly newTag = signal('');
  kitError = '';

  // ---------- AG-02
  addTag(): void {
    const t = this.newTag().trim();
    if (t && !this.form().sellingPoints.tags.includes(t)) this.form().sellingPoints.tags.push(t);
    this.newTag.set('');
  }
  removeTag(i: number): void {
    this.form().sellingPoints.tags.splice(i, 1);
  }
  addPoint(): void {
    this.form().sellingPoints.points.push({ point: '', how: '' });
  }
  removePoint(i: number): void {
    this.form().sellingPoints.points.splice(i, 1);
  }
  addFaq(): void {
    this.form().sellingPoints.faqs.push({ q: '', a: '' });
  }
  removeFaq(i: number): void {
    this.form().sellingPoints.faqs.splice(i, 1);
  }

  // ---------- AG-03 Sales kit (Prototype เก็บชื่อไฟล์)
  uploadKit(event: Event): void {
    const el = event.target as HTMLInputElement;
    const files = Array.from(el.files ?? []);
    el.value = '';
    this.kitError = '';
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        this.kitError = `${file.name} ใหญ่เกิน 10 MB`;
        continue;
      }
      this.form().salesKit.push({ name: file.name.replace(/\.[^.]+$/, ''), file: file.name, shareable: false });
    }
  }
  removeKit(i: number): void {
    this.form().salesKit.splice(i, 1);
  }
  fileType(name: string): string {
    return (name.split('.').pop() ?? '').toUpperCase();
  }
}
