/**
 * ป้าย Template: OL_OB (ฟ้า) / OL_PA (ม่วง) / AGENT (ส้ม) · ไม่มี Template = "–"
 * ใช้: <app-template-tag [template]="ch.template" />
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TemplateCode } from '../../../core/models/master.model';

@Component({
  selector: 'app-template-tag',
  template: `
    @switch (template()) {
      @case ('OL_OB') { <span class="tag t-ob">OL_OB</span> }
      @case ('OL_PA') { <span class="tag t-pa">OL_PA</span> }
      @case ('AGENT') { <span class="tag t-ag">AGENT</span> }
      @default { <span class="none" title="ไม่มี Template — ไม่แสดงใน Add Package">–</span> }
    }
  `,
  styles: `
    :host { display: inline-flex; }
    .none { color: #9aa3b5; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTag {
  readonly template = input<TemplateCode | null>(null);
}
