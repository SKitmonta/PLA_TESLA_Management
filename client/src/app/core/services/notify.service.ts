/**
 * ข้อความแจ้งผลการทำงาน (บันทึก / ส่งอนุมัติ / Sync) — PrimeNG Toast ตาม Severity
 * แสดงที่มุมขวาบนของทุกหน้า (<p-toast /> อยู่ใน app.html) · ใช้ร่วมกันทั้งระบบ
 *   success = สำเร็จ · info = แจ้งทั่วไป · warn = ข้อมูลไม่ครบ / ไม่ผ่านเงื่อนไข · error = ระบบผิดพลาด
 * ใช้: inject(NotifyService).success('บันทึกร่างแล้ว', 'CT000006') · .fromError(err, 'บันทึกไม่สำเร็จ')
 */
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { apiError } from './master-api.service';

export type NotifySeverity = 'success' | 'info' | 'warn' | 'error';

const LIFE: Record<NotifySeverity, number> = { success: 3000, info: 4000, warn: 6000, error: 6000 };

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly messages = inject(MessageService);

  show(severity: NotifySeverity, summary: string, detail?: string): void {
    this.messages.add({ severity, summary, detail, life: LIFE[severity] });
  }

  success(summary: string, detail?: string): void {
    this.show('success', summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.show('info', summary, detail);
  }

  warn(summary: string, detail?: string): void {
    this.show('warn', summary, detail);
  }

  error(summary: string, detail?: string): void {
    this.show('error', summary, detail);
  }

  /** ผลจาก API ที่ไม่สำเร็จ — 400/409/422 (ข้อมูลไม่ผ่านเงื่อนไข) = warn · อื่นๆ = error */
  fromError(err: unknown, summary: string): void {
    const status = (err as { status?: number })?.status ?? 0;
    this.show([400, 409, 422].includes(status) ? 'warn' : 'error', summary, apiError(err));
  }
}
