/**
 * สถานะ Layout + Responsive
 *  desktop ≥ 1200px : Sidebar 250px ค้างไว้ (ปุ่ม ☰ ย่อเหลือไอคอน)
 *  tablet 768–1199px: Sidebar ย่อเหลือไอคอนเป็นค่าเริ่มต้น (ปุ่ม ☰ ขยายแบบลอยทับ)
 *  mobile < 768px   : Sidebar ซ่อน (ปุ่ม ☰ เปิดเป็น Drawer ลอยทับ)
 */
import { Injectable, computed, signal } from '@angular/core';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly screen = signal<ScreenSize>(detect());
  /** desktop: ผู้ใช้กดย่อ Sidebar */
  readonly desktopCollapsed = signal(false);
  /** tablet / mobile: Sidebar เปิดลอยทับอยู่ */
  readonly overlayOpen = signal(false);

  /** Sidebar แสดงแบบย่อ (เห็นแค่ไอคอน) */
  readonly collapsed = computed(() => {
    switch (this.screen()) {
      case 'desktop':
        return this.desktopCollapsed();
      case 'tablet':
        return !this.overlayOpen();
      default:
        return false;
    }
  });

  /** Sidebar ซ่อนทั้งหมด (mobile ที่ยังไม่เปิด Drawer) */
  readonly hidden = computed(() => this.screen() === 'mobile' && !this.overlayOpen());

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', () => {
      const next = detect();
      if (next !== this.screen()) {
        this.screen.set(next);
        this.overlayOpen.set(false);
      }
    });
  }

  toggleSidebar(): void {
    if (this.screen() === 'desktop') this.desktopCollapsed.update((v) => !v);
    else this.overlayOpen.update((v) => !v);
  }

  /** ปิด Drawer หลังเลือกเมนู (tablet / mobile) */
  closeOverlay(): void {
    this.overlayOpen.set(false);
  }
}

function detect(): ScreenSize {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1200) return 'tablet';
  return 'desktop';
}
