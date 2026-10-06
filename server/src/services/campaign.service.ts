/**
 * Campaign — เมนู Campaign › Campaign list (CP-01) และ Add Campaign (Wizard 5 ขั้น CP-02…CP-06) — doc 06
 *   ขั้น 1 เลือกประเภท (MS-01) · ขั้น 2 ข้อมูลทั่วไป (CP-COM) · ขั้น 3 สิทธิประโยชน์ (CP-VOU…CP-LKD)
 *   ขั้น 4 เงื่อนไขผู้มีสิทธิ์ (CP-ELG — ข้ามสำหรับ Referral) · ขั้น 5 ตรวจสอบ & ส่งอนุมัติ
 * กติกา: CC-01 ช่วงวันในกรอบ Package · Channel ⊆ ช่องทางของ Package · ประเภทเดียวกันใน Package เดียวห้ามช่วงวันทับซ้อน
 */
import { getDb } from '../db/database.js';
import { AppError } from '../middleware/error-handler.js';

type DbRow = Record<string, string | number | null>;
type Obj = Record<string, unknown>;

/** รหัสย่อใน Campaign Code (CP-COM-01) */
export const TYPE_ABBR: Record<string, string> = {
  VOUCHER: 'VOU',
  DISCOUNT: 'DIS',
  CASHBACK: 'CSB',
  FREE_GIFT: 'GFT',
  INSTALLMENT: 'INS',
  REWARD_POINTS: 'PTS',
  REFERRAL: 'REF',
  BUNDLE: 'BND',
  LUCKY_DRAW: 'LKD',
};

export type CampaignDisplayStatus = 'ACTIVE' | 'SCHEDULED' | 'PENDING' | 'DRAFT' | 'EXPIRED' | 'SUSPENDED' | 'CLOSED' | 'INACTIVE';

const TODAY_SQL = "date('now', 'localtime')";
const DISPLAY_SQL = `CASE c.status
  WHEN 'APPROVED' THEN CASE WHEN c.start_date > ${TODAY_SQL} THEN 'SCHEDULED'
                            WHEN c.end_date IS NOT NULL AND c.end_date < ${TODAY_SQL} THEN 'EXPIRED'
                            ELSE 'ACTIVE' END
  WHEN 'PENDING' THEN 'PENDING' WHEN 'SUSPENDED' THEN 'SUSPENDED' WHEN 'CLOSED' THEN 'CLOSED' WHEN 'INACTIVE' THEN 'INACTIVE'
  ELSE 'DRAFT' END`;

const BASE_SELECT = `
  SELECT c.*, t.name_th AS type_name_th, t.name_en AS type_name_en,
         u.user_name AS created_by_name, a.user_name AS approved_by_name,
         ${DISPLAY_SQL} AS display_status,
         (SELECT COALESCE(SUM(g.benefit_value), 0) FROM campaign_grant g
           WHERE g.campaign_code = c.campaign_code AND g.status IN ('CONFIRMED','FULFILLED')) AS budget_used,
         (SELECT COUNT(*) FROM campaign_grant g
           WHERE g.campaign_code = c.campaign_code AND g.status IN ('CONFIRMED','FULFILLED')) AS quota_used
    FROM campaign c
    LEFT JOIN custom_master_item t ON t.type_code = 'MS-01' AND t.item_code = c.type_code
    LEFT JOIN app_user u ON u.user_id = c.created_by
    LEFT JOIN app_user a ON a.user_id = c.approved_by`;

export interface CampaignListQuery {
  code?: string;
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  channel?: string;
  status?: CampaignDisplayStatus | 'ENDED' | 'EXPIRING' | '';
  createdBy?: string;
  approvedBy?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

const SORTABLE: Record<string, string> = {
  campaignCode: 'c.campaign_code',
  nameTh: 'c.name_th',
  type: 'type_name_en',
  startDate: 'c.start_date',
  endDate: 'c.end_date',
  status: 'display_status',
  createdBy: 'u.user_name',
  approvedBy: 'a.user_name',
};

function parse<T>(raw: unknown, fallback: T): T {
  try {
    return JSON.parse(String(raw ?? '')) as T;
  } catch {
    return fallback;
  }
}

let channelCache: Map<string, string | null> | null = null;
function channelName(code: string): string | null {
  if (!channelCache) {
    const rows = getDb().prepare("SELECT code, name_en FROM synced_master WHERE master_type = 'CHANNEL'").all() as DbRow[];
    channelCache = new Map(rows.map((r) => [String(r['code']), r['name_en'] as string | null]));
  }
  return channelCache.get(code) ?? null;
}

function toRow(r: DbRow) {
  const channels = parse<string[]>(r['channel_codes'], []);
  const data = parse<Obj>(r['campaign_data'], {});
  return {
    campaignCode: String(r['campaign_code']),
    typeCode: String(r['type_code']),
    typeNameTh: r['type_name_th'] as string | null,
    typeNameEn: r['type_name_en'] as string | null,
    nameTh: String(r['name_th'] ?? ''),
    nameEn: r['name_en'] as string | null,
    status: String(r['status']),
    displayStatus: r['display_status'] as CampaignDisplayStatus,
    versionNo: Number(r['version_no']),
    startDate: r['start_date'] as string | null,
    endDate: r['end_date'] as string | null,
    packageCodes: parse<string[]>(r['package_codes'], []),
    channelCodes: channels,
    channels: channels.map((c) => ({ code: c, name: channelName(c) })),
    budget: (data['budget'] as number | null | undefined) ?? null,
    budgetUsed: Number(r['budget_used'] ?? 0),
    quotaTotal: (data['quotaTotal'] as number | null | undefined) ?? null,
    quotaUsed: Number(r['quota_used'] ?? 0),
    createdBy: r['created_by'] as string | null,
    createdByName: r['created_by_name'] as string | null,
    approvedByName: r['approved_by_name'] as string | null,
    rejectReason: r['reject_reason'] as string | null,
    isMock: r['is_mock'] === 1,
    updatedAt: String(r['updated_at']),
  };
}

export type CampaignRow = ReturnType<typeof toRow>;

// ---------------------------------------------------------------- CP-01 รายการ
export function listCampaigns(q: CampaignListQuery) {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];
  const like = (sql: string, v: string | undefined, n = 1) => {
    if (!v) return;
    where.push(sql);
    for (let i = 0; i < n; i++) params.push(`%${v}%`);
  };
  like('c.campaign_code LIKE ?', q.code);
  like('(c.name_th LIKE ? OR c.name_en LIKE ?)', q.name, 2);
  like('u.user_name LIKE ?', q.createdBy);
  like('a.user_name LIKE ?', q.approvedBy);
  if (q.type) {
    where.push('c.type_code = ?');
    params.push(q.type);
  }
  if (q.startDate) {
    where.push('c.start_date = ?');
    params.push(q.startDate);
  }
  if (q.endDate) {
    where.push('c.end_date = ?');
    params.push(q.endDate);
  }
  if (q.channel) {
    where.push('EXISTS (SELECT 1 FROM json_each(c.channel_codes) j WHERE j.value = ?)');
    params.push(q.channel);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // การ์ดสรุป: นับก่อนกรองสถานะ (กดการ์ด = กรองสถานะนั้น)
  const all = db.prepare(`${BASE_SELECT} ${whereSql}`).all(...params) as DbRow[];
  const count = (...s: string[]) => all.filter((r) => s.includes(String(r['display_status']))).length;
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const summary = {
    total: all.length,
    expiring: all.filter((r) => r['display_status'] === 'ACTIVE' && r['end_date'] && String(r['end_date']) <= in7).length,
    active: count('ACTIVE'),
    scheduled: count('SCHEDULED'),
    pending: count('PENDING'),
    draft: count('DRAFT'),
    ended: count('EXPIRED', 'SUSPENDED', 'CLOSED', 'INACTIVE'),
  };

  let statusSql = '';
  if (q.status === 'EXPIRING') {
    statusSql = `${whereSql ? ' AND' : 'WHERE'} ${DISPLAY_SQL} = 'ACTIVE' AND c.end_date IS NOT NULL AND c.end_date <= date('now', 'localtime', '+7 days')`;
  } else if (q.status === 'ENDED') {
    statusSql = `${whereSql ? ' AND' : 'WHERE'} ${DISPLAY_SQL} IN ('EXPIRED','SUSPENDED','CLOSED','INACTIVE')`;
  } else if (q.status) {
    statusSql = `${whereSql ? ' AND' : 'WHERE'} ${DISPLAY_SQL} = ?`;
    params.push(q.status);
  }

  const sortCol = SORTABLE[q.sort ?? ''] ?? 'c.campaign_code';
  const dir = q.dir === 'asc' ? 'ASC' : 'DESC';
  const pageSize = Math.min(Math.max(Number(q.pageSize) || 10, 1), 100);
  const page = Math.max(Number(q.page) || 1, 1);
  const filtered = db
    .prepare(`${BASE_SELECT} ${whereSql}${statusSql} ORDER BY ${sortCol} ${dir} NULLS LAST, c.campaign_code DESC`)
    .all(...params) as DbRow[];
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize).map(toRow), total: filtered.length, page, pageSize, summary };
}

// ---------------------------------------------------------------- ตัวเลือกใน Wizard
export interface CampaignPackageOption {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  productTypeName: string | null;
  channels: { code: string; name: string | null }[];
  contents: { contentCode: string; channelCode: string; template: string }[];
  isMock: boolean;
}

/** CP-COM-08: เฉพาะ Package ที่ Content Approved (ช่องทางที่เลือกได้ = ช่องทางของ Content ที่ Approved) */
export function packageOptions(): CampaignPackageOption[] {
  const rows = getDb()
    .prepare(
      `SELECT p.package_code, p.name_th, p.name_en, p.sale_start_date, p.sale_end_date, p.is_mock,
              pt.name_th AS product_type_name, c.content_code, c.channel_code, c.template_code
         FROM content c
         JOIN package p ON p.package_code = c.package_code AND p.status_code = 'APP' AND p.is_active = 1
         LEFT JOIN package_plan pl ON pl.package_code = p.package_code AND pl.plan_role = 'MASTER'
              AND pl.plan_code = (SELECT MIN(x.plan_code) FROM package_plan x WHERE x.package_code = p.package_code AND x.plan_role = 'MASTER')
         LEFT JOIN synced_master pt ON pt.master_type = 'PRODUCT_TYPE' AND pt.code = pl.product_type_code
        WHERE c.status = 'APPROVED'
        ORDER BY p.package_code, c.channel_code`,
    )
    .all() as DbRow[];
  const map = new Map<string, CampaignPackageOption>();
  for (const r of rows) {
    const code = String(r['package_code']);
    let o = map.get(code);
    if (!o) {
      o = {
        packageCode: code,
        nameTh: String(r['name_th']),
        nameEn: r['name_en'] as string | null,
        saleStartDate: r['sale_start_date'] as string | null,
        saleEndDate: r['sale_end_date'] as string | null,
        productTypeName: r['product_type_name'] as string | null,
        channels: [],
        contents: [],
        isMock: r['is_mock'] === 1,
      };
      map.set(code, o);
    }
    const ch = String(r['channel_code']);
    if (!o.channels.some((c) => c.code === ch)) o.channels.push({ code: ch, name: channelName(ch) });
    o.contents.push({ contentCode: String(r['content_code']), channelCode: ch, template: String(r['template_code']) });
  }
  return [...map.values()];
}

// ---------------------------------------------------------------- รายละเอียด
export function getCampaign(code: string) {
  const row = getDb().prepare(`${BASE_SELECT} WHERE c.campaign_code = ?`).get(code) as DbRow | undefined;
  if (!row) throw new AppError(404, `ไม่พบ Campaign ${code}`, 'NOT_FOUND');
  return { ...toRow(row), data: parse<Obj>(row['campaign_data'], {}) };
}

// ---------------------------------------------------------------- สร้าง / บันทึก / ส่งอนุมัติ
export interface SaveCampaignInput {
  typeCode?: string;
  nameTh?: string;
  nameEn?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  packageCodes?: string[];
  channelCodes?: string[];
  data?: Obj;
}

const EDITABLE = ['DRAFT', 'REJECTED'];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fmt = (d: string) => d.split('-').reverse().join('/');

function activeType(typeCode: string | undefined): string {
  if (!typeCode) throw new AppError(400, 'กรุณาเลือกประเภท Campaign', 'VALIDATION');
  const t = getDb()
    .prepare("SELECT item_code FROM custom_master_item WHERE type_code = 'MS-01' AND item_code = ? AND is_active = 1")
    .get(typeCode) as DbRow | undefined;
  if (!t || !TYPE_ABBR[typeCode]) throw new AppError(400, `ประเภท Campaign ${typeCode} ใช้ไม่ได้`, 'VALIDATION');
  return typeCode;
}

/** CP-COM-01: CMP-{TYPE}-{YYMM}-{Running} */
function nextCode(typeCode: string): string {
  const d = new Date();
  const prefix = `CMP-${TYPE_ABBR[typeCode]}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-`;
  const last = getDb()
    .prepare('SELECT MAX(CAST(SUBSTR(campaign_code, ?) AS INTEGER)) AS n FROM campaign WHERE campaign_code LIKE ?')
    .get(prefix.length + 1, `${prefix}%`) as { n: number | null };
  return `${prefix}${String((last.n ?? 0) + 1).padStart(4, '0')}`;
}

/** CC-01 + Channel ⊆ Package + Promo code — ตรวจทุกครั้งที่บันทึก (เฉพาะค่าที่กรอกแล้ว) */
function validate(code: string | null, v: Required<Omit<SaveCampaignInput, 'typeCode'>>): void {
  if (v.nameTh.length > 150 || (v.nameEn ?? '').length > 150) throw new AppError(400, 'ชื่อ Campaign ยาวได้ไม่เกิน 150 ตัวอักษร', 'VALIDATION');

  const options = new Map(packageOptions().map((p) => [p.packageCode, p]));
  const pkgs = v.packageCodes.map((c) => {
    const p = options.get(c);
    if (!p) throw new AppError(400, `Package ${c} ยังไม่มี Content ที่ Approved — เลือกไม่ได้`, 'VALIDATION');
    return p;
  });

  if (pkgs.length) {
    // กรอบวันที่แคบที่สุดของ Package ที่เลือก (BR-CP-001)
    const starts = pkgs.map((p) => p.saleStartDate).filter((d): d is string => !!d);
    const ends = pkgs.map((p) => p.saleEndDate).filter((d): d is string => !!d);
    const latestStart = starts.sort().at(-1);
    const min = latestStart && latestStart > today() ? latestStart : today();
    const max = ends.sort()[0] ?? null;
    const range = `ช่วงวัน Campaign ต้องอยู่ระหว่าง ${fmt(min)} – ${max ? fmt(max) : 'ไม่จำกัด'} (ตามกรอบ Package ที่เลือก)`;
    if (v.startDate && v.startDate < min) throw new AppError(400, range, 'VALIDATION');
    if (v.endDate && max && v.endDate > max) throw new AppError(400, range, 'VALIDATION');

    const allowed = new Set(pkgs.flatMap((p) => p.channels.map((c) => c.code)));
    const bad = v.channelCodes.filter((c) => !allowed.has(c));
    if (bad.length) throw new AppError(400, `ช่องทางขาย ${bad.join(', ')} ไม่อยู่ในช่องทางของ Package ที่เลือก`, 'VALIDATION');
  } else if (v.channelCodes.length) {
    throw new AppError(400, 'เลือก Package ก่อนเลือกช่องทางขาย', 'VALIDATION');
  }
  if (v.startDate && v.endDate && v.endDate <= v.startDate) throw new AppError(400, 'วันสิ้นสุดต้องหลังวันเริ่ม', 'VALIDATION');

  const promo = String(v.data['promoCode'] ?? '').trim();
  if (promo) {
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(promo)) throw new AppError(400, 'Promo code ใช้ได้เฉพาะ A-Z, 0-9, - และ _ ไม่เกิน 20 ตัว', 'VALIDATION');
    const dup = getDb()
      .prepare(
        `SELECT campaign_code FROM campaign WHERE campaign_code <> ? AND status IN ('PENDING','APPROVED')
            AND UPPER(json_extract(campaign_data, '$.promoCode')) = UPPER(?)`,
      )
      .get(code ?? '', promo) as DbRow | undefined;
    if (dup) throw new AppError(409, `Promo code "${promo}" ถูกใช้แล้วใน ${dup['campaign_code']}`, 'DUPLICATE');
  }
}

function normalize(input: SaveCampaignInput, current?: ReturnType<typeof getCampaign>) {
  return {
    nameTh: String(input.nameTh ?? current?.nameTh ?? '').trim(),
    nameEn: (input.nameEn ?? current?.nameEn ?? '')?.toString().trim() || null,
    startDate: input.startDate === undefined ? current?.startDate ?? null : input.startDate || null,
    endDate: input.endDate === undefined ? current?.endDate ?? null : input.endDate || null,
    packageCodes: [...new Set(input.packageCodes ?? current?.packageCodes ?? [])],
    channelCodes: [...new Set(input.channelCodes ?? current?.channelCodes ?? [])],
    data: input.data ?? current?.data ?? {},
  };
}

/** บันทึกร่างครั้งแรก — สร้าง Campaign Code (Campaign Maker) */
export function createCampaign(input: SaveCampaignInput, userId: string) {
  const type = activeType(input.typeCode);
  const v = normalize(input);
  validate(null, v);
  const code = nextCode(type);
  getDb()
    .prepare(
      `INSERT INTO campaign (campaign_code, type_code, name_th, name_en, status, start_date, end_date, package_codes, channel_codes, campaign_data, created_by)
       VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?)`,
    )
    .run(code, type, v.nameTh, v.nameEn, v.startDate, v.endDate, JSON.stringify(v.packageCodes), JSON.stringify(v.channelCodes), JSON.stringify(v.data), userId);
  return getCampaign(code);
}

/** บันทึกร่าง — แก้ได้เฉพาะ Draft / ตีกลับ · เปลี่ยนประเภทไม่ได้หลังบันทึก (CP-COM-03) */
export function saveCampaign(code: string, input: SaveCampaignInput, userId: string) {
  const current = getCampaign(code);
  if (!EDITABLE.includes(current.status)) {
    throw new AppError(409, `แก้ไขได้เฉพาะ Campaign สถานะ Draft (ตอนนี้เป็น ${current.displayStatus})`, 'NOT_EDITABLE');
  }
  if (input.typeCode && input.typeCode !== current.typeCode) {
    throw new AppError(400, 'เปลี่ยนประเภท Campaign ไม่ได้หลังบันทึกแล้ว — สร้าง Campaign ใหม่แทน', 'VALIDATION');
  }
  const v = normalize(input, current);
  validate(code, v);
  getDb()
    .prepare(
      `UPDATE campaign SET name_th = ?, name_en = ?, start_date = ?, end_date = ?, package_codes = ?, channel_codes = ?,
              campaign_data = ?, updated_at = datetime('now', 'localtime') WHERE campaign_code = ?`,
    )
    .run(v.nameTh, v.nameEn, v.startDate, v.endDate, JSON.stringify(v.packageCodes), JSON.stringify(v.channelCodes), JSON.stringify(v.data), code);
  void userId;
  return getCampaign(code);
}

const get = (o: Obj, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v as Obj | undefined)?.[k], o);
const blank = (v: unknown) => v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

/** Field บังคับของสิทธิประโยชน์แต่ละประเภท (doc 06 §4) — [path ใน data.benefit, ชื่อ, เงื่อนไขที่ต้องกรอก] */
const BENEFIT_REQUIRED: Record<string, [string, string, ((b: Obj) => boolean)?][]> = {
  VOUCHER: [
    ['voucherCode', 'Voucher ที่ให้'],
    ['mode', 'รูปแบบการให้'],
    ['perPolicy', 'จำนวนใบต่อกรมธรรม์', (b) => b['mode'] !== 'TIER'],
    ['tiers', 'ตาราง Tier', (b) => b['mode'] === 'TIER'],
    ['allocated', 'จำนวนที่จัดสรรให้ Campaign'],
    ['deliveryChannel', 'ช่องทางส่งมอบ'],
    ['codeSource', 'แหล่งรหัสคูปอง'],
  ],
  DISCOUNT: [
    ['discountType', 'รูปแบบส่วนลด'],
    ['value', 'มูลค่าส่วนลด'],
    ['basis', 'ฐานที่คำนวณ'],
    ['rounding', 'การปัดเศษ'],
  ],
  CASHBACK: [
    ['cashbackType', 'รูปแบบเงินคืน'],
    ['value', 'มูลค่า', (b) => b['cashbackType'] !== 'TIER'],
    ['tiers', 'ตาราง Tier', (b) => b['cashbackType'] === 'TIER'],
    ['basis', 'ฐานคำนวณ'],
    ['payoutMethod', 'ช่องทางจ่ายเงินคืน'],
    ['payoutTiming', 'กำหนดจ่าย'],
    ['recipient', 'ผู้รับเงินคืน'],
  ],
  FREE_GIFT: [
    ['giftCode', 'ของแถม'],
    ['perPolicy', 'จำนวนชิ้นต่อกรมธรรม์'],
    ['allocated', 'จำนวนที่จัดสรรให้ Campaign'],
    ['deliveryMethod', 'วิธีส่งมอบ'],
  ],
  INSTALLMENT: [
    ['banks', 'ธนาคาร / ผู้ออกบัตร'],
    ['terms', 'จำนวนงวด'],
    ['interestRate', 'อัตราดอกเบี้ย'],
    ['interestBearer', 'ผู้รับภาระดอกเบี้ย'],
    ['minPremiums', 'เบี้ยขั้นต่ำต่อจำนวนงวด'],
    ['paymentMethods', 'ช่องทางชำระที่ใช้ได้'],
  ],
  REWARD_POINTS: [
    ['program', 'โปรแกรมคะแนน'],
    ['points', 'อัตราได้คะแนน (คะแนน)'],
    ['perBaht', 'อัตราได้คะแนน (ต่อเบี้ย บาท)'],
  ],
  REFERRAL: [
    ['landingContent', 'หน้าปลายทางของลิงก์'],
    ['attributionDays', 'ช่วงนับผลหลังคลิก'],
  ],
  BUNDLE: [
    ['bundlePackages', 'Package ในชุด'],
    ['purchaseCondition', 'เงื่อนไขการซื้อ'],
    ['benefitType', 'รูปแบบสิทธิ์'],
    ['benefitValue', 'มูลค่าสิทธิ์'],
  ],
  LUCKY_DRAW: [
    ['prizes', 'รายการรางวัล'],
    ['perBaht', 'กติกาได้สิทธิ์ลุ้น'],
    ['drawDate', 'วันจับรางวัล'],
    ['announceDate', 'วันประกาศผล'],
    ['announceChannels', 'ช่องทางประกาศผล'],
    ['licenseNo', 'เลขที่ใบอนุญาตจัดชิงโชค'],
    ['licenseFile', 'ไฟล์ใบอนุญาต'],
    ['taxBearer', 'ภาษีของรางวัล'],
  ],
};

function stockLeft(typeCode: 'MS-10' | 'MS-16', item: string): number | null {
  const r = getDb().prepare('SELECT attributes FROM custom_master_item WHERE type_code = ? AND item_code = ?').get(typeCode, item) as DbRow | undefined;
  if (!r) return null;
  const a = parse<Obj>(r['attributes'], {});
  return Number(a['total_qty'] ?? 0) - Number(a['reserved_qty'] ?? 0) - Number(a['delivered_qty'] ?? 0);
}

/** ส่งอนุมัติ — บันทึกก่อน แล้วตรวจ Field บังคับ + ช่วงวันทับซ้อน → Pending (Approver ≠ Maker ตรวจตอนอนุมัติ) */
export function submitCampaign(code: string, input: SaveCampaignInput, userId: string) {
  const c = saveCampaign(code, input, userId);
  const d = c.data;
  const referral = c.typeCode === 'REFERRAL';
  const missing: string[] = [];
  const need = (ok: boolean, label: string) => !ok && missing.push(label);

  // ขั้น 2 ข้อมูลทั่วไป
  need(!!c.nameTh, 'ชื่อ Campaign (TH)');
  need(c.packageCodes.length > 0, 'Package ที่ใช้ได้');
  need(!!c.startDate, 'วันเริ่ม');
  need(!!c.endDate, 'วันสิ้นสุด');
  need(c.channelCodes.length > 0, 'ช่องทางขาย');
  need(!blank(d['tncTh']), 'ข้อกำหนดและเงื่อนไข (TH)');
  need(!blank(d['costCenter']), 'หน่วยงานเจ้าของ / Cost center');
  if (!referral) {
    need(!blank(d['rewardTiming']), 'จังหวะการให้สิทธิ์');
    need(!blank(d['clawback']), 'กติกาเรียกคืนสิทธิ์');
    need(!blank(d['bannerDesktop']), 'รูป Banner Desktop');
    need(!blank(d['bannerMobile']), 'รูป Banner Mobile');
    need(!blank(d['thumbnail']), 'รูป Thumbnail');
  }

  // ขั้น 3 สิทธิประโยชน์
  const b = (d['benefit'] as Obj | undefined) ?? {};
  for (const [path, label, when] of BENEFIT_REQUIRED[c.typeCode] ?? []) {
    if (when && !when(b)) continue;
    need(!blank(get(b, path)), label);
  }

  // ขั้น 4 เงื่อนไขผู้มีสิทธิ์ — ทุกข้อที่เพิ่มไว้ต้องกรอกครบ
  if (!referral) {
    const rules = (d['rules'] as Obj[] | undefined) ?? [];
    rules.forEach((r, i) => {
      const values = r['operator'] === 'BETWEEN' ? [r['value'], r['value2']] : [r['value']];
      need(!blank(r['attribute']) && !blank(r['operator']) && values.every((x) => !blank(x)), `เงื่อนไขข้อ ${i + 1}`);
    });
  }
  if (missing.length) throw new AppError(400, `กรอกข้อมูลให้ครบก่อนส่งอนุมัติ: ${missing.join(', ')}`, 'VALIDATION');

  // กติกาเฉพาะประเภท
  if (c.typeCode === 'VOUCHER' || c.typeCode === 'FREE_GIFT') {
    const item = String(b[c.typeCode === 'VOUCHER' ? 'voucherCode' : 'giftCode']);
    const left = stockLeft(c.typeCode === 'VOUCHER' ? 'MS-10' : 'MS-16', item);
    if (left !== null && Number(b['allocated']) > left) {
      throw new AppError(400, `จำนวนที่จัดสรร (${b['allocated']}) เกิน Stock คงเหลือของ ${item} (${left})`, 'VALIDATION');
    }
  }
  if (c.typeCode === 'DISCOUNT' && b['discountType'] === 'PERCENT' && Number(b['value']) > 100) {
    throw new AppError(400, 'ส่วนลดแบบ % ต้องไม่เกิน 100', 'VALIDATION');
  }
  if (c.typeCode === 'BUNDLE' && ((b['bundlePackages'] as unknown[]) ?? []).length < 2) {
    throw new AppError(400, 'Bundle ต้องมี Package ในชุดอย่างน้อย 2 รายการ', 'VALIDATION');
  }
  if (c.typeCode === 'LUCKY_DRAW') {
    if (String(b['drawDate']) <= String(c.endDate)) throw new AppError(400, 'วันจับรางวัลต้องหลังวันสิ้นสุด Campaign', 'VALIDATION');
    if (String(b['announceDate']) < String(b['drawDate'])) throw new AppError(400, 'วันประกาศผลต้องไม่ก่อนวันจับรางวัล', 'VALIDATION');
  }

  // ประเภทเดียวกันใน Package เดียวกันห้ามช่วงวันทับซ้อน
  assertNoOverlap(c);

  getDb()
    .prepare("UPDATE campaign SET status = 'PENDING', reject_reason = NULL, updated_at = datetime('now', 'localtime') WHERE campaign_code = ?")
    .run(code);
  log(code, c.versionNo, 'SUBMIT', null, userId);
  return getCampaign(code);
}

// ---------------------------------------------------------------- ช่วงวันทับซ้อน (ประเภทเดียวกัน × Package เดียวกัน)
export interface OverlapQuery {
  type?: string;
  packages?: string;
  start?: string;
  end?: string;
  exclude?: string;
}

/** Campaign ประเภทเดียวกันที่ใช้ Package เดียวกันและช่วงวันทับกัน (นับเฉพาะ Pending / Approved / Suspended) */
export function findOverlaps(q: OverlapQuery) {
  const packages = String(q.packages ?? '').split(',').filter(Boolean);
  if (!q.type || !packages.length || !q.start) return [];
  const rows = getDb()
    .prepare(
      `SELECT campaign_code, name_th, start_date, end_date, package_codes, status FROM campaign
        WHERE campaign_code <> ? AND type_code = ? AND status IN ('PENDING','APPROVED','SUSPENDED')
          AND (end_date IS NULL OR end_date >= ?) AND (? IS NULL OR start_date <= ?)`,
    )
    .all(q.exclude ?? '', q.type, q.start, q.end || null, q.end || null) as DbRow[];
  return rows
    .map((o) => ({
      campaignCode: String(o['campaign_code']),
      nameTh: String(o['name_th']),
      status: String(o['status']),
      startDate: o['start_date'] as string | null,
      endDate: o['end_date'] as string | null,
      sharedPackages: parse<string[]>(o['package_codes'], []).filter((p) => packages.includes(p)),
    }))
    .filter((o) => o.sharedPackages.length);
}

function assertNoOverlap(c: { campaignCode: string; typeCode: string; packageCodes: string[]; startDate: string | null; endDate: string | null }): void {
  const [o] = findOverlaps({ type: c.typeCode, packages: c.packageCodes.join(','), start: c.startDate ?? undefined, end: c.endDate ?? undefined, exclude: c.campaignCode });
  if (o) {
    throw new AppError(
      409,
      `ช่วงวันทับซ้อนกับ ${o.campaignCode} (ประเภทเดียวกัน · Package ${o.sharedPackages.join(', ')} · ${fmt(String(o.startDate))} – ${o.endDate ? fmt(o.endDate) : 'ไม่จำกัด'})`,
      'OVERLAP',
    );
  }
}

// ---------------------------------------------------------------- อนุมัติ / ตีกลับ / Suspend (Approval 1 ระดับ · ผู้อนุมัติ ≠ ผู้สร้าง)
function log(code: string, version: number, action: string, reason: string | null, userId: string): void {
  getDb()
    .prepare("INSERT INTO approval_log (object_type, object_code, version_no, action, reason, actor_id) VALUES ('CAMPAIGN', ?, ?, ?, ?, ?)")
    .run(code, version, action, reason, userId);
}

function requireStatus(c: ReturnType<typeof getCampaign>, status: string, action: string): void {
  if (c.status !== status) throw new AppError(409, `${action}ได้เฉพาะ Campaign สถานะ ${status} (ตอนนี้เป็น ${c.displayStatus})`, 'INVALID_STATUS');
}

export function approveCampaign(code: string, userId: string) {
  const c = getCampaign(code);
  requireStatus(c, 'PENDING', 'อนุมัติ');
  if (c.createdBy === userId) throw new AppError(403, 'อนุมัติงานที่ตัวเองสร้างไม่ได้ (ผู้อนุมัติต้องไม่ใช่ผู้สร้าง)', 'SELF_APPROVAL');
  assertNoOverlap(c);
  getDb()
    .prepare(
      `UPDATE campaign SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now', 'localtime'), reject_reason = NULL,
              updated_at = datetime('now', 'localtime') WHERE campaign_code = ?`,
    )
    .run(userId, code);
  log(code, c.versionNo, 'APPROVE', null, userId);
  return getCampaign(code);
}

export function rejectCampaign(code: string, reason: string | undefined, userId: string) {
  const c = getCampaign(code);
  requireStatus(c, 'PENDING', 'ตีกลับ');
  if (c.createdBy === userId) throw new AppError(403, 'ตีกลับงานที่ตัวเองสร้างไม่ได้ (ผู้อนุมัติต้องไม่ใช่ผู้สร้าง)', 'SELF_APPROVAL');
  const text = String(reason ?? '').trim();
  if (!text) throw new AppError(400, 'กรุณาระบุเหตุผลที่ตีกลับ', 'VALIDATION');
  getDb()
    .prepare("UPDATE campaign SET status = 'REJECTED', reject_reason = ?, updated_at = datetime('now', 'localtime') WHERE campaign_code = ?")
    .run(text, code);
  log(code, c.versionNo, 'REJECT', text, userId);
  return getCampaign(code);
}

/** หยุดชั่วคราวด้วยมือ (Campaign Maker) — กรมธรรม์ใหม่ไม่ได้สิทธิ์ระหว่างหยุด · สิทธิ์เดิมคงอยู่ */
export function suspendCampaign(code: string, suspend: boolean, userId: string) {
  const c = getCampaign(code);
  requireStatus(c, suspend ? 'APPROVED' : 'SUSPENDED', suspend ? 'Suspend ' : 'เปิดใช้อีกครั้ง ');
  getDb()
    .prepare("UPDATE campaign SET status = ?, updated_at = datetime('now', 'localtime') WHERE campaign_code = ?")
    .run(suspend ? 'SUSPENDED' : 'APPROVED', code);
  log(code, c.versionNo, suspend ? 'SUSPEND' : 'RESUME', null, userId);
  return getCampaign(code);
}

/** ปิดถาวร (Approved / Suspended) — Mock ไม่มี Stock จึงรับแค่เหตุผล (Tesla API คืน Stock ด้วย) */
export function closeCampaign(code: string, reason: unknown, userId: string) {
  const c = getCampaign(code);
  if (c.status !== 'APPROVED' && c.status !== 'SUSPENDED')
    throw new AppError(409, `ปิด Campaign ได้เฉพาะสถานะ Approved / Suspended (ตอนนี้เป็น ${c.displayStatus})`, 'INVALID_STATUS');
  const text = String(reason ?? '').trim();
  if (!text) throw new AppError(400, 'กรุณาระบุเหตุผลที่ปิด Campaign', 'VALIDATION');
  getDb()
    .prepare("UPDATE campaign SET status = 'CLOSED', updated_at = datetime('now', 'localtime') WHERE campaign_code = ?")
    .run(code);
  log(code, c.versionNo, 'CLOSE', text, userId);
  return getCampaign(code);
}

export function approvalHistory(code: string) {
  return (
    getDb()
      .prepare(
        `SELECT l.*, u.user_name FROM approval_log l LEFT JOIN app_user u ON u.user_id = l.actor_id
          WHERE l.object_type = 'CAMPAIGN' AND l.object_code = ? ORDER BY l.log_id DESC`,
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

// ---------------------------------------------------------------- Grant (CP-07 รายละเอียด Campaign)
export const GRANT_STATUSES = ['RESERVED', 'CONFIRMED', 'FULFILLED', 'RELEASED', 'CLAWED_BACK', 'NOT_GRANTED'] as const;

export function campaignGrants(code: string) {
  const c = getCampaign(code);
  const rows = getDb()
    .prepare('SELECT * FROM campaign_grant WHERE campaign_code = ? ORDER BY submitted_date DESC, grant_id DESC')
    .all(code) as DbRow[];
  const stats = Object.fromEntries(
    GRANT_STATUSES.map((s) => {
      const list = rows.filter((r) => r['status'] === s);
      return [s, { count: list.length, value: list.reduce((a, r) => a + Number(r['benefit_value']), 0) }];
    }),
  ) as Record<(typeof GRANT_STATUSES)[number], { count: number; value: number }>;
  const used = stats.CONFIRMED.value + stats.FULFILLED.value;
  const usedCount = stats.CONFIRMED.count + stats.FULFILLED.count;
  const d = c.data;
  const b = (d['benefit'] as Obj | undefined) ?? {};
  const allocated = b['allocated'] !== undefined && b['allocated'] !== null ? Number(b['allocated']) : null;
  return {
    stats,
    budget: {
      total: d['budget'] === undefined || d['budget'] === null ? null : Number(d['budget']),
      used,
      reserved: stats.RESERVED.value,
    },
    quota: {
      total: d['quotaTotal'] === undefined || d['quotaTotal'] === null ? allocated : Number(d['quotaTotal']),
      used: usedCount,
      reserved: stats.RESERVED.count,
      unit: d['quotaTotal'] === undefined || d['quotaTotal'] === null ? (c.typeCode === 'VOUCHER' ? 'ใบ' : c.typeCode === 'FREE_GIFT' ? 'ชิ้น' : 'กรมธรรม์') : 'กรมธรรม์',
    },
    items: rows.map((r) => ({
      grantId: Number(r['grant_id']),
      applicationNo: String(r['application_no']),
      policyNo: r['policy_no'] as string | null,
      sellerCode: r['seller_code'] as string | null,
      sellerName: r['seller_name'] as string | null,
      fyp: Number(r['fyp']),
      benefitValue: Number(r['benefit_value']),
      status: String(r['status']),
      campaignVersion: Number(r['campaign_version']),
      submittedDate: String(r['submitted_date']),
    })),
  };
}
