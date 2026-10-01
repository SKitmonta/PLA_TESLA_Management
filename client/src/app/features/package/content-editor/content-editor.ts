/**
 * Content Editor — Figma "Content · Editor OL_OB / OL_PA / AGENT" (Mockup v0.1 — UI จะปรับอีกครั้ง)
 * เปิดหลังกด Save ใน Popup Add Package (BR-CT-004) หรือเมนู ⋮ "แก้ไข Content"
 * แสดง "Template เดียว" ตาม Channel + Product type (FD-12) · รายการ Section ซ้าย (350px) + ฟอร์ม
 * บันทึกร่าง = เก็บ JSON ลง content.content_data · ส่งอนุมัติ = ตรวจ Field บังคับ แล้วเปลี่ยนเป็น Pending
 */
import { AfterViewChecked, Component, OnDestroy, OnInit, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { FORM_LOCK } from '../../../shared/components/form/form-lock';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentApiService } from '../../../core/services/content-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { SessionService } from '../../../core/auth/session.service';
import { ContentDetail, SaveContentPayload } from '../../../core/models/content.model';
import { ContentFormData, NAV, buildForm } from './content-form';
import { sectionDone } from './editor-ol-ob/ol-ob-options';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { EditorOlOb } from './editor-ol-ob/editor-ol-ob';
import { EditorOlPa } from './editor-ol-pa/editor-ol-pa';
import { EditorAgent } from './editor-agent/editor-agent';

const STATUS_TEXT: Record<ContentDetail['status'], string> = {
  DRAFT: 'Draft',
  REJECTED: 'ตีกลับ',
  PENDING: 'รออนุมัติ',
  APPROVED: 'Active',
  INACTIVE: 'Inactive',
};

@Component({
  selector: 'app-content-editor',
  imports: [RouterLink, FormsModule, ButtonModule, SelectModule, FloatLabelModule, TooltipModule, ThDatePipe, EditorOlOb, EditorOlPa, EditorAgent],
  // สถานะล็อกฟอร์ม ส่งให้ช่องกรอก PrimeNG ทุกช่องในหน้านี้ (PrimeNG ไม่อ่าน <fieldset disabled>)
  providers: [{ provide: FORM_LOCK, useFactory: () => signal(false) }],
  templateUrl: './content-editor.html',
  styleUrl: './content-editor.scss',
})
export class ContentEditorPage implements OnInit, AfterViewChecked, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ContentApiService);
  private readonly notify = inject(NotifyService);
  readonly session = inject(SessionService);

  readonly content = signal<ContentDetail | null>(null);
  readonly form = signal<ContentFormData | null>(null);
  readonly error = signal('');
  readonly busy = signal<'' | 'save' | 'submit' | 'version'>('');
  readonly active = signal('');

  readonly nav = computed(() => (this.content() ? NAV[this.content()!.template] : []));
  /** แก้ได้เมื่อ Role มีสิทธิ์สร้าง/แก้ Content และสถานะ Draft / ตีกลับ */
  readonly editable = computed(() => {
    const c = this.content();
    return !!c && this.session.canEdit('package') && (c.status === 'DRAFT' || c.status === 'REJECTED');
  });
  /** ตัวเลือกของ Dropdown "ไปที่ Section" (จอเล็ก) */
  readonly navOptions = computed(() =>
    this.nav().map((n) => ({ id: n.id, label: `${this.showIds() ? n.id + ' · ' : ''}${n.title}${this.done(n.id) ? ' ✓' : ''}` })),
  );
  private readonly lock = inject(FORM_LOCK) as WritableSignal<boolean>;

  constructor() {
    effect(() => this.lock.set(!this.editable()));
  }

  /** OL_OB (Figma V2) ไม่แสดงรหัส Section ใน List content */
  readonly showIds = computed(() => this.content()?.template !== 'OL_OB');
  /** แผน MASTER แรกของ Package (แสดงที่ Header) */
  readonly planCode = computed(() => this.content()?.plans.map((p) => p.planCode).join(', ') ?? '');
  readonly statusText = computed(() => (this.content() ? STATUS_TEXT[this.content()!.status] : ''));

  private scrollHost?: HTMLElement | Window;
  /** ระหว่างกด Step แล้วกำลังเลื่อน — ไม่ให้ onScroll เปลี่ยน Step กลางทาง */
  private jumping = false;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.api.get(code).subscribe({
      next: (c) => this.load(c),
      error: (err) => this.error.set(apiError(err)),
    });
  }

  /** ไฮไลต์รายการ Section ตามตำแหน่งที่เลื่อนอยู่ (ฟังการเลื่อนของกรอบเนื้อหาหลัก) */
  ngAfterViewChecked(): void {
    if (this.scrollHost || !this.form() || !document.querySelector('[data-sec]')) return;
    let host = document.querySelector('.layout')?.parentElement ?? null;
    while (host && !/(auto|scroll)/.test(getComputedStyle(host).overflowY)) host = host.parentElement;
    this.scrollHost = host ?? window;
    this.scrollHost.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    this.scrollHost?.removeEventListener('scroll', this.onScroll);
  }

  private readonly onScroll = (): void => {
    if (this.jumping) return;
    // เส้นอ้างอิง = ขอบบนของกรอบที่เลื่อน + 56px
    const hostTop = this.scrollHost instanceof HTMLElement ? this.scrollHost.getBoundingClientRect().top : 0;
    const barBottom = hostTop + 56;
    let current = '';
    document.querySelectorAll<HTMLElement>('[data-sec]').forEach((el) => {
      if (el.getBoundingClientRect().top <= barBottom + 24) current = el.dataset['sec'] ?? current;
    });
    if (current && current !== this.active()) this.active.set(current);
  };

  private load(c: ContentDetail): void {
    this.content.set(c);
    this.form.set(buildForm(c));
    this.active.set(NAV[c.template][0]?.id ?? '');
  }

  /** ✓ ใน List content — ตอนนี้ใช้กับ OL_OB (Figma V2) */
  done(id: string): boolean {
    const f = this.form();
    return !!f && this.content()?.template === 'OL_OB' && sectionDone(id, f);
  }

  goTo(id: string): void {
    this.active.set(id);
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    this.jumping = true;
    const before = el.getBoundingClientRect().top;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // บาง Browser/หน้าต่างที่ไม่ได้แสดงผลไม่เลื่อนแบบ smooth → เลื่อนทันทีแทน
    setTimeout(() => {
      if (Math.abs(el.getBoundingClientRect().top - before) < 2) el.scrollIntoView({ block: 'start' });
    }, 600);
    setTimeout(() => (this.jumping = false), 900);
  }

  private payload(): SaveContentPayload {
    const f = this.form()!;
    return { data: f, startDate: f.display.startDate || null, endDate: f.display.endDate || null };
  }

  save(): void {
    this.run('save');
  }

  submit(): void {
    this.run('submit');
  }

  /** Content Maker + สถานะ Approved → ออก Version ใหม่ (Draft) เพื่อแก้ไข · Version เดิมยังแสดงผลจนกว่า Version ใหม่อนุมัติ */
  readonly canNewVersion = computed(() => this.content()?.status === 'APPROVED' && this.session.canEdit('package'));

  newVersion(): void {
    const c = this.content();
    if (!c || this.busy()) return;
    this.busy.set('version');
    this.api.newVersion(c.contentCode).subscribe({
      next: (res) => {
        this.busy.set('');
        this.load(res);
        this.notify.success('สร้าง Version ใหม่แล้ว', `${res.contentCode} Version ${res.versionNo} (Draft) · แก้ไขแล้วส่งอนุมัติได้`);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, 'สร้าง Version ใหม่ไม่สำเร็จ');
      },
    });
  }

  private run(kind: 'save' | 'submit'): void {
    const c = this.content();
    if (!c || this.busy()) return;
    this.busy.set(kind);
    const req = kind === 'save' ? this.api.save(c.contentCode, this.payload()) : this.api.submit(c.contentCode, this.payload());
    req.subscribe({
      next: (res) => {
        this.busy.set('');
        this.content.set(res);
        const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        if (kind === 'save') this.notify.success('บันทึกร่างแล้ว', `${c.contentCode} · ${time}`);
        else this.notify.success('ส่งอนุมัติแล้ว', `${c.contentCode} สถานะ "รออนุมัติ" (${time}) · แก้ไขไม่ได้จนกว่าจะอนุมัติหรือตีกลับ`);
      },
      error: (err) => {
        this.busy.set('');
        this.notify.fromError(err, kind === 'save' ? 'บันทึกไม่สำเร็จ' : 'ส่งอนุมัติไม่สำเร็จ');
      },
    });
  }
}
