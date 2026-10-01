/**
 * Dropdown เลือกหลายค่า — PrimeNG MultiSelect + FloatLabel (variant="in") · แสดงค่าที่เลือกเป็น Chip
 * ใช้: <app-multiselect-field label="ช่องทางขาย" [options]="list" optionLabel="name" optionValue="code" [(ngModel)]="form.channels" />
 * ค่าใน ngModel เป็น Array เสมอ (ยังไม่เลือก = [])
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelectModule } from 'primeng/multiselect';
import { BaseField } from '../base-field';

@Component({
  selector: 'app-multiselect-field',
  imports: [NgTemplateOutlet, FormsModule, MultiSelectModule, FloatLabelModule],
  templateUrl: './multiselect-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelectField), multi: true }],
})
export class MultiSelectField extends BaseField<unknown[]> {
  readonly options = input<unknown[]>([]);
  readonly optionLabel = input<string | undefined>(undefined);
  readonly optionValue = input<string | undefined>(undefined);
  readonly filter = input(true);

  protected override fromModel(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
  }
  protected override toModel(v: unknown[] | null): unknown[] {
    return v ?? [];
  }
}
