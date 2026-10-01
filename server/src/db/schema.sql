-- ============================================================
-- TESLA Management — SQLite schema
-- Sprint 0: ผู้ใช้ / Role (Prototype ใช้สลับ Role แทน Login จริง — OUT-04)
-- ตารางของแต่ละเมนูจะเพิ่มใน Sprint ถัดไป:
--   Sprint 1 Master : package, package_channel, package_plan, package_seller, master_*, display_mapping
--   Sprint 2 Content: content, content_version, content_package, approval_log
--   Sprint 3 Campaign: campaign, campaign_version, campaign_package, campaign_rule, campaign_tier, grant
--   Sprint 4 People : seller, people_workspace, seller_group, group_member, group_campaign, people_audit_log, referral_link
--   Sprint 5 Overview: policy_sale, sales_target
-- ============================================================

CREATE TABLE IF NOT EXISTS app_user (
  user_id     TEXT PRIMARY KEY,
  user_name   TEXT NOT NULL,
  position    TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 1 ผู้ใช้มีได้หลาย Role (doc 09 §3)
CREATE TABLE IF NOT EXISTS app_user_role (
  user_id    TEXT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  role_code  TEXT NOT NULL CHECK (role_code IN (
               'SYS_ADMIN', 'CONTENT_MAKER', 'CONTENT_APPROVER',
               'CAMPAIGN_MAKER', 'CAMPAIGN_APPROVER', 'PEOPLE_ADMIN', 'EXECUTIVE')),
  PRIMARY KEY (user_id, role_code)
);

-- ============================================================
-- Sprint 1 — Master setup
-- ============================================================

-- MS-04 Master ที่ Sync จากระบบต้นทาง (อ่านอย่างเดียว) — doc 06 §5.2
-- master_type: CHANNEL | PAYMENT_MODE | PAYMENT_METHOD | GENDER | OCCUPATION_CLASS | PRODUCT_TYPE | SUB_PRODUCT_TYPE
CREATE TABLE IF NOT EXISTS synced_master (
  master_type  TEXT NOT NULL,
  code         TEXT NOT NULL,
  name_th      TEXT,
  name_en      TEXT,
  parent_code  TEXT,                 -- SUB_PRODUCT_TYPE → product_Type_Code
  is_active    INTEGER NOT NULL DEFAULT 1,
  data_status  TEXT NOT NULL DEFAULT 'OK',   -- OK | INCOMPLETE (ข้อมูลไม่ครบจากต้นทาง)
  PRIMARY KEY (master_type, code)
);

CREATE TABLE IF NOT EXISTS sync_log (
  sync_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  scope      TEXT NOT NULL,          -- PACKAGE | MASTER
  synced_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  synced_by  TEXT,
  note       TEXT
);

-- MS-01 Package Master (Sync จากระบบต้นทาง — Prototype ใช้ Mock) — doc 05 §1, doc 09 HD-02
CREATE TABLE IF NOT EXISTS package (
  package_code          TEXT PRIMARY KEY,
  name_th               TEXT NOT NULL,
  name_en               TEXT,
  package_type          TEXT,              -- STN Standalone ...
  status_code           TEXT NOT NULL,     -- APP (Approved) | DRF (Drafted)
  is_active             INTEGER NOT NULL DEFAULT 1,
  sale_start_date       TEXT,              -- YYYY-MM-DD
  sale_end_date         TEXT,              -- NULL = ไม่ระบุ
  sale_target           REAL,              -- FYP บาท ตลอดอายุ Package (OV-05)
  description           TEXT,
  seller_selection_mode TEXT NOT NULL DEFAULT 'ALL',  -- ALL | CUSTOM
  free_look_period      INTEGER,           -- วัน
  is_mock               INTEGER NOT NULL DEFAULT 0,   -- 1 = ข้อมูลจำลองเพิ่มเติม (ไม่ได้มาจาก Payload จริง)
  synced_at             TEXT
);

CREATE TABLE IF NOT EXISTS package_channel (
  package_code          TEXT NOT NULL REFERENCES package(package_code) ON DELETE CASCADE,
  channel_code          TEXT NOT NULL,
  seller_selection_mode TEXT NOT NULL DEFAULT 'ALL',
  PRIMARY KEY (package_code, channel_code)
);

CREATE TABLE IF NOT EXISTS package_plan (
  package_code          TEXT NOT NULL REFERENCES package(package_code) ON DELETE CASCADE,
  plan_code             TEXT NOT NULL,
  plan_name             TEXT,
  plan_role             TEXT NOT NULL,     -- MASTER | RIDER
  product_type_code     TEXT,
  sub_product_type_code TEXT,
  min_sum_insured       REAL,
  max_sum_insured       REAL,
  tax_exempt_type       TEXT,
  min_issue_age         INTEGER,
  min_issue_age_method  TEXT,              -- ISDY วัน | ISYR ปี
  max_issue_age         INTEGER,
  max_issue_age_method  TEXT,
  underwrite_type       TEXT,              -- GIO | SIO | FUW
  PRIMARY KEY (package_code, plan_code)
);

CREATE TABLE IF NOT EXISTS package_seller (
  package_code  TEXT NOT NULL REFERENCES package(package_code) ON DELETE CASCADE,
  channel_code  TEXT NOT NULL,
  seller_code   TEXT NOT NULL,
  seller_name   TEXT,
  PRIMARY KEY (package_code, channel_code, seller_code)
);

-- รหัสหลายค่าต่อ Package: PAYMENT_MODE | PAYMENT_METHOD | GENDER | OCCUPATION_CLASS
CREATE TABLE IF NOT EXISTS package_attribute (
  package_code  TEXT NOT NULL REFERENCES package(package_code) ON DELETE CASCADE,
  attr_type     TEXT NOT NULL,
  code          TEXT NOT NULL,
  PRIMARY KEY (package_code, attr_type, code)
);

-- MS-03 Mapping ข้อความแสดงผล (doc 05 Q-07)
-- mapping_type: UNDERWRITE | PAYMENT_METHOD · channel_code = '*' ใช้ทุกช่องทาง
CREATE TABLE IF NOT EXISTS display_mapping (
  mapping_type  TEXT NOT NULL,
  code          TEXT NOT NULL,
  channel_code  TEXT NOT NULL DEFAULT '*',
  display_text  TEXT,
  is_shown      INTEGER NOT NULL DEFAULT 1,
  icon          TEXT,
  updated_by    TEXT,
  updated_at    TEXT,
  PRIMARY KEY (mapping_type, code, channel_code)
);

-- MS-02 Master ที่สร้างเอง (MS-01…MS-22 ของ Campaign — doc 06 §5.1)
CREATE TABLE IF NOT EXISTS custom_master_item (
  type_code    TEXT NOT NULL,             -- MS-01 … MS-22
  item_code    TEXT NOT NULL,
  name_th      TEXT NOT NULL,
  name_en      TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  attributes   TEXT NOT NULL DEFAULT '{}', -- JSON ของ Field เฉพาะแต่ละ Master
  updated_by   TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (type_code, item_code)
);

-- ============================================================
-- Sprint 2 — Content (เมนู Package › Add Package / Package management — doc 05 §0–2)
-- 1 Content = เนื้อหาหน้าขายของ 1 Package × 1 Channel (FD-05) · Template ตัดสินอัตโนมัติ (doc 05 §3)
-- status: DRAFT | REJECTED | PENDING | APPROVED | INACTIVE
--   แสดงผล (FD-03): APPROVED = Active · PENDING = Pending · DRAFT + REJECTED = Draft · INACTIVE = Inactive
-- ============================================================
CREATE TABLE IF NOT EXISTS content (
  content_code        TEXT PRIMARY KEY,                -- CT000001
  package_code        TEXT NOT NULL REFERENCES package(package_code),
  channel_code        TEXT NOT NULL,
  template_code       TEXT NOT NULL,                   -- OL_OB | OL_PA | AGENT
  status              TEXT NOT NULL DEFAULT 'DRAFT',
  version_no          INTEGER NOT NULL DEFAULT 1,
  display_start_date  TEXT,                            -- ช่วงแสดงผล Content (FD-04, FD-09) กรอกใน Editor
  display_end_date    TEXT,
  reject_reason       TEXT,
  content_data        TEXT NOT NULL DEFAULT '{}',        -- เนื้อหาใน Editor (JSON ตาม Template)
  created_by          TEXT REFERENCES app_user(user_id),
  approved_by         TEXT REFERENCES app_user(user_id),
  approved_at         TEXT,
  is_mock             INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS ix_content_package ON content (package_code, channel_code);

-- ============================================================
-- Sprint 3 — Campaign (เมนู Campaign › Campaign list / Add Campaign — doc 06)
-- campaign_code = CMP-{TYPE}-{YYMM}-{Running} (CP-COM-01) · 1 Campaign = 1 ประเภท (MS-01)
-- status: DRAFT | REJECTED | PENDING | APPROVED | SUSPENDED | INACTIVE
--   แสดงผล: APPROVED ก่อนวันเริ่ม = Scheduled · อยู่ในช่วงวัน = Active · เลยวันสิ้นสุด = Expired
-- campaign_data = ข้อมูลใน Wizard (JSON): ข้อมูลทั่วไปที่เหลือ, benefit (ตามประเภท), rules (Rule builder)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign (
  campaign_code     TEXT PRIMARY KEY,                -- CMP-VOU-2609-0001
  type_code         TEXT NOT NULL,                   -- MS-01: VOUCHER | DISCOUNT | CASHBACK | ...
  name_th           TEXT NOT NULL DEFAULT '',
  name_en           TEXT,
  status            TEXT NOT NULL DEFAULT 'DRAFT',
  version_no        INTEGER NOT NULL DEFAULT 1,
  start_date        TEXT,                            -- CP-COM-06 (YYYY-MM-DD) · CC-01 อยู่ในกรอบ Package
  end_date          TEXT,
  package_codes     TEXT NOT NULL DEFAULT '[]',      -- CP-COM-08 (JSON array)
  channel_codes     TEXT NOT NULL DEFAULT '[]',      -- CP-COM-07 (JSON array) ⊆ ช่องทางของ Package
  campaign_data     TEXT NOT NULL DEFAULT '{}',
  reject_reason     TEXT,
  created_by        TEXT REFERENCES app_user(user_id),
  approved_by       TEXT REFERENCES app_user(user_id),
  approved_at       TEXT,
  is_mock           INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS ix_campaign_type ON campaign (type_code, status);

-- สิทธิ์ที่ให้ต่อ 1 ใบคำขอ × 1 Campaign (doc 06 §3A Grant Status · ไม่ใช้กับ Referral)
-- status: RESERVED (Eligible – Reserved) | CONFIRMED | FULFILLED | RELEASED | CLAWED_BACK | NOT_GRANTED
-- Prototype: ข้อมูลกรมธรรม์จำลอง (Interface รับผลพิจารณาจริงอยู่นอกขอบเขต — CC-07)
CREATE TABLE IF NOT EXISTS campaign_grant (
  grant_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_code     TEXT NOT NULL REFERENCES campaign(campaign_code) ON DELETE CASCADE,
  campaign_version  INTEGER NOT NULL DEFAULT 1,       -- Snapshot ณ วันยื่นใบคำขอ (BR-CP-007)
  application_no    TEXT NOT NULL,
  policy_no         TEXT,
  seller_code       TEXT,
  seller_name       TEXT,
  group_code        TEXT,
  fyp               REAL NOT NULL DEFAULT 0,
  benefit_value     REAL NOT NULL DEFAULT 0,          -- มูลค่าสิทธิ์ (บาท)
  status            TEXT NOT NULL,
  submitted_date    TEXT NOT NULL,                    -- วันที่ยื่นใบคำขอ
  updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE (application_no, campaign_code)              -- ประเมินซ้ำได้ผลเดิม (BR-CP-003)
);

-- ประวัติอนุมัติ / ตีกลับ ของ Content และ Campaign (D-06: ผู้อนุมัติ ≠ ผู้สร้าง)
CREATE TABLE IF NOT EXISTS approval_log (
  log_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  object_type  TEXT NOT NULL,                         -- CONTENT | CAMPAIGN
  object_code  TEXT NOT NULL,
  version_no   INTEGER NOT NULL DEFAULT 1,
  action       TEXT NOT NULL,                         -- SUBMIT | APPROVE | REJECT | SUSPEND | RESUME
  reason       TEXT,
  actor_id     TEXT REFERENCES app_user(user_id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS ix_approval_object ON approval_log (object_type, object_code);

-- Version ที่อนุมัติแล้วของ Content (D-07: แก้ Content ที่ Active = ออก Version ใหม่ · หน้าเว็บใช้ Version ล่าสุดที่อนุมัติ)
-- ใช้เทียบ "สิ่งที่เปลี่ยน" ในหน้าอนุมัติ (CT-06)
CREATE TABLE IF NOT EXISTS content_version (
  content_code        TEXT NOT NULL REFERENCES content(content_code) ON DELETE CASCADE,
  version_no          INTEGER NOT NULL,
  content_data        TEXT NOT NULL DEFAULT '{}',
  display_start_date  TEXT,
  display_end_date    TEXT,
  approved_by         TEXT REFERENCES app_user(user_id),
  approved_at         TEXT,
  PRIMARY KEY (content_code, version_no)
);

-- ============================================================
-- Sprint 4 — Seller (เดิม People management — doc 07)
-- Workspace = Package × Channel ที่มี Content Approved (PM-03) — คำนวณจาก content / content_version ไม่มีตารางแยก
-- รายชื่อผู้ขาย: CUSTOM → package_seller ของช่องทางนั้น · ALL → seller ทุกคนที่ขายช่องทางนั้นได้ (PM-05)
-- พร้อมขาย = status ACTIVE และ (ตัวแทน: ใบอนุญาตยังไม่หมดอายุ / พนักงาน: ไม่ต้องมีใบอนุญาต — PM-06)
-- ============================================================

-- ฐานข้อมูลผู้ขายของเรา (Prototype = Mock — PM-07)
CREATE TABLE IF NOT EXISTS seller (
  seller_code     TEXT PRIMARY KEY,
  seller_name     TEXT NOT NULL,
  seller_type     TEXT NOT NULL,                      -- AGENT ตัวแทน | EMPLOYEE พนักงาน
  branch          TEXT,
  team            TEXT,
  level           TEXT,
  license_no      TEXT,
  license_expiry  TEXT,                               -- YYYY-MM-DD (บังคับเฉพาะตัวแทน)
  status          TEXT NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE | SUSPENDED พักงาน | TERMINATED สิ้นสุด
  channel_codes   TEXT NOT NULL DEFAULT '[]',         -- ช่องทางที่ขายได้ (JSON)
  phone           TEXT,
  email           TEXT
);

-- กลุ่มผู้ขายแบบ Flat ต่อ Workspace (D-05) · ชื่อห้ามซ้ำใน Workspace (BR-PM-003)
CREATE TABLE IF NOT EXISTS seller_group (
  group_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  package_code  TEXT NOT NULL,
  channel_code  TEXT NOT NULL,
  group_name    TEXT NOT NULL,
  description   TEXT,
  color         TEXT NOT NULL DEFAULT '#2854a7',
  is_deleted    INTEGER NOT NULL DEFAULT 0,
  created_by    TEXT REFERENCES app_user(user_id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_by    TEXT REFERENCES app_user(user_id),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS ix_group_ws ON seller_group (package_code, channel_code);

-- 1 คนอยู่ได้ 1 กลุ่มต่อ Workspace (PK = Workspace + seller)
CREATE TABLE IF NOT EXISTS group_member (
  package_code  TEXT NOT NULL,
  channel_code  TEXT NOT NULL,
  seller_code   TEXT NOT NULL,
  group_id      INTEGER NOT NULL REFERENCES seller_group(group_id),
  joined_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (package_code, channel_code, seller_code)
);

-- Campaign ที่ผูกกับกลุ่ม (D-03 ไม่ต้องอนุมัติ) — ถอด = ลบแถว (ประวัติอยู่ใน people_audit_log)
CREATE TABLE IF NOT EXISTS group_campaign (
  group_id       INTEGER NOT NULL REFERENCES seller_group(group_id),
  campaign_code  TEXT NOT NULL REFERENCES campaign(campaign_code),
  bound_by       TEXT REFERENCES app_user(user_id),
  bound_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (group_id, campaign_code)
);

-- Audit log (BR-PM-011) — เพิ่มได้อย่างเดียว แก้/ลบไม่ได้
-- action: CREATE_GROUP | UPDATE_GROUP | DELETE_GROUP | MOVE | BIND | UNBIND | IMPORT | COPY | SYNC_REMOVE
CREATE TABLE IF NOT EXISTS people_audit_log (
  log_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  action         TEXT NOT NULL,
  package_code   TEXT NOT NULL,
  channel_code   TEXT NOT NULL,
  group_id       INTEGER,
  group_name     TEXT,
  seller_code    TEXT,
  campaign_code  TEXT,
  detail         TEXT,
  actor_id       TEXT,                                -- NULL = ระบบ
  source         TEXT NOT NULL DEFAULT 'UI',          -- UI | IMPORT | COPY | SYNC
  created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS ix_people_log_ws ON people_audit_log (package_code, channel_code);

-- Referral link รายผู้ขาย (CC-10 / BR-CP-008–009) · นับผลแบบ Last click ภายใน 30 วัน
CREATE TABLE IF NOT EXISTS referral_link (
  campaign_code  TEXT NOT NULL REFERENCES campaign(campaign_code),
  seller_code    TEXT NOT NULL,
  token          TEXT NOT NULL UNIQUE,
  clicks         INTEGER NOT NULL DEFAULT 0,
  applications   INTEGER NOT NULL DEFAULT 0,
  approved       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (campaign_code, seller_code)
);

-- ============================================================
-- Sprint 5 — Overview (doc 08)
-- ============================================================

-- ใบคำขอ / กรมธรรม์ทุกฉบับของ Package (Prototype = Mock — ของจริงรับผ่าน API ชุดเดียวกับ BR-CP-003)
-- status: PENDING รอพิจารณา | APPROVED อนุมัติ | DECLINED ไม่อนุมัติ | FL_CANCELLED ยกเลิกใน Free look
-- fyp = เบี้ยปีแรก (รายงวด × งวดต่อปี หรือ เบี้ยชำระครั้งเดียว) · APE คำนวณตาม OV-06
CREATE TABLE IF NOT EXISTS policy_sale (
  application_no   TEXT PRIMARY KEY,
  policy_no        TEXT,
  package_code     TEXT NOT NULL,
  channel_code     TEXT NOT NULL,
  seller_code      TEXT,
  referral_campaign TEXT,                             -- มาจากลิงก์ Referral ของ Campaign นี้
  submitted_date   TEXT NOT NULL,                     -- YYYY-MM-DD วันที่ยื่นใบคำขอ
  approved_date    TEXT,
  payment_mode     TEXT NOT NULL,                     -- PMM01 ครั้งเดียว | PMM02 รายปี | PMM03 | PMM04 | PMM05 รายเดือน
  modal_premium    REAL NOT NULL,                     -- เบี้ยต่องวด (ครั้งเดียว = เบี้ยทั้งหมด)
  fyp              REAL NOT NULL,
  status           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_policy_date ON policy_sale (submitted_date);
CREATE INDEX IF NOT EXISTS ix_policy_pkg ON policy_sale (package_code, channel_code);

-- Target ที่ตั้งใน TESLA Management (OV-01) — ระดับ Package ใช้ package.sale_target
-- level: CHANNEL (ref_id = channel_code) | GROUP (ref_id = group_id) | SELLER (ref_id = seller_code)
CREATE TABLE IF NOT EXISTS sales_target (
  level          TEXT NOT NULL,
  ref_id         TEXT NOT NULL,
  package_code   TEXT NOT NULL,
  channel_code   TEXT NOT NULL,
  metric         TEXT NOT NULL,                       -- FYP | APE | POLICY
  period         TEXT NOT NULL,                       -- YYYY-MM
  value          REAL NOT NULL,
  updated_by     TEXT REFERENCES app_user(user_id),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (level, ref_id, package_code, channel_code, metric, period)
);
