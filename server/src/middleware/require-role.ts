/**
 * ตรวจสิทธิ์ตาม Role ปัจจุบัน (X-Role) — ใช้กับ API ที่แก้ไขข้อมูล
 * ตัวอย่าง: router.put('/x', requireRole('SYS_ADMIN'), handler)
 * System admin (SYS_ADMIN) ผ่านทุก Function — กติกาธุรกิจอื่นยังใช้ตามปกติ (เช่น ห้ามอนุมัติงานที่ตัวเองสร้าง — D-06)
 */
import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error-handler.js';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.actor.role !== 'SYS_ADMIN' && !roles.includes(req.actor.role)) {
      throw new AppError(403, `Role นี้ไม่มีสิทธิ์ทำรายการ (ต้องเป็น ${roles.join(' / ')})`, 'FORBIDDEN');
    }
    next();
  };
}
