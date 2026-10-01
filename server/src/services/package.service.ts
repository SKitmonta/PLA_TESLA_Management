/**
 * อ่านข้อมูล Package Master — ใช้ร่วมกันระหว่างเมนู Master setup (MS-01) และเมนู Package (Add Package, Sprint 2)
 */
import { getDb } from '../db/database.js';
import { resolveTemplate, type TemplateCode } from './template-resolver.js';

export interface PackageListQuery {
  search?: string;
  code?: string;
  name?: string;
  channel?: string;
  productType?: string;
  subProductType?: string;
  status?: string; // APPROVED | DRAFTED | INACTIVE
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PackageRow {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  statusCode: 'APP' | 'DRF';
  isActive: boolean;
  displayStatus: 'APPROVED' | 'DRAFTED' | 'INACTIVE';
  saleStartDate: string | null;
  saleEndDate: string | null;
  sellerSelectionMode: 'ALL' | 'CUSTOM';
  sellerCount: number;
  productTypeCode: string | null;
  productTypeName: string | null;
  subProductTypeCode: string | null;
  subProductTypeName: string | null;
  channels: { code: string; name: string | null; template: TemplateCode | null }[];
  saleTarget: number | null;
  isMock: boolean;
}

const SORTABLE: Record<string, string> = {
  packageCode: 'p.package_code',
  nameTh: 'p.name_th',
  saleStartDate: 'p.sale_start_date',
  saleEndDate: 'p.sale_end_date',
  productType: 'pl.product_type_code',
  status: 'display_status',
};

const BASE_SELECT = `
  SELECT p.*, pl.product_type_code, pl.sub_product_type_code,
         pt.name_th AS product_type_name, st.name_th AS sub_type_name,
         CASE WHEN p.is_active = 0 THEN 'INACTIVE' WHEN p.status_code = 'DRF' THEN 'DRAFTED' ELSE 'APPROVED' END AS display_status,
         (SELECT COUNT(*) FROM package_seller s WHERE s.package_code = p.package_code) AS seller_count,
         (SELECT GROUP_CONCAT(c.channel_code) FROM package_channel c WHERE c.package_code = p.package_code) AS channel_codes
    FROM package p
    -- 1 Package มีได้หลายแผน (เช่น คิดส์ พีเอ) → ใช้แผน MASTER แรกเพื่อแสดง 1 แถวต่อ Package
    LEFT JOIN package_plan pl ON pl.package_code = p.package_code AND pl.plan_role = 'MASTER'
         AND pl.plan_code = (SELECT MIN(x.plan_code) FROM package_plan x WHERE x.package_code = p.package_code AND x.plan_role = 'MASTER')
    LEFT JOIN synced_master pt ON pt.master_type = 'PRODUCT_TYPE' AND pt.code = pl.product_type_code
    LEFT JOIN synced_master st ON st.master_type = 'SUB_PRODUCT_TYPE' AND st.code = pl.sub_product_type_code`;

type DbRow = Record<string, string | number | null>;

function channelNames(): Map<string, string | null> {
  const rows = getDb().prepare("SELECT code, name_en FROM synced_master WHERE master_type = 'CHANNEL'").all() as DbRow[];
  return new Map(rows.map((r) => [String(r['code']), r['name_en'] as string | null]));
}

function toRow(r: DbRow, names: Map<string, string | null>): PackageRow {
  const pty = r['product_type_code'] as string | null;
  const codes = r['channel_codes'] ? String(r['channel_codes']).split(',').sort() : [];
  return {
    packageCode: String(r['package_code']),
    nameTh: String(r['name_th']),
    nameEn: r['name_en'] as string | null,
    statusCode: r['status_code'] as 'APP' | 'DRF',
    isActive: r['is_active'] === 1,
    displayStatus: r['display_status'] as PackageRow['displayStatus'],
    saleStartDate: r['sale_start_date'] as string | null,
    saleEndDate: r['sale_end_date'] as string | null,
    sellerSelectionMode: r['seller_selection_mode'] as 'ALL' | 'CUSTOM',
    sellerCount: Number(r['seller_count'] ?? 0),
    productTypeCode: pty,
    productTypeName: r['product_type_name'] as string | null,
    subProductTypeCode: r['sub_product_type_code'] as string | null,
    subProductTypeName: r['sub_type_name'] as string | null,
    channels: codes.map((c) => ({ code: c, name: names.get(c) ?? null, template: resolveTemplate(c, pty) })),
    saleTarget: r['sale_target'] as number | null,
    isMock: r['is_mock'] === 1,
  };
}

export function listPackages(q: PackageListQuery) {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (q.search) {
    where.push('(p.package_code LIKE ? OR p.name_th LIKE ? OR p.name_en LIKE ?)');
    params.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
  }
  if (q.code) {
    where.push('p.package_code LIKE ?');
    params.push(`%${q.code}%`);
  }
  if (q.name) {
    where.push('(p.name_th LIKE ? OR p.name_en LIKE ?)');
    params.push(`%${q.name}%`, `%${q.name}%`);
  }
  if (q.channel) {
    where.push('EXISTS (SELECT 1 FROM package_channel c WHERE c.package_code = p.package_code AND c.channel_code = ?)');
    params.push(q.channel);
  }
  if (q.productType) {
    where.push('pl.product_type_code = ?');
    params.push(q.productType);
  }
  if (q.subProductType) {
    where.push('pl.sub_product_type_code = ?');
    params.push(q.subProductType);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // สรุปจำนวนตามสถานะ (คำนวณก่อนกรองสถานะ เพื่อให้การ์ดสรุปแสดงครบ)
  const all = db.prepare(`${BASE_SELECT} ${whereSql}`).all(...params) as DbRow[];
  const summary = {
    total: all.length,
    approved: all.filter((r) => r['display_status'] === 'APPROVED').length,
    drafted: all.filter((r) => r['display_status'] === 'DRAFTED').length,
    inactive: all.filter((r) => r['display_status'] === 'INACTIVE').length,
  };

  let statusSql = '';
  if (q.status) {
    statusSql = `${whereSql ? ' AND' : 'WHERE'} (CASE WHEN p.is_active = 0 THEN 'INACTIVE' WHEN p.status_code = 'DRF' THEN 'DRAFTED' ELSE 'APPROVED' END) = ?`;
    params.push(q.status);
  }

  const sortCol = SORTABLE[q.sort ?? ''] ?? 'p.package_code';
  const dir = q.dir === 'desc' ? 'DESC' : 'ASC';
  const pageSize = Math.min(Math.max(Number(q.pageSize) || 10, 1), 100);
  const page = Math.max(Number(q.page) || 1, 1);

  const filtered = db.prepare(`${BASE_SELECT} ${whereSql}${statusSql} ORDER BY ${sortCol} ${dir} NULLS LAST, p.package_code`).all(...params) as DbRow[];
  const names = channelNames();
  const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((r) => toRow(r, names));

  return { items, total: filtered.length, page, pageSize, summary, lastSync: lastSync('PACKAGE') };
}

export function lastSync(scope: 'PACKAGE' | 'MASTER'): string | null {
  const row = getDb().prepare('SELECT MAX(synced_at) AS t FROM sync_log WHERE scope = ?').get(scope) as { t: string | null };
  return row.t;
}

function masterName(type: string, code: string | null | undefined): string | null {
  if (!code) return null;
  const row = getDb().prepare('SELECT name_th FROM synced_master WHERE master_type = ? AND code = ?').get(type, code) as { name_th: string } | undefined;
  return row?.name_th ?? null;
}

function ageText(age: number | null, method: string | null): string {
  if (age === null) return '–';
  return method === 'ISDY' ? `${age} วัน` : `${age} ปี`;
}

/** รายละเอียด Package สำหรับหน้า MS-01 (แยกที่มา PKG = จาก Payload, DRV = ระบบแปลง/คำนวณ) */
export function getPackageDetail(code: string) {
  const db = getDb();
  const row = db.prepare(`${BASE_SELECT} WHERE p.package_code = ?`).get(code) as DbRow | undefined;
  if (!row) return null;
  const base = toRow(row, channelNames());

  const plans = (db.prepare('SELECT * FROM package_plan WHERE package_code = ? ORDER BY plan_role DESC, plan_code').all(code) as DbRow[]).map((p) => ({
    planCode: String(p['plan_code']),
    planName: p['plan_name'] as string | null,
    planRole: String(p['plan_role']),
    productTypeCode: p['product_type_code'] as string | null,
    subProductTypeCode: p['sub_product_type_code'] as string | null,
    minSumInsured: p['min_sum_insured'] as number | null,
    maxSumInsured: p['max_sum_insured'] as number | null,
    taxExemptType: p['tax_exempt_type'] as string | null,
    minIssueAge: ageText(p['min_issue_age'] as number | null, p['min_issue_age_method'] as string | null),
    maxIssueAge: ageText(p['max_issue_age'] as number | null, p['max_issue_age_method'] as string | null),
    minIssueAgeMethod: p['min_issue_age_method'] as string | null,
    maxIssueAgeMethod: p['max_issue_age_method'] as string | null,
    underwriteType: p['underwrite_type'] as string | null,
  }));
  const master = plans.find((p) => p.planRole === 'MASTER');

  const attrs = db
    .prepare(
      `SELECT a.attr_type, a.code, m.name_th FROM package_attribute a
         LEFT JOIN synced_master m ON m.master_type = a.attr_type AND m.code = a.code
        WHERE a.package_code = ? ORDER BY a.attr_type, a.code`,
    )
    .all(code) as DbRow[];
  const byType = (t: string) => attrs.filter((a) => a['attr_type'] === t).map((a) => ({ code: String(a['code']), name: a['name_th'] as string | null }));

  const sellers = (db.prepare('SELECT channel_code, seller_code, seller_name FROM package_seller WHERE package_code = ? ORDER BY seller_code').all(code) as DbRow[]).map((s) => ({
    channelCode: String(s['channel_code']),
    sellerCode: String(s['seller_code']),
    sellerName: s['seller_name'] as string | null,
  }));

  const uwText = master?.underwriteType
    ? (db.prepare("SELECT display_text FROM display_mapping WHERE mapping_type = 'UNDERWRITE' AND code = ? AND channel_code = '*'").get(master.underwriteType) as { display_text: string } | undefined)?.display_text ?? null
    : null;
  const riders = plans.filter((p) => p.planRole === 'RIDER');

  return {
    ...base,
    packageType: row['package_type'] as string | null,
    description: row['description'] as string | null,
    freeLookPeriod: row['free_look_period'] as number | null,
    syncedAt: row['synced_at'] as string | null,
    plans,
    sellers,
    paymentModes: byType('PAYMENT_MODE'),
    paymentMethods: byType('PAYMENT_METHOD'),
    genders: byType('GENDER'),
    occupationClasses: byType('OCCUPATION_CLASS'),
    derived: {
      productTypeName: masterName('PRODUCT_TYPE', master?.productTypeCode),
      subProductTypeName: masterName('SUB_PRODUCT_TYPE', master?.subProductTypeCode),
      underwriteName: masterName('UNDERWRITE_TYPE', master?.underwriteType),
      underwriteDisplay: uwText,
      taxDisplay: master?.taxExemptType && master.taxExemptType !== 'NONE' ? 'ลดหย่อนภาษีได้' : 'ลดหย่อนภาษีไม่ได้',
      riderDisplay: riders.length ? `ซื้อได้ ${riders.length} สัญญา` : 'ซื้อสัญญาเพิ่มเติมไม่ได้',
      ageDisplay: master ? `${master.minIssueAge} – ${master.maxIssueAge}` : '–',
    },
  };
}
