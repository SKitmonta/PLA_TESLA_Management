# TESLA Management — Journey Final & Handoff (v1.3)

**บันทึกเมื่อ:** 24 กันยายน 2569 (v1.2: ย้าย Design เข้า Figma ครบ 32 หน้า, ปิด OUT-06, อัปเดต CT-05 ตาม doc 10)
**อัปเดต v1.3 (26 ก.ย. 2569):** Figma ไฟล์ใหม่ `R5FgFh0qCxUUZeITKV0Pfv` · ชื่อเมนู Package / Seller · 1 Content = 1 Package · ดู FD-01…FD-07 ใน doc 05 §0.1
**สถานะ:** Journey ยืนยันครบทุกเมนู · Mockup Online ครบทุกเมนู · Figma (Layer แก้ได้) ครบ 32/32 หน้า
**แทนที่:** `04-rebaseline-v0.2-journey.md` (ส่วน Journey / Open Items) — รายละเอียด Field อยู่ในเอกสาร 05–08, 10

---

## 0. Decisions เพิ่มเติม (24 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| HD-01 | Q-03 รหัส Product type ของ OL_PA | **OL_PA = CHN04 + PTY08 (ประกันภัยอุบัติเหตุ)** แทน PTY02 ในตาราง Template matrix ของเอกสาร 05 |
| HD-02 | Package Master | ต้องมีหน้า Master setup › Package แสดงรายการและรายละเอียดของแต่ละ Package เพื่อให้เห็นว่าแต่ละ Package คืออะไร และได้ Template ไหน |
| HD-03 | Template AGENT | ✅ กำหนดแล้วใน `10-agent-template-spec.md` และมี Mockup CT-05 แล้ว |
| HD-05 | Figma ไฟล์หลัก (26 ก.ย.) | ย้ายไป **`R5FgFh0qCxUUZeITKV0Pfv`** (Page 1) — Frame V2 ขนาด 1920px เป็นหลัก · Components: Sidebar `1:70`, Bar (Topbar / Navigate / Stepbar) `1:6366`, Menu `1:862` |
| HD-06 | ชื่อเมนู (FD-01) | Overview · **Package** (Content selling tools) · Campaign · **Seller** (People management) · Master setup |
| HD-04 | Design source of truth | **Figma = ที่แก้ Design ต่อ** (Layout / Label / Component) · **Spec 04–10 = Logic / Business rule** · ถ้า Figma กับ Spec ขัดกัน Claude ต้องถามก่อนเขียน Code |

## 1. เอกสารอ้างอิง

| Doc | เนื้อหา | สถานะ |
|---|---|---|
| 04 | Module, Journey เดิม, Decisions D-01…D-08, Working setup | อ้างอิง |
| 05 | Content: Add Package popup, Template matrix, Field OL_OB / OL_PA | v0.2 — Q-03 ปิดแล้ว (HD-01) |
| 06 | Campaign: 9 ประเภท, Field, Rule builder, Grant, Referral, Master MS-01…MS-22 | v0.4 — ปิดครบ |
| 07 | People: Workspace, Drag & Drop, ผูก Campaign, Import/Export/Copy/Audit | v0.2 — ปิดครบ |
| 08 | Overview: KPI, Target, Role view, Real-time | v0.2 — ปิดครบ |
| 10 | Content: Template AGENT | ปิดครบ |
| Mockup (Baseline) | "TESLA Management — Online Content Mockup" (Design canvas): https://claude.ai/artifact/Sh5RS88yDc9Cdceujkq8QT | ครบ 32 หน้าจอ — ใช้เป็น Baseline v1.0 |
| **Figma** | **TESLA Management** (pla.figma's team): https://www.figma.com/design/O4sj5GNRZwiaKKIOEBZpQC | **v1.0 — 32 หน้า, Layer แก้ได้** (ดู §7) |

## 2. Business Journey (Final)

| Phase | Step | ผู้ทำ | Output | Gate / กติกาหลัก |
|---|---|---|---|---|
| A. Master | 1. Package Sync เข้ามา (Prototype ใช้ Mock 3 Package จาก Payload ตัวอย่าง และ Mock PA/OB เพิ่ม) | ระบบ | Package master | แสดงเฉพาะ status APP + is_Active |
| B. Package (Content) | 2. Add Package → Channel → Product type → Sub type (AND) → เลือก Package 1 ตัว (ซ่อน Package ที่มี Content แล้ว) → ระบบกำหนด Template (OL_OB / OL_PA / AGENT) | Content Maker | Content Draft | Template ตาม Channel ที่เลือก; **1 Content = 1 Package (FD-05)**; 1 Package × Channel = 1 Content ที่ใช้งาน; กรอกช่วงแสดงผล Start/End (FD-04) |
|  | 3. กรอก Content ตาม Template → ส่งอนุมัติ | Content Approver (≠ Maker) | Content Approved | Approval 1 ระดับ; แก้ไข = Version ใหม่ |
| C. Campaign | 4–5. เลือกประเภท (9) → ข้อมูลทั่วไป (เลือก Package ก่อน แล้วเลือกช่วงวันในกรอบ Package) → สิทธิประโยชน์ → เงื่อนไขผู้มีสิทธิ์ | Campaign Maker | Campaign Draft | Channel ⊆ Package; ประเภทเดียวกันห้ามช่วงวันทับกัน; Referral ไม่มีเงื่อนไข/งบ |
|  | 6. ส่งอนุมัติ | Campaign Approver (≠ Maker) | Campaign Approved | Approval 1 ระดับ; แก้ไข = Version ใหม่ |
| D. Seller | 7–9. เลือก Workspace (Package × Channel ที่ Content Approved) → สร้างกลุ่ม → Drag & Drop ผู้ขาย | Seller Admin | Seller Group | Flat, 1 คน = 1 กลุ่มต่อ Workspace; ผู้ขายที่ไม่พร้อมขายแสดงเป็นสีเทา |
| E. Binding | 10–11. ผูก Campaign (Approved) ให้กลุ่ม | Seller Admin | สิทธิ์โปรโมชัน / Referral link | ไม่ต้องอนุมัติ, มี Audit log |
| – | (Runtime) กรมธรรม์เข้ามา → ระบบให้ทุก Campaign ที่เข้าเงื่อนไขโดยอัตโนมัติ | ระบบ | Grant | Agent เช็คกลุ่ม / Online ไม่เช็ค; จองตอนเข้าเงื่อนไข ตัดตอนอนุมัติ; Snapshot ณ วันยื่นใบคำขอ |
| F. Overview | ดูภาพรวม Target vs ยอดขาย, Campaign, กลุ่ม/ผู้ขาย, งานที่ต้องทำ | ทุก Role (ตามสิทธิ์) | Dashboard | FYP / APE / จำนวนกรมธรรม์; Real-time |

**Template Resolution Matrix (อัปเดต HD-01):** CHN04 + PTY01 → OL_OB · CHN04 + PTY08 → OL_PA · CHN01 + PTY01 → AGENT · อื่นๆ → ไม่แสดงใน Popup

## 3. Role & Permission

| Role | Master | Package (Content) | Campaign | Seller | Overview |
|---|---|---|---|---|---|
| System Admin | **ทำได้ทุก Function** (CRUD Master ที่สร้างเอง, Sync) | สร้าง / แก้ / ส่งอนุมัติ / อนุมัติ / ตีกลับ | สร้าง / แก้ / ส่งอนุมัติ / อนุมัติ / ตีกลับ / Suspend | จัดกลุ่ม / ผูก Campaign / Import / Export / Copy | A–F + ตั้ง Target |
| Content Maker | ดู | สร้าง / แก้ / ส่งอนุมัติ | ดู | – | D, F |
| Content Approver | ดู | อนุมัติ / ตีกลับ (ห้ามอนุมัติงานตัวเอง) | ดู | – | D, F |
| Campaign Maker | ดู | ดู | สร้าง / แก้ / ส่งอนุมัติ / Suspend | ดู | D, F |
| Campaign Approver | ดู | ดู | อนุมัติ / ตีกลับ (ห้ามอนุมัติงานตัวเอง) | ดู | D, F |
| Seller Admin | ดู | ดู | ดู | จัดกลุ่ม / ผูก Campaign / Import / Export / Copy | D, F + ตั้ง Target |
| Executive | – | ดู | ดู | ดู | A–E (ทุก Package) + ตั้ง Target |

*1 ผู้ใช้มีได้หลาย Role; Prototype ใช้ปุ่มสลับ Role แทนระบบ Login จริง (เสนอ)*

*System Admin ทำได้ทุก Function (28 ก.ย. 2569) แต่ยังใช้กติกา D-06: ห้ามอนุมัติงานที่ตัวเองสร้าง*

## 4. Screen Inventory

| Menu | ID | หน้าจอ | อ้างอิง | Mockup | Figma frame (node) |
|---|---|---|---|---|---|
| Overview | OV-00 | Dashboard (Section A–F ตาม Role, ตัวกรอง, สลับตัวชี้วัด) | 08 | ✅ | Overview `18:83` |
|  | OV-10 | ตั้ง Target (ช่องทาง / กลุ่ม / ผู้ขาย, รายเดือน, Import/Export) | 08 BR-OV-004 | ✅ | Target `17:1022` |
| Package | CT-01 | **Package management** (= เมนูย่อย Add Package) — การ์ด 5 ใบ + Package List + ปุ่ม + Add (FD-10) | 05 §0.2 | ✅ | V2_1 `17:3584` |
|  | CT-02 | Popup Add Package (Dropdown 3 ชั้น + Dropdown Package + การ์ด, 1 Package) | 05 BR-CT-001–006 | ✅ | V2 `5:3902` (ไฟล์ใหม่) |
|  | CT-03 | Content Editor — OL_OB (Section OB-01…OB-12) | 05 §5 | ✅ | EditorOB `8:401` |
|  | CT-04 | Content Editor — OL_PA (PA-00 แผนที่ผูก + ตารางเปรียบเทียบ) | 05 §6 | ✅ | EditorPA `7:535` |
|  | CT-05 | Content Editor — AGENT | 10 | ✅ | EditorAG `9:540` |
|  | CT-06 | หน้าอนุมัติ (สิ่งที่เปลี่ยนจาก Version เดิม, Preview, Approve / Reject พร้อมเหตุผล, ประวัติ) | 04 D-06/07 | ✅ | Approval `5:339` |
| Campaign | CP-01 | รายการ Campaign | 06 | ✅ | List `10:99` |
|  | CP-02 | Wizard ขั้น 1 — เลือกประเภท | 06 | ✅ | Step1 `9:1253` |
|  | CP-03 | Wizard ขั้น 2 — ข้อมูลทั่วไป | 06 | ✅ | Step2 `10:376` |
|  | CP-04 | Wizard ขั้น 3 — สิทธิประโยชน์ (9 ประเภท) | 06 | ✅ | Cashback `10:701` · Voucher `11:378` · Discount `10:973` · Gift `11:651` · Installment `11:869` · Points `11:1136` · Referral `13:655` · Bundle `13:851` · LuckyDraw `13:1069` |
|  | CP-05 | Wizard ขั้น 4 — เงื่อนไขผู้มีสิทธิ์ (Rule builder) | 06 | ✅ | Step4 `13:1356` |
|  | CP-06 | Wizard ขั้น 5 — ตรวจสอบ & ส่งอนุมัติ | 06 | ✅ | Step5 `15:943` |
|  | CP-07 | รายละเอียด Campaign + Grant | 06 | ✅ | Detail `15:1159` |
| Seller | P-01 | Workspace list | 07 §1 | ✅ | Workspace `15:1392` |
|  | P-02 | Drag & Drop Board | 07 | ✅ | Board `15:1621` |
|  | P-03 | Group detail & Campaign binding | 07 | ✅ | Group `17:224` |
|  | P-04 | Referral links | 07 | ✅ | Referral `17:496` |
|  | P-05 | Tools (Import / Export / Copy / Audit) | 07 | ✅ | Tools `17:733` |
| Package | ~~CT-00~~ | ~~Package Information~~ → รวมเป็นหน้าเดียวกับ CT-01 (FD-10); รายละเอียด Package ดูจากเมนู ⋮ | – | – | – |
| Master setup | ~~MS-01~~ | ~~Package Master~~ → ย้ายไป CT-00 | – | – | – |
|  | MS-02 | Master ที่สร้างเอง (MS-01…MS-22 ของ Campaign) — List + ฟอร์ม CRUD | 06 §5 | ✅ | MasterMaintenance `19:871` |
|  | MS-03 | Mapping ข้อความแสดงผล (Underwrite type, Payment method + Icon) | 05 Q-07 | ✅ | DisplayMapping `18:506` |
|  | MS-04 | Master ที่ Sync (Channel, Payment mode/method, Gender, Occupation, Product type) — Read-only | 06 §5.2 | ✅ | SyncedMaster `18:766` |

*รวม 32 Frame (CP-04 มี 9 Frame ตามประเภท Campaign)*

### Theme (จาก BMW-UW — ตรวจแล้ว 24 ก.ย. 2569)

| Token | ค่า |
|---|---|
| Font | Sukhumvit Set (fallback Noto Sans Thai), ขนาดพื้นฐาน 13.6px · หน้าจอหลัก **1920px** + Responsive (Desktop ≥1200 / iPad 768–1199 / Mobile <768) |
| Primary | #001b4a (ปุ่มหลัก, หัวตาราง, Pagination) · Primary-9 #00317a (ลิงก์/Breadcrumb) · Light #e2edff |
| เมนูที่เลือก | Gradient 90° #00194b → #2854a7, มุม 8.5px |
| พื้นหลัง / Card | หน้า #f8f8f8 · Card ขาว, ขอบ #d7deed, มุม 20px, เงา 0 10px 40px rgba(41,50,65,.06) |
| ตาราง | หัวตาราง #f8fafc ตัวอักษร #001b4a weight 500–600, มุมตาราง 20px |
| Input | ขอบ #e6e6e6, มุม 10px · ปุ่มมุม 10–12px |
| ข้อความ | หลัก #191919 · รอง #5d5d5d · Error #dc2626 · Success #10b981 |
| Badge | สถานะแบบ Pill สีอ่อน + จุดสี (Approved เขียว, Submit เทา) · FUW #f47a1e, SIO #ffb500, GIO #6d28d9 |
| Layout (V2) | Sidebar ขาว **250px** (เมนูสูง 45px, มุม 10px, มีลูกศรเมนูย่อย, การ์ด System version ด้านล่าง) · Topbar ขาว **70px** (ชื่อเมนูตรงกลาง) · แถบ Breadcrumb ขาว 70px ใต้ Topbar |

*Token ทั้งหมดอยู่ใน Figma เป็น Variables collection "TESLA Theme" (23 ตัว)*

## 5. Handoff สำหรับ Claude Code

**Stack:** Angular 22 + TypeScript · Node.js 24 + Express 5 (TS) · SQLite (`node:sqlite`) · ทำงานบน localhost `D:\PLA_TESLA_Management\Claude_project` · Git push เข้า branch `dev` เมื่อพี่ฟิล์มสั่งเท่านั้น

**โครง Folder (1 เมนู = 1 folder มี .ts / .html / .scss ของตัวเอง)**

```
src/app/
├─ core/          models, services (API), guards, role-switcher
├─ shared/        table, status-badge, approval-panel, dnd-list, rule-builder, tier-table, file-upload, source-tag (PKG/DRV/CMS/GLB/CMP)
├─ layout/        sidebar, header (theme BMW-UW)
└─ features/
   ├─ overview/        dashboard/, target-setting/
   ├─ package/         add-package/ (Package management + add-package-dialog/ + package-detail/), content-editor/ (editor-ol-ob/, editor-ol-pa/, editor-agent/, sections/ OB-01…OB-12, editor-section/, upload-box/, package-panel/), content-approval/   (เมนู Package)
   ├─ campaign/        campaign-list/, campaign-wizard/, campaign-detail/, campaign-approval/
   ├─ seller/          workspace-list/, group-board/, group-detail/, referral-links/, seller-tools/   (เมนู Seller)
   └─ master-setup/    master-maintenance/, display-mapping/, synced-master/
server/
├─ routes/        แยกไฟล์ตามเมนู (overview, content, campaign, people, master)
├─ db/            schema.sql, seed/ (Package จาก Payload + Mock, ผู้ขาย Mock, กรมธรรม์ Mock)
└─ services/      template-resolver, eligibility-engine, grant-service, referral-service
```

**ตาราง SQLite หลัก:** package (+ channel, plan, seller, payment method/mode — เก็บตาม Payload), content, content_version, content_package (1–N สำหรับ OL_PA), campaign, campaign_version, campaign_package, campaign_rule, campaign_tier, master_* (MS-01…MS-21), grant, referral_link, referral_click, seller (Mock), people_workspace, seller_group, group_member, group_campaign, people_audit_log, sales_target, policy_sales (Mock), approval_log

**Mock data ที่ต้องเตรียม:** Package ST000006 / ST000007 / ST000014 (จาก Payload), MOCK-PA01 และ MOCK-PA02 (CHN04 + PTY08, 2 แผนของ OL_PA), MOCK-OB02 (สำหรับ Recommend) — Sub type ของ PA ยังเป็น Placeholder; ผู้ขาย ~50 คน (ตัวแทน/พนักงาน, บางคนใบอนุญาตหมดอายุ); กรมธรรม์ ~200 ฉบับหลายสถานะ (ใช้ทดสอบ Grant และ Overview)

**Deferred (ไม่ทำใน Prototype):** API รับกรมธรรม์จริง (CC-07), ฐานข้อมูลผู้ขายจริง (PM-07), UI Preview/ทดลองคำนวณ (ISS-006)

## 6. Outstanding

| # | เรื่อง | ต้องการจาก | Blocker? |
|---|---|---|---|
| OUT-01 | ~~Template AGENT~~ → ✅ ปิด (doc 10 + CT-05) | – | – |
| OUT-02 | ~~Q-03 รหัส PTY02~~ → ✅ ปิด (HD-01: PTY08) | – | – |
| OUT-03 | ค่าที่ Claude เสนอไว้ใน 05 (Q-05 แสดงเฉพาะ APP + Active, Q-07 Mapping table, Q-08 Recommend ข้ามประเภทได้) — ใช้ใน Mockup แล้ว รอพี่ฟิล์มยืนยันตอนรีวิว | พี่ฟิล์ม | ไม่ Block |
| OUT-04 | Role จริง / การ Login | – | ไม่ Block (Prototype ใช้สลับ Role) |
| OUT-05 | Sub Product Type จริงของ Package PA (Mockup ใช้ Placeholder) | พี่ฟิล์ม / ข้อมูล Master | ไม่ Block |
| OUT-06 | ~~Mockup Campaign / People / Overview / Master อื่นๆ~~ → ✅ ปิด (ครบ 32 หน้าทั้งใน Design canvas และ Figma) | – | – |
| OUT-07 | พี่ฟิล์มปรับ Design ใน Figma (เริ่มแก้ Sidebar component แล้ว) → แจ้ง Claude ก่อนเริ่ม Code ว่าแก้ Frame ไหนบ้าง | พี่ฟิล์ม | ไม่ Block — Claude diff กับ Baseline ให้ได้ |

## 7. Figma File & การติดตามการแก้ไข

**ไฟล์:** https://www.figma.com/design/O4sj5GNRZwiaKKIOEBZpQC (key `O4sj5GNRZwiaKKIOEBZpQC`, pla.figma's team)

| Page | Node | เนื้อหา |
|---|---|---|
| Cover | `0:1` | Cover · TESLA Management |
| Components | `3:2` | Sidebar (Variant ตามเมนู: Overview `3:207`, Content `3:246`, Campaign `3:285`, People `3:324`, Master `3:363`) · Topbar `3:384` · Icon 33 ตัว (`3:33`…`3:168`) |
| 01 Content | `3:3` | CT-01…CT-06 |
| 02 Campaign | `3:4` | CP-01…CP-07 (15 Frame) |
| 03 People | `3:5` | P-01…P-05 |
| 04 Overview & Master | `3:6` | OV-00, OV-10, MS-01…MS-04 |

**โครงสร้าง Layer:** ทุกหน้าใช้ Auto layout, ผูกสีกับ Variables "TESLA Theme", ใช้ Sidebar/Topbar/Icon เป็น Component instance (แก้ที่ Components page แล้วมีผลทุกหน้า), ข้อความเป็น Text layer แก้ได้

**วิธีติดตามการแก้ (ใช้ตอน Claude Code)**

| # | ขั้นตอน | ผู้ทำ |
|---|---|---|
| 1 | Baseline v1.0 = Figma ณ 24 ก.ย. 2569 (Node ID ตามตาราง §4) และ Artifact Sh5RS88yDc9Cdceujkq8QT | Claude |
| 2 | เมื่อแก้เสร็จ ให้บันทึก Named version ใน Figma (เช่น "v1.1 – ปรับ Sidebar") | พี่ฟิล์ม |
| 3 | Business rule ที่เปลี่ยน ให้เขียนเป็น Comment / Annotation บน Frame นั้น (ไม่ใช่แค่แก้ Layout) | พี่ฟิล์ม |
| 4 | ก่อนเริ่ม Code แต่ละเมนู Claude อ่าน Frame จาก Figma, เทียบกับ Baseline และสรุปรายการที่เปลี่ยนให้ยืนยัน | Claude |
| 5 | ถ้า Figma กับ Spec 04–10 ขัดกัน ให้ถามก่อนเสมอ (HD-04) และอัปเดต Spec ตามคำตอบ | Claude |

---

## Change log

| Version | วันที่ | เปลี่ยนอะไร |
|---|---|---|
| v1.2 | 24 ก.ย. 2569 | ย้าย Design เข้า Figma ครบ 32 หน้า |
| v1.9 | 27 ก.ย. 2569 | FD-15 UI ใช้ PrimeNG v21 ทั้งระบบ (ช่องข้อความ AutoComplete + Float Label In, Dropdown = Select) · ตัวอักษรมาตรฐาน 14px · ติดตั้งด้วย `npm install --legacy-peer-deps` |
| v1.8 | 27 ก.ย. 2569 | FD-14 Editor OL_OB ตาม Figma V2 (7 Section, Header ใหม่, List content มี ✓) |
| v1.7 | 27 ก.ย. 2569 | FD-13 หน้า Content Editor ตาม Figma (OL_OB / OL_PA / AGENT) + บันทึกร่าง / ส่งอนุมัติ · ตัวกรอง Start/End Date ในรายการใช้ช่องเลือกวันที่ไปก่อน |
| v1.6 | 27 ก.ย. 2569 | FD-12 Template ตามชื่อ Channel (online) + Product type · หน้า Content Editor แสดง Template เดียว (`/package/add/:code`) |
| v1.5 | 26 ก.ย. 2569 | FD-10 ใหม่: Package management = Add Package (หน้าเดียว, ปุ่ม + Add เปิด Popup) · FD-11 ขนาดตัวอักษร · ตาราง content (Sprint 2) |
| v1.4 | 26 ก.ย. 2569 | FD-10: หน้ารายการ Package ย้ายเป็น Package › Add Package · FD-08: 1 Package หลายแผน (เราไม่ได้ Setup แผน) |
| v1.3 | 26 ก.ย. 2569 | Figma ไฟล์ใหม่ (HD-05), ชื่อเมนู Package / Seller (HD-06, FD-01), Journey B: 1 Content = 1 Package + ช่วงแสดงผล, Screen CT-01/CT-02 ใช้ Frame V2, Layout 1920px + Responsive, โครง Folder `features/package`, `features/seller`, Local path `D:\PLA_TESLA_Management\Claude_project` |
