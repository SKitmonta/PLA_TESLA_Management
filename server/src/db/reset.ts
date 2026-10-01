/**
 * ล้างฐานข้อมูลแล้วสร้างใหม่จาก schema.sql + seed
 * วิธีใช้: หยุด Server ก่อน (Ctrl+C) แล้วรัน  npm run db:reset
 */
import { existsSync, rmSync } from 'node:fs';
import { DB_FILE, getDb, closeDb } from './database.js';

for (const file of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`]) {
  if (existsSync(file)) rmSync(file);
}
getDb();
closeDb();
console.log('[db] Reset เรียบร้อย — ได้ข้อมูลตั้งต้นใหม่แล้ว');
