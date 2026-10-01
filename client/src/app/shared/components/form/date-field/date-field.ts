/**
 * ช่องวันที่ — PrimeNG DatePicker + FloatLabel (variant="in") · แสดง วว/ดด/ปปปป
 * ค่าใน ngModel เป็น string 'YYYY-MM-DD' (ตรงกับฐานข้อมูล) · min / max ส่งเป็น 'YYYY-MM-DD'
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { BaseField } from '../base-field';

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

function toIso(d: Date | null): string {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-date-field',
  imports: [NgTemplateOutlet, FormsModule, DatePickerModule, FloatLabelModule],
  templateUrl: './date-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateField), multi: true }],
})
export class DateField extends BaseField<Date> {
  readonly min = input<string | null | undefined>(undefined);
  readonly max = input<string | null | undefined>(undefined);
  readonly minDate = computed(() => toDate(this.min()));
  readonly maxDate = computed(() => toDate(this.max()));

  protected override fromModel(v: unknown): Date | null {
    return typeof v === 'string' ? toDate(v) : v instanceof Date ? v : null;
  }
  protected override toModel(v: Date | null): Date | null {
    return toIso(v) as unknown as Date;
  }
}
