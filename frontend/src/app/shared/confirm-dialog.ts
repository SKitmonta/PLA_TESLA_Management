import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';

interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
}

@Component({
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">{{ data.confirmText ?? 'ลบ' }}</button>
    </mat-dialog-actions>
  `,
  styles: `.danger { --mat-button-filled-container-color: #dc2626; }`,
})
export class ConfirmDialog {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

export function confirmDelete(dialog: MatDialog, name: string): Observable<boolean | undefined> {
  return dialog
    .open(ConfirmDialog, {
      width: '420px',
      data: { title: 'ยืนยันการลบ', message: `ต้องการลบ "${name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้` },
    })
    .afterClosed();
}
