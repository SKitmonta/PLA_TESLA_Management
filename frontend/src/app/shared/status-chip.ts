import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  template: `<span class="chip" [class]="'chip ' + status().toLowerCase()">{{ label() }}</span>`,
  styles: `
    .chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .02em;
      white-space: nowrap;
    }
    .active, .running { background: var(--status-active-bg); color: var(--status-active-fg); }
    .draft, .upcoming { background: var(--status-draft-bg); color: var(--status-draft-fg); }
    .inactive, .ended { background: var(--status-inactive-bg); color: var(--status-inactive-fg); }
  `,
})
export class StatusChip {
  status = input.required<string>();
  protected label = () => {
    const s = this.status();
    return s.charAt(0) + s.slice(1).toLowerCase();
  };
}
