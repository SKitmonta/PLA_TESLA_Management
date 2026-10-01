/**
 * ช่องตัวเลข — PrimeNG InputNumber + FloatLabel (variant="in") · มีคอมมาคั่นหลักพัน
 * ใช้: <app-number-field label="เบี้ยเริ่มต้น (บาท)" [min]="0" [(ngModel)]="form.sticky.minPremium" />
 */
import { NgTemplateOutlet } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { BaseField } from '../base-field';

@Component({
  selector: 'app-number-field',
  imports: [NgTemplateOutlet, FormsModule, InputNumberModule, FloatLabelModule],
  templateUrl: './number-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberField), multi: true }],
})
export class NumberField extends BaseField<number> {
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  /** ทศนิยมสูงสุด (0 = จำนวนเต็ม) */
  readonly decimals = input(0);
  readonly suffix = input('');
  readonly grouping = input(true);
}
