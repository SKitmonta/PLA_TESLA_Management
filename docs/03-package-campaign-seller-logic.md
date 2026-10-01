# Package ↔ Campaign ↔ Seller — Business Logic (ยืนยันโดยพี่ฟิล์ม 13 ก.ย. 2569)

**สถานะ:** ยืนยันหลักการครบแล้ว — ยังไม่ใช่ Requirement เต็มรูปแบบ (รอสั่งจัดทำ BR-ID ต่อ) พร้อมเขียน Business/Customer Journey ได้

## Flow ที่ยืนยัน

1. User สร้าง Package
2. User สร้าง Campaign
3. ผูก Package ↔ Campaign (ทำได้จากทั้ง 2 ฝั่ง)
4. User ไปที่ Seller นำตัวแทน (ผ่าน Seller Group) มาผูกกับ Campaign ที่จะให้ขาย

## กติกาหลักที่ยืนยันแล้ว

| # | หัวข้อ | การตัดสินใจ | Impact ต่อ Data Model / Requirement |
|---|---|---|---|
| 1 | Campaign ประเภทเดียวกันซ้ำใน Package เดียว | **ห้ามซ้ำเฉพาะช่วงเวลาที่ทับซ้อนกัน** (ไม่ใช่ตลอดกาล) — Cashback 5% จบแล้วเปิด Cashback 7% ต่อได้ปกติ | Validation ต้องเช็ค date range overlap ไม่ใช่แค่ unique(package, campaign_type) |
| 2 | Seller ต้อง Mapping กับ Package โดยตรงหรือไม่ (BR-015 เดิม) | **ต้องมีทั้ง 2 ชั้น** — (1) Seller-Package โดยตรง = สิทธิ์ขายพื้นฐาน (ราคาปกติ), (2) Seller Group-Campaign = สิทธิ์ใช้โปรโมชั่นเสริม | BR-015 (Seller↔Package) ยังคงอยู่ ไม่ถูกแทนที่ด้วย Group↔Campaign — เป็นคนละชั้นกัน |
| 3 | Package เดียวมีหลาย Campaign พร้อมกัน (คนละประเภท) — stack ได้ไหม | **ซ้อนกันได้ทั้งหมด ถ้าลูกค้าเข้าเงื่อนไขของแต่ละ Campaign** เช่น ซื้อเบี้ย ≥30,000 บาท ได้ Cashback 5%, ซื้อเบี้ย ≥10,000 บาท ได้ Voucher 1,000 บาท | Campaign มี "เงื่อนไขคุณสมบัติ" (Eligibility/Rule) เป็นของตัวเอง แบบยืดหยุ่น (มีรองรับอยู่แล้ว) |
| 4 | โครงสร้าง Seller Group | **ซ้อนได้ (Nested/Hierarchy)** เช่น กลุ่มภาค → กลุ่มสาขา | Seller Group เป็น self-referencing tree ไม่ใช่ flat list |
| 5 | เพดานการซ้อนสิทธิ์ (Stacking Cap) | **ไม่ให้ระบบเป็นผู้กำหนด/บังคับ** — ควบคุมผ่านกระบวนการอนุมัติ Campaign ที่มีหลายฝ่ายเกี่ยวข้อง | Campaign Setting ต้องมี Approval Workflow (ดูข้อ 8) — ระบบไม่ validate ผลรวมส่วนลดข้าม Campaign เอง |
| 6 | จุดคำนวณ/ตรวจเงื่อนไขจริง (TESLA Management vs iApply) | **TESLA Management ต้องคำนวณ/Preview ผลลัพธ์เบื้องต้นได้เองด้วย** ไม่ใช่แค่ตั้งค่าส่งให้ iApply คำนวณอย่างเดียว | **Requirement ใหม่:** Package/Campaign Setting ต้องมีฟีเจอร์ "ทดลองคำนวณ/Preview" — Admin ใส่เบี้ยตัวอย่าง ระบบแสดงว่า Campaign ใดที่เข้าเงื่อนไขและผลรวมสิทธิ์ที่ได้ ก่อน Publish จริง (แยกจากการคำนวณจริงตอนขายที่ iApply ยังต้องทำอีกที ณ เวลาขายจริง) — **UI ของฟีเจอร์นี้ข้ามไปก่อน (13 ก.ย. 2569)** จะออกแบบตอนลง FRS/Field-level (= ISS-006 ใน `01-brd-v0.1-deliverables.md`) |
| 7 | Channel ของ Campaign ต้องสัมพันธ์กับ Package อย่างไร | **Campaign channel ต้องเป็น subset ของ Package channel** เช่น Package Online-only ผูก Campaign Agent-only ไม่ได้ | เพิ่ม validation ตอนผูก Campaign เข้า Package |
| 8 | Campaign Setting ต้องมี Approval Workflow กี่ระดับ | **1 ระดับ** — Campaign Admin สร้าง → ผู้มีสิทธิ์ (เช่น Compliance/Marketing Manager) อนุมัติ 1 ครั้งก่อน Publish | — |
| 9 | Lifecycle Cascade — Package ปิด (Inactive) หรือ Seller Group ถูกลบ | **ตัดสิทธิ์/การใช้งานทันที ไม่มี Grace Period** ทั้ง 2 กรณี | Mapping/ลิงก์เก็บไว้เป็นประวัติ (ไม่ลบทิ้ง เพื่อ Audit trail) แต่ใช้งานไม่ได้ทันที — สอดคล้องกับ BR-010 เดิมที่ Campaign หมดอายุต้อง "ไม่แสดง/ใช้งานไม่ได้โดยอัตโนมัติ" |
| 10 | Package Approval Workflow กี่ระดับ (ISS-001 เดิม) | **✅ ยืนยันแล้ว 13 ก.ย. 2569 — 1 ระดับ** เหมือน Campaign เพื่อความสอดคล้องกัน | ISS-001 ปิดแล้ว |

## Open Items ที่ยังต้องคุยต่อ

- ไม่มี Open Item ที่เป็น Blocker แล้ว ณ ตอนนี้ — พร้อมเขียน Business/Customer Journey flow ได้เต็มที่
- (Deferred, ไม่ใช่ Blocker) UI ของฟีเจอร์ Preview/ทดลองคำนวณ — รอออกแบบตอน FRS/Field-level (ดูข้อ 6 ด้านบน / ISS-006)
