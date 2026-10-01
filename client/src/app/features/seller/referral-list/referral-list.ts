/**
 * P-04 Referral links — รายการ Campaign ประเภท Referral ที่ Approved (CC-10 · BR-CP-008–009)
 * กดแถว → ลิงก์รายผู้ขายของ Campaign นั้น (/seller/referral/:code)
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ThDatePipe } from '../../../shared/pipes/th-date.pipe';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { apiError } from '../../../core/services/master-api.service';
import { ReferralRow } from '../../../core/models/seller.model';

@Component({
  selector: 'app-referral-list',
  imports: [DecimalPipe, RouterLink, ButtonModule, MessageModule, ThDatePipe],
  templateUrl: './referral-list.html',
  styleUrl: './referral-list.scss',
})
export class ReferralList implements OnInit {
  private readonly api = inject(SellerApiService);
  private readonly router = inject(Router);

  readonly rows = signal<ReferralRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.referrals().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  pct(a: number, b: number): string {
    return b ? `${((a / b) * 100).toFixed(1)}%` : '–';
  }

  open(r: ReferralRow): void {
    this.router.navigate(['/seller/referral', r.campaignCode]);
  }
}
