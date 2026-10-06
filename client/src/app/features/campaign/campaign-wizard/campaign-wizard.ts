/**
 * เมนู Campaign › Add Campaign — Wizard 5 ขั้น (CP-02…CP-06 · doc 06 §1)
 *   /campaign/new      สร้างใหม่ (ขั้น 1 เลือกประเภท)
 *   /campaign/:code/edit  แก้ Campaign เดิม — แก้ได้เฉพาะ Draft / ตีกลับ (Campaign Maker) · สถานะอื่นดูอย่างเดียว
 * บันทึกร่างครั้งแรก = สร้าง Campaign Code (CMP-{TYPE}-{YYMM}-{Running}) · ส่งอนุมัติ = ตรวจครบ → Pending
 * Referral (CC-10) ไม่มีขั้น 4 และไม่ใช้งบ / จำนวนสิทธิ์ / จังหวะให้สิทธิ์ / Clawback / Promo code
 */
import { Location } from '@angular/common';
import { Component, OnInit, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FORM_LOCK } from '../../../shared/components/form/form-lock';
import { StatusBadge, StatusKind } from '../../../shared/components/status-badge/status-badge';
import { CampaignApiService } from '../../../core/services/campaign-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { CampaignDetail, CampaignDisplayStatus, CampaignTypeCode, SaveCampaignPayload } from '../../../core/models/campaign.model';
import { CampaignLookup } from '../campaign-lookup.service';
import { BENEFIT_DEFAULTS, CampaignForm, STEPS, TYPE_ICON, emptyForm, isReferral, missing } from '../campaign-options';
import { StepType } from './step-type/step-type';
import { StepGeneral } from './step-general/step-general';
import { StepBenefit } from './step-benefit/step-benefit';
import { StepRules } from './step-rules/step-rules';
import { StepReview } from './step-review/step-review';

const BADGE: Record<CampaignDisplayStatus, [StatusKind, string]> = {
  ACTIVE: ['active', 'Active'],
  SCHEDULED: ['active', 'Scheduled'],
  PENDING: ['pending', 'Pending'],
  DRAFT: ['draft', 'Draft'],
  EXPIRED: ['inactive', 'Expired'],
  SUSPENDED: ['inactive', 'Suspended'],
  CLOSED: ['inactive', 'Closed'],
  INACTIVE: ['inactive', 'Inactive'],
};

@Component({
  selector: 'app-campaign-wizard',
  imports: [RouterLink, ButtonModule, MessageModule, StatusBadge, StepType, StepGeneral, StepBenefit, StepRules, StepReview],
  // ตัวเลือก Dropdown (โหลดครั้งเดียวต่อหน้า) + สถานะล็อกฟอร์มสำหรับช่องกรอก PrimeNG ทุกช่อง
  providers: [CampaignLookup, { provide: FORM_LOCK, useFactory: () => signal(false) }],
  templateUrl: './campaign-wizard.html',
  styleUrl: './campaign-wizard.scss',
})
export class CampaignWizard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly api = inject(CampaignApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);
  readonly lookup = inject(CampaignLookup);
  private readonly lock = inject(FORM_LOCK) as WritableSignal<boolean>;

  readonly steps = STEPS;
  readonly typeIcon = TYPE_ICON;

  readonly detail = signal<CampaignDetail | null>(null);
  readonly form = signal<CampaignForm | null>(null);
  readonly step = signal(1);
  readonly busy = signal<'' | 'save' | 'submit'>('');
  readonly error = signal('');

  readonly isNew = computed(() => !this.detail());
  readonly canEdit = computed(() => this.session.canEdit('campaign'));
  /** แก้ได้เมื่อ Role = Campaign Maker และ (ยังไม่บันทึก หรือ สถานะ Draft / ตีกลับ) */
  readonly editable = computed(() => {
    const d = this.detail();
    return this.canEdit() && (!d || d.status === 'DRAFT' || d.status === 'REJECTED');
  });

  constructor() {
    effect(() => this.lock.set(!this.editable()));
  }

  ngOnInit(): void {
    this.lookup.load();
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.form.set(emptyForm());
      return;
    }
    this.api.get(code).subscribe({
      next: (c) => {
        this.apply(c);
        this.step.set(2);
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  private apply(c: CampaignDetail): void {
    this.detail.set(c);
    this.form.set({
      typeCode: c.typeCode,
      nameTh: c.nameTh,
      nameEn: c.nameEn ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      packageCodes: [...c.packageCodes],
      channelCodes: [...c.channelCodes],
      data: { sortOrder: 1, ...c.data, benefit: { ...(c.data.benefit ?? {}) }, rules: [...(c.data.rules ?? [])] },
    });
  }

  // ---------------------------------------------------------------- ขั้นตอน
  /** ขั้น 1: เลือกประเภท (เปลี่ยนได้จนกว่าจะบันทึกครั้งแรก — CP-COM-03) */
  pickType(code: CampaignTypeCode): void {
    const f = this.form();
    if (!f || !this.isNew() || !this.editable()) return;
    if (f.typeCode !== code) {
      f.typeCode = code;
      f.data.benefit = structuredClone(BENEFIT_DEFAULTS[code] ?? {});
      f.data.rules = [];
    }
    this.step.set(2);
  }

  referral(): boolean {
    const f = this.form();
    return !!f && isReferral(f);
  }

  /** เข้าขั้นอื่นได้เมื่อเลือกประเภทแล้ว · Referral ข้ามขั้น 4 */
  canGo(no: number): boolean {
    const f = this.form();
    if (!f) return false;
    if (no === 1) return true;
    if (!f.typeCode) return false;
    return !(no === 4 && this.referral());
  }

  goTo(no: number): void {
    if (this.canGo(no)) {
      this.step.set(no);
      document.querySelector('.wizard-top')?.scrollIntoView({ block: 'start' });
    }
  }

  next(): void {
    let n = this.step() + 1;
    if (n === 4 && this.referral()) n = 5;
    this.goTo(Math.min(n, 5));
  }

  prev(): void {
    let n = this.step() - 1;
    if (n === 4 && this.referral()) n = 3;
    this.goTo(Math.max(n, 1));
  }

  missingOf(no: number): string[] {
    const f = this.form();
    return f ? missing(f, no) : [];
  }

  /** ✓ บน Step bar */
  stepDone(no: number): boolean {
    const f = this.form();
    if (!f || !f.typeCode) return no === 1 ? !!f?.typeCode : false;
    if (no === 4 && this.referral()) return true;
    if (no === 5) return this.detail()?.status === 'PENDING' || this.detail()?.status === 'APPROVED';
    return missing(f, no).length === 0;
  }

  badge(): [StatusKind, string] {
    const d = this.detail();
    return d ? BADGE[d.displayStatus] : ['draft', 'New'];
  }

  typeName(): string {
    const f = this.form();
    const t = f?.typeCode ? this.lookup.item('MS-01', f.typeCode) : undefined;
    return t ? `${t.nameEn ?? t.nameTh} · ${t.nameTh}` : '';
  }

  // ---------------------------------------------------------------- บันทึก / ส่งอนุมัติ
  private payload(): SaveCampaignPayload {
    const f = this.form()!;
    return {
      typeCode: f.typeCode ?? undefined,
      nameTh: f.nameTh,
      nameEn: f.nameEn || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      packageCodes: f.packageCodes,
      channelCodes: f.channelCodes,
      data: f.data,
    };
  }

  save(): void {
    this.run('save');
  }

  submit(): void {
    this.run('submit');
  }

  private run(kind: 'save' | 'submit'): void {
    const f = this.form();
    if (!f || this.busy()) return;
    if (!f.typeCode) {
      this.notify.warn('ยังไม่ได้เลือกประเภท Campaign', 'เลือกประเภทในขั้นที่ 1 ก่อนบันทึก');
      this.step.set(1);
      return;
    }
    this.busy.set(kind);
    const current = this.detail();
    const time = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const done = (c: CampaignDetail) => {
      this.busy.set('');
      this.apply(c);
      if (!current) this.location.replaceState(`/campaign/${c.campaignCode}/edit`);
      if (kind === 'save') this.notify.success(current ? 'บันทึกร่างแล้ว' : 'สร้าง Campaign แล้ว', `${c.campaignCode} · ${time()}`);
      else {
        this.notify.success('ส่งอนุมัติแล้ว', `${c.campaignCode} สถานะ "รออนุมัติ" (${time()}) · แก้ไขไม่ได้จนกว่าจะอนุมัติหรือตีกลับ`);
        this.router.navigate(['/campaign', c.campaignCode]);
      }
    };
    const fail = (err: unknown, created?: CampaignDetail) => {
      this.busy.set('');
      if (created) {
        this.apply(created);
        this.location.replaceState(`/campaign/${created.campaignCode}/edit`);
      }
      this.notify.fromError(err, kind === 'save' ? 'บันทึกไม่สำเร็จ' : 'ส่งอนุมัติไม่สำเร็จ');
    };

    if (!current) {
      // ยังไม่มี Campaign Code → สร้างก่อน (ส่งอนุมัติ = สร้าง แล้วส่งต่อทันที)
      this.api.create(this.payload()).subscribe({
        next: (c) => {
          if (kind === 'save') return done(c);
          this.api.submit(c.campaignCode, this.payload()).subscribe({ next: done, error: (err) => fail(err, c) });
        },
        error: (err) => fail(err),
      });
      return;
    }
    const req = kind === 'save' ? this.api.save(current.campaignCode, this.payload()) : this.api.submit(current.campaignCode, this.payload());
    req.subscribe({ next: done, error: (err) => fail(err) });
  }
}
