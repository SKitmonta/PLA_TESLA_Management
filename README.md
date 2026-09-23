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
└── docker-compose.yml    # PostgreSQL สำหรับ dev
```

## เริ่มต้นใช้งาน

**สิ่งที่ต้องมี:** Node.js 22+, PostgreSQL 16 (หรือ Docker)

### 1. ฐานข้อมูล

ใช้ Docker (สร้างตาราง + ข้อมูลตัวอย่างให้อัตโนมัติ):

```bash
docker compose up -d
```

หรือใช้ PostgreSQL ที่ติดตั้งในเครื่อง:

```bash
createdb tesla_management
psql -d tesla_management -f database/schema.sql
psql -d tesla_management -f database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # แก้ DATABASE_URL ให้ตรงกับเครื่อง
npm install
npm run dev               # http://localhost:3000/api
```

### 3. Frontend

```bash
cd frontend
npm install
npm start                 # http://localhost:4200
```

Frontend จะ proxy `/api` ไปที่ `http://localhost:3000` ให้อัตโนมัติ (ดู `frontend/proxy.conf.json`)

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
