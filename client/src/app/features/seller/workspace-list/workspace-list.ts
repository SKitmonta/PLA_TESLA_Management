/**
 * P-01 Seller Workspace (Figma 15:1392 · doc 07 BR-PM-001, BR-PM-002)
 * 1 แถว = Package × Channel ที่มี Content Approved · ปุ่ม "จัดกลุ่ม" → Board (P-02)
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { TextField } from '../../../shared/components/form/text-field/text-field';
import { SelectField } from '../../../shared/components/form/select-field/select-field';
import { SellerApiService } from '../../../core/services/seller-api.service';
import { apiError } from '../../../core/services/master-api.service';
import { WorkspaceRow } from '../../../core/models/seller.model';
import { dateTime } from '../seller-shared';

@Component({
  selector: 'app-workspace-list',
  imports: [FormsModule, RouterLink, ButtonModule, TagModule, MessageModule, TextField, SelectField],
  templateUrl: './workspace-list.html',
  styleUrl: './workspace-list.scss',
})
export class WorkspaceList implements OnInit {
  private readonly api = inject(SellerApiService);
  private readonly router = inject(Router);

  readonly rows = signal<WorkspaceRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly search = signal('');
  readonly channel = signal<string | null>(null);
  readonly mode = signal<string | null>(null);

  readonly dateTime = dateTime;
  readonly modes = [
    { value: 'ALL', label: 'ALL — ผู้ขายทุกคนของช่องทาง' },
    { value: 'CUSTOM', label: 'CUSTOM — รายชื่อจาก Package' },
  ];
  readonly channels = computed(() => {
    const seen = new Map<string, string>();
    for (const r of this.rows()) seen.set(r.channelCode, `${r.channelCode} ${r.channelName ?? ''}`.trim());
    return [...seen].map(([value, label]) => ({ value, label }));
  });

  readonly filtered = computed(() => {
    const s = this.search().trim().toLowerCase();
    return this.rows().filter(
      (r) =>
        (!s || r.packageCode.toLowerCase().includes(s) || r.nameTh.toLowerCase().includes(s)) &&
        (!this.channel() || r.channelCode === this.channel()) &&
        (!this.mode() || r.mode === this.mode()),
    );
  });

  ngOnInit(): void {
    this.api.workspaces().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  open(r: WorkspaceRow): void {
    this.router.navigate(['/seller/workspace', r.packageCode, r.channelCode]);
  }
}
