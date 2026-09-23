import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard } from './models';

export type Resource = 'packages' | 'campaigns' | 'agents' | 'agent-groups' | 'combinations';

export interface ListFilter {
  q?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  list<T>(resource: Resource, filter: ListFilter = {}): Observable<T[]> {
    let params = new HttpParams();
    if (filter.q) params = params.set('q', filter.q);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<T[]>(`${this.base}/${resource}`, { params });
  }

  create<T>(resource: Resource, body: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.base}/${resource}`, body);
  }

  update<T>(resource: Resource, id: number, body: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.base}/${resource}/${id}`, body);
  }

  remove(resource: Resource, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${resource}/${id}`);
  }

  setGroupMembers(groupId: number, agentIds: number[]) {
    return this.http.put(`${this.base}/agent-groups/${groupId}/members`, { agent_ids: agentIds });
  }

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }
}
