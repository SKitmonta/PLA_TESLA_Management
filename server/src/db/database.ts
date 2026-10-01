/**
 * การเชื่อมต่อ SQLite — ใช้ node:sqlite ที่มากับ Node.js 24 (ไม่ต้องติดตั้ง Driver เพิ่ม)
 * ไฟล์ฐานข้อมูล: server/data/tesla.db (สร้างอัตโนมัติ, ลบแล้วรันใหม่ = ได้ข้อมูลตั้งต้น)
 * เปิดดูข้อมูลใน VS Code ได้ด้วย Extension "SQLite Viewer"
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runSeed } from './seed/index.js';

const SERVER_ROOT = join(import.meta.dirname, '..', '..');
export const DATA_DIR = join(SERVER_ROOT, 'data');
export const DB_FILE = join(DATA_DIR, 'tesla.db');
const SCHEMA_FILE = join(import.meta.dirname, 'schema.sql');

let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(DATA_DIR, { recursive: true });
  const isNew = !existsSync(DB_FILE);

  db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(readFileSync(SCHEMA_FILE, 'utf8'));
  migrate(db);

  // Seed ใช้ INSERT OR IGNORE จึงรันซ้ำได้ปลอดภัย (เติมเฉพาะข้อมูลที่ยังไม่มี)
  runSeed(db);
  console.log(`[db] ${isNew ? 'สร้างฐานข้อมูลใหม่' : 'เปิดฐานข้อมูล'}: ${DB_FILE}`);
  return db;
}

export function closeDb(): void {
  db?.close();
  db = undefined;
}

/** รันหลายคำสั่งใน Transaction เดียว — Error = Rollback ทั้งหมด */
export function transaction<T>(work: (db: DatabaseSync) => T): T {
  const conn = getDb();
  conn.exec('BEGIN');
  try {
    const result = work(conn);
    conn.exec('COMMIT');
    return result;
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }
}

/**
 * ล้างข้อมูลทุกตารางแล้ว Seed ใหม่ (ใช้ตอน Server ยังทำงานอยู่ — ไม่ต้องลบไฟล์ฐานข้อมูล)
 * เรียกผ่าน POST /api/dev/reset-data (localhost เท่านั้น)
 */
export function resetData(): void {
  const conn = getDb();
  const tables = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  conn.exec('PRAGMA foreign_keys = OFF;');
  transaction((db) => {
    for (const t of tables) db.exec(`DELETE FROM "${t.name}"`);
    runSeed(db);
  });
  conn.exec('PRAGMA foreign_keys = ON;');
}

/** เพิ่มคอลัมน์ใหม่ให้ฐานข้อมูลเดิม (CREATE TABLE IF NOT EXISTS ไม่เพิ่มคอลัมน์ให้ตารางที่มีอยู่แล้ว) */
function migrate(conn: DatabaseSync): void {
  const addColumn = (table: string, column: string, ddl: string) => {
    const cols = conn.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  };
  addColumn('content', 'content_data', "TEXT NOT NULL DEFAULT '{}'");
}
