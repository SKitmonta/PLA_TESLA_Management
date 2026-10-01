/**
 * ฐานของช่องกรอก (ControlValueAccessor) — ใช้กับ [(ngModel)] ได้เหมือน input ปกติ
 * disabled = [disabled] ที่ส่งมา · ฟอร์มถูกล็อก (FORM_LOCK) · หรือ FormControl ปิดไว้
 */
import { Directive, computed, inject, input, signal } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { FORM_LOCK } from './form-lock';

let seq = 0;

@Directive()
export abstract class BaseField<T> implements ControlValueAccessor {
  private readonly lock = inject(FORM_LOCK, { optional: true });

  /** ป้ายลอยในช่อง (PrimeNG FloatLabel variant="in") — ไม่ใส่ = ใช้ placeholder แทน */
  readonly label = input('');
  readonly placeholder = input('');
  readonly required = input(false);
  readonly disabledInput = input(false, { alias: 'disabled' });
  /** (เลิกใช้) เดิมใช้ขนาดเล็กในแถวค้นหา — ทุกช่องใช้ขนาดปกติ 14px + Float Label In เท่ากันหมด */
  readonly small = input(false);

  readonly id = `f${++seq}`;
  readonly value = signal<T | null>(null);
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabledInput() || this.cvaDisabled() || !!this.lock?.());

  private onChange: (v: T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(v: T | null): void {
    this.value.set(this.fromModel(v));
  }
  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.cvaDisabled.set(d);
  }

  /** ค่าจาก Component ภายใน → ส่งออกไปที่ ngModel */
  change(v: T | null): void {
    this.value.set(v);
    this.onChange(this.toModel(v));
  }
  touch(): void {
    this.onTouched();
  }

  /** แปลงค่าเข้า/ออก (เช่น วันที่ string ↔ Date) */
  protected fromModel(v: unknown): T | null {
    return (v ?? null) as T | null;
  }
  protected toModel(v: T | null): T | null {
    return v;
  }
}
