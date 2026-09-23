import { Directive, inject, signal, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, Resource } from '../core/api.service';
import { NotifyService } from '../core/notify.service';
import { STATUS_OPTIONS } from '../core/models';
import { confirmDelete } from './confirm-dialog';

/**
 * Shared behaviour for list pages: search, status filter, load,
 * open create/edit dialog and delete with confirmation.
 */
@Directive()
export abstract class CrudPage<T extends { id: number; name: string }> {
  protected abstract resource: Resource;
  protected abstract formDialog: Type<unknown>;
  protected abstract entityLabel: string;

  protected api = inject(ApiService);
  protected dialog = inject(MatDialog);
  protected notify = inject(NotifyService);

  readonly statusOptions = STATUS_OPTIONS;
  readonly rows = signal<T[]>([]);
  readonly loading = signal(false);
  readonly q = signal('');
  readonly status = signal('');

  private search$ = new Subject<void>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load());
    queueMicrotask(() => this.load());
  }

  onSearch(value: string) {
    this.q.set(value);
    this.search$.next();
  }

  onStatus(value: string) {
    this.status.set(value);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.list<T>(this.resource, { q: this.q(), status: this.status() }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.notify.error(e);
      },
    });
  }

  openForm(item?: T) {
    this.dialog
      .open(this.formDialog, { width: '640px', maxWidth: '95vw', data: item ?? null, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify.success(item ? `แก้ไข${this.entityLabel}เรียบร้อย` : `เพิ่ม${this.entityLabel}เรียบร้อย`);
          this.load();
        }
      });
  }

  remove(item: T) {
    confirmDelete(this.dialog, item.name).subscribe((ok) => {
      if (!ok) return;
      this.api.remove(this.resource, item.id).subscribe({
        next: () => {
          this.notify.success(`ลบ${this.entityLabel}เรียบร้อย`);
          this.load();
        },
        error: (e) => this.notify.error(e),
      });
    });
  }
}
