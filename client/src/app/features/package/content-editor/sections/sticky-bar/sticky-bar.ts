/**
 * OB-04 Sticky bar — Icon สินค้า, เบี้ยเริ่มต้น (CMS), หน่วยแสดงผล (DRV จาก Payment mode) · AGENT: ปุ่ม "ให้ตัวแทนติดต่อกลับ"
 */
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData, premiumUnit } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { NumberField } from '../../../../../shared/components/form/number-field/number-field';

@Component({
  selector: 'app-sec-sticky-bar',
  imports: [FormsModule, UploadBox, TextField, NumberField],
  templateUrl: './sticky-bar.html',
  styleUrl: '../section-form.scss',
})
export class SecStickyBar {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  readonly isAgent = computed(() => this.content().template === 'AGENT');
  readonly unit = computed(() => premiumUnit(this.content()));
  readonly modes = computed(() => this.content().package.paymentModes.map((m) => `${m.code} ${m.name ?? ''}`).join(', '));
}
