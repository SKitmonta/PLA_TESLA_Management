/**
 * แนบผู้ใช้/Role ปัจจุบันไปกับทุก Request ที่เรียก /api
 * Server ใช้ตรวจ Maker ≠ Approver และบันทึกผู้ทำใน Audit log
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

export const actorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const session = inject(SessionService);
  return next(
    req.clone({
      setHeaders: {
        'X-User-Id': session.userId(),
        'X-Role': session.role(),
      },
    }),
  );
};
