/**
 * Sidebar — ตาม Figma Sidebar 1:70 (Active=Overview / Package / Campaign / Seller / Master setup)
 * แสดงเฉพาะเมนูที่ Role ปัจจุบันมีสิทธิ์ · กดลูกศร ▾ เพื่อเปิด/ปิดเมนูย่อย
 * รายการเมนูแก้ได้ที่ core/navigation/menu.config.ts · Version ที่การ์ดล่างแก้ได้ที่ core/app-info.ts
 */
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MENU, MenuItem, MenuKey } from '../../core/navigation/menu.config';
import { SessionService } from '../../core/auth/session.service';
import { LayoutService } from '../../core/layout/layout.service';
import { APP_INFO } from '../../core/app-info';

const ASSET = 'assets/figma/';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly session = inject(SessionService);
  readonly layout = inject(LayoutService);

  /** เมนูที่หน้าปัจจุบันอยู่ (มาจาก route data.menu) */
  readonly activeKey = input<MenuKey | undefined>(undefined);

  readonly info = APP_INFO;
  readonly asset = ASSET;
  readonly menu = computed(() => MENU.filter((m) => this.session.canSee(m.key)));
  private readonly expanded = signal<ReadonlySet<MenuKey>>(new Set());

  constructor() {
    // เปิดเมนูย่อยของเมนูที่กำลังใช้งานอัตโนมัติ
    effect(() => {
      const key = this.activeKey();
      if (key) this.expanded.update((s) => new Set(s).add(key));
    });
  }

  isOpen(key: MenuKey): boolean {
    return this.expanded().has(key);
  }

  hasSubmenu(m: MenuItem): boolean {
    return m.children.length > 0;
  }

  /** แถวเมนูหลักเป็นสีน้ำเงิน เมื่ออยู่ในเมนูนี้ และไม่ได้กางเมนูย่อยให้เห็นรายการที่เลือก */
  isSelected(m: MenuItem): boolean {
    if (this.activeKey() !== m.key) return false;
    return this.layout.collapsed() || !this.hasSubmenu(m) || !this.isOpen(m.key);
  }

  icon(m: MenuItem, active: boolean): string {
    return `${ASSET}menu-${m.icon}${active ? '-active' : ''}.svg`;
  }

  toggle(key: MenuKey): void {
    this.expanded.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  onNavigate(): void {
    this.layout.closeOverlay();
  }
}
