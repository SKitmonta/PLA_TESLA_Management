/**
 * โครงหน้าหลัก: Sidebar | (Topbar + Breadcrumb + เนื้อหาของแต่ละเมนู)
 * Responsive: desktop ≥1200 / tablet 768–1199 / mobile <768 (ดู core/layout/layout.service.ts)
 */
import { Component, OnInit, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { SessionService } from '../../core/auth/session.service';
import { SystemApiService } from '../../core/services/system-api.service';
import { LayoutService } from '../../core/layout/layout.service';
import { MenuItem, MenuKey, findMenu } from '../../core/navigation/menu.config';

export interface PageInfo {
  menu: MenuItem | undefined;
  /** ชื่อหน้าใน Breadcrumb (ว่าง = หน้าแรกของเมนู) */
  crumbTitle: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header, Breadcrumb],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(SystemApiService);
  private readonly session = inject(SessionService);
  readonly layout = inject(LayoutService);

  readonly page = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.readRoute()),
    ),
    { initialValue: this.readRoute() },
  );

  constructor() {
    // สลับ Role แล้วไม่มีสิทธิ์เมนูที่เปิดอยู่ → กลับหน้า Overview
    effect(() => {
      const menu = this.page().menu;
      if (menu && !this.session.canSee(menu.key)) {
        void this.router.navigateByUrl('/overview');
      }
    });
  }

  ngOnInit(): void {
    this.api.users().subscribe({
      next: (users) => this.session.setUsers(users),
      error: () => console.warn('[shell] โหลดรายชื่อผู้ใช้ไม่ได้ — ตรวจสอบว่า Server port 3000 ทำงานอยู่'),
    });
  }

  private readRoute(): PageInfo {
    let node: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let menuKey: MenuKey | undefined;
    let crumbTitle = '';
    while (node) {
      if (node.data['menu']) menuKey = node.data['menu'] as MenuKey;
      if (node.data['title']) crumbTitle = node.data['crumb'] === false ? '' : (node.data['title'] as string);
      node = node.firstChild;
    }
    return { menu: findMenu(menuKey), crumbTitle };
  }
}
