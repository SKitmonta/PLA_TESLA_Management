/**
 * เมนู Campaign › รายละเอียด Campaign (CP-07 · Figma "Campaign · Detail (Active)" 15:1159)
 *   สรุปสิทธิ์ (Grant) 6 สถานะ · งบประมาณ & โควตา · รายการสิทธิ์ (Export) · รายละเอียดทุกขั้น · ประวัติอนุมัติ
 *   Campaign Approver: อนุมัติ / ตีกลับ (ต้องไม่ใช่ผู้สร้าง — Server ตรวจซ้ำ) เมื่อสถานะ Pending
 *   Campaign Maker: แก้ไข (Draft / ตีกลับ) · Suspend / เปิดใช้อีกครั้ง (Approved)
 */
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaField } from '../../../shared/components/form/textarea-field/textarea-field';
import { StatusBadge, StatusKind } from '../../../shared/components/status-badge/status-badge';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { CampaignApiService } from '../../../core/services/campaign-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { ApprovalLog, CampaignDetail, CampaignDisplayStatus, CampaignGrantSummary, GrantStatus } from '../../../core/models/campaign.model';
import { CampaignLookup } from '../campaign-lookup.service';
import { CampaignForm, TYPE_ICON } from '../campaign-options';
import { StepReview } from '../campaign-wizard/step-review/step-review';

const BADGE: Record<CampaignDisplayStatus, [StatusKind, string]> = {
  ACTIVE: ['active', 'Active'],
  SCHEDULED: ['active', 'Approved · รอเริ่ม'],
  PENDING: ['pending', 'รออนุมัติ'],
  DRAFT: ['draft', 'Draft'],
  EXPIRED: ['inactive', 'Expired'],
  SUSPENDED: ['inactive', 'Suspended'],
  INACTIVE: ['inactive', 'Inactive'],
};

/** สถานะสิทธิ์ (doc 06 §3A) — ป้าย / สีของ Tag / ข้อความใต้ตัวเลข */
export const GRANT_META: Record<GrantStatus, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary'; note: string }> = {
  RESERVED: { label: 'Eligible – Reserved', severity: 'warn', note: 'จองงบ / สิทธิ์ไว้' },
  CONFIRMED: { label: 'Confirmed', severity: 'success', note: 'อนุมัติกรมธรรม์แล้ว · ตัดจริง' },
  FULFILLED: { label: 'Fulfilled', severity: 'success', note: 'ส่งมอบสิทธิ์แล้ว' },
  RELEASED: { label: 'Released', severity: 'secondary', note: 'ไม่อนุมัติ / ยกเลิก · คืนสิทธิ์' },
  CLAWED_BACK: { label: 'Clawed back', severity: 'danger', note: 'เรียกคืนสิทธิ์' },
  NOT_GRANTED: { label: 'Not granted – quota', severity: 'secondary', note: 'งบ / สิทธิ์หมด' },
};

const ACTION_TEXT: Record<ApprovalLog['action'], string> = {
  SUBMIT: 'ส่งอนุมัติ',
  APPROVE: 'อนุมัติ',
  REJECT: 'ตีกลับ',
  SUSPEND: 'หยุดชั่วคราว',
  RESUME: 'เปิดใช้อีกครั้ง',
};

@Component({
  selector: 'app-campaign-detail',
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    MessageModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    TextareaField,
    StatusBadge,
    ThDatePipe,
    StepReview,
  ],
  // หน้าสรุปใช้ตัวเลือกของ Wizard (ชื่อ Master) — ส่วนรายละเอียดเป็นข้อความอ่านอย่างเดียว
  providers: [CampaignLookup],
  templateUrl: './campaign-detail.html',
  styleUrl: './campaign-detail.scss',
})
export class CampaignDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CampaignApiService);
  private readonly notify = inject(NotifyService);
  readonly session = inject(SessionService);
  readonly lookup = inject(CampaignLookup);

  readonly detail = signal<CampaignDetail | null>(null);
  readonly grants = signal<CampaignGrantSummary | null>(null);
  readonly history = signal<ApprovalLog[]>([]);
  readonly error = signal('');
  readonly busy = signal('');

  readonly rejectOpen = signal(false);
  rejectReason = '';

  readonly icon = TYPE_ICON;
  readonly grantMeta = GRANT_META;
  readonly grantOrder: GrantStatus[] = ['RESERVED', 'CONFIRMED', 'FULFILLED', 'RELEASED', 'CLAWED_BACK', 'NOT_GRANTED'];
  readonly actionText = ACTION_TEXT;

  readonly isMaker = computed(() => this.session.canEdit('campaign'));
  readonly isApprover = computed(() => this.session.canApprove('campaign'));
  /** อนุมัติงานตัวเองไม่ได้ (D-06) */
  readonly ownWork = computed(() => this.detail()?.createdBy === this.session.user()?.userId);

  /** ข้อมูลในรูปแบบฟอร์ม Wizard — ใช้แสดงรายละเอียดทุกขั้น (StepReview แบบอ่านอย่างเดียว) */
  readonly form = computed<CampaignForm | null>(() => {
    const c = this.detail();
    if (!c) return null;
    return {
      typeCode: c.typeCode,
      nameTh: c.nameTh,
      nameEn: c.nameEn ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      packageCodes: c.packageCodes,
      channelCodes: c.channelCodes,
      data: { ...c.data, benefit: c.data.benefit ?? {}, rules: c.data.rules ?? [] },
    };
  });

  ngOnInit(): void {
    this.lookup.load();
    this.load();
  }

  private load(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.api.get(code).subscribe({
      next: (c) => {
        this.detail.set(c);
        if (c.typeCode !== 'REFERRAL') this.api.grants(code).subscribe((g) => this.grants.set(g));
        this.api.history(code).subscribe((h) => this.history.set(h));
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  badge(): [StatusKind, string] {
    const c = this.detail();
    return c ? BADGE[c.displayStatus] : ['draft', ''];
  }

  typeName(): string {
    const c = this.detail();
    const t = c ? this.lookup.item('MS-01', c.typeCode) : undefined;
    return t?.nameEn ?? c?.typeCode ?? '';
  }

  channels(): string {
    return this.detail()?.channels.map((c) => `${c.code} ${c.name ?? ''}`.trim()).join(', ') ?? '';
  }

  percent(used: number, total: number | null): number {
    return total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  }

  // ---------- การทำงาน
  private done(c: CampaignDetail, summary: string): void {
    this.busy.set('');
    this.detail.set(c);
    this.api.history(c.campaignCode).subscribe((h) => this.history.set(h));
    this.notify.success(summary, `${c.campaignCode} · สถานะ ${BADGE[c.displayStatus][1]}`);
  }

  private fail(err: unknown, summary: string): void {
    this.busy.set('');
    this.notify.fromError(err, summary);
  }

  approve(): void {
    const c = this.detail();
    if (!c || this.busy()) return;
    this.busy.set('approve');
    this.api.approve(c.campaignCode).subscribe({ next: (r) => this.done(r, 'อนุมัติแล้ว'), error: (e) => this.fail(e, 'อนุมัติไม่สำเร็จ') });
  }

  openReject(): void {
    this.rejectReason = '';
    this.rejectOpen.set(true);
  }

  reject(): void {
    const c = this.detail();
    if (!c || this.busy()) return;
    if (!this.rejectReason.trim()) {
      this.notify.warn('กรุณาระบุเหตุผลที่ตีกลับ');
      return;
    }
    this.busy.set('reject');
    this.api.reject(c.campaignCode, this.rejectReason).subscribe({
      next: (r) => {
        this.rejectOpen.set(false);
        this.done(r, 'ตีกลับแล้ว');
      },
      error: (e) => this.fail(e, 'ตีกลับไม่สำเร็จ'),
    });
  }

  suspend(on: boolean): void {
    const c = this.detail();
    if (!c || this.busy()) return;
    this.busy.set('suspend');
    this.api.suspend(c.campaignCode, on).subscribe({
      next: (r) => this.done(r, on ? 'หยุดชั่วคราวแล้ว' : 'เปิดใช้อีกครั้งแล้ว'),
      error: (e) => this.fail(e, on ? 'Suspend ไม่สำเร็จ' : 'เปิดใช้ไม่สำเร็จ'),
    });
  }

  edit(): void {
    this.router.navigate(['/campaign', this.detail()!.campaignCode, 'edit']);
  }

  /** Export รายการสิทธิ์เป็น CSV (เปิดด้วย Excel ได้ — ภาษาไทยใช้ UTF-8 BOM) */
  exportGrants(): void {
    const c = this.detail();
    const g = this.grants();
    if (!c || !g) return;
    const head = ['ใบคำขอ', 'กรมธรรม์', 'ผู้ขาย', 'FYP (บาท)', 'มูลค่าสิทธิ์ (บาท)', 'สถานะ', 'Version', 'วันยื่นใบคำขอ'];
    const rows = g.items.map((i) => [
      i.applicationNo,
      i.policyNo ?? '',
      i.sellerName ?? '',
      i.fyp,
      i.benefitValue,
      GRANT_META[i.status].label,
      i.campaignVersion,
      i.submittedDate,
    ]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.campaignCode}-grants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
