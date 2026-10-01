/**
 * OV-00 Overview Dashboard (Figma 18:83 · doc 08)
 *   หน้าเดียว เนื้อหาตาม Role (OV-03): Executive = OV-A…E · Maker / Approver / Seller Admin = OV-D + OV-F
 *   สลับตัวชี้วัด FYP / APE / จำนวนกรมธรรม์ (จำค่าต่อผู้ใช้ — BR-OV-002) · ตัวกรองทั้งหน้า
 *   Real-time (BR-OV-005): ดึงข้อมูลใหม่ทุก 30 วินาที · แสดง "อัปเดตล่าสุด"
 *   กราฟวาดด้วย HTML/CSS (ไม่ต้องติดตั้ง chart.js เพิ่ม) · แถบย่อยใช้ PrimeNG ProgressBar
 */
import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { OverviewApiService } from '../../../core/services/overview-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { DashboardData, DashboardQuery, Metric, OverviewOptions, Task } from '../../../core/models/overview.model';
import { METRIC_LABEL, METRIC_UNIT, full, iso, monthLabel, short, thDate } from '../overview-format';

const REFRESH_MS = 30_000;
const CH_COLORS = ['#00317a', '#2f8fce', '#0f8a5f', '#b45309', '#7c3aed', '#be123c'];

const ACTION_TEXT: Record<string, string> = {
  SUBMIT: 'ส่งอนุมัติ',
  APPROVE: 'อนุมัติ',
  REJECT: 'ตีกลับ',
  NEW_VERSION: 'สร้าง Version ใหม่',
  SUSPEND: 'Suspend',
  RESUME: 'เปิดใช้อีกครั้ง',
  CREATE_GROUP: 'สร้างกลุ่ม',
  UPDATE_GROUP: 'แก้ไขกลุ่ม',
  DELETE_GROUP: 'ลบกลุ่ม',
  MOVE: 'ย้ายผู้ขาย',
  BIND: 'ผูก Campaign',
  UNBIND: 'ถอด Campaign',
  IMPORT: 'Import',
  COPY: 'คัดลอกกลุ่ม',
  SYNC_REMOVE: 'Removed by sync',
};

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    FloatLabelModule,
    MessageModule,
    ProgressBarModule,
    SelectButtonModule,
    TagModule,
    TooltipModule,
    SelectField,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly api = inject(OverviewApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);

  readonly data = signal<DashboardData | null>(null);
  readonly options = signal<OverviewOptions | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly lastUpdate = signal<Date | null>(null);

  // ---------------------------------------------------------------- ตัวกรองทั้งหน้า
  readonly range = signal<Date[] | null>(this.thisMonth());
  readonly channel = signal<string | null>(null);
  readonly pkg = signal<string | null>(null);
  readonly productType = signal<string | null>(null);
  readonly campaignType = signal<string | null>(null);
  readonly metric = signal<Metric>('FYP');

  readonly metrics = (['FYP', 'APE', 'POLICY'] as Metric[]).map((m) => ({ label: METRIC_LABEL[m], value: m }));
  readonly sellerViews = [
    { value: 'seller', label: 'รายผู้ขาย' },
    { value: 'group', label: 'รายกลุ่ม' },
  ];
  readonly sellerView = signal<'seller' | 'group'>('seller');
  readonly trendAsTable = signal(false);

  readonly short = short;
  readonly full = full;
  readonly monthLabel = monthLabel;
  readonly actionText = ACTION_TEXT;

  readonly isExec = computed(() => this.data()?.sections.includes('A') ?? false);
  readonly unit = computed(() => METRIC_UNIT[this.metric()]);
  readonly metricName = computed(() => METRIC_LABEL[this.metric()]);
  readonly rangeText = computed(() => {
    const d = this.data();
    return d ? `${thDate(d.from)} – ${thDate(d.to)}` : '';
  });
  readonly monthName = computed(() => {
    const d = this.data();
    if (!d) return '';
    return d.from.slice(0, 7) === d.to.slice(0, 7) ? monthLabel(d.from.slice(0, 7)) : 'ช่วงที่เลือก';
  });

  readonly channelOptions = computed(() => (this.options()?.channels ?? []).map((c) => ({ value: c.code, label: `${c.code} ${c.name}` })));
  readonly packageOptions = computed(() =>
    (this.options()?.packages ?? []).filter((p) => !this.channel() || p.channels.includes(this.channel()!)).map((p) => ({ value: p.packageCode, label: `${p.packageCode} ${p.nameTh}` })),
  );
  readonly productOptions = computed(() => (this.options()?.productTypes ?? []).map((p) => ({ value: p.code, label: `${p.code} ${p.name}` })));
  readonly campaignTypeOptions = computed(() => (this.options()?.campaignTypes ?? []).map((c) => ({ value: c.code, label: c.name })));

  // ---------------------------------------------------------------- กราฟ (HTML / CSS)
  /** กราฟแนวโน้ม: แท่งซ้อนตามช่องทาง + เส้น Target — ความสูงเป็น % ของค่าสูงสุด */
  readonly trendBars = computed(() => {
    const t = this.data()?.trend;
    if (!t) return null;
    const max = Math.max(1, ...t.actual, ...t.target.map((v) => v ?? 0)) * 1.08;
    return {
      ticks: [1, 0.75, 0.5, 0.25, 0].map((f) => short(max * f, this.metric())),
      legend: t.byChannel.map((c, i) => ({ code: c.channelCode, color: CH_COLORS[i % CH_COLORS.length] })),
      months: t.months.map((m, i) => ({
        label: monthLabel(m),
        total: t.actual[i],
        target: t.target[i],
        targetPct: t.target[i] === null ? null : ((t.target[i] as number) / max) * 100,
        hit: t.target[i] !== null && t.actual[i] >= (t.target[i] as number),
        segments: t.byChannel.map((c, k) => ({ code: c.channelCode, value: c.values[i], pct: (c.values[i] / max) * 100, color: CH_COLORS[k % CH_COLORS.length] })).filter((x) => x.value > 0),
      })),
    };
  });

  /** แถบแนวนอนตามช่องทาง (% ของช่องทางที่สูงสุด) */
  readonly channelBars = computed(() => {
    const list = this.data()?.byChannel ?? [];
    const max = Math.max(1, ...list.map((c) => c.value));
    return list.map((c, i) => ({ ...c, pct: (c.value / max) * 100, color: CH_COLORS[i % CH_COLORS.length] }));
  });

  readonly channelTotal = computed(() => (this.data()?.byChannel ?? []).reduce((a, c) => a + c.value, 0));

  constructor() {
    const destroyRef = inject(DestroyRef);
    const timer = setInterval(() => this.load(true), REFRESH_MS);
    destroyRef.onDestroy(() => clearInterval(timer));
    // สลับ Role → โหลดใหม่ (Section เปลี่ยนตามสิทธิ์)
    effect(() => {
      this.session.role();
      this.session.userId();
      untracked(() => {
        this.metric.set(this.savedMetric());
        this.load();
      });
    });
  }

  ngOnInit(): void {
    this.api.options().subscribe({ next: (o) => this.options.set(o), error: () => undefined });
  }

  private thisMonth(): Date[] {
    const now = new Date();
    return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  }

  private metricKey(): string {
    return `tesla.ov.metric.${this.session.userId()}`;
  }

  private savedMetric(): Metric {
    try {
      const v = localStorage.getItem(this.metricKey());
      return v === 'APE' || v === 'POLICY' ? v : 'FYP';
    } catch {
      return 'FYP';
    }
  }

  query(): DashboardQuery {
    const r = this.range();
    return {
      from: r?.[0] ? iso(r[0]) : undefined,
      to: r?.[1] ? iso(r[1]) : r?.[0] ? iso(r[0]) : undefined,
      channel: this.channel() ?? undefined,
      package: this.pkg() ?? undefined,
      productType: this.productType() ?? undefined,
      campaignType: this.campaignType() ?? undefined,
      metric: this.metric(),
    };
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    this.api.dashboard(this.query()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.error.set('');
        this.loading.set(false);
        this.lastUpdate.set(new Date(d.updatedAt));
      },
      error: (err) => {
        this.loading.set(false);
        if (!silent) this.error.set(apiError(err));
      },
    });
  }

  setMetric(m: Metric | null): void {
    if (!m) return;
    this.metric.set(m);
    try {
      localStorage.setItem(this.metricKey(), m);
    } catch {
      /* ignore */
    }
    this.load();
  }

  setRange(v: Date[] | null): void {
    this.range.set(v);
    // ช่วงวันที่ต้องเลือกครบ 2 วัน (หรือล้างค่า = เดือนนี้)
    if (!v || v[1]) this.load();
  }

  setFilter(which: 'channel' | 'pkg' | 'productType' | 'campaignType', v: string | null): void {
    this[which].set(v);
    if (which === 'channel' && this.pkg() && !this.packageOptions().some((p) => p.value === this.pkg())) this.pkg.set(null);
    this.load();
  }

  updatedText(): string {
    const d = this.lastUpdate();
    if (!d) return '';
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }

  openTask(t: Task): void {
    this.router.navigate([t.link], { queryParams: t.query });
  }

  statusSeverity(s: string): 'success' | 'info' | 'warn' | 'secondary' {
    return s === 'ACTIVE' ? 'success' : s === 'SCHEDULED' ? 'info' : s === 'PENDING' ? 'warn' : 'secondary';
  }

  pctClass(p: number | null): string {
    if (p === null) return '';
    return p >= 100 ? 'good' : p >= 80 ? 'mid' : 'low';
  }

  /** Export Section ที่เห็น (BR-OV-008) — CSV เปิดด้วย Excel */
  exportExcel(): void {
    const d = this.data();
    if (!d) return;
    const m = this.metricName();
    const rows: (string | number | null)[][] = [[`Overview ${thDate(d.from)} – ${thDate(d.to)} · ตัวชี้วัด ${m}`], []];
    if (d.kpi) {
      rows.push(['OV-A สรุปผู้บริหาร'], ['ยอดขายอนุมัติแล้ว', d.kpi.sales], ['Target', d.kpi.target], ['% ถึงเป้า', d.kpi.targetPct], ['กรมธรรม์อนุมัติ', d.kpi.approved], ['เข้าเงื่อนไข Campaign', d.kpi.eligible], ['อัตราอนุมัติ (%)', d.kpi.approvalRate], ['งบใช้จริง', d.kpi.budget.used], ['งบจอง', d.kpi.budget.reserved], ['งบคงเหลือ', d.kpi.budget.remaining], ['ต้นทุนต่อกรมธรรม์', d.kpi.costPerPolicy], ['FYP ต่องบ', d.kpi.salesPerBudget], []);
    }
    if (d.trend) {
      rows.push(['OV-B แนวโน้ม', ...d.trend.months], ['ยอดจริง', ...d.trend.actual], ['Target', ...d.trend.target]);
      for (const c of d.trend.byChannel) rows.push([c.channelCode, ...c.values]);
      rows.push([]);
    }
    if (d.packages) {
      rows.push(['OV-C Package', 'ชื่อ', 'Channel', 'Target (sale_Target)', `${m} จริง`, '% ถึงเป้า', 'กรมธรรม์', 'Campaign Active']);
      for (const p of d.packages) rows.push([p.packageCode, p.nameTh, p.channelCode, p.target, p.actual, p.targetPct, p.policies, p.activeCampaigns]);
      rows.push([]);
    }
    if (d.campaigns) {
      rows.push(['OV-D Campaign', 'ประเภท', 'สถานะ', 'Eligible (Reserved)', 'Confirmed', 'Fulfilled', 'Released', 'Clawed back', 'งบที่ใช้ %', 'โควตาที่ใช้ %', 'หมดอายุ']);
      for (const c of d.campaigns)
        rows.push([c.campaignCode, c.typeName ?? c.typeCode, c.displayStatus, c.stats.RESERVED, c.stats.CONFIRMED, c.stats.FULFILLED, c.stats.RELEASED, c.stats.CLAWED_BACK, c.budgetPct, c.quotaPct, c.endDate]);
      rows.push([]);
    }
    if (d.sellers) {
      rows.push(['OV-E Top ผู้ขาย', 'ชื่อ', 'กลุ่ม', m, 'กรมธรรม์']);
      for (const s of d.sellers.top) rows.push([s.sellerCode, s.sellerName, s.groupName, s.value, s.policies]);
      rows.push([], ['OV-E กลุ่ม', 'Workspace', 'สมาชิก', 'Target', 'ยอดจริง', '% ถึงเป้า', 'กรมธรรม์', 'คลิก', 'ใบคำขอ', 'อนุมัติ']);
      for (const g of d.sellers.groups) rows.push([g.groupName, g.workspace, g.members, g.target, g.actual, g.targetPct, g.policies, g.referral?.clicks ?? null, g.referral?.applications ?? null, g.referral?.approved ?? null]);
      rows.push([]);
    }
    if (d.tasks) {
      rows.push(['OV-F งานที่ต้องทำ', 'จำนวน']);
      for (const t of d.tasks) rows.push([t.label, t.count]);
    }
    const esc = (v: string | number | null) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const url = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `overview-${d.from}-${d.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.success('Export แล้ว', `Section ที่แสดง · ตัวชี้วัด ${m}`);
  }
}
