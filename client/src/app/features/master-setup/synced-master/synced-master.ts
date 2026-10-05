/**
 * MS-04 Master ที่ Sync จากระบบต้นทาง (doc 06 §5.2) — อ่านอย่างเดียว
 * Channel, Payment mode / method, Gender, Occupation class, Product / Sub product type, Underwrite type
 */
import { NotifyService } from '../../../core/services/notify.service';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { MasterApiService, apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { DataSourceService } from '../../../core/data-source/data-source.service';
import { SyncedRow, SyncedType } from '../../../core/models/master.model';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { TemplateTag } from '../../../shared/components/template-tag/template-tag';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';

@Component({
  selector: 'app-synced-master',
  imports: [FormsModule, ButtonModule, TextField, StatusBadge, TemplateTag, ThDatePipe],
  templateUrl: './synced-master.html',
  styleUrl: './synced-master.scss',
})
export class SyncedMaster implements OnInit {
  private readonly api = inject(MasterApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);
  private readonly dataSource = inject(DataSourceService);

  readonly canSync = computed(() => this.session.canEdit('master'));
  /** Tesla API: อ่านจาก PostgreSQL จริง · ปุ่ม Sync ยังไม่ต่อ (Sync จาก GIO ของ v1 ต้องใช้ SSO session) */
  readonly fromTesla = computed(() => this.dataSource.source() === 'tesla');

  readonly types = signal<SyncedType[]>([]);
  readonly lastSync = signal<string | null>(null);
  readonly active = signal('CHANNEL');
  readonly rows = signal<SyncedRow[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal('');

  readonly isChannel = computed(() => this.active() === 'CHANNEL');
  readonly isSubType = computed(() => this.active() === 'SUB_PRODUCT_TYPE');
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter((r) => [r.code, r.nameTh, r.nameEn].some((v) => (v ?? '').toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    this.loadTypes();
    this.loadRows();
  }

  loadTypes(): void {
    this.api.syncedTypes().subscribe({
      next: (res) => {
        this.types.set(res.types);
        this.lastSync.set(res.lastSync);
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  loadRows(): void {
    this.loading.set(true);
    this.api.syncedRows(this.active()).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  pick(type: string): void {
    this.active.set(type);
    this.search.set('');
    this.loadRows();
  }

  sync(): void {
    this.syncing.set(true);
    this.api.sync('MASTER').subscribe({
      next: (res) => {
        this.syncing.set(false);
        this.lastSync.set(res.lastSync);
        this.notify.success('Sync สำเร็จ', res.message);
        this.loadRows();
      },
      error: (err) => {
        this.syncing.set(false);
        this.notify.fromError(err, 'Sync ไม่สำเร็จ');
      },
    });
  }
}
