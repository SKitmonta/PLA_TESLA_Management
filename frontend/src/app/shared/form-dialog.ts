import { Directive, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ApiService, Resource } from '../core/api.service';
import { NotifyService } from '../core/notify.service';

/** Shared create/edit dialog logic. Subclasses define `form` and `resource`. */
@Directive()
export abstract class FormDialog<T extends { id: number }> {
  protected abstract resource: Resource;
  abstract form: FormGroup;

  protected api = inject(ApiService);
  protected notify = inject(NotifyService);
  protected ref = inject(MatDialogRef);
  readonly item = inject<T | null>(MAT_DIALOG_DATA);
  readonly saving = signal(false);

  get isEdit() {
    return !!this.item;
  }

  /** Convert form value to API payload (override when needed). */
  protected toPayload(): Partial<T> {
    return this.form.getRawValue();
  }

  /** Hook run after the main record is saved (e.g. saving members). */
  protected afterSave(saved: T): Observable<unknown> | null {
    return null;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.toPayload();
    const req = this.item
      ? this.api.update<T>(this.resource, this.item.id, payload)
      : this.api.create<T>(this.resource, payload);
    req.subscribe({
      next: (saved) => {
        const extra = this.afterSave(saved);
        if (!extra) return this.ref.close(saved);
        extra.subscribe({ next: () => this.ref.close(saved), error: (e) => this.fail(e) });
      },
      error: (e) => this.fail(e),
    });
  }

  private fail(e: unknown) {
    this.saving.set(false);
    this.notify.error(e);
  }
}
