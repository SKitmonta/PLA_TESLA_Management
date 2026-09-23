import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { HttpError } from './crud.js';
import {
  agentGroupsRouter,
  agentsRouter,
  campaignsRouter,
  combinationsRouter,
  dashboardRouter,
  packagesRouter,
} from './routes.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/dashboard', dashboardRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/agent-groups', agentGroupsRouter);
app.use('/api/combinations', combinationsRouter);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

const CONSTRAINT_MESSAGES: Record<string, string> = {
  campaigns_date_range: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม',
  campaigns_percent_max: 'ส่วนลดแบบเปอร์เซ็นต์ต้องไม่เกิน 100%',
  combinations_unique_set: 'มีการจับคู่ Package + Agent Group + Campaign ชุดนี้อยู่แล้ว',
};

// Map validation / database errors to friendly HTTP responses
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return res.status(400).json({ message });
  }
  switch (err?.code) {
    case '23505':
      if (err.constraint?.endsWith('_code_key')) return res.status(409).json({ message: 'รหัสนี้ถูกใช้งานแล้ว' });
      return res.status(409).json({ message: CONSTRAINT_MESSAGES[err.constraint] ?? 'ข้อมูลซ้ำกับที่มีอยู่แล้ว' });
    case '23503':
      return res.status(409).json({ message: 'ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลถูกอ้างอิงอยู่' });
    case '23514':
    case '22P02':
      return res.status(400).json({ message: CONSTRAINT_MESSAGES[err.constraint] ?? 'ข้อมูลไม่ถูกต้อง' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`TESLA Management API listening on http://localhost:${port}`));
