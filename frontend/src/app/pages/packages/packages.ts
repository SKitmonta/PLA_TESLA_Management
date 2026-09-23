import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Package, STATUS_OPTIONS } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { FormDialog } from '../../shared/form-dialog';
import { FORM_DIALOG_IMPORTS, LIST_PAGE_IMPORTS } from '../../shared/material';

@Component({
  imports: FORM_DIALOG_IMPORTS,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'แก้ไข Package' : 'เพิ่ม Package' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="save()" id="pkg-form">
        <mat-form-field>
          <mat-label>รหัส (Code)</mat-label>
          <input matInput formControlName="code" placeholder="เช่น PKG-GOLD" />
          @if (form.controls.code.hasError('required')) { <mat-error>กรุณากรอกรหัส</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>สถานะ</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>ชื่อ Package</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>กรุณากรอกชื่อ</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>ราคา (บาท)</mat-label>
          <input matInput type="number" min="0" formControlName="price" />
          @if (form.controls.price.hasError('min')) { <mat-error>ราคาต้องไม่ติดลบ</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>รายละเอียด</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button type="submit" form="pkg-form" [disabled]="saving()">บันทึก</button>
    </mat-dialog-actions>
  `,
})
export class PackageFormDialog extends FormDialog<Package> {
  protected resource = 'packages' as const;
  protected statusOptions = STATUS_OPTIONS;
  form = inject(NonNullableFormBuilder).group({
    code: [this.item?.code ?? '', [Validators.required, Validators.maxLength(30)]],
    name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    price: [this.item?.price ?? 0, [Validators.required, Validators.min(0)]],
    status: [this.item?.status ?? 'DRAFT'],
    description: [this.item?.description ?? ''],
  });
}

@Component({
  imports: LIST_PAGE_IMPORTS,
  template: `
    <app-page-header title="Packages" subtitle="จัดการแพ็กเกจสินค้า/บริการที่เปิดขาย">
      <button mat-flat-button (click)="openForm()"><mat-icon>add</mat-icon> เพิ่ม Package</button>
    </app-page-header>

    <app-list-toolbar placeholder="ค้นหารหัสหรือชื่อ Package" [q]="q()" [status]="status()" [count]="rows().length"
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
          <td mat-cell *matCellDef="let r">
            {{ r.name }}
            @if (r.description) { <div class="muted small">{{ r.description }}</div> }
          </td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef class="num">ราคา (฿)</th>
          <td mat-cell *matCellDef="let r" class="num">{{ r.price | number: '1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>สถานะ</th>
          <td mat-cell *matCellDef="let r"><app-status-chip [status]="r.status" /></td>
        </ng-container>
        <ng-container matColumnDef="updated">
          <th mat-header-cell *matHeaderCellDef>แก้ไขล่าสุด</th>
          <td mat-cell *matCellDef="let r" class="muted">{{ r.updated_at | date: 'dd/MM/yy HH:mm' }}</td>
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
            <mat-icon>inventory_2</mat-icon>
            <div>{{ loading() ? 'กำลังโหลด...' : 'ยังไม่มี Package' }}</div>
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `.num { text-align: right; } .small { font-size: 12px; }`,
})
export class PackagesPage extends CrudPage<Package> {
  protected resource = 'packages' as const;
  protected formDialog = PackageFormDialog;
  protected entityLabel = ' Package ';
  columns = ['code', 'name', 'price', 'status', 'updated', 'actions'];
}
