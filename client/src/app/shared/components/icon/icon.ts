/**
 * ไอคอน SVG กลางของระบบ (เส้น 1.8px ตาม Mockup / Figma Icon set)
 * ใช้: <app-icon name="content" [size]="18" />
 * เพิ่มไอคอนใหม่: เพิ่มชื่อใน IconName แล้วเพิ่ม @case ใน icon.html
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'overview'
  | 'content'
  | 'campaign'
  | 'people'
  | 'master'
  | 'menu'
  | 'bell'
  | 'home'
  | 'chevron-down'
  | 'chevron-right'
  | 'check'
  | 'plus'
  | 'user-switch'
  | 'info';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly strokeWidth = input(1.8);
}
