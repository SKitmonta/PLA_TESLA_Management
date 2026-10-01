/**
 * OB-01 ตั้งค่าหน้า — URL slug, หมวดสินค้า, ลำดับ, SEO (AGENT: ไม่มี SEO / noindex) + ช่วงแสดงผล Content (FD-04, FD-09)
 */
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData, CATEGORIES, slugPrefix } from '../../content-form';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../../../shared/components/form/select-field/select-field';
import { DateField } from '../../../../../shared/components/form/date-field/date-field';
import { NumberField } from '../../../../../shared/components/form/number-field/number-field';

@Component({
  selector: 'app-sec-page-settings',
  imports: [FormsModule, TextField, SelectField, DateField, NumberField],
  templateUrl: './page-settings.html',
  styleUrl: '../section-form.scss',
})
export class SecPageSettings {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  readonly categories = CATEGORIES;
  readonly isAgent = computed(() => this.content().template === 'AGENT');
  /** ส่วนนำหน้า URL (เปลี่ยนตามหมวดสินค้า — ค่าในฟอร์มไม่ใช่ Signal จึงใช้ฟังก์ชัน) */
  prefix(): string {
    return slugPrefix(this.content().template, this.form().page.category);
  }

  /** FD-09: เริ่มได้ต่ำสุด = max(วันนี้, วันเริ่มขาย Package) · สิ้นสุดได้ไม่เกินวันสิ้นสุด Package */
  readonly minStart = computed(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const sale = this.content().saleStartDate;
    return sale && sale > today ? sale : today;
  });
  readonly maxEnd = computed(() => this.content().saleEndDate ?? '');
}
