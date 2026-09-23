import { Component, inject } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Campaign, STATUS_OPTIONS } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { FormDialog } from '../../shared/form-dialog';
import { FORM_DIALOG_IMPORTS, LIST_PAGE_IMPORTS } from '../../shared/material';

/** Local date as YYYY-MM-DD */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function dateRange(group: AbstractControl): ValidationErrors | null {
  const { start_date, end_date } = group.value;
  return start_date && end_date && end_date < start_date ? { dateRange: true } : null;
}

@Component({
  imports: FORM_DIALOG_IMPORTS,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'แก้ไข Campaign' : 'เพิ่ม Campaign' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="save()" id="cmp-form">
        <mat-form-field>
          <mat-label>รหัส (Code)</mat-label>
          <input matInput formControlName="code" placeholder="เช่น CMP-NY" />
          @if (form.controls.code.hasError('required')) { <mat-error>กรุณากรอกรหัส</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>สถานะ</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>ชื่อ Campaign</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>กรุณากรอกชื่อ</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>วันเริ่ม</mat-label>
          <input matInput type="date" formControlName="start_date" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>วันสิ้นสุด</mat-label>
          <input matInput type="date" formControlName="end_date" />
        </mat-form-field>
        @if (form.hasError('dateRange')) {
          <div class="full form-error">วันสิ้นสุดต้องไม่ก่อนวันเริ่ม</div>
        }
        <mat-form-field>
          <mat-label>ประเภทส่วนลด</mat-label>
          <mat-select formControlName="discount_type">
            <mat-option value="NONE">ไม่มีส่วนลด</mat-option>
            <mat-option value="PERCENT">เปอร์เซ็นต์ (%)</mat-option>
            <mat-option value="AMOUNT">จำนวนเงิน (฿)</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>มูลค่าส่วนลด</mat-label>
          <input matInput type="number" min="0" formControlName="discount_value" />
          <span matTextSuffix>{{ form.controls.discount_type.value === 'PERCENT' ? '%' : '฿' }}</span>
          @if (form.controls.discount_value.hasError('max')) { <mat-error>ไม่เกิน 100%</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>รายละเอียด</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button type="submit" form="cmp-form" [disabled]="saving()">บันทึก</button>
    </mat-dialog-actions>
  `,
  styles: `.form-error { color: #b91c1c; font-size: 13px; margin: -8px 0 8px; }`,
})
export class CampaignFormDialog extends FormDialog<Campaign> {
  protected resource = 'campaigns' as const;
  protected statusOptions = STATUS_OPTIONS;
  form = inject(NonNullableFormBuilder).group(
    {
      code: [this.item?.code ?? '', [Validators.required, Validators.maxLength(30)]],
      name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(150)]],
      status: [this.item?.status ?? 'DRAFT'],
      start_date: [this.item?.start_date ?? today(), Validators.required],
      end_date: [this.item?.end_date ?? today(), Validators.required],
      discount_type: [this.item?.discount_type ?? 'NONE'],
      discount_value: [this.item?.discount_value ?? 0, [Validators.min(0)]],
      description: [this.item?.description ?? ''],
    },
    { validators: dateRange },
  );

  constructor() {
    super();
    // Percent discounts are capped at 100; "no discount" means value 0
    const { discount_type, discount_value } = this.form.controls;
    const sync = (type: string) => {
      discount_value.setValidators(type === 'PERCENT' ? [Validators.min(0), Validators.max(100)] : [Validators.min(0)]);
      if (type === 'NONE') {
        discount_value.setValue(0);
        discount_value.disable();
      } else {
        discount_value.enable();
      }
      discount_value.updateValueAndValidity();
    };
    sync(discount_type.value);
    discount_type.valueChanges.subscribe(sync);
  }
}

@Component({
  imports: LIST_PAGE_IMPORTS,
  template: `
    <app-page-header title="Campaigns" subtitle="กำหนดแคมเปญ ช่วงเวลา และส่วนลด">
      <button mat-flat-button (click)="openForm()"><mat-icon>add</mat-icon> เพิ่ม Campaign</button>
    </app-page-header>

    <app-list-toolbar placeholder="ค้นหารหัสหรือชื่อ Campaign" [q]="q()" [status]="status()" [count]="rows().length"
      (search)="onSearch($event)" (statusChange)="onStatus($event)" />

    <div class="table-wrap">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      <table mat-table [dataSource]="rows()">
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>รหัส</th>
          <td mat-cell *matCellDef="let r"><strong>{{ r.code }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>ชื่อ</th>
          <td mat-cell *matCellDef="let r">{{ r.name }}</td>
        </ng-container>
        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef>ช่วงเวลา</th>
          <td mat-cell *matCellDef="let r">
            {{ r.start_date | date: 'dd MMM yy' }} – {{ r.end_date | date: 'dd MMM yy' }}
            <div class="small muted">{{ phase(r) }}</div>
          </td>
        </ng-container>
        <ng-container matColumnDef="discount">
          <th mat-header-cell *matHeaderCellDef>ส่วนลด</th>
          <td mat-cell *matCellDef="let r">
            @switch (r.discount_type) {
              @case ('PERCENT') { {{ r.discount_value }}% }
              @case ('AMOUNT') { ฿{{ r.discount_value | number }} }
              @default { <span class="muted">—</span> }
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
            <mat-icon>campaign</mat-icon>
            <div>{{ loading() ? 'กำลังโหลด...' : 'ยังไม่มี Campaign' }}</div>
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `.small { font-size: 12px; }`,
})
export class CampaignsPage extends CrudPage<Campaign> {
  protected resource = 'campaigns' as const;
  protected formDialog = CampaignFormDialog;
  protected entityLabel = ' Campaign ';
  columns = ['code', 'name', 'period', 'discount', 'status', 'actions'];

  phase(c: Campaign) {
    const t = today();
    if (t < c.start_date) return 'ยังไม่เริ่ม';
    if (t > c.end_date) return 'สิ้นสุดแล้ว';
    return 'กำลังดำเนินการ';
  }
}
