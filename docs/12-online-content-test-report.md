# รายงานทดสอบการกรอก Content ช่องทาง Online (OL_OB / OL_PA)

> **วันที่ทดสอบ:** 5 ต.ค. 2569 (17:30–17:55) · **ผู้ทดสอบ:** Claude (อัตโนมัติผ่าน browser-use / Chrome DevTools Protocol) · คู่มือที่ได้: [11-online-content-manual.md](11-online-content-manual.md)

## 1. สรุปผล

| รายการ | ผล |
|---|---|
| Use case ที่ทดสอบ | **18 กรณี (UC-01 … UC-18) — ผ่านทั้งหมด** |
| ข้อบกพร่องที่พบ | 3 รายการ — **แก้แล้ว 2** (F-01, F-02) · ค้าง 1 (F-03 ข้อความภาษาอังกฤษ) |
| เรื่องที่ต้องตัดสินใจ / ข้อมูล | 3 รายการ (F-04 … F-06) |
| ข้อมูลที่เกิดขึ้นบน DEV | CT000014 (OL_OB · **รออนุมัติ**) · CT000015 (OL_PA · Draft) · ไฟล์ 5 ไฟล์ใน `uploads/` บนเครื่อง |

## 2. สภาพแวดล้อม

| ส่วน | ค่า |
|---|---|
| FE | `D:\Cowork\PLA_TESLA_Management` branch `dev` (มีงานที่ยังไม่ commit) · `npm run client` :4200 + Mock `npm run server` :3000 |
| API | `D:\Cowork\TeslaAdminApi` · `run-api.ps1 -Mode DevWrite` :5277 · DEV PostgreSQL (TLS) · อัปโหลดไฟล์ลงโฟลเดอร์ `uploads/` บนเครื่อง |
| Browser | Chrome 154 headless (โปรไฟล์แยก) ควบคุมด้วย `browser-use/scripts/cdp.py` · หน้าจอ 1440 px |
| ผู้ใช้ | Role **Content Maker** · แหล่งข้อมูล **Tesla API** (UC-18 ใช้ Local) |
| ข้อมูลทดสอบ | สร้าง Content ใหม่ **CT000014** = ST000027 Tax Fighter 10/10 × CHN08 Broker Online (OL_OB) และ **CT000015** = ST000030 PA Test 001 × CHN07 Agent Online (OL_PA) — ไม่แตะ Draft ของผู้ใช้ (CT000009 / CT000011) |

**หมายเหตุการเชื่อมต่อ:** เริ่มจาก Chrome ของผู้ใช้ผ่าน `cdp.py serve` (กด Allow ครั้งเดียว) แต่หน้าต่าง Chrome ถูกย่อ/บังอยู่ (`visibilityState = hidden`) ทำให้ถ่ายรูปค้างและ Timer ถูกหน่วง จึงเปลี่ยนไปใช้ Chrome headless โปรไฟล์แยก (แอปอยู่บน localhost ไม่ต้อง Login) — Daemon ของ Chrome ผู้ใช้ยังเปิดไว้

## 3. ผลทดสอบราย Use case

| UC | กรณีทดสอบ | สิ่งที่ทำ | ผลที่ได้ | ผล |
|---|---|---|---|---|
| UC-01 | สร้าง Content ใหม่ (OL_OB) | Add → Broker Online › ประกันชีวิตสามัญ › สะสมทรัพย์ › ST000027 → Save | "เพิ่ม Package แล้ว CT000014 · ST000027 (Template OL_OB) — สถานะ Draft" แล้วเปิด Editor 7 Section | ✅ |
| UC-02 | บันทึกร่างตอนยังไม่กรอก | Save ทันที | "บันทึกร่างแล้ว CT000014" · สถานะ DRAFT | ✅ |
| UC-03 | ส่งอนุมัติตอนกรอกไม่ครบ | Submit | ปฏิเสธ พร้อมรายการ 4 ช่อง (Start Date, URL slug, หมวดสินค้า, Title text) · สถานะยัง DRAFT | ✅ |
| UC-04 | URL slug รูปแบบผิด | `Tax Fighter 10/10` · `tax_fighter` · `ภาษี-ไฟท์เตอร์` → Save | ทั้ง 3 แบบ: "URL slug ใช้ได้เฉพาะ a-z, 0-9 และขีด (-)" | ✅ |
| UC-05 | URL slug ซ้ำ | ใช้ slug ของ CT000012 → Save | "URL slug "max-ten-one-10-1-xtra-ui-test" ถูกใช้แล้วใน CT000012" | ✅ |
| UC-06 | ช่วงวันที่ (หน้าจอ) | Start 01/10 (ก่อนวันนี้) · End 01/10 (ก่อน Start) | ช่องไม่รับค่า (ล้างเอง) · Start 06/10 บันทึกได้ | ✅ |
| UC-06b | ช่วงวันที่ (API ตรง) | PUT วันที่ผิดเข้า API โดยตรง | 400 "Start Date ต้องไม่เกิน End Date" / "ช่วงแสดงผลต้องอยู่ระหว่าง 05/10/2026 – ไม่จำกัด" · ข้อมูลไม่เปลี่ยน | ✅ |
| UC-07 | Content information ครบ | วันที่ · slug · หมวด (API 5 ค่า) · SEO · Tag Filter 1+2 ค่า → Save | Path เปลี่ยนเป็น `/products/savings/` · บันทึกได้ — **พบ F-01** | ✅ |
| UC-08 | Thumbnail | อัปโหลดรูป 1 ไฟล์ + ข้อความ 3 บรรทัด | เห็นรูปตัวอย่าง · ไฟล์ `thumb_main_th.png` | ✅ |
| UC-08b | Thumbnail — ไฟล์ผิด | ไฟล์ 6 MB · ไฟล์ข้อความตั้งชื่อ .png | "ไฟล์ใหญ่เกิน 5 MB" (ไม่ส่ง API) · API ปฏิเสธ "File content does not match declared type" รูปเดิมยังอยู่ — **พบ F-03** | ✅ |
| UC-09 | Banner display | รูป Desktop + Mobile (ห่างกัน 15 วินาที) · Title / Sub title | รูปขึ้นครบ 2 · ช่องจำกัด 60 / 80 ตัวอักษร | ✅ |
| UC-10 | Key Features | Icon Asset · เลือก 3 หัวข้อ · เพิ่ม/ลบแถว | Value + ไอคอนมาจาก Master (อ่านอย่างเดียว) · หัวข้อที่ใช้แล้วกดไม่ได้ · 4→3 แถว — **พบ F-02** | ✅ |
| UC-11 | Key Advantages | Header · เลือก 3 การ์ด · เพิ่ม/ลบการ์ด | รูป / Title / Sub title มาจาก Master · การ์ดที่ 4 เห็น 3 หัวข้อเป็น [disabled] | ✅ |
| UC-12 | Package recommend | ดูรายการ · ค้นหาไม่พบ · คลิกเพิ่ม | แสดง ST000026 (CHN08) ไม่แสดง ST000027 (ตัวเอง) · "ไม่พบ Package ตามคำค้น" · ย้ายไป Package Display | ✅ |
| UC-13 | Document T&C | .docx · PDF 11 MB · PDF 1 ไฟล์ | "รองรับเฉพาะไฟล์ PDF" · "ใหญ่เกิน 10 MB" · อัปโหลด PDF สำเร็จ | ✅ |
| UC-14 | บันทึกครบทุก Section | Save แล้วอ่านกลับจาก API | ทุก Field ครบ: page / tagFilter / card / hero / featureIcon / features 3 / advantages 3 / recommend / documents (มี URL) | ✅ |
| UC-15 | โหลดหน้าใหม่ | Reload | ค่าทั้งหมดกลับมาครบ · List content ✓ ครบ 7 Section | ✅ |
| UC-16 | ส่งอนุมัติสำเร็จ | Submit | สถานะ **PENDING** "รออนุมัติ · v1" · Save / Submit / ทุกช่องถูกล็อก | ✅ |
| UC-17 | Template OL_PA | Add ST000030 × CHN07 → Save · Submit ตอนยังไม่ครบ | "Template OL_PA" · 13 Section · Submit แจ้ง 5 ช่อง (Start Date, slug, Headline, เบี้ยเริ่มต้น, ระยะเวลาคุ้มครอง) | ✅ |
| UC-18 | โหมด Local (Mock) | เปิด CT000001 ของ Mock | Dropdown ทุกตัวโหลดจาก Mock (หมวด 5 · KF 6 · KA 5 · Package 4 · Tag Filter 2 ช่อง) · ข้อมูลเก่าขึ้นข้อความให้เลือกใหม่ | ✅ |

## 4. สิ่งที่พบ

| # | เรื่อง | ระดับ | สถานะ |
|---|---|---|---|
| F-01 | Tag Filter แบบ Chip — เลือกหลายค่าแล้ว Chip ตัวท้ายถูกตัด (ไม่ขึ้นบรรทัดใหม่) | ต่ำ (UI) | **แก้แล้ว** — `client/src/styles.scss` ให้ Chip ขึ้นบรรทัดใหม่ (มีผลกับ Multiselect ทุกหน้า รวม Campaign Wizard) |
| F-02 | Key Features — จอ 1440 px ช่องหัวข้อแคบ ~90 px ชื่อหัวข้อ / Value ถูกตัด ("คุ้…") เพราะ Layout ตัดสินจากความกว้างจอ ไม่ใช่ความกว้างการ์ด | กลาง (ใช้งานยาก) | **แก้แล้ว** — `editor-ol-ob.scss` ใช้ Container query: การ์ดแคบกว่า 1000 px → Icon Asset ขึ้นบน แถวเต็มความกว้าง (ช่องหัวข้อ 209 px) |
| F-03 | ข้อความ Error จาก API ตอนไฟล์ไม่ตรงชนิดเป็นภาษาอังกฤษ "File content does not match declared type" | ต่ำ | ค้าง — แก้ที่ API (ImageController / MessageCode) หรือแปลที่ FE |
| F-04 | Master หัวข้อ Key Features บน DEV มีข้อมูลทดสอบปน ("tttttttt", "จ่ายเบี้ยครั้งเดียวจบ" ซ้ำ 2, "จ่ายครั้งเดียว" ชื่อ EN ไม่ตรง) | ข้อมูล | ค้าง — ล้างที่ Master setup |
| F-05 | Template OL_PA ยังใช้หมวดสินค้าแบบเดิม (ค่าคงที่ใน FE) และไม่มี Tag Filter | ออกแบบ | ค้าง — ต้องเลือก Master ของหมวด PA |
| F-06 | API v2 ยังไม่มีอนุมัติ / ตีกลับ → CT000014 ค้างสถานะรออนุมัติบน DEV | ข้อจำกัด | ค้าง — ทดสอบ Flow อนุมัติได้เมื่อทำ endpoint แล้ว |

**ข้อสังเกตด้านสภาพแวดล้อม (ไม่ใช่ข้อบกพร่องของระบบ)**
- อัปโหลดทำ**ทีละไฟล์ ห่างกันอย่างน้อย 15 วินาที** และทุกไฟล์เป็นไฟล์ใหม่ (ไม่ทับไฟล์เดิม) เพราะก่อนหน้านี้ Antivirus กักกัน `TeslaAdminApi.exe` เมื่อ API เขียนทับไฟล์ใน `uploads/` ถี่ ๆ — รอบนี้ไม่มีการแจ้งเตือน และ API ทำงานตลอดการทดสอบ
- PrimeNG ไม่ใส่ `aria-disabled` ให้ตัวเลือกที่ปิดไว้ (ใช้ class `p-disabled`) — ถ้าทำ Automation test ต่อ ให้ตรวจจาก class

## 5. ไฟล์ที่เปลี่ยนจากการทดสอบรอบนี้

- `client/src/app/features/package/content-editor/editor-ol-ob/editor-ol-ob.scss` — F-02
- `client/src/styles.scss` — F-01
- `docs/11-online-content-manual.md`, `docs/12-online-content-test-report.md`, `docs/img/online-content/*.png` (16 รูป), `docs/Online-Content-Manual.pdf`

## 6. ข้อมูลทดสอบที่ค้างบน DEV / เครื่อง

| รายการ | สถานะ | หมายเหตุ |
|---|---|---|
| CT000014 (ST000027 × CHN08, OL_OB) | รออนุมัติ v1 | ข้อความ/รูปเป็นข้อมูลทดสอบ · slug `tax-fighter-10-10-test` |
| CT000015 (ST000030 × CHN07, OL_PA) | Draft | ยังไม่ได้กรอก |
| `TeslaAdminApi/uploads/marketingContent/dev/ST000027/CHN08/v1/` | 5 ไฟล์ | thumb_main_th.png · banner_desktop_th.png · banner_mobile_th.png · product_icon.png · tc_doc_th_01.pdf (โฟลเดอร์ gitignore) |
