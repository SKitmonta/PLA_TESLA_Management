# TESLA Management — Handoff สำหรับย้ายไป User ใหม่ (v1)

**จัดทำเมื่อ:** 24 กันยายน 2569
**เจ้าของงาน:** พี่ฟิล์ม (BA/SA, IT Department, Phillip Life Assurance — PLA)
**ต้นทาง:** Claude Project "TESLA content management" (User เดิม)
**สถานะ ณ วันที่ส่งต่อ:** Journey ✅ ครบทุกเมนู · Spec 04–10 ✅ ไม่มี Open Question ที่ Block · Mockup ✅ 32 หน้า · Figma ✅ 32 หน้า (Layer แก้ได้) · **ขั้นถัดไป = Claude Code (Angular Prototype บน localhost)**

> ไฟล์นี้คือจุดเริ่มต้น อ่านไฟล์นี้ก่อน แล้วค่อยเปิดเอกสารใน `docs/` ตามที่ต้องการ

---

## 1. ขั้นตอนย้ายไป User ใหม่ (Checklist)

| # | ขั้นตอน | ทำที่ | หมายเหตุ |
|---|---|---|---|
| 1 | สร้าง Project ใหม่ชื่อ **"TESLA content management"** | claude.ai (User ใหม่) | |
| 2 | Upload ไฟล์ทั้งหมดใน `docs/` (00–10) และไฟล์นี้เข้า **Project knowledge** | Project › Files | หรือ Upload ไฟล์ `Handoff-AllDocs_...md` ไฟล์เดียวแทนก็ได้ (รวมทุกเอกสารแล้ว) |
| 3 | ใส่ **Personal preferences** ตาม §3.2 | Settings › Profile | คัดลอกข้อความไปวางได้ทันที |
| 4 | ใส่ **Project instructions** ตาม §3.3 | Project › Instructions | |
| 5 | เชิญ User ใหม่เข้า **Figma file** (Editor) | Figma › Share | ไฟล์อยู่ใน pla.figma's team ต้องให้เจ้าของทีมเชิญ |
| 6 | เชื่อม Connector **Figma** และ **GitHub** ใน User ใหม่ | Settings › Connectors | Claude จะอ่าน/แก้ Figma และ Repo ได้ |
| 7 | ให้สิทธิ์ GitHub repo `kitmontaphilliplife/TESLA_Management_Full` กับบัญชีที่ใช้ | GitHub | branch `dev` |
| 8 | (ถ้าต้องการ) นำ Memory ใน §8 เข้าระบบ | แชทใหม่: "นำเข้า memory จากไฟล์นี้" | ใช้ skill import-memory |
| 9 | เปิดแชทแรกด้วย **Resume prompt** ใน §10 | Project ใหม่ | |

**สิ่งที่ย้ายตามไปเองไม่ได้ (ต้องทำเอง)**

| รายการ | เหตุผล | ทางแก้ |
|---|---|---|
| ประวัติแชทเดิม | ผูกกับบัญชีเดิม | ใช้เอกสารใน Package นี้แทน (ครบทุก Decision แล้ว) |
| Claude Artifact (Mockup Design canvas) | เป็น Private ของบัญชีเดิม | ใช้ `mockup/html` + `mockup/png` ใน Package นี้ หรือกด Share จากบัญชีเดิมก่อนย้าย |
| Memory ของบัญชีเดิม | ไม่ Sync ข้ามบัญชี | §8 |
| Connector / สิทธิ์ Figma, GitHub | ผูกกับบัญชี | ขั้นตอน 5–7 |

---

## 2. ภาพรวมโครงการ

**TESLA Management** = ระบบ Back-office สำหรับทำ Content ขายแบบประกัน, ตั้งค่า Campaign ส่งเสริมการขาย, จัดกลุ่มผู้ขาย และติดตามยอดขาย — เป็น Sub-module ที่เชื่อมกับระบบ TESLA/iApply (ใช้ Master data และรหัสสินค้าร่วมกัน)

### 2.1 Module (Rebaseline 24 ก.ย. 2569)

| # | Module | สรุป | Spec |
|---|---|---|---|
| 1 | Content selling tools | นำ Package จาก Master มาสร้าง Content ตาม Template (OL_OB / OL_PA / AGENT) → ขออนุมัติ 1 ระดับ | 05, 10 |
| 2 | Campaign setup | 9 ประเภท (Voucher, Discount, Cashback, Free gift, Installment, Reward points, Referral, Bundle, Lucky draw) Wizard 5 ขั้น → ขออนุมัติ 1 ระดับ; ให้สิทธิ์อัตโนมัติ (Grant) | 06 |
| 3 | People management | Workspace = Package × Channel; จัดกลุ่มผู้ขายแบบ Flat ด้วย Drag & Drop; ผูก Campaign กับกลุ่ม (ไม่ต้องอนุมัติ, มี Audit log) | 07 |
| 4 | Overview | KPI / Target vs ยอดขาย (FYP / APE / จำนวนกรมธรรม์), Real-time, แสดงตาม Role | 08 |
| 5 | Master setup | Package Master (Sync), Master ที่สร้างเอง MS-01…MS-22, Mapping ข้อความแสดงผล, Master ที่ Sync (Read-only) | 06 §5, 05 |

### 2.2 วิธีทำงาน 3 ช่วง

| ช่วง | เครื่องมือ | Output | สถานะ |
|---|---|---|---|
| 1 | Claude Chat | Business Journey + Spec 04–10 | ✅ เสร็จ |
| 2 | Claude Design → Figma | Mockup 32 หน้า | ✅ เสร็จ (พี่ฟิล์มเริ่มปรับใน Figma แล้ว) |
| 3 | Claude Code | Prototype Angular + Node/Express + SQLite บน localhost | ⏭ ยังไม่เริ่ม |

---

## 3. ข้อกำหนดการทำงาน (สำคัญ — Claude ต้องทำตาม)

### 3.1 Working constraints

| # | ข้อกำหนด |
|---|---|
| W-01 | Stack: **Angular (latest) + TypeScript** / **Node.js + Express (TS)** / **SQLite** |
| W-02 | Repo local: `C:\Users\Kitmonta\Documents\Backup film\TESLA\TESLA-Management` (VS Code) |
| W-03 | GitHub: https://github.com/kitmontaphilliplife/TESLA_Management_Full — branch **`dev`** |
| W-04 | **ทำงานบน localhost ก่อน — `git push` เฉพาะเมื่อพี่ฟิล์มสั่งเท่านั้น** |
| W-05 | โครงไฟล์ **1 เมนู = 1 folder** (`features/<menu>/` มี .ts / .html / .scss ของตัวเอง) + `core/`, `shared/`, `layout/`, `server/` (ดู doc 09 §5) |
| W-06 | Theme ตาม **BMW-UW**: https://bmw-uw-app-dev.philliplife.com/underwriting/list (Token ใน doc 09 §4) |
| W-07 | Token หมดอายุ → แจ้งเตือนแบบ Popup ได้เลย; การขอสิทธิ์เข้าถึง → Auto approve (พี่ฟิล์มอนุญาต) |
| W-08 | ห้ามสร้าง .docx จนกว่าพี่ฟิล์มสั่ง — ระหว่างทางให้อัปเดต Markdown ใน Project |
| W-09 | ห้ามแก้ Component ใน Figma ที่พี่ฟิล์มกำลังแก้อยู่; ตรวจ Layer ตามชื่อ ไม่ใช่ตามลำดับ |
| W-10 | Figma = Layout / Label; Spec 04–10 = Logic — ขัดกันต้องถามก่อนเขียน Code (HD-04) |
| W-11 | ตั้งชื่อไฟล์ Deliverable: `DeliverableName_Project_YYYYMMDD_vN` |

### 3.2 Personal preferences (คัดลอกไปวางใน Settings ของ User ใหม่)

```
บทบาทของฉัน: Business Analyst ของบริษัทประกันชีวิตในประเทศไทย
ทำงานด้าน core insurance transformation — policy administration,
underwriting, agency management, accounting integration, ECM และ digital

หน้าที่หลักของฉันคือรวบรวม requirement และจัดทำ BRD (Business Requirements
Document) ที่ครบถ้วน พร้อมส่งต่อให้ System Analyst ทำ SRS ต่อได้ทันที

เวลาตอบฉัน ขอให้:
- ใช้ศัพท์ประกันชีวิตไทยให้ถูกต้อง (กรมธรรม์, ผู้เอาประกัน, ผู้รับประโยชน์,
  เบี้ยประกัน, ผลประโยชน์, การพิจารณารับประกัน, การให้บริการกรมธรรม์)
- อ้างอิงหลักเกณฑ์ คปภ. (OIC) เมื่อเกี่ยวข้อง
- นำเสนอเป็นตารางและรูปแบบ management-ready เสมอ
- ให้ requirement แต่ละข้อมี ID (BR-001...), priority, rationale และ
  acceptance criteria ที่วัดผลได้
- เน้น deliverable ที่ implementation-ready มากกว่า concept กว้างๆ
- ถ้า requirement กำกวมหรือขัดแย้ง ให้ถามคำถามเพื่อ clarify ก่อนเขียน

ฉันเขียน BRD เพื่อให้ SA เอาไปแปลงเป็น SRS ต่อ ดังนั้นช่วยมองล่วงหน้าด้วยว่า
SA และ Dev ต้องการข้อมูลอะไรเพื่อ implement ได้จริง
```

### 3.3 Project instructions (วางใน Project ใหม่)

```
โครงการ TESLA Management (PLA) — อ่าน 00-START-HERE.md ก่อนทุกครั้ง
- Source of truth: Spec 04–10 (Logic) + Figma O4sj5GNRZwiaKKIOEBZpQC (Layout)
- Doc 09 = Journey Final + Screen Inventory + Handoff สำหรับ Code
- Stack: Angular + TS / Node Express TS / SQLite, 1 เมนู = 1 folder, Theme BMW-UW
- ทำบน localhost เท่านั้น ห้าม git push จนกว่าพี่ฟิล์มสั่ง (branch dev)
- ไม่สร้าง .docx จนกว่าสั่ง; อัปเดต Markdown ใน Project แทน
- Figma กับ Spec ขัดกัน → ถามก่อน
```

---

## 4. Asset & Link

| รายการ | ที่อยู่ | หมายเหตุ |
|---|---|---|
| **Figma (หลัก)** | https://www.figma.com/design/O4sj5GNRZwiaKKIOEBZpQC | pla.figma's team · 32 หน้า · Baseline v1.0 = 24 ก.ย. 2569 |
| Mockup Design canvas (บัญชีเดิม) | https://claude.ai/artifact/Sh5RS88yDc9Cdceujkq8QT | Private — สำรองไว้ใน `mockup/` |
| Mockup Package Setting เดิม (10 ก.ย., ก่อน Rebaseline) | https://claude.ai/code/artifact/27406607-45b8-415a-84ab-d868aab07173 | อ้างอิงประวัติเท่านั้น |
| GitHub | https://github.com/kitmontaphilliplife/TESLA_Management_Full (branch `dev`) | |
| Local repo | `C:\Users\Kitmonta\Documents\Backup film\TESLA\TESLA-Management` | |
| Theme อ้างอิง | https://bmw-uw-app-dev.philliplife.com/underwriting/list | |
| เว็บอ้างอิง OL_OB | https://online.philliplife.com/products/savings/Max10OneXtra | |
| เว็บอ้างอิง OL_PA | https://online.philliplife.com/products/PA/kids-pa | |
| Payload ตัวอย่าง | ST000007 (10/1 Online), ST000014 (10/1 Agent), ST000006 (90/20 Agent) | ไฟล์ต้นฉบับอยู่ที่พี่ฟิล์ม — **ต้อง Upload ใหม่** ใน Project ใหม่ (ใช้ทำ Seed data) |
| BRD v0.1 ชุดเดิม (9 ก.ย.) | BRD.docx, Journey.docx, Backlog.xlsx, Timeline.xlsx | อยู่ที่พี่ฟิล์ม — เป็น Baseline ก่อน Rebaseline |

---

## 5. Decision Register (สรุปรวม — รายละเอียดอยู่ใน doc ที่อ้าง)

| กลุ่ม | ID | การตัดสินใจ | Doc |
|---|---|---|---|
| Rebaseline | D-01 | People = ผู้ขาย (ตัวแทน/พนักงาน) ไม่ใช่ลูกค้า | 04 |
|  | D-02 | Package ไม่มี Approval ของตัวเอง — Approval อยู่ที่ Content | 04 |
|  | D-03 | ผูก Campaign ↔ กลุ่ม ในเมนู People ไม่ต้องอนุมัติ | 04 |
|  | D-04 | Stack Angular / Node Express / SQLite | 04 |
|  | D-05 | กลุ่มแบบ Flat: 1 คน = 1 กลุ่มต่อ Workspace (แทน Nested เดิม) | 04 |
|  | D-06 | Maker ≠ Approver (Segregation of Duties) | 04 |
|  | D-07 | แก้ไขรายการที่ Approved = Version ใหม่ | 04 |
|  | D-08 | โมดูล Content เฟสแรก: Banner, Sticky bar, Key Features/Advantages 0–N, Recommend 1–N, Free text/Image/Document | 04 |
| กติกาเดิมที่คงไว้ | — | Campaign ประเภทเดียวกันใน Package เดียวห้ามช่วงวันทับ · Stack ข้ามประเภทได้ ไม่มี Cap · Channel Campaign ⊆ Package · Package Inactive / กลุ่มถูกลบ = ตัดสิทธิ์ทันที เก็บประวัติ | 03, 04 |
| Content | CD-01 | OL_PA: 1 Content ผูกได้หลาย Package (1 แผน = 1 Package) | 05 |
|  | CD-02 | Template ตัดสินจาก Channel ที่เลือกใน Popup | 05 |
|  | CD-03 | Package ที่ไม่ตรง Template ไม่แสดงใน Popup | 05 |
|  | CD-04 | ข้อมูลที่ไม่มีใน Payload → Admin กรอกใน Content | 05 |
|  | HD-01 | OL_PA = CHN04 + **PTY08** | 09 |
|  | HD-02 | ต้องมีหน้า Package Master | 09 |
|  | AG-D01–04 | AGENT คล้าย OL_OB, แสดงผ่าน Referral link ตัวแทน, เพิ่ม Sales kit / ชุดแชร์ / จุดขาย; Q-05, Q-07, Q-08 ยืนยัน | 10 |
| Campaign | CC-01 | ช่วงวันอยู่ในกรอบ Package: เริ่ม ≥ max(วันนี้, start_Date), สิ้นสุด ≤ end_Date | 06 |
|  | CC-02 | นับสิทธิ์รายกรมธรรม์; เก็บ "เข้าเงื่อนไข" และ "เข้าเงื่อนไข + อนุมัติ" | 06 |
|  | CC-03 | ให้สิทธิ์อัตโนมัติ ได้ทุก Campaign ที่เข้าเงื่อนไข | 06 |
|  | CC-04 | Agent เช็คกลุ่มผู้ขาย / Online ไม่เช็ค | 06 |
|  | CC-05 | Promo code เป็นทางเลือก | 06 |
|  | CC-06 | จองตอนเข้าเงื่อนไข → ตัดตอนอนุมัติ → คืนเมื่อไม่อนุมัติ | 06 |
|  | CC-07 | รับข้อมูลกรมธรรม์ผ่าน API (นอกขอบเขต — Prototype ใช้ Mock) | 06 |
|  | CC-08 | Snapshot ณ วันยื่นใบคำขอ | 06 |
|  | CC-09 | Discount / Bundle ลดเบี้ยตรงได้ | 06 |
|  | CC-10 | Referral = URL รายผู้ขายเพื่อนับยอด ไม่มีสิทธิ์พิเศษ | 06 |
|  | CC-11 | ใบอนุญาต Lucky draw: ทีม Marketing ขอ ระบบเก็บเลข + ไฟล์ | 06 |
| People | PM-01–07 | Online ใช้รายชื่อจากฐานข้อมูลเรา · ไม่พร้อมขาย = สีเทา ลากไม่ได้ · Workspace = Package × Channel · มี Copy / Import / Export / Audit · CUSTOM vs ALL · พนักงานไม่ต้องมีใบอนุญาต · ฐานข้อมูลผู้ขายจริงนอกขอบเขต (Mock) | 07 |
| Overview | OV-01–07 | Target ระดับ Package จาก sale_Target + ตั้งเพิ่มระดับช่องทาง/กลุ่ม/ผู้ขาย · FYP / APE / จำนวนกรมธรรม์ · หน้าเดียวตาม Role · Real-time · sale_Target = FYP บาทตลอดอายุ Package · APE = Σ(เบี้ยงวด × งวด/ปี) + 10% × Single premium · ผู้บริหารเห็นทุก Package | 08 |
| Design | HD-04 | Figma = Layout, Spec = Logic, ขัดกันต้องถาม | 09 |

**Template Resolution Matrix:** CHN04 + PTY01 → OL_OB · CHN04 + PTY08 → OL_PA · CHN01 + PTY01 → AGENT · อื่นๆ → ไม่แสดง

---

## 6. Screen Inventory ↔ Figma ↔ ไฟล์ Mockup

| Menu | ID | หน้าจอ | Figma node | ไฟล์ใน `mockup/` |
|---|---|---|---|---|
| Overview | OV-00 | Dashboard | `18:83` | Overview |
|  | OV-10 | ตั้ง Target | `17:1022` | TargetSetting |
| Content | CT-01 | รายการ Content | `5:90` | ContentList |
|  | CT-02 | Popup Add Package | `7:148` | AddPackage |
|  | CT-03 | Editor OL_OB | `8:401` | EditorOB |
|  | CT-04 | Editor OL_PA | `7:535` | EditorPA |
|  | CT-05 | Editor AGENT | `9:540` | EditorAG |
|  | CT-06 | หน้าอนุมัติ | `5:339` | Approval |
| Campaign | CP-01 | รายการ Campaign | `10:99` | CampaignList |
|  | CP-02 | ขั้น 1 เลือกประเภท | `9:1253` | CampaignStep1 |
|  | CP-03 | ขั้น 2 ข้อมูลทั่วไป | `10:376` | CampaignStep2 |
|  | CP-04 | ขั้น 3 สิทธิประโยชน์ — Cashback | `10:701` | CampaignStep3 |
|  |  | — Voucher | `11:378` | CampaignStep3Voucher |
|  |  | — Discount | `10:973` | CampaignStep3Discount |
|  |  | — Free gift | `11:651` | CampaignStep3Gift |
|  |  | — Installment | `11:869` | CampaignStep3Installment |
|  |  | — Reward points | `11:1136` | CampaignStep3Points |
|  |  | — Referral | `13:655` | CampaignStep3Referral |
|  |  | — Bundle | `13:851` | CampaignStep3Bundle |
|  |  | — Lucky draw | `13:1069` | CampaignStep3LuckyDraw |
|  | CP-05 | ขั้น 4 เงื่อนไขผู้มีสิทธิ์ | `13:1356` | CampaignStep4 |
|  | CP-06 | ขั้น 5 ตรวจสอบ & ส่งอนุมัติ | `15:943` | CampaignStep5 |
|  | CP-07 | รายละเอียด + Grant | `15:1159` | CampaignDetail |
| People | P-01 | Workspace list | `15:1392` | PeopleWorkspace |
|  | P-02 | Drag & Drop Board | `15:1621` | PeopleBoard |
|  | P-03 | Group detail & binding | `17:224` | PeopleGroup |
|  | P-04 | Referral links | `17:496` | PeopleReferral |
|  | P-05 | Tools (Copy / Import / Export / Audit) | `17:733` | PeopleTools |
| Master setup | MS-01 | Package Master | `19:345` | Main |
|  | MS-02 | Master ที่สร้างเอง | `19:871` | MasterMaintenance |
|  | MS-03 | Mapping ข้อความแสดงผล | `18:506` | DisplayMapping |
|  | MS-04 | Master ที่ Sync | `18:766` | SyncedMaster |

**Figma pages:** Cover `0:1` · Components `3:2` (Sidebar variants Overview `3:207` / Content `3:246` / Campaign `3:285` / People `3:324` / Master `3:363`, Topbar `3:384`, Icon 33 ตัว `3:33`…`3:168`, Variables "TESLA Theme" 23 ตัว) · 01 Content `3:3` · 02 Campaign `3:4` · 03 People `3:5` · 04 Overview & Master `3:6`

**หมายเหตุ:** ณ วันส่งต่อ พี่ฟิล์มเริ่มแก้ Sidebar variant Overview (`3:207`) แล้ว (เพิ่ม Frame ใหม่) — Node ID อาจเปลี่ยนถ้ามีการ Duplicate/ลบ Frame ให้ Claude ค้นจากชื่อ Frame ถ้าไม่พบ ID

---

## 7. วิธีติดตามการแก้ไขใน Figma ก่อนเขียน Code

| # | ขั้นตอน | ผู้ทำ |
|---|---|---|
| 1 | Baseline v1.0 = Figma ณ 24 ก.ย. 2569 + ไฟล์ `mockup/html` (โค้ดต้นฉบับ) + `mockup/png` (ภาพอ้างอิง) | – |
| 2 | แก้เสร็จแต่ละรอบ → บันทึก **Named version** ใน Figma (เช่น "v1.1 – ปรับ Sidebar") | พี่ฟิล์ม |
| 3 | Business rule ที่เปลี่ยน → เขียน **Comment / Annotation** บน Frame นั้น | พี่ฟิล์ม |
| 4 | ก่อน Code แต่ละเมนู Claude อ่าน Frame จาก Figma → เทียบ Baseline → สรุปรายการที่เปลี่ยนให้ยืนยัน | Claude |
| 5 | Figma ขัดกับ Spec → ถามก่อน แล้วอัปเดต Spec ตามคำตอบ | Claude |

---

## 8. Memory สำหรับ Import (ข้อเท็จจริงที่พี่ฟิล์มยืนยันไว้)

- ชื่อเรียก: พี่ฟิล์ม (Phil) — BA/SA, IT Department, Phillip Life Assurance (PLA); ทำงานแบบ Agile/Scrum; ดูแลหลายโครงการ (TESLA/iApply, TESLA Management, Ferrari, GIO, BMW/UW, Porsche, LEXUS/ECM, BIS/iApply legacy)
- สื่อสารไทย/อังกฤษ; ชอบการแก้ตรงมากกว่าอธิบายยาว; จัดการไฟล์เอง (ไม่ต้องกระจายสำเนา)
- ตั้งชื่อไฟล์ `DeliverableName_Project_YYYYMMDD_vN`
- ไม่ต้องสร้าง .docx จนกว่าสั่ง — อัปเดต Markdown ใน Project ระหว่างทาง
- TESLA Management เป็น Sub-module ของ TESLA/iApply (ใช้ Master data / รหัสสินค้าร่วม) — แยกจากโครงการ TESLA iApply sales flow
- Rebaseline 24 ก.ย. 2569: 5 Module (Content / Campaign / People / Overview / Master); Approval อยู่ที่ Content ไม่ใช่ Package; กลุ่ม Flat
- Stack Angular + TS / Node Express TS / SQLite; Repo local + GitHub branch dev; push เมื่อสั่งเท่านั้น; Theme BMW-UW
- Workflow: Claude Chat (Journey) → Claude Design (Mockup) → Figma → Claude Code
- Sign-off เอกสาร BRD ชุดเดิม: K. Yuttakarn J. / K. Chanchai P. (ใช้ skill "generate-brd" ที่ตั้งค่าเป็น Template PLA)

---

## 9. Outstanding & แผนงานถัดไป

### 9.1 เรื่องค้าง (ไม่มีข้อใด Block การเริ่ม Code)

| # | เรื่อง | ต้องการจาก | Blocker? |
|---|---|---|---|
| OUT-04 | Role จริง / การ Login | – | ไม่ (Prototype ใช้ปุ่มสลับ Role) |
| OUT-05 | Sub Product Type จริงของ Package PA | พี่ฟิล์ม / Master | ไม่ (ใช้ Placeholder) |
| OUT-07 | รายการที่พี่ฟิล์มแก้ใน Figma | พี่ฟิล์ม | ไม่ (Claude diff ให้ได้) |
| AG-Q01 | ตัวแทนดู AG-02–04 ที่ไหน | พี่ฟิล์ม | ไม่ (Prototype ใช้หน้า P-04) |
| AG-Q02 | เนื้อหา Marketing ของ 90/20 | Marketing | ไม่ (Placeholder) |
| ISS-002–005 | ใบอนุญาต ↔ Mapping, ระบบต้นทาง/รอบ Sync Master, ค่าคอมมิชชั่น | – | ไม่ (จาก BRD v0.1 — บางข้อถูกแทนด้วย Rebaseline แล้ว) |
| Deferred | API กรมธรรม์จริง (CC-07), ฐานข้อมูลผู้ขายจริง (PM-07), UI Preview/ทดลองคำนวณ (ISS-006) | – | ไม่ทำใน Prototype |

### 9.2 แผน Claude Code ที่เสนอ (รอพี่ฟิล์มยืนยันลำดับ)

| Sprint | งาน | Output |
|---|---|---|
| 0 | Scaffold Angular + Express + SQLite, Layout (Sidebar/Topbar ตาม Figma Components), Theme token, Role switcher | App รันได้บน localhost |
| 1 | Master setup + Seed (Package ST000006/07/14 + MOCK-PA01/02 + MOCK-OB02, ผู้ขาย ~50, กรมธรรม์ ~200) | MS-01…MS-04 |
| 2 | Content: List, Add Package (Template resolver), Editor OB / PA / AGENT, Approval + Version | CT-01…CT-06 |
| 3 | Campaign: Wizard 5 ขั้น 9 ประเภท, Rule builder, Approval, Grant engine | CP-01…CP-07 |
| 4 | People: Workspace, Drag & Drop, Binding, Referral links, Tools | P-01…P-05 |
| 5 | Overview: KPI, Target, Real-time | OV-00, OV-10 |

---

## 10. Resume prompt (วางเป็นข้อความแรกใน Project ใหม่)

```
สวัสดีครับ ผมพี่ฟิล์ม ย้ายโครงการ TESLA Management มาจาก User เดิม
เอกสารทั้งหมดอยู่ใน Project knowledge แล้ว (เริ่มที่ 00-START-HERE.md)
สถานะ: Journey + Spec 04–10 ครบ, Mockup 32 หน้าอยู่ใน Figma O4sj5GNRZwiaKKIOEBZpQC
งานถัดไป: เริ่ม Claude Code — Angular + Node/Express + SQLite บน localhost
ข้อกำหนด: 1 เมนู = 1 folder, Theme BMW-UW, ห้าม git push จนกว่าผมสั่ง (branch dev)
ก่อนเริ่ม รบกวนอ่าน 00-START-HERE.md และ doc 09 แล้วสรุปความเข้าใจ + ถามสิ่งที่ยังไม่ชัดครับ
```

---

## 11. รายการไฟล์ใน Package

| Path | เนื้อหา |
|---|---|
| `00-START-HERE.md` | ไฟล์นี้ |
| `docs/00-project-overview.md` | Intake 9 ก.ย. (โครงสร้างเดิม — อ้างอิงประวัติ) |
| `docs/01-brd-v0.1-deliverables.md` | รายการ Deliverable v0.1 + Open Issues ISS-001…006 |
| `docs/02-package-setting-survey-findings.md` | ผลสำรวจ Component จาก online.philliplife.com |
| `docs/03-package-campaign-seller-logic.md` | กติกา Package ↔ Campaign ↔ Seller (13 ก.ย.) |
| `docs/04-rebaseline-v0.2-journey.md` | Rebaseline 5 Module + D-01…D-08 + Working setup |
| `docs/05-content-template-spec.md` | Add Package, Template matrix, Field OL_OB / OL_PA |
| `docs/06-campaign-setup-spec.md` | Campaign 9 ประเภท, Rule builder, Grant, Referral, Master MS-01…MS-22 |
| `docs/07-people-management-spec.md` | People: Workspace, Drag & Drop, Binding, Tools, Data model |
| `docs/08-overview-spec.md` | Overview: KPI, Target, Role view |
| `docs/09-journey-final-handoff.md` | **Journey Final v1.2 + Screen Inventory + Handoff Code** |
| `docs/10-agent-template-spec.md` | Template AGENT |
| `mockup/html/*.html` | โค้ด Mockup 32 หน้า (เปิดใน Browser ได้) |
| `mockup/png/*.png` | ภาพหน้าจอ 32 หน้า (Baseline v1.0) |
| `mockup/canvas.json` | ชื่อ/ตำแหน่ง Artboard ใน Design canvas |
| `tools/figma-pipeline/` | Script ที่ใช้แปลง Mockup → Figma (Playwright + use_figma) — ใช้ถ้าต้อง Render ใหม่ |

**ลำดับความสำคัญของเอกสาร (ถ้าขัดกัน):** 09 > 10 > 05–08 > 04 > 03 > 00–02
