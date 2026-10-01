/**
 * TESLA Management — API Server (Express + SQLite)
 * รันด้วย: npm run server  (หรือ npm start ที่ root เพื่อรันพร้อม Angular)
 * API ทั้งหมดอยู่ใต้ /api/<menu> — แยกไฟล์ route ตามเมนูใน src/routes/
 */
import express from 'express';
import { getDb } from './db/database.js';
import { actorContext } from './middleware/actor-context.js';
import { errorHandler, notFoundApi } from './middleware/error-handler.js';
import { systemRoutes } from './routes/system.routes.js';
import { overviewRoutes } from './routes/overview.routes.js';
import { contentRoutes } from './routes/content.routes.js';
import { campaignRoutes } from './routes/campaign.routes.js';
import { peopleRoutes } from './routes/people.routes.js';
import { masterRoutes } from './routes/master.routes.js';
import { devRoutes } from './routes/dev.routes.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(actorContext);

app.use('/api/system', systemRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/master', masterRoutes);
if (process.env.NODE_ENV !== 'production') app.use('/api/dev', devRoutes);

app.use('/api', notFoundApi);
app.use(errorHandler);

// เปิดฐานข้อมูล (สร้างตาราง + Seed ครั้งแรกอัตโนมัติ)
getDb();

app.listen(PORT, () => {
  console.log(`[server] TESLA Management API พร้อมใช้งานที่ http://localhost:${PORT}/api`);
});
