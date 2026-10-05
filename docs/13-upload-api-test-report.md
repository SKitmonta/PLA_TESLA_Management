# รายงานทดสอบ Upload API + กรอก Content ทุก Package ผ่านหน้าจอ

> **วันที่ทดสอบ:** 5 ต.ค. 2569 (20:38–) · **ผู้ทดสอบ:** Claude (อัตโนมัติผ่าน browser-use / Chrome DevTools Protocol) · ต่อจาก [12-online-content-test-report.md](12-online-content-test-report.md)
> เจ้าของงานอนุญาตให้เขียน DEV + อัปโหลดจริง + เขียนทับ 1 ครั้ง (U-18) + อัปเดต Content ทุกตัว

## 1. สรุปผล

| รายการ | ผล |
|---|---|
| Upload API `POST /tesla-admin/api/v1/image/upload` | **41 กรณี — ผ่านทั้งหมด** (ปฏิเสธถูกต้อง 29 · บันทึกจริง + ดึงกลับ byte ตรง 12) |
| กรอก Content ผ่านหน้า Editor + อัปโหลดจริง | **8/8 Content บันทึก Draft สำเร็จ** (CT000005 สร้าง Version 2) · อัปโหลดจริง 28 ไฟล์ · รูปหน้าจอทั้งหน้า 8 รูป (§5) |
| ข้อสังเกต | F-07 (ไฟล์เกินเพดาน multipart) + F-03 (ข้อความอังกฤษ) — **แก้แล้ว 5 ต.ค. 22:00** (§7) |
| Antivirus | ไม่เกิดซ้ำ — อัปโหลดทีละไฟล์ เว้น ≥ 20 วิ · `TeslaAdminApi.exe` (pid เดิมตั้งแต่ 16:13) ทำงานตลอด |

## 2. สภาพแวดล้อม / วิธีทดสอบ

| ส่วน | ค่า |
|---|---|
| API | `run-api.ps1 -Mode DevWrite` :5277 · DEV PostgreSQL (TLS) · ไฟล์ลง `TeslaAdminApi/uploads/` |
| FE | :4200 (proxy `/tesla-admin` → :5277) · Role Content Maker · แหล่งข้อมูล Tesla API |
| Browser | Chrome headless โปรไฟล์แยก + `cdp.py` |
| Upload API | `scripts/content-e2e/test_upload_api.py` + `js/u-body.js` — สร้างไฟล์ในหน้าเว็บแล้วยิง `fetch()` (same origin ผ่าน proxy) · กรณีที่บันทึกจริงดึงไฟล์จาก `publicUrl` กลับมาเทียบ SHA-256 · ใช้ PackageCode สมมติ **`APITEST01` / CHN04 / v1** ไม่ปนกับ Content จริง |
| กรอก Content | `scripts/content-e2e/update_all.py` — เปิดหน้า Editor จริง กรอกเฉพาะช่องว่าง อัปโหลดผ่านช่องอัปโหลดของหน้าจอ แล้ว Save Draft |

## 3. Upload API — กรณีที่ต้องถูกปฏิเสธ (ไม่มีไฟล์ถูกบันทึก)

| # | กรณี | คาดหวัง | ได้ | ผล |
|---|---|---|---|---|
| U-01a | ไม่แนบไฟล์ | 400 TS_FILE_E_0001 | 400 TS_FILE_E_0001 | ✅ |
| U-01b | ไฟล์ 0 byte | 400 TS_FILE_E_0001 | 400 TS_FILE_E_0001 | ✅ |
| U-02a | PackageCode ตัวพิมพ์เล็ก | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-02b | PackageCode `../ST000024` (path traversal) | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-02c | PackageCode ยาว 51 ตัว | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-02d | ChannelCode `CHN-04` | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-02e | ไม่ส่ง ChannelCode | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-03 | VersionNo = 0 | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-04a | Kind = `video` | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-04b | Slot = `hero_bg` | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-05a | banner_desktop ไม่ส่ง LangCode | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-05b | LangCode = `JP` | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 | ✅ |
| U-06a/b/c | tc_doc Index ว่าง / 0 / 11 | 400 TS_VAL_E_0001 | 400 TS_VAL_E_0001 (ทั้ง 3) | ✅ |
| U-07a | รูป 5 MB + 1 byte | 413 TS_FILE_E_0002 | 413 TS_FILE_E_0002 | ✅ |
| U-07b | PDF 10 MB + 1 byte | 413 TS_FILE_E_0002 | 413 TS_FILE_E_0002 | ✅ |
| U-07c | PDF 12 MB (เกินเพดาน multipart 11 MB) | ถูกปฏิเสธ | 400 ProblemDetails ของ ASP.NET ("Failed to read the request form…") — ดู F-07 | ✅ |
| U-08a | นามสกุล `.exe` | 415 TS_FILE_E_0003 | 415 TS_FILE_E_0003 | ✅ |
| U-08b | นามสกุล `.txt` | 415 TS_FILE_E_0003 | 415 TS_FILE_E_0003 | ✅ |
| U-09 | `.png` แต่ MIME `text/plain` | 415 TS_FILE_E_0003 | 415 TS_FILE_E_0003 | ✅ |
| U-10a | `.png` + `image/png` แต่เนื้อไฟล์เป็น PDF | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-10b | `.jpg` แต่เนื้อไฟล์เป็นข้อความ | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-10c | `.pdf` แต่เนื้อไฟล์เป็น PNG | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-11a | SVG มี `<script>` | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-11b | SVG มี `onload=` | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-11c | SVG มีลิงก์ `javascript:` | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-11d | ไฟล์ `.svg` ที่เนื้อเป็น HTML | 400 TS_FILE_E_0004 | 400 TS_FILE_E_0004 | ✅ |
| U-12 | Kind = `pdf` แต่ส่งรูป `.png` | 415 TS_FILE_E_0003 | 415 TS_FILE_E_0003 | ✅ |

## 4. Upload API — กรณีที่บันทึกจริง (`uploads/marketingContent/dev/APITEST01/CHN04/v1/`)

ทุกกรณี: 200 `TS_FILE_S_0001` · GET `publicUrl` = 200 · Content-Type ตรงชนิด · **SHA-256 ตรงกับไฟล์ที่ส่ง**

| # | กรณี | ชื่อไฟล์ที่ API ตั้ง | ขนาด | ผล |
|---|---|---|---|---|
| U-13a | banner_desktop TH (.jpg 1920×640) | `banner_desktop_th.jpg` | 29,066 | ✅ |
| U-13b | banner_mobile TH (.jpg 750×900) | `banner_mobile_th.jpg` | 24,568 | ✅ |
| U-13c | thumb_main TH (.png) | `thumb_main_th.png` | 23,654 | ✅ |
| U-14 | product_icon ไม่ส่ง LangCode (.png) | `product_icon.png` | 2,205 | ✅ |
| U-15a | tc_doc PDF Index 1 | `tc_doc_th_01.pdf` | 193 | ✅ |
| U-15b | tc_doc PDF Index 2 | `tc_doc_th_02.pdf` | 193 | ✅ |
| U-16 | banner_desktop EN (.jpg) | `banner_desktop_en.jpg` (แยกจาก TH) | 28,225 | ✅ |
| U-17a | thumb_main EN (.webp) | `thumb_main_en.webp` | 9,458 | ✅ |
| U-17b | banner_headline_icon TH (.gif) | `banner_headline_icon_th.gif` | 43 | ✅ |
| U-17c | banner_promotion_card TH (.bmp) | `banner_promotion_card_th.bmp` | 70 | ✅ |
| U-17d | header_highlight_icon (.svg สะอาด) | `header_highlight_icon.svg` | 207 | ✅ |
| U-18 | **เขียนทับ** thumb_main TH (.png รูปใหม่) | `thumb_main_th.png` (ชื่อเดิม) → เนื้อไฟล์เป็นรูปใหม่ 22,304 byte · ไม่มี `.tmp` ค้าง | 22,304 | ✅ |

ข้อสังเกตจากชื่อไฟล์: ชื่อ = `{slot}_{lang}[_{index}].{นามสกุลเดิม}` → **นามสกุลต่างกัน = คนละไฟล์** (ไฟล์เก่านามสกุลอื่นยังค้างในโฟลเดอร์) · นามสกุลเดียวกัน = เขียนทับ

## 5. กรอก Content ทุก Package ผ่านหน้า Editor

20:44–20:55 · กรอก **เฉพาะช่องว่าง** (ไม่ทับค่าที่ผู้ใช้กรอก) · อัปโหลดผ่านช่องอัปโหลดของหน้าจอ (= Upload API จริง) ทีละไฟล์ ≥ 20 วิ · นามสกุล `.jpg` / ลำดับ PDF ที่ยังไม่มีบนดิสก์ (ไม่ทับไฟล์เดิม) · Save Draft (ไม่ Submit) · ตรวจซ้ำด้วย GET API + รูปหน้าจอทั้งหน้า

| Content | Package × Channel | Template | ช่องที่กรอกเพิ่ม | อัปโหลดจริง | ผล | รูป |
|---|---|---|---|---|---|---|
| CT000009 | ST000024 × CHN04 | OL_OB | วันเริ่ม · slug · หมวด SAVING · SEO · Tag · Bullet · Headline · KF 3 · KA 3 · Recommend | Banner D/M · Icon KF · PDF #1 (Thumbnail ของผู้ใช้คงเดิม) | ✅ 7/7 Section | [CT000009](img/upload-api-test/CT000009.png) |
| CT000005 | ST000007 × CHN04 | OL_OB | **สร้าง Version 2** (v1 Approved คงเดิม) แล้วกรอกครบ | Thumbnail · Banner D/M · Icon KF · PDF #1 → `…/v2/` | ✅ 7/7 · Draft v2 | [CT000005](img/upload-api-test/CT000005.png) |
| CT000011 | ST000025 × CHN07 | OL_OB | Tag · KA Header (ที่เหลือผู้ใช้กรอกไว้แล้ว) | Icon KF | ✅ 7/7 (*) | [CT000011](img/upload-api-test/CT000011.png) |
| CT000012 | ST000026 × CHN08 | OL_OB | วันเริ่ม · หมวด · SEO · Tag · Bullet · Sub headline · KA · Recommend | — (มีครบแล้ว) | ✅ 7/7 | [CT000012](img/upload-api-test/CT000012.png) |
| CT000004 | ST000006 × CHN01 | AGENT | 20 ช่อง (slug, Hero, KF, Calculator, จุดเด่น, ผลประโยชน์, จุดขาย, Social …) | การ์ดสินค้า · Icon Sticky · เอกสารสรุป (tc_doc #10) (Banner ของผู้ใช้คงเดิม) | ✅ | [CT000004](img/upload-api-test/CT000004.png) |
| CT000013 | ST000011 × CHN01 | AGENT | 20 ช่อง | Banner D/M · การ์ด · Icon · tc_doc #10 | ✅ | [CT000013](img/upload-api-test/CT000013.png) |
| CT000008 | ST000022 × CHN01 | AGENT | 20 ช่อง | Banner D/M · การ์ด · Icon · tc_doc #10 | ✅ | [CT000008](img/upload-api-test/CT000008.png) |
| CT000015 | ST000030 × CHN07 | OL_PA | 18 ช่อง (เบี้ยแผน, Quick facts, ตารางคุ้มครอง, จุดเด่น …) | Banner D/M · การ์ด · Icon · tc_doc #10 | ✅ | [CT000015](img/upload-api-test/CT000015.png) |

(*) CT000011: สคริปต์หยุดก่อน Save เพราะไม่มี PDF ตัวอย่างของ Content นี้ (มีเอกสารอยู่แล้ว) → Save จากหน้าที่ยังเปิดค้าง (ไม่ต้องอัปโหลดซ้ำ) แล้วแก้สคริปต์ให้ข้ามเอกสารเมื่อไม่มีไฟล์ตัวอย่าง

**ที่ยังว่างโดยตั้งใจ:** รูปการ์ดจุดเด่น / รูปแชร์โซเชียล / Sales kit (API ไม่มี Slot — handoff §8 #9) · "ประกันอื่นที่น่าสนใจ" ของ AGENT / OL_PA (ยังไม่มี Content ที่ Approved ให้เลือก) · ข้อความทั้งหมดลงท้าย "(ข้อมูลตัวอย่าง)" ในช่อง SEO / หมายเหตุ

**ไฟล์ใหม่บนดิสก์ (Content จริง):** 28 ไฟล์ — ไม่มีการเขียนทับ · ไม่มี `.tmp` ใหม่ · API ไม่ถูกกักกัน

## 6. ข้อสังเกต

| # | เรื่อง | รายละเอียด | ข้อเสนอ |
|---|---|---|---|
| F-07 | ไฟล์เกินเพดาน multipart (11 MB) | `[RequestFormLimits]` ตัดก่อนเข้า Controller → ได้ 400 ProblemDetails ภาษาอังกฤษของ ASP.NET แทน 413 `TS_FILE_E_0002` · FE แสดงเป็น "อัปโหลดไม่สำเร็จ" ทั่วไป | ดัก `InvalidDataException` / ตั้ง filter ให้คืน 413 + MessageCode เดียวกัน (รวมกับ F-03 ข้อความภาษาไทย) |
| — | ไฟล์ค้างต่างนามสกุล | อัปโหลดรูปใหม่คนละนามสกุล ไฟล์เก่ายังอยู่ (ไม่ถูกอ้างถึงแล้ว) | งานเก็บกวาด `uploads/` ภายหลัง (handoff §8 #12) |

## 7. แก้ F-03 + F-07 (5 ต.ค. 22:00)

| # | แก้อย่างไร | ผล |
|---|---|---|
| F-03 | `ImageController` ทุกจุดที่ตอบ error (32 จุด: upload + รูป Master KF/KA + ลบรูป) ส่ง **`data.result.errors` ภาษาไทย** บอกสาเหตุ (`Shared/Utilities/UploadErrorText.cs`) · รหัส / ข้อความกลางใน `M_MESSAGES` คงเดิม (ไม่แก้ข้อมูล DB · v1 ไม่กระทบ) · FE `upload.service.ts` แสดง `errors[0]` ก่อน | หน้า Editor: อัปโหลดไฟล์ปลอมชนิด → "เนื้อไฟล์ไม่ตรงกับชนิดไฟล์ (เช่น เปลี่ยนนามสกุลเอง) …" ([รูป](img/upload-api-test/upload-error-thai.png)) |
| F-07 | `[RejectOversizedUpload]` (resource filter, `Shared/Filters/`) ตรวจ `Content-Length` ก่อนอ่านฟอร์ม → **413 `TS_FILE_E_0002` + ข้อความไทย** · อ่าน body ทิ้งก่อนตอบ (ไม่งั้น Chrome ตัดการเชื่อมต่อ → "Failed to fetch") · ใส่ทั้ง upload (11 MB) และรูป Master (6 MB) | U-07c: 400 ProblemDetails → **413 + "ไฟล์ใหญ่เกินกำหนด (ทั้งคำขอต้องไม่เกิน 11 MB …)"** |

- ทดสอบซ้ำผ่าน browser **29/29** (เพิ่มเงื่อนไข: ทุกกรณีที่ถูกปฏิเสธต้องมีข้อความไทย) · unit test 658/658 (เพิ่ม 7)
- พบระหว่างแก้: `AllowedImageExtensions` ใน config ซ้ำ 2 ชุด (binding ของ .NET ต่อ array ค่า default + appsettings) — ไม่กระทบการตรวจ · ข้อความใช้ `Distinct()` แล้ว
- คำขอแบบ chunked (ไม่มี Content-Length) ยังได้ ProblemDetails เดิม — Browser / FE ส่ง Content-Length เสมอ

