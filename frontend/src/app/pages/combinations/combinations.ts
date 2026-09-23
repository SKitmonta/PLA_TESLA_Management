import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AgentGroup, Campaign, Combination, netPrice, Package, STATUS_OPTIONS } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { FormDialog } from '../../shared/form-dialog';
import { FORM_DIALOG_IMPORTS, LIST_PAGE_IMPORTS } from '../../shared/material';

@Component({
  imports: [...FORM_DIALOG_IMPORTS, DecimalPipe],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'แก้ไขการจับคู่' : 'จับคู่ Package + Agent Group + Campaign' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="save()" id="comb-form">
        <mat-form-field class="full">
          <mat-label><mat-icon inline>inventory_2</mat-icon> Package</mat-label>
          <mat-select formControlName="package_id">
            @for (p of packages(); track p.id) {
              <mat-option [value]="p.id">{{ p.name }} · ฿{{ p.price | number }} @if (p.status !== 'ACTIVE') { ({{ p.status.toLowerCase() }}) }</mat-option>
            }
          </mat-select>
          @if (form.controls.package_id.hasError('required')) { <mat-error>กรุณาเลือก Package</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label><mat-icon inline>groups</mat-icon> Agent Group</mat-label>
          <mat-select formControlName="agent_group_id">
            @for (g of groups(); track g.id) {
              <mat-option [value]="g.id">{{ g.name }} · {{ g.agent_ids.length }} Agents</mat-option>
            }
          </mat-select>
          @if (form.controls.agent_group_id.hasError('required')) { <mat-error>กรุณาเลือก Agent Group</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label><mat-icon inline>campaign</mat-icon> Campaign (ไม่บังคับ)</mat-label>
          <mat-select formControlName="campaign_id">
            <mat-option [value]="null">— ไม่ผูก Campaign —</mat-option>
            @for (c of campaigns(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }} · {{ c.start_date }} ถึง {{ c.end_date }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>ชื่อการจับคู่</mat-label>
          <input matInput formControlName="name" />
          <button mat-icon-button matSuffix type="button" (click)="suggestName()" title="ตั้งชื่ออัตโนมัติ">
            <mat-icon>auto_fix_high</mat-icon>
          </button>
          @if (form.controls.name.hasError('required')) { <mat-error>กรุณากรอกชื่อ</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>สถานะ</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>หมายเหตุ</mat-label>
          <input matInput formControlName="note" />
        </mat-form-field>
      </form>

      @if (selectedPackage(); as p) {
        <div class="preview">
          <div><span class="muted">ราคาปกติ</span><strong>฿{{ p.price | number: '1.2-2' }}</strong></div>
          <div><span class="muted">ส่วนลด</span><strong>{{ discountLabel() }}</strong></div>
          <div class="net"><span class="muted">ราคาสุทธิ</span><strong>฿{{ net() | number: '1.2-2' }}</strong></div>
          <div><span class="muted">Agents</span><strong>{{ selectedGroup()?.agent_ids?.length ?? 0 }}</strong></div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button type="submit" form="comb-form" [disabled]="saving()">บันทึก</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-label mat-icon { vertical-align: middle; margin-right: 4px; }
    .preview {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      background: #f8fafc; border: 1px dashed var(--app-border); border-radius: 10px; padding: 12px;
      div { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
      strong { font-size: 16px; }
      .net strong { color: #166534; }
      @media (max-width: 600px) { grid-template-columns: 1fr 1fr; }
    }
  `,
})
export class CombinationFormDialog extends FormDialog<Combination> {
  protected resource = 'combinations' as const;
  protected statusOptions = STATUS_OPTIONS;
  form = inject(NonNullableFormBuilder).group({
    name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    package_id: [this.item?.package_id as number | null, Validators.required],
    agent_group_id: [this.item?.agent_group_id as number | null, Validators.required],
    campaign_id: [this.item?.campaign_id ?? (null as number | null)],
    status: [this.item?.status ?? 'DRAFT'],
    note: [this.item?.note ?? ''],
  });

  readonly packages = signal<Package[]>([]);
  readonly groups = signal<AgentGroup[]>([]);
  readonly campaigns = signal<Campaign[]>([]);
  private value = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  readonly selectedPackage = computed(() => this.packages().find((p) => p.id === this.value().package_id));
  readonly selectedGroup = computed(() => this.groups().find((g) => g.id === this.value().agent_group_id));
  readonly selectedCampaign = computed(() => this.campaigns().find((c) => c.id === this.value().campaign_id));
  readonly net = computed(() => {
    const c = this.selectedCampaign();
    return netPrice(this.selectedPackage()?.price ?? 0, c?.discount_type, c?.discount_value);
  });
  readonly discountLabel = computed(() => {
    const c = this.selectedCampaign();
    if (!c || c.discount_type === 'NONE') return '—';
    return c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `฿${c.discount_value}`;
  });

  constructor() {
    super();
    forkJoin({
      packages: this.api.list<Package>('packages'),
      groups: this.api.list<AgentGroup>('agent-groups'),
      campaigns: this.api.list<Campaign>('campaigns'),
    }).subscribe({
      next: ({ packages, groups, campaigns }) => {
        // Only offer inactive records if the combination already uses them
        const keep = <T extends { id: number; status: string }>(rows: T[], current?: number | null) =>
          rows.filter((r) => r.status !== 'INACTIVE' || r.id === current);
        this.packages.set(keep(packages, this.item?.package_id));
        this.groups.set(keep(groups, this.item?.agent_group_id));
        this.campaigns.set(keep(campaigns, this.item?.campaign_id));
      },
      error: (e) => this.notify.error(e),
    });
  }

  suggestName() {
    const parts = [this.selectedGroup()?.name, this.selectedPackage()?.name, this.selectedCampaign()?.name];
    const name = parts.filter(Boolean).join(' - ');
    if (name) this.form.controls.name.setValue(name);
  }

  protected override toPayload() {
    const v = this.form.getRawValue();
    return { ...v, package_id: v.package_id!, agent_group_id: v.agent_group_id! };
  }
}

@Component({
  imports: LIST_PAGE_IMPORTS,
  template: `
    <app-page-header title="Combine" subtitle="จับคู่ Package + Agent Group + Campaign เข้าด้วยกัน">
      <button mat-flat-button (click)="openForm()"><mat-icon>hub</mat-icon> จับคู่ใหม่</button>
    </app-page-header>

    <app-list-toolbar placeholder="ค้นหาชื่อการจับคู่" [q]="q()" [status]="status()" [count]="rows().length"
      (search)="onSearch($event)" (statusChange)="onStatus($event)" />

    <div class="table-wrap">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      <table mat-table [dataSource]="rows()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>ชื่อ</th>
          <td mat-cell *matCellDef="let r">
            <strong>{{ r.name }}</strong>
            @if (r.note) { <div class="muted small">{{ r.note }}</div> }
          </td>
        </ng-container>
        <ng-container matColumnDef="flow">
          <th mat-header-cell *matHeaderCellDef>Package → Agent Group → Campaign</th>
          <td mat-cell *matCellDef="let r">
            <div class="flow">
              <span class="pill pkg"><mat-icon>inventory_2</mat-icon>{{ r.package_name }}</span>
              <mat-icon class="arrow">chevron_right</mat-icon>
              <span class="pill grp"><mat-icon>groups</mat-icon>{{ r.agent_group_name }} ({{ r.agent_count }})</span>
              <mat-icon class="arrow">chevron_right</mat-icon>
              @if (r.campaign_name) {
                <span class="pill cmp"><mat-icon>campaign</mat-icon>{{ r.campaign_name }}</span>
              } @else {
                <span class="muted">ไม่มี Campaign</span>
              }
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef class="num">ราคาสุทธิ (฿)</th>
          <td mat-cell *matCellDef="let r" class="num">
            <strong>{{ net(r) | number: '1.2-2' }}</strong>
            @if (net(r) !== r.package_price) {
              <div class="muted small strike">{{ r.package_price | number: '1.2-2' }}</div>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>สถานะ</th>
          <td mat-cell *matCellDef="let r"><app-status-chip [status]="r.status" /></td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="actions"></th>
          <td mat-cell *matCellDef="let r" class="actions">
            <button mat-icon-button matTooltip="แก้ไข" (click)="openForm(r)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button matTooltip="ลบ" (click)="remove(r)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
        <tr class="mat-row" *matNoDataRow>
          <td [attr.colspan]="columns.length" class="empty-state">
            <mat-icon>hub</mat-icon>
            <div>{{ loading() ? 'กำลังโหลด...' : 'ยังไม่มีการจับคู่' }}</div>
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `
    .num { text-align: right; }
    .small { font-size: 12px; }
    .strike { text-decoration: line-through; }
    .flow { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 6px 0; }
    .arrow { color: #9ca3af; font-size: 18px; width: 18px; height: 18px; }
    .pill {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px 2px 6px;
      border-radius: 999px; font-size: 13px; white-space: nowrap;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .pkg { background: #e0f2fe; color: #075985; }
    .grp { background: #eef2ff; color: #3730a3; }
    .cmp { background: #ffe4e6; color: #9f1239; }
  `,
})
export class CombinationsPage extends CrudPage<Combination> {
  protected resource = 'combinations' as const;
  protected formDialog = CombinationFormDialog;
  protected entityLabel = 'การจับคู่';
  columns = ['name', 'flow', 'price', 'status', 'actions'];

  net(r: Combination) {
    return netPrice(r.package_price, r.discount_type, r.discount_value);
  }
}
