import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatIconModule, MatButtonModule],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #nav [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()" class="sidebar">
        <div class="brand">
          <span class="logo">T</span>
          <div>
            <div class="brand-name">TESLA</div>
            <div class="brand-sub">Management</div>
          </div>
        </div>
        @for (section of nav_; track section.title) {
          <div class="nav-section">{{ section.title }}</div>
          @for (item of section.items; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active"
               (click)="isMobile() && nav.close()">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        }
      </mat-sidenav>

      <mat-sidenav-content>
        @if (isMobile()) {
          <header class="topbar">
            <button mat-icon-button (click)="nav.toggle()" aria-label="เมนู"><mat-icon>menu</mat-icon></button>
            <span class="brand-name dark">TESLA Management</span>
          </header>
        }
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100vh; background: var(--app-bg); }
    .sidebar {
      width: 248px;
      background: var(--app-sidebar);
      color: var(--app-sidebar-text);
      border-right: none;
      padding: 16px 12px;
      box-sizing: border-box;
    }
    .brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 20px; }
    .logo {
      width: 40px; height: 40px; border-radius: 10px;
      display: grid; place-items: center;
      background: var(--app-accent); color: #fff; font-weight: 800; font-size: 20px;
    }
    .brand-name { color: #fff; font-weight: 700; letter-spacing: .12em; }
    .brand-name.dark { color: #111827; letter-spacing: .04em; }
    .brand-sub { font-size: 12px; opacity: .7; }
    .nav-section { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .5; padding: 16px 12px 6px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 8px;
      color: inherit; text-decoration: none; font-size: 14px;
      transition: background .15s;
      &:hover { background: rgba(255,255,255,.06); color: #fff; }
      &.active { background: rgba(255,255,255,.1); color: #fff; box-shadow: inset 3px 0 0 var(--app-accent); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .topbar { display: flex; align-items: center; gap: 8px; padding: 8px; background: #fff; border-bottom: 1px solid var(--app-border); }
    .content { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }
    @media (max-width: 768px) { .content { padding: 16px; } }
  `,
})
export class App {
  private bp = inject(BreakpointObserver);
  protected isMobile = toSignal(this.bp.observe('(max-width: 900px)').pipe(map((r) => r.matches)), {
    initialValue: false,
  });

  protected nav_: { title: string; items: NavItem[] }[] = [
    { title: 'ภาพรวม', items: [{ path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' }] },
    {
      title: 'ตั้งค่า',
      items: [
        { path: '/packages', label: 'Packages', icon: 'inventory_2' },
        { path: '/campaigns', label: 'Campaigns', icon: 'campaign' },
      ],
    },
    {
      title: 'Agent',
      items: [
        { path: '/agents', label: 'Agents', icon: 'badge' },
        { path: '/agent-groups', label: 'Agent Groups', icon: 'groups' },
      ],
    },
    { title: 'จับคู่', items: [{ path: '/combinations', label: 'Combine', icon: 'hub' }] },
  ];
}
