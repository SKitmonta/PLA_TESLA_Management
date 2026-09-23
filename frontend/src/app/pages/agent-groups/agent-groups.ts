import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Agent, AgentGroup, STATUS_OPTIONS } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { FormDialog } from '../../shared/form-dialog';
import { FORM_DIALOG_IMPORTS, LIST_PAGE_IMPORTS } from '../../shared/material';

@Component({
  imports: [...FORM_DIALOG_IMPORTS, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'แก้ไข Agent Group' : 'สร้าง Agent Group' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="save()" id="group-form">
        <mat-form-field>
          <mat-label>รหัสกลุ่ม</mat-label>
          <input matInput formControlName="code" placeholder="เช่น GRP-BKK" />
          @if (form.controls.code.hasError('required')) { <mat-error>กรุณากรอกรหัส</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>สถานะ</mat-label>
          <mat-select formControlName="status">
            @for (s of statusOptions; track s.value) { <mat-option [value]="s.value">{{ s.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>ชื่อกลุ่ม</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) { <mat-error>กรุณากรอกชื่อ</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>รายละเอียด</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
      </form>

      <div class="members">
        <div class="members-head">
          <strong>สมาชิกในกลุ่ม</strong>
          <span class="muted">เลือกแล้ว {{ selected().size }} / {{ agents().length }} คน</span>
        </div>
        <mat-form-field class="filter" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="ค้นหา Agent" (input)="filter.set($any($event.target).value)" />
        </mat-form-field>
        <div class="agent-list">
          @for (a of filteredAgents(); track a.id) {
            <mat-checkbox [checked]="selected().has(a.id)" (change)="toggle(a.id)">
              {{ a.name }} <span class="muted">· {{ a.code }}</span>
              @if (a.status !== 'ACTIVE') { <span class="muted">({{ a.status.toLowerCase() }})</span> }
            </mat-checkbox>
          } @empty {
            <div class="muted pad">ไม่พบ Agent</div>
          }
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button type="submit" form="group-form" [disabled]="saving()">บันทึก</button>
    </mat-dialog-actions>
  `,
  styles: `
    .members { border: 1px solid var(--app-border); border-radius: 10px; padding: 12px; }
    .members-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .filter { width: 100%; margin-bottom: 8px; }
    .agent-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; }
    .pad { padding: 12px; }
  `,
})
export class AgentGroupFormDialog extends FormDialog<AgentGroup> {
  protected resource = 'agent-groups' as const;
  protected statusOptions = STATUS_OPTIONS;
  form = inject(NonNullableFormBuilder).group({
    code: [this.item?.code ?? '', [Validators.required, Validators.maxLength(30)]],
    name: [this.item?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.item?.description ?? ''],
    status: [this.item?.status ?? 'ACTIVE'],
  });

  readonly agents = signal<Agent[]>([]);
  readonly selected = signal(new Set<number>(this.item?.agent_ids ?? []));
  readonly filter = signal('');
  readonly filteredAgents = computed(() => {
    const f = this.filter().trim().toLowerCase();
    return this.agents().filter((a) => !f || a.name.toLowerCase().includes(f) || a.code.toLowerCase().includes(f));
  });

  constructor() {
    super();
    this.api.list<Agent>('agents').subscribe({
      next: (a) => this.agents.set([...a].sort((x, y) => x.code.localeCompare(y.code))),
      error: (e) => this.notify.error(e),
    });
  }

  toggle(id: number) {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  protected override afterSave(saved: AgentGroup) {
    return this.api.setGroupMembers(saved.id, [...this.selected()]);
  }
}

@Component({
  imports: LIST_PAGE_IMPORTS,
  template: `
    <app-page-header title="Agent Groups" subtitle="จัดกลุ่ม Agent เพื่อนำไปจับคู่กับ Package และ Campaign">
      <button mat-flat-button (click)="openForm()"><mat-icon>group_add</mat-icon> สร้างกลุ่ม</button>
    </app-page-header>

    <app-list-toolbar placeholder="ค้นหารหัสหรือชื่อกลุ่ม" [q]="q()" [status]="status()" [count]="rows().length"
      (search)="onSearch($event)" (statusChange)="onStatus($event)" />

    @if (loading() && !rows().length) { <mat-progress-bar mode="indeterminate" /> }
    <div class="grid">
      @for (g of rows(); track g.id) {
        <div class="card group">
          <div class="top">
            <div>
              <div class="name">{{ g.name }}</div>
              <div class="muted small">{{ g.code }}</div>
            </div>
            <app-status-chip [status]="g.status" />
          </div>
          <p class="muted desc">{{ g.description || 'ไม่มีรายละเอียด' }}</p>
          <div class="bottom">
            <span class="count"><mat-icon>groups</mat-icon> {{ g.agent_ids.length }} Agents</span>
            <span>
              <button mat-icon-button matTooltip="แก้ไข / จัดการสมาชิก" (click)="openForm(g)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button matTooltip="ลบ" (click)="remove(g)"><mat-icon>delete</mat-icon></button>
            </span>
          </div>
        </div>
      } @empty {
        @if (!loading()) {
          <div class="card empty-state"><mat-icon>groups</mat-icon><div>ยังไม่มีกลุ่ม</div></div>
        }
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .group { display: flex; flex-direction: column; gap: 8px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; }
    .name { font-weight: 600; font-size: 16px; }
    .small { font-size: 12px; }
    .desc { margin: 0; flex: 1; font-size: 14px; }
    .bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--app-border); padding-top: 8px; }
    .count { display: flex; align-items: center; gap: 6px; font-weight: 500; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .empty-state { grid-column: 1 / -1; }
  `,
})
export class AgentGroupsPage extends CrudPage<AgentGroup> {
  protected resource = 'agent-groups' as const;
  protected formDialog = AgentGroupFormDialog;
  protected entityLabel = 'กลุ่ม ';
}
