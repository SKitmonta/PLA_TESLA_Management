/**
 * Add Campaign ขั้น 3 — รายละเอียดสิทธิประโยชน์ (CP-04 · doc 06 §4.1–4.9)
 * หน้าจอสร้างจากตาราง BENEFIT_FIELDS ใน campaign-options.ts (เพิ่ม / แก้ Field ที่นั่น)
 * ค่าเก็บใน data.benefit ของ Campaign
 */
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { TextField } from '../../../../shared/components/form/text-field/text-field';
import { TextareaField } from '../../../../shared/components/form/textarea-field/textarea-field';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { MultiSelectField } from '../../../../shared/components/form/multiselect-field/multiselect-field';
import { DateField } from '../../../../shared/components/form/date-field/date-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { UploadBox } from '../../../package/content-editor/upload-box/upload-box';
import { CampaignLookup } from '../../campaign-lookup.service';
import { BENEFIT_FIELDS, BenefitField, CampaignForm, Opt, OptionSource, TYPE_ICON } from '../../campaign-options';

type Row = Record<string, unknown>;

@Component({
  selector: 'app-step-benefit',
  imports: [FormsModule, ButtonModule, MessageModule, ToggleSwitchModule, TextField, TextareaField, SelectField, MultiSelectField, DateField, NumberField, UploadBox],
  templateUrl: './step-benefit.html',
  styleUrls: ['../step.scss', './step-benefit.scss'],
})
export class StepBenefit {
  readonly lookup = inject(CampaignLookup);
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly form = input.required<CampaignForm>();
  readonly icon = TYPE_ICON;

  fields(): BenefitField[] {
    const t = this.form().typeCode;
    return t ? BENEFIT_FIELDS[t] : [];
  }

  b(): Row {
    return this.form().data.benefit;
  }

  visible(field: BenefitField): boolean {
    return !field.showIf || field.showIf(this.b());
  }

  wide(field: BenefitField): boolean {
    return !!field.wide || field.kind === 'table' || field.kind === 'textarea';
  }

  opts(source: OptionSource | undefined): Opt[] {
    return source ? this.lookup.options(source, this.form().packageCodes) : [];
  }

  typeName(): string {
    const t = this.form().typeCode;
    const item = t ? this.lookup.item('MS-01', t) : undefined;
    return item ? `${item.nameEn ?? item.nameTh} · ${item.nameTh}` : '';
  }

  text(v: unknown): string {
    return v === null || v === undefined ? '' : String(v);
  }

  // ---------- ตาราง (Tier / เบี้ยขั้นต่ำ / รางวัล)
  rows(key: string): Row[] {
    const b = this.b();
    if (!Array.isArray(b[key])) b[key] = [];
    return b[key] as Row[];
  }

  addRow(field: BenefitField): void {
    this.rows(field.key).push(Object.fromEntries((field.columns ?? []).map((c) => [c.key, null])));
  }

  removeRow(key: string, i: number): void {
    this.rows(key).splice(i, 1);
  }

  /** Stock คงเหลือของ Voucher / ของแถมที่เลือก (CP-VOU-05 / CP-GFT-03) */
  stock(): { name: string; left: number } | null {
    const t = this.form().typeCode;
    const type = t === 'VOUCHER' ? 'MS-10' : t === 'FREE_GIFT' ? 'MS-16' : null;
    if (!type) return null;
    const code = this.b()[t === 'VOUCHER' ? 'voucherCode' : 'giftCode'];
    const left = this.lookup.stockLeft(type, code);
    const item = this.lookup.item(type, code);
    return left === null || !item ? null : { name: item.nameTh, left };
  }

  overStock(): boolean {
    const s = this.stock();
    return !!s && Number(this.b()['allocated'] ?? 0) > s.left;
  }
}
