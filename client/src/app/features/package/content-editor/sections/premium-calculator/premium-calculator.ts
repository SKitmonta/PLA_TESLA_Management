/**
 * OB-05 Premium Calculator — เพศ (PKG), ช่วงอายุ (DRV), ช่วงเบี้ยที่กรอกได้ (CMS)
 */
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { NumberField } from '../../../../../shared/components/form/number-field/number-field';

@Component({
  selector: 'app-sec-premium-calculator',
  imports: [FormsModule, TextField, NumberField],
  templateUrl: './premium-calculator.html',
  styleUrl: '../section-form.scss',
})
export class SecPremiumCalculator {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  readonly genders = computed(() => this.content().package.genders.map((g) => g.name ?? g.code).join(', ') || '–');
}
