# รายงานทดสอบ อนุมัติ / ตีกลับ Content ใน v2 (CT-06)

> **วันที่:** 5 ต.ค. 2569 (21:20–21:25 เวลาไทย) · **ผู้ทดสอบ:** Claude (browser-use / Chrome headless + `cdp.py`) · API `run-api.ps1 -Mode DevWrite` (DEV PostgreSQL)

## 1. สรุป

| รายการ | ผล |
|---|---|
| เส้นใหม่ใน Tesla Admin API v2 | `GET /content/{code}/review` · `POST /content/{code}/approve` · `POST /content/{code}/reject` |
| Unit test (BE) | **621/621 ผ่าน** (ใหม่ 27: approve / reject / review / dev actor) |
| ทดสอบผ่านหน้าจอ + API | **ผ่านทั้งหมด 9/9** (§3) |
| ข้อมูลที่เปลี่ยนบน DEV | **CT000014 อนุมัติแล้ว (PUBLISHED v1, ผู้อนุมัติ U003)** · **CT000015 ถูกตีกลับ (Draft + เหตุผล)** |
| ข้อสังเกต | F-08 เวลาเป็น UTC · F-09 ยังไม่ map ฟอร์ม → ตารางลูก (เว็บลูกค้ายังไม่เห็นเนื้อหา) · F-10 role ตรวจที่ FE เท่านั้น (§4) |

## 2. สิ่งที่ทำ

**BE `TeslaAdminApi`** — ตามแบบ `docs/02_Analysis/fe-v2-backend-gap-plan-2026-10-03.md` §8.4 (ไม่มี migration)

| ส่วน | รายละเอียด |
|---|---|
| Approve | `PENDING` → **`PUBLISHED` ในขั้นเดียว** (อนุมัติ = ขึ้นเว็บตามวันเริ่ม) · เติม `APPROVED_*` + `PUBLISHED_*` · `T_MARKETING_CONTENT.CURRENT_PUBLISHED_VERSION_ID` = version นี้ · ล้าง `CURRENT_DRAFT_VERSION_ID` · **ไม่ปลด version เก่า** (เว็บเลือก version ตามวันที่) · history `APPROVE` + `PUBLISH` (ให้อ่านเหมือน v1 สองขั้น) |
| Reject | `PENDING` → `DRAFT` + `REJECTED_*` (เหมือน v1) · เหตุผลบังคับ ≤ 500 ตัวอักษร · history `REJECT` + reason |
| Review | Content (version หัว) + version ที่อนุมัติก่อนหน้า (ไว้ diff) + เวลาส่ง + ประวัติทุก version (ซ่อน CREATE ของ v1 และ PUBLISH · CREATE จาก new-version = `NEW_VERSION`) |
| D-06 | ผู้อนุมัติ ≠ ผู้สร้าง Content **และ** ≠ ผู้ส่ง version นี้ (ไม่สนตัวพิมพ์) → 409 + ข้อความไทย |
| Guard สถานะ | approve / reject ได้เฉพาะ `PENDING` → 409 · UPDATE มี `WHERE status_code = 'PENDING'` กันกดซ้อน |
| ผู้ใช้ตอน `Auth:Disabled` | middleware ใช้ header `X-User-Id` ที่ FE ส่งอยู่แล้ว (เฉพาะเมื่อ `Auth:Disabled=true` · ต้องเป็นชื่อผู้ใช้ `[A-Za-z0-9._@-]{1,50}` · PROD ใช้ UAM เหมือนเดิม) → ทดสอบ maker ≠ approver ได้ |

**FE `PLA_TESLA_Management`** — ต่อเส้น `review` / `approve` / `reject` ใน `data-source.service.ts` (เดิมขึ้น "ยังไม่มีเส้นนี้" 501) · หน้า `content-approval` เดิมใช้ได้เลยไม่ต้องแก้

## 3. ผลทดสอบ

| # | กรณี | ผู้ใช้ | ผลที่ได้ | ผล |
|---|---|---|---|---|
| A-01 | อนุมัติงานของตัวเอง (CT000014 สร้าง/ส่งโดย SYSTEM) | SYSTEM | 409 "อนุมัติงานที่ตัวเองสร้างหรือส่งอนุมัติไม่ได้ … D-06" | ✅ |
| A-02 | อนุมัติ Content ที่เป็น Draft (CT000009) | U003 | 409 "อนุมัติได้เฉพาะ Content ที่รออนุมัติ" | ✅ |
| A-03 | ตีกลับโดยไม่ใส่เหตุผล | U003 | 400 "กรุณาระบุเหตุผลที่ตีกลับ" | ✅ |
| A-04 | เหตุผล 501 ตัวอักษร | U003 | 400 "…ไม่เกิน 500 ตัวอักษร" | ✅ |
| A-05 | review Content ที่ไม่มี (CT999999) | U003 | 404 "ไม่พบ Content CT999999" | ✅ |
| A-06 | ตีกลับ Content ที่เป็น Draft | U003 | 409 | ✅ |
| UI-01 | **อนุมัติ CT000014** ผ่านหน้า "ตรวจสอบ Content" (ติ๊ก 3 ข้อ → อนุมัติ → ยืนยัน) | U003 Content Approver | Toast "อนุมัติแล้ว CT000014 v1 · เริ่มใช้งานบนหน้าเว็บ" → กลับหน้ารายการ · สถานะ **Active** · ผู้อนุมัติ U003 | ✅ |
| UI-02 | Maker ส่งอนุมัติ CT000015 → **ตีกลับ** พร้อมเหตุผล | U002 → U003 | ส่งแล้ว `PENDING` · ตีกลับแล้ว Toast "ตีกลับแล้ว … ส่งกลับให้ Content Maker แก้ไข" · สถานะ `REJECTED` (Draft) | ✅ |
| UI-03 | Maker เปิด Editor CT000015 อีกครั้ง | U002 | แถบแดง "ตีกลับ: <เหตุผล> — แก้ไขแล้วกด "ส่งอนุมัติ" อีกครั้ง" · ป้าย "ตีกลับ · v1" · Save / Submit กดได้ | ✅ |

ประวัติใน `T_MARKETING_APPROVAL_HISTORY` (อ่านผ่าน `review`): CT000014 = SUBMIT (SYSTEM) → APPROVE (U003) · CT000015 = SUBMIT (U002) → REJECT (U003 + เหตุผล)

รูป: [01 หน้า ตรวจสอบ CT000014](img/approval/01-review-CT000014.png) · [02 หลังอนุมัติ](img/approval/02-approved-toast.png) · [03 Maker เห็นเหตุผลตีกลับ](img/approval/03-maker-sees-reject.png)

## 4. ข้อสังเกต / งานต่อ

| # | เรื่อง | รายละเอียด | ข้อเสนอ |
|---|---|---|---|
| F-08 | เวลาเป็น UTC | `NOW()` ของ DEV เก็บเวลา UTC แบบไม่มี timezone → หน้า "ตรวจสอบ" แสดง "ส่งเมื่อ 05/10/2026 10:48" (จริง 17:48) · เป็นของเดิมทุกเส้น (updatedAt ฯลฯ) | ตกลงกับ DBA: ส่ง `timestamptz` / แปลงเป็นเวลาไทยใน API |
| F-09 | **เว็บลูกค้ายังไม่เห็นเนื้อหาจาก FE v2** | approve เปลี่ยนสถานะเป็น PUBLISHED แต่ฟอร์มยังอยู่ใน `FE_CONTENT_DATA` · `marketing-material` อ่านตารางลูก (thumbnail, banner, key feature …) — G-03/G-04 เดิม | ทำ mapping ฟอร์ม → ตารางลูกตอน approve ก่อนใช้จริง · Q-CT-05 (เลิก fallback DRAFT ของเว็บ) ยังต้องคุยทีม Tesla-B |
| F-10 | สิทธิ์ตาม Role | API ตรวจ D-06 แต่ยังไม่ตรวจว่าเป็น Content Approver (ยังไม่มี role จาก UAM) · FE ซ่อนปุ่มตาม Role | ผูก role ของ UAM เมื่อเชื่อม SSO (G-07) |
| — | Error 409 แทน 403 | กรณีอนุมัติงานตัวเองตอบ 409 (ไม่มี MessageCode สำหรับ 403 · ต้อง migration ตารางข้อความ) | เพิ่ม MessageCode ภายหลังถ้าต้องการ |
| — | Campaign อนุมัติ / ตีกลับ / ระงับ | ยังไม่ทำ (handoff §8) | ทำแบบเดียวกัน |
