/**
 * P-05 เครื่องมือจัดกลุ่ม (Figma 17:733 · doc 07 PM-04, BR-PM-008, BR-PM-009, BR-PM-011)
 *   1) คัดลอกกลุ่มจาก Workspace อื่น — ปลายทางต้องยังไม่มีกลุ่ม · ไม่คัดลอก Campaign · ตรวจก่อนคัดลอก
 *   2) Import รายชื่อเข้ากลุ่ม — ไฟล์ .csv (เปิด / บันทึกจาก Excel ได้) คอลัมน์ seller_Code, group_Name · ตรวจก่อนบันทึก
 *   3) Audit log — ค้นหาตามผู้ขาย / กลุ่ม / ช่วงวัน · แก้ไขหรือลบไม่ได้
 * ลิงก์เข้าหน้านี้: ?pkg&ch (Import ของ Workspace) · ?toPkg&toCh (คัดลอกเข้า Workspace) · #audit / #import
 */
import { AfterViewInit, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { DateField } from '../../../shared/components/form/date-field/date-field';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { SessionService } from '../../../core/auth/session.service';
import { AuditEntry, CopyPlanGroup, ImportResult, WorkspaceRow } from '../../../core/models/seller.model';
import { ACTION_LABEL, SOURCE_LABEL, dateTime, downloadCsv, parseCsv } from '../seller-shared';

const MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-seller-tools',
  imports: [FormsModule, RouterLink, ButtonModule, FileUploadModule, MessageModule, TagModule, TooltipModule, TextField, SelectField, DateField],
  templateUrl: './seller-tools.html',
  styleUrl: './seller-tools.scss',
})
export class SellerTools implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SellerApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  readonly canEdit = computed(() => this.session.canEdit('seller'));
  readonly workspaces = signal<WorkspaceRow[]>([]);
  readonly busy = signal<'' | 'copy-preview' | 'copy' | 'import-check' | 'import'>('');

  readonly actionLabel = ACTION_LABEL;
  readonly sourceLabel = SOURCE_LABEL;
  readonly dateTime = dateTime;

  private key = (w: WorkspaceRow) => `${w.packageCode}|${w.channelCode}`;
  private split = (k: string | null) => (k ? (k.split('|') as [string, string]) : null);

  readonly allOptions = computed(() =>
    this.workspaces().map((w) => ({ value: this.key(w), label: `${w.packageCode} × ${w.channelCode} (${w.groupCount ? w.groupCount + ' กลุ่ม' : 'ยังไม่มีกลุ่ม'})` })),
  );
  readonly sourceOptions = computed(() => this.allOptions().filter((o) => this.workspaces().find((w) => this.key(w) === o.value)!.groupCount > 0));
  readonly targetOptions = computed(() => this.allOptions().filter((o) => this.workspaces().find((w) => this.key(w) === o.value)!.groupCount === 0));

  // ---------------------------------------------------------------- 1) คัดลอกกลุ่ม
  readonly copyFrom = signal<string | null>(null);
  readonly copyTo = signal<string | null>(null);
  readonly copyPlan = signal<CopyPlanGroup[] | null>(null);

  // ---------------------------------------------------------------- 2) Import
  readonly importWs = signal<string | null>(null);
  readonly fileName = signal('');
  private importRows: { sellerCode: string; groupName: string }[] = [];
  readonly importResult = signal<ImportResult | null>(null);

  // ---------------------------------------------------------------- 3) Audit log
  readonly auditWs = signal<string | null>(null);
  readonly auditQ = signal('');
  readonly auditFrom = signal('');
  readonly auditTo = signal('');
  readonly logs = signal<AuditEntry[]>([]);
  private auditTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('pkg') && q.get('ch')) {
      this.importWs.set(`${q.get('pkg')}|${q.get('ch')}`);
      this.auditWs.set(`${q.get('pkg')}|${q.get('ch')}`);
    }
    if (q.get('toPkg') && q.get('toCh')) this.copyTo.set(`${q.get('toPkg')}|${q.get('toCh')}`);
    this.loadWorkspaces();
    this.loadAudit();
  }

  ngAfterViewInit(): void {
    const frag = this.route.snapshot.fragment;
    if (frag) setTimeout(() => document.getElementById(frag)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 300);
  }

  private loadWorkspaces(): void {
    this.api.workspaces().subscribe({ next: (w) => this.workspaces.set(w), error: (err) => this.notify.fromError(err, 'โหลด Workspace ไม่สำเร็จ') });
  }

  // ---------------------------------------------------------------- คัดลอก
  setCopy(which: 'from' | 'to', v: string | null): void {
    (which === 'from' ? this.copyFrom : this.copyTo).set(v);
    this.copyPlan.set(null);
    if (this.copyFrom() && this.copyTo()) this.runCopy(true);
  }

  runCopy(preview: boolean): void {
    const from = this.split(this.copyFrom());
    const to = this.split(this.copyTo());
    if (!from || !to) return;
    this.busy.set(preview ? 'copy-preview' : 'copy');
    this.api.copy({ fromPackage: from[0], fromChannel: from[1], toPackage: to[0], toChannel: to[1], preview }).subscribe({
      next: (r) => {
        this.busy.set('');
        this.copyPlan.set(r.groups);
        if (!preview) {
          const n = r.groups.reduce((a, g) => a + g.copyCount, 0);
          this.notify.success('คัดลอกกลุ่มแล้ว', `${r.groups.length} กลุ่ม · ${n} คน → ${to[0]} × ${to[1]} (ต้องผูก Campaign ใหม่)`);
          this.copyFrom.set(null);
          this.copyTo.set(null);
          this.copyPlan.set(null);
          this.loadWorkspaces();
          this.loadAudit();
        }
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'คัดลอกกลุ่มไม่สำเร็จ');
      },
    });
  }

  // ---------------------------------------------------------------- Import
  downloadTemplate(): void {
    downloadCsv('seller-group-import-template.csv', [
      ['seller_Code', 'group_Name'],
      ['90000131', 'ทีมกรุงเทพ'],
      ['90000132', 'ทีมใหม่'],
    ]);
  }

  onFile(event: { files: File[] }, uploader?: { clear: () => void }): void {
    const file = event.files?.[0];
    uploader?.clear();
    this.importResult.set(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      this.notify.warn('รองรับไฟล์ .csv', 'ใน Excel เลือก บันทึกเป็น → CSV UTF-8 (.csv)');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.notify.warn('ไฟล์ใหญ่เกิน 5 MB');
      return;
    }
    file.text().then((text) => {
      const rows = parseCsv(text);
      const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
      const ci = head.indexOf('seller_code');
      const gi = head.indexOf('group_name');
      if (ci < 0 || gi < 0) {
        this.notify.warn('หัวคอลัมน์ไม่ถูกต้อง', 'ต้องมีคอลัมน์ seller_Code และ group_Name (ดาวน์โหลด Template)');
        return;
      }
      this.importRows = rows.slice(1).map((r) => ({ sellerCode: (r[ci] ?? '').trim(), groupName: (r[gi] ?? '').trim() }));
      this.fileName.set(file.name);
      this.runImport(false);
    });
  }

  runImport(commit: boolean): void {
    const ws = this.split(this.importWs());
    if (!ws) {
      this.notify.warn('เลือก Workspace ก่อน Import');
      return;
    }
    if (!this.importRows.length) return;
    this.busy.set(commit ? 'import' : 'import-check');
    this.api.importRows(ws[0], ws[1], this.importRows, commit).subscribe({
      next: (r) => {
        this.busy.set('');
        this.importResult.set(r);
        if (commit) {
          this.notify.success('Import แล้ว', `บันทึก ${r.passed} แถว · ไม่ผ่าน ${r.failed} แถว`);
          this.cancelImport();
          this.loadWorkspaces();
          this.loadAudit();
        }
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'Import ไม่สำเร็จ');
      },
    });
  }

  setImportWs(v: string | null): void {
    this.importWs.set(v);
    if (this.importRows.length) this.runImport(false);
  }

  cancelImport(): void {
    this.importRows = [];
    this.fileName.set('');
    this.importResult.set(null);
  }

  // ---------------------------------------------------------------- Audit
  loadAudit(): void {
    const ws = this.split(this.auditWs());
    this.api
      .audit({ pkg: ws?.[0], ch: ws?.[1], q: this.auditQ().trim(), from: this.auditFrom() || undefined, to: this.auditTo() || undefined })
      .subscribe({ next: (l) => this.logs.set(l), error: (err) => this.notify.fromError(err, 'โหลด Audit log ไม่สำเร็จ') });
  }

  setAudit(patch: { ws?: string | null; q?: string; from?: string; to?: string }): void {
    if ('ws' in patch) this.auditWs.set(patch.ws ?? null);
    if (patch.q !== undefined) this.auditQ.set(patch.q);
    if (patch.from !== undefined) this.auditFrom.set(patch.from);
    if (patch.to !== undefined) this.auditTo.set(patch.to);
    clearTimeout(this.auditTimer);
    this.auditTimer = setTimeout(() => this.loadAudit(), patch.q !== undefined ? 300 : 0);
  }

  exportAudit(): void {
    downloadCsv('seller-audit-log.csv', [
      ['วันเวลา', 'การกระทำ', 'Workspace', 'กลุ่ม', 'ผู้ขาย', 'Campaign', 'รายละเอียด', 'ผู้ทำ', 'ที่มา'],
      ...this.logs().map((l) => [
        l.createdAt,
        ACTION_LABEL[l.action] ?? l.action,
        `${l.packageCode} × ${l.channelCode}`,
        l.groupName,
        l.sellerCode,
        l.campaignCode,
        l.detail,
        l.actorName,
        SOURCE_LABEL[l.source] ?? l.source,
      ]),
    ]);
    this.notify.success('Export แล้ว', `${this.logs().length} รายการ`);
  }
}
