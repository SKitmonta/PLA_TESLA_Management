import type { NextFunction, Request, Response } from 'express';

/** Error ทางธุรกิจ — ส่งข้อความภาษาไทยกลับไปแสดงบนหน้าจอ */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function notFoundApi(req: Request, res: Response): void {
  res.status(404).json({ message: `ไม่พบ API ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, code: err.code });
    return;
  }
  console.error('[server] Unexpected error:', err);
  res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
}
