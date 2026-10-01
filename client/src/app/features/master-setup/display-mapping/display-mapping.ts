/**
 * MS-03 Mapping ข้อความแสดงผล (doc 05 Q-07)
 * แปลงรหัสจาก Package เป็นข้อความบนหน้า Content (Field ที่ติดป้าย DRV)
 *  - การพิจารณารับประกัน (GIO / SIO / FUW) → "การตรวจสุขภาพ" ใช้ทุกช่องทาง
 *  - ช่องทางชำระเบี้ย (PMT01…09) → แสดง/ไม่แสดง + ข้อความ + Icon แยกตามช่องทางขาย
 * บันทึกได้เฉพาะ System Admin
 */
import { NotifyService } from '../../../core/services/notify.service';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { MasterApiService, apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { CodeName, PaymentMethodMapping, UnderwriteMapping } from '../../../core/models/master.model';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';

@Component({
  selector: 'app-display-mapping',
  imports: [FormsModule, ButtonModule, ToggleSwitchModule, TextField, SelectField, ThDatePipe],
  templateUrl: './display-mapping.html',
  styleUrl: './display-mapping.scss',
})
export class DisplayMapping implements OnInit {
  private readonly api = inject(MasterApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  readonly canEdit = computed(() => this.session.canEdit('master'));

  readonly channel = signal('CHN04');
  readonly channels = signal<CodeName[]>([]);
  readonly channelOptions = computed(() => this.channels().map((c) => ({ value: c.code, label: `${c.code} ${c.name ?? ''}`.trim() })));
  underwrite: UnderwriteMapping[] = [];
  paymentMethods: PaymentMethodMapping[] = [];
  readonly updatedAt = signal<string | null>(null);
  readonly updatedBy = signal<string | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.displayMapping(this.channel()).subscribe({
      next: (res) => {
        this.channels.set(res.channels);
        this.underwrite = res.underwrite;
        this.paymentMethods = res.paymentMethods;
        this.updatedAt.set(res.updatedAt);
        this.updatedBy.set(res.updatedBy);
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  changeChannel(code: string): void {
    if (this.dirty() && !confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนช่องทางหรือไม่?')) return;
    this.channel.set(code);
    this.load();
  }

  markDirty(): void {
    this.dirty.set(true);
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    this.api.saveDisplayMapping({ channel: this.channel(), underwrite: this.underwrite, paymentMethods: this.paymentMethods }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.notify.success('บันทึกแล้ว', res.message);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.fromError(err, 'บันทึกไม่สำเร็จ');
      },
    });
  }

  shownCount(): number {
    return this.paymentMethods.filter((p) => p.isShown).length;
  }
}
