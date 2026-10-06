/**
 * ตัวเลือกของ Dropdown ใน Add Campaign — โหลดครั้งเดียวต่อหน้า (provide ที่ Wizard) แล้ว Cache ไว้
 * (ไม่สร้าง Array ใหม่ทุกรอบ Change detection — PrimeNG Select จะได้ไม่ Render ใหม่ตลอด)
 */
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CampaignApiService } from '../../core/services/campaign-api.service';
import { MasterApiService } from '../../core/services/master-api.service';
import { CustomMasterItem, SyncedRow } from '../../core/models/master.model';
import { CampaignPackageOption } from '../../core/models/campaign.model';
import { Opt, OptionSource } from './campaign-options';

const MASTERS = ['MS-01', 'MS-02', 'MS-03', 'MS-04', 'MS-05', 'MS-06', 'MS-08', 'MS-10', 'MS-11', 'MS-13', 'MS-14', 'MS-15', 'MS-16', 'MS-17', 'MS-18', 'MS-19', 'MS-21'];
const SYNCED = ['CHANNEL', 'PAYMENT_MODE', 'PAYMENT_METHOD', 'GENDER', 'OCCUPATION_CLASS'];

const n = (v: unknown) => Number(v ?? 0);
const money = (v: unknown) => n(v).toLocaleString('en-US');

@Injectable()
export class CampaignLookup {
  private readonly master = inject(MasterApiService);
  private readonly api = inject(CampaignApiService);

  readonly ready = signal(false);
  readonly masters = signal<Record<string, CustomMasterItem[]>>({});
  readonly synced = signal<Record<string, SyncedRow[]>>({});
  readonly packages = signal<CampaignPackageOption[]>([]);
  private cache = new Map<string, Opt[]>();

  load(): void {
    forkJoin({
      // Master อ่านจากแหล่งเดียวกับ Campaign · MS-01 (การ์ดประเภท) ใช้เส้นของ Campaign — รหัสฝั่ง FE + benefit_kind
      masters: forkJoin(Object.fromEntries(MASTERS.map((m) => [m, m === 'MS-01' ? this.api.types() : this.master.customItems(m)]))),
      synced: forkJoin(Object.fromEntries(SYNCED.map((s) => [s, this.master.syncedRows(s)]))),
      packages: this.api.packageOptions(),
    }).subscribe(({ masters, synced, packages }) => {
      this.masters.set(masters as Record<string, CustomMasterItem[]>);
      this.synced.set(synced as Record<string, SyncedRow[]>);
      this.packages.set(packages);
      this.cache.clear();
      this.ready.set(true);
    });
  }

  item(type: string, code: unknown): CustomMasterItem | undefined {
    return this.masters()[type]?.find((i) => i.itemCode === code);
  }

  /** ชื่อแสดงผลของค่า 1 ค่า (หน้าสรุป) */
  label(source: OptionSource | undefined, value: unknown, packageCodes: string[] = []): string {
    if (value === null || value === undefined || value === '') return '–';
    const opts = source ? this.options(source, packageCodes) : [];
    return opts.find((x) => x.value === value)?.label ?? String(value);
  }

  stockLeft(type: 'MS-10' | 'MS-16', code: unknown): number | null {
    const a = this.item(type, code)?.attributes;
    return a ? n(a['total_qty']) - n(a['reserved_qty']) - n(a['delivered_qty']) : null;
  }

  /** ตัวเลือกตามแหล่งข้อมูล — packages / contents ขึ้นกับ Package ที่เลือกในขั้น 2 */
  options(source: OptionSource, packageCodes: string[] = []): Opt[] {
    if (source.list) return source.list;
    const dep = source.packages || source.contents ? packageCodes.join(',') : '';
    const key = `${JSON.stringify(source)}|${dep}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const out = this.build(source, packageCodes);
    if (this.ready()) this.cache.set(key, out);
    return out;
  }

  private build(source: OptionSource, packageCodes: string[]): Opt[] {
    if (source.master) {
      let items = (this.masters()[source.master] ?? []).filter((i) => i.isActive);
      if (source.usage) items = items.filter((i) => i.attributes['usage'] === source.usage || i.attributes['usage'] === 'ทั้งสองแบบ');
      return items.map((i) => ({ value: i.itemCode, label: this.masterLabel(source.master!, i) }));
    }
    if (source.synced) {
      let rows = (this.synced()[source.synced] ?? []).filter((r) => r.dataStatus === 'OK');
      if (source.codes) rows = rows.filter((r) => source.codes!.includes(r.code));
      return rows.map((r) => ({ value: r.code, label: `${r.code} · ${r.nameTh ?? r.nameEn ?? ''}` }));
    }
    if (source.packages) {
      return this.packages().map((p) => ({ value: p.packageCode, label: `${p.packageCode} · ${p.nameTh}` }));
    }
    if (source.contents) {
      return this.packages()
        .filter((p) => packageCodes.includes(p.packageCode))
        .flatMap((p) =>
          p.contents.map((c) => ({
            value: c.contentCode,
            label: `${c.contentCode} · ${p.packageCode} · ${p.channels.find((x) => x.code === c.channelCode)?.name ?? c.channelCode} (${c.template})`,
          })),
        );
    }
    return [];
  }

  private masterLabel(type: string, i: CustomMasterItem): string {
    const a = i.attributes;
    switch (type) {
      case 'MS-10':
        return `${i.itemCode} · ${i.nameTh} · มูลค่า ${money(a['face_value'])} บาท · คงเหลือ ${money(n(a['total_qty']) - n(a['reserved_qty']) - n(a['delivered_qty']))}`;
      case 'MS-16':
        return `${i.itemCode} · ${i.nameTh} · มูลค่า ${money(a['unit_value'])} บาท · คงเหลือ ${money(n(a['total_qty']) - n(a['reserved_qty']) - n(a['delivered_qty']))}`;
      case 'MS-06':
        return `${i.nameTh} (${a['cost_center'] ?? '–'} / GL ${a['gl_account'] ?? '–'})`;
      case 'MS-21':
        return `${i.nameTh} · ${money(a['value'])} บาท`;
      default:
        return i.nameTh;
    }
  }
}
