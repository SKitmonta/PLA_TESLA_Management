/**
 * Add Campaign ขั้น 5 — ตรวจสอบ & ส่งอนุมัติ (CP-06)
 * สรุปทุกขั้น + รายการที่ยังไม่ครบ (กดไปแก้ได้) + ตัวอย่างการ์ดโปรโมชันบนหน้าเว็บ
 * ปุ่มส่งอนุมัติอยู่ที่ Header / แถบล่างของ Wizard — Server ตรวจซ้ำ (Field บังคับ, Stock, ช่วงวันทับซ้อน)
 */
import { Component, inject, input, output } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { ThDatePipe } from '../../../../shared/pipes/th-date.pipe';
import { CampaignDetail, CampaignRule } from '../../../../core/models/campaign.model';
import { CampaignLookup } from '../../campaign-lookup.service';
import {
  BENEFIT_FIELDS,
  BenefitField,
  CampaignForm,
  OPERATOR_LABEL,
  OptionSource,
  RuleOperator,
  STEPS,
  TYPE_ICON,
  blank,
  findAttribute,
  isReferral,
  missing,
} from '../../campaign-options';

const num = (v: unknown, digits = 0) => Number(v).toLocaleString('en-US', { maximumFractionDigits: digits || 2 });
const date = (v: unknown) => (v ? String(v).split('-').reverse().join('/') : '–');

@Component({
  selector: 'app-step-review',
  imports: [MessageModule, ThDatePipe],
  templateUrl: './step-review.html',
  styleUrls: ['../step.scss', './step-review.scss'],
})
export class StepReview {
  private readonly lookup = inject(CampaignLookup);
  readonly form = input.required<CampaignForm>();
  readonly detail = input<CampaignDetail | null>(null);
  /** true = แสดงในหน้ารายละเอียด (ไม่มีปุ่มไปแก้ไข / สรุปความครบถ้วน) */
  readonly readonly = input(false);
  readonly jump = output<number>();

  readonly steps = STEPS.slice(1, 4);
  readonly icon = TYPE_ICON;

  referral(): boolean {
    return isReferral(this.form());
  }

  gaps(no: number): string[] {
    return no === 4 && this.referral() ? [] : missing(this.form(), no);
  }

  totalGaps(): number {
    return missing(this.form(), 5).length;
  }

  master(type: string, code: unknown): string {
    return this.lookup.label({ master: type }, code);
  }

  typeName(): string {
    const t = this.form().typeCode;
    const i = t ? this.lookup.item('MS-01', t) : undefined;
    return i ? `${i.nameEn ?? i.nameTh} · ${i.nameTh}` : '–';
  }

  packages(): string {
    const codes = this.form().packageCodes;
    return this.lookup.packages().filter((p) => codes.includes(p.packageCode)).map((p) => `${p.packageCode} · ${p.nameTh}`).join('\n') || '–';
  }

  channels(): string {
    return this.form().channelCodes.join(', ') || '–';
  }

  money(v: unknown, empty = 'ไม่จำกัด'): string {
    return blank(v) ? empty : `${num(v, 2)} บาท`;
  }

  count(v: unknown, empty = 'ไม่จำกัด'): string {
    return blank(v) ? empty : num(v);
  }

  // ---------- สิทธิประโยชน์
  benefitRows(): { field: BenefitField; text: string }[] {
    const t = this.form().typeCode;
    if (!t) return [];
    const b = this.form().data.benefit;
    return BENEFIT_FIELDS[t].filter((f) => !f.showIf || f.showIf(b)).map((f) => ({ field: f, text: this.format(f, b[f.key]) }));
  }

  private label(source: OptionSource | undefined, v: unknown): string {
    return this.lookup.label(source, v, this.form().packageCodes);
  }

  private format(f: BenefitField, v: unknown): string {
    if (f.kind === 'toggle') return v ? 'ใช่' : 'ไม่';
    if (blank(v)) return '–';
    switch (f.kind) {
      case 'select':
        return this.label(f.source, v);
      case 'multiselect':
        return (v as unknown[]).map((x) => this.label(f.source, x)).join(', ');
      case 'number':
        return `${num(v, f.decimals)}${f.suffix ?? ''}`;
      case 'date':
        return date(v);
      case 'table':
        return (v as Record<string, unknown>[])
          .map((r) => (f.columns ?? []).map((c) => `${c.label}: ${c.kind === 'select' ? this.label(c.source, r[c.key]) : blank(r[c.key]) ? '–' : c.kind === 'number' ? num(r[c.key], c.decimals) : r[c.key]}`).join(' · '))
          .join('\n');
      default:
        return String(v);
    }
  }

  // ---------- เงื่อนไข
  ruleText(r: CampaignRule): string {
    const a = findAttribute(r.attribute);
    if (!a) return '(ยังไม่เลือกเงื่อนไข)';
    const op = r.operator ? OPERATOR_LABEL[r.operator as RuleOperator] : '?';
    let val: string;
    if (a.kind === 'code') val = ((r.value as unknown[]) ?? []).map((x) => this.lookup.label(a.source, x)).join(', ') || '?';
    else if (r.operator === 'BETWEEN') val = `${blank(r.value) ? '?' : num(r.value)} – ${blank(r.value2) ? '?' : num(r.value2)}${a.suffix ?? ''}`;
    else val = `${blank(r.value) ? '?' : num(r.value)}${a.suffix ?? ''}`;
    return `${a.label} ${op} ${val}`;
  }

  /** ข้อความเด่นบนการ์ดตัวอย่าง */
  headline(): string {
    const f = this.form();
    const b = f.data.benefit;
    switch (f.typeCode) {
      case 'VOUCHER':
        return `รับ ${this.label({ master: 'MS-10' }, b['voucherCode']).split(' · ')[1] ?? 'e-Voucher'}`;
      case 'DISCOUNT':
        return blank(b['value']) ? 'ส่วนลดเบี้ย' : `ลดเบี้ย ${num(b['value'])}${b['discountType'] === 'PERCENT' ? '%' : ' บาท'}`;
      case 'CASHBACK':
        return blank(b['value']) ? 'รับเงินคืน' : `รับเงินคืน ${num(b['value'])}${b['cashbackType'] === 'PERCENT' ? '%' : ' บาท'}`;
      case 'INSTALLMENT':
        return Number(b['interestRate'] ?? 0) === 0 ? 'ผ่อน 0%' : 'ผ่อนชำระเบี้ย';
      case 'LUCKY_DRAW':
        return 'ลุ้นรับรางวัล';
      default:
        return this.typeName().split(' · ')[1] ?? '';
    }
  }
}
