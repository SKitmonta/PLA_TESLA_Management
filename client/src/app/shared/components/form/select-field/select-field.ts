/**
 * Dropdown — PrimeNG Select + FloatLabel (variant="in")
 * ใช้: <app-select-field label="หมวดสินค้า" [options]="list" optionLabel="name" optionValue="code" [(ngModel)]="form.x" />
 * options เป็น string[] ได้ (ไม่ต้องใส่ optionLabel / optionValue)
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { BaseField } from '../base-field';

@Component({
  selector: 'app-select-field',
  imports: [NgTemplateOutlet, FormsModule, SelectModule, FloatLabelModule],
  templateUrl: './select-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectField), multi: true }],
})
export class SelectField extends BaseField<unknown> {
  readonly options = input<unknown[]>([]);
  readonly optionLabel = input<string | undefined>(undefined);
  readonly optionValue = input<string | undefined>(undefined);
  /** ชื่อ Field ที่บอกว่าตัวเลือกนั้นเลือกไม่ได้ (เช่น 'disabled') */
  readonly optionDisabled = input<string | undefined>(undefined);
  readonly filter = input(false);
  readonly showClear = input(false);

  /** ค่าว่าง ('' / undefined) = ยังไม่เลือก → ไม่แสดงปุ่ม X (showClear) และป้ายอยู่กลางช่อง */
  protected override fromModel(v: unknown): unknown {
    return v === '' || v === undefined ? null : v;
  }
}
