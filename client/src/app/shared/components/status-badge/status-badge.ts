/**
 * ป้ายสถานะ — ตาม Figma Status (4:2957): Active / Inactive / Pending / Draft
 * ใช้: <app-status-badge status="active" /> หรือเปลี่ยนข้อความ <app-status-badge status="active" label="Approved" />
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusKind = 'active' | 'inactive' | 'pending' | 'draft';

const DEFAULT_LABEL: Record<StatusKind, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  draft: 'Draft',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'status()' },
})
export class StatusBadge {
  readonly status = input.required<StatusKind>();
  readonly label = input<string>('');
  readonly text = computed(() => this.label() || DEFAULT_LABEL[this.status()]);
}
