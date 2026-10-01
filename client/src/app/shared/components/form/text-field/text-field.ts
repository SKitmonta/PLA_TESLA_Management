/**
 * ช่องข้อความ — PrimeNG AutoComplete + FloatLabel (variant="in") ตามที่กำหนด
 * suggestions = ตัวเลือกแนะนำขณะพิมพ์ (ไม่ใส่ = พิมพ์อิสระ)
 * ใช้: <app-text-field label="Title text" [required]="true" [maxlength]="60" [(ngModel)]="form.hero.headline" />
 */
import { Component, forwardRef, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { BaseField } from '../base-field';

@Component({
  selector: 'app-text-field',
  imports: [NgTemplateOutlet, FormsModule, AutoCompleteModule, FloatLabelModule],
  templateUrl: './text-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true }],
  host: { '[class.ro]': 'readonly()' },
})
export class TextField extends BaseField<string> {
  readonly suggestions = input<string[]>([]);
  readonly maxlength = input<number | undefined>(undefined);
  /** อ่านอย่างเดียว (พื้นเทา — ค่าจาก Package) */
  readonly readonly = input(false);

  readonly items = signal<string[]>([]);

  search(e: AutoCompleteCompleteEvent): void {
    const q = (e.query ?? '').toLowerCase();
    this.items.set(this.suggestions().filter((s) => s.toLowerCase().includes(q)));
  }

  protected override fromModel(v: unknown): string | null {
    return v === null || v === undefined ? '' : String(v);
  }
}
