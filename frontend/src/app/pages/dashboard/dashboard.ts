import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Dashboard } from '../../core/models';
import { PageHeader } from '../../shared/page-header';
import { StatusChip } from '../../shared/status-chip';

interface Bar {
  label: string;
  value: number;
  tip: string;
}

@Component({
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, PageHeader, StatusChip],
  template: `
    <app-page-header title="Dashboard" subtitle="ภาพรวมการตั้งค่า Package, Campaign, Agent และการจับคู่">
      <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon> รีเฟรช</button>
      <a mat-flat-button routerLink="/combinations"><mat-icon>hub</mat-icon> จับคู่ใหม่</a>
    </app-page-header>

    @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }

    @if (data(); as d) {
      <section class="kpis">
        @for (k of kpis(); track k.label) {
          <a class="card kpi" [routerLink]="k.link">
            <div class="kpi-icon"><mat-icon>{{ k.icon }}</mat-icon></div>
            <div>
              <div class="kpi-label">{{ k.label }}</div>
              <div class="kpi-value">{{ k.total }}</div>
              <div class="kpi-sub"><span class="dot"></span>Active {{ k.active }}</div>
            </div>
          </a>
        }
      </section>

      <section class="row">
        <div class="card">
          <h3>Package ที่ถูกใช้จับคู่มากที่สุด</h3>
          <p class="muted cap">จำนวนการจับคู่ต่อ Package</p>
          @for (b of packageBars(); track b.label) {
            <div class="bar-row" [matTooltip]="b.tip" matTooltipPosition="above">
              <span class="bar-label">{{ b.label }}</span>
              <span class="bar-track"><span class="bar-fill" [style.width.%]="pct(b.value, packageMax())"></span></span>
              <span class="bar-value">{{ b.value }}</span>
            </div>
          } @empty { <div class="muted">ยังไม่มีข้อมูล</div> }
        </div>

        <div class="card">
          <h3>Agent Groups</h3>
          <p class="muted cap">จำนวน Agent ในแต่ละกลุ่ม</p>
          @for (b of groupBars(); track b.label) {
            <div class="bar-row" [matTooltip]="b.tip" matTooltipPosition="above">
              <span class="bar-label">{{ b.label }}</span>
              <span class="bar-track"><span class="bar-fill" [style.width.%]="pct(b.value, groupMax())"></span></span>
              <span class="bar-value">{{ b.value }}</span>
            </div>
          } @empty { <div class="muted">ยังไม่มีข้อมูล</div> }
        </div>
      </section>

      <section class="row">
        <div class="card">
          <div class="card-head">
            <h3>Campaign Timeline</h3>
            <a mat-button routerLink="/campaigns">ดูทั้งหมด</a>
          </div>
          @for (c of d.campaignTimeline; track c.id) {
            <div class="list-row">
              <div class="phase-icon" [class]="'phase-icon ' + c.phase.toLowerCase()">
                <mat-icon>{{ phaseIcon[c.phase] }}</mat-icon>
              </div>
              <div class="grow">
                <div class="title">{{ c.name }}</div>
                <div class="muted small">{{ c.start_date | date: 'dd MMM yy' }} – {{ c.end_date | date: 'dd MMM yy' }}</div>
              </div>
              <div class="right">
                <app-status-chip [status]="c.phase" />
                <div class="muted small">{{ phaseText(c.phase, c.days_left, c.start_date) }}</div>
              </div>
            </div>
          } @empty { <div class="muted">ยังไม่มี Campaign</div> }
        </div>

        <div class="card">
          <div class="card-head">
            <h3>การจับคู่ล่าสุด</h3>
            <a mat-button routerLink="/combinations">ดูทั้งหมด</a>
          </div>
          @for (r of d.recent; track r.id) {
            <div class="list-row">
              <div class="grow">
                <div class="title">{{ r.name }}</div>
                <div class="muted small">{{ r.package_name }} · {{ r.agent_group_name }} · {{ r.campaign_name ?? 'ไม่มี Campaign' }}</div>
              </div>
              <div class="right">
                <app-status-chip [status]="r.status" />
                <div class="muted small">{{ r.updated_at | date: 'dd/MM/yy HH:mm' }}</div>
              </div>
            </div>
          } @empty { <div class="muted">ยังไม่มีการจับคู่</div> }
        </div>
      </section>
    }
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 16px; }
    @media (max-width: 1200px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px) { .kpis { grid-template-columns: 1fr 1fr; } }
    .kpi { display: flex; gap: 14px; align-items: center; text-decoration: none; color: inherit; transition: box-shadow .15s, transform .15s; }
    .kpi:hover { box-shadow: 0 6px 20px rgba(15,23,42,.08); transform: translateY(-1px); }
    .kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: #eff6ff; color: #1d4ed8; }
    .kpi-label { font-size: 13px; color: var(--app-text-muted); }
    .kpi-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
    .kpi-sub { font-size: 12px; color: var(--app-text-muted); display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--status-active-fg); }

    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 1000px) { .row { grid-template-columns: 1fr; } }
    h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .cap { margin: 2px 0 14px; font-size: 13px; }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

    .bar-row { display: grid; grid-template-columns: minmax(80px, 140px) 1fr 36px; gap: 12px; align-items: center; padding: 7px 0; cursor: default; }
    .bar-row:hover .bar-fill { background: #1e40af; }
    .bar-label { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 12px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: #3b82f6; border-radius: 0 4px 4px 0; min-width: 2px; transition: width .4s; }
    .bar-value { text-align: right; font-weight: 600; font-size: 14px; }

    .list-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--app-border); }
    .list-row:first-of-type { border-top: none; }
    .grow { flex: 1; min-width: 0; }
    .title { font-weight: 500; }
    .small { font-size: 12px; }
    .right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .phase-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; }
    .phase-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .running { background: var(--status-active-bg); color: var(--status-active-fg); }
    .upcoming { background: var(--status-draft-bg); color: var(--status-draft-fg); }
    .ended { background: var(--status-inactive-bg); color: var(--status-inactive-fg); }
  `,
})
export class DashboardPage {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(false);
  protected phaseIcon = { RUNNING: 'play_circle', UPCOMING: 'schedule', ENDED: 'check_circle' } as const;

  readonly kpis = computed(() => {
    const c = this.data()?.counts;
    if (!c) return [];
    return [
      { label: 'Packages', icon: 'inventory_2', link: '/packages', ...c.packages },
      { label: 'Campaigns', icon: 'campaign', link: '/campaigns', ...c.campaigns },
      { label: 'Agents', icon: 'badge', link: '/agents', ...c.agents },
      { label: 'Agent Groups', icon: 'groups', link: '/agent-groups', ...c.groups },
      { label: 'Combinations', icon: 'hub', link: '/combinations', ...c.combinations },
    ];
  });

  readonly packageBars = computed<Bar[]>(() =>
    (this.data()?.packageUsage ?? []).map((p) => ({
      label: p.name,
      value: p.combination_count,
      tip: `${p.name}: ถูกจับคู่ ${p.combination_count} ครั้ง`,
    })),
  );
  readonly groupBars = computed<Bar[]>(() =>
    (this.data()?.topGroups ?? []).map((g) => ({
      label: g.name,
      value: g.agent_count,
      tip: `${g.name}: ${g.agent_count} Agents · ใช้ใน ${g.combination_count} การจับคู่`,
    })),
  );
  readonly packageMax = computed(() => Math.max(1, ...this.packageBars().map((b) => b.value)));
  readonly groupMax = computed(() => Math.max(1, ...this.groupBars().map((b) => b.value)));

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.dashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.notify.error(e);
      },
    });
  }

  pct(value: number, max: number) {
    return (value / max) * 100;
  }

  phaseText(phase: string, daysLeft: number, start: string) {
    if (phase === 'RUNNING') return `เหลืออีก ${daysLeft} วัน`;
    if (phase === 'UPCOMING') {
      const days = Math.ceil((new Date(start).getTime() - Date.now()) / 86_400_000);
      return `เริ่มในอีก ${days} วัน`;
    }
    return 'สิ้นสุดแล้ว';
  }
}
