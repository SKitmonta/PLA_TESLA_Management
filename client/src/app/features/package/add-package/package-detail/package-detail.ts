/**
 * MS-01 รายละเอียด Package (แผงเลื่อนจากขวา)
 * ป้ายที่มา: PKG = ค่าจาก Payload ตรงๆ · DRV = ระบบแปลง/คำนวณ (ผ่าน Mapping / Template matrix)
 */
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DecimalPipe } from '@angular/common';
import { MasterApiService, apiError } from '../../../../core/services/master-api.service';
import { PackageDetail } from '../../../../core/models/master.model';
import { TemplateTag } from '../../../../shared/components/template-tag/template-tag';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ThDatePipe } from '../../../../shared/pipes/th-date.pipe';

@Component({
  selector: 'app-package-detail',
  imports: [ButtonModule, DecimalPipe, TemplateTag, StatusBadge, ThDatePipe],
  templateUrl: './package-detail.html',
  styleUrl: './package-detail.scss',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class PackageDetailPanel {
  private readonly api = inject(MasterApiService);

  readonly code = input.required<string>();
  readonly closed = output<void>();

  readonly detail = signal<PackageDetail | null>(null);
  readonly error = signal('');

  constructor() {
    effect(() => {
      const code = this.code();
      this.detail.set(null);
      this.error.set('');
      this.api.packageDetail(code).subscribe({
        next: (d) => this.detail.set(d),
        error: (err) => this.error.set(apiError(err)),
      });
    });
  }

  names(list: { code: string; name: string | null }[]): string {
    return list.map((x) => x.name ?? x.code).join(', ') || '–';
  }

  codeRange(list: { code: string }[]): string {
    if (!list.length) return '–';
    return list.length > 2 ? `${list[0].code} – ${list[list.length - 1].code}` : list.map((x) => x.code).join(', ');
  }
}
