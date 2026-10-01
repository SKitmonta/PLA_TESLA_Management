/**
 * P-02 Board จัดกลุ่มผู้ขาย (Figma 15:1621 · doc 07 BR-PM-003…005, BR-PM-010)
 *   ซ้าย: "ยังไม่มีกลุ่ม" — ค้นหา / กรองสาขา ระดับ สถานะ / เลือกหลายคน / เลือกทั้งหมดที่กรอง
 *   ขวา: การ์ดกลุ่ม — ลากผู้ขาย (PrimeNG pDraggable / pDroppable) เข้า / ออก / ย้ายกลุ่ม
 *   1 คนอยู่ได้ 1 กลุ่มต่อ Workspace (ลาก = ย้าย) · ไม่พร้อมขาย = สีเทา ลากเข้ากลุ่มไม่ได้
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DragDropModule } from 'primeng/dragdrop';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { TextareaField } from '../../../shared/components/form/textarea-field/textarea-field';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { Board, BoardGroup, MoveResult, Seller } from '../../../core/models/seller.model';
import { GROUP_COLORS, STATUS_LABEL, TYPE_LABEL, downloadCsv, monthYear, readiness } from '../seller-shared';

const PREVIEW = 4;

@Component({
  selector: 'app-seller-board',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    DragDropModule,
    MessageModule,
    TagModule,
    TooltipModule,
    TextField,
    SelectField,
    TextareaField,
  ],
  templateUrl: './seller-board.html',
  styleUrl: './seller-board.scss',
})
export class SellerBoard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SellerApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  readonly pkg = this.route.snapshot.paramMap.get('pkg') ?? '';
  readonly ch = this.route.snapshot.paramMap.get('ch') ?? '';

  readonly board = signal<Board | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly canEdit = computed(() => this.session.canEdit('seller'));

  // ---------------------------------------------------------------- ตัวกรองฝั่ง "ยังไม่มีกลุ่ม"
  readonly search = signal('');
  readonly branch = signal<string | null>(null);
  readonly level = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly selected = signal<Set<string>>(new Set());
  readonly target = signal<number | null>(null);

  readonly statusOptions = [
    { value: 'READY', label: 'พร้อมขาย' },
    { value: 'WARN', label: 'ใบอนุญาตหมดใน 30 วัน' },
    { value: 'NOT_READY', label: 'ไม่พร้อมขาย' },
  ];

  readonly ungrouped = computed(() => (this.board()?.sellers ?? []).filter((s) => s.groupId === null));
  readonly branches = computed(() => this.opts(this.ungrouped().map((s) => s.branch)));
  readonly levels = computed(() => this.opts(this.ungrouped().map((s) => s.level)));

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.ungrouped().filter((s) => {
      if (q && !s.sellerCode.includes(q) && !s.sellerName.toLowerCase().includes(q)) return false;
      if (this.branch() && s.branch !== this.branch()) return false;
      if (this.level() && s.level !== this.level()) return false;
      const st = this.status();
      if (st === 'READY' && !s.ready) return false;
      if (st === 'WARN' && !s.licenseWarning) return false;
      if (st === 'NOT_READY' && s.ready) return false;
      return true;
    });
  });

  /** ผู้ขายที่เลือกได้ (พร้อมขาย) ในรายการที่กรองอยู่ */
  readonly selectable = computed(() => this.filtered().filter((s) => s.ready));
  readonly allSelected = computed(() => {
    const list = this.selectable();
    return list.length > 0 && list.every((s) => this.selected().has(s.sellerCode));
  });

  readonly groupOptions = computed(() => (this.board()?.groups ?? []).map((g) => ({ value: g.groupId, label: `${g.groupName} (${g.memberCount} คน)` })));

  /** สมาชิกของแต่ละกลุ่ม (แสดงตัวอย่าง 4 คนบนการ์ด) */
  readonly membersOf = computed(() => {
    const map = new Map<number, Seller[]>();
    for (const s of this.board()?.sellers ?? []) {
      if (s.groupId === null) continue;
      if (!map.has(s.groupId)) map.set(s.groupId, []);
      map.get(s.groupId)!.push(s);
    }
    return map;
  });

  readonly preview = PREVIEW;
  readonly readiness = readiness;
  readonly monthYear = monthYear;
  readonly typeLabel = TYPE_LABEL;

  // ---------------------------------------------------------------- Drag & Drop
  /** รหัสผู้ขายที่กำลังลาก + กลุ่มต้นทาง (null = ยังไม่มีกลุ่ม) */
  private dragging: { codes: string[]; from: number | null } | null = null;
  readonly dropHover = signal<number | 'none' | null>(null);

  // ---------------------------------------------------------------- สร้างกลุ่ม
  readonly dialogOpen = signal(false);
  readonly colors = GROUP_COLORS;
  newGroup = { groupName: '', description: '', color: GROUP_COLORS[0] };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.board(this.pkg, this.ch).subscribe({
      next: (b) => this.board.set(b),
      error: (err) => this.error.set(apiError(err)),
    });
  }

  private opts(values: (string | null)[]): { value: string; label: string }[] {
    return [...new Set(values.filter((v): v is string => !!v))].sort().map((v) => ({ value: v, label: v }));
  }

  subline(s: Seller): string {
    const parts = [this.typeLabel[s.sellerType], s.branch ?? ''];
    if (s.sellerType === 'AGENT' && s.licenseExpiry && s.ready) parts.push(`ใบอนุญาตหมด ${monthYear(s.licenseExpiry)}`);
    return parts.filter(Boolean).join(' · ');
  }

  isSelected(code: string): boolean {
    return this.selected().has(code);
  }

  toggle(s: Seller, on: boolean): void {
    if (!s.ready || !this.canEdit()) return;
    const next = new Set(this.selected());
    if (on) next.add(s.sellerCode);
    else next.delete(s.sellerCode);
    this.selected.set(next);
  }

  /** เลือกทั้งหมดที่กรอง (เฉพาะคนที่พร้อมขาย) */
  toggleAll(on: boolean): void {
    const next = new Set(this.selected());
    for (const s of this.selectable()) {
      if (on) next.add(s.sellerCode);
      else next.delete(s.sellerCode);
    }
    this.selected.set(next);
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  dragStart(s: Seller, from: number | null): void {
    // ลากคนที่เลือกไว้ = ลากทุกคนที่เลือก · ลากคนอื่น = ลากคนเดียว
    const codes = from === null && this.selected().has(s.sellerCode) ? [...this.selected()] : [s.sellerCode];
    this.dragging = { codes, from };
  }

  dragEnd(): void {
    this.dragging = null;
    this.dropHover.set(null);
  }

  drop(groupId: number | null): void {
    const d = this.dragging;
    this.dragEnd();
    if (!d || d.from === groupId) return;
    this.move(d.codes, groupId);
  }

  moveSelected(): void {
    const t = this.target();
    if (t === null || !this.selected().size) return;
    this.move([...this.selected()], t);
  }

  /** วาง "คนที่เลือก" ลงการ์ดกลุ่มด้วยการคลิก (ใช้แทนการลากบนจอสัมผัส) */
  dropSelectedOn(g: BoardGroup): void {
    if (!this.selected().size) return;
    this.move([...this.selected()], g.groupId);
  }

  private move(codes: string[], groupId: number | null): void {
    if (!this.canEdit() || this.busy()) return;
    this.busy.set(true);
    this.api.move(this.pkg, this.ch, codes, groupId).subscribe({
      next: (res: MoveResult) => {
        this.busy.set(false);
        this.board.set(res.board);
        this.selected.set(new Set([...this.selected()].filter((c) => !codes.includes(c))));
        const name = groupId === null ? '"ยังไม่มีกลุ่ม"' : `กลุ่ม "${res.board.groups.find((g) => g.groupId === groupId)?.groupName ?? ''}"`;
        if (res.moved) this.notify.success(`ย้าย ${res.moved} คนไป${name}แล้ว`);
        if (res.skipped.length)
          this.notify.warn(`ข้าม ${res.skipped.length} คน`, res.skipped.map((s) => `${s.sellerCode}: ${s.reason}`).join(' · '));
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.fromError(err, 'ย้ายผู้ขายไม่สำเร็จ');
      },
    });
  }

  // ---------------------------------------------------------------- กลุ่ม
  openCreate(): void {
    this.newGroup = { groupName: '', description: '', color: GROUP_COLORS[(this.board()?.groups.length ?? 0) % GROUP_COLORS.length] };
    this.dialogOpen.set(true);
  }

  createGroup(): void {
    if (!this.newGroup.groupName.trim()) {
      this.notify.warn('กรุณากรอกชื่อกลุ่ม');
      return;
    }
    this.busy.set(true);
    this.api.createGroup(this.pkg, this.ch, { ...this.newGroup, description: this.newGroup.description || null }).subscribe({
      next: (g) => {
        this.busy.set(false);
        this.dialogOpen.set(false);
        this.notify.success('สร้างกลุ่มแล้ว', g.groupName);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.fromError(err, 'สร้างกลุ่มไม่สำเร็จ');
      },
    });
  }

  openGroup(g: BoardGroup): void {
    this.router.navigate(['/seller/group', g.groupId]);
  }

  /** Export (BR-PM-010) — ไฟล์ CSV เปิดด้วย Excel: Workspace, กลุ่ม, SL-01…SL-09, Campaign ที่ผูก */
  exportExcel(): void {
    const b = this.board();
    if (!b) return;
    const groups = new Map(b.groups.map((g) => [g.groupId, g]));
    const rows: (string | number | null)[][] = [
      ['Workspace', 'กลุ่ม', 'รหัสผู้ขาย', 'ชื่อ-นามสกุล', 'ประเภท', 'สาขา', 'ทีม', 'ระดับ', 'เลขที่ใบอนุญาต', 'วันหมดอายุใบอนุญาต', 'สถานะ', 'พร้อมขาย', 'Campaign ที่ผูก'],
    ];
    for (const s of b.sellers) {
      const g = s.groupId === null ? undefined : groups.get(s.groupId);
      rows.push([
        `${b.workspace.packageCode} × ${b.workspace.channelCode}`,
        g?.groupName ?? 'ยังไม่มีกลุ่ม',
        s.sellerCode,
        s.sellerName,
        TYPE_LABEL[s.sellerType],
        s.branch,
        s.team,
        s.level,
        s.licenseNo,
        s.licenseExpiry,
        STATUS_LABEL[s.status],
        readiness(s).text,
        g?.campaigns.map((c) => c.campaignCode).join(' | ') ?? '',
      ]);
    }
    downloadCsv(`seller-groups-${b.workspace.packageCode}-${b.workspace.channelCode}.csv`, rows);
    this.notify.success('Export แล้ว', `${b.sellers.length} รายชื่อ`);
  }

  importExcel(): void {
    this.router.navigate(['/seller/tools'], { queryParams: { pkg: this.pkg, ch: this.ch }, fragment: 'import' });
  }
}
