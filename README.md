# TESLA Management

ระบบจัดการ **Package**, **Campaign**, **Agent / Agent Group** และการ **จับคู่ (Combine) Package + Agent Group + Campaign** พร้อม **Dashboard** สรุปภาพรวม

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Angular 21 + TypeScript + Angular Material |
| Backend  | Node.js + Express 5 + TypeScript + Zod |
| Database | PostgreSQL 16 |

## โครงสร้างโปรเจกต์

```
.
├── database/
│   ├── schema.sql        # ตารางทั้งหมด
│   └── seed.sql          # ข้อมูลตัวอย่าง
├── backend/              # REST API (port 3000)
│   └── src/
│       ├── index.ts      # ตั้งค่า Express + จัดการ error
│       ├── crud.ts       # CRUD router กลาง (list/get/create/update/delete)
│       ├── routes.ts     # API ของแต่ละหน้า + dashboard
│       └── db.ts         # การเชื่อมต่อ PostgreSQL
├── frontend/             # Angular app (port 4200)
│   └── src/app/
│       ├── core/         # models, ApiService, NotifyService
│       ├── shared/       # component/คลาสที่ใช้ร่วมกัน (CrudPage, FormDialog, StatusChip ...)
│       └── pages/        # dashboard, packages, campaigns, agents, agent-groups, combinations
└── docker-compose.yml    # รันทั้งระบบ: db + api + web
```

## เริ่มต้นใช้งาน

### วิธีที่ 1: รันทั้งระบบด้วย Docker (แนะนำ)

ต้องมีแค่ [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ไม่ต้องติดตั้ง Node.js หรือ PostgreSQL)

```bash
cd D:\PLA_TESLA_Management
docker compose up -d --build
```

| บริการ | URL |
|--------|-----|
| หน้าเว็บ | http://localhost:8080 |
| API | http://localhost:3000/api |
| PostgreSQL | `localhost:5432` (user/pass: `postgres` / `postgres`, db: `tesla_management`) |

คำสั่งที่ใช้บ่อย:

```bash
docker compose ps                 # ดูสถานะ
docker compose logs -f api        # ดู log ของ API
docker compose up -d --build      # build ใหม่หลังแก้โค้ด
docker compose down               # หยุดระบบ (ข้อมูลยังอยู่)
docker compose down -v            # หยุดและล้างฐานข้อมูล (จะสร้างข้อมูลตัวอย่างใหม่ตอนเปิดครั้งถัดไป)
```

### วิธีที่ 2: รันด้วย Node.js (สำหรับพัฒนา แก้โค้ดแล้วเห็นผลทันที)

ต้องมี Node.js 22.12+ (แนะนำ 24 LTS) และ Docker Desktop (ใช้เปิดฐานข้อมูล)

รันที่โฟลเดอร์หลัก `D:\PLA_TESLA_Management`:

```bash
npm run setup     # ติดตั้ง package ทั้งหมด (ทำครั้งแรกครั้งเดียว)
npm run db        # เปิดฐานข้อมูล PostgreSQL (Docker)
npm run seed      # สร้างตาราง + ข้อมูลตัวอย่าง (ล้างข้อมูลเดิมทั้งหมด!)
npm run dev       # เปิด API + เว็บพร้อมกัน -> http://localhost:4200
```

| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | เปิด API (port 3000) และเว็บ (port 4200) พร้อมกัน กด `Ctrl+C` เพื่อหยุด |
| `npm run dev:api` | เปิดเฉพาะ API |
| `npm run dev:web` | เปิดเฉพาะเว็บ |
| `npm run seed` | รีเซ็ตฐานข้อมูลกลับเป็นข้อมูลตัวอย่าง |

> ถ้าเคยรันวิธีที่ 1 ไว้ ให้หยุด container `api` และ `web` ก่อน (`docker compose stop api web`) เพราะใช้ port ชนกัน

ค่าการเชื่อมต่อฐานข้อมูลตั้งได้ที่ `backend/.env` (คัดลอกจาก `.env.example`) ถ้าไม่มีไฟล์นี้จะใช้ค่า default ที่ตรงกับ Docker

## ฟีเจอร์

- **Dashboard** – ตัวเลขสรุป (ทั้งหมด / Active), Package ที่ถูกจับคู่มากที่สุด, จำนวน Agent ต่อกลุ่ม, Campaign timeline, การจับคู่ล่าสุด
- **Packages** – รหัส ชื่อ ราคา รายละเอียด สถานะ
- **Campaigns** – ช่วงวันที่ ส่วนลด (% หรือ ฿) พร้อมตรวจสอบวันที่และเพดาน 100%
- **Agents** – ข้อมูลตัวแทน และแสดงกลุ่มที่สังกัด
- **Agent Groups** – สร้างกลุ่มและเลือกสมาชิกแบบ checklist ค้นหาได้
- **Combine** – จับคู่ Package + Agent Group + Campaign (Campaign ไม่บังคับ) แสดงราคาสุทธิหลังหักส่วนลดแบบ real-time และกันการจับคู่ซ้ำ
- ทุกหน้ามีค้นหา กรองสถานะ เพิ่ม/แก้ไข/ลบ (ยืนยันก่อนลบ) และรองรับมือถือ

สถานะของทุกข้อมูล: `DRAFT` · `ACTIVE` · `INACTIVE`

## REST API

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/dashboard` | ข้อมูลสรุปสำหรับ Dashboard |
| GET | `/api/{resource}?q=&status=` | รายการ (ค้นหา/กรองสถานะ) |
| GET | `/api/{resource}/:id` | ข้อมูลรายการเดียว |
| POST | `/api/{resource}` | สร้าง |
| PUT | `/api/{resource}/:id` | แก้ไข (ส่งเฉพาะ field ที่ต้องการ) |
| DELETE | `/api/{resource}/:id` | ลบ |
| PUT | `/api/agent-groups/:id/members` | กำหนดสมาชิกกลุ่ม `{ "agent_ids": [1,2] }` |

`{resource}` = `packages`, `campaigns`, `agents`, `agent-groups`, `combinations`

ข้อมูลที่ถูกอ้างอิงอยู่ (เช่น Package ที่ใช้ใน Combine) จะลบไม่ได้ ระบบจะแจ้งเตือนเป็นภาษาไทย

## ER Diagram

```
packages ──┐
           ├──< combinations >── agent_groups ──< agent_group_members >── agents
campaigns ─┘   (campaign_id ไม่บังคับ)
```
