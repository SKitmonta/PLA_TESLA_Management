/**
 * P-04 Referral links ของ 1 Campaign (Figma 17:496 · CC-10 · BR-CP-008–009)
 *   สรุป: ลิงก์ที่ใช้งาน / คลิก / ใบคำขอ / กรมธรรม์อนุมัติ · ตารางลิงก์รายผู้ขาย (คัดลอก / QR) · Export
 *   ผู้ขายไม่พร้อมขาย → ลิงก์ "หยุดนับ" (PM-02) · นับผลแบบ Last click ภายใน N วันหลังคลิก
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { NotifyService } from '../../../core/services/notify.service';
import { apiError } from '../../../core/services/master-api.service';
import { ReferralDetail, ReferralLink } from '../../../core/models/seller.model';
import { downloadCsv } from '../seller-shared';

const STATUS: Record<ReferralDetail['displayStatus'], [string, 'success' | 'info' | 'secondary']> = {
  ACTIVE: ['Active', 'success'],
  SCHEDULED: ['Scheduled', 'info'],
  EXPIRED: ['Expired', 'secondary'],
};

@Component({
  selector: 'app-referral-detail',
  imports: [DecimalPipe, FormsModule, RouterLink, ButtonModule, DialogModule, MessageModule, TagModule, TooltipModule, TextField, SelectField, ThDatePipe],
  templateUrl: './referral-detail.html',
  styleUrl: './referral-detail.scss',
})
export class ReferralDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SellerApiService);
  private readonly notify = inject(NotifyService);

  readonly data = signal<ReferralDetail | null>(null);
  readonly error = signal('');
  readonly search = signal('');
  readonly groupFilter = signal<number | null>(null);
  readonly qr = signal<ReferralLink | null>(null);

  readonly status = computed(() => STATUS[this.data()?.displayStatus ?? 'ACTIVE']);
  readonly groups = computed(() => {
    const seen = new Map<number, string>();
    for (const l of this.data()?.links ?? []) seen.set(l.groupId, l.groupName);
    return [...seen].map(([value, label]) => ({ value, label }));
  });
  readonly links = computed(() => {
    const q = this.search().trim().toLowerCase();
    return (this.data()?.links ?? []).filter(
      (l) => (!q || l.sellerCode.includes(q) || l.sellerName.toLowerCase().includes(q)) && (this.groupFilter() === null || l.groupId === this.groupFilter()),
    );
  });

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.api.referral(code).subscribe({
      next: (d) => this.data.set(d),
      error: (err) => this.error.set(apiError(err)),
    });
  }

  pct(a: number, b: number): string {
    return b ? `${((a / b) * 100).toFixed(1)}%` : '–';
  }

  /** …/r/7Kq2•••• (แสดงแบบย่อในตาราง) */
  short(url: string): string {
    const token = url.split('/').pop() ?? '';
    return `…/r/${token.slice(0, 4)}••••`;
  }

  copy(l: ReferralLink): void {
    const done = () => this.notify.success('คัดลอกลิงก์แล้ว', `${l.sellerCode} · ${l.sellerName}`);
    if (navigator.clipboard) navigator.clipboard.writeText(l.url).then(done, () => this.notify.warn('คัดลอกไม่ได้', l.url));
    else this.notify.info('ลิงก์ของผู้ขาย', l.url);
  }

  exportExcel(): void {
    const d = this.data();
    if (!d) return;
    downloadCsv(`referral-${d.campaignCode}.csv`, [
      ['Campaign', 'รหัสผู้ขาย', 'ชื่อ', 'กลุ่ม', 'ลิงก์', 'คลิก', 'ใบคำขอ', 'อนุมัติ', 'สถานะ'],
      ...this.links().map((l) => [d.campaignCode, l.sellerCode, l.sellerName, l.groupName, l.url, l.clicks, l.applications, l.approved, l.active ? 'Active' : `หยุดนับ · ${l.reason ?? 'ไม่พร้อมขาย'}`]),
    ]);
    this.notify.success('Export แล้ว', `${this.links().length} ลิงก์`);
  }
}
