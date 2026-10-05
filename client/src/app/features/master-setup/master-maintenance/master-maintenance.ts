/**
 * MS-02 Master ที่สร้างเอง — MS-01…MS-22 ของ Campaign (doc 06 §5.1)
 * ตาราง + ฟอร์มสร้างจากแคตตาล็อกที่ Server (server/src/services/custom-master.catalog.ts)
 * เพิ่ม / แก้ไข / ปิดใช้งาน ได้เฉพาะ System Admin · ไม่มีการลบ (ใช้ปิดใช้งานแทน เพื่อเก็บประวัติ)
 */
import { NotifyService } from '../../../core/services/notify.service';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { NumberField } from '../../../shared/components/form/number-field/number-field';
import { DateField } from '../../../shared/components/form/date-field/date-field';
import { TextareaField } from '../../../shared/components/form/textarea-field/textarea-field';
import { MasterApiService, apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { CustomMasterItem, CustomMasterType, MasterField } from '../../../core/models/master.model';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';

interface FormModel {
  itemCode: string;
  nameTh: string;
  nameEn: string;
  isActive: boolean;
  attributes: Record<string, unknown>;
}

@Component({
  selector: 'app-master-maintenance',
  imports: [FormsModule, DecimalPipe, ButtonModule, CheckboxModule, FloatLabelModule, SelectModule, ToggleSwitchModule, TextField, SelectField, NumberField, DateField, TextareaField, StatusBadge, ThDatePipe],
  templateUrl: './master-maintenance.html',
  styleUrl: './master-maintenance.scss',
})
export class MasterMaintenance implements OnInit {
  private readonly api = inject(MasterApiService);
  private readonly notify = inject(NotifyService);
  private readonly session = inject(SessionService);

  readonly roleCanEdit = computed(() => this.session.canEdit('master'));
  /** Master แบบอ่านอย่างเดียว (Tesla API: MS-01 อ่านจาก M_CAMPAIGN_TYPE) → แก้ไม่ได้แม้เป็น System Admin */
  readonly canEdit = computed(() => this.roleCanEdit() && !this.current()?.readOnly);

  readonly types = signal<CustomMasterType[]>([]);
  readonly current = signal<CustomMasterType | null>(null);
  readonly items = signal<CustomMasterItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly search = signal('');
  readonly statusFilter = signal<'' | 'active' | 'inactive'>('');

  /** null = ไม่ได้เปิดฟอร์ม · mode new / edit */
  readonly mode = signal<'new' | 'edit' | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  form: FormModel = this.emptyForm();

  readonly groups = computed(() => {
    const map = new Map<string, CustomMasterType[]>();
    for (const t of this.types()) map.set(t.group, [...(map.get(t.group) ?? []), t]);
    return [...map.entries()].map(([name, list]) => ({ name, list }));
  });

  /** Dropdown เลือก Master บนจอเล็ก (จัดกลุ่ม) */
  readonly groupOptions = computed(() =>
    this.groups().map((g) => ({ label: g.name, items: g.list.map((t) => ({ label: `${t.code} · ${t.name}`, value: t.code })) })),
  );
  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  readonly tableFields = computed(() => this.current()?.fields.filter((f) => f.table) ?? []);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const st = this.statusFilter();
    return this.items().filter(
      (i) =>
        (!q || i.itemCode.toLowerCase().includes(q) || i.nameTh.toLowerCase().includes(q) || (i.nameEn ?? '').toLowerCase().includes(q)) &&
        (!st || (st === 'active') === i.isActive),
    );
  });

  ngOnInit(): void {
    this.api.customTypes().subscribe({
      next: (types) => {
        this.types.set(types);
        const first = types.find((t) => t.code === 'MS-10') ?? types[0];
        if (first) this.select(first);
      },
      error: (err) => this.error.set(apiError(err)),
    });
  }

  select(type: CustomMasterType): void {
    this.current.set(type);
    this.closeForm();
    this.search.set('');
    this.statusFilter.set('');
    this.loadItems();
  }

  selectByCode(code: string): void {
    const t = this.types().find((x) => x.code === code);
    if (t) this.select(t);
  }

  loadItems(): void {
    const type = this.current();
    if (!type) return;
    this.loading.set(true);
    this.error.set('');
    this.api.customItems(type.code).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  startNew(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.mode.set('new');
  }

  startEdit(item: CustomMasterItem): void {
    this.form = {
      itemCode: item.itemCode,
      nameTh: item.nameTh,
      nameEn: item.nameEn ?? '',
      isActive: item.isActive,
      attributes: { ...item.attributes },
    };
    this.formError.set('');
    this.mode.set('edit');
  }

  closeForm(): void {
    this.mode.set(null);
    this.formError.set('');
  }

  save(): void {
    const type = this.current();
    if (!type) return;
    const payload: Partial<CustomMasterItem> = {
      itemCode: this.form.itemCode.trim().toUpperCase(),
      nameTh: this.form.nameTh,
      nameEn: this.form.nameEn || null,
      isActive: this.form.isActive,
      attributes: this.cleanAttributes(type.fields),
    };
    this.saving.set(true);
    this.formError.set('');
    const req =
      this.mode() === 'new'
        ? this.api.createCustomItem(type.code, payload)
        : this.api.updateCustomItem(type.code, this.form.itemCode, payload);
    const isNew = this.mode() === 'new';
    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.notify.success('บันทึกแล้ว', `${saved.itemCode} · ${saved.nameTh}`);
        this.closeForm();
        this.loadItems();
        if (isNew) {
          this.types.update((list) => list.map((t) => (t.code === type.code ? { ...t, count: t.count + 1 } : t)));
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.fromError(err, 'บันทึกไม่สำเร็จ');
      },
    });
  }

  /** คงเหลือ = ทั้งหมด − จองแล้ว − ส่งแล้ว (Stock rule doc 06 §5) */
  remaining(item: CustomMasterItem): number {
    const a = item.attributes;
    return Number(a['total_qty'] ?? 0) - Number(a['reserved_qty'] ?? 0) - Number(a['delivered_qty'] ?? 0);
  }

  display(item: CustomMasterItem, f: MasterField): string {
    const v = item.attributes[f.key];
    if (v === undefined || v === null || v === '') return '–';
    if (f.type === 'boolean') return v ? 'ใช่' : 'ไม่ใช่';
    if (f.type === 'number') return Number(v).toLocaleString('en-US');
    if (f.type === 'date') return new ThDatePipe().transform(String(v));
    return String(v);
  }

  private cleanAttributes(fields: MasterField[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = this.form.attributes[f.key];
      if (v === undefined || v === null || v === '') continue;
      out[f.key] = f.type === 'number' ? Number(v) : v;
    }
    return out;
  }

  private emptyForm(): FormModel {
    return { itemCode: '', nameTh: '', nameEn: '', isActive: true, attributes: {} };
  }
}
