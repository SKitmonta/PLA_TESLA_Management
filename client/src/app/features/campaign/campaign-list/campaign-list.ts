/**
 * เมนู Campaign › Campaign list (CP-01) — doc 06
 * การ์ดสรุป Total / Active / Scheduled / Pending / Draft / Inactive (กดการ์ด = กรองสถานะ)
 * กล่อง "Campaign List" + ปุ่ม "+ Add" → หน้า Add Campaign (Wizard 5 ขั้น — /campaign/new)
 * สถานะ: Approved แยกตามวันที่ → Scheduled (ยังไม่ถึงวันเริ่ม) / Active / Expired · Draft รวมตีกลับ
 */
import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { StatCard, StatIcon } from '../../../shared/components/stat-card/stat-card';
import { StatusBadge, StatusKind } from '../../../shared/components/status-badge/status-badge';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { DateField } from '../../../shared/components/form/date-field/date-field';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { CampaignApiService } from '../../../core/services/campaign-api.service';
import { MasterApiService, apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { CampaignDisplayStatus, CampaignListQuery, CampaignListResponse, CampaignRow } from '../../../core/models/campaign.model';
import { TYPE_ICON } from '../campaign-options';

type StatusFilter = CampaignDisplayStatus | 'ENDED' | 'EXPIRING' | '';

interface StatDef {
  label: string;
  status: StatusFilter;
  icon: StatIcon;
  key: keyof CampaignListResponse['summary'];
}

const BADGE: Record<CampaignDisplayStatus, [StatusKind, string]> = {
  ACTIVE: ['active', 'Active'],
  SCHEDULED: ['active', 'Scheduled'],
  PENDING: ['pending', 'Pending'],
  DRAFT: ['draft', 'Draft'],
  EXPIRED: ['inactive', 'Expired'],
  SUSPENDED: ['inactive', 'Suspended'],
  INACTIVE: ['inactive', 'Inactive'],
};

@Component({
  selector: 'app-campaign-list',
  imports: [RouterLink, FormsModule, ButtonModule, MenuModule, TooltipModule, StatCard, StatusBadge, Pagination, TextField, SelectField, DateField, ThDatePipe],
  templateUrl: './campaign-list.html',
  styleUrl: './campaign-list.scss',
})
export class CampaignList implements OnInit {
  private readonly api = inject(CampaignApiService);
  private readonly master = inject(MasterApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** ปุ่ม + Add ใช้ได้เฉพาะ Campaign Maker — Server ตรวจซ้ำ */
  readonly canAdd = computed(() => this.session.canEdit('campaign'));

  readonly query = signal<CampaignListQuery>({ page: 1, pageSize: 10, sort: 'campaignCode', dir: 'desc', status: '' });
  readonly data = signal<CampaignListResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly types = signal<{ value: string; label: string }[]>([]);
  readonly channels = signal<{ value: string; label: string }[]>([]);

  private readonly rowMenu = viewChild.required<Menu>('rowMenu');
  readonly menuItems = signal<MenuItem[]>([]);

  readonly stats: StatDef[] = [
    { label: 'Total Campaign', status: '', icon: 'total', key: 'total' },
    { label: 'Active', status: 'ACTIVE', icon: 'active', key: 'active' },
    { label: 'Pending', status: 'PENDING', icon: 'pending', key: 'pending' },
    { label: 'Draft', status: 'DRAFT', icon: 'draft', key: 'draft' },
    { label: 'หมดอายุใน 7 วัน', status: 'EXPIRING', icon: 'pending', key: 'expiring' },
    { label: 'Inactive', status: 'ENDED', icon: 'inactive', key: 'ended' },
  ];

  readonly statuses: { value: StatusFilter; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'EXPIRING', label: 'หมดอายุใน 7 วัน' },
    { value: 'ENDED', label: 'Inactive / Expired / Suspended' },
  ];

  /** หัวตาราง (sort = คอลัมน์ที่เรียงได้) */
  readonly cols: { sort: string; label: string }[] = [
    { sort: 'campaignCode', label: 'Campaign Code' },
    { sort: 'nameTh', label: 'Campaign name' },
    { sort: 'type', label: 'Type' },
    { sort: '', label: 'Package' },
    { sort: 'startDate', label: 'Start Date' },
    { sort: 'endDate', label: 'End Date' },
    { sort: '', label: 'Channel' },
    { sort: 'status', label: 'Status' },
    { sort: '', label: 'งบ ใช้จริง / ทั้งหมด (บาท)' },
    { sort: '', label: 'สิทธิ์ ใช้ / ทั้งหมด' },
    { sort: 'approvedBy', label: 'Approver' },
    { sort: 'createdBy', label: 'Create by' },
  ];

  readonly typeIcon = TYPE_ICON;
  private typing?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    // Drill-down จาก Overview (งานที่ต้องทำ): ?status=PENDING / DRAFT / EXPIRING …
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status) this.query.update((q) => ({ ...q, status: status as CampaignListQuery['status'], page: 1 }));
    this.load();
    this.master.customItems('MS-01').subscribe((items) =>
      this.types.set(items.filter((t) => t.isActive).map((t) => ({ value: t.itemCode, label: t.nameEn ?? t.nameTh }))),
    );
    this.master.syncedRows('CHANNEL').subscribe((rows) =>
      this.channels.set(rows.filter((c) => c.dataStatus === 'OK').map((c) => ({ value: c.code, label: c.nameEn ?? c.code }))),
    );
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

  setFilter(patch: Partial<CampaignListQuery>): void {
    this.query.update((q) => ({ ...q, ...patch, page: 1 }));
    this.load();
  }

  /** ช่องพิมพ์ค้นหา — รอพิมพ์เสร็จ 350ms ก่อนค้นหา */
  typeFilter(patch: Partial<CampaignListQuery>): void {
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

  badge(row: CampaignRow): StatusKind {
    return BADGE[row.displayStatus][0];
  }

  badgeLabel(row: CampaignRow): string {
    return BADGE[row.displayStatus][1];
  }

  channelText(row: CampaignRow): string {
    return row.channels.map((c) => c.name ?? c.code).join(', ') || '–';
  }

  money(v: number | null): string {
    return v === null ? 'ไม่จำกัด' : v.toLocaleString('en-US');
  }

  add(): void {
    this.router.navigate(['/campaign/new']);
  }

  openMenu(row: CampaignRow, event: Event): void {
    const editable = this.canAdd() && (row.status === 'DRAFT' || row.status === 'REJECTED');
    const approver = this.session.canApprove('campaign');
    this.menuItems.set([
      { label: 'ดูรายละเอียด', icon: 'pi pi-eye', command: () => this.router.navigate(['/campaign', row.campaignCode]) },
      { label: 'แก้ไข Campaign', icon: 'pi pi-pencil', disabled: !editable, command: () => this.router.navigate(['/campaign', row.campaignCode, 'edit']) },
      { label: 'อนุมัติ / ตีกลับ', icon: 'pi pi-check-square', disabled: !(approver && row.status === 'PENDING'), command: () => this.router.navigate(['/campaign', row.campaignCode]) },
    ]);
    this.rowMenu().toggle(event);
  }
}
