/**
 * Add Campaign ขั้น 2 — ข้อมูลทั่วไป (CP-03 · doc 06 §2 CP-COM-01…18)
 * ลำดับตาม Spec: เลือก Package ก่อน (CP-COM-08) → ช่วงวันในกรอบ Package (CC-01) → ช่องทางขาย ⊆ ช่องทางของ Package (CP-COM-07)
 * Referral ซ่อน งบประมาณ / จำนวนสิทธิ์ / จังหวะให้สิทธิ์ / Clawback / Promo code และไม่บังคับรูป Banner
 */
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ThDatePipe } from '../../../../shared/pipes/th-date.pipe';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { TextareaField } from '../../../../shared/components/form/textarea-field/textarea-field';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { MultiSelectField } from '../../../../shared/components/form/multiselect-field/multiselect-field';
import { DateField } from '../../../../shared/components/form/date-field/date-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { UploadBox } from '../../../package/content-editor/upload-box/upload-box';
import { CampaignApiService } from '../../../../core/services/campaign-api.service';
import { CampaignOverlap } from '../../../../core/models/campaign.model';
import { CampaignLookup } from '../../campaign-lookup.service';
import { CampaignForm, Opt, OptionSource, isReferral } from '../../campaign-options';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fmt = (d: string | null) => (d ? d.split('-').reverse().join('/') : 'ไม่จำกัด');

@Component({
  selector: 'app-step-general',
  imports: [FormsModule, MessageModule, ThDatePipe, TextField, TextareaField, SelectField, MultiSelectField, DateField, NumberField, UploadBox],
  templateUrl: './step-general.html',
  styleUrl: '../step.scss',
})
export class StepGeneral implements OnInit {
  readonly lookup = inject(CampaignLookup);
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly form = input.required<CampaignForm>();
  /** Campaign Code ปัจจุบัน (ไม่นับตัวเองตอนตรวจช่วงวันทับซ้อน) */
  readonly code = input('');
  private readonly api = inject(CampaignApiService);

  /** ผลตรวจช่วงวันทับซ้อนกับ Campaign ประเภทเดียวกัน (null = ยังไม่ได้ตรวจ) */
  readonly overlaps = signal<CampaignOverlap[] | null>(null);
  private overlapTimer?: ReturnType<typeof setTimeout>;

  readonly src: Record<'objective' | 'rewardTiming' | 'clawback' | 'tnc' | 'costCenter' | 'packages', OptionSource> = {
    objective: { master: 'MS-02' },
    rewardTiming: { master: 'MS-03' },
    clawback: { master: 'MS-04' },
    tnc: { master: 'MS-05' },
    costCenter: { master: 'MS-06' },
    packages: { packages: true },
  };

  private channelCache: { key: string; opts: Opt[] } = { key: '', opts: [] };

  ngOnInit(): void {
    this.checkOverlap();
  }

  /** ตรวจสด: ประเภทเดียวกันใน Package เดียวกันห้ามช่วงวันทับซ้อน (Server ตรวจซ้ำตอนส่งอนุมัติ / อนุมัติ) */
  checkOverlap(): void {
    clearTimeout(this.overlapTimer);
    this.overlapTimer = setTimeout(() => {
      const f = this.form();
      if (!f.typeCode || !f.packageCodes.length || !f.startDate) {
        this.overlaps.set(null);
        return;
      }
      this.api
        .overlap({ type: f.typeCode, packages: f.packageCodes, start: f.startDate, end: f.endDate, exclude: this.code() })
        .subscribe({ next: (o) => this.overlaps.set(o), error: () => this.overlaps.set(null) });
    }, 300);
  }

  typeLabel(): string {
    const t = this.form().typeCode;
    return (t && this.lookup.item('MS-01', t)?.nameEn) || t || '';
  }

  referral(): boolean {
    return isReferral(this.form());
  }

  opts(source: OptionSource): Opt[] {
    return this.lookup.options(source, this.form().packageCodes);
  }

  private selected() {
    const codes = this.form().packageCodes;
    return this.lookup.packages().filter((p) => codes.includes(p.packageCode));
  }

  /** CC-01: เริ่ม ≥ max(วันนี้, start_Date ล่าสุด) · สิ้นสุด ≤ end_Date เร็วสุด (null = ไม่จำกัด) */
  window(): { min: string; max: string | null } {
    const pkgs = this.selected();
    const starts = pkgs.map((p) => p.saleStartDate).filter((d): d is string => !!d).sort();
    const ends = pkgs.map((p) => p.saleEndDate).filter((d): d is string => !!d).sort();
    const latest = starts.at(-1);
    return { min: latest && latest > today() ? latest : today(), max: ends[0] ?? null };
  }

  windowText(): string {
    const w = this.window();
    return `${fmt(w.min)} – ${fmt(w.max)}`;
  }

  /** ช่องทางขายที่เลือกได้ = ช่องทางของ Content ที่ Approved ของ Package ที่เลือก */
  channelOpts(): Opt[] {
    const key = this.form().packageCodes.join(',') + (this.lookup.ready() ? '1' : '0');
    if (this.channelCache.key !== key) {
      const map = new Map<string, string>();
      for (const p of this.selected()) for (const c of p.channels) map.set(c.code, `${c.code} · ${c.name ?? ''}`);
      this.channelCache = { key, opts: [...map].map(([value, label]) => ({ value, label })) };
    }
    return this.channelCache.opts;
  }

  setPackages(codes: string[]): void {
    const f = this.form();
    f.packageCodes = codes ?? [];
    const allowed = new Set(this.channelOpts().map((o) => o.value));
    f.channelCodes = f.channelCodes.filter((c) => allowed.has(c));
    if (!f.channelCodes.length && allowed.size === 1) f.channelCodes = [...allowed] as string[];
    this.checkOverlap();
  }

  /** เลือก Template ข้อกำหนด (MS-05) → เติมเนื้อหา TH / EN ให้ แก้ต่อได้ */
  setTnc(code: string | null): void {
    const d = this.form().data;
    d.tncTemplate = code;
    const a = code ? this.lookup.item('MS-05', code)?.attributes : undefined;
    if (a) {
      d.tncTh = String(a['content_th'] ?? '');
      d.tncEn = String(a['content_en'] ?? '');
    }
  }

  packageInfo(): string {
    const pkgs = this.selected();
    if (!pkgs.length) return '';
    return pkgs.map((p) => `${p.packageCode} ขาย ${fmt(p.saleStartDate)} – ${fmt(p.saleEndDate)}`).join(' · ');
  }
}
