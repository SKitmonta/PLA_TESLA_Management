/**
 * เรียก API /api/people — เมนู Seller (doc 07)
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditEntry,
  AuditQuery,
  Board,
  CopyPlanGroup,
  GroupDetail,
  GroupPayload,
  ImportResult,
  MoveResult,
  ReferralDetail,
  ReferralRow,
  WorkspaceRow,
} from '../models/seller.model';

const enc = encodeURIComponent;

function params(query: object): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class SellerApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/people';

  workspaces(query: { search?: string; channel?: string; mode?: string } = {}): Observable<WorkspaceRow[]> {
    return this.http.get<WorkspaceRow[]>(`${this.base}/workspaces`, { params: params(query) });
  }

  board(pkg: string, ch: string): Observable<Board> {
    return this.http.get<Board>(`${this.base}/workspaces/${enc(pkg)}/${enc(ch)}`);
  }

  createGroup(pkg: string, ch: string, payload: GroupPayload): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${this.base}/workspaces/${enc(pkg)}/${enc(ch)}/groups`, payload);
  }

  /** ย้ายผู้ขาย — groupId = null คือนำออกจากกลุ่ม */
  move(pkg: string, ch: string, sellerCodes: string[], groupId: number | null): Observable<MoveResult> {
    return this.http.post<MoveResult>(`${this.base}/workspaces/${enc(pkg)}/${enc(ch)}/move`, { sellerCodes, groupId });
  }

  importRows(pkg: string, ch: string, rows: { sellerCode: string; groupName: string }[], commit: boolean): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.base}/workspaces/${enc(pkg)}/${enc(ch)}/import`, { rows, commit });
  }

  group(id: number): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.base}/groups/${id}`);
  }

  updateGroup(id: number, payload: GroupPayload): Observable<GroupDetail> {
    return this.http.put<GroupDetail>(`${this.base}/groups/${id}`, payload);
  }

  deleteGroup(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/groups/${id}`);
  }

  bind(id: number, campaignCode: string): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${this.base}/groups/${id}/campaigns`, { campaignCode });
  }

  unbind(id: number, campaignCode: string): Observable<GroupDetail> {
    return this.http.delete<GroupDetail>(`${this.base}/groups/${id}/campaigns/${enc(campaignCode)}`);
  }

  referrals(): Observable<ReferralRow[]> {
    return this.http.get<ReferralRow[]>(`${this.base}/referrals`);
  }

  referral(code: string): Observable<ReferralDetail> {
    return this.http.get<ReferralDetail>(`${this.base}/referrals/${enc(code)}`);
  }

  copy(body: { fromPackage: string; fromChannel: string; toPackage: string; toChannel: string; preview: boolean }): Observable<{ preview: boolean; groups: CopyPlanGroup[] }> {
    return this.http.post<{ preview: boolean; groups: CopyPlanGroup[] }>(`${this.base}/copy`, body);
  }

  audit(query: AuditQuery): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.base}/audit`, { params: params(query) });
  }
}
