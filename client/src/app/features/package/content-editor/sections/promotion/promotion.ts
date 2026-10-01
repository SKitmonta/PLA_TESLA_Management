/**
 * OB-08 โปรโมชัน — Header (CMS) + Carousel จาก Campaign (CMP) · AGENT: ตามกลุ่มของตัวแทนเจ้าของลิงก์
 */
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';

@Component({
  selector: 'app-sec-promotion',
  imports: [FormsModule, TextField],
  templateUrl: './promotion.html',
  styleUrl: '../section-form.scss',
})
export class SecPromotion {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  readonly isAgent = computed(() => this.content().template === 'AGENT');
}
