/**
 * OB-06 / PA-06 จุดเด่นของแผน — Header + การ์ด 1–N (รูป, Title, Value / จำนวนเงิน)
 */
import { Component, input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { FORM_LOCK } from '../../../../../shared/components/form/form-lock';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sec-highlights',
  imports: [FormsModule, UploadBox, TextField, ButtonModule],
  templateUrl: './highlights.html',
  styleUrl: '../section-form.scss',
})
export class SecHighlights {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  /** ฟอร์มถูกล็อก (สถานะรออนุมัติ / Role ดูอย่างเดียว) */
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  /** ป้ายช่องที่ 2 ของการ์ด (OL_OB = Value, OL_PA = จำนวนเงิน) */
  readonly valueLabel = input('Value');

  add(): void {
    this.form().highlights.cards.push({ image: '', title: '', value: '' });
  }
  remove(i: number): void {
    this.form().highlights.cards.splice(i, 1);
  }
}
