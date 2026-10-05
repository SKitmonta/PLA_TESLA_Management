# content-e2e — ทดสอบ / กรอก Content ผ่านหน้าจอจริง (Chrome DevTools Protocol)

เครื่องมือจาก session 5 ต.ค. 2569 (ทดสอบ Online content 18 use case + ทำคู่มือ `docs/11-online-content-manual.md`)
ขับหน้า Content Editor จริงผ่าน `browser-use/scripts/cdp.py` (skill ของผู้ใช้ที่ `~/.claude/skills/browser-use`)

> **ข้อมูลที่เขียนลง DEV ต้องได้รับอนุญาตจากเจ้าของงานก่อน** · ใช้กับ DEV เท่านั้น · ข้อความ/รูป/PDF ทั้งหมดเป็นข้อมูลตัวอย่าง

## เตรียม

1. รัน FE (:4200) + Mock (:3000) + API (`run-api.ps1 -Mode DevWrite`, :5277)
2. เปิด headless Chrome (โปรไฟล์แยก — แอปอยู่บน localhost ไม่ต้อง Login):

```bash
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --user-data-dir="$PWD/hl-profile" --remote-debugging-port=0 --window-size=1440,2600 --force-device-scale-factor=1 --no-first-run --disable-background-timer-throttling --disable-renderer-backgrounding "http://localhost:4200/package/add"
```

3. ตั้ง Role / แหล่งข้อมูล: `PORTFILE=hl-profile/DevToolsActivePort js/run.sh js/s00-role.js`

## ไฟล์

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `js/lib.js` | helper (กรอกช่อง · เลือก Dropdown/Multi · DatePicker · อัปโหลด · รูปแบรนด์ `brandImg`) — ถูกใส่หน้าทุก step |
| `js/run.sh <step.js>` · `js/c.sh <cdp args>` | รัน step / คำสั่ง cdp.py กับ headless Chrome (`$PORTFILE`) หรือ daemon `--via 9333` |
| `js/s00…s21-*.js` | step ของการทดสอบ UC-01…UC-18 (ดู `docs/12-online-content-test-report.md`) |
| `js/secshot.py <name> <selector>` | ถ่ายรูป Section (scroll + crop ด้วย Pillow) |
| `update_all.py [CTxxxxxx …]` | **กรอก Content ทุกตัวที่ยังว่าง + อัปโหลดไฟล์จริง + Save** (ใช้ `fill-body.js`, `upload-body.js`, `save-body.js`, `nv-body.js`) — รันแล้ว 5 ต.ค. 20:44–20:55 (ผลใน `docs/13-upload-api-test-report.md`) |
| `make_pdfs.py` → `assets/tc-*.pdf` | PDF เงื่อนไขทั่วไป "ตัวอย่าง" ต่อ Package (พิมพ์ด้วย headless Chrome) |
| `md2html.py` | Markdown → HTML สำหรับพิมพ์คู่มือเป็น PDF (`chrome --headless=new --print-to-pdf=…`) |
| `test_upload_api.py` + `js/u-body.js` | ทดสอบ Upload API 41 กรณี ยิง `fetch()` จากในหน้าเว็บ (PackageCode สมมติ `APITEST01`) → `upload-api-results.json` |
| `shot_contents.py <CT…>` + `js/fullpage-prep.js` | รูปหน้า Editor ทั้งหน้า (ขยายทุก Section · เลื่อน `main.content` แล้วต่อภาพ) → `docs/img/upload-api-test/` |

## กติกาความปลอดภัย

- **อัปโหลดทีละไฟล์ ห่างกัน ≥ 20 วินาที และเป็นชื่อไฟล์ใหม่เสมอ** — Antivirus เคยกักกัน `TeslaAdminApi.exe` ("Unauthorized file encryption") เมื่อ API เขียนทับไฟล์ใน `uploads/` ถี่ ๆ (5 ต.ค. 16:05)
- `update_all.py` กรอก **เฉพาะช่องที่ว่าง** (ไม่ทับค่าที่ผู้ใช้กรอก) · Save เป็น Draft เท่านั้น ไม่ Submit · CT000005 (Approved) จะ **สร้าง Version ใหม่** ก่อน
- ห้ามใส่ credential / ข้อมูลลูกค้าจริงในสคริปต์หรือรูป
