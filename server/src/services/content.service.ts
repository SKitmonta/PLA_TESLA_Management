/**
 * Content — หน้า Package › Add Package (Package management, CT-01) และ Popup Add Package (doc 05 §0.2, §2)
 */
import { getDb } from '../db/database.js';
import { AppError } from '../middleware/error-handler.js';
import { resolveTemplate, type TemplateCode } from './template-resolver.js';
import { getPackageDetail } from './package.service.js';

type DbRow = Record<string, string | number | null>;

/** สถานะที่แสดงบนหน้าจอ (FD-03) */
export type ContentDisplayStatus = 'ACTIVE' | 'PENDING' | 'DRAFT' | 'INACTIVE';

/** สถานะที่ยังนับว่า "มี Content แล้ว" → ซ่อน Package จาก Popup (BR-CT-003, BR-CT-006) */
const IN_USE = "('DRAFT','REJECTED','PENDING','APPROVED')";

const DISPLAY_SQL = `CASE c.status WHEN 'APPROVED' THEN 'ACTIVE' WHEN 'PENDING' THEN 'PENDING' WHEN 'INACTIVE' THEN 'INACTIVE' ELSE 'DRAFT' END`;

export interface ContentListQuery {
  code?: string;
  name?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  channel?: string;
  status?: ContentDisplayStatus | '';
  createdBy?: string;
  approvedBy?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ContentRow {
  contentCode: string;
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  channelCode: string;
  channelName: string | null;
  template: TemplateCode;
  status: string;
  displayStatus: ContentDisplayStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  createdByName: string | null;
  approvedByName: string | null;
  rejectReason: string | null;
  versionNo: number;
  isMock: boolean;
  updatedAt: string;
}

const SORTABLE: Record<string, string> = {
  packageCode: 'c.package_code',
  nameTh: 'p.name_th',
  startDate: 'c.display_start_date',
  endDate: 'c.display_end_date',
  channel: 'c.channel_code',
  status: 'display_status',
  createdBy: 'u.user_name',
  approvedBy: 'a.user_name',
};

const BASE_SELECT = `
  SELECT c.*, p.name_th, p.name_en, ch.name_en AS channel_name,
         u.user_name AS created_by_name, a.user_name AS approved_by_name,
         ${DISPLAY_SQL} AS display_status
    FROM content c
    JOIN package p ON p.package_code = c.package_code
    LEFT JOIN synced_master ch ON ch.master_type = 'CHANNEL' AND ch.code = c.channel_code
    LEFT JOIN app_user u ON u.user_id = c.created_by
    LEFT JOIN app_user a ON a.user_id = c.approved_by`;

function toRow(r: DbRow): ContentRow {
  return {
    contentCode: String(r['content_code']),
    packageCode: String(r['package_code']),
    nameTh: String(r['name_th']),
    nameEn: r['name_en'] as string | null,
    channelCode: String(r['channel_code']),
    channelName: r['channel_name'] as string | null,
    template: r['template_code'] as TemplateCode,
    status: String(r['status']),
    displayStatus: r['display_status'] as ContentDisplayStatus,
    startDate: r['display_start_date'] as string | null,
    endDate: r['display_end_date'] as string | null,
    createdBy: r['created_by'] as string | null,
    createdByName: r['created_by_name'] as string | null,
    approvedByName: r['approved_by_name'] as string | null,
    rejectReason: r['reject_reason'] as string | null,
    versionNo: Number(r['version_no']),
    isMock: r['is_mock'] === 1,
    updatedAt: String(r['updated_at']),
  };
}

export function listContents(q: ContentListQuery) {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (q.code) {
    where.push('c.package_code LIKE ?');
    params.push(`%${q.code}%`);
  }
  if (q.name) {
    where.push('(p.name_th LIKE ? OR p.name_en LIKE ?)');
    params.push(`%${q.name}%`, `%${q.name}%`);
  }
  if (q.startDate) {
    where.push('c.display_start_date = ?');
    params.push(q.startDate);
  }
  if (q.endDate) {
    where.push('c.display_end_date = ?');
    params.push(q.endDate);
  }
  if (q.channel) {
    where.push('c.channel_code = ?');
    params.push(q.channel);
  }
  if (q.createdBy) {
    where.push('u.user_name LIKE ?');
    params.push(`%${q.createdBy}%`);
  }
  if (q.approvedBy) {
    where.push('a.user_name LIKE ?');
    params.push(`%${q.approvedBy}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // การ์ดสรุป: นับก่อนกรองสถานะ (กดการ์ด = กรองสถานะนั้น — BR-CT-010)
  const all = db.prepare(`${BASE_SELECT} ${whereSql}`).all(...params) as DbRow[];
  const count = (s: ContentDisplayStatus) => all.filter((r) => r['display_status'] === s).length;
  const summary = { total: all.length, active: count('ACTIVE'), pending: count('PENDING'), draft: count('DRAFT'), inactive: count('INACTIVE') };

  let statusSql = '';
  if (q.status) {
    statusSql = `${whereSql ? ' AND' : 'WHERE'} ${DISPLAY_SQL} = ?`;
    params.push(q.status);
  }

  const sortCol = SORTABLE[q.sort ?? ''] ?? 'c.package_code';
  const dir = q.dir === 'desc' ? 'DESC' : 'ASC';
  const pageSize = Math.min(Math.max(Number(q.pageSize) || 10, 1), 100);
  const page = Math.max(Number(q.page) || 1, 1);

  const filtered = db
    .prepare(`${BASE_SELECT} ${whereSql}${statusSql} ORDER BY ${sortCol} ${dir} NULLS LAST, c.content_code`)
    .all(...params) as DbRow[];
  const items = filtered.slice((page - 1) * pageSize, page * pageSize).map(toRow);
  return { items, total: filtered.length, page, pageSize, summary };
}

/** ตัวเลือกใน Popup Add Package — 1 แถว = Package × Channel ที่สร้าง Content ได้ */
export interface AddCandidate {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  channelCode: string;
  channelName: string | null;
  productTypeCode: string;
  productTypeName: string | null;
  subProductTypeCode: string | null;
  subProductTypeName: string | null;
  template: TemplateCode;
  isMock: boolean;
}

/**
 * BR-CT-002/003/005: เฉพาะ Package status APP + is_Active, Channel+Product type ที่มี Template
 * และยังไม่มี Content ที่ใช้งานอยู่ (Draft/Rejected/Pending/Approved) ในช่องทางนั้น (FD-06)
 */
export function addCandidates(): AddCandidate[] {
  const rows = getDb()
    .prepare(
      `SELECT p.package_code, p.name_th, p.name_en, p.sale_start_date, p.sale_end_date, p.is_mock,
              pc.channel_code, ch.name_en AS channel_name,
              pl.product_type_code, pt.name_th AS product_type_name,
              pl.sub_product_type_code, st.name_th AS sub_type_name
         FROM package p
         JOIN package_channel pc ON pc.package_code = p.package_code
         JOIN package_plan pl ON pl.package_code = p.package_code AND pl.plan_role = 'MASTER'
              AND pl.plan_code = (SELECT MIN(x.plan_code) FROM package_plan x WHERE x.package_code = p.package_code AND x.plan_role = 'MASTER')
         LEFT JOIN synced_master ch ON ch.master_type = 'CHANNEL' AND ch.code = pc.channel_code
         LEFT JOIN synced_master pt ON pt.master_type = 'PRODUCT_TYPE' AND pt.code = pl.product_type_code
         LEFT JOIN synced_master st ON st.master_type = 'SUB_PRODUCT_TYPE' AND st.code = pl.sub_product_type_code
        WHERE p.status_code = 'APP' AND p.is_active = 1
          AND NOT EXISTS (SELECT 1 FROM content c WHERE c.package_code = p.package_code
                            AND c.channel_code = pc.channel_code AND c.status IN ${IN_USE})
        ORDER BY pc.channel_code, p.package_code`,
    )
    .all() as DbRow[];

  const out: AddCandidate[] = [];
  for (const r of rows) {
    const template = resolveTemplate(String(r['channel_code']), r['product_type_code'] as string | null);
    if (!template) continue;
    out.push({
      packageCode: String(r['package_code']),
      nameTh: String(r['name_th']),
      nameEn: r['name_en'] as string | null,
      saleStartDate: r['sale_start_date'] as string | null,
      saleEndDate: r['sale_end_date'] as string | null,
      channelCode: String(r['channel_code']),
      channelName: r['channel_name'] as string | null,
      productTypeCode: String(r['product_type_code']),
      productTypeName: r['product_type_name'] as string | null,
      subProductTypeCode: r['sub_product_type_code'] as string | null,
      subProductTypeName: r['sub_type_name'] as string | null,
      template,
      isMock: r['is_mock'] === 1,
    });
  }
  return out;
}

/** BR-CT-004: Save → สร้าง Content สถานะ Draft + กำหนด Template อัตโนมัติ */
export function createContent(input: { packageCode?: string; channelCode?: string }, userId: string): ContentRow {
  const { packageCode, channelCode } = input;
  if (!packageCode || !channelCode) throw new AppError(400, 'กรุณาเลือก Channel และ Package ให้ครบ', 'VALIDATION');

  const candidate = addCandidates().find((c) => c.packageCode === packageCode && c.channelCode === channelCode);
  if (!candidate) {
    throw new AppError(409, `สร้าง Content ไม่ได้ — ${packageCode} (${channelCode}) มี Content อยู่แล้ว หรือไม่อยู่ในเงื่อนไขของ Add Package`, 'NOT_AVAILABLE');
  }

  const db = getDb();
  const last = db.prepare("SELECT MAX(CAST(SUBSTR(content_code, 3) AS INTEGER)) AS n FROM content").get() as { n: number | null };
  const code = `CT${String((last.n ?? 0) + 1).padStart(6, '0')}`;
  db.prepare(
    `INSERT INTO content (content_code, package_code, channel_code, template_code, status, created_by)
     VALUES (?, ?, ?, ?, 'DRAFT', ?)`,
  ).run(code, packageCode, channelCode, candidate.template, userId);

  const row = db.prepare(`${BASE_SELECT} WHERE c.content_code = ?`).get(code) as DbRow;
  return toRow(row);
}

/** ช่องทางชำระเบี้ยที่แสดงบนหน้าเว็บ (DRV — OB-09) ตาม Mapping MS-03 ของช่องทางนั้น; ไม่มี Mapping → แสดงทุกวิธีของ Package */
function paymentMethodsShown(packageCode: string, channelCode: string): { code: string; text: string }[] {
  const db = getDb();
  const methods = db
    .prepare(
      `SELECT a.code, m.name_th FROM package_attribute a
         LEFT JOIN synced_master m ON m.master_type = 'PAYMENT_METHOD' AND m.code = a.code
        WHERE a.package_code = ? AND a.attr_type = 'PAYMENT_METHOD' ORDER BY a.code`,
    )
    .all(packageCode) as DbRow[];
  const maps = db
    .prepare("SELECT code, display_text, is_shown FROM display_mapping WHERE mapping_type = 'PAYMENT_METHOD' AND channel_code IN (?, '*')")
    .all(channelCode) as DbRow[];
  if (!maps.length) return methods.map((m) => ({ code: String(m['code']), text: String(m['name_th'] ?? m['code']) }));
  const byCode = new Map(maps.map((m) => [String(m['code']), m]));
  return methods
    .filter((m) => byCode.get(String(m['code']))?.['is_shown'] === 1)
    .map((m) => ({ code: String(m['code']), text: String(byCode.get(String(m['code']))?.['display_text'] || m['name_th']) }));
}

function parseData(raw: unknown): Record<string, unknown> {
  try {
    return JSON.parse(String(raw ?? '{}')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** รายละเอียด Content 1 รายการ (หน้า Content Editor — แสดงเฉพาะ Template ของ Content นี้) */
export function getContent(code: string) {
  const db = getDb();
  const row = db.prepare(`${BASE_SELECT} WHERE c.content_code = ?`).get(code) as DbRow | undefined;
  if (!row) throw new AppError(404, `ไม่พบ Content ${code}`, 'NOT_FOUND');
  const pkg = getPackageDetail(String(row['package_code']));
  if (!pkg) throw new AppError(404, `ไม่พบ Package ${row['package_code']}`, 'NOT_FOUND');
  const masterPlans = pkg.plans.filter((p) => p.planRole === 'MASTER');
  return {
    ...toRow(row),
    saleStartDate: pkg.saleStartDate,
    saleEndDate: pkg.saleEndDate,
    productTypeCode: pkg.productTypeCode,
    productTypeName: pkg.productTypeName,
    subProductTypeCode: pkg.subProductTypeCode,
    subProductTypeName: pkg.subProductTypeName,
    plans: masterPlans.map((p) => ({ planCode: p.planCode, planName: p.planName })),
    package: pkg,
    paymentMethodsShown: paymentMethodsShown(String(row['package_code']), String(row['channel_code'])),
    data: parseData(row['content_data']),
  };
}

// ---------------------------------------------------------------- บันทึก / ส่งอนุมัติ
export interface SaveContentInput {
  data?: Record<string, unknown>;
  startDate?: string | null;
  endDate?: string | null;
}

const EDITABLE = ['DRAFT', 'REJECTED'];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** FD-09: Start ≥ max(วันนี้, วันเริ่มขาย Package) · End ≤ วันสิ้นสุด Package (ไม่ระบุ = ไม่จำกัด) · Start ≤ End */
function checkDisplayPeriod(start: string | null, end: string | null, saleStart: string | null, saleEnd: string | null): void {
  const min = saleStart && saleStart > today() ? saleStart : today();
  const fmt = (d: string) => d.split('-').reverse().join('/');
  const range = `ช่วงแสดงผลต้องอยู่ระหว่าง ${fmt(min)} – ${saleEnd ? fmt(saleEnd) : 'ไม่จำกัด'}`;
  if (start && start < min) throw new AppError(400, range, 'VALIDATION');
  if (end && saleEnd && end > saleEnd) throw new AppError(400, range, 'VALIDATION');
  if (start && end && start > end) throw new AppError(400, 'Start Date ต้องไม่เกิน End Date', 'VALIDATION');
}

/** บันทึกร่าง — แก้ได้เฉพาะ Content สถานะ Draft / ตีกลับ (Approved ต้องออก Version ใหม่ — D-07, ทำในขั้นถัดไป) */
export function saveContent(code: string, input: SaveContentInput, userId: string) {
  const current = getContent(code);
  if (!EDITABLE.includes(current.status)) {
    throw new AppError(409, `แก้ไขได้เฉพาะ Content สถานะ Draft (ตอนนี้เป็น ${current.displayStatus})`, 'NOT_EDITABLE');
  }
  const start = input.startDate || null;
  const end = input.endDate || null;
  checkDisplayPeriod(start, end, current.saleStartDate, current.saleEndDate);

  const data = input.data ?? current.data;
  const slug = String((data['page'] as Record<string, unknown> | undefined)?.['slug'] ?? '').trim();
  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new AppError(400, 'URL slug ใช้ได้เฉพาะ a-z, 0-9 และขีด (-)', 'VALIDATION');
    const dup = getDb()
      .prepare("SELECT content_code FROM content WHERE content_code <> ? AND json_extract(content_data, '$.page.slug') = ?")
      .get(code, slug) as DbRow | undefined;
    if (dup) throw new AppError(409, `URL slug "${slug}" ถูกใช้แล้วใน ${dup['content_code']}`, 'DUPLICATE');
  }

  getDb()
    .prepare(
      `UPDATE content SET content_data = ?, display_start_date = ?, display_end_date = ?,
              updated_at = datetime('now', 'localtime') WHERE content_code = ?`,
    )
    .run(JSON.stringify(data), start, end, code);
  void userId;
  return getContent(code);
}

type Obj = Record<string, unknown>;
const get = (o: Obj, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v as Obj | undefined)?.[k], o);
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';

/** Field บังคับ (*) ตาม Figma ของแต่ละ Template */
const REQUIRED: Record<TemplateCode, [string, string][]> = {
  // OL_OB — Figma V2 (27 ก.ย.): Content information / Banner display
  OL_OB: [
    ['page.slug', 'Content information: URL slug'],
    ['page.category', 'Content information: หมวดสินค้า'],
    ['hero.headline', 'Banner display: Title text'],
  ],
  OL_PA: [
    ['page.slug', 'OB-01 URL slug'],
    ['page.category', 'OB-01 หมวดสินค้า'],
    ['hero.displayName', 'OB-02 ชื่อแสดงผล'],
    ['hero.headline', 'OB-02 Headline'],
    ['quickFacts.premium', 'PA-03 เบี้ยประกันเริ่มต้น'],
    ['quickFacts.coveragePeriod', 'PA-03 ระยะเวลาคุ้มครอง'],
  ],
  AGENT: [
    ['page.slug', 'OB-01 URL slug'],
    ['page.category', 'OB-01 หมวดสินค้า'],
    ['hero.displayName', 'OB-02 ชื่อแสดงผล'],
    ['hero.headline', 'OB-02 Headline'],
    ['sticky.minPremium', 'OB-04 เบี้ยประกันเริ่มต้น'],
  ],
};

/** ส่งอนุมัติ — บันทึกก่อน แล้วตรวจ Field บังคับ → สถานะ Pending (Approver ≠ Maker — D-06 ตรวจตอนอนุมัติ) */
export function submitContent(code: string, input: SaveContentInput, userId: string) {
  const saved = saveContent(code, input, userId);
  const missing = REQUIRED[saved.template].filter(([path]) => blank(get(saved.data, path))).map(([, label]) => label);
  if (!saved.startDate) missing.unshift(saved.template === 'OL_OB' ? 'Content information: Start Date' : 'OB-01 ช่วงแสดงผล Start Date');
  if (missing.length) {
    throw new AppError(400, `กรอกข้อมูลให้ครบก่อนส่งอนุมัติ: ${missing.join(', ')}`, 'VALIDATION');
  }
  getDb()
    .prepare("UPDATE content SET status = 'PENDING', reject_reason = NULL, updated_at = datetime('now', 'localtime') WHERE content_code = ?")
    .run(code);
  log(code, saved.versionNo, 'SUBMIT', null, userId);
  return getContent(code);
}

// ---------------------------------------------------------------- อนุมัติ / ตีกลับ / Version ใหม่ (CT-06 · D-06, D-07)
function log(code: string, version: number, action: string, reason: string | null, userId: string): void {
  getDb()
    .prepare("INSERT INTO approval_log (object_type, object_code, version_no, action, reason, actor_id) VALUES ('CONTENT', ?, ?, ?, ?, ?)")
    .run(code, version, action, reason, userId);
}

export function contentHistory(code: string) {
  return (
    getDb()
      .prepare(
        `SELECT l.*, u.user_name FROM approval_log l LEFT JOIN app_user u ON u.user_id = l.actor_id
          WHERE l.object_type = 'CONTENT' AND l.object_code = ? ORDER BY l.created_at DESC, l.log_id DESC`,
      )
      .all(code) as DbRow[]
  ).map((r) => ({
    action: String(r['action']),
    versionNo: Number(r['version_no']),
    reason: r['reason'] as string | null,
    actorName: r['user_name'] as string | null,
    createdAt: String(r['created_at']),
  }));
}

/** หน้าอนุมัติ: Content ปัจจุบัน + Version ล่าสุดที่อนุมัติ (ใช้เทียบสิ่งที่เปลี่ยน) + ประวัติ */
export function contentReview(code: string) {
  const content = getContent(code);
  const prev = getDb()
    .prepare(
      `SELECT v.*, u.user_name FROM content_version v LEFT JOIN app_user u ON u.user_id = v.approved_by
        WHERE v.content_code = ? AND v.version_no < ? ORDER BY v.version_no DESC LIMIT 1`,
    )
    .get(code, content.versionNo) as DbRow | undefined;
  const history = contentHistory(code);
  return {
    content,
    previous: prev
      ? {
          versionNo: Number(prev['version_no']),
          data: parseData(prev['content_data']),
          startDate: prev['display_start_date'] as string | null,
          endDate: prev['display_end_date'] as string | null,
          approvedByName: prev['user_name'] as string | null,
          approvedAt: prev['approved_at'] as string | null,
        }
      : null,
    submittedAt: history.find((h) => h.action === 'SUBMIT' && h.versionNo === content.versionNo)?.createdAt ?? content.updatedAt,
    history,
  };
}

function requireStatus(status: string, expected: string, action: string): void {
  if (status !== expected) throw new AppError(409, `${action}ได้เฉพาะ Content สถานะ ${expected} (ตอนนี้เป็น ${status})`, 'INVALID_STATUS');
}

export function approveContent(code: string, userId: string) {
  const c = getContent(code);
  requireStatus(c.status, 'PENDING', 'อนุมัติ');
  if (c.createdBy === userId) throw new AppError(403, 'อนุมัติงานที่ตัวเองสร้างไม่ได้ (ผู้อนุมัติต้องไม่ใช่ผู้สร้าง — D-06)', 'SELF_APPROVAL');
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO content_version (content_code, version_no, content_data, display_start_date, display_end_date, approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
  ).run(code, c.versionNo, JSON.stringify(c.data), c.startDate, c.endDate, userId);
  db.prepare(
    `UPDATE content SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now', 'localtime'), reject_reason = NULL,
            updated_at = datetime('now', 'localtime') WHERE content_code = ?`,
  ).run(userId, code);
  log(code, c.versionNo, 'APPROVE', null, userId);
  return getContent(code);
}

export function rejectContent(code: string, reason: string | undefined, userId: string) {
  const c = getContent(code);
  requireStatus(c.status, 'PENDING', 'ตีกลับ');
  if (c.createdBy === userId) throw new AppError(403, 'ตีกลับงานที่ตัวเองสร้างไม่ได้ (ผู้อนุมัติต้องไม่ใช่ผู้สร้าง — D-06)', 'SELF_APPROVAL');
  const text = String(reason ?? '').trim();
  if (!text) throw new AppError(400, 'กรุณาระบุเหตุผลที่ตีกลับ', 'VALIDATION');
  getDb()
    .prepare("UPDATE content SET status = 'REJECTED', reject_reason = ?, updated_at = datetime('now', 'localtime') WHERE content_code = ?")
    .run(text, code);
  log(code, c.versionNo, 'REJECT', text, userId);
  return getContent(code);
}

/** D-07: แก้ Content ที่ Active → ออก Version ใหม่ (Draft) · หน้าเว็บยังใช้ Version ที่อนุมัติล่าสุดจนกว่า Version ใหม่จะอนุมัติ */
export function newContentVersion(code: string, userId: string) {
  const c = getContent(code);
  requireStatus(c.status, 'APPROVED', 'สร้าง Version ใหม่');
  getDb()
    .prepare(
      `UPDATE content SET status = 'DRAFT', version_no = version_no + 1, approved_by = NULL, approved_at = NULL,
              updated_at = datetime('now', 'localtime') WHERE content_code = ?`,
    )
    .run(code);
  log(code, c.versionNo + 1, 'NEW_VERSION', null, userId);
  return getContent(code);
}
