# TESLA Management — v0.1 Deliverables (Draft / Skeleton)

**จัดทำเมื่อ:** 9 กันยายน 2569 (อัปเดต Open Issues: 13 กันยายน 2569)
**สถานะ:** Draft v0.1 — ระดับภาพรวมทั้ง 5 Module รอรายละเอียดเชิงลึกเพิ่มเติม

## ไฟล์ที่จัดทำแล้ว (ส่งให้พี่ฟิล์มในแชทแล้ว)

1. **TESLA_Management_BRD_v0.1.docx** — BRD เต็มรูปแบบ 19 Section ตาม Template ของ Phillip Life (Cover, Sign-off, Revision History, TOC, Footer) ครอบคลุม Objectives, Scope, Stakeholders, To-Be Process (diagram), Business Requirements (BR-001–BR-021), Business Rules (BRU-001–006), Use Cases (UC-001–005, ระดับสรุป), Data Requirements, Integration, NFR, Assumptions/Risks/Open Issues, Traceability, Glossary
2. **TESLA_Management_Business_Journey_Workflow_v0.1.docx** — Business Journey ของ Product/Campaign Admin และ Agent/Seller พร้อม Workflow Overview
3. **TESLA_Management_Product_Backlog_v0.1.xlsx** — Backlog 5 Epic / 21 User Story (mapping กับ BR-ID)
4. **TESLA_Management_Project_Timeline_v0.1.xlsx** — Timeline ระดับ Phase (Gantt, 21 สัปดาห์, วันที่เป็น Placeholder รอยืนยัน PM)

**หมายเหตุ:** เอกสารทั้งหมดใช้ skill "generate-brd" ที่ตั้งค่าเฉพาะสำหรับ Phillip Life (Template, สี, Sign-off K. Yuttakarn J. / K. Chanchai P.)

## Open Issues

- ✅ **ISS-001 (ยืนยันแล้ว 13 ก.ย. 2569):** Workflow การอนุมัติ Package — **1 ระดับ** (Package Admin สร้าง → ผู้มีสิทธิ์อนุมัติ 1 ครั้งก่อน Publish) เพื่อให้สอดคล้องกับ Campaign Setting Approval Workflow (ดู `03-package-campaign-seller-logic.md`)
- ISS-002: การ Mapping ตัวแทนกับ Package ต้องอ้างอิงใบอนุญาตตัวแทนหรือไม่
- ISS-003: ระบบต้นทางและรอบเวลา Sync ข้อมูล Master (PAS/Agency/อื่นๆ) และความถี่
- ISS-004: ขอบเขตของ "ระบบอื่น" ที่ Sync ข้อมูล Master มาคือระบบใดบ้าง
- ISS-005: ค่าคอมมิชชั่นตัวแทนอยู่ในขอบเขตของ Seller List module หรือไม่ (ปัจจุบันตั้งเป็น Out-of-scope)
- Volume จริง (จำนวนกรมธรรม์/วัน, จำนวนตัวแทน) สำหรับ NFR
- As-Is process จริงของแต่ละ Module (ปัจจุบันตั้งสมมติฐานว่าเป็น Manual/Excel)

**เพิ่มเติมจากการคุย Package-Campaign-Seller logic (13 ก.ย. 2569)** — ดูรายละเอียดเต็มใน `03-package-campaign-seller-logic.md`:
- ISS-006 (ใหม่): UI ของฟีเจอร์ "Preview/ทดลองคำนวณ" ใน Package/Campaign Setting — ข้ามไปก่อนตามที่พี่ฟิล์มแจ้ง จะออกแบบตอนลง FRS/Field-level

## ลำดับงานถัดไป (ตามที่ยืนยันกับพี่ฟิล์ม)

BRD (เสร็จ v0.1) → Business Journey/Workflow (เสร็จ v0.1) → Backlog (เสร็จ v0.1) → Timeline (เสร็จ v0.1, placeholder) → Package-Campaign-Seller logic (ยืนยันครบแล้ว 13 ก.ย. 2569) → พี่ฟิล์มเขียน Business/Customer Journey flow ต่อ → รอรายละเอียดเชิงลึกแต่ละ Module เพื่อจัดทำ FRS, Use Case แบบเต็ม (Main/Alternate/Exception flow), Scenario Test
