import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Agent, STATUS_OPTIONS } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { FormDialog } from '../../shared/form-dialog';
import { FORM_DIALOG_IMPORTS, LIST_PAGE_IMPORTS } from '../../shared/material';

@Component({
  imports: FORM_DIALOG_IMPORTS,
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'แก้ไข Agent' : 'เพิ่ม Agent' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="save()" id="agent-form">
        <mat-form-field>
          <mat-label>รหัส Agent</mat-label>
          <input matInput formControlName="code" placeholder="เช่น AG001" />
          @if (form.controls.code.hasError('required')) { <mat-error>กรุณากรอกรหัส</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>สถานะ</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>ชื่อ-นามสกุล</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>กรุณากรอกชื่อ</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>อีเมล</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('email')) { <mat-error>รูปแบบอีเมลไม่ถูกต้อง</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>เบอร์โทร</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button type="submit" form="agent-form" [disabled]="saving()">บันทึก</button>
    </mat-dialog-actions>
  `,
})
export class AgentFormDialog extends FormDialog<Agent> {
  protected resource = 'agents' as const;
  protected statusOptions = STATUS_OPTIONS;
  form = inject(NonNullableFormBuilder).group({
    code: [this.item?.code ?? '', [Validators.required, Validators.maxLength(30)]],
    name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    email: [this.item?.email ?? '', [Validators.email]],
    phone: [this.item?.phone ?? ''],
    status: [this.item?.status ?? 'ACTIVE'],
  });
}

@Component({
  imports: LIST_PAGE_IMPORTS,
  template: `
    <app-page-header title="Agents" subtitle="รายชื่อตัวแทนขายทั้งหมด">
      <button mat-flat-button (click)="openForm()"><mat-icon>person_add</mat-icon> เพิ่ม Agent</button>
    </app-page-header>

    <app-list-toolbar placeholder="ค้นหารหัส ชื่อ หรืออีเมล" [q]="q()" [status]="status()" [count]="rows().length"
      (search)="onSearch($event)" (statusChange)="onStatus($event)" />

    <div class="table-wrap">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      <table mat-table [dataSource]="rows()">
        <ng-container matColumnDef="agent">
          <th mat-header-cell *matHeaderCellDef>Agent</th>
          <td mat-cell *matCellDef="let r">
            <div class="agent">
              <span class="avatar">{{ r.name.charAt(0) }}</span>
              <div>
                <div>{{ r.name }}</div>
                <div class="muted small">{{ r.code }}</div>
              </div>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="contact">
          <th mat-header-cell *matHeaderCellDef>ติดต่อ</th>
          <td mat-cell *matCellDef="let r">
            <div>{{ r.email || '—' }}</div>
            <div class="muted small">{{ r.phone }}</div>
          </td>
        </ng-container>
        <ng-container matColumnDef="groups">
          <th mat-header-cell *matHeaderCellDef>กลุ่ม</th>
          <td mat-cell *matCellDef="let r">
            @for (g of r.groups; track g.id) { <span class="tag">{{ g.name }}</span> }
            @empty { <span class="muted">—</span> }
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
            <mat-icon>badge</mat-icon>
            <div>{{ loading() ? 'กำลังโหลด...' : 'ยังไม่มี Agent' }}</div>
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `
    .agent { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .avatar {
      width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
      background: #e0e7ff; color: #3730a3; font-weight: 600;
    }
    .small { font-size: 12px; }
    .tag { display: inline-block; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 1px 8px; margin: 2px 4px 2px 0; font-size: 12px; }
  `,
})
export class AgentsPage extends CrudPage<Agent> {
  protected resource = 'agents' as const;
  protected formDialog = AgentFormDialog;
  protected entityLabel = ' Agent ';
  columns = ['agent', 'contact', 'groups', 'status', 'actions'];
}
