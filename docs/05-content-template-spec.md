# เมนู Package (Content Selling Tools) — Package management + Add Package + Content Template Spec (Draft v0.4)

**บันทึกเมื่อ:** 24 กันยายน 2569 · **อัปเดต v0.3:** 26 กันยายน 2569 (ปรับตาม Figma V2 — FD-01…FD-10) · **v0.4:** 27 กันยายน 2569 (FD-11…FD-15)
**สถานะ:** Draft — Q-03 ปิดแล้ว (HD-01), Q-05/Q-07/Q-08 ใช้ค่าที่เสนอ · เรื่องค้าง: OI-FD-01 (Clone Content — พักไว้)
**Figma:** `R5FgFh0qCxUUZeITKV0Pfv` — Content · รายการ Content_V2 (`1:5216`), Content · Add Package (popup)_V2 (`5:3902`)

> **ชื่อเรียก (FD-01):** เมนูบนหน้าจอชื่อ **Package** (เดิม "Content selling tools") — ข้อความตรงกลาง Topbar ยังเป็น "CONTENT SELLING TOOLS" · สิ่งที่สร้างในเมนูนี้ยังเรียกว่า **Content** (1 Content = เนื้อหาหน้าขายของ 1 Package × 1 Channel)
**แหล่งข้อมูล:** Payload ตัวอย่าง 3 ไฟล์ (ST000007 10/1 Online, ST000014 10/1 Agent, ST000006 90/20 Agent) + https://online.philliplife.com/products/savings/Max10OneXtra (OL_OB) + https://online.philliplife.com/products/PA/kids-pa (OL_PA)

---

## 0. Confirmed Decisions (24 ก.ย. 2569)

| # | ประเด็น | การตัดสินใจ |
|---|---|---|
| ~~CD-01~~ | ~~OL_PA แสดงแผน 1 / แผน 2 เทียบกัน~~ | ~~1 Content ผูกได้หลาย Package~~ → **ยกเลิก แทนด้วย FD-05 (1 Content = 1 Package)** |
| CD-02 | Package หลายช่องทาง | Template ตัดสินจาก **Channel ที่เลือกใน Popup** → 1 Package สร้าง Content ได้ 1 ชิ้นต่อช่องทาง |
| CD-03 | Package ที่ไม่ตรง Template | **ไม่แสดงใน Popup** — Filter แสดงเฉพาะค่าที่จับคู่ Template ได้ |
| CD-04 | ข้อมูลที่ไม่มีใน Payload (ระยะเวลาเอาประกัน, เบี้ยเริ่มต้น, % ผลประโยชน์รายปี, ช่วงเบี้ย Calculator) | **Admin กรอกใน Content** ในเฟสแรก ตรวจความถูกต้องผ่านการอนุมัติ Content; การต่อระบบ Rate เป็นเฟสถัดไป |

## 0.1 Decisions จาก Figma V2 (26 ก.ย. 2569) — แทนที่ข้อที่ขัดกันด้านล่าง

| # | ประเด็น | การตัดสินใจ | แทนที่ |
|---|---|---|---|
| FD-01 | ชื่อเมนู | "Content selling tools" → **Package** · "People management" → **Seller** (เปลี่ยนชื่อแสดงผล — Logic เดิม) | ชื่อเมนูใน 04, 07, 09 |
| FD-02 | คอลัมน์หน้ารายการ | Package Code · Package name · Start Date · End Date · Channel · Status · **Approver** · Create by · Action (⋮) — **เอา Template และ Version ออกจากตาราง** (ยังดูได้ในหน้ารายละเอียด) · Figma V2_1 (`17:3584`) ยังไม่มีคอลัมน์ Approver แต่**ยืนยันให้คงไว้** (พี่ฟิล์ม 26 ก.ย.) | CT-01 เดิม |
| FD-03 | การ์ดสรุปสถานะ | Total · Active · Pending · Draft · Inactive — จับคู่: Active = Approved (ใช้งานอยู่), Pending = รออนุมัติ, Draft = Draft **+ Rejected (ตีกลับนับเป็น Draft)**, Inactive = ปิดใช้งาน | การ์ด 5 ใบเดิม (มี "ตีกลับ") |
| FD-04 | Start Date / End Date | **ช่วงวันที่ Content เริ่ม/หยุดแสดงผล** — ค่าใหม่ที่ Admin กรอกใน Content (ไม่ใช่ช่วงขายของ Package) | – (Field ใหม่) |
| FD-05 | จำนวน Package ต่อ Content | **1 Content = 1 Package ทุก Template (รวม OL_PA)** · Package ที่เนื้อหาคล้ายกันใช้ฟังก์ชัน **Clone Content** (Journey รอทำ — OI-FD-01) | CD-01, BR-CT-004 (OL_PA 1–N), PA-00 |
| FD-06 | Package ที่มี Content แล้ว | **ซ่อนออกจาก Dropdown** ใน Popup Add Package | BR-CT-003 / BR-CT-006 (แสดงป้าย "มี Content แล้ว") |
| FD-07 | ขนาดหน้าจอ | ออกแบบหลักที่ **1920px** และ Responsive ใช้ได้ทั้ง Desktop / iPad / Mobile | – |
| FD-08 | ตารางเปรียบเทียบแผน OL_PA (PA-07) | **1 Package มีหลายแผนให้ลูกค้าเลือก** (เช่น คิดส์ พีเอ แผน 1 / แผน 2 อยู่ใน Package เดียว) — คอลัมน์ในตาราง = แผนใน Package นั้น · **การ Setup Package/แผนไม่ใช่หน้าที่ของ TESLA Management (ทำที่ระบบต้นทาง) เราทำหน้าที่ Setup Content เท่านั้น**; ปิด OI-FD-02 · แทนที่ Decision 9 ก.ย. ใน doc 02 | PA-07, doc 02 #1 |
| FD-09 | ช่วงแสดงผล Content (Start/End Date) | **Start Date ต่ำสุด = ค่าที่มากกว่าระหว่าง เวลาปัจจุบัน กับ start_Date ของ Package** และ **End Date ≤ end_Date ของ Package**; ถ้า Package ไม่ระบุวันสิ้นสุด → ไม่จำกัด End Date; ปิด OI-FD-03, OI-FD-04 | BR-CT-014 |
| FD-10 | เมนูย่อยของ Package | **Package management กับ Add Package คือหน้าเดียวกัน** — เมนู Package มีเมนูย่อยเดียว "+ Add Package" (`/package/add`) · หัวข้อหน้า "Package management" · การ์ด 5 ใบ · กล่อง "Package List" + ปุ่ม "+ Add" (เปิด Popup §2) ตาม Figma `17:3584` (Content · รายการ Content_V2_1) · หน้ารายการ Package ที่ Sync (MS-01 เดิม) ยกเลิก — ดูข้อมูล Package ผ่านเมนู ⋮ "ดูข้อมูล Package" และการ์ดใน Popup | doc 09 MS-01, CT-00 |
| FD-12 | การกำหนด Template | ตามชื่อ Channel + Product type (ดู §3): online + Ordinary Life = OL_OB · online + Personal Accident = OL_PA · Channel อื่น = AGENT · หลัง Save แสดงหน้า Editor ของ Template เดียว | §3 เดิม (ผูกรหัส CHN04/CHN01), CD-03 |
| FD-13 | หน้า Content Editor | ทำตาม Figma "Content · Editor OL_OB / OL_PA / AGENT" (Mockup v0.1 — UI จะปรับอีก): **รายการ Section ด้านซ้ายกว้าง 350px** (ติดด้านบนเมื่อเลื่อน · กดเพื่อไปที่ Section · ไฮไลต์ตามตำแหน่งที่เลื่อน · จอ ≤ 1100px เป็น Dropdown) และ**ไม่มีแผงข้อมูลจาก Package** (พี่ฟิล์ม 27 ก.ย. — ทดลอง Step bar แนวนอนแล้วกลับมาใช้รายการซ้าย) — ค่า PKG/DRV ยังแสดงในช่องของแต่ละ Section; ปุ่ม บันทึกร่าง / Preview (ทำภายหลัง) / ส่งอนุมัติ · OL_PA และ AGENT แสดง Section ที่เหมือน OL_OB แบบย่อ (กดเพื่อขยาย) · **ช่วงแสดงผล Start/End (FD-09) อยู่ใน OB-01** (Figma ยังไม่มี) · **PA-00 ใน Figma (ผูกหลาย Package) ปรับเป็น "แผนใน Package" ตาม FD-05/FD-08** — แผนมาจากระบบต้นทาง กรอกได้เฉพาะชื่อแผนแสดงผลและเบี้ย/ปี · ส่งอนุมัติต้องกรอก Field * ครบ → สถานะ Pending (แก้ไขไม่ได้จนกว่าอนุมัติ/ตีกลับ) · ไฟล์ภาพ/เอกสาร Prototype เก็บเฉพาะชื่อไฟล์ | §5, §6, doc 10 |
| FD-14 | Editor OL_OB (Figma V2 — 27 ก.ย.) | **แทน OB-01…OB-12 ของ OL_OB ด้วย 7 Section**: ① Content information (Start*/End Date, URL slug*, หมวดสินค้า*, ลำดับ, SEO) ② Thumbnail (รูปการ์ด 800×600 + ข้อความ 1st–3rd) ③ Banner display (Desktop/Mobile + Title text* / Sub title text) ④ Key Features (Icon Asset + หัวข้อ: เลือกหัวข้อแล้ว **Value ดึงจาก Package อัตโนมัติ** · หัวข้อที่ Package ไม่มีข้อมูลแสดง null + สวิตช์ Active · "กำหนดเอง" กรอกค่าเอง · เพิ่ม/ลบได้) ⑤ Key Advantages (Header + การ์ด รูป/Topic/Title/Sub title + ปุ่ม Add) ⑥ Package recommend (ค้นหา Content ที่ Approved ช่องทางเดียวกัน → Package Display) ⑦ Document General Terms & Conditions (PDF ≤ 10 MB สูงสุด 10 ไฟล์ ลากวางได้) · **List content** แสดง ✓ เมื่อ Section กรอกครบ · Header ใหม่ (ชื่อ EN/TH, แผน, Eff/Exp Date, Preview / Save / Submit) ใช้กับทุก Template · Field บังคับตอน Submit: Start Date, URL slug, หมวดสินค้า, Title text · **รอยืนยัน**: ช่องใน Content information ของ Figma เป็นข้อความตัวอย่าง (End Date ซ้ำ / 2nd–3rd Thumbnail) จึงใช้ Field เดิมของ OB-01 ไปก่อน; รายการหัวข้อ Key Features และ Topic ของ Key Advantages เป็นค่าสมมติ | FD-13 (เฉพาะ OL_OB) |
| FD-15 | UI Component (27 ก.ย.) | **ใช้ PrimeNG v21 ทั้งระบบ** · ช่องข้อความ = AutoComplete + Float Label แบบ **In** (ป้ายอยู่ในช่อง) · Dropdown = Select (Dropdown) + Float Label In · วันที่ = DatePicker (วว/ดด/ปปปป) · ตัวเลข = InputNumber (คอมมาคั่นหลักพัน) · ปุ่ม = Button · สวิตช์ = ToggleSwitch · ติ๊ก = Checkbox · Tag/Chip/Message/Menu/Tooltip ตามความเหมาะสม · **ขนาดตัวอักษรมาตรฐาน 14px** (หัวข้อ 18px / หัวข้อรองยังเป็นตาม FD-11) · สีหลัก #00317a · ใช้ v21 เพราะ v22 ต้องมี License key | — |
| FD-11 | ขนาดตัวอักษร | หัวข้อหน้า 24px · หัวข้อ (Package List, หัว Popup) **18px** · หัวข้อรอง (หัวตาราง, ป้าย Field, ป้ายการ์ด) **16px** · ข้อความ/ข้อมูลในตาราง **14px** · ช่องค้นหาใต้หัวตาราง 12px (วัดจาก Figma + ยืนยันกับพี่ฟิล์ม) | ทุกหน้า |

**สถานะ Content (อ้างอิง Figma — ใช้ชื่อนี้ทั้งระบบ)**

| สถานะในระบบ | แสดงบนหน้าจอ (Status / การ์ด) | สี (Figma Status) |
|---|---|---|
| Draft | Draft | เทา |
| Rejected (ตีกลับ) | **Draft** (แสดงป้ายเหตุผลตีกลับในหน้ารายละเอียด) | เทา |
| Pending Approval | Pending | ส้ม |
| Approved | Active | เขียว |
| Inactive | Inactive | แดง |

### 0.2 หน้า Package management (CT-01) — Figma `17:3584` (เมนู Package › Add Package)

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| BR-CT-010 | การ์ดสรุป 5 ใบ: Total / Active / Pending / Draft / Inactive | Must | ตัวเลขตรงกับจำนวน Content ตามสถานะ (FD-03); Total = ผลรวม 4 ใบ; กดการ์ด = กรองตารางตามสถานะนั้น (การ์ดที่เลือกไฮไลต์) |
| BR-CT-011 | ตาราง Package List: Package Code, Package name, Start Date, End Date, Channel, Status, Approver, Create by, Action (FD-02) | Must | ทุกคอลัมน์เรียงลำดับได้ (⇅); มีช่องค้นหา/ตัวกรองใต้หัวคอลัมน์ (Code / ชื่อ / Create by = ค้นหา; Start/End/Channel/Status = Select); Approver ว่างถ้ายังไม่อนุมัติ |
| BR-CT-012 | Pagination | Must | แสดง "Showing x to y of z entries"; เลือกจำนวนแถว/หน้า (10 ค่าเริ่มต้น); ปุ่ม หน้าแรก/ก่อนหน้า/ถัดไป/หน้าสุดท้าย |
| BR-CT-013 | Action (⋮) | Must | เมนูตามสิทธิ์ Role: ดู, แก้ไข (สร้าง Version ใหม่ถ้า Approved — D-07), ส่งอนุมัติ, อนุมัติ/ตีกลับ (Approver ≠ Maker — D-06), ปิดใช้งาน, Clone (OI-FD-01) |
| BR-CT-014 | ช่วงแสดงผล Content (FD-04, FD-09) | Must | Start Date เลือกได้ต่ำสุด = max(เวลาปัจจุบัน, start_Date ของ Package) — Package เริ่มขายแล้ว → ต่ำสุดวันนี้; Package ยังไม่เริ่มขาย (เช่น 01/12/2026) → ต่ำสุด 01/12/2026; End Date เลือกได้สูงสุด = end_Date ของ Package (ไม่ระบุ = ไม่จำกัด, End Date ว่างได้); Start ≤ End; กรอกนอกช่วง → บันทึกไม่ได้ พร้อมข้อความ "ช่วงแสดงผลต้องอยู่ระหว่าง {ต่ำสุด} – {สูงสุด}"; ตัวอย่าง ST000007 ขาย 01/01/2024–31/12/2026 → Start ≥ วันนี้, End ≤ 31/12/2026 |

## 1. Package Payload — Field ที่ใช้

| # | Field | ตำแหน่งจริงใน Payload | ตัวอย่าง | ใช้ทำอะไร |
|---|---|---|---|---|
| 1 | package_Code | root | ST000007 | Key / แสดงผล |
| 2 | package_Name_Th | root | แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า ชนิดไม่มีเงินปันผล | ค่าเริ่มต้นของชื่อแสดงผล |
| 3 | package_Name_En | root | Max Ten One 10/1 Xtra | ค่าเริ่มต้นชื่อ EN / slug |
| 4 | package_Channels[].channel_Code | root → array | CHN04 / CHN01 | Filter + เลือก Template |
| 5 | product_Type_Code | **package_Plans[] (plan_Role = MASTER)** ไม่อยู่ที่ root | PTY01 | Filter + เลือก Template |
| 6 | sub_Product_Type_Code | **package_Plans[] (plan_Role = MASTER)** | SPT03 Endowment / SPT02 ตลอดชีพ | Filter |
| 7 | seller_Selection_Mode | root **และ** package_Channels[] (รายช่องทาง) | ALL / CUSTOM | People module |
| 8 | package_Sellers[] | root, ผูกกับช่องทางผ่าน package_Channel_UUID | 99000003 ภาคิน ปรีชากุล | People module |

**ข้อสังเกตสำหรับ SA/Dev**
- P-01 product_Type_Code / sub_Product_Type_Code อยู่ระดับ Plan → ระบบต้องอ่านจาก Plan ที่ plan_Role = "MASTER"
- P-02 package_Channels เป็น Array → การเลือก Template ใช้ Channel ที่เลือกใน Popup (CD-02)
- P-03 seller_Selection_Mode = ALL → package_Sellers ว่าง → รายชื่อผู้ขายใน People ต้องดึงจากฐานข้อมูลตัวแทนของเรา (ทุกคนในช่องทางนั้น); CUSTOM → ใช้ package_Sellers ของช่องทางนั้น
- P-04 Payload มี status_Code (APP / DRF) และ is_Active → Popup แสดงเฉพาะ APP + is_Active = true (Q-05 เสนอ)
- P-05 Field ที่ใช้เติม Fact sheet อัตโนมัติ: min/max_Issue_Age + Method (ISDY = วัน, ISYR = ปี), type_Of_Underwrite_Code, package_Riders, tax_Exempt_Type_Code (ใน Plan), package_PaymentMethods, package_PaymentModes, free_Look_Period, package_Genders
- P-06 Field ที่ไม่มีใน Payload → Admin กรอกใน Content (CD-04)

---

## 2. Add Package Popup (Step 1–6) — Figma `5:3902`

**ลำดับบนหน้าจอ (V2):** Dropdown Distribution Channel* → Product Type* → Sub Product Type* → กล่อง Package: Dropdown Package* → การ์ดแสดงรายละเอียด (Package code, ชื่อ EN, ชื่อ TH, Sale start date, ป้ายช่องทาง) → ปุ่ม Cancel / Reset / Save

**รูปแบบ (Figma 5:3902 ที่พี่ฟิล์มส่ง 26 ก.ย.):** Popup กว้าง 750px · Dropdown เต็มความกว้าง สูง 50 (ข้อความในช่อง เช่น "Distribution Channel *" — ไม่มี Label แยก) · กล่อง "Package" (หัวข้อ 18px) · การ์ดพื้นไล่สีฟ้าอ่อน: ป้ายช่องทางมุมขวาบน (เช่น Direct Online) → ป้าย "Package code : xxx" → ชื่อ EN (ตัวหนา) → ชื่อ TH → ⏱ Sale start date · ปุ่ม Cancel / Reset / Save กว้าง 150 อยู่กึ่งกลาง

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| BR-CT-001 | ปุ่ม "+ Add" (กล่อง Package List) เปิด Popup Add Package | Must | กดปุ่มแล้ว Popup แสดงภายใน 1 วินาที มี Dropdown 3 ชั้น + Dropdown Package + การ์ดรายละเอียด + ปุ่ม Cancel / Reset / Save |
| BR-CT-002 | Filter 3 ตัว: Channel → Product Type → Sub Product Type (Dropdown ต่อเนื่องกัน) ใช้เงื่อนไขแบบ AND | Must | ผลลัพธ์ตรงทั้ง 3 เงื่อนไข; Dropdown ถัดไปแสดงเฉพาะค่าที่มีอยู่จริงตามค่าที่เลือกก่อนหน้า; แสดงเฉพาะ Package status APP + is_Active |
| BR-CT-003 | Dropdown Package แสดงเฉพาะ Package ที่ตรง Filter และ**ยังไม่มี Content** ในช่องทางนั้น (FD-06); เลือกแล้วแสดงการ์ด: package_Code, package_Name_En, package_Name_Th, Sale start date, ป้ายช่องทาง | Must | Package ที่มี Content ที่ยังใช้งาน (Draft/Pending/Active) ไม่ปรากฏใน Dropdown; ปุ่ม Reset ล้างค่าทั้งหมด |
| BR-CT-004 | เลือก Package ได้ **1 รายการทุก Template** (FD-05) แล้ว Save → สร้าง Content สถานะ Draft และกำหนด Template อัตโนมัติ | Must | ปุ่ม Save กดไม่ได้จนกว่าจะเลือกครบทุกช่องที่มี *; หลัง Save ไปหน้า Content Editor ของ Template ที่ถูกต้อง |
| BR-CT-005 | Template Resolution (ข้อ 3, FD-12) — Channel/Product type ที่ไม่มี Template จะไม่ปรากฏใน Filter | Must | Dropdown Channel แสดงเฉพาะช่องทางที่มี Package พร้อมสร้าง Content; Product type แสดงเฉพาะค่าที่ได้ Template กับ Channel ที่เลือก |
| BR-CT-006 | 1 Package + 1 Channel มี Content ที่ยังใช้งานได้เพียงชิ้นเดียว | Must | Package ที่มี Content แล้ว**ถูกซ่อน**จาก Dropdown (FD-06); แก้ไขเนื้อหาผ่าน Version ใหม่ (D-07) |

## 3. Template Resolution Matrix

**เงื่อนไข (FD-12 — พี่ฟิล์ม 27 ก.ย. 2569, แทนตารางเดิมที่ผูกรหัส CHN04/CHN01):** ตัดสินจาก **ชื่อ Channel** และ **ชื่อ Product type** ใน Master ที่ Sync

| # | Channel (ชื่อ) | Product type (แผน MASTER) | Template | ตัวอย่าง Channel ปัจจุบัน | อ้างอิง |
|---|---|---|---|---|---|
| 1 | มีคำว่า **"online"** | **Ordinary Life** (PTY01 ประกันชีวิตสามัญ) | **OL_OB** | CHN04 Direct Online, CHN07 Agent Online, CHN08 Broker Online | Max10OneXtra |
| 2 | มีคำว่า **"online"** | **Personal Accident** (PTY08 ประกันภัยอุบัติเหตุ) | **OL_PA** | (เหมือนข้อ 1) | kids-pa |
| 3 | **ไม่มี**คำว่า "online" | ทุก Product type | **AGENT** | CHN01 Agent, CHN02 Broker, CHN03 Bancassurance, CHN05 Direct Marketing, CHN06 Work Site, CHN09 Partnership | doc 10 |
| – | มีคำว่า "online" | Product type อื่น | ไม่แสดงใน Popup | – | – |
| – | ข้อมูล Channel ไม่ครบ (เช่น CHN11) | – | ไม่แสดงใน Popup | – | – |

- ไม่สนตัวพิมพ์เล็ก/ใหญ่ และนับคำว่า "ออนไลน์" ในชื่อภาษาไทยด้วย · แก้เงื่อนไขได้ที่ `server/src/services/template-resolver.ts` ที่เดียว
- **หลัง Save → เปิดหน้า Content Editor ที่แสดงเฉพาะ Template เดียวตามเงื่อนไข** (`/package/add/{content_code}`); เปิดซ้ำได้จากเมนู ⋮ "แก้ไข Content"
- ✅ ยืนยันแล้ว (พี่ฟิล์ม 27 ก.ย.): CHN07 Agent Online / CHN08 Broker Online มีคำว่า online จึงได้ OL_OB / OL_PA ตามเงื่อนไข (ไม่ใช่ AGENT)

---

## 4. แหล่งที่มาของข้อมูล (Source Legend)

| Code | ความหมาย | ใน Editor |
|---|---|---|
| PKG | ดึงจาก Package Payload ตรงๆ | แสดงอย่างเดียว (Read-only) |
| DRV | คำนวณ/แปลงจาก Package ผ่าน Mapping table | แสดงอย่างเดียว, มี Preview |
| CMS | Admin กรอก/อัปโหลดเอง | แก้ไขได้ |
| GLB | เนื้อหากลางของเว็บ (Legal, ฟอร์มติดต่อ) | ไม่อยู่ใน Content |
| CMP | มาจาก Campaign ที่ผูกไว้ | ไม่อยู่ใน Content |
| EXT | ระบบอื่น (ตัวคำนวณเบี้ย) | ไม่อยู่ใน Content |

## 5. Template OL_OB (ออมทรัพย์ Online) — อ้างอิง Max10OneXtra

| Sec | Section | Field | Source | ตัวอย่างจากเว็บ | Rule |
|---|---|---|---|---|---|
| OB-01 | ตั้งค่าหน้า | URL slug, หมวดสินค้า, ลำดับแสดงผล, SEO title/description | CMS | /products/savings/Max10OneXtra | slug unique, a-z0-9- |
| OB-02 | Hero Banner | รูปพื้นหลัง Desktop / Mobile | CMS | bg_banner_product_detail.webp | .webp/.jpg ≤ 1 MB, ขนาดตาม Spec Design |
|  |  | Label หมวด | DRV (sub_Product_Type) แก้ได้ | ประกันออมทรัพย์ | |
|  |  | ชื่อแสดงผล | PKG → แก้ได้ | แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า | ค่าเริ่มต้น package_Name_Th |
|  |  | Headline / Sub-headline | CMS | ลดหย่อนภาษี...ไม่ต้องรอสิ้นปี! / จัดการภาษีได้ก่อนใคร | ≤ 60 / 80 ตัวอักษร |
| OB-03 | Key Features (Hero) | รายการ Icon + Topic + Value (0–N) | CMS | 7 แถว เช่น "คุ้มครองการเสียชีวิต / 110%" | เรียงลำดับได้ (Drag) |
| OB-04 | Sticky bar | Icon สินค้า, เบี้ยเริ่มต้น, หน่วย | CMS + DRV (หน่วยจาก PaymentMode) | 5,000 / จ่ายเบี้ยครั้งเดียว | PMM01 → "จ่ายเบี้ยครั้งเดียว" |
| OB-05 | Premium Calculator | เพศ, ช่วงอายุ | PKG (Genders, Issue age) | ผู้ชาย/ผู้หญิง | ตัวคำนวณ = EXT |
|  |  | ช่วงเบี้ยที่กรอกได้ | CMS (CD-04) | 5,000 – 5,000,000 บาท | min < max |
| OB-06 | จุดเด่นของแผน | Header + การ์ด 1–N (รูป, Title, Value) | CMS | "คุ้มเต็มแม็กซ์" + 4 การ์ด | |
| OB-07 | ผลประโยชน์ | ตาราง % เงินคืนรายปี (ปีที่, %) → ใช้แสดงทั้งกราฟและตาราง | CMS (CD-04) | ปีที่ 1–5: 2%, ปีที่ 6–9: 2.5%, ปีที่ 10: 102.5% | จำนวนแถว = ระยะเวลาเอาประกัน (ปี) |
|  |  | เบี้ยตัวอย่าง + หมายเหตุใต้กราฟ | CMS | เบี้ยฯ 100,000 บาท/ปี → รวม 122,500 บาท | ผลรวมคำนวณจาก % × เบี้ยตัวอย่าง |
| OB-08 | โปรโมชัน | Header + Carousel | CMS (Header) + CMP | "โปรดี ๆ ที่ไม่ควรพลาด!" | Section ซ่อนอัตโนมัติถ้าไม่มี Campaign |
| OB-09 | ข้อมูลสำคัญอื่นๆ | ระยะเวลาเอาประกันภัย | CMS (CD-04) | 10 ปี | |
|  |  | อายุผู้ขอเอาประกันภัย | DRV (Issue age + Method) | 0 (1 วัน) – 65 ปี | ISDY → "(n วัน)", ISYR → "ปี" |
|  |  | การซื้อสัญญาเพิ่มเติม | DRV (package_Riders) | ไม่ได้ | null/ว่าง → "ไม่ได้" |
|  |  | การตรวจสุขภาพ | DRV (type_Of_Underwrite_Code) | ไม่ต้องตรวจสุขภาพ | ใช้ Mapping ข้อความแสดงผล (Q-07) |
|  |  | เบี้ยประกันภัยเริ่มต้น | CMS (CD-04) | 5,000 บาท | ใช้ค่าเดียวกับ Sticky bar |
|  |  | การลดหย่อนภาษี | DRV (tax_Exempt_Type_Code) | ได้ | มีค่า → "ได้" |
|  |  | ช่องทางชำระเบี้ย (Icon) | DRV (package_PaymentMethods) + ตัวกรองช่องทาง Online | QR PromptPay, บัตรเครดิต/เดบิต, ผ่อน 0% | Payload มี 9 วิธี แต่เว็บแสดง 3 (Q-07) |
| OB-10 | สรุปสาระสำคัญ / เงื่อนไข | ข้อความ Legal | GLB | ความสมบูรณ์ของสัญญา, กรณีไม่คุ้มครอง, คำเตือน | Legal เป็นเจ้าของ |
|  |  | จำนวนวัน Free look ในหมายเหตุ | DRV (free_Look_Period) | 15 วัน | |
|  |  | เอกสารแนบ ("ดูเอกสารเพิ่มเติม") | CMS | PDF | .pdf ≤ 10 MB |
| OB-11 | ประกันอื่นที่น่าสนใจ | Header + เลือก Content อื่น 1–N | CMS | "คุ้มครองยาว ลดหย่อนภาษีปัง" + แม็กซ์ ทรี วัน 3/1 | เลือกได้เฉพาะ Content ที่ Approved (Q-08) |
| OB-12 | การ์ดสินค้า (ใช้ในหน้า List และ Recommend ของสินค้าอื่น) | รูปการ์ด, Label หมวด, ชื่อ, Bullet 3 ข้อ | CMS | "ออมสั้น ผลตอบแทนดี มีเงินคืน / ผลประโยชน์รวม 106% / ชำระครั้งเดียว คุ้มครอง 3 ปี" | Bullet ≤ 3 |
| – | ฟอร์มติดต่อกลับ, Footer | – | GLB | – | ไม่อยู่ใน Content |

## 6. Template OL_PA (อุบัติเหตุ Online) — อ้างอิง kids-pa

ใช้ OB-01, OB-02, OB-04, OB-06, OB-08 ถึง OB-12 เหมือนกัน **ต่างกันที่:**

| Sec | Section | Field | Source | ตัวอย่างจากเว็บ | ต่างจาก OL_OB |
|---|---|---|---|---|---|
| ~~PA-00~~ | ~~แผนที่ผูก~~ | ~~รายการ Package (1–N)~~ | – | – | **ยกเลิก (FD-05)** — 1 Content = 1 Package |
| PA-03a | Hero — Quick facts | เบี้ยเริ่มต้น, การชำระเบี้ย, ระยะเวลาคุ้มครอง, ลดหย่อนภาษี (หัวข้อตายตัว 4 ช่อง) | CMS + DRV | 1,400 บาท / จ่ายเบี้ยครั้งเดียว / 1 ปี / ลดหย่อนภาษีได้ | ใช้หัวข้อตายตัวแทน Icon list อิสระ |
| PA-03b | Hero — Coverage highlights | Topic + จำนวนเงิน + หน่วย (1–N) | CMS | เสียชีวิตจากอุบัติเหตุสูงสุด 250,000 บาท (3 รายการ) | Value เป็นจำนวนเงิน |
| PA-05 | Calculator | เพศ, วันเกิด + ข้อความช่วงอายุ | PKG/DRV | "อายุต้องอยู่ระหว่าง 1 เดือน 1 วัน – 20 ปี" | **ไม่มีช่องกรอกเบี้ย** |
| PA-06 | จุดเด่น | Header + การ์ด (รูป, Title, จำนวนเงิน) | CMS | "คู่หูตัวจิ๋ว แต่คุ้มครองเต็มแม็กซ์" + 3 การ์ด | – |
| PA-07 | ผลประโยชน์ (FD-08) | Header + ตารางเปรียบเทียบ: **แถว** = กลุ่มความคุ้มครอง → รายการย่อย (CMS); **คอลัมน์** = แผนภายใน Package นี้ (ข้อมูลจาก Package — Field จริงยืนยันเมื่อได้ Payload ของ PA, OUT-05) (ชื่อแผน, เบี้ย/ปี CMS, จำนวนเงินแต่ละแถว CMS, ปุ่ม "เลือกแผนนี้" → ลิงก์ไปซื้อ Package ของแผนนั้น) | CMS + PKG | 3 กลุ่ม 7 แถว; แผน 1 = 1,400/ปี, แผน 2 = 1,900/ปี | แทนกราฟเงินคืน |
| PA-08 | โปรโมชัน | – | CMP | ไม่มีในหน้าตัวอย่าง | แสดงเมื่อมี Campaign ผูกกับ Package ใดก็ได้ในแผน (รอยืนยันตอนคุย Campaign) |
| PA-11 | Recommend | – | CMS | แม็กซ์ พีเอ, แม็กซ์ พีเอ พลัส, แม็กซ์ ซีไอ แคร์ | แนะนำข้ามประเภทสินค้าได้ (มีประกันสุขภาพ) |

---

## 7. Open Questions (เหลือ)

| # | คำถาม | ค่าที่เสนอ |
|---|---|---|
| Q-03 | PTY02 คือประเภทอะไร? ใน Payload ตัวอย่าง "Accident" คือ PTY08 (ใน Rider) | รอพี่ฟิล์มยืนยันรหัส |
| Q-05 | Popup แสดงเฉพาะ Package status APP + is_Active | ใช่ (ใส่ใน BR-CT-002 แล้ว) |
| Q-07 | ข้อความแสดงผล Underwrite type / Payment method (GIO → "ไม่ต้องตรวจสุขภาพ", Online แสดงเฉพาะ QR/บัตร/ผ่อน) | ทำเป็น Mapping table ใน Master setup |
| Q-08 | Recommend เลือกข้ามประเภทสินค้าได้ | ได้ แต่ต้องช่องทางเดียวกันและ Content Approved |

---

## 8. เรื่องค้างจาก Figma V2 (26 ก.ย. 2569)

| # | เรื่อง | ต้องการจาก | สถานะ |
|---|---|---|---|
| OI-FD-01 | Journey **Clone Content** — คัดลอก Content จาก Package หนึ่งไปอีก Package แล้วแก้เฉพาะส่วนที่ต่าง | พี่ฟิล์ม | ⏸ พักไว้ก่อน (26 ก.ย.) |
| OI-FD-02 | ตารางเปรียบเทียบแผนของ OL_PA (PA-07) | พี่ฟิล์ม | ✅ ปิด → FD-08 (แผนเป็นข้อมูลใน Package) |
| OI-FD-03 | ช่วงแสดงผล Content (Start/End) เทียบช่วงขาย Package | พี่ฟิล์ม | ✅ ปิด → FD-09 |
| OI-FD-04 | Package ที่ยังไม่เริ่มขาย — Start Date ต่ำสุดของ Content | พี่ฟิล์ม | ✅ ปิด → FD-09 (ใช้ค่าที่มากกว่าระหว่างวันนี้กับวันเริ่มขาย) |

## Change log

| Version | วันที่ | เปลี่ยนอะไร |
|---|---|---|
| v0.2 | 24 ก.ย. 2569 | CD-01…CD-04 |
| v0.3 | 26 ก.ย. 2569 | FD-01…FD-10 ตาม Figma V2: ชื่อเมนู Package, คอลัมน์ตาราง + Approver, การ์ดสถานะ (Rejected = Draft), ช่วงแสดงผล Content, 1 Content = 1 Package, ซ่อน Package ที่มี Content, 1920px + Responsive |
| v0.4 | 27 ก.ย. 2569 | FD-11…FD-14 (Template ตาม Channel, Content Editor, OL_OB V2) · FD-15 เปลี่ยน Component ทั้งระบบเป็น PrimeNG v21 (Float Label In, Select, DatePicker ฯลฯ) · ตัวอักษรมาตรฐาน 14px |
