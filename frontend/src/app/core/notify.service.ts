import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private snack = inject(MatSnackBar);

  success(message: string) {
    this.snack.open(message, 'ปิด', { duration: 2500, panelClass: 'snack-success' });
  }

  error(err: unknown) {
    let message = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    if (err instanceof HttpErrorResponse) {
      message = err.status === 0 ? 'ไม่สามารถเชื่อมต่อ API ได้' : (err.error?.message ?? message);
    }
    this.snack.open(message, 'ปิด', { duration: 5000, panelClass: 'snack-error' });
  }
}
