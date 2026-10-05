/**
 * อัปโหลดไฟล์ของหน้า Content Editor — เส้น v1 เดิม POST /api/v1/image/upload (เก็บไฟล์ + ตรวจชนิด/ขนาด/magic byte ที่ API)
 * ทำงานเฉพาะโหมด "Tesla Admin API" และเมื่อหน้า Editor ตั้ง context (Package / Channel / Version) แล้ว
 * โหมด Local: Mock server ไม่มีที่เก็บไฟล์ → upload-box เก็บแค่ชื่อไฟล์เหมือนเดิม
 */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DataSourceService, TESLA_IMAGE_UPLOAD } from '../../../core/data-source/data-source.service';

/** Slot ที่ API v1 รู้จัก (ImageController.SlotMap) — ช่องที่ไม่มี Slot ยังเก็บแค่ชื่อไฟล์ */
export type UploadSlot = 'banner_desktop' | 'banner_mobile' | 'thumb_main' | 'product_icon' | 'tc_doc';

export interface UploadContext {
  packageCode: string;
  channelCode: string;
  versionNo: number;
}

export interface UploadOptions {
  slot: UploadSlot;
  kind?: 'image' | 'pdf';
  /** tc_doc เท่านั้น: ลำดับเอกสาร 1–10 */
  index?: number;
  lang?: 'TH' | 'EN';
}

interface UploadEnvelope {
  message?: string;
  data?: { result?: { publicUrl?: string } | null; publicUrl?: string } | null;
}

@Injectable({ providedIn: 'root' })
export class ContentUploadService {
  private readonly http = inject(HttpClient);
  private readonly source = inject(DataSourceService);

  /** ตั้งโดย ContentEditorPage ตอนโหลด Content — null = ไม่อยู่ในหน้า Editor */
  readonly context = signal<UploadContext | null>(null);

  /** อัปโหลดจริงได้ไหม (Tesla API + มี context) */
  enabled(): boolean {
    return this.source.source() === 'tesla' && this.context() !== null;
  }

  /** ส่งไฟล์ → คืน publicUrl · error เป็นข้อความไทยพร้อมแสดง */
  upload(file: File, o: UploadOptions): Observable<string> {
    const ctx = this.context();
    if (!ctx) return throwError(() => 'ไม่พบข้อมูล Content ของหน้านี้ — เปิดหน้า Editor ใหม่แล้วลองอีกครั้ง');

    const body = new FormData();
    body.append('File', file, file.name);
    body.append('PackageCode', ctx.packageCode.toUpperCase());
    body.append('ChannelCode', ctx.channelCode.toUpperCase());
    body.append('VersionNo', String(ctx.versionNo));
    body.append('Kind', o.kind ?? 'image');
    body.append('Slot', o.slot);
    if (o.slot !== 'product_icon') body.append('LangCode', o.lang ?? 'TH');
    if (o.index != null) body.append('Index', String(o.index));

    return this.http.post<UploadEnvelope>(TESLA_IMAGE_UPLOAD, body).pipe(
      map((res) => {
        const url = res?.data?.result?.publicUrl ?? res?.data?.publicUrl;
        if (!url) throw new Error('API ไม่ส่งที่อยู่ไฟล์กลับมา');
        return url;
      }),
      catchError((err: unknown) => throwError(() => uploadError(err))),
    );
  }
}

function uploadError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0 || err.status === 502 || err.status === 504) return 'เชื่อมต่อ Tesla Admin API ไม่ได้ — ตรวจสอบว่า API (port 5277) ทำงานอยู่';
    if (err.status === 413) return 'ไฟล์ใหญ่เกินที่ API กำหนด';
    const msg = (err.error as UploadEnvelope | null)?.message;
    return msg ? `อัปโหลดไม่สำเร็จ: ${msg}` : 'อัปโหลดไม่สำเร็จ';
  }
  return err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ';
}
