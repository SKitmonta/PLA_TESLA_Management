/**
 * OB-03 Key Features (Hero) — แถว Icon + Topic + Value (0–N) ลากเพื่อเรียงลำดับ
 */
import { Component, input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData, RowDrag } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { FORM_LOCK } from '../../../../../shared/components/form/form-lock';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sec-key-features',
  imports: [FormsModule, UploadBox, TextField, ButtonModule],
  templateUrl: './key-features.html',
  styleUrl: '../section-form.scss',
})
export class SecKeyFeatures {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  /** ฟอร์มถูกล็อก (สถานะรออนุมัติ / Role ดูอย่างเดียว) */
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly drag = new RowDrag();

  add(): void {
    this.form().keyFeatures.push({ icon: '', topic: '', value: '' });
  }
  remove(i: number): void {
    this.form().keyFeatures.splice(i, 1);
  }
}
