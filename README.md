# TESLA Management (PLA) — Prototype

ระบบ Back-office — เมนู Overview · Package (Content selling tools) · Campaign · Seller · Master setup
ออกแบบหลักที่ 1920px + Responsive (Desktop / iPad / Mobile) ตาม Figma `R5FgFh0qCxUUZeITKV0Pfv`
Stack: **Angular 22** (TypeScript) · **Node.js 24 + Express 5** (TypeScript) · **SQLite** (`node:sqlite` ที่มากับ Node)

---

## วิธีรัน (ครั้งแรก)

ดับเบิลคลิก **`setup.bat`** (ครั้งแรก) แล้ว **`start.bat`** — หรือใน Terminal ของ VS Code:

```powershell
.\setup.bat      # = npm install --legacy-peer-deps (ติดตั้งครั้งแรก หรือเมื่อ package.json เปลี่ยน)
.\start.bat      # = npm start  (Server port 3000 + Angular port 4200)
```

> **UI ใช้ PrimeNG 21.1.10** (MIT, ไม่ต้องใช้ License key — v22 ต้องมี Key) ซึ่งประกาศ peer เป็น Angular 21 จึงต้องติดตั้งด้วย `--legacy-peer-deps` เสมอ · Theme อยู่ที่ `client/src/app/core/theme/tesla-preset.ts` · ช่องกรอกใช้ Component กลางใน `client/src/app/shared/components/form/` (text / select / date / number / textarea)

> PowerShell บนเครื่องนี้บล็อกคำสั่ง `npm` — ใช้ `.bat` ด้านบน, พิมพ์ `npm.cmd` แทน `npm`, หรือเปลี่ยน Terminal เป็น Command Prompt

เปิด Browser ที่ **http://localhost:4200**
หยุดการทำงาน: กด `Ctrl + C` ใน Terminal

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm start` | รันทั้งระบบ (แก้ไฟล์แล้วหน้าเว็บ / Server รีโหลดเอง) |
| `npm run server` | รันเฉพาะ API Server |
| `npm run client` | รันเฉพาะ Angular |
| `npm run db:reset` | ล้างฐานข้อมูลกลับเป็นข้อมูลตั้งต้น (หยุด Server ก่อน) |
| `npm run build` | Build Angular สำหรับ Deploy |

---

## โครงสร้างโปรเจค — 1 เมนู = 1 folder

```
Claude_project/
├─ client/                         Angular (หน้าจอ)
│  └─ src/
│     ├─ styles/_tokens.scss       ★ สี / ขนาด / Theme ทั้งระบบ (BMW-UW)
│     ├─ styles.scss               Class กลาง: .card .btn .pill .tag table.dt .input
│     └─ app/
│        ├─ app.routes.ts          Route หลักของ 5 เมนู
│        ├─ core/                  สิ่งที่ใช้ทั้งระบบ (app-info.ts = Version ที่การ์ดล่าง Sidebar)
│        │  ├─ auth/               Role, สิทธิ์เมนู (permissions.ts), สลับผู้ใช้
│        │  ├─ navigation/         ★ รายการเมนู Sidebar (menu.config.ts)
│        │  ├─ layout/             Responsive: desktop / tablet / mobile
│        │  ├─ models/             Type ข้อมูล
│        │  └─ services/           เรียก API
│        ├─ layout/                shell / sidebar / header / breadcrumb / role-switcher
│        ├─ shared/components/     Component ใช้ร่วม (icon, page-placeholder, …)
│        └─ features/              ★ หน้าจอแยกตามเมนู
│           ├─ overview/           dashboard/  target-setting/
│           ├─ package/            เมนู Package: package-list/ (Sprint 2: add-package-dialog/, editor-*/, content-approval/)
│           ├─ campaign/           campaign-list/ (Sprint 3: campaign-wizard/, campaign-detail/)
│           ├─ seller/             เมนู Seller: workspace-list/ (Sprint 4: group-board/, group-detail/, …)
│           └─ master-setup/       package-master/  master-maintenance/  display-mapping/  synced-master/
│
└─ server/                         API (Express + SQLite)
   └─ src/
      ├─ index.ts                  จุดเริ่ม Server
      ├─ routes/                   ★ API แยกไฟล์ตามเมนู: overview / content / campaign / people / master / system
      ├─ middleware/               ผู้ใช้ปัจจุบัน (X-User-Id, X-Role), จัดการ Error
      └─ db/
         ├─ schema.sql             ★ โครงสร้างตาราง
         ├─ seed/                  ★ ข้อมูลตั้งต้น (ผู้ใช้, Package, ผู้ขาย, …)
         └─ database.ts            เปิดฐานข้อมูล server/data/tesla.db
```

**แต่ละหน้าจอมี 3 ไฟล์** เช่น `features/package/package-list/`
- `package-list.ts` — Logic / ข้อมูล
- `package-list.html` — หน้าตา (Template)
- `package-list.scss` — สไตล์เฉพาะหน้า

Icon / Logo จาก Figma อยู่ที่ `client/public/assets/figma/` · เอกสาร Spec ล่าสุดอยู่ที่ `docs/`

### แก้อะไร ที่ไฟล์ไหน

| อยากแก้ | ไฟล์ |
|---|---|
| สีหลัก / ฟอนต์ / มุมโค้ง | `client/src/styles/_tokens.scss` |
| ชื่อเมนู / เมนูย่อยใน Sidebar | `client/src/app/core/navigation/menu.config.ts` |
| Role ไหนเห็นเมนูไหน | `client/src/app/core/auth/permissions.ts` |
| ผู้ใช้จำลอง | `server/src/db/seed/users.seed.ts` แล้วรัน `npm run db:reset` |
| ตารางฐานข้อมูล | `server/src/db/schema.sql` แล้วรัน `npm run db:reset` |

ดูข้อมูลใน SQLite: ติดตั้ง Extension **SQLite Viewer** (VS Code จะแนะนำให้อัตโนมัติ) แล้วคลิกไฟล์ `server/data/tesla.db`

---

## สลับผู้ใช้ / Role (แทน Login ใน Prototype)

กดปุ่ม **Role: …** ที่มุมขวาบน → เลือกผู้ใช้ → เลือก Role
Sidebar จะแสดงเฉพาะเมนูที่ Role นั้นมีสิทธิ์ (doc 09 §3) — ใช้ทดสอบ Maker ≠ Approver ด้วย User A (Maker) / User B (Approver)

---

## สถานะ Sprint

| Sprint | งาน | สถานะ |
|---|---|---|
| 0 | Scaffold, Layout, Theme, สลับ Role | ✅ |
| 1 | Master setup + Seed data (MS-01…MS-04) | ✅ |
| 2 | Package (Content List, Add Package, Editor OB/PA/AGENT, Approval, Version ใหม่) | ✅ |
| 3 | Campaign (Wizard 9 ประเภท, Rule builder, Grant, อนุมัติ) | ✅ |
| 4 | Seller (Workspace, Drag & Drop, ผูก Campaign, Referral links, เครื่องมือ) | ✅ |
| 5 | Overview (Dashboard ตาม Role, ตั้ง Target) | ✅ |
| 6 | User guide (คู่มือขั้นตอน 1 2 3 พร้อมรูป + User journey) | 🔄 กำลังปรับรูปประกอบ |

System Admin ทำได้ทุก Function · กราฟใน Overview วาดด้วย HTML/CSS (ไม่ใช้ chart.js)
ถ้า `npm start` แจ้ง `Failed to resolve import "chart.js/auto"` ให้ลบโฟลเดอร์ `client/.angular/cache` แล้วรันใหม่

Git: branch `dev` — push เมื่อพี่ฟิล์มสั่งเท่านั้น
