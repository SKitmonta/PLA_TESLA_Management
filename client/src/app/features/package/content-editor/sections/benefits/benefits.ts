/**
 * OB-07 ผลประโยชน์และความคุ้มครอง — % เงินคืนรายปี (จำนวนปี = ระยะเวลาเอาประกัน OB-09), เบี้ยตัวอย่าง, ผลรวม (DRV)
 */
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { DecimalPipe } from '@angular/common';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { NumberField } from '../../../../../shared/components/form/number-field/number-field';

@Component({
  selector: 'app-sec-benefits',
  imports: [FormsModule, DecimalPipe, TextField, NumberField],
  templateUrl: './benefits.html',
  styleUrl: '../section-form.scss',
})
export class SecBenefits {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  /** จำนวนปี = ระยะเวลาเอาประกันภัย (OB-09) — ยังไม่กรอกใช้ 10 ปี */
  years(): number {
    const n = Number(this.form().important.coverageYears);
    return n > 0 && n <= 99 ? Math.floor(n) : 10;
  }

  /** ค่าในตารางตามจำนวนปี (ต่อความยาว Array ให้พอดี) */
  rates(): (number | null)[] {
    const r = this.form().benefits.rates;
    const n = this.years();
    while (r.length < n) r.push(null);
    if (r.length > n) r.length = n;
    return r;
  }

  /** ผลประโยชน์รวมตลอดสัญญา = ผลรวม % × เบี้ยตัวอย่าง */
  total(): number | null {
    const f = this.form().benefits;
    if (!f.samplePremium) return null;
    const pct = f.rates.reduce<number>((s, v) => s + (Number(v) || 0), 0);
    return (pct / 100) * f.samplePremium;
  }
}
