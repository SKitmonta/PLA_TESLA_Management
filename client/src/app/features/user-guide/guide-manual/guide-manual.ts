/**
 * User guide › คู่มือการใช้งาน — ขั้นตอน 1 2 3 … แต่ละขั้นมีรูปหน้าจอจริง (กดเพื่อขยาย) + คำอธิบาย + ข้อควรรู้
 * เลือกบทจากสารบัญด้านซ้าย (จอเล็ก = Dropdown) · ลิงก์ตรงเข้าบท: /guide/manual?ch=<id>
 * เนื้อหาอยู่ที่ guide-content.ts
 */
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { SessionService } from '../../../core/auth/session.service';
import { ROLE_LABEL } from '../../../core/models/user.model';
import { GUIDE, GuideChapter } from '../guide-content';

@Component({
  selector: 'app-guide-manual',
  imports: [FormsModule, RouterLink, ButtonModule, ImageModule, MessageModule, TagModule, SelectField],
  templateUrl: './guide-manual.html',
  styleUrl: './guide-manual.scss',
})
export class GuideManual {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);

  readonly chapters = GUIDE;
  readonly roleLabel = ROLE_LABEL;
  readonly current = signal<string>(this.route.snapshot.queryParamMap.get('ch') ?? GUIDE[0].id);
  readonly chapter = computed<GuideChapter>(() => GUIDE.find((c) => c.id === this.current()) ?? GUIDE[0]);
  readonly index = computed(() => GUIDE.findIndex((c) => c.id === this.chapter().id));
  readonly prev = computed(() => GUIDE[this.index() - 1]);
  readonly next = computed(() => GUIDE[this.index() + 1]);
  readonly options = GUIDE.map((c) => ({ value: c.id, label: `บทที่ ${c.no} · ${c.title}` }));
  readonly missing = signal<Set<string>>(new Set());

  /** บทนี้ตรงกับ Role ที่ใช้อยู่ไหม */
  readonly forMe = computed(() => this.session.role() === 'SYS_ADMIN' || this.chapter().roles.includes(this.session.role()));

  go(id: string | null): void {
    if (!id) return;
    this.current.set(id);
    this.router.navigate([], { queryParams: { ch: id }, replaceUrl: true });
    document.querySelector('.guide-top')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  img(name: string): string {
    return `assets/guide/${name}`;
  }

  onMissing(name: string): void {
    const s = new Set(this.missing());
    s.add(name);
    this.missing.set(s);
  }
}
