# TESLA Management — Rebaseline v0.2 (Business Journey + Stack)

**บันทึกเมื่อ:** 24 กันยายน 2569
**สถานะ:** Working draft — Phase "Claude Chat" (ยืนยัน Journey ก่อนส่งต่อ Claude Design / Claude Code)
**แทนที่:** โครงสร้าง 5 Module ใน `00-project-overview.md` / `01-brd-v0.1-deliverables.md` (กติกาธุรกิจใน `03-...` ยังใช้อยู่ ยกเว้นที่ระบุว่าเปลี่ยน)

## 1. Module (ใหม่)

| # | Module | คำอธิบาย |
|---|---|---|
| 1 | Content selling tools | นำ Package จาก Master มาสร้าง Content (รูป, ข้อความ, หยิบโมดูลสำเร็จรูป) → ขออนุมัติ |
| 2 | Campaign setup | สร้าง Campaign ส่งเสริมการขาย (Voucher, Cashback, Discount, Other) พร้อมรายละเอียดตามประเภท → ขออนุมัติ |
| 3 | People management | รายชื่อ **ผู้ขาย (ตัวแทน/พนักงาน)** จาก Package + ฐานข้อมูลของเรา → สร้างกลุ่มขาย (Drag & Drop) → ผูก Campaign ให้กลุ่ม |
| 4 | Overview | ภาพรวมความเคลื่อนไหวของทุกเมนู, Target, สรุปยอดขายสำหรับผู้บริหาร/ผู้ใช้งาน |
| 5 | Master setup | แหล่งข้อมูลของระบบ (Package จริง Sync จากระบบอื่น; Prototype ใช้ mock ใน SQLite) |

## 2. Business Journey

| Phase | Step | ผู้ทำ | Output | Gate |
|---|---|---|---|---|
| A. Master | 1. มี Package ใน Master setup | ระบบ (Sync) | Package master | – |
| B. Content | 2. เลือก Package → สร้าง Content (เงื่อนไข: รอพี่ฟิล์มอธิบาย) | Content Maker | Content (Draft) | – |
|  | 3. ส่งขออนุมัติ | Content Approver (≠ Maker) | Content (Approved) | ✅ Approval 1 ระดับ |
| C. Campaign | 4–5. สร้าง Campaign → เลือกประเภท → ใส่รายละเอียด | Campaign Maker | Campaign (Draft) | – |
|  | 6. ส่งขออนุมัติ | Campaign Approver (≠ Maker) | Campaign (Approved) | ✅ Approval 1 ระดับ |
| D. People | 7–9. เลือก Package ที่ Content Approved แล้ว → ดูรายชื่อผู้ขายใน Package → สร้างกลุ่ม → Drag & Drop รายชื่อเข้ากลุ่ม | People Admin | Seller Group (Flat) | – |
| E. Binding | 10–11. ในเมนู People: กลุ่มของ Package → ผูก Campaign (Approved) ให้แต่ละกลุ่ม | People Admin | สิทธิ์โปรโมชันต่อกลุ่ม | ไม่ต้องอนุมัติ (มี Audit log) |
| F. Overview | สรุปภาพรวม | ทุก Role | Dashboard | – |

**Status lifecycle (Content & Campaign):** Draft → Pending Approval → Approved (Active) / Rejected → (แก้ไข = Version ใหม่ Draft) → Inactive

## 3. Confirmed Decisions (24 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| D-01 | "People" คือใคร | ผู้ขาย (ตัวแทน/พนักงาน) — ไม่ใช่ลูกค้า/Lead |
| D-02 | "Package ที่ผ่านการ Approve" | หมายถึง **Content ของ Package ที่ Approved** — Package จาก Master ไม่มี Approval ของตัวเอง (แทนที่ข้อ 10 ใน `03-...` / ISS-001 เดิม) |
| D-03 | ผูก Campaign ↔ กลุ่ม | ทำในเมนู People, **ไม่ต้องอนุมัติ** (Campaign อนุมัติมาแล้ว) |
| D-04 | Stack | Angular (latest) + TypeScript / Node.js + Express (TS) / SQLite |
| D-05 | โครงสร้างกลุ่ม | **Flat, ผู้ขาย 1 คน = 1 กลุ่มต่อ Package** (Drag = Move) ผู้ขายที่ไม่อยู่กลุ่ม = ขายราคาปกติ — **แทนที่ข้อ 4 (Nested) ใน `03-...`** |
| D-06 | Maker / Approver | บังคับแยกคน (Segregation of Duties) — Maker อนุมัติงานตัวเองไม่ได้ |
| D-07 | แก้ไขรายการที่ Approved แล้ว | สร้าง **Version ใหม่** — Version เดิมใช้งานต่อจน Version ใหม่ Approved แล้วค่อยแทนที่ |
| D-08 | โมดูล Content เฟสแรก | Banner + Sticky bar, Key Features / Advantages (Dynamic 0–N), Package recommend (1–N), Free text / Image / Document |

## 4. กติกาเดิมที่คงไว้ (จาก `03-...`)

- Campaign ประเภทเดียวกันใน Package เดียว ห้ามช่วงวันที่ทับซ้อน
- Campaign หลายตัว Stack ได้ถ้าลูกค้าเข้าเงื่อนไขแต่ละตัว; ระบบไม่บังคับ Cap
- Channel ของ Campaign ต้องเป็น subset ของ Channel ของ Package
- Package Inactive / กลุ่มถูกลบ = ตัดสิทธิ์ทันที เก็บประวัติไว้

## 5. Working Setup

- Local: `C:\Users\Kitmonta\Documents\Backup film\TESLA\TESLA-Management` (VS Code)
- GitHub: https://github.com/kitmontaphilliplife/TESLA_Management_Full — branch `dev` (push เมื่อพี่ฟิล์มสั่งเท่านั้น)
- 3 ช่องทาง: Claude Chat (Journey) → Claude Design (Mockup UX/UI) → Claude Code (Code จริง)
- Theme อ้างอิง: https://bmw-uw-app-dev.philliplife.com/underwriting/list
- โครงสร้างไฟล์: แยก folder ต่อเมนู (`features/<menu>/` มี .ts/.html/.scss ของตัวเอง), `core/`, `shared/`, `layout/`, `server/`

## 6. Open Items (รอบถัดไป)

- OI-02 เงื่อนไขการสร้าง Content จาก Package (Step 2) — พี่ฟิล์มจะอธิบาย
- OI-03 Field ของ Campaign แต่ละประเภท (Voucher / Cashback / Discount / Other) + เงื่อนไข Eligibility
- OI-04 KPI/Target ในหน้า Overview และแหล่งข้อมูลยอดขาย/Target
- OI-07 ข้อมูลผู้ขายจาก "ฐานข้อมูลของเรา" มี field อะไรที่ต้องแสดง/ใช้ filter ตอน Drag & Drop (รหัส, ชื่อ, สาขา, ระดับ, ใบอนุญาต ฯลฯ)
