/**
 * เรียก API /api/campaign — เมนู Campaign › Campaign list / Add Campaign
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApprovalLog,
  CampaignGrantSummary,
  CampaignOverlap,
  CampaignDetail,
  CampaignListQuery,
  CampaignListResponse,
  CampaignPackageOption,
  SaveCampaignPayload,
} from '../models/campaign.model';

@Injectable({ providedIn: 'root' })
export class CampaignApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/campaign';

  list(query: CampaignListQuery): Observable<CampaignListResponse> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<CampaignListResponse>(this.base, { params });
  }

  packageOptions(): Observable<CampaignPackageOption[]> {
    return this.http.get<CampaignPackageOption[]>(`${this.base}/package-options`);
  }

  get(code: string): Observable<CampaignDetail> {
    return this.http.get<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}`);
  }

  /** บันทึกร่างครั้งแรก — ได้ Campaign Code */
  create(payload: SaveCampaignPayload): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(this.base, payload);
  }

  save(code: string, payload: SaveCampaignPayload): Observable<CampaignDetail> {
    return this.http.put<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}`, payload);
  }

  /** ส่งอนุมัติ (บันทึก + ตรวจ Field บังคับ + ช่วงวันทับซ้อน → Pending) */
  submit(code: string, payload: SaveCampaignPayload): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}/submit`, payload);
  }

  overlap(q: { type: string; packages: string[]; start: string; end: string | null; exclude?: string }): Observable<CampaignOverlap[]> {
    let params = new HttpParams().set('type', q.type).set('packages', q.packages.join(',')).set('start', q.start);
    if (q.end) params = params.set('end', q.end);
    if (q.exclude) params = params.set('exclude', q.exclude);
    return this.http.get<CampaignOverlap[]>(`${this.base}/overlap`, { params });
  }

  grants(code: string): Observable<CampaignGrantSummary> {
    return this.http.get<CampaignGrantSummary>(`${this.base}/${encodeURIComponent(code)}/grants`);
  }

  history(code: string): Observable<ApprovalLog[]> {
    return this.http.get<ApprovalLog[]>(`${this.base}/${encodeURIComponent(code)}/history`);
  }

  approve(code: string): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}/approve`, {});
  }

  reject(code: string, reason: string): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}/reject`, { reason });
  }

  suspend(code: string, suspend: boolean): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}/${suspend ? 'suspend' : 'resume'}`, {});
  }

  /** ปิดถาวร — deliveredQty = จำนวนที่แจกจริง (เฉพาะ Campaign ที่จอง Stock) · ส่วนที่เหลือคืนเข้า Stock */
  close(code: string, reason: string, deliveredQty: number | null): Observable<CampaignDetail> {
    return this.http.post<CampaignDetail>(`${this.base}/${encodeURIComponent(code)}/close`, { reason, deliveredQty });
  }
}
