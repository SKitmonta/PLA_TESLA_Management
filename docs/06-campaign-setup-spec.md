# Campaign Setup — Field Spec + Master Data (Draft v0.4 สำหรับคัดออก)

**บันทึกเมื่อ:** 24 กันยายน 2569 (v0.4 — ปิด Q-C03, Q-C04, Q-C05; ออกแบบ Referral ใหม่)
**สถานะ:** Draft ที่ Claude เสนอ (พี่ฟิล์มให้คิดมาครบก่อน แล้วค่อยตัดออก) — ไม่มี Open Question ค้าง
**Campaign Type (จาก UI พี่ฟิล์ม):** Voucher (คูปอง/e-Voucher), Discount (ส่วนลดเบี้ยประกัน), Cashback (เงินคืน), Free gift (ของแถม), Installment (ผ่อนชำระ), Reward points (สะสมแต้ม), Referral (แนะนำเพื่อน), Bundle discount (ซื้อคู่ลดเพิ่ม), Lucky draw (ลุ้นรับรางวัล)

**กติกาเดิมที่ยังใช้:** ประเภทเดียวกันใน Package เดียวห้ามช่วงวันทับซ้อน / Stack ข้ามประเภทได้ถ้าเข้าเงื่อนไข / ไม่มี Cap ในระบบ / Channel ของ Campaign ⊆ Channel ของ Package / Approval 1 ระดับ, Maker ≠ Approver / แก้ไขหลัง Approved = Version ใหม่ / ผูก Campaign เข้ากลุ่มผู้ขายในเมนู People

**สัญลักษณ์:** M = Master data (เลือกจาก Dropdown) · R = Required · Pri = Must / Should / Could

---

## 0. Confirmed Decisions (24 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| CC-01 | ช่วงวัน Campaign (Q-C01) | User กำหนดเอง ภายในกรอบของ Package: **วันเริ่มต่ำสุด = max(วันนี้, start_Date)** (start_Date = null → วันนี้; ห้ามเลือกวันในอดีต) / **วันสิ้นสุดสูงสุด = end_Date** (end_Date = null → ไม่จำกัด) |
| CC-02 | หน่วยนับสิทธิ์ (Q-C02) | นับเป็น **รายกรมธรรม์** — ระบบอื่นส่งผลอนุมัติกรมธรรม์กลับมา จึงเก็บ 2 สถานะ: (1) กรมธรรม์ที่เข้าเงื่อนไข (2) กรมธรรม์ที่เข้าเงื่อนไข**และอนุมัติแล้ว** |
| CC-03 | การได้รับ Campaign (Q-C06) | **อัตโนมัติ** — ไม่ขึ้นกับ iApply: ถ้า Package มี Campaign ผูกอยู่และกรมธรรม์ตรงเงื่อนไข ลูกค้าได้ Campaign ทันที (ได้ทุก Campaign ที่เข้าเงื่อนไข — Stack) |
| CC-04 | เช็คกลุ่มผู้ขายตอนให้สิทธิ์ | **เช็คตามช่องทาง** — Agent (CHN01): ผู้ขายต้องอยู่ในกลุ่มที่ผูก Campaign ในเมนู People / Online (CHN04, ALL, ไม่มีผู้ขาย): เช็คแค่ Package + เงื่อนไขกรมธรรม์ |
| CC-05 | Promo code | **เก็บไว้เป็นทางเลือก** — ว่าง = อัตโนมัติ; มีค่า = ต้องกรอกโค้ดตรงจึงได้สิทธิ์ |
| CC-06 | จังหวะตัดงบ/จำนวนสิทธิ์ | **จองตอนเข้าเงื่อนไข → ตัดจริงตอนอนุมัติ** → ไม่อนุมัติ/ยกเลิก = คืนสิทธิ์อัตโนมัติ |
| CC-07 | ช่องทางรับข้อมูลกรมธรรม์ (Q-C07) | **API** — รายละเอียด Interface **อยู่นอกขอบเขตรอบนี้** (Prototype ใช้ข้อมูลจำลองใน SQLite แทน) |
| CC-08 | ย้ายผู้ขายออกจากกลุ่มหลังกรมธรรม์ Eligible (Q-C08) | **สิทธิ์เดิมคงอยู่** — ประเมินเงื่อนไขครั้งเดียว ณ วันที่ยื่นใบคำขอ (Snapshot); การเปลี่ยนกลุ่มภายหลังมีผลเฉพาะใบคำขอใหม่ |
| CC-09 | Discount / Bundle discount (Q-C03) | **ลดเบี้ยตรงๆ ได้** — ตัด Field บังคับ "เลขอ้างอิงความเห็นชอบอัตราเบี้ย" ออก |
| CC-10 | Referral (Q-C04) | **เป็นเพียง URL สำหรับนำไปขาย** — ผู้ขายทุกคนในกลุ่มที่ผูก Campaign ได้ลิงก์ของตัวเอง; **ไม่มีสิทธิ์พิเศษ** ใช้ติดตามยอดขายผ่านลิงก์อย่างเดียว (ลูกค้ายังได้ Campaign อื่นที่เข้าเงื่อนไขตามปกติ) |
| CC-11 | Lucky draw — ใบอนุญาตชิงโชค (Q-C05) | **ทีม Marketing เป็นผู้ขอใบอนุญาต** — ระบบเก็บเลขที่ใบอนุญาต + ไฟล์แนบเป็นหลักฐาน |

---

## 1. โครงหน้าจอ Create Campaign (Wizard 5 ขั้น)

| Step | ชื่อ | เนื้อหา |
|---|---|---|
| 1 | เลือกประเภท | การ์ด 9 ประเภท (ตาม UI) — เลือกได้ 1 ประเภทต่อ Campaign |
| 2 | ข้อมูลทั่วไป | ส่วนที่ 2 (เลือก Package ก่อน แล้วจึงเลือกช่วงวัน เพราะกรอบวันมาจาก Package) |
| 3 | รายละเอียดสิทธิประโยชน์ | ส่วนที่ 4 (เปลี่ยนตามประเภท) |
| 4 | เงื่อนไขผู้มีสิทธิ์ | ส่วนที่ 3 (Rule builder ใช้ร่วม) — **ข้ามสำหรับ Referral** |
| 5 | ตรวจสอบ & ส่งอนุมัติ | สรุป + Preview การ์ดโปรโมชัน + ส่งอนุมัติ |

**Status Campaign:** Draft → Pending Approval → Approved (Scheduled) → Active (อยู่ในช่วงวัน) → Expired / Quota Reached (อัตโนมัติ) / Suspended (หยุดชั่วคราวด้วยมือ) / Inactive · Rejected กลับเป็น Draft

---

## 2. ข้อมูลทั่วไป (ใช้ร่วมทุกประเภท)

| ID | Field | Data type | R | M | Rule / หมายเหตุ | Pri |
|---|---|---|---|---|---|---|
| CP-COM-01 | Campaign Code | Text (Auto) | ✓ | | รูปแบบ CMP-{TYPE}-{YYMM}-{Running} เช่น CMP-VOU-2609-0001; แก้ไม่ได้ | Must |
| CP-COM-02 | ชื่อ Campaign (TH / EN) | Text 150 | ✓ TH | | ใช้แสดงหน้าเว็บ | Must |
| CP-COM-03 | ประเภท Campaign | Code | ✓ | ✓ MS-01 | เลือกจาก Step 1, แก้ไม่ได้หลังบันทึก | Must |
| CP-COM-04 | วัตถุประสงค์ | Code | | ✓ MS-02 | เช่น เพิ่มยอดขายใหม่ / Retention / Launch สินค้า — ใช้ใน Overview | Should |
| CP-COM-05 | รายละเอียดโดยย่อ | Text 500 | | | | Must |
| CP-COM-08 | Package ที่ใช้ได้ | Multi-select | ✓ | Package master | เลือกเฉพาะ Package ที่ Content Approved; ใช้ Filter แบบเดียวกับ Add Package; **กรอกก่อน CP-COM-06** | Must |
| CP-COM-06 | วันเวลาเริ่ม – สิ้นสุด | DateTime | ✓ | | **CC-01:** เริ่ม ≥ max(วันนี้, start_Date ล่าสุดของ Package ที่เลือก); สิ้นสุด ≤ end_Date เร็วสุดของ Package ที่เลือก (null = ไม่จำกัด); สิ้นสุด > เริ่ม; ใช้ตรวจ Overlap ประเภทเดียวกัน; เทียบกับวันที่ยื่นใบคำขอ | Must |
| CP-COM-07 | ช่องทางขาย | Multi-code | ✓ | ✓ MS-S01 | ต้องเป็น subset ของช่องทาง Package ที่ผูก | Must |
| CP-COM-09 | งบประมาณรวม (บาท) | Decimal | | | **CC-06:** จองเมื่อกรมธรรม์เข้าเงื่อนไข, ตัดจริงเมื่ออนุมัติ; งบคงเหลือ = งบ − จอง − ใช้จริง; คงเหลือ = 0 → Quota Reached · ซ่อนสำหรับ Referral | Must |
| CP-COM-10 | จำนวนสิทธิ์รวม (กรมธรรม์) / ต่อกรมธรรม์ | Integer ×2 | | | **CC-02:** นับรายกรมธรรม์; ว่าง = ไม่จำกัด; ใช้กติกาจอง/ตัดเดียวกับงบ · ซ่อนสำหรับ Referral | Must |
| CP-COM-11 | จังหวะการให้สิทธิ์ | Code | ✓ | ✓ MS-03 | ตอนอนุมัติกรมธรรม์ (ค่าเริ่มต้น) / หลังพ้น Free look + N วัน · ซ่อนสำหรับ Referral | Must |
| CP-COM-12 | กติกาเรียกคืนสิทธิ์ (Clawback) | Code + Integer | ✓ | ✓ MS-04 | ยกเลิกใน Free look (free_Look_Period) / เวนคืนภายใน N เดือน → เรียกคืนหรือหักจากเงินคืน · ซ่อนสำหรับ Referral | Must |
| CP-COM-13 | Promo code (ทางเลือก) | Text 20 | | | **CC-05:** ว่าง = ให้อัตโนมัติ; มีค่า = ต้องกรอกโค้ดตรง (ไม่แยกตัวพิมพ์เล็ก/ใหญ่); unique ใน Campaign ที่ Active · ซ่อนสำหรับ Referral | Should |
| CP-COM-14 | ข้อกำหนดและเงื่อนไข (TH / EN) | Rich text | ✓ | ✓ MS-05 (Template) | ต้องระบุเงื่อนไขครบตามหลักการโฆษณาของ คปภ. (Compliance ตรวจ) | Must |
| CP-COM-15 | รูป Banner Desktop / Mobile / Thumbnail | Image | ✓ | | ใช้ใน Carousel โปรโมชันของ Content (OB-08) · ไม่บังคับสำหรับ Referral | Must |
| CP-COM-16 | ลำดับการแสดงผล | Integer | | | น้อย = แสดงก่อน | Should |
| CP-COM-17 | หน่วยงานเจ้าของ / Cost center / GL account | Code | ✓ | ✓ MS-06 | ส่งต่อฝ่ายบัญชีบันทึกค่าใช้จ่ายส่งเสริมการขาย | Should |
| CP-COM-18 | เอกสารแนบ (Memo อนุมัติ, หนังสือขออนุญาต) | File | | | .pdf ≤ 10 MB | Should |

## 3. เงื่อนไขผู้มีสิทธิ์ — Rule builder (ใช้ร่วมทุกประเภท ยกเว้น Referral)

รูปแบบ: เงื่อนไขหลายข้อต่อกันแบบ AND; แต่ละข้อ = Attribute + Operator + Value (เลือก Attribute จาก MS-07)

| ID | Attribute | Operator | ค่า / แหล่ง Master | ตัวอย่าง | Pri |
|---|---|---|---|---|---|
| CP-ELG-01 | เบี้ยประกันปีแรก (FYP) | ≥, ≤, ระหว่าง | บาท | ≥ 30,000 | Must |
| CP-ELG-02 | เบี้ยรายปี (Annualized) | ≥, ≤, ระหว่าง | บาท | ≥ 10,000 | Should |
| CP-ELG-03 | จำนวนเงินเอาประกันภัย | ≥, ≤, ระหว่าง | บาท | ≥ 500,000 | Should |
| CP-ELG-04 | งวดการชำระเบี้ย | อยู่ใน | MS-S02 Payment mode | รายปี | Must |
| CP-ELG-05 | ช่องทางชำระเบี้ย | อยู่ใน | MS-S03 Payment method | บัตรเครดิต | Must |
| CP-ELG-06 | อายุผู้เอาประกันภัย | ระหว่าง | ปี | 20–45 | Should |
| CP-ELG-07 | เพศ | อยู่ใน | MS-S04 | หญิง | Could |
| CP-ELG-08 | ชั้นอาชีพ | อยู่ใน | MS-S05 | ชั้น 1–2 | Could |
| CP-ELG-09 | ประเภทลูกค้า | อยู่ใน | MS-08 | ลูกค้าใหม่ / ลูกค้าเดิม | Should |
| CP-ELG-10 | ลำดับกรมธรรม์ที่เข้าเงื่อนไข | ≤ | Integer | 500 กรมธรรม์แรก | Could |
| CP-ELG-11 | ต้องกรอก Promo code | = | CP-COM-13 | – (ใช้เมื่อกรอก CP-COM-13) | Should |

**เงื่อนไขระบบ (ไม่ต้องตั้งค่า — ตรวจทุก Campaign ณ วันที่ยื่นใบคำขอ):** Package ของกรมธรรม์อยู่ใน CP-COM-08 · วันที่ยื่นใบคำขออยู่ในช่วง CP-COM-06 · ช่องทางอยู่ใน CP-COM-07 · (Agent) ผู้ขายอยู่ในกลุ่มที่ผูก Campaign นี้ (CC-04) · งบ/จำนวนสิทธิ์ยังเหลือ

**Preview/ทดลองคำนวณ (ISS-006 เดิม):** ใส่เบี้ยตัวอย่าง + ข้อมูลผู้เอาประกัน → แสดงว่า Campaign ใดเข้าเงื่อนไขและมูลค่าสิทธิ์ที่ได้ (UI ออกแบบตอน FRS)

---

## 3A. การให้สิทธิ์อัตโนมัติ & การติดตามสิทธิ์

### Requirement

| ID | Requirement | Priority | Rationale | Acceptance Criteria |
|---|---|---|---|---|
| BR-CP-001 | ระบบจำกัดช่วงวัน Campaign ตามกรอบ Package (CC-01) | Must | ป้องกันโปรโมชันเกินอายุการขายของแบบประกัน | Date picker ปิดวันก่อน max(วันนี้, start_Date) และหลัง end_Date; บันทึกไม่ได้ถ้าอยู่นอกกรอบ; ถ้าเลือก Package หลายตัว ใช้กรอบที่แคบที่สุด |
| BR-CP-002 | เมื่อ end_Date ของ Package ถูกแก้ให้เร็วกว่าวันสิ้นสุด Campaign → Campaign สิ้นสุดตาม Package | Must | สอดคล้องกติกา Package Inactive = ตัดสิทธิ์ทันที | สถานะเปลี่ยนเป็น Expired ณ end_Date ใหม่; แจ้งเตือน Campaign Owner |
| BR-CP-003 | ให้สิทธิ์อัตโนมัติเมื่อได้รับข้อมูลกรมธรรม์ที่ตรงเงื่อนไข (CC-03, CC-04) | Must | ลดการพึ่ง iApply/ผู้ขาย และให้สิทธิ์สม่ำเสมอ | ทุกกรมธรรม์ที่ส่งเข้ามา ระบบประเมินทุก Campaign ที่ Active ของ Package นั้น และสร้างรายการสิทธิ์ (Grant) ทุกตัวที่เข้าเงื่อนไข; ประเมินซ้ำได้ผลเดิม (idempotent ด้วย application_No + campaign_Code) |
| BR-CP-004 | เก็บสถานะสิทธิ์แยก "เข้าเงื่อนไข" และ "เข้าเงื่อนไข + อนุมัติแล้ว" (CC-02) | Must | ผู้บริหารต้องเห็นทั้ง Pipeline และยอดจริง | แต่ละ Grant มีสถานะตามตารางด้านล่าง + วันเวลาเปลี่ยนสถานะ; Overview แสดงทั้ง 2 จำนวนต่อ Campaign |
| BR-CP-005 | จองงบ/จำนวนสิทธิ์ตอนเข้าเงื่อนไข ตัดจริงตอนอนุมัติ คืนเมื่อไม่อนุมัติ/ยกเลิก (CC-06) | Must | ไม่ให้เกินงบในช่วงรอพิจารณา | งบคงเหลือ = งบ − จอง − ใช้จริง; เมื่อคงเหลือ ≤ 0 กรมธรรม์ถัดไปไม่ได้สิทธิ์ (สถานะ Not granted – quota) |
| BR-CP-006 | รับผลพิจารณากรมธรรม์จากระบบอื่นผ่าน API (CC-07) | Must | สถานะ "อนุมัติแล้ว" มาจากระบบต้นทาง | อัปเดต Grant ตามสถานะ Approved / Declined / Cancelled / Free-look cancelled — **รายละเอียด Interface นอกขอบเขตรอบนี้; Prototype จำลองด้วยหน้าจอ/ข้อมูลตัวอย่าง** |
| BR-CP-007 | ประเมินสิทธิ์แบบ Snapshot ณ วันที่ยื่นใบคำขอ (CC-08) | Must | ป้องกันสิทธิ์ลูกค้าหายจากการจัดกลุ่มผู้ขายภายหลัง | Grant ที่สร้างแล้วไม่เปลี่ยนเมื่อย้ายผู้ขายออกจากกลุ่ม, แก้เงื่อนไข หรือออก Version ใหม่ของ Campaign; บันทึก group_Code และ campaign_Version ที่ใช้ประเมินไว้ใน Grant |
| BR-CP-008 | สร้าง Referral URL รายผู้ขายอัตโนมัติ (CC-10) | Must | ให้ผู้ขายทุกคนมีลิงก์ขายของตัวเองและวัดผลรายคนได้ | เมื่อ Referral Campaign Active และผูกกับกลุ่มในเมนู People → ผู้ขายทุกคนในกลุ่มได้ลิงก์ unique 1 ลิงก์ต่อ Campaign; เพิ่มผู้ขายเข้ากลุ่มภายหลัง → ได้ลิงก์ทันที; ย้ายออก → ลิงก์หยุดนับยอดใหม่ (ยอดเดิมคงอยู่ตาม CC-08) |
| BR-CP-009 | นับยอดขายผ่าน Referral URL (CC-10) | Must | ใช้ติดตามผลการขายรายผู้ขาย/รายกลุ่มใน Overview | บันทึก จำนวนคลิก → ใบคำขอ → กรมธรรม์อนุมัติ ต่อลิงก์; ใบคำขอผูกกับลิงก์สุดท้ายที่คลิกภายในช่วงนับผล (Last click); ลิงก์ไม่ให้สิทธิ์ใดๆ เพิ่ม |

### Grant Status (ต่อ 1 กรมธรรม์ × 1 Campaign — ไม่ใช้กับ Referral)

| สถานะ | ความหมาย | งบ/จำนวนสิทธิ์ |
|---|---|---|
| Eligible – Reserved | กรมธรรม์เข้าเงื่อนไข รอผลพิจารณา | จอง |
| Confirmed | เข้าเงื่อนไข + อนุมัติกรมธรรม์แล้ว | ตัดจริง |
| Fulfilled | ส่งมอบสิทธิ์แล้ว (ส่ง Voucher / จ่าย Cashback / ส่งของแถม) | ตัดจริง |
| Released | ไม่อนุมัติ / ยกเลิกก่อนอนุมัติ | คืน |
| Clawed back | ยกเลิกใน Free look / เวนคืนตาม CP-COM-12 | คืน (ตามกติกา MS-04) |
| Not granted – quota | เข้าเงื่อนไขแต่งบ/จำนวนสิทธิ์หมด | – |

### ข้อมูลกรมธรรม์ขาเข้าที่ต้องมี (อ้างอิงสำหรับอนาคต — Interface นอกขอบเขตรอบนี้)

application_No, policy_No, package_Code, channel_Code, seller_Code (ถ้ามี), referral_Link_Id (ถ้าซื้อผ่านลิงก์), วันที่ยื่นใบคำขอ, FYP, เบี้ยรายปี, ทุนประกัน, payment_Mode_Code, payment_Method_Code, อายุ/เพศ/ชั้นอาชีพผู้เอาประกัน, เลขประจำตัวลูกค้า (สำหรับ ELG-09), promo_Code (ถ้ามี), สถานะพิจารณา + วันที่

**Grant record (เก็บเพิ่มสำหรับ Snapshot):** grant_Id, application_No, policy_No, campaign_Code, campaign_Version, group_Code (Agent), seller_Code, มูลค่าสิทธิ์, status, วันเวลาเปลี่ยนสถานะแต่ละครั้ง

---

## 4. รายละเอียดสิทธิประโยชน์ตามประเภท

### 4.1 Voucher — คูปอง / e-Voucher

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-VOU-01 | Voucher ที่ให้ | Code | ✓ | ✓ MS-10 | เลือกจาก Master Voucher (ชื่อ, มูลค่า/ใบ, ร้านค้า) | Must |
| CP-VOU-02 | รูปแบบการให้ | Code | ✓ | | Fixed (ใบต่อกรมธรรม์) / ตาม Tier เบี้ย | Must |
| CP-VOU-03 | จำนวนใบต่อกรมธรรม์ | Integer | ✓ (Fixed) | | ≥ 1 | Must |
| CP-VOU-04 | ตาราง Tier | Table (เบี้ยตั้งแต่, เบี้ยถึง, จำนวนใบ) | ✓ (Tier) | | ช่วงเบี้ยห้ามทับซ้อน/ขาดช่วง | Must |
| CP-VOU-05 | จำนวนที่จัดสรรให้ Campaign | Integer | ✓ | | ≤ Stock คงเหลือใน MS-10; ระบบกันสต็อกเมื่อ Approved | Must |
| CP-VOU-06 | ช่องทางส่งมอบ | Code | ✓ | ✓ MS-11 | SMS / Email / LINE / จัดส่งไปรษณีย์ | Must |
| CP-VOU-07 | อายุการใช้งานหลังได้รับ (วัน) | Integer | | | ≤ วันหมดอายุของ Voucher ใน Master | Should |
| CP-VOU-08 | แหล่งรหัสคูปอง | Code | ✓ | ✓ MS-12 | Upload Code pool / ระบบสร้างเอง / Partner API | Should |

### 4.2 Discount — ส่วนลดเบี้ยประกัน (ลดเบี้ยตรงได้ — CC-09)

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-DIS-01 | รูปแบบส่วนลด | Code | ✓ | | % / จำนวนเงิน | Must |
| CP-DIS-02 | มูลค่าส่วนลด | Decimal | ✓ | | % ≤ 100; บาท ≤ เบี้ย | Must |
| CP-DIS-03 | ฐานที่คำนวณ | Code | ✓ | ✓ MS-13 | เบี้ยปีแรก / เบี้ยทุกปี / งวดแรก | Must |
| CP-DIS-04 | ส่วนลดสูงสุดต่อกรมธรรม์ (บาท) | Decimal | | | Cap เฉพาะ Campaign นี้ (ไม่ใช่ Cap ข้าม Campaign) | Must |
| CP-DIS-05 | ตาราง Tier | Table (เบี้ยตั้งแต่, ถึง, % หรือ บาท) | | | ใช้แทน 01–02 ได้ | Should |
| CP-DIS-06 | การปัดเศษ | Code | ✓ | ✓ MS-14 | ปัดลง / ปัดขึ้น / ปัดทศนิยม 2 ตำแหน่ง | Should |

### 4.3 Cashback — เงินคืน

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-CSB-01 | รูปแบบเงินคืน | Code | ✓ | | % ของเบี้ย / จำนวนเงิน / Tier | Must |
| CP-CSB-02 | มูลค่า | Decimal | ✓ | | | Must |
| CP-CSB-03 | ฐานคำนวณ | Code | ✓ | ✓ MS-13 | เบี้ยที่ชำระจริงปีแรก | Must |
| CP-CSB-04 | เงินคืนสูงสุดต่อกรมธรรม์ | Decimal | | | | Must |
| CP-CSB-05 | ตาราง Tier | Table | | | ตัวอย่างเดิม: เบี้ย ≥ 30,000 → 5% | Should |
| CP-CSB-06 | ช่องทางจ่ายเงินคืน | Code | ✓ | ✓ MS-15 | โอนบัญชีผู้ชำระเบี้ย / PromptPay / คืนเข้าบัตรเครดิต | Must |
| CP-CSB-07 | กำหนดจ่าย | Code + Integer | ✓ | ✓ MS-03 | หลังพ้น Free look + N วัน (ค่าเริ่มต้น) | Must |
| CP-CSB-08 | ผู้รับเงินคืน | Code | ✓ | | ผู้ชำระเบี้ย / ผู้เอาประกันภัย | Should |

### 4.4 Free gift — ของแถม

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-GFT-01 | ของแถม | Code | ✓ | ✓ MS-16 | ชื่อ, SKU, รูป, มูลค่า, สต็อก | Must |
| CP-GFT-02 | จำนวนชิ้นต่อกรมธรรม์ / ตาม Tier | Integer / Table | ✓ | | | Must |
| CP-GFT-03 | จำนวนที่จัดสรรให้ Campaign | Integer | ✓ | | ≤ Stock คงเหลือ | Must |
| CP-GFT-04 | ให้เลือกของแถมได้ (1 จาก N) | Boolean + รายการ | | ✓ MS-16 | | Could |
| CP-GFT-05 | วิธีส่งมอบ | Code | ✓ | ✓ MS-11 | จัดส่งที่อยู่ผู้ชำระเบี้ย / รับที่สาขา / ตัวแทนส่งมอบ | Must |
| CP-GFT-06 | ระยะเวลาจัดส่ง (วันทำการ) | Integer | | | | Should |

### 4.5 Installment — ผ่อนชำระ

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-INS-01 | ธนาคาร / ผู้ออกบัตร | Multi-code | ✓ | ✓ MS-17 | | Must |
| CP-INS-02 | จำนวนงวด | Multi-code | ✓ | ✓ MS-18 | 3 / 6 / 10 เดือน | Must |
| CP-INS-03 | อัตราดอกเบี้ย (% ต่อเดือน) | Decimal | ✓ | | 0% = ผ่อน 0% | Must |
| CP-INS-04 | ผู้รับภาระดอกเบี้ย/ค่าธรรมเนียม | Code | ✓ | | บริษัท / ลูกค้า | Must |
| CP-INS-05 | เบี้ยขั้นต่ำต่อจำนวนงวด | Table (งวด, เบี้ยขั้นต่ำ) | ✓ | | เช่น 10 งวด ≥ 10,000 บาท | Must |
| CP-INS-06 | ช่องทางชำระที่ใช้ได้ | Code | ✓ | ✓ MS-S03 | บังคับ PMT02 บัตรเครดิต / PMT06 ผ่อนชำระ และต้องมีใน package_PaymentMethods | Must |

### 4.6 Reward points — สะสมแต้ม

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-PTS-01 | โปรแกรมคะแนน | Code | ✓ | ✓ MS-19 | ของบริษัท / Partner (บัตรเครดิต, สายการบิน) | Must |
| CP-PTS-02 | อัตราได้คะแนน | Integer / Decimal | ✓ | | X คะแนน ต่อเบี้ย Y บาท | Must |
| CP-PTS-03 | คะแนนโบนัสคงที่ | Integer | | | | Should |
| CP-PTS-04 | ตัวคูณ (Multiplier) | Decimal | | | เช่น 2 เท่าช่วง Campaign | Could |
| CP-PTS-05 | คะแนนสูงสุดต่อกรมธรรม์ | Integer | | | | Should |
| CP-PTS-06 | อายุคะแนน (เดือน) | Integer | | | ค่าเริ่มต้นจาก MS-19 | Should |

### 4.7 Referral — URL สำหรับนำไปขาย (ออกแบบใหม่ตาม CC-10)

**หลักการ:** Referral ไม่ให้สิทธิ์ใดๆ — เป็นลิงก์ขายรายผู้ขายเพื่อนับยอด ลูกค้าที่ซื้อผ่านลิงก์ยังได้ Campaign อื่นที่เข้าเงื่อนไขตามปกติ · ไม่มี Step 4 (เงื่อนไขผู้มีสิทธิ์) และไม่ใช้ CP-COM-09 ถึง 13

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-REF-01 | หน้าปลายทางของลิงก์ | Code | ✓ | Content | เลือก Content ที่ Approved ของ Package ใน CP-COM-08 (หน้า OL_OB / OL_PA / AGENT) | Must |
| CP-REF-02 | ผู้ได้รับลิงก์ | – (Auto) | ✓ | | ผู้ขายทุกคนในกลุ่มที่ผูก Campaign นี้ในเมนู People — ระบบสร้างให้อัตโนมัติ (BR-CP-008) | Must |
| CP-REF-03 | รูปแบบลิงก์ | Text (Auto) | ✓ | | {base_url}/r/{token} — token unique ต่อ (Campaign × ผู้ขาย) ไม่เปิดเผยรหัสผู้ขายใน URL | Must |
| CP-REF-04 | ช่วงนับผลหลังคลิก (วัน) | Integer | ✓ | | ค่าเริ่มต้น 30 วัน; ใช้กติกา Last click | Must |
| CP-REF-05 | สร้าง QR Code | Boolean | | | สร้าง QR ของแต่ละลิงก์ให้ผู้ขายดาวน์โหลด | Should |
| CP-REF-06 | UTM parameters (source / medium) | Text | | | สำหรับวัดผลใน Web analytics | Could |
| CP-REF-07 | ข้อความสำหรับแชร์ | Text 300 | | | ข้อความตั้งต้นเวลาผู้ขายกดแชร์ลิงก์ | Could |

**ข้อสังเกต:** Package ช่องทาง Online ที่ seller_Selection_Mode = ALL ต้องมีกลุ่มผู้ขายในเมนู People ก่อน จึงจะสร้างลิงก์รายผู้ขายได้ · การติดตามคลิกใช้ Cookie → ต้องอยู่ภายใต้ Cookie consent ของเว็บ (PDPA)

### 4.8 Bundle discount — ซื้อคู่ลดเพิ่ม (ลดเบี้ยตรงได้ — CC-09)

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-BND-01 | Package ในชุด | Multi-select (2–N) | ✓ | Package master | ต้องเป็น Package ที่ Content Approved และช่องทางตรงกัน | Must |
| CP-BND-02 | เงื่อนไขการซื้อ | Code | ✓ | | ใบคำขอเดียวกัน / ภายใน N วัน / ผู้เอาประกันต่างคนได้ (ครอบครัว) | Must |
| CP-BND-03 | สิทธิ์ที่ได้ | Code + Decimal | ✓ | | % / บาท ต่อยอดรวม หรือเฉพาะชิ้นที่ 2 | Must |
| CP-BND-04 | ใช้กับ Package ไหน | Code | ✓ | | ยอดรวม / ชิ้นเบี้ยต่ำสุด / ชิ้นที่ระบุ | Should |

### 4.9 Lucky draw — ลุ้นรับรางวัล

| ID | Field | Data type | R | M | Rule | Pri |
|---|---|---|---|---|---|---|
| CP-LKD-01 | รายการรางวัล | Table (รางวัล, จำนวน, มูลค่า) | ✓ | ✓ MS-21 | | Must |
| CP-LKD-02 | กติกาได้สิทธิ์ลุ้น | Integer | ✓ | | 1 สิทธิ์ ต่อเบี้ย X บาท | Must |
| CP-LKD-03 | วันจับรางวัล / วันประกาศผล | Date ×2 | ✓ | | วันจับ > วันสิ้นสุด Campaign; วันประกาศ ≥ วันจับ | Must |
| CP-LKD-04 | ช่องทางประกาศผล | Multi-code | ✓ | ✓ MS-11 | เว็บ / Facebook / LINE | Must |
| CP-LKD-05 | เลขที่ใบอนุญาตจัดชิงโชค + ไฟล์ใบอนุญาต | Text + File | ✓ | | **CC-11:** ทีม Marketing เป็นผู้ขอและกรอก; บังคับกรอกก่อนส่งอนุมัติ | Must |
| CP-LKD-06 | ผู้ควบคุมการจับรางวัล / กรรมการ | Text | | | | Should |
| CP-LKD-07 | ภาษีของรางวัล | Code | ✓ | | ผู้รับรางวัลรับภาระ / บริษัทรับภาระ | Should |

---

## 5. Master Data Catalogue

### 5.1 Master ใหม่ (สร้างใน TESLA Management)

| ID | Master | Key fields | ใช้กับ | Pri |
|---|---|---|---|---|
| MS-01 | Campaign Type | type_Code, name_Th/En, คำอธิบาย, icon, ลำดับ, is_Active, ประเภทสิทธิ์ (มูลค่าเงิน/สิ่งของ/คะแนน/ผ่อน/สิทธิ์ลุ้น/ลิงก์ติดตาม) | ทุก Campaign, การ์ด Step 1 | Must |
| MS-02 | Campaign Objective | objective_Code, name, is_Active | CP-COM-04, Overview | Should |
| MS-03 | Reward Timing | timing_Code, name, จุดอ้างอิง (อนุมัติกรมธรรม์/พ้น Free look), offset วัน | CP-COM-11, CSB-07 | Must |
| MS-04 | Clawback Rule | rule_Code, เหตุการณ์ (ยกเลิก Free look/เวนคืน/ขาดอายุ), ช่วงเวลา (เดือน), วิธีเรียกคืน | CP-COM-12 | Must |
| MS-05 | Terms & Conditions Template | template_Code, ประเภท Campaign, เนื้อหา TH/EN, version, วันมีผล, ผู้อนุมัติ (Compliance) | CP-COM-14 | Must |
| MS-06 | Cost Center / GL Mapping | department_Code, cost_Center, gl_Account, campaign_Type_Code | CP-COM-17, เชื่อมบัญชี | Should |
| MS-07 | Eligibility Attribute | attribute_Code, ชื่อ, data type, operator ที่ใช้ได้, Master อ้างอิง | Rule builder | Must |
| MS-08 | Customer Type | type_Code, ชื่อ, นิยาม (ใหม่ = ไม่มีกรมธรรม์ Inforce) | ELG-09 | Should |
| MS-09 | Partner / Vendor | partner_Code, ชื่อ, ประเภท (ร้านค้า/ธนาคาร/ผู้ส่งของ/โปรแกรมคะแนน), ผู้ติดต่อ, สัญญาเริ่ม–สิ้นสุด | MS-10, 16, 17, 19 | Must |
| MS-10 | **Voucher** | voucher_Code, name_Th/En, partner (MS-09), ประเภท (e-Voucher/กระดาษ), มูลค่าต่อใบ (face value), ต้นทุนต่อใบ, จำนวนทั้งหมด, จำนวนคงเหลือ, จำนวนที่จองแล้ว, วันหมดอายุ, รูป, เงื่อนไขการใช้ | CP-VOU | Must |
| MS-11 | Delivery / Announcement Channel | channel_Code, ชื่อ (SMS/Email/LINE/ไปรษณีย์/สาขา/เว็บ), ใช้กับ (ส่งมอบ/ประกาศผล) | VOU-06, GFT-05, LKD-04 | Must |
| MS-12 | Voucher Code Pool | voucher_Code, code, สถานะ (ว่าง/จอง/ส่งแล้ว/ใช้แล้ว/หมดอายุ), policy_No, วันส่ง | CP-VOU-08 | Should |
| MS-13 | Premium Basis | basis_Code, ชื่อ (FYP/เบี้ยทุกปี/งวดแรก/เบี้ยรายปี) | DIS-03, CSB-03 | Must |
| MS-14 | Rounding Rule | rule_Code, วิธีปัด, จำนวนทศนิยม | DIS-06 | Should |
| MS-15 | Payout Method | method_Code, ชื่อ, ข้อมูลที่ต้องใช้ (เลขบัญชี/PromptPay) | CSB-06 | Must |
| MS-16 | **Gift Item** | item_Code, SKU, name_Th/En, partner, รูป, มูลค่าต่อชิ้น, ต้นทุน, จำนวนทั้งหมด, คงเหลือ, จองแล้ว, น้ำหนัก/ขนาด (ค่าส่ง) | CP-GFT | Must |
| MS-17 | Bank / Card Issuer | bank_Code, ชื่อ, ประเภทบัตร (Visa/Master/JCB), โลโก้, is_Active | CP-INS | Must |
| MS-18 | Installment Term | term_Code, จำนวนงวด, is_Active | CP-INS | Must |
| MS-19 | Points Program | program_Code, ชื่อ, partner, อัตราแปลงค่า (1 คะแนน = x บาท), อายุคะแนน | CP-PTS | Should |
| MS-20 | Referral Link (Transaction ไม่ใช่ Master ที่ User ตั้งค่า) | link_Id, token, campaign_Code, seller_Code, group_Code, สถานะ (Active/หยุดนับ), จำนวนคลิก, วันสร้าง | CP-REF, BR-CP-008/009 | Must |
| MS-21 | Prize | prize_Code, ชื่อ, มูลค่า, จำนวน, รูป, partner | CP-LKD | Should |
| MS-22 | Grant Status | status_Code, ชื่อ, ผลต่องบ (จอง/ตัด/คืน), is_Terminal | BR-CP-004/005 | Must |

### 5.2 Master ที่มีอยู่แล้ว (Sync มากับ Package — ใช้ร่วม)

| ID | Master | แหล่ง (ตาม Payload) |
|---|---|---|
| MS-S01 | Channel | channel_Code (CHN01–CHN11) |
| MS-S02 | Payment Mode | payment_Mode_Code (PMM01…) |
| MS-S03 | Payment Method | payment_Method_Code (PMT01–PMT09) |
| MS-S04 | Gender | gender_Code |
| MS-S05 | Occupation Class | occupation_Class_Code (OCC01–04) |
| MS-S06 | Product / Sub Product Type | product_Type_Code, sub_Product_Type_Code |

**Stock rule (MS-10, MS-16, MS-21):** คงเหลือ = ทั้งหมด − จองแล้ว − ส่งแล้ว; จองให้ Campaign เมื่อ Approved, จองให้กรมธรรม์เมื่อ Eligible, ตัดเมื่อส่งมอบ, คืนเมื่อ Released/Clawed back หรือ Campaign สิ้นสุด

---

## 6. ลำดับที่เสนอ (สำหรับตัดออก)

| เฟส | ประเภท | เหตุผล |
|---|---|---|
| 1 | Voucher, Discount, Cashback, **Referral** | 3 ตัวแรกพี่ฟิล์มระบุไว้ตั้งแต่ต้น; Referral ย้ายขึ้นมาเพราะเหลือแค่ลิงก์ + นับยอด (ไม่มีสิทธิ์/งบ) และใช้กลุ่มใน People ที่ทำอยู่แล้ว |
| 2 | Free gift, Installment, Bundle discount | ต้องมี Stock / Partner ธนาคาร / ตรวจเงื่อนไขหลายกรมธรรม์ |
| 3 | Reward points, Lucky draw | ต้องต่อระบบคะแนน / มีขั้นตอนใบอนุญาตและจับรางวัล |

## 7. Open Questions

| # | คำถาม | สถานะ |
|---|---|---|
| Q-C01 | ช่วงวัน Campaign | ✅ CC-01 |
| Q-C02 | หน่วยนับสิทธิ์ | ✅ CC-02 |
| Q-C03 | Discount / Bundle ลดเบี้ยตรงได้ไหม | ✅ CC-09 (ได้) |
| Q-C04 | Referral | ✅ CC-10 (URL รายผู้ขาย, ไม่มีสิทธิ์พิเศษ) |
| Q-C05 | ใบอนุญาต Lucky draw | ✅ CC-11 (ทีม Marketing) |
| Q-C06 | วิธีได้รับ Campaign | ✅ CC-03, CC-04 |
| Q-C07 | ช่องทางรับข้อมูลกรมธรรม์ | ✅ CC-07 (API, นอกขอบเขตรอบนี้) |
| Q-C08 | ย้ายผู้ขายออกจากกลุ่มหลัง Eligible | ✅ CC-08 (Snapshot ณ วันยื่นใบคำขอ) |
