/**
 * เมนู Package › ตรวจสอบ Content (CT-06 · Figma "Content · Approval" 5:339)
 *   ซ้าย: สิ่งที่เปลี่ยนจาก Version ที่ใช้งานอยู่ + Preview หน้าเว็บ (Desktop / Mobile)
 *   ขวา: ข้อมูลคำขอ · ผลการพิจารณา (Checklist + อนุมัติ / ตีกลับ + เหตุผล) · ประวัติ
 * Content Approver เท่านั้น · อนุมัติ / ตีกลับงานตัวเองไม่ได้ (D-06 — Server ตรวจซ้ำ)
 * อนุมัติแล้ว Version นี้แทน Version เดิมบนหน้าเว็บทันที (D-07)
 */
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaField } from '../../../shared/components/form/textarea-field/textarea-field';
import { StatusBadge, StatusKind } from '../../../shared/components/status-badge/status-badge';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { ContentApiService } from '../../../core/services/content-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { ContentLog, ContentReview } from '../../../core/models/content.model';
import { findTopic } from '../content-editor/editor-ol-ob/ol-ob-options';
import { DiffRow, diffContent } from './content-diff';

type Obj = Record<string, unknown>;

const STATUS: Record<string, [StatusKind, string]> = {
  DRAFT: ['draft', 'Draft'],
  REJECTED: ['draft', 'ตีกลับ'],
  PENDING: ['pending', 'รออนุมัติ'],
  APPROVED: ['active', 'Active'],
  INACTIVE: ['inactive', 'Inactive'],
};

const ACTION: Record<ContentLog['action'], string> = {
  SUBMIT: 'ส่งอนุมัติ',
  APPROVE: 'อนุมัติแล้ว',
  REJECT: 'ตีกลับ',
  NEW_VERSION: 'สร้าง Version ใหม่',
};

/** รายการตรวจก่อนอนุมัติ (ต้องติ๊กครบจึงอนุมัติได้) */
const CHECKS = ['ข้อความตรงกับข้อมูลแบบประกัน (Package / Plan)', 'ตัวเลขผลประโยชน์และเบี้ยเริ่มต้นถูกต้อง', 'รูปภาพครบทุกขนาด (Desktop / Mobile / การ์ด)'];

@Component({
  selector: 'app-content-approval',
  imports: [DecimalPipe, FormsModule, RouterLink, ButtonModule, CheckboxModule, MessageModule, RadioButtonModule, SelectButtonModule, TextareaField, StatusBadge, ThDatePipe],
  templateUrl: './content-approval.html',
  styleUrl: './content-approval.scss',
})
export class ContentApprovalPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentApiService);
  private readonly notify = inject(NotifyService);
  readonly session = inject(SessionService);

  readonly review = signal<ContentReview | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);

  readonly checks = CHECKS;
  checked: boolean[] = CHECKS.map(() => false);
  allChecked(): boolean {
    return this.checked.every((c) => c);
  }
  decision: 'APPROVE' | 'REJECT' | null = null;
  remark = '';

  readonly device = signal<'desktop' | 'mobile'>('desktop');
  readonly devices = [
    { label: 'Desktop', value: 'desktop' },
    { label: 'Mobile', value: 'mobile' },
  ];
  readonly action = ACTION;

  readonly isApprover = computed(() => this.session.canApprove('package'));
  readonly ownWork = computed(() => this.review()?.content.createdBy === this.session.user()?.userId);
  readonly canDecide = computed(() => this.review()?.content.status === 'PENDING' && this.isApprover() && !this.ownWork());

  readonly diff = computed<DiffRow[]>(() => {
    const r = this.review();
    return r ? diffContent(r.content.template, r.previous?.data ?? null, r.content.data) : [];
  });

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.api.review(code).subscribe({
      next: (r) => this.review.set(r),
      error: (err) => this.error.set(apiError(err)),
    });
  }

  status(): [StatusKind, string] {
    return STATUS[this.review()?.content.status ?? 'DRAFT'];
  }

  // ---------- Preview (สรุปจากเนื้อหาใน Editor — ไม่ใช่หน้าเว็บจริง)
  private d(): Obj {
    return this.review()?.content.data ?? {};
  }

  private part(key: string): Obj {
    return (this.d()[key] as Obj | undefined) ?? {};
  }

  hero(): { label: string; title: string; headline: string; sub: string; bg: string } {
    const h = this.part('hero');
    const c = this.review()!.content;
    return {
      label: String(h['label'] ?? ''),
      title: String(h['displayName'] || c.nameEn || c.nameTh),
      headline: String(h['headline'] ?? ''),
      sub: String(h['subHeadline'] ?? ''),
      bg: String(this.device() === 'desktop' ? h['bgDesktop'] ?? '' : h['bgMobile'] ?? ''),
    };
  }

  /** Key Features ที่แสดงบนเว็บ (OL_OB: features ที่ Active · อื่นๆ: keyFeatures) */
  features(): { topic: string; value: string }[] {
    const d = this.d();
    const rows = (d['features'] as Obj[] | undefined)?.filter((f) => f['active'] !== false && (f['value'] || f['topic'])) ?? [];
    if (rows.length) {
      return rows.map((f) => {
        const t = findTopic(String(f['topic']));
        return { topic: t && t.code !== 'CUSTOM' ? t.label : '', value: String(f['value'] ?? '') };
      });
    }
    return ((d['keyFeatures'] as Obj[] | undefined) ?? []).map((f) => ({ topic: String(f['topic'] ?? ''), value: String(f['value'] ?? '') }));
  }

  premium(): number | null {
    const d = this.d();
    const v = (d['sticky'] as Obj | undefined)?.['minPremium'] ?? (d['quickFacts'] as Obj | undefined)?.['premium'] ?? (d['calculator'] as Obj | undefined)?.['minPremium'];
    return v === undefined || v === null || v === '' ? null : Number(v);
  }

  // ---------- ผลการพิจารณา
  canConfirm(): boolean {
    if (!this.decision || this.busy()) return false;
    if (this.decision === 'APPROVE') return this.checked.every(Boolean);
    return this.remark.trim().length > 0;
  }

  confirm(): void {
    const r = this.review();
    if (!r || !this.canConfirm()) return;
    const code = r.content.contentCode;
    this.busy.set(true);
    const req = this.decision === 'APPROVE' ? this.api.approve(code) : this.api.reject(code, this.remark);
    const approved = this.decision === 'APPROVE';
    req.subscribe({
      next: (c) => {
        this.busy.set(false);
        this.notify.success(approved ? 'อนุมัติแล้ว' : 'ตีกลับแล้ว', `${code} v${c.versionNo} · ${approved ? (r.previous ? 'ใช้งานบนหน้าเว็บแทน Version เดิม' : 'เริ่มใช้งานบนหน้าเว็บ') : 'ส่งกลับให้ Content Maker แก้ไข'}`);
        this.router.navigate(['/package/add']);
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.fromError(err, approved ? 'อนุมัติไม่สำเร็จ' : 'ตีกลับไม่สำเร็จ');
      },
    });
  }
}
