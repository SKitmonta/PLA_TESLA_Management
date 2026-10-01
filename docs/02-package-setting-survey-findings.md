# Package Setting — Component Survey Findings (จาก online.philliplife.com)

**จัดทำเมื่อ:** 9 กันยายน 2569
**สถานะ:** Research/Survey — ยังไม่ใช่ Requirement เต็มรูปแบบ (รอพี่ฟิล์มสั่งให้จัดทำเป็น BR-ID)

## Mockup ที่จัดทำต่อยอด (10 ก.ย. 2569)

Design Canvas 4 หน้าจอ (Package List, Create/Edit Package ข้อมูลพื้นฐาน, Package Configuration — ปรับเต็มตาม Finding, Approve Package):
https://claude.ai/code/artifact/27406607-45b8-415a-84ab-d868aab07173

## ขอบเขตที่สำรวจ

เปรียบเทียบหน้า Product จริงบนเว็บ https://online.philliplife.com กับ UI Mockup "Package Configuration" ที่พี่ฟิล์มจัดทำ (Marketing Config / Package Configuration, ตัวอย่าง ENN019 "Tax Fighter 10/10")

- หมวดออมทรัพย์: Tax Fighter 10/10 (สำรวจละเอียดครบ field)
- หมวดอุบัติเหตุ (PA): คิดส์ พีเอ (สำรวจเปรียบเทียบ Template)
- หมวดสุขภาพและโรคร้ายแรง: ยังไม่มีสินค้า Live (0 รายการ) — ยังไม่มีหน้าให้เทียบ

## Component Inventory (เทียบ 2 หมวดที่ Live แล้ว)

| Component | ออมทรัพย์ (Tax Fighter 10/10) | อุบัติเหตุ (คิดส์ พีเอ) | หมายเหตุ Scope |
|---|---|---|---|
| Banner display (รูป Desktop/Mobile + Title/Subtitle) | มี | มี | Field set เดียวกันทุก Package — ตรงกับ Mockup |
| Sticky bottom bar (โลโก้+ชื่อแผน+เบี้ยเริ่มต้น+ปุ่มซื้อเลย) | มี | มี | เบี้ยที่แสดง ดึงจาก Package/Plan ที่เลือก |
| Key Features (Icon+Topic+Value) | มี 7 แถว (รวม toggle "จ่ายผลประโยชน์ตามสัญญา") | มี 3 แถว | **ยืนยันแล้ว: จำนวนแถวเป็น Dynamic (0-N) ไม่ fix ที่ 7** ตาม mockup |
| Key Advantages (Header + 4 การ์ด Topic/Title/Subtitle) | มี | ไม่พบในหน้านี้ | Section เป็น Optional เปิด/ปิดได้ต่อ Package |
| Package recommend (สินค้าที่น่าสนใจ) | พบ 1 การ์ด | พบ 3 การ์ด, header ข้อความเดียวกัน ("คุ้มครองยาว ลดหย่อนภาษีปัง") | รองรับ cardinality 1-N ตาม mockup ถูกต้องแล้ว; header อาจเป็นข้อความ fix ของ section |
| Campaign/Promotion carousel | มี (มีโปรโมชั่นผูกอยู่) | ไม่พบ | แสดงแบบ Conditional ตามว่ามี Campaign ผูกกับ Package หรือไม่ — ยืนยันขอบเขต Package Setting vs Campaign Setting |
| ข้อมูลสำคัญอื่นๆ (fact sheet) | มี 6 field | มี field set เดียวกัน + ช่องทางชำระเบี้ย | Field คงที่ทุกสินค้า — เป็น Master data ไม่ใช่ CMS free text (ต้องยืนยันว่าอยู่ใน Master Setup หรือ Package Setting) |
| ผลประโยชน์และความคุ้มครอง (ตาราง/กราฟ) | Graph คำนวณจาก rate table | ตารางเปรียบเทียบผลประโยชน์ต่อแผน | มาจาก Actuarial/Rate table ไม่ใช่ CMS manual entry (สมมติฐาน รอยืนยัน) |
| Premium calculator | มี | มี (ช่วงอายุต่างกันตามสินค้า) | อิง Master data ต่อสินค้า ไม่ใช่ CMS content |
| Document General T&C | ลิงก์ "ดูเอกสารเพิ่มเติม" (PDF) | มีข้อความ T&C เต็ม (ความสมบูรณ์ของสัญญา, กรณีไม่คุ้มครอง, หมายเหตุ, คำเตือน) + ลิงก์เอกสาร | **ยืนยันแล้ว: เนื้อหา T&C เป็นของ Legal/Compliance ไม่ใช่ Package Setting CMS field** (ดู Confirmed Decisions) |

## Confirmed Decisions (ยืนยันโดยพี่ฟิล์ม 9 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| 1 | โครงสร้างหลายแผนย่อยในสินค้าเดียว (เช่น คิดส์ พีเอ มีแผน 1/แผน 2) | ~~มองเป็นคนละ Package~~ → **แก้ไข 26 ก.ย. 2569 (FD-08): 1 Package มีหลายแผนให้ลูกค้าเลือก** · การ Setup Package/แผนเป็นหน้าที่ระบบต้นทาง — TESLA Management ทำหน้าที่ Setup Content เท่านั้น |
| 2 | ข้อความ T&C เต็ม (ความสมบูรณ์ของสัญญา/กรณีไม่คุ้มครอง/หมายเหตุ/คำเตือน) | จัดเป็นเนื้อหาของ **Legal/Compliance** ไม่ใช่ field ที่ config ผ่าน Package Setting (พี่ฟิล์มระบุ "คิดว่าอย่างนั้น" — เป็นแนวทางเบื้องต้น ยังไม่ final 100%) |
| 3 | จำนวนแถว Key Features ใน Mockup (7 แถว) | **เป็น Dynamic** — รองรับได้มากกว่าหรือน้อยกว่า 7 แถวตามแต่ละ Package ไม่ fix จำนวน |

## Open Items ที่ยังรอยืนยัน

- ข้อมูลสำคัญอื่นๆ (fact sheet 6-7 field) — อยู่ใน Package Setting หรือ Master Setup
- ผลประโยชน์/กราฟคำนวณ — Package Setting ต้อง config อะไรบ้างหรือ Fully automated จาก Rate table
- Premium calculator — ยืนยันว่าอยู่นอกขอบเขต Content configuration ของ Package Setting
- ราคาส่วนลดที่ Sticky bar (รวม Campaign) — ขอบเขต Package Setting vs Campaign Setting สำหรับ pricing display logic
