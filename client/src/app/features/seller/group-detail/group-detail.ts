/**
 * P-03 รายละเอียดกลุ่ม & ผูก Campaign (Figma 17:224 · doc 07 BR-PM-003, BR-PM-006, BR-PM-011)
 *   ข้อมูลกลุ่ม (ชื่อ / คำอธิบาย / สี) · สมาชิก · ประวัติ (Audit log)
 *   Campaign ที่ผูก — เลือกได้เฉพาะ Approved ที่มี Package + Channel ของ Workspace นี้ · ผูก / ถอดไม่ต้องอนุมัติ (D-03)
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { TextareaField } from '../../../shared/components/form/textarea-field/textarea-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { GroupDetail } from '../../../core/models/seller.model';
import { ACTION_LABEL, GROUP_COLORS, TYPE_LABEL, dateTime, readiness } from '../seller-shared';

@Component({
  selector: 'app-group-detail',
  imports: [FormsModule, RouterLink, ButtonModule, DialogModule, MessageModule, TagModule, TooltipModule, TextField, TextareaField, SelectField, ThDatePipe],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SellerApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly group = signal<GroupDetail | null>(null);
  readonly error = signal('');
  readonly busy = signal<'' | 'save' | 'delete' | 'bind' | string>('');
  readonly canEdit = computed(() => this.session.canEdit('seller'));

  form = { groupName: '', description: '', color: GROUP_COLORS[0] };
  readonly colors = GROUP_COLORS;
  readonly memberSearch = signal('');
  readonly pick = signal<string | null>(null);
  readonly confirmDelete = signal(false);

  readonly actionLabel = ACTION_LABEL;
  readonly typeLabel = TYPE_LABEL;
  readonly readiness = readiness;
  readonly dateTime = dateTime;

  readonly members = computed(() => {
    const q = this.memberSearch().trim().toLowerCase();
    return (this.group()?.members ?? []).filter((m) => !q || m.sellerCode.includes(q) || m.sellerName.toLowerCase().includes(q));
  });

  readonly candidateOptions = computed(() =>
    (this.group()?.candidates ?? []).map((c) => ({
      value: c.campaignCode,
      label: `${c.campaignCode} · ${c.nameTh}${c.bindable ? '' : ` (${c.reason})`}`,
      disabled: !c.bindable,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.group(this.id).subscribe({
      next: (g) => this.apply(g),
      error: (err) => this.error.set(apiError(err)),
    });
  }

  private apply(g: GroupDetail): void {
    this.group.set(g);
    this.form = { groupName: g.groupName, description: g.description ?? '', color: g.color };
  }

  save(): void {
    if (!this.form.groupName.trim()) {
      this.notify.warn('กรุณากรอกชื่อกลุ่ม');
      return;
    }
    this.busy.set('save');
    this.api.updateGroup(this.id, { groupName: this.form.groupName, description: this.form.description || null, color: this.form.color }).subscribe({
      next: (g) => {
        this.busy.set('');
        this.apply(g);
        this.notify.success('บันทึกข้อมูลกลุ่มแล้ว', g.groupName);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'บันทึกไม่สำเร็จ');
      },
    });
  }

  remove(): void {
    const g = this.group();
    if (!g) return;
    this.busy.set('delete');
    this.api.deleteGroup(this.id).subscribe({
      next: () => {
        this.busy.set('');
        this.confirmDelete.set(false);
        this.notify.success('ลบกลุ่มแล้ว', `"${g.groupName}" · สมาชิก ${g.members.length} คนกลับเป็น "ยังไม่มีกลุ่ม"`);
        this.router.navigate(['/seller/workspace', g.workspace.packageCode, g.workspace.channelCode]);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'ลบกลุ่มไม่สำเร็จ');
      },
    });
  }

  bind(): void {
    const code = this.pick();
    if (!code) return;
    this.busy.set('bind');
    this.api.bind(this.id, code).subscribe({
      next: (g) => {
        this.busy.set('');
        this.pick.set(null);
        this.apply(g);
        this.notify.success('ผูก Campaign แล้ว', `${code} · มีผลกับใบคำขอใหม่ทันที`);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'ผูก Campaign ไม่สำเร็จ');
      },
    });
  }

  unbind(code: string): void {
    this.busy.set(code);
    this.api.unbind(this.id, code).subscribe({
      next: (g) => {
        this.busy.set('');
        this.apply(g);
        this.notify.success('ถอด Campaign แล้ว', `${code} · ใบคำขอเดิมยังใช้สิทธิ์ตาม Snapshot`);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'ถอด Campaign ไม่สำเร็จ');
      },
    });
  }
}
