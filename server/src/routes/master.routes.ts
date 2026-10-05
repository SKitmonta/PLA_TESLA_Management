/**
 * /api/master — Master setup (doc 05 §1, 06 §5, 09 HD-02)
 *   GET  /packages                 MS-01 รายการ Package (กรอง / เรียง / แบ่งหน้า + สรุปจำนวน)
 *   GET  /packages/:code           MS-01 รายละเอียด Package
 *   POST /sync                     จำลองการ Sync จากระบบต้นทาง (System Admin)
 *   GET  /custom-types             MS-02 แคตตาล็อก Master ที่สร้างเอง
 *   GET  /custom/:type             MS-02 รายการของ Master นั้น
 *   POST /custom/:type             MS-02 เพิ่ม (System Admin)
 *   PUT  /custom/:type/:code       MS-02 แก้ไข (System Admin)
 *   GET  /display-mapping          MS-03 Mapping ข้อความแสดงผล (?channel=CHN04)
 *   PUT  /display-mapping          MS-03 บันทึก (System Admin)
 *   GET  /key-topics               หัวข้อ Key Features / Key Advantages (?topicType=FEATURE&systemCode=ONLINE)
 *   GET  /insurance-types · /coverage-types · /feature-tags   หมวดสินค้า + Tag Filter ของ Content (OL_OB)
 *   GET  /channel-packages         Package ที่ขาย (Approved) ในช่องทางเดียวกัน (?channelCode=CHN04) — Package recommend
 *   GET  /synced                   MS-04 สรุป Master ที่ Sync
 *   GET  /synced/:type             MS-04 รายการของ Master ที่ Sync
 */
import { Router } from 'express';
import { getDb, transaction } from '../db/database.js';
import { AppError } from '../middleware/error-handler.js';
import { requireRole } from '../middleware/require-role.js';
import { getPackageDetail, lastSync, listPackages, type PackageListQuery } from '../services/package.service.js';
import { CUSTOM_MASTER_TYPES, findMasterType } from '../services/custom-master.catalog.js';
import { templatesForChannel } from '../services/template-resolver.js';

export const masterRoutes = Router();
const ADMIN = requireRole('SYS_ADMIN');
type DbRow = Record<string, string | number | null>;

// ---------------------------------------------------------------- MS-01 Package
masterRoutes.get('/packages', (req, res) => {
  res.json(listPackages(req.query as unknown as PackageListQuery));
});

masterRoutes.get('/packages/:code', (req, res) => {
  const detail = getPackageDetail(req.params.code);
  if (!detail) throw new AppError(404, `ไม่พบ Package ${req.params.code}`);
  res.json(detail);
});

masterRoutes.post('/sync', ADMIN, (req, res) => {
  const scope = req.body?.scope === 'MASTER' ? 'MASTER' : 'PACKAGE';
  transaction((db) => {
    db.prepare("INSERT INTO sync_log (scope, synced_at, synced_by, note) VALUES (?, datetime('now','localtime'), ?, 'Manual sync (Prototype: จำลอง)')").run(scope, req.actor.userId);
    if (scope === 'PACKAGE') db.prepare("UPDATE package SET synced_at = datetime('now','localtime')").run();
  });
  res.json({ scope, lastSync: lastSync(scope), message: 'Sync เรียบร้อย (Prototype: จำลอง ไม่มีข้อมูลใหม่จากต้นทาง)' });
});

// ---------------------------------------------------------------- MS-02 Master ที่สร้างเอง
masterRoutes.get('/custom-types', (_req, res) => {
  const counts = getDb().prepare('SELECT type_code, COUNT(*) AS n FROM custom_master_item GROUP BY type_code').all() as DbRow[];
  const map = new Map(counts.map((c) => [String(c['type_code']), Number(c['n'])]));
  res.json(CUSTOM_MASTER_TYPES.map((t) => ({ ...t, count: map.get(t.code) ?? 0 })));
});

function toItem(r: DbRow) {
  return {
    itemCode: String(r['item_code']),
    nameTh: String(r['name_th']),
    nameEn: r['name_en'] as string | null,
    sortOrder: Number(r['sort_order']),
    isActive: r['is_active'] === 1,
    attributes: JSON.parse(String(r['attributes'] ?? '{}')) as Record<string, unknown>,
    updatedBy: r['updated_by'] as string | null,
    updatedAt: r['updated_at'] as string | null,
  };
}

masterRoutes.get('/custom/:type', (req, res) => {
  if (!findMasterType(req.params.type)) throw new AppError(404, `ไม่พบ Master ${req.params.type}`);
  const rows = getDb().prepare('SELECT * FROM custom_master_item WHERE type_code = ? ORDER BY sort_order, item_code').all(req.params.type) as DbRow[];
  res.json(rows.map(toItem));
});

interface ItemBody {
  itemCode?: string;
  nameTh?: string;
  nameEn?: string | null;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
}

function validateItem(typeCode: string, body: ItemBody, isNew: boolean): void {
  const type = findMasterType(typeCode);
  if (!type) throw new AppError(404, `ไม่พบ Master ${typeCode}`);
  if (isNew && !/^[A-Z0-9_-]{2,30}$/.test(body.itemCode ?? '')) {
    throw new AppError(400, 'รหัสต้องเป็น A-Z, 0-9, _ หรือ - ยาว 2–30 ตัวอักษร');
  }
  if (!body.nameTh?.trim()) throw new AppError(400, 'กรุณากรอกชื่อ (TH)');
  for (const f of type.fields) {
    const v = body.attributes?.[f.key];
    if (f.required && (v === undefined || v === null || v === '')) throw new AppError(400, `กรุณากรอก ${f.label}`);
    if (f.type === 'number' && v !== undefined && v !== null && v !== '' && Number.isNaN(Number(v))) throw new AppError(400, `${f.label} ต้องเป็นตัวเลข`);
  }
  if (type.stock) {
    const a = body.attributes ?? {};
    const total = Number(a['total_qty'] ?? 0);
    const used = Number(a['reserved_qty'] ?? 0) + Number(a['delivered_qty'] ?? 0);
    if (used > total) throw new AppError(400, 'จองแล้ว + ส่งแล้ว ต้องไม่เกินจำนวนทั้งหมด');
  }
}

masterRoutes.post('/custom/:type', ADMIN, (req, res) => {
  const body = req.body as ItemBody;
  validateItem(req.params.type, body, true);
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM custom_master_item WHERE type_code = ? AND item_code = ?').get(req.params.type, body.itemCode!);
  if (exists) throw new AppError(409, `รหัส ${body.itemCode} มีอยู่แล้ว`);
  const next = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM custom_master_item WHERE type_code = ?').get(req.params.type) as { n: number };
  db.prepare(
    `INSERT INTO custom_master_item (type_code, item_code, name_th, name_en, sort_order, is_active, attributes, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))`,
  ).run(req.params.type, body.itemCode!, body.nameTh!.trim(), body.nameEn ?? null, next.n, body.isActive === false ? 0 : 1, JSON.stringify(body.attributes ?? {}), req.actor.userId);
  const row = db.prepare('SELECT * FROM custom_master_item WHERE type_code = ? AND item_code = ?').get(req.params.type, body.itemCode!) as DbRow;
  res.status(201).json(toItem(row));
});

masterRoutes.put('/custom/:type/:code', ADMIN, (req, res) => {
  const body = req.body as ItemBody;
  validateItem(req.params.type, body, false);
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE custom_master_item SET name_th = ?, name_en = ?, is_active = ?, attributes = ?, updated_by = ?, updated_at = datetime('now','localtime')
        WHERE type_code = ? AND item_code = ?`,
    )
    .run(body.nameTh!.trim(), body.nameEn ?? null, body.isActive === false ? 0 : 1, JSON.stringify(body.attributes ?? {}), req.actor.userId, req.params.type, req.params.code);
  if (result.changes === 0) throw new AppError(404, `ไม่พบรหัส ${req.params.code}`);
  const row = db.prepare('SELECT * FROM custom_master_item WHERE type_code = ? AND item_code = ?').get(req.params.type, req.params.code) as DbRow;
  res.json(toItem(row));
});

// ---------------------------------------------------------------- MS-03 Mapping ข้อความแสดงผล
masterRoutes.get('/display-mapping', (req, res) => {
  const db = getDb();
  const channel = typeof req.query['channel'] === 'string' ? req.query['channel'] : 'CHN04';
  const underwrite = (
    db
      .prepare(
        `SELECT m.code, m.name_th, d.display_text, d.updated_by, d.updated_at FROM synced_master m
           LEFT JOIN display_mapping d ON d.mapping_type = 'UNDERWRITE' AND d.code = m.code AND d.channel_code = '*'
          WHERE m.master_type = 'UNDERWRITE_TYPE' ORDER BY m.code`,
      )
      .all() as DbRow[]
  ).map((r) => ({ code: String(r['code']), sourceName: r['name_th'] as string | null, displayText: (r['display_text'] as string | null) ?? '' }));

  const paymentMethods = (
    db
      .prepare(
        `SELECT m.code, m.name_th, d.display_text, d.is_shown, d.icon FROM synced_master m
           LEFT JOIN display_mapping d ON d.mapping_type = 'PAYMENT_METHOD' AND d.code = m.code AND d.channel_code = ?
          WHERE m.master_type = 'PAYMENT_METHOD' ORDER BY m.code`,
      )
      .all(channel) as DbRow[]
  ).map((r) => ({
    code: String(r['code']),
    sourceName: r['name_th'] as string | null,
    isShown: r['is_shown'] === 1,
    displayText: (r['display_text'] as string | null) ?? '',
    icon: r['icon'] as string | null,
  }));

  const channels = (db.prepare("SELECT code, name_en FROM synced_master WHERE master_type = 'CHANNEL' AND data_status = 'OK' ORDER BY code").all() as DbRow[]).map((c) => ({
    code: String(c['code']),
    name: c['name_en'] as string | null,
  }));
  const updated = db.prepare('SELECT updated_by, updated_at FROM display_mapping ORDER BY updated_at DESC LIMIT 1').get() as DbRow | undefined;

  res.json({ channel, channels, underwrite, paymentMethods, updatedBy: updated?.['updated_by'] ?? null, updatedAt: updated?.['updated_at'] ?? null });
});

interface MappingBody {
  channel: string;
  underwrite: { code: string; displayText: string }[];
  paymentMethods: { code: string; isShown: boolean; displayText: string; icon?: string | null }[];
}

masterRoutes.put('/display-mapping', ADMIN, (req, res) => {
  const body = req.body as MappingBody;
  if (!body?.channel) throw new AppError(400, 'กรุณาเลือกช่องทาง');
  for (const p of body.paymentMethods ?? []) {
    if (p.isShown && !p.displayText?.trim()) throw new AppError(400, `${p.code}: เลือก "แสดง" แล้วต้องกรอกข้อความแสดงผล`);
  }
  transaction((db) => {
    const upsert = db.prepare(
      `INSERT INTO display_mapping (mapping_type, code, channel_code, display_text, is_shown, icon, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
       ON CONFLICT (mapping_type, code, channel_code) DO UPDATE SET
         display_text = excluded.display_text, is_shown = excluded.is_shown, icon = excluded.icon,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    );
    for (const u of body.underwrite ?? []) upsert.run('UNDERWRITE', u.code, '*', u.displayText?.trim() ?? '', 1, null, req.actor.userId);
    for (const p of body.paymentMethods ?? []) upsert.run('PAYMENT_METHOD', p.code, body.channel, p.displayText?.trim() ?? '', p.isShown ? 1 : 0, p.icon ?? null, req.actor.userId);
  });
  res.json({ message: 'บันทึก Mapping เรียบร้อย' });
});

// ---------------------------------------------------------------- หัวข้อ Key Features / Key Advantages
// Tesla ใช้ M_MARKETING_KEY_TOPIC (เส้น v1) — Mock มีชุดตัวอย่างคงที่ ไม่มีหน้าแก้ไข
const FEATURE_TOPICS = [
  { code: 'SINGLE_PREMIUM', nameTh: 'จ่ายเบี้ยครั้งเดียวจบ', nameEn: 'Single Premium', formatTemplate: 'เริ่มต้นเพียง 5,000 บาท' },
  { code: 'LIFE_COVERAGE', nameTh: 'คุ้มครองชีวิตตลอดสัญญา', nameEn: 'Life coverage', formatTemplate: '10 ปี' },
  { code: 'DEATH_COVERAGE', nameTh: 'คุ้มครองการเสียชีวิต', nameEn: 'Death coverage', formatTemplate: '110%' },
  { code: 'EASY_TO_SIGN_UP', nameTh: 'สมัครง่าย', nameEn: 'Easy to sign up', formatTemplate: 'ไม่ต้องตรวจสุขภาพ' },
  { code: 'CONVENIENT_PREMIUM_PAYMENTS', nameTh: 'จ่ายเบี้ยฯ สะดวก', nameEn: 'Convenient premium payments', formatTemplate: 'ผ่านบัตรเครดิต และ QR Promptpay' },
  { code: 'TAX', nameTh: 'ลดหย่อนภาษีสูงสุด', nameEn: 'Tax', formatTemplate: '100,000 บาท' },
].map((t) => ({ ...t, topicType: 'FEATURE', descriptionTh: null }));
const ADVANTAGE_TOPICS = [
  { code: 'EASY_BUY', nameTh: 'ซื้อง่าย จ่ายสั้น', nameEn: 'Easy buy', descriptionTh: 'ซื้อง่าย จ่ายสั้น จ่ายเบี้ย 1 ปี คุ้มครอง 10 ปี' },
  { code: 'EASY_REGISTER', nameTh: 'สมัครง่าย', nameEn: 'Easy register', descriptionTh: 'สมัครง่ายใน 5 นาที' },
  { code: 'NO_HEALTH_CHECK', nameTh: 'ไม่ต้องตรวจสุขภาพ', nameEn: 'No health check', descriptionTh: 'สมัครได้โดยไม่ต้องตรวจสุขภาพ' },
  { code: 'TAX_DEDUCTIBLE', nameTh: 'ลดหย่อนภาษี', nameEn: 'Tax deductible', descriptionTh: 'นำไปลดหย่อนภาษีได้' },
  { code: 'GUARANTEE', nameTh: 'การันตี', nameEn: 'Guarantee', descriptionTh: 'การันตีผลตอบแทน' },
].map((t) => ({ ...t, topicType: 'ADVANTAGE', formatTemplate: null }));
const KEY_TOPICS = [...FEATURE_TOPICS, ...ADVANTAGE_TOPICS].map((t, i) => ({ id: i + 1, systemCode: 'ONLINE', imageUrl: null, displayOrder: i + 1, ...t }));

masterRoutes.get('/key-topics', (req, res) => {
  const { topicType, systemCode } = req.query as { topicType?: string; systemCode?: string };
  res.json(
    KEY_TOPICS.filter(
      (t) => (!topicType || t.topicType === topicType.toUpperCase()) && (!systemCode || t.systemCode === systemCode.toUpperCase()),
    ),
  );
});

// ---------------------------------------------------------------- หมวดสินค้า + Tag Filter (OL_OB)
// Tesla ใช้ Master ของ v1 (/marketing-content/master/*) — Mock มีชุดตัวอย่างคงที่
const CONTENT_MASTERS: Record<string, [string, string, string][]> = {
  'insurance-types': [
    ['SAVING', 'ประกันสะสมทรัพย์', 'Saving'],
    ['WHOLE_LIFE', 'ตลอดชีพ', 'Whole life'],
    ['TERM', 'ระยะสั้น', 'Term'],
    ['ANNUITY', 'บำนาญ', 'Annuity'],
    ['UNIT_LINKED', 'ยูนิตลิงค์', 'Unit linked'],
  ],
  'coverage-types': [
    ['IPD', 'ผู้ป่วยใน', 'IPD'],
    ['OPD', 'ผู้ป่วยนอก', 'OPD'],
    ['CRITICAL', 'โรคร้ายแรง', 'Critical illness'],
    ['ACCIDENT', 'อุบัติเหตุ', 'Accident'],
    ['CANCER', 'มะเร็ง', 'Cancer'],
  ],
  'feature-tags': [
    ['NO_HEALTH_Q', 'ไม่ตอบคำถามสุขภาพ', 'No health questions'],
    ['TAX_BENEFIT', 'ลดหย่อนภาษี', 'Tax benefit'],
    ['HIGH_RETURN', 'ผลตอบแทนสูง', 'High return'],
    ['GUARANTEE', 'การันตีผลตอบแทน', 'Guaranteed return'],
    ['SHORT_PAY', 'จ่ายสั้น คุ้มครองยาว', 'Short pay'],
  ],
};

for (const [type, rows] of Object.entries(CONTENT_MASTERS)) {
  masterRoutes.get(`/${type}`, (_req, res) => {
    res.json(rows.map(([code, nameTh, nameEn], i) => ({ id: i + 1, code, nameTh, nameEn, displayOrder: i + 1 })));
  });
}

// ---------------------------------------------------------------- Package recommend (OL_OB) — รูปแบบเดียวกับเส้น v1
masterRoutes.get('/channel-packages', (req, res) => {
  const channel = String(req.query['channelCode'] ?? '');
  if (!channel) throw new AppError(400, 'ต้องระบุ channelCode');
  const { items } = listPackages({ channel, status: 'APPROVED', pageSize: 100 });
  res.json(
    items.map((p) => ({
      packageCode: p.packageCode,
      packageNameTh: p.nameTh,
      packageNameEn: p.nameEn,
      subProductTypeNameTh: p.subProductTypeName,
      saleStartDate: p.saleStartDate,
    })),
  );
});

// ---------------------------------------------------------------- MS-04 Master ที่ Sync
const SYNCED_TYPES = [
  { type: 'CHANNEL', label: 'Channel' },
  { type: 'PAYMENT_MODE', label: 'Payment mode' },
  { type: 'PAYMENT_METHOD', label: 'Payment method' },
  { type: 'GENDER', label: 'Gender' },
  { type: 'OCCUPATION_CLASS', label: 'Occupation class' },
  { type: 'PRODUCT_TYPE', label: 'Product type' },
  { type: 'SUB_PRODUCT_TYPE', label: 'Sub product type' },
  { type: 'UNDERWRITE_TYPE', label: 'Underwrite type' },
];

masterRoutes.get('/synced', (_req, res) => {
  const counts = getDb().prepare('SELECT master_type, COUNT(*) AS n FROM synced_master GROUP BY master_type').all() as DbRow[];
  const map = new Map(counts.map((c) => [String(c['master_type']), Number(c['n'])]));
  res.json({ lastSync: lastSync('MASTER'), types: SYNCED_TYPES.map((t) => ({ ...t, count: map.get(t.type) ?? 0 })) });
});

masterRoutes.get('/synced/:type', (req, res) => {
  if (!SYNCED_TYPES.some((t) => t.type === req.params.type)) throw new AppError(404, `ไม่พบ Master ${req.params.type}`);
  const rows = getDb()
    .prepare(
      `SELECT m.*, p.name_th AS parent_name FROM synced_master m
         LEFT JOIN synced_master p ON p.master_type = 'PRODUCT_TYPE' AND p.code = m.parent_code
        WHERE m.master_type = ? ORDER BY m.code`,
    )
    .all(req.params.type) as DbRow[];
  res.json(
    rows.map((r) => ({
      code: String(r['code']),
      nameTh: r['name_th'] as string | null,
      nameEn: r['name_en'] as string | null,
      parentCode: r['parent_code'] as string | null,
      parentName: r['parent_name'] as string | null,
      isActive: r['is_active'] === 1,
      dataStatus: String(r['data_status']),
      templates: req.params.type === 'CHANNEL' ? templatesForChannel(String(r['code'])) : [],
    })),
  );
});
