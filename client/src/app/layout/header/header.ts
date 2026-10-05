/**
 * Topbar — ตาม Figma Bar / Property 1=Topbar (1:391)
 * ☰ | ชื่อเมนู (กลาง) | 🔔 · Role · ชื่อผู้ใช้ · รูปโปรไฟล์ ▾
 * กดปุ่ม Role หรือรูปโปรไฟล์ = เปิดหน้าต่างสลับผู้ใช้/Role (Prototype แทน Login)
 */
import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { SessionService } from '../../core/auth/session.service';
import { DataSourceService } from '../../core/data-source/data-source.service';
import { LayoutService } from '../../core/layout/layout.service';
import { RoleSwitcher } from '../role-switcher/role-switcher';

@Component({
  selector: 'app-header',
  imports: [RoleSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'switcherOpen.set(false)',
  },
})
export class Header {
  readonly session = inject(SessionService);
  readonly dataSource = inject(DataSourceService);
  readonly layout = inject(LayoutService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly title = input('');
  /** จำนวนแจ้งเตือน (งานรออนุมัติ ฯลฯ) — 0 = ไม่แสดงตัวเลข */
  readonly notificationCount = input(0);

  readonly switcherOpen = signal(false);
  readonly asset = 'assets/figma/';
  readonly badgeText = computed(() => (this.notificationCount() > 99 ? '99+' : String(this.notificationCount())));

  toggleSwitcher(): void {
    this.switcherOpen.update((v) => !v);
  }

  onDocumentClick(event: MouseEvent): void {
    const panel = this.host.nativeElement.querySelector('.switcher-anchor');
    if (this.switcherOpen() && panel && !panel.contains(event.target as Node)) {
      this.switcherOpen.set(false);
    }
  }
}
