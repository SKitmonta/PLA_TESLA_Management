/**
 * เลือก Tesla Admin API แล้ว → ส่งเส้นที่รองรับ (TESLA_ROUTES) ไป /tesla-admin/api/v2
 * - แกะ envelope { status, message, data: { result } } ให้เหลือ result (รูปแบบเดียวกับ Mock server)
 * - Error → { message } แบบเดียวกับ Mock server (apiError อ่านได้เลย)
 * - เส้นใน TESLA_OWNED_PREFIXES ที่ v2 ยังไม่มี → 501 (ไม่ตกไป Local เพื่อไม่ให้ข้อมูลคนละฐานปนกัน)
 * - เส้นอื่น (ผู้ใช้, Campaign ฯลฯ) → Mock server เดิม · คำขอที่ติด KEEP_LOCAL → Mock เสมอ
 */
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { DataSourceService, KEEP_LOCAL, TESLA_OWNED_PREFIXES } from './data-source.service';

interface TeslaEnvelope {
  status?: string;
  message?: string;
  data?: { result?: unknown };
}

export const dataSourceInterceptor: HttpInterceptorFn = (req, next) => {
  const ds = inject(DataSourceService);
  if (ds.source() !== 'tesla' || !req.url.startsWith('/api/') || req.context.get(KEEP_LOCAL)) return next(req);

  const path = req.url.split('?')[0];
  const route = ds.routes.find((r) => r.method === req.method && r.path.test(path));

  if (!route) {
    const owned = TESLA_OWNED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
    if (!owned) return next(req);
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 501,
          statusText: 'Not Implemented',
          url: req.url,
          error: { message: `Tesla Admin API ยังไม่มีเส้นนี้ (${req.method} ${path}) — สลับแหล่งข้อมูลเป็น Local ได้ที่เมนูสลับผู้ใช้` },
        }),
    );
  }

  return next(req.clone({ url: path.replace(route.path, route.target) + req.url.slice(path.length) })).pipe(
    map((event) => (event instanceof HttpResponse ? event.clone({ body: unwrap(event.body) }) : event)),
    catchError((err: unknown) => throwError(() => toFeError(err))),
  );
};

function unwrap(body: unknown): unknown {
  const env = body as TeslaEnvelope | null;
  return env && typeof env === 'object' && 'data' in env ? (env.data?.result ?? null) : body;
}

function toFeError(err: unknown): unknown {
  if (!(err instanceof HttpErrorResponse)) return err;
  const env = err.error as TeslaEnvelope | null;
  const errors = (env?.data?.result as { errors?: string[] } | undefined)?.errors;
  const message =
    err.status === 0 || err.status === 502 || err.status === 504
      ? 'เชื่อมต่อ Tesla Admin API ไม่ได้ — ตรวจสอบว่า API (port 5277) ทำงานอยู่ หรือสลับแหล่งข้อมูลเป็น Local'
      : errors?.length
        ? errors.join(' · ')
        : (env?.message ?? 'Tesla Admin API ตอบกลับผิดพลาด');
  return new HttpErrorResponse({ status: err.status, statusText: err.statusText, url: err.url ?? undefined, headers: err.headers, error: { message } });
}
