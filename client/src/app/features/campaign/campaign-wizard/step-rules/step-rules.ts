/**
 * Add Campaign ขั้น 4 — เงื่อนไขผู้มีสิทธิ์ (CP-05 · Rule builder doc 06 §3)
 * หลายข้อต่อกันแบบ AND · 1 ข้อ = Attribute + Operator + Value · ไม่มีขั้นนี้สำหรับ Referral
 * เงื่อนไขระบบ (Package / ช่วงวัน / ช่องทาง / กลุ่มผู้ขาย / งบคงเหลือ) ตรวจอัตโนมัติ ไม่ต้องตั้งค่า
 */
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FORM_LOCK } from '../../../../shared/components/form/form-lock';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { MultiSelectField } from '../../../../shared/components/form/multiselect-field/multiselect-field';
import { NumberField } from '../../../../shared/components/form/number-field/number-field';
import { CampaignRule } from '../../../../core/models/campaign.model';
import { CampaignLookup } from '../../campaign-lookup.service';
import { CampaignForm, OPERATOR_LABEL, Opt, RULE_ATTRIBUTES, RuleAttribute, findAttribute } from '../../campaign-options';

@Component({
  selector: 'app-step-rules',
  imports: [FormsModule, ButtonModule, MessageModule, SelectField, MultiSelectField, NumberField],
  templateUrl: './step-rules.html',
  styleUrls: ['../step.scss', './step-rules.scss'],
})
export class StepRules {
  readonly lookup = inject(CampaignLookup);
  readonly locked = inject(FORM_LOCK, { optional: true }) ?? signal(false);
  readonly form = input.required<CampaignForm>();

  /** ตัวเลือก Attribute (แสดงรหัส CP-ELG) */
  readonly attributeOpts: Opt[] = RULE_ATTRIBUTES.map((a) => ({ value: a.code, label: `${a.label} (${a.id})` }));
  private readonly operatorCache = new Map<string, Opt[]>();

  rules(): CampaignRule[] {
    return this.form().data.rules;
  }

  attr(rule: CampaignRule): RuleAttribute | undefined {
    return findAttribute(rule.attribute);
  }

  operatorOpts(rule: CampaignRule): Opt[] {
    const a = this.attr(rule);
    if (!a) return [];
    let hit = this.operatorCache.get(a.code);
    if (!hit) {
      hit = a.operators.map((op) => ({ value: op, label: OPERATOR_LABEL[op] }));
      this.operatorCache.set(a.code, hit);
    }
    return hit;
  }

  valueOpts(rule: CampaignRule): Opt[] {
    const a = this.attr(rule);
    return a?.source ? this.lookup.options(a.source) : [];
  }

  add(): void {
    this.rules().push({ attribute: null, operator: null, value: null });
  }

  remove(i: number): void {
    this.rules().splice(i, 1);
  }

  /** เปลี่ยน Attribute → ล้าง Operator / ค่า และเลือก Operator แรกให้ */
  setAttribute(rule: CampaignRule, code: string | null): void {
    rule.attribute = code;
    const a = findAttribute(code);
    rule.operator = a?.operators[0] ?? null;
    rule.value = a?.kind === 'code' ? [] : null;
    rule.value2 = null;
  }

  usedPromo(): boolean {
    return !!String(this.form().data.promoCode ?? '').trim();
  }
}
