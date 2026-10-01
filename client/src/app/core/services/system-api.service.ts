/**
 * เรียก API /api/system — สถานะระบบ และรายชื่อผู้ใช้จำลอง
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUser, HealthStatus } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class SystemApiService {
  private readonly http = inject(HttpClient);

  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>('/api/system/health');
  }

  users(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>('/api/system/users');
  }
}
