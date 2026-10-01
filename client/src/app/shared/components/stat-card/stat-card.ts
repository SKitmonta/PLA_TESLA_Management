/**
 * การ์ดสรุปตัวเลข — ตาม Figma Component 16–20 (Package management 1:5216)
 * ใช้: <app-stat-card label="Active" [value]="10" icon="active" [selected]="true" (click)="..." />
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatIcon = 'total' | 'active' | 'pending' | 'draft' | 'inactive';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'button',
    tabindex: '0',
    '[class.selected]': 'selected()',
    '[attr.aria-pressed]': 'selected()',
  },
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<number | string>(0);
  readonly icon = input<StatIcon>('total');
  readonly selected = input(false);
}
