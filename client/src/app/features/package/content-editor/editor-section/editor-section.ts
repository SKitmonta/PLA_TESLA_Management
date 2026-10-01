/**
 * กรอบ Section ใน Editor (Figma: การ์ด + ป้ายรหัส OB-xx + ชื่อ + ป้ายสถานะ + คำอธิบายขวา)
 * collapsible = ย่อไว้ก่อน ("Field เหมือน OL_OB · กดเพื่อขยาย") · agentOnly = กรอบสีส้ม (เฉพาะตัวแทน)
 * ใช้: <app-editor-section sid="OB-02" heading="Hero Banner" hint="..."> ...ฟอร์ม... </app-editor-section>
 */
import { Component, input, linkedSignal } from '@angular/core';

export type SectionBadge = 'diff' | 'new' | 'agent' | '';

@Component({
  selector: 'app-editor-section',
  templateUrl: './editor-section.html',
  styleUrl: './editor-section.scss',
  host: {
    '[attr.id]': "'sec-' + sid()",
    '[attr.data-sec]': 'sid()',
    '[class.agent-only]': "badge() === 'agent'",
    '[class.diff]': "badge() === 'diff' || badge() === 'new'",
  },
})
export class EditorSection {
  readonly sid = input.required<string>();
  readonly heading = input.required<string>();
  readonly hint = input('');
  readonly badge = input<SectionBadge>('');
  readonly badgeText = input('');
  readonly collapsible = input(false);
  readonly collapsedHint = input('Field เหมือน OL_OB · กดเพื่อขยาย');

  /** ย่ออยู่หรือไม่ (เริ่มจาก collapsible) */
  readonly collapsed = linkedSignal(() => this.collapsible());

  toggle(): void {
    if (this.collapsible()) this.collapsed.update((v) => !v);
  }
}
