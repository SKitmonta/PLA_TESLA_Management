/**
 * Content Editor — Template OL_PA (Channel มีคำว่า online + Personal Accident — FD-12) · doc 05 §6
 * Figma "Content · Editor OL_PA": Section เฉพาะ PA เปิดไว้ด้านบน (PA-00, PA-03, PA-05, PA-06, PA-07)
 * แล้วตามด้วย Section ที่เหมือน OL_OB แบบย่อ (กดเพื่อขยาย)
 * PA-00 = แผนภายใน Package นี้ (FD-08 — 1 Package มีหลายแผน · เพิ่ม/ลดแผนทำที่ระบบต้นทาง)
 */
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { ContentDetail } from '../../../../core/models/content.model';
import { ContentFormData, RowDrag } from '../content-form';
import { EditorSection } from '../editor-section/editor-section';
import { SecPageSettings } from '../sections/page-settings/page-settings';
import { SecHeroBanner } from '../sections/hero-banner/hero-banner';
import { SecStickyBar } from '../sections/sticky-bar/sticky-bar';
import { SecHighlights } from '../sections/highlights/highlights';
import { SecPromotion } from '../sections/promotion/promotion';
import { SecImportantInfo } from '../sections/important-info/important-info';
import { SecSummary } from '../sections/summary/summary';
import { SecRecommend } from '../sections/recommend/recommend';
import { SecProductCard } from '../sections/product-card/product-card';

@Component({
  selector: 'app-editor-ol-pa',
  imports: [FormsModule, ButtonModule, TextField, NumberField, EditorSection, SecPageSettings, SecHeroBanner, SecStickyBar, SecHighlights, SecPromotion, SecImportantInfo, SecSummary, SecRecommend, SecProductCard],
  templateUrl: './editor-ol-pa.html',
  styleUrls: ['../sections/section-form.scss', './editor-ol-pa.scss'],
})
export class EditorOlPa {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();

  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly coverageDrag = new RowDrag();
  readonly paymentModes = computed(() => this.content().package.paymentModes.map((m) => m.name ?? m.code).join(', ') || '–');
  readonly genders = computed(() => this.content().package.genders.map((g) => g.name ?? g.code).join(', ') || '–');

  addCoverage(): void {
    this.form().coverage.push({ topic: '', amount: null, unit: 'บาท' });
  }
  removeCoverage(i: number): void {
    this.form().coverage.splice(i, 1);
  }

  // ---------- PA-07 ตารางเปรียบเทียบ: กลุ่ม → รายการ, คอลัมน์ = แผนใน Package
  addGroup(): void {
    this.form().coverageTable.groups.push({ name: '', rows: [{ name: '', amounts: {} }] });
  }
  removeGroup(g: number): void {
    this.form().coverageTable.groups.splice(g, 1);
  }
  addRow(g?: number): void {
    const groups = this.form().coverageTable.groups;
    if (!groups.length) this.addGroup();
    const target = groups[g ?? groups.length - 1];
    target.rows.push({ name: '', amounts: {} });
  }
  removeRow(g: number, r: number): void {
    this.form().coverageTable.groups[g].rows.splice(r, 1);
  }
}
