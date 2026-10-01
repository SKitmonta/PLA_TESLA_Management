/**
 * Popup Add Package (doc 05 §2, BR-CT-001…006 — Figma "Content · Add Package (popup)_V2")
 * Channel* → Product Type* → Sub Product Type* → Package* → การ์ดรายละเอียด → Cancel / Reset / Save
 * ตัวเลือกทุกชั้นมาจาก /api/content/add-candidates (เฉพาะ Package APP + Active, มี Template, ยังไม่มี Content)
 */
import { NotifyService } from '../../../../core/services/notify.service';
import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectField } from '../../../../shared/components/form/select-field/select-field';
import { ContentApiService } from '../../../../core/services/content-api.service';
import { apiError } from '../../../../core/services/master-api.service';
import { AddCandidate, ContentRow } from '../../../../core/models/content.model';
import { ThDatePipe } from '../../../../shared/pipes/th-date.pipe';

interface Option {
  code: string;
  name: string | null;
}

/** ค่าไม่ซ้ำ เรียงตามรหัส */
function uniq(list: AddCandidate[], code: (c: AddCandidate) => string | null, name: (c: AddCandidate) => string | null): Option[] {
  const map = new Map<string, Option>();
  for (const c of list) {
    const k = code(c);
    if (k && !map.has(k)) map.set(k, { code: k, name: name(c) });
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function opt(list: Option[]): { value: string; label: string }[] {
  return list.map((o) => ({ value: o.code, label: o.name ?? o.code }));
}

@Component({
  selector: 'app-add-package-dialog',
  imports: [FormsModule, ButtonModule, SelectField, ThDatePipe],
  templateUrl: './add-package-dialog.html',
  styleUrl: './add-package-dialog.scss',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class AddPackageDialog implements OnInit {
  private readonly api = inject(ContentApiService);
  private readonly notify = inject(NotifyService);

  readonly closed = output<void>();
  readonly created = output<ContentRow>();

  readonly candidates = signal<AddCandidate[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly channel = signal('');
  readonly productType = signal('');
  readonly subType = signal('');
  readonly packageCode = signal('');

  // Dropdown ต่อเนื่องกัน — แต่ละชั้นแสดงเฉพาะค่าที่มีอยู่จริงตามค่าที่เลือกก่อนหน้า (BR-CT-002)
  readonly channels = computed(() => uniq(this.candidates(), (c) => c.channelCode, (c) => c.channelName));
  private readonly byChannel = computed(() => this.candidates().filter((c) => c.channelCode === this.channel()));
  readonly productTypes = computed(() => uniq(this.byChannel(), (c) => c.productTypeCode, (c) => c.productTypeName));
  private readonly byProduct = computed(() => this.byChannel().filter((c) => c.productTypeCode === this.productType()));
  readonly subTypes = computed(() => uniq(this.byProduct(), (c) => c.subProductTypeCode, (c) => c.subProductTypeName));
  readonly packages = computed(() => this.byProduct().filter((c) => (c.subProductTypeCode ?? '') === this.subType()));
  readonly selected = computed(() => this.packages().find((c) => c.packageCode === this.packageCode()) ?? null);

  // ตัวเลือก Dropdown (PrimeNG Select) — computed เพื่อไม่สร้าง Array ใหม่ทุกรอบ
  readonly channelOptions = computed(() => opt(this.channels()));
  readonly productTypeOptions = computed(() => opt(this.productTypes()));
  readonly subTypeOptions = computed(() => opt(this.subTypes()));
  readonly packageOptions = computed(() =>
    this.packages().map((p) => ({ value: p.packageCode, label: `${p.packageCode} · ${p.nameEn ?? p.nameTh}` })),
  );

  readonly canSave = computed(() => !!this.selected() && !this.saving());

  ngOnInit(): void {
    this.api.addCandidates().subscribe({
      next: (list) => {
        this.candidates.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  setChannel(v: string): void {
    this.channel.set(v);
    this.setProductType('');
  }

  setProductType(v: string): void {
    this.productType.set(v);
    this.setSubType('');
  }

  setSubType(v: string): void {
    this.subType.set(v);
    this.packageCode.set('');
  }

  reset(): void {
    this.setChannel('');
    this.error.set('');
  }

  save(): void {
    const c = this.selected();
    if (!c) return;
    this.saving.set(true);
    this.error.set('');
    this.api.create(c.packageCode, c.channelCode).subscribe({
      next: (row) => {
        this.saving.set(false);
        this.notify.success('เพิ่ม Package แล้ว', `${row.contentCode} · ${c.packageCode} (Template ${c.template}) — สถานะ Draft`);
        this.created.emit(row);
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.fromError(err, 'เพิ่ม Package ไม่สำเร็จ');
      },
    });
  }
}
