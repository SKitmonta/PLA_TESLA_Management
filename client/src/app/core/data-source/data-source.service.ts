/**
 * แหล่งข้อมูลของหน้าจอ — เลือกได้จากหน้าต่างสลับผู้ใช้/Role
 * - local : Mock server เดิม (port 3000 · SQLite) — ค่าเริ่มต้น
 * - tesla : Tesla Admin API (/tesla-admin/api/v2 · PostgreSQL) — เฉพาะเส้นที่ทำแล้วใน TESLA_ROUTES
 * ค่าที่เลือกจำไว้ใน localStorage ของ Browser
 */
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

export type DataSource = 'local' | 'tesla';

/** ที่อยู่ Tesla Admin API (ผ่าน proxy ของ ng serve → proxy.conf.json) */
export const TESLA_API_BASE = '/tesla-admin/api/v2';

/** อัปโหลดรูป / PDF ของ Content — ใช้เส้น v1 เดิม (ไม่มีใน v2) · ส่ง multipart แล้วได้ publicUrl กลับมา */
export const TESLA_IMAGE_UPLOAD = '/tesla-admin/api/v1/image/upload';

export interface TeslaRoute {
  method: string;
  /** path ฝั่ง FE (ไม่รวม query string) */
  path: RegExp;
  /** path ใน Tesla Admin API — ใช้ $1, $2 อ้างกลุ่มใน path ได้ */
  target: string;
  label: string;
}

const LIST = 'Package management — รายการ + การ์ด 5 ใบ';
const ADD = 'Add Package — ตัวเลือก + Save';
const EDITOR = 'Content Editor — เปิด / บันทึกร่าง / ส่งอนุมัติ / Version ใหม่';
const PKG_DETAIL = 'รายละเอียด Package (MS-01) — จาก T_PACKAGE';
const SYNCED = 'Master ที่ Sync (MS-04) — ตาราง Master ของ v1 + Underwrite / Gender จาก T_PACKAGE';
const CUSTOM = 'Master ที่สร้างเอง (MS-02) — M_CUSTOM_MASTER_* (V036) · MS-01 จาก M_CAMPAIGN_TYPE';
const MAPPING = 'Mapping ข้อความแสดงผล (MS-03) — M_DISPLAY_MAPPING (V037) · ใช้ใน Package detail / Content Editor';
const CAMPAIGN = 'Campaign — รายการ + Add Campaign (บันทึกร่าง / ส่งอนุมัติ) · ตาราง T_CAMPAIGN ของ v1';
const KEY_TOPIC = 'หัวข้อ Key Features / Key Advantages — M_MARKETING_KEY_TOPIC · เส้น v1 เดิม';
const CHANNEL_PACKAGES = 'Package recommend (OL_OB) — Package ที่ขายในช่องทางเดียวกัน · เส้น v1 เดิม';
const CONTENT_MASTER = 'หมวดสินค้า + Tag Filter (OL_OB) — Insurance / Coverage types, Feature tags · เส้น v1 เดิม';

/** เส้นที่ Tesla Admin API v2 รองรับแล้ว — ทำเส้นใหม่เสร็จให้เพิ่มที่นี่ (เส้นเจาะจงต้องอยู่ก่อน :code) */
export const TESLA_ROUTES: TeslaRoute[] = [
  { method: 'GET', path: /^\/api\/content$/, target: `${TESLA_API_BASE}/content`, label: LIST },
  { method: 'GET', path: /^\/api\/content\/add-candidates$/, target: `${TESLA_API_BASE}/content/add-candidates`, label: ADD },
  { method: 'POST', path: /^\/api\/content$/, target: `${TESLA_API_BASE}/content`, label: ADD },
  { method: 'GET', path: /^\/api\/master\/packages\/([^/]+)$/, target: `${TESLA_API_BASE}/master/packages/$1`, label: PKG_DETAIL },
  { method: 'GET', path: /^\/api\/master\/synced$/, target: `${TESLA_API_BASE}/master/synced`, label: SYNCED },
  { method: 'GET', path: /^\/api\/master\/synced\/([^/]+)$/, target: `${TESLA_API_BASE}/master/synced/$1`, label: SYNCED },
  { method: 'GET', path: /^\/api\/master\/custom-types$/, target: `${TESLA_API_BASE}/master/custom-types`, label: CUSTOM },
  { method: 'GET', path: /^\/api\/master\/custom\/([^/]+)$/, target: `${TESLA_API_BASE}/master/custom/$1`, label: CUSTOM },
  { method: 'POST', path: /^\/api\/master\/custom\/([^/]+)$/, target: `${TESLA_API_BASE}/master/custom/$1`, label: CUSTOM },
  { method: 'PUT', path: /^\/api\/master\/custom\/([^/]+)\/([^/]+)$/, target: `${TESLA_API_BASE}/master/custom/$1/$2`, label: CUSTOM },
  { method: 'GET', path: /^\/api\/master\/display-mapping$/, target: `${TESLA_API_BASE}/master/display-mapping`, label: MAPPING },
  { method: 'PUT', path: /^\/api\/master\/display-mapping$/, target: `${TESLA_API_BASE}/master/display-mapping`, label: MAPPING },
  { method: 'GET', path: /^\/api\/master\/key-topics$/, target: '/tesla-admin/api/v1/marketing-content/master/key-topics', label: KEY_TOPIC },
  { method: 'GET', path: /^\/api\/master\/channel-packages$/, target: '/tesla-admin/api/v1/marketing-content/master/packages', label: CHANNEL_PACKAGES },
  {
    method: 'GET',
    path: /^\/api\/master\/(insurance-types|coverage-types|feature-tags)$/,
    target: '/tesla-admin/api/v1/marketing-content/master/$1',
    label: CONTENT_MASTER,
  },
  { method: 'GET', path: /^\/api\/campaign$/, target: `${TESLA_API_BASE}/campaign`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/campaign\/package-options$/, target: `${TESLA_API_BASE}/campaign/package-options`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/campaign\/overlap$/, target: `${TESLA_API_BASE}/campaign/overlap`, label: CAMPAIGN },
  { method: 'POST', path: /^\/api\/campaign$/, target: `${TESLA_API_BASE}/campaign`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/campaign\/([^/]+)\/history$/, target: `${TESLA_API_BASE}/campaign/$1/history`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/campaign\/([^/]+)\/grants$/, target: `${TESLA_API_BASE}/campaign/$1/grants`, label: CAMPAIGN },
  { method: 'POST', path: /^\/api\/campaign\/([^/]+)\/submit$/, target: `${TESLA_API_BASE}/campaign/$1/submit`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/campaign\/([^/]+)$/, target: `${TESLA_API_BASE}/campaign/$1`, label: CAMPAIGN },
  { method: 'PUT', path: /^\/api\/campaign\/([^/]+)$/, target: `${TESLA_API_BASE}/campaign/$1`, label: CAMPAIGN },
  { method: 'GET', path: /^\/api\/content\/([^/]+)$/, target: `${TESLA_API_BASE}/content/$1`, label: EDITOR },
  { method: 'PUT', path: /^\/api\/content\/([^/]+)$/, target: `${TESLA_API_BASE}/content/$1`, label: EDITOR },
  { method: 'POST', path: /^\/api\/content\/([^/]+)\/submit$/, target: `${TESLA_API_BASE}/content/$1/submit`, label: EDITOR },
  { method: 'POST', path: /^\/api\/content\/([^/]+)\/new-version$/, target: `${TESLA_API_BASE}/content/$1/new-version`, label: EDITOR },
];

/** กลุ่มเส้นสำหรับแสดงในหน้าต่างสลับผู้ใช้ */
export const TESLA_ROUTE_GROUPS: { label: string; endpoints: string[] }[] = [...new Set(TESLA_ROUTES.map((r) => r.label))].map((label) => ({
  label,
  endpoints: TESLA_ROUTES.filter((r) => r.label === label).map((r) => `${r.method} ${r.target.replace(TESLA_API_BASE, '').replace('$1', ':code')}`),
}));

/**
 * กลุ่มเส้นที่เมื่อเลือก Tesla API แล้วห้ามตกไปใช้ Local
 * (ข้อมูลคนละฐาน — เช่น CT000001 ใน PostgreSQL กับใน Mock เป็นคนละ Content)
 */
export const TESLA_OWNED_PREFIXES = [
  '/api/content',
  '/api/master/synced',
  '/api/master/custom-types',
  '/api/master/custom',
  '/api/master/display-mapping',
  '/api/master/key-topics',
  '/api/master/insurance-types',
  '/api/master/coverage-types',
  '/api/master/feature-tags',
  '/api/master/channel-packages',
  '/api/campaign', // approve / reject / suspend ยังไม่มีใน v2 → 501 (ไม่ตกไป Mock)
];

/**
 * ส่งคำขอนี้ไป Local (Mock) เสมอ แม้เลือก Tesla API
 * ตอนนี้ใช้กับ MS-01 Campaign Type ในเมนู Campaign เท่านั้น: การ์ดประเภทใน Wizard ต้องใช้รหัสฝั่ง FE (FREE_GIFT ฯลฯ) และ
 * benefit_kind ซึ่ง M_CAMPAIGN_TYPE ของ Tesla ไม่มี (รหัส v1 = GIFT / POINTS / DRAW — API v2 แปลงรหัสให้ตอนบันทึก / อ่าน Campaign)
 */
export const KEEP_LOCAL = new HttpContextToken<boolean>(() => false);
export const keepLocal = (on = true) => new HttpContext().set(KEEP_LOCAL, on);

export type TeslaHealth = 'unknown' | 'checking' | 'ok' | 'down';

const STORAGE_KEY = 'tesla.dataSource';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private readonly http = inject(HttpClient);

  readonly source = signal<DataSource>(read() === 'tesla' ? 'tesla' : 'local');
  readonly routes = TESLA_ROUTES;
  readonly routeGroups = TESLA_ROUTE_GROUPS;
  readonly health = signal<TeslaHealth>('unknown');

  /** เปลี่ยนแหล่งข้อมูล แล้วโหลดหน้าใหม่ให้ทุกหน้าดึงข้อมูลจากแหล่งใหม่ */
  use(source: DataSource): void {
    if (source === this.source()) return;
    this.source.set(source);
    write(source);
    location.reload();
  }

  /** ตรวจว่าเรียก Tesla Admin API ได้ไหม (ยิงรายการ 1 แถว) */
  checkHealth(): void {
    this.health.set('checking');
    this.http.get(`${TESLA_API_BASE}/content`, { params: { pageSize: 1 } }).subscribe({
      next: () => this.health.set('ok'),
      error: () => this.health.set('down'),
    });
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}
