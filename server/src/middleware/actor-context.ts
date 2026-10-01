/**
 * อ่านผู้ใช้/Role ปัจจุบันจาก Header ที่ Angular ส่งมา (X-User-Id, X-Role)
 * Prototype ใช้แทนระบบ Login จริง (OUT-04) — ใช้ตรวจ Maker ≠ Approver และบันทึก Audit
 */
import type { NextFunction, Request, Response } from 'express';

export interface Actor {
  userId: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor: Actor;
    }
  }
}

export function actorContext(req: Request, _res: Response, next: NextFunction): void {
  req.actor = {
    userId: req.header('x-user-id') ?? 'U001',
    role: req.header('x-role') ?? 'SYS_ADMIN',
  };
  next();
}
