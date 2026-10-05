# รายงานทดสอบ อนุมัติ / ตีกลับ — Content (CT-06) + Campaign (Suspend / เปิดใช้อีกครั้ง)

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

---

# ส่วนที่ 2 — Campaign อนุมัติ / ตีกลับ / Suspend / เปิดใช้อีกครั้ง (5 ต.ค. 21:35–21:40)

## 5. สรุป

| รายการ | ผล |
|---|---|
| เส้นใหม่ใน Tesla Admin API v2 | `POST /campaign/{code}/approve` · `/reject` · `/suspend` · `/resume` |
| Unit test (BE) | **651/651 ผ่าน** (เพิ่ม 30) |
| ทดสอบผ่านหน้าจอ + API | **ผ่าน 9/9** (§7) |
| ข้อมูลใหม่บน DEV | **CMP25690008** (DISCOUNT · ST000027 × CHN08 · 10/10–30/11) = อนุมัติแล้ว → Suspend → เปิดใช้อีกครั้ง (สถานะสุดท้าย Approved · รอเริ่ม) · **CMP25690009** (CASHBACK · ST000007 × CHN04) = ถูกตีกลับ |

## 6. การตัดสินใจ (handoff 4 ต.ค. §8 ข้อ 3) — ทำแบบไม่ต้อง migration

| ข้อ | ทำแบบนี้ | เหตุผล |
|---|---|---|
| (ก) อนุมัติ | `PENDING` → **`PUBLISHED` คลิกเดียว** · history APPROVE + PUBLISH · **ตรวจช่วงวันทับซ้อนอีกครั้ง** (อาจมี Campaign อื่นถูกอนุมัติหลังส่ง) | ตรงกับ Content และ FE (อนุมัติ = ใช้งาน) |
| (ข) ห้ามอนุมัติงานตัวเอง | ผู้อนุมัติ ≠ ผู้สร้าง (`T_CAMPAIGN.CREATED_BY`) และ ≠ ผู้ส่งล่าสุด (history SUBMIT) → 409 · ตอน `Auth:Disabled` ผู้ใช้มาจาก `X-User-Id` | ปิดปัญหา "ทุกคน = SYSTEM" |
| (ค) Suspend | `APPROVED`/`PUBLISHED` → v1 **`INACTIVE`** (history INACTIVE) · v2 แสดงเป็น **Suspended** | `T_CAMPAIGN` CHECK ไม่มีค่า `SUSPENDED` |
| (ค) Resume | `INACTIVE` → `PUBLISHED` · history **PUBLISH (from INACTIVE)** → v2 แสดงเป็น RESUME · ตรวจช่วงวันทับซ้อน | history CHECK ไม่มี `RESUME` |
| ตีกลับ | reuse v1 `ICampaignRepository.ChangeStatusAsync("REJECTED")` (→ DRAFT + history REJECT + เหตุผล) · เหตุผลบังคับ ≤ 500 | ใช้ของเดิม |

⚠️ ผลข้างเคียง: Campaign ที่หน้าจอ v1 ตั้งเป็น `INACTIVE` จะแสดงใน v2 เป็น Suspended (เปิดใช้อีกครั้งได้) — ถ้าต้องแยก "ปิดถาวร" กับ "หยุดชั่วคราว" ต้องเพิ่มค่า `SUSPENDED` ใน CHECK (migration + DBA review)

## 7. ผลทดสอบ

| # | กรณี | ผู้ใช้ | ผลที่ได้ | ผล |
|---|---|---|---|---|
| G-01 | อนุมัติงานตัวเอง (CMP25690008 สร้าง/ส่งโดย U002) | U002 | 409 "…ผู้อนุมัติต้องไม่ใช่ผู้สร้าง / ผู้ส่ง" | ✅ |
| G-02 | ตีกลับไม่ใส่เหตุผล | U003 | 400 "กรุณาระบุเหตุผลที่ตีกลับ" | ✅ |
| G-03 | Suspend Campaign ที่รออนุมัติ | U002 | 409 | ✅ |
| G-04 | เปิดใช้อีกครั้ง Campaign ที่ไม่ได้ Suspend | U002 | 409 | ✅ |
| G-05 | อนุมัติ Draft (CMP25690004) | U003 | 409 "อนุมัติได้เฉพาะ Campaign ที่รออนุมัติ" | ✅ |
| UI-C1 | **อนุมัติ** CMP25690008 (ปุ่ม "อนุมัติ" หน้ารายละเอียด) | U003 Campaign Approver | Toast "อนุมัติแล้ว … Approved · รอเริ่ม" · ผู้อนุมัติ U003 · ประวัติ APPROVE | ✅ |
| UI-C2 | **ตีกลับ** CMP25690009 (dialog ใส่เหตุผล) | U003 | Toast "ตีกลับแล้ว … Draft" · สถานะ REJECTED + เหตุผล · ประวัติ REJECT + เหตุผล | ✅ |
| UI-C3 | **Suspend** CMP25690008 | U002 Campaign Maker | Toast "หยุดชั่วคราวแล้ว … Suspended" · ปุ่มเปลี่ยนเป็น "เปิดใช้อีกครั้ง" · ประวัติ SUSPEND | ✅ |
| UI-C4 | **เปิดใช้อีกครั้ง** CMP25690008 | U002 | Toast "เปิดใช้อีกครั้งแล้ว … Approved · รอเริ่ม" · ปุ่ม Suspend กลับมา · ประวัติ RESUME | ✅ |

รูป: [04 รออนุมัติ](img/approval/04-campaign-pending.png) · [05 อนุมัติแล้ว](img/approval/05-campaign-approved.png) · [06 ตีกลับ](img/approval/06-campaign-rejected.png) · [07 Suspended](img/approval/07-campaign-suspended.png) · [08 เปิดใช้อีกครั้ง](img/approval/08-campaign-resumed.png)

## 8. ยังไม่ทำ / ข้อสังเกต

- **จอง stock ตอนอนุมัติ** (Voucher MS-10 / ของรางวัล MS-16 — gap plan T3.4): ยังไม่ทำ (Mock ก็ไม่จอง) · ตอนนี้ตรวจ stock คงเหลือตอน Submit เท่านั้น
- เวลาในประวัติเป็น UTC (F-08 เดิม) · API ยังไม่ตรวจ Role (F-10 เดิม) · "สร้าง Version ใหม่" ของ Campaign ยังไม่มี (ปุ่มถูกปิดไว้)

---

# ส่วนที่ 3 — เวลาไทย (F-08) · จอง Stock ตอนอนุมัติ Campaign · ทดสอบ flow ครบทุก Content (5 ต.ค. 22:20–22:35)

## 9. F-08 เวลาเป็น UTC

| ปัญหา | แก้ | ผล |
|---|---|---|
| DB session = `Etc/UTC` → `NOW()` เก็บ UTC · หน้าจอแสดงตัวเลขตรง ๆ (thDate pipe) → ช้ากว่าเวลาไทย 7 ชม. | API v2 เขียนเวลาเป็น**เวลาไทยพร้อม offset** (`2026-10-05T22:13:19+07:00`) — `ThaiTimeJsonConverter` ใส่ 10 ฟิลด์ (history / updatedAt / submittedAt / approvedAt / syncedAt …) · ข้อมูลใน DB ไม่เปลี่ยน | ประวัติ CT000015: อนุมัติ 22:13 (เดิมแสดง 15:13) · Campaign SUSPEND/RESUME 21:38 |
| เว็บลูกค้าเลือก Version ด้วย `CURRENT_DATE` (UTC) → 00:00–07:00 ไทยยังใช้วันก่อน | `marketing-material` ใช้ `(NOW() AT TIME ZONE 'Asia/Bangkok')::date` | Version เริ่มแสดงตอนเที่ยงคืนเวลาไทย |

## 10. จอง Stock ตอนอนุมัติ Campaign (Voucher MS-10 / ของรางวัล MS-16 · gap plan T3.4)

- อนุมัติ → `reserved_qty += allocated` ของรายการใน Master **ใน transaction เดียวกับการเปลี่ยนสถานะ** · SQL เพิ่มได้เฉพาะเมื่อ `total − reserved − delivered ≥ allocated` (อนุมัติพร้อมกัน 2 ตัวจองเกินไม่ได้) · บันทึกใน `DETAIL_JSON.feV2.stockReserved` + เหตุผลของประวัติ APPROVE
- Stock ไม่พอ → 409 "อนุมัติไม่ได้ — Stock ของ … ไม่พอ (ต้องจอง … · คงเหลือ …)" · สถานะยังรออนุมัติ

| # | กรณี | ผล |
|---|---|---|
| S-01 | CMP25690010 (VOUCHER · VOU-001 × 150 · ST000007) อนุมัติผ่านหน้าจอ (U003) | ✅ อนุมัติ · ประวัติ "จอง Stock MS-10 VOU-001 × 150" · VOU-001 reserved 50 → **200** ([รูป](img/approval/10-stock-reserved.png)) |
| S-02 | CMP25690011 (VOU-001 × 150 · ST000027) อนุมัติ — คงเหลือ 500 − 200 − 200 = 100 | ✅ ปฏิเสธ "Stock ของ VOU-001 ไม่พอ (ต้องจอง 150 · คงเหลือ 100)" · ยังรออนุมัติ · stock ไม่เปลี่ยน ([รูป](img/approval/11-stock-out.png)) |

ยังไม่ทำ: **คืน Stock** เมื่อ Campaign จบ / ถูกปิด (ยังไม่มี action จบ Campaign) · Suspend คง stock ไว้

## 11. ทดสอบ flow ใหม่ครบทุก Content (ส่ง → อนุมัติ → ตารางเว็บลูกค้า)

ส่งอนุมัติด้วย U002 (Content Maker) แล้วอนุมัติผ่านหน้า "ตรวจสอบ Content" ด้วย U003 — **7/7 สำเร็จ** (รวม CT000014 / 15 ก่อนหน้า = 9 Content PUBLISHED) · นับแถวในตารางที่เว็บอ่าน (PgQuery read-only):

| Content | Template | วันเริ่ม | thumb | banner | KF | KA | tag | rec | T&C | icon |
|---|---|---|---|---|---|---|---|---|---|---|
| CT000005 v2 | OL_OB | 06/10 | 1 | 1 | 3 | 3 | 3 | 1 | 1 | 1 |
| CT000009 | OL_OB | 06/10 | 1 | 1 | 3 | 3 | 3 | 1 | 1 | 1 |
| CT000011 | OL_OB | **05/10** | 1 | 1 | 6 | 4 | 3 | 1 | 3 | 1 |
| CT000012 | OL_OB | 06/10 | 1 | 1 | 1 | 3 | 3 | 1 | 2 | 1 |
| CT000014 | OL_OB | 06/10 | 1 | 1 | 3 | 3 | 4 | 1 | 1 | 1 |
| CT000004 | AGENT | 06/10 | 1 | 1 | 0 ⚠️ | — | 1 | 0 | 1 | 1 |
| CT000013 | AGENT | 06/10 | 1 | 1 | 0 ⚠️ | — | 1 | 0 | 1 | 1 |
| CT000008 | AGENT | 06/10 | 1 | 1 | 0 ⚠️ | — | 0 ⚠️ | 0 | 1 | 1 |
| CT000015 | OL_PA | **05/10** | 1 | 1 | — | — | 0 ⚠️ | 0 | 1 | 1 |

- **เว็บลูกค้า `marketing-material/ST000025` (CT000011 เริ่มวันนี้):** ได้ชื่อ · ป้าย · หมวด TERM · Banner · Icon · **Key Features + Key Advantages พร้อมรูปจาก Master** · Package recommend ST000030 ✅
- ⚠️ AGENT Key Features = ข้อความอิสระ ("คุ้มครองถึงอายุ" ฯลฯ) ไม่ตรงชื่อหัวข้อใน Master → ข้าม (`publish-web` แจ้งใน notes) · ต้องเพิ่มหัวข้อ F2F ใน Master (handoff §8 #4) หรือให้ AGENT เลือกจาก Master (#5)
- ⚠️ หมวด "อุบัติเหตุ" (CT000008 / 15) ไม่มีใน Master insurance type (#5)
- Content ที่เริ่ม 06/10 จะขึ้นเว็บพรุ่งนี้ 00:00 เวลาไทย (หลังแก้ F-08)
