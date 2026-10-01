/**
 * ล็อกฟอร์มทั้งหน้า (เช่น Content สถานะรออนุมัติ) — PrimeNG ไม่อ่าน <fieldset disabled> จึงส่งสถานะผ่าน DI
 * ใช้: providers: [{ provide: FORM_LOCK, useFactory: () => computed(() => !editable()) }]
 */
import { InjectionToken, Signal } from '@angular/core';

export const FORM_LOCK = new InjectionToken<Signal<boolean>>('FORM_LOCK');
