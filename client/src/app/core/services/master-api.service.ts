/**
 * เรียก API /api/master — เมนู Master setup (MS-01…MS-04)
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChannelPackage,
  CustomMasterItem,
  ContentMasterItem,
  ContentMasterType,
  CustomMasterType,
  DisplayMappingResponse,
  KeyTopic,
  PackageDetail,
  PackageListQuery,
  PackageListResponse,
  PaymentMethodMapping,
  SyncedRow,
  SyncedType,
  UnderwriteMapping,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class MasterApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/master';

  // MS-01
  packages(query: PackageListQuery): Observable<PackageListResponse> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<PackageListResponse>(`${this.base}/packages`, { params });
  }

  packageDetail(code: string): Observable<PackageDetail> {
    return this.http.get<PackageDetail>(`${this.base}/packages/${encodeURIComponent(code)}`);
  }

  sync(scope: 'PACKAGE' | 'MASTER'): Observable<{ lastSync: string; message: string }> {
    return this.http.post<{ lastSync: string; message: string }>(`${this.base}/sync`, { scope });
  }

  // MS-02
  customTypes(): Observable<CustomMasterType[]> {
    return this.http.get<CustomMasterType[]>(`${this.base}/custom-types`);
  }

  customItems(type: string): Observable<CustomMasterItem[]> {
    return this.http.get<CustomMasterItem[]>(`${this.base}/custom/${type}`);
  }

  createCustomItem(type: string, item: Partial<CustomMasterItem>): Observable<CustomMasterItem> {
    return this.http.post<CustomMasterItem>(`${this.base}/custom/${type}`, item);
  }

  updateCustomItem(type: string, code: string, item: Partial<CustomMasterItem>): Observable<CustomMasterItem> {
    return this.http.put<CustomMasterItem>(`${this.base}/custom/${type}/${encodeURIComponent(code)}`, item);
  }

  // MS-03
  displayMapping(channel: string): Observable<DisplayMappingResponse> {
    return this.http.get<DisplayMappingResponse>(`${this.base}/display-mapping`, { params: { channel } });
  }

  saveDisplayMapping(body: { channel: string; underwrite: UnderwriteMapping[]; paymentMethods: PaymentMethodMapping[] }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/display-mapping`, body);
  }

  // หมวดสินค้า (insurance-types) + Tag Filter (coverage-types / feature-tags) ที่ใช้ใน Content Editor
  contentMaster(type: ContentMasterType): Observable<ContentMasterItem[]> {
    return this.http.get<ContentMasterItem[]>(`${this.base}/${type}`);
  }

  /** Package ที่ขายในช่องทางนี้ (Package recommend ของ Content Editor) */
  channelPackages(channelCode: string): Observable<ChannelPackage[]> {
    return this.http.get<ChannelPackage[]>(`${this.base}/channel-packages`, { params: { channelCode } });
  }

  // หัวข้อ Key Features / Key Advantages ที่ใช้ใน Content Editor
  keyTopics(topicType: KeyTopic['topicType'], systemCode?: KeyTopic['systemCode']): Observable<KeyTopic[]> {
    let params = new HttpParams().set('topicType', topicType);
    if (systemCode) params = params.set('systemCode', systemCode);
    return this.http.get<KeyTopic[]>(`${this.base}/key-topics`, { params });
  }

  // MS-04
  syncedTypes(): Observable<{ lastSync: string | null; types: SyncedType[] }> {
    return this.http.get<{ lastSync: string | null; types: SyncedType[] }>(`${this.base}/synced`);
  }

  syncedRows(type: string): Observable<SyncedRow[]> {
    return this.http.get<SyncedRow[]>(`${this.base}/synced/${type}`);
  }
}

/** ดึงข้อความ Error จาก API (ข้อความภาษาไทยจาก Server) */
export function apiError(err: unknown): string {
  const e = err as { error?: { message?: string }; status?: number };
  if (e?.error?.message) return e.error.message;
  if (e?.status === 0) return 'เชื่อมต่อ Server ไม่ได้ — ตรวจสอบว่า start.bat ยังทำงานอยู่';
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
