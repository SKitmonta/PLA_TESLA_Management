/**
 * เรียก API /api/overview — Dashboard / ตั้ง Target (doc 08)
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardData, DashboardQuery, Metric, OverviewOptions, TargetLevel, TargetSheet } from '../models/overview.model';

function params(query: object): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class OverviewApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/overview';

  dashboard(q: DashboardQuery): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/dashboard`, { params: params(q) });
  }

  options(): Observable<OverviewOptions> {
    return this.http.get<OverviewOptions>(`${this.base}/options`);
  }

  targets(q: { level: TargetLevel; pkg: string; ch: string; metric: Metric; from: string; to: string }): Observable<TargetSheet> {
    return this.http.get<TargetSheet>(`${this.base}/targets`, { params: params(q) });
  }

  saveTargets(body: { level: TargetLevel; pkg: string; ch: string; metric: Metric; values: { refId: string; period: string; value: number | null }[] }): Observable<TargetSheet> {
    return this.http.put<TargetSheet>(`${this.base}/targets`, body);
  }
}
