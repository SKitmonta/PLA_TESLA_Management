/**
 * Add Campaign ขั้น 1 — เลือกประเภท (CP-02) · การ์ดตาม Master MS-01 (Campaign Type) · 1 Campaign = 1 ประเภท
 * เปลี่ยนประเภทได้จนกว่าจะบันทึกครั้งแรก (CP-COM-03)
 */
import { Component, computed, inject, input, output } from '@angular/core';
import { CampaignTypeCode } from '../../../../core/models/campaign.model';
import { CampaignLookup } from '../../campaign-lookup.service';
import { CampaignForm, TYPE_ABBR, TYPE_ICON, TYPE_PHASE } from '../../campaign-options';

@Component({
  selector: 'app-step-type',
  templateUrl: './step-type.html',
  styleUrl: './step-type.scss',
})
export class StepType {
  private readonly lookup = inject(CampaignLookup);

  readonly form = input.required<CampaignForm>();
  /** true = เปลี่ยนประเภทไม่ได้ (บันทึกแล้ว / ดูอย่างเดียว) */
  readonly locked = input(false);
  readonly picked = output<CampaignTypeCode>();

  readonly icon = TYPE_ICON;
  readonly abbr = TYPE_ABBR;
  readonly phase = TYPE_PHASE;

  readonly types = computed(() =>
    (this.lookup.masters()['MS-01'] ?? [])
      .filter((t) => t.isActive && TYPE_ABBR[t.itemCode])
      .map((t) => ({
        code: t.itemCode as CampaignTypeCode,
        nameEn: t.nameEn ?? t.nameTh,
        nameTh: t.nameTh,
        kind: String(t.attributes['benefit_kind'] ?? ''),
        description: String(t.attributes['description'] ?? ''),
      })),
  );

  pick(code: CampaignTypeCode): void {
    if (!this.locked()) this.picked.emit(code);
  }
}
