/**
 * เมนู Package › Add Package — หน้า "Package management" (CT-01)
 * Figma "Content · รายการ Content_V2_1" (17:3584) · doc 05 §0.2 (FD-02, FD-03, BR-CT-010…014)
 *   การ์ดสรุป Total / Active / Pending / Draft / Inactive (กดการ์ด = กรองสถานะ)
 *   กล่อง "Package List" + ปุ่ม "+ Add" → Popup Add Package (doc 05 §2)
 * ทีมเราไม่ได้ Setup Package/แผน (ทำที่ระบบต้นทาง) — หน้านี้ Setup Content ของแต่ละ Package เท่านั้น (FD-08)
 */
import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { DateField } from '../../../shared/components/form/date-field/date-field';
import { ActivatedRoute, Router } from '@angular/router';
import { StatCard, StatIcon } from '../../../shared/components/stat-card/stat-card';
import { StatusBadge, StatusKind } from '../../../shared/components/status-badge/status-badge';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { PackageDetailPanel } from './package-detail/package-detail';
import { AddPackageDialog } from './add-package-dialog/add-package-dialog';
import { ContentApiService } from '../../../core/services/content-api.service';
import { MasterApiService, apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { SyncedRow } from '../../../core/models/master.model';
import {
  ContentDisplayStatus,
  ContentListQuery,
  ContentListResponse,
  ContentRow,
} from '../../../core/models/content.model';

interface StatDef {
  label: string;
  status: ContentDisplayStatus | '';
  icon: StatIcon;
  key: keyof ContentListResponse['summary'];
}

const BADGE: Record<ContentDisplayStatus, StatusKind> = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DRAFT: 'draft',
  INACTIVE: 'inactive',
};

@Component({
  selector: 'app-add-package',
  imports: [FormsModule, ButtonModule, MenuModule, TooltipModule, TextField, SelectField, DateField, StatCard, StatusBadge, Pagination, ThDatePipe, PackageDetailPanel, AddPackageDialog],
  templateUrl: './add-package.html',
  styleUrl: './add-package.scss',
})
export class AddPackagePage implements OnInit {
  private readonly api = inject(ContentApiService);
  private readonly master = inject(MasterApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** ปุ่ม + Add ใช้ได้เฉพาะ Role ที่มีสิทธิ์สร้าง Content (Content Maker) — Server ตรวจซ้ำ */
  readonly canAdd = computed(() => this.session.canEdit('package'));

  readonly query = signal<ContentListQuery>({ page: 1, pageSize: 10, sort: 'packageCode', dir: 'asc', status: '' });
  readonly data = signal<ContentListResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly channels = signal<SyncedRow[]>([]);
  readonly dialogOpen = signal(false);
  readonly detailCode = signal<string | null>(null);
  /** เมนู ⋮ ของแถว — PrimeNG Menu (popup) */
  private readonly rowMenu = viewChild.required<Menu>('rowMenu');
  readonly menuItems = signal<MenuItem[]>([]);

  readonly stats: StatDef[] = [
    { label: 'Total Package', status: '', icon: 'total', key: 'total' },
    { label: 'Active', status: 'ACTIVE', icon: 'active', key: 'active' },
    { label: 'Pending', status: 'PENDING', icon: 'pending', key: 'pending' },
    { label: 'Draft', status: 'DRAFT', icon: 'draft', key: 'draft' },
    { label: 'Inactive', status: 'INACTIVE', icon: 'inactive', key: 'inactive' },
  ];

  readonly statuses: { value: ContentDisplayStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  private typing?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    // Drill-down จาก Overview (งานที่ต้องทำ): ?status=PENDING / DRAFT / EXPIRING …
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status) this.query.update((q) => ({ ...q, status: status as ContentListQuery['status'], page: 1 }));
    this.load();
    this.master.syncedRows('CHANNEL').subscribe((r) => this.channels.set(r.filter((c) => c.dataStatus === 'OK')));
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.query()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  /** เปลี่ยนเงื่อนไขค้นหา → กลับไปหน้า 1 แล้วโหลดใหม่ */
  setFilter(patch: Partial<ContentListQuery>): void {
    this.query.update((q) => ({ ...q, ...patch, page: 1 }));
    this.load();
  }

  /** ช่องพิมพ์ค้นหา — รอพิมพ์เสร็จ 350ms ก่อนค้นหา */
  typeFilter(patch: Partial<ContentListQuery>): void {
    clearTimeout(this.typing);
    this.typing = setTimeout(() => this.setFilter(patch), 350);
  }

  sortBy(col: string): void {
    this.query.update((q) => ({ ...q, sort: col, dir: q.sort === col && q.dir === 'asc' ? 'desc' : 'asc', page: 1 }));
    this.load();
  }

  isSorted(col: string): boolean {
    return this.query().sort === col;
  }

  goPage(page: number): void {
    this.query.update((q) => ({ ...q, page }));
    this.load();
  }

  setPageSize(pageSize: number): void {
    this.query.update((q) => ({ ...q, pageSize, page: 1 }));
    this.load();
  }

  count(key: StatDef['key']): number {
    return this.data()?.summary[key] ?? 0;
  }

  badge(row: ContentRow): StatusKind {
    return BADGE[row.displayStatus];
  }

  openMenu(row: ContentRow, event: Event): void {
    this.menuItems.set([
      { label: 'ดูข้อมูล Package', icon: 'pi pi-info-circle', command: () => this.viewPackage(row) },
      { label: 'แก้ไข Content', icon: 'pi pi-pencil', command: () => this.openEditor(row) },
      {
        label: 'ตรวจสอบ / อนุมัติ',
        icon: 'pi pi-check-square',
        // CT-06: Content Approver เปิดหน้าตรวจสอบได้เมื่อ Content รออนุมัติ
        disabled: !(this.session.canApprove('package') && row.status === 'PENDING'),
        command: () => this.router.navigate(['/package/approval', row.contentCode]),
      },
    ]);
    this.rowMenu().toggle(event);
  }

  viewPackage(row: ContentRow): void {
    this.detailCode.set(row.packageCode);
  }

  openEditor(row: ContentRow): void {
    this.router.navigate(['/package/add', row.contentCode]);
  }

  /** BR-CT-004: Save → สร้าง Content (Draft) แล้วไปหน้า Content Editor ของ Template ที่ระบบกำหนด */
  onCreated(row: ContentRow): void {
    this.dialogOpen.set(false);
    this.router.navigate(['/package/add', row.contentCode]);
  }
}
