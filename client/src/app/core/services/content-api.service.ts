/**
 * เรียก API /api/content — เมนู Package › Add Package
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AddCandidate, ContentDetail, ContentReview, ContentListQuery, ContentListResponse, ContentRow, SaveContentPayload } from '../models/content.model';

@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/content';

  list(query: ContentListQuery): Observable<ContentListResponse> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<ContentListResponse>(this.base, { params });
  }

  get(code: string): Observable<ContentDetail> {
    return this.http.get<ContentDetail>(`${this.base}/${encodeURIComponent(code)}`);
  }

  /** บันทึกร่าง */
  save(code: string, payload: SaveContentPayload): Observable<ContentDetail> {
    return this.http.put<ContentDetail>(`${this.base}/${encodeURIComponent(code)}`, payload);
  }

  /** ส่งอนุมัติ (บันทึก + ตรวจ Field บังคับ → Pending) */
  submit(code: string, payload: SaveContentPayload): Observable<ContentDetail> {
    return this.http.post<ContentDetail>(`${this.base}/${encodeURIComponent(code)}/submit`, payload);
  }

  addCandidates(): Observable<AddCandidate[]> {
    return this.http.get<AddCandidate[]>(`${this.base}/add-candidates`);
  }

  create(packageCode: string, channelCode: string): Observable<ContentRow> {
    return this.http.post<ContentRow>(this.base, { packageCode, channelCode });
  }

  review(code: string): Observable<ContentReview> {
    return this.http.get<ContentReview>(`${this.base}/${encodeURIComponent(code)}/review`);
  }

  approve(code: string): Observable<ContentDetail> {
    return this.http.post<ContentDetail>(`${this.base}/${encodeURIComponent(code)}/approve`, {});
  }

  reject(code: string, reason: string): Observable<ContentDetail> {
    return this.http.post<ContentDetail>(`${this.base}/${encodeURIComponent(code)}/reject`, { reason });
  }

  /** สร้าง Version ใหม่จาก Content ที่อนุมัติแล้ว (D-07) */
  newVersion(code: string): Observable<ContentDetail> {
    return this.http.post<ContentDetail>(`${this.base}/${encodeURIComponent(code)}/new-version`, {});
  }
}
