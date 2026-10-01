# เมนู Seller (เดิม People Management) — Spec (Draft v0.3)

**บันทึกเมื่อ:** 24 กันยายน 2569 (v0.2 — ปิด OQ-P01, OQ-P02) · **อัปเดต v0.3:** 26 กันยายน 2569 — เปลี่ยนชื่อเมนูตาม Figma V2 (FD-01)

> **ชื่อเรียก (FD-01):** เมนูบนหน้าจอชื่อ **Seller** (เดิม "People management") · Role "Seller Admin" แสดงเป็น **Seller Admin** · Logic, หน้าจอ P-01…P-05 และ Data model เหมือนเดิมทุกข้อ · Route ใน Prototype: `/seller/...`
**สถานะ:** Draft — ยืนยันหลักการครบแล้ว (PM-01…PM-07) ไม่มี Open Question ค้าง
**อ้างอิง:** D-01 (People = ผู้ขาย), D-03 (ผูก Campaign ในเมนู People ไม่ต้องอนุมัติ), D-05 (Flat, 1 คน = 1 กลุ่มต่อ Package), CC-04 (เช็คกลุ่มเฉพาะช่องทาง Agent), CC-08 (Snapshot ณ วันยื่นใบคำขอ), CC-10 / BR-CP-008–009 (Referral link รายผู้ขาย)

---

## 0. Confirmed Decisions (24 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| PM-01 | ที่มารายชื่อของ Package Online (CHN04, ALL) | **พนักงาน/ตัวแทนในฐานข้อมูลของเรา** — ใช้จัดกลุ่มเพื่อแจก Referral link และติดตามยอด (การให้สิทธิ์ Campaign ช่องทาง Online ยังไม่เช็คกลุ่มตาม CC-04) |
| PM-02 | ผู้ขายใบอนุญาตหมดอายุ / ไม่ Active | **แสดงสีเทา ลากเข้ากลุ่มไม่ได้**; ถ้าอยู่ในกลุ่มแล้ว → ติดป้ายเตือนและ **ไม่ได้รับสิทธิ์ Campaign / ลิงก์หยุดนับยอด** จนกว่าจะกลับมา Active |
| PM-03 | ขอบเขตกลุ่ม | **แยกกลุ่มต่อ Package × ช่องทาง** (Workspace = Package + Channel) |
| PM-04 | ฟีเจอร์เสริม | เอาครบ 4 ตัว: คัดลอกกลุ่มจาก Package อื่น, Import จาก Excel, Export เป็น Excel, Audit log |
| PM-05 | ที่มารายชื่อตาม seller_Selection_Mode | CUSTOM → package_Sellers ของช่องทางนั้น (เสริมรายละเอียดจากฐานข้อมูลเรา) / ALL → ผู้ขายทุกคนในฐานข้อมูลเราที่ขายช่องทางนั้นได้ |
| PM-06 | ใบอนุญาตของพนักงาน (OQ-P01) | **พนักงานที่ไม่ใช่ตัวแทนไม่ต้องมีใบอนุญาต** — ตรวจเฉพาะสถานะ Active; ตัวแทนต้อง Active + ใบอนุญาตยังไม่หมดอายุ |
| PM-07 | แหล่งฐานข้อมูลผู้ขาย (OQ-P02) | **นอกขอบเขตรอบนี้** — Prototype ใช้ Mock ใน SQLite |

---

## 1. หน้าจอ

| ID | หน้าจอ | เนื้อหาหลัก |
|---|---|---|
| P-01 | Seller Workspace (รายการ Workspace) | 1 แถว = Package × Channel ที่ Content Approved; คอลัมน์: package_Code, ชื่อ, Channel, Selection mode (ALL/CUSTOM), จำนวนผู้ขาย, จำนวนกลุ่ม, ยังไม่มีกลุ่ม, ไม่พร้อมขาย (สีเทา), Campaign ที่ผูกแล้ว, แก้ไขล่าสุด |
| P-02 | จัดกลุ่ม (Drag & Drop) | ซ้าย: รายชื่อ "ยังไม่มีกลุ่ม" (ค้นหา, Filter, เลือกหลายคน, "เลือกทั้งหมดที่กรอง"); ขวา: การ์ดกลุ่ม (ชื่อ, จำนวนคน, Campaign ที่ผูก) — ลากคน/หลายคนเข้า-ออก-ย้ายกลุ่ม |
| P-03 | รายละเอียดกลุ่ม & ผูก Campaign | แก้ชื่อ/คำอธิบาย/สี, รายชื่อสมาชิก, แท็บ Campaign: เพิ่ม/ถอด Campaign ที่มีสิทธิ์ผูก |
| P-04 | Referral links | ต่อ Campaign ประเภท Referral: รายการลิงก์รายผู้ขาย, คัดลอก, QR, คลิก → ใบคำขอ → อนุมัติ |
| P-05 | เครื่องมือ | คัดลอกกลุ่ม, Import Excel, Export Excel, Audit log |

## 2. ข้อมูลผู้ขายที่แสดง

| ID | Field | แหล่ง | ใช้ Filter | หมายเหตุ |
|---|---|---|---|---|
| SL-01 | รหัสผู้ขาย (seller_Code) | Package / ฐานข้อมูลเรา | ค้นหา | Key |
| SL-02 | ชื่อ-นามสกุล (seller_Name) | Package / ฐานข้อมูลเรา | ค้นหา | |
| SL-03 | ประเภทผู้ขาย | ฐานข้อมูลเรา | ✓ | ตัวแทน / พนักงาน |
| SL-04 | สาขา / สังกัด | ฐานข้อมูลเรา | ✓ | |
| SL-05 | ทีม / หน่วย | ฐานข้อมูลเรา | ✓ | |
| SL-06 | ระดับ / ตำแหน่ง | ฐานข้อมูลเรา | ✓ | |
| SL-07 | เลขที่ใบอนุญาตตัวแทน | ฐานข้อมูลเรา | | บังคับเฉพาะตัวแทน; พนักงานว่างได้ (PM-06) |
| SL-08 | วันหมดอายุใบอนุญาต | ฐานข้อมูลเรา | ✓ (หมดใน 30 วัน / หมดแล้ว) | ใช้ PM-02 กับตัวแทนเท่านั้น |
| SL-09 | สถานะ | ฐานข้อมูลเรา | ✓ | Active / พักงาน / สิ้นสุด |
| SL-10 | เบอร์โทร / อีเมล | ฐานข้อมูลเรา | | ใช้ส่ง Referral link; แสดงแบบ Mask ในตาราง (PDPA) |
| SL-11 | กลุ่มปัจจุบัน | TESLA Mgmt | ✓ | ว่าง = ยังไม่มีกลุ่ม |

**ผู้ขายที่ "พร้อมขาย" (Eligible seller)** = สถานะ Active **และ** (ตัวแทน: ใบอนุญาตยังไม่หมดอายุ / พนักงาน: ไม่ต้องมีใบอนุญาต — PM-06)

## 3. Business Requirements

| ID | Requirement | Priority | Rationale | Acceptance Criteria |
|---|---|---|---|---|
| BR-PM-001 | แสดง Workspace ต่อ Package × Channel ที่ Content Approved (PM-03) | Must | กลุ่มขึ้นกับรายชื่อรายช่องทาง | Package ที่ Content ยังไม่ Approved ไม่แสดง; 1 Package 2 ช่องทาง = 2 แถว |
| BR-PM-002 | โหลดรายชื่อตาม Selection mode (PM-01, PM-05) | Must | ให้รายชื่อตรงกับสิทธิ์ขายของ Package | CUSTOM = เฉพาะ package_Sellers ของช่องทางนั้น; ALL = ผู้ขายทุกคนของช่องทางนั้นในฐานข้อมูลเรา; จำนวนในหน้าจอ = จำนวนจากแหล่งข้อมูล |
| BR-PM-003 | สร้าง / แก้ไข / ลบกลุ่ม | Must | – | ชื่อกลุ่ม unique ใน Workspace (≤ 100 ตัวอักษร); ลบกลุ่ม → สมาชิกกลับเป็น "ยังไม่มีกลุ่ม", Campaign ที่ผูกถูกถอดทันที, เก็บประวัติ |
| BR-PM-004 | Drag & Drop ผู้ขายเข้า / ออก / ย้ายกลุ่ม ทั้งทีละคนและหลายคน | Must | Journey Step 9 | 1 คนอยู่ได้ 1 กลุ่มต่อ Workspace (ลาก = ย้าย); เลือกหลายคนแล้วลากได้; "ย้ายทุกคนที่กรองอยู่" ได้ในคำสั่งเดียว; บันทึกแล้วแสดงผลทันที |
| BR-PM-005 | ผู้ขายไม่พร้อมขาย (PM-02, PM-06) | Must | ป้องกันการให้สิทธิ์ผ่านผู้ขายที่ขายไม่ได้ตามกฎหมาย | แสดงสีเทา + เหตุผล, ลากไม่ได้; คนที่อยู่ในกลุ่มแล้วติดป้าย "ไม่พร้อมขาย" และระบบไม่ให้สิทธิ์ Campaign / ลิงก์หยุดนับยอดใหม่; กลับมาพร้อมขาย → ใช้งานต่อได้เองไม่ต้องจัดกลุ่มใหม่; พนักงานตรวจเฉพาะสถานะ |
| BR-PM-006 | ผูก / ถอด Campaign กับกลุ่ม (D-03) | Must | Journey Step 11 | เลือกได้เฉพาะ Campaign สถานะ Approved/Active ที่มี Package นี้ใน CP-COM-08 และ Channel นี้ใน CP-COM-07; 1 กลุ่มผูกได้หลาย Campaign; มีผลกับใบคำขอใหม่ทันที (ใบคำขอเดิมใช้ Snapshot ตาม CC-08) |
| BR-PM-007 | Sync รายชื่อแล้วผู้ขายหายจาก Package | Must | กติกาตัดสิทธิ์ทันที | ผู้ขายที่ไม่อยู่ในแหล่งข้อมูลแล้วถูกนำออกจากกลุ่มอัตโนมัติ + บันทึก Audit log เหตุผล "Removed by sync" |
| BR-PM-008 | คัดลอกกลุ่มจาก Workspace อื่น (PM-04) | Should | ลดงานจัดกลุ่มซ้ำ | คัดลอกได้เฉพาะเข้า Workspace ที่ยังไม่มีกลุ่ม; คัดลอกชื่อกลุ่ม + สมาชิกที่มีอยู่ใน Workspace ปลายทาง; **ไม่คัดลอก Campaign ที่ผูก**; แสดงสรุปจำนวนคนที่ข้าม (ไม่อยู่ในรายชื่อปลายทาง / ไม่พร้อมขาย) |
| BR-PM-009 | Import จาก Excel (PM-04) | Should | จัดกลุ่มจำนวนมาก | Template 2 คอลัมน์: seller_Code, group_Name; ชื่อกลุ่มใหม่ → สร้างให้อัตโนมัติ; ตรวจก่อนบันทึก (Preview) และแสดงรายการผิดพลาดต่อแถว: ไม่พบรหัส / ไม่อยู่ในรายชื่อ Workspace / ไม่พร้อมขาย / รหัสซ้ำในไฟล์; คนที่อยู่กลุ่มอื่นอยู่แล้ว → ย้ายพร้อมเตือน; .xlsx ≤ 5 MB, ≤ 10,000 แถว |
| BR-PM-010 | Export เป็น Excel (PM-04) | Should | ส่งฝ่ายขาย/Agency ตรวจ | ไฟล์มี: Workspace, กลุ่ม, SL-01–SL-09, Campaign ที่ผูกกับกลุ่ม; ตามตัวกรองปัจจุบัน |
| BR-PM-011 | Audit log (PM-04) | Must | ตรวจสอบย้อนหลังการให้สิทธิ์ | บันทึก: สร้าง/แก้/ลบกลุ่ม, ย้ายคน (จาก → ไป), ผูก/ถอด Campaign, Import, Copy, Removed by sync — พร้อมผู้ทำ + วันเวลา; ค้นหาตามผู้ขาย / กลุ่ม / ช่วงวัน; แก้ไขหรือลบ Log ไม่ได้ |
| BR-PM-012 | รองรับรายชื่อจำนวนมาก | Must | Package ALL อาจมีหลายพันคน | แสดงแบบแบ่งหน้า/Virtual scroll; ค้นหา + Filter ตอบภายใน 2 วินาทีที่ 10,000 รายชื่อ |

## 4. Data Model (สำหรับ SA)

| Entity | Key fields |
|---|---|
| Seller (อ่านจากฐานข้อมูลเรา — Mock ใน Prototype) | seller_Code, ชื่อ, ประเภท (ตัวแทน/พนักงาน), สาขา, ทีม, ระดับ, license_No, license_Expiry, status, ช่องทางที่ขายได้, เบอร์, อีเมล |
| People Workspace | workspace_Id, package_Code, channel_Code, selection_Mode, last_Sync |
| Seller Group | group_Id, workspace_Id, group_Name, คำอธิบาย, สี, is_Deleted, created/updated by/date |
| Group Member | group_Id, seller_Code, วันที่เข้ากลุ่ม — **unique (workspace_Id, seller_Code)** |
| Group–Campaign | group_Id, campaign_Code, วันที่ผูก, ผู้ผูก, วันที่ถอด |
| People Audit Log | log_Id, action, workspace_Id, group_Id, seller_Code, campaign_Code, before/after, actor, timestamp, source (UI / Import / Copy / Sync) |

## 5. Open Questions

| # | คำถาม | สถานะ |
|---|---|---|
| OQ-P01 | พนักงานต้องมีใบอนุญาตไหม | ✅ PM-06 (ไม่ต้อง) |
| OQ-P02 | แหล่งฐานข้อมูลผู้ขาย | ✅ PM-07 (นอกขอบเขต, Mock) |

---

## 6. Prototype (Sprint 4 — Figma page 03 People)

| หน้าจอ | Route | Figma | หมายเหตุการทำงานใน Prototype |
|---|---|---|---|
| P-01 Workspace | `/seller/workspace` | 15:1392 | Workspace = Package × Channel ที่ Content Approved (หรือมี Version ที่อนุมัติแล้ว) และ Package เปิดใช้งาน |
| P-02 Board | `/seller/workspace/:pkg/:ch` | 15:1621 | ลากด้วย PrimeNG `pDraggable` / `pDroppable` · เลือกหลายคนแล้วลาก / ย้ายด้วย Dropdown / กด "วาง N คนที่เลือกที่นี่" (ใช้แทนการลากบนจอสัมผัส) · ลากสมาชิกกลับช่องซ้าย = นำออกจากกลุ่ม |
| P-03 รายละเอียดกลุ่ม | `/seller/group/:id` | 17:224 | แก้ชื่อ / คำอธิบาย / สี · ผูก / ถอด Campaign (เฉพาะ Approved ที่ยังไม่หมดอายุ) · ลบกลุ่ม (ยืนยันก่อน) |
| P-04 Referral links | `/seller/referral`, `/seller/referral/:code` | 17:496 | ลิงก์สร้างอัตโนมัติเมื่อผู้ขายอยู่ในกลุ่มที่ผูก Campaign Referral · ผู้ขายไม่พร้อมขาย = "หยุดนับ" · QR: Prototype แสดงลิงก์ (ระบบจริงสร้างรูป QR) |
| P-05 เครื่องมือ | `/seller/tools` | 17:733 | คัดลอกกลุ่ม (ตรวจก่อนคัดลอก) · Import / Export ใช้ไฟล์ **.csv** (เปิด / บันทึกจาก Excel ได้ — Prototype ยังไม่อ่าน .xlsx โดยตรง) · Audit log กรองตาม Workspace / ผู้ขาย / กลุ่ม / ช่วงวัน |

- API: `/api/people/*` (ดูหัวไฟล์ `server/src/routes/people.routes.ts`) · แก้ไขได้เฉพาะ Role **Seller Admin** (User D — U005) · Role อื่นดูอย่างเดียว
- ข้อมูลจำลอง: `server/src/db/seed/people.seed.ts` — ตัวแทน CHN01 60 คน (มีกรณีใบอนุญาตหมด / ใกล้หมด / พักงาน / สิ้นสุด), พนักงาน CHN04 25 คน, กลุ่มตัวอย่าง 4 กลุ่ม, Campaign ที่ผูก, สถิติลิงก์ และ Audit log
- Seed เพิ่ม Content AGENT ที่ Approved: CT000006 (ST000006 × CHN01, ALL) และ CT000007 (ST000014 × CHN01, CUSTOM) · Campaign CMP-VOU-2609-0002, CMP-REF-2609-0002, CMP-GFT-2609-0001 (Draft) บน ST000006 × CHN01

---

## Change log

| Version | วันที่ | เปลี่ยนอะไร |
|---|---|---|
| v0.2 | 24 ก.ย. 2569 | ปิด OQ-P01, OQ-P02 |
| v0.3 | 26 ก.ย. 2569 | FD-01: เปลี่ยนชื่อเมนูเป็น **Seller**, Role เป็น **Seller Admin** (Logic ไม่เปลี่ยน) |
| v0.4 | 28 ก.ย. 2569 | เพิ่ม §6 Prototype Sprint 4 (P-01…P-05 ตาม Figma page 03 People) |
