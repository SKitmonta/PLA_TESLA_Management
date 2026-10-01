/**
 * OV-10 ตั้ง Target (Figma 17:1022 · doc 08 BR-OV-004, OV-01)
 *   ระดับ: ช่องทาง / กลุ่มผู้ขาย / ผู้ขาย × ตัวชี้วัด (FYP / APE / จำนวนกรมธรรม์) × รายเดือน
 *   Target ระดับ Package มาจาก sale_Target (FYP บาท ตลอดอายุ Package — แก้ที่นี่ไม่ได้)
 *   ผลรวมระดับล่างเกินระดับบน → เตือน (ไม่บล็อก) · Import / Export เป็น .csv (เปิดด้วย Excel ได้)
 *   แก้ไขได้เฉพาะ Executive / Seller Admin — Role อื่นดูอย่างเดียว
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { OverviewApiService } from '../../../core/services/overview-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { Metric, OverviewOptions, TargetLevel, TargetSheet } from '../../../core/models/overview.model';
import { METRIC_LABEL, full, monthLabel } from '../overview-format';
import { downloadCsv, parseCsv } from '../../seller/seller-shared';

@Component({
  selector: 'app-target-setting',
  imports: [FormsModule, ButtonModule, FileUploadModule, InputNumberModule, MessageModule, SelectButtonModule, TagModule, TooltipModule, SelectField],
  templateUrl: './target-setting.html',
  styleUrl: './target-setting.scss',
})
export class TargetSetting implements OnInit {
  private readonly api = inject(OverviewApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  readonly canEdit = computed(() => this.session.canEdit('overview'));
  readonly options = signal<OverviewOptions | null>(null);
  readonly sheet = signal<TargetSheet | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);

  readonly level = signal<TargetLevel>('CHANNEL');
  readonly pkg = signal<string | null>(null);
  readonly ch = signal<string | null>(null);
  readonly metric = signal<Metric>('FYP');
  readonly from = signal(this.month(1));
  readonly to = signal(this.month(3));

  /** ค่าที่แก้ในตาราง: key = refId|period */
  readonly edits = signal<Map<string, number | null>>(new Map());

  readonly levels = [
    { value: 'CHANNEL', label: 'ช่องทาง' },
    { value: 'GROUP', label: 'กลุ่มผู้ขาย' },
    { value: 'SELLER', label: 'ผู้ขาย' },
  ];
  readonly metrics = (['FYP', 'APE', 'POLICY'] as Metric[]).map((m) => ({ value: m, label: m === 'POLICY' ? 'จำนวนกรมธรรม์ (ฉบับ)' : `${METRIC_LABEL[m]} (บาท)` }));
  readonly monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), i, 1);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value: p, label: monthLabel(p, true) };
  });

  readonly monthLabel = monthLabel;
  readonly full = full;
  readonly metricLabel = METRIC_LABEL;

  readonly packageOptions = computed(() => (this.options()?.packages ?? []).map((p) => ({ value: p.packageCode, label: `${p.packageCode} ${p.nameTh}` })));
  readonly channelOptions = computed(() => {
    const p = this.options()?.packages.find((x) => x.packageCode === this.pkg());
    const names = new Map((this.options()?.channels ?? []).map((c) => [c.code, c.name]));
    return (p?.channels ?? []).map((c) => ({ value: c, label: `${c} ${names.get(c) ?? ''}`.trim() }));
  });
  readonly toOptions = computed(() => this.monthOptions.filter((m) => m.value >= this.from()));
  readonly dirtyCount = computed(() => this.edits().size);

  ngOnInit(): void {
    this.api.options().subscribe({
      next: (o) => {
        this.options.set(o);
        const first = o.packages.find((p) => p.packageCode === 'ST000006') ?? o.packages[0];
        if (first) {
          this.pkg.set(first.packageCode);
          this.ch.set(first.channels[0] ?? null);
          this.load();
        }
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  private month(offset: number): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  load(): void {
    const pkg = this.pkg();
    const ch = this.ch();
    if (!pkg || !ch) {
      this.sheet.set(null);
      return;
    }
    this.api.targets({ level: this.level(), pkg, ch, metric: this.metric(), from: this.from(), to: this.to() }).subscribe({
      next: (s) => {
        this.sheet.set(s);
        this.edits.set(new Map());
        this.error.set('');
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  /** เปลี่ยนตัวเลือกด้านบน — ถ้ามีค่าที่ยังไม่บันทึก เตือนก่อน */
  change(field: 'level' | 'pkg' | 'ch' | 'metric' | 'from' | 'to', v: string | null): void {
    if (v === null && field !== 'ch' && field !== 'pkg') return;
    if (this.dirtyCount()) this.notify.warn('ยกเลิกค่าที่ยังไม่บันทึก', `${this.dirtyCount()} ช่อง`);
    switch (field) {
      case 'level':
        this.level.set(v as TargetLevel);
        break;
      case 'pkg':
        this.pkg.set(v);
        this.ch.set(this.channelOptions()[0]?.value ?? null);
        break;
      case 'ch':
        this.ch.set(v);
        break;
      case 'metric':
        this.metric.set(v as Metric);
        break;
      case 'from':
        this.from.set(v!);
        if (this.to() < v!) this.to.set(v!);
        break;
      case 'to':
        this.to.set(v!);
        break;
    }
    this.load();
  }

  value(refId: string, period: string): number | null {
    const k = `${refId}|${period}`;
    const e = this.edits();
    if (e.has(k)) return e.get(k) ?? null;
    return this.sheet()?.rows.find((r) => r.refId === refId)?.values[period] ?? null;
  }

  isDirty(refId: string, period: string): boolean {
    return this.edits().has(`${refId}|${period}`);
  }

  set(refId: string, period: string, v: number | null): void {
    const orig = this.sheet()?.rows.find((r) => r.refId === refId)?.values[period] ?? null;
    const next = new Map(this.edits());
    const k = `${refId}|${period}`;
    if ((v ?? null) === orig) next.delete(k);
    else next.set(k, v ?? null);
    this.edits.set(next);
  }

  rowTotal(refId: string): number | null {
    const s = this.sheet();
    if (!s) return null;
    const vals = s.periods.map((p) => this.value(refId, p)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }

  colTotal(period: string): number | null {
    const s = this.sheet();
    if (!s) return null;
    const vals = s.rows.map((r) => this.value(r.refId, period)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }

  grandTotal(): number | null {
    const s = this.sheet();
    if (!s) return null;
    const vals = s.periods.map((p) => this.colTotal(p)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }

  save(): void {
    const s = this.sheet();
    if (!s || !this.dirtyCount()) return;
    const values = [...this.edits()].map(([k, v]) => {
      const [refId, period] = k.split('|');
      return { refId, period, value: v };
    });
    this.busy.set(true);
    this.api.saveTargets({ level: s.level, pkg: s.packageCode, ch: s.channelCode, metric: s.metric, values }).subscribe({
      next: () => {
        this.busy.set(false);
        this.notify.success('บันทึก Target แล้ว', `${values.length} ช่อง · ${s.packageCode} × ${s.channelCode}`);
        this.load();
        // เตือนผลรวมเกิน (ไม่บล็อก) — แสดงจากผลที่โหลดใหม่
        setTimeout(() => {
          const w = this.sheet()?.warnings ?? [];
          if (w.length) this.notify.warn('ผลรวม Target เกินระดับบน', w.join(' · '));
        }, 400);
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.fromError(err, 'บันทึก Target ไม่สำเร็จ');
      },
    });
  }

  reset(): void {
    this.edits.set(new Map());
  }

  exportExcel(): void {
    const s = this.sheet();
    if (!s) return;
    downloadCsv(`target-${s.level.toLowerCase()}-${s.packageCode}-${s.channelCode}-${s.metric}.csv`, [
      ['level', 'package_Code', 'channel_Code', 'metric', 'ref_Id', 'ชื่อ', 'period', 'value'],
      ...s.rows.flatMap((r) => s.periods.map((p) => [s.level, s.packageCode, s.channelCode, s.metric, r.refId, r.name, p, this.value(r.refId, p)])),
    ]);
    this.notify.success('Export แล้ว', `${s.rows.length} แถว × ${s.periods.length} เดือน`);
  }

  /** Import: ใช้คอลัมน์ ref_Id, period, value (ไฟล์เดียวกับที่ Export) — ใส่ค่าลงตารางก่อน แล้วกดบันทึก */
  onFile(event: { files: File[] }, uploader?: { clear: () => void }): void {
    const file = event.files?.[0];
    uploader?.clear();
    const s = this.sheet();
    if (!file || !s) return;
    if (!/\.csv$/i.test(file.name)) {
      this.notify.warn('รองรับไฟล์ .csv', 'ใน Excel เลือก บันทึกเป็น → CSV UTF-8 (.csv)');
      return;
    }
    file.text().then((text) => {
      const rows = parseCsv(text);
      const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
      const ri = head.indexOf('ref_id');
      const pi = head.indexOf('period');
      const vi = head.indexOf('value');
      if (ri < 0 || pi < 0 || vi < 0) {
        this.notify.warn('หัวคอลัมน์ไม่ถูกต้อง', 'ต้องมี ref_Id, period, value (ใช้ไฟล์จาก Export Excel)');
        return;
      }
      const refs = new Set(s.rows.map((r) => r.refId));
      let ok = 0;
      let skip = 0;
      for (const r of rows.slice(1)) {
        const ref = (r[ri] ?? '').trim();
        const period = (r[pi] ?? '').trim();
        const raw = (r[vi] ?? '').replace(/,/g, '').trim();
        const num = raw === '' ? null : Number(raw);
        if (!refs.has(ref) || !s.periods.includes(period) || (num !== null && (!Number.isFinite(num) || num < 0))) {
          skip++;
          continue;
        }
        this.set(ref, period, num);
        ok++;
      }
      this.notify[skip ? 'warn' : 'success']('นำเข้าค่าลงตารางแล้ว', `${ok} ช่อง${skip ? ` · ข้าม ${skip} แถว (ไม่อยู่ในตาราง / ค่าไม่ถูกต้อง)` : ''} — ตรวจแล้วกด "บันทึก"`);
    });
  }
}
