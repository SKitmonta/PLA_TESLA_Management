/**
 * เนื้อหา User guide — แยกเป็นบท (Chapter) ตามเมนู × Role · แต่ละบทมีขั้นตอน 1 2 3 … พร้อมรูปหน้าจอจริงและคำอธิบาย
 * รูปอยู่ที่ client/public/assets/guide/<image> (จับภาพจากระบบจริงที่ 1920px — กรอบสีแดงพร้อมหมายเลข = จุดที่ต้องกด / กรอก)
 * แก้ข้อความได้ที่ไฟล์นี้ไฟล์เดียว · เพิ่มขั้นตอนใหม่ = เพิ่ม object ใน steps
 */
import { RoleCode } from '../../core/models/user.model';

export interface GuideStep {
  title: string;
  /** คำอธิบายหลัก (แต่ละรายการ = 1 ย่อหน้า) */
  body: string[];
  /** ไฟล์รูปใน assets/guide/ */
  image: string;
  /** คำอธิบายใต้รูป — อธิบายหมายเลขในกรอบสีแดง */
  caption?: string;
  /** ข้อควรรู้ / ข้อควรระวัง */
  tips?: string[];
  /** ลิงก์ไปหน้าจริง */
  link?: string;
}

export interface GuideChapter {
  id: string;
  no: number;
  title: string;
  menu: string;
  roles: RoleCode[];
  /** สรุปว่าบทนี้ทำอะไร / ผลลัพธ์ */
  summary: string;
  steps: GuideStep[];
}

export const GUIDE: GuideChapter[] = [
  {
    id: 'start',
    no: 0,
    title: 'เริ่มต้นใช้งาน',
    menu: 'ทุกเมนู',
    roles: ['SYS_ADMIN', 'CONTENT_MAKER', 'CONTENT_APPROVER', 'CAMPAIGN_MAKER', 'CAMPAIGN_APPROVER', 'PEOPLE_ADMIN', 'EXECUTIVE'],
    summary: 'รู้จักหน้าจอหลัก เมนู และการสลับผู้ใช้ / Role เพื่อทำงานตามสิทธิ์',
    steps: [
      {
        title: 'หน้าจอหลักและเมนู',
        body: [
          'เมนูด้านซ้ายแสดงเฉพาะเมนูที่ Role ปัจจุบันมีสิทธิ์ — Overview, Package, Campaign, Seller, Master setup และ User guide',
          'แถบด้านบนแสดงชื่อเมนู, Role ที่ใช้งานอยู่ และปุ่มผู้ใช้ · แถบ Breadcrumb ใต้ Topbar บอกตำแหน่งหน้าปัจจุบัน กดเพื่อย้อนกลับได้',
        ],
        image: 'start-home.jpg',
        caption: '① เมนูหลัก (กดลูกศรเพื่อเปิดเมนูย่อย)  ② Role ที่ใช้งานอยู่  ③ ปุ่มผู้ใช้ / สลับ Role',
        tips: ['กดปุ่ม ☰ มุมซ้ายบนเพื่อย่อ / ขยายเมนู — บนมือถือเมนูจะซ่อนอัตโนมัติ'],
        link: '/overview/dashboard',
      },
      {
        title: 'สลับผู้ใช้และ Role',
        body: [
          'กดปุ่มผู้ใช้มุมขวาบน → เลือกผู้ใช้และ Role ที่ต้องการ ระบบจะเปลี่ยนเมนูและสิทธิ์ทันที (Prototype ใช้แทนการ Login จริง)',
          '1 ผู้ใช้มีได้หลาย Role · ผู้อนุมัติต้องไม่ใช่ผู้สร้างงานนั้น (D-06) — ทดสอบการอนุมัติให้สลับเป็นผู้ใช้อีกคน',
        ],
        image: 'start-role.jpg',
        caption: '① รายชื่อผู้ใช้ (ซ้าย)  ② Role ของผู้ใช้ที่เลือก (ขวา) — กดเพื่อสลับ',
        tips: [
          'User A = Content / Campaign Maker · User B = Content / Campaign Approver · User C = Content Maker · User D = Seller Admin · User E = Executive · IT Admin / Kitmonta = System Admin (ทำได้ทุก Function)',
        ],
      },
    ],
  },
  {
    id: 'master',
    no: 1,
    title: 'ตั้งค่า Master',
    menu: 'Master setup',
    roles: ['SYS_ADMIN'],
    summary: 'เตรียมข้อมูลกลางที่ใช้ใน Content และ Campaign — Master ที่สร้างเอง, ข้อความแสดงผล และข้อมูลที่ Sync จากระบบต้นทาง',
    steps: [
      {
        title: 'Master ที่สร้างเอง (MS-01 … MS-22)',
        body: [
          'เลือกประเภท Master ด้านซ้าย (เช่น MS-10 Voucher) → ตารางด้านขวาแสดงรายการ กด "เพิ่ม" เพื่อสร้างรายการใหม่ หรือกดแถวเพื่อแก้ไข',
          'รายการที่ปิดใช้งาน (Inactive) จะไม่แสดงเป็นตัวเลือกใน Campaign Wizard',
        ],
        image: 'master-custom.jpg',
        caption: '① ประเภท Master  ② รายการ  ③ เพิ่ม / แก้ไข',
        link: '/master/maintenance',
      },
      {
        title: 'Mapping ข้อความแสดงผล',
        body: ['แปลงรหัสจาก Package (เช่น GIO / SIO / FUW, วิธีชำระเบี้ย) เป็นข้อความที่ลูกค้าเห็นบนหน้า Content · เลือกช่องทางเพื่อตั้งค่าแยกได้', 'แก้ข้อความ / ติ๊ก "แสดง" แล้วกด "บันทึก"'],
        image: 'master-mapping.jpg',
        caption: '① ข้อความแสดงผล  ② แสดง / ไม่แสดง  ③ บันทึก',
        link: '/master/display-mapping',
      },
      {
        title: 'Master ที่ Sync จากระบบต้นทาง',
        body: ['ข้อมูล Channel, Payment mode / method, Product type ฯลฯ อ่านอย่างเดียว · กด "Sync ตอนนี้" เพื่อดึงข้อมูลล่าสุด', 'แถวสถานะ "ข้อมูลไม่ครบ" = ต้นทางส่งข้อมูลมาไม่ครบ ต้องแจ้งเจ้าของระบบต้นทาง'],
        image: 'master-synced.jpg',
        caption: '① ประเภทข้อมูล  ② Sync ตอนนี้',
        link: '/master/synced',
      },
    ],
  },
  {
    id: 'content',
    no: 2,
    title: 'สร้าง Content หน้าขาย',
    menu: 'Package › Add Package',
    roles: ['CONTENT_MAKER'],
    summary: '1 Content = หน้าขายของ 1 Package × 1 ช่องทาง · ระบบเลือก Template (OL_OB / OL_PA / AGENT) ให้อัตโนมัติ · บันทึกร่าง → ส่งอนุมัติ',
    steps: [
      {
        title: 'เปิดรายการ Package / Content',
        body: [
          'เมนู Package › Add Package แสดง Content ทั้งหมด พร้อมการ์ดสรุปตามสถานะ (กดการ์ดเพื่อกรอง) และตัวกรองรายคอลัมน์',
          'ปุ่ม ⋮ ท้ายแถว: ดูข้อมูล Package, แก้ไข Content, ตรวจสอบ / อนุมัติ (เฉพาะผู้อนุมัติ)',
        ],
        image: 'pkg-list.jpg',
        caption: '① การ์ดสรุปสถานะ  ② ตัวกรอง  ③ ปุ่ม + Add  ④ เมนู ⋮',
        link: '/package/add',
      },
      {
        title: 'กด + Add แล้วเลือกช่องทางและ Package',
        body: [
          'เลือกตามลำดับ: Distribution Channel → Product Type → Sub Product Type → Package (ช่องถัดไปจะเปิดเมื่อเลือกช่องก่อนหน้าแล้ว) · การ์ดด้านล่างแสดงรายละเอียด Package ที่เลือก',
          'ระบบเลือก Template ให้อัตโนมัติจากช่องทาง × ประเภทสินค้า (เช่น CHN04 + PTY01 → OL_OB) · กด "Save" → ระบบสร้าง Content สถานะ Draft (Toast สีเขียว) แล้วพาไปหน้า Content Editor',
        ],
        image: 'pkg-add-dialog.jpg',
        caption: '① ช่องทาง / ประเภทสินค้า  ② Package  ③ รายละเอียด Package  ④ Save',
        tips: ['แสดงเฉพาะ Package ที่ Approved + Active และยังไม่มี Content ในช่องทางนั้น', '"Reset" = ล้างค่าที่เลือก · "Cancel" = ปิดหน้าต่าง'],
      },
      {
        title: 'กรอกเนื้อหาใน Content Editor',
        body: [
          'รายการ Section ด้านซ้าย (✓ = กรอกครบ) กดเพื่อกระโดดไปยัง Section นั้น · ช่องที่มีป้าย PKG / DRV ดึงจาก Package อัตโนมัติ แก้ไม่ได้ · ป้าย CMS = กรอกเอง',
          'กรอกช่วงแสดงผล Content ให้อยู่ในช่วงขายของ Package',
        ],
        image: 'pkg-editor.jpg',
        caption: '① รายการ Section  ② ช่องกรอก  ③ Save / Submit',
      },
      {
        title: 'บันทึกร่าง และส่งอนุมัติ',
        body: [
          '"Save" = บันทึกร่าง (แก้ต่อได้) · "Submit" = ส่งอนุมัติ ระบบตรวจช่องบังคับ ถ้าไม่ครบจะแจ้งเตือน (Toast สีส้ม) พร้อมรายการที่ขาด',
          'ส่งแล้วสถานะเป็น Pending — แก้ไขไม่ได้จนกว่าจะอนุมัติหรือถูกตีกลับ',
        ],
        image: 'pkg-submit.jpg',
        caption: '① ข้อความแจ้งผล (Toast) — ถ้าไม่ครบจะบอกรายการที่ขาด  ② ปุ่ม Save / Submit',
      },
    ],
  },
  {
    id: 'content-approve',
    no: 3,
    title: 'ตรวจสอบและอนุมัติ Content',
    menu: 'Package › ตรวจสอบ Content',
    roles: ['CONTENT_APPROVER'],
    summary: 'ผู้อนุมัติเทียบสิ่งที่เปลี่ยนกับ Version ที่ใช้งานอยู่ ดู Preview แล้วอนุมัติหรือตีกลับพร้อมเหตุผล',
    steps: [
      {
        title: 'เปิดงานที่รออนุมัติ',
        body: ['ที่รายการ Content กดการ์ด "Pending" เพื่อกรองงานรออนุมัติ → กด ⋮ ท้ายแถว → "ตรวจสอบ / อนุมัติ"', 'หรือกดจาก "งานที่ต้องทำ" ในหน้า Overview'],
        image: 'appr-menu.jpg',
        caption: '① Content สถานะ Pending  ② เมนู ตรวจสอบ / อนุมัติ',
        link: '/package/add',
      },
      {
        title: 'ตรวจสิ่งที่เปลี่ยนและ Preview',
        body: [
          'ตาราง "สิ่งที่เปลี่ยนจาก v1" แสดงเฉพาะ Field ที่ต่างจาก Version ที่ใช้งานอยู่ (สีแดง = เดิม, สีเขียว = ใหม่)',
          'Preview หน้าเว็บสลับ Desktop / Mobile ได้ · ด้านขวาแสดงข้อมูลคำขอและประวัติการอนุมัติ',
        ],
        image: 'appr-review.jpg',
        caption: '① สิ่งที่เปลี่ยน  ② Preview Desktop / Mobile  ③ ข้อมูลคำขอ',
      },
      {
        title: 'ติ๊กรายการตรวจ แล้วอนุมัติหรือตีกลับ',
        body: [
          'อนุมัติได้เมื่อติ๊กรายการตรวจครบ 3 ข้อ · ตีกลับต้องกรอกเหตุผล → กด "ยืนยันผลการพิจารณา"',
          'อนุมัติแล้ว Version ใหม่ใช้งานบนหน้าเว็บทันที (แทน Version เดิม) · ตีกลับแล้ว Maker เห็นเหตุผลในหน้า Editor',
        ],
        image: 'appr-decide.jpg',
        caption: '① รายการตรวจ  ② อนุมัติ / ตีกลับ  ③ หมายเหตุ  ④ ยืนยัน',
        tips: ['อนุมัติงานที่ตัวเองสร้างไม่ได้ (D-06)'],
      },
      {
        title: 'แก้ Content ที่ใช้งานอยู่ = สร้าง Version ใหม่',
        body: ['Content ที่ Approved แล้วแก้ตรง ๆ ไม่ได้ — Maker กด "สร้าง Version ใหม่" ในหน้า Editor ระบบคัดลอกเป็น Draft Version ถัดไป', 'Version เดิมยังแสดงบนหน้าเว็บจนกว่า Version ใหม่จะได้รับอนุมัติ'],
        image: 'pkg-new-version.jpg',
        caption: '① ปุ่ม สร้าง Version ใหม่',
      },
    ],
  },
  {
    id: 'campaign',
    no: 4,
    title: 'สร้าง Campaign (Wizard 5 ขั้น)',
    menu: 'Campaign › Add Campaign',
    roles: ['CAMPAIGN_MAKER'],
    summary: 'ตั้งสิทธิประโยชน์ 9 ประเภท ผูกกับ Package / ช่องทาง กำหนดงบ โควตา และเงื่อนไขผู้มีสิทธิ์ แล้วส่งอนุมัติ',
    steps: [
      {
        title: 'Campaign list',
        body: ['การ์ดสรุป Total / Active / Pending / Draft / หมดอายุใน 7 วัน / Inactive (กดเพื่อกรอง) · ตารางแสดงงบและโควตาที่ใช้', 'กด "Add" เพื่อสร้าง Campaign ใหม่ หรือกดรหัส Campaign เพื่อดูรายละเอียด'],
        image: 'cmp-list.jpg',
        caption: '① การ์ดสรุป  ② ตัวกรอง  ③ Add',
        link: '/campaign/list',
      },
      {
        title: 'ขั้น 1 — เลือกประเภท Campaign',
        body: ['เลือก 1 ใน 9 ประเภท (Voucher, Discount, Cashback, Free gift, Installment, Reward points, Referral, Bundle, Lucky draw)', 'เปลี่ยนประเภทได้จนกว่าจะบันทึกครั้งแรก'],
        image: 'cmp-step1.jpg',
        caption: '① แถบขั้นตอน  ② การ์ดประเภท',
        link: '/campaign/new',
      },
      {
        title: 'ขั้น 2 — ข้อมูลทั่วไป',
        body: [
          'กรอกชื่อ, วัตถุประสงค์, วันเริ่ม–สิ้นสุด, เลือก Package (เฉพาะที่มี Content Approved) และช่องทาง, งบประมาณ, จำนวนสิทธิ์, จังหวะให้สิทธิ์ และ Clawback',
          'ระบบตรวจทันที: ช่วงวันต้องอยู่ในช่วงขายของ Package และห้ามทับซ้อนกับ Campaign ประเภทเดียวกันใน Package เดียวกัน',
        ],
        image: 'cmp-step2.jpg',
        caption: '① Package (เลือกได้เฉพาะที่ Content Approved)  ② วันเริ่ม / วันสิ้นสุด (เลือกจากปฏิทิน)  ③ ผลตรวจช่วงวันทับซ้อน',
        tips: ['ปุ่ม "ถัดไป" / "ย้อนกลับ" อยู่ท้ายหน้า · กดชื่อขั้นในแถบด้านบนเพื่อกระโดดไปขั้นที่ผ่านแล้ว'],
      },
      {
        title: 'ขั้น 3 — สิทธิประโยชน์',
        body: ['Field เปลี่ยนตามประเภท เช่น Voucher: เลือก Voucher จาก Master, จำนวนต่อกรมธรรม์, ช่องทางส่ง · ระบบแสดงจำนวนคงเหลือของ Voucher'],
        image: 'cmp-step3.jpg',
        caption: '① ค่าสิทธิประโยชน์ตามประเภท',
      },
      {
        title: 'ขั้น 4 — เงื่อนไขผู้มีสิทธิ์',
        body: ['เพิ่มเงื่อนไข (AND) เช่น FYP ≥ 30,000, วิธีชำระ, อายุ · Referral ไม่มีขั้นนี้'],
        image: 'cmp-step4.jpg',
        caption: '① เงื่อนไข  ② ตัวดำเนินการ / ค่า  ③ เพิ่มเงื่อนไข',
      },
      {
        title: 'ขั้น 5 — ตรวจสอบและส่งอนุมัติ',
        body: [
          'ตรวจสรุปทุกขั้น (กด "ไปแก้ไข" เพื่อกลับไปขั้นนั้น) → กด "ส่งอนุมัติ" ท้ายหน้า หรือ "Submit" มุมขวาบน ระบบตรวจช่องบังคับ ช่วงวัน และทับซ้อนอีกครั้ง',
          '"Save" ครั้งแรกระบบสร้าง Campaign Code (CMP-{ประเภท}-{YYMM}-{เลขลำดับ}) ให้อัตโนมัติ · ส่งแล้วสถานะเป็น Pending',
        ],
        image: 'cmp-step5.jpg',
        caption: '① สรุปทุกขั้น + ตัวอย่างการ์ดโปรโมชัน  ② Save (บันทึกร่าง)  ③ ส่งอนุมัติ',
      },
    ],
  },
  {
    id: 'campaign-approve',
    no: 5,
    title: 'อนุมัติ Campaign และติดตามสิทธิ์',
    menu: 'Campaign › รายละเอียด',
    roles: ['CAMPAIGN_APPROVER', 'CAMPAIGN_MAKER'],
    summary: 'ผู้อนุมัติตรวจรายละเอียดแล้วอนุมัติ / ตีกลับ · หลังอนุมัติติดตามสิทธิ์ (Grant) งบ และโควตาได้ที่หน้าเดียวกัน',
    steps: [
      {
        title: 'อนุมัติหรือตีกลับ Campaign',
        body: ['เปิด Campaign สถานะ Pending → ตรวจรายละเอียด → กด "อนุมัติ" หรือ "ตีกลับ" (ต้องกรอกเหตุผล)', 'อนุมัติแล้ว: ก่อนวันเริ่ม = Scheduled · อยู่ในช่วงวัน = Active'],
        image: 'cmp-approve.jpg',
        caption: '① สถานะ  ② ตีกลับ / อนุมัติ',
        tips: ['Maker สั่ง Suspend / เปิดใช้อีกครั้งได้จากหน้าเดียวกัน'],
      },
      {
        title: 'ติดตามสิทธิ์ งบ และโควตา',
        body: ['การ์ด 6 สถานะสิทธิ์ (Reserved, Confirmed, Fulfilled, Released, Clawed back, Not granted) · แถบงบและโควตาที่ใช้ · ตารางสิทธิ์รายใบคำขอ (Export CSV ได้)'],
        image: 'cmp-grants.jpg',
        caption: '① สถานะสิทธิ์  ② งบ / โควตา  ③ รายการสิทธิ์',
      },
    ],
  },
  {
    id: 'seller',
    no: 6,
    title: 'จัดกลุ่มผู้ขายและผูก Campaign',
    menu: 'Seller',
    roles: ['PEOPLE_ADMIN'],
    summary: 'จัดผู้ขายเป็นกลุ่มต่อ Package × ช่องทาง (1 คน = 1 กลุ่ม) แล้วผูก Campaign ให้กลุ่ม — ไม่ต้องอนุมัติ มีผลกับใบคำขอใหม่ทันที',
    steps: [
      {
        title: 'เลือก Workspace',
        body: ['1 Workspace = Package × ช่องทาง ที่ Content Approved · ดูจำนวนผู้ขาย กลุ่ม ผู้ยังไม่มีกลุ่ม และผู้ไม่พร้อมขาย', 'กด "จัดกลุ่ม" เพื่อเข้าหน้า Board'],
        image: 'sel-workspace.jpg',
        caption: '① ตัวกรอง  ② ตัวเลขสรุป  ③ จัดกลุ่ม',
        link: '/seller/workspace',
      },
      {
        title: 'ลากผู้ขายเข้ากลุ่ม',
        body: [
          'ซ้าย: ผู้ขายที่ยังไม่มีกลุ่ม (ค้นหา / กรองสาขา ระดับ สถานะ) · ขวา: การ์ดกลุ่ม',
          'ลากคนเข้าการ์ดกลุ่ม หรือติ๊กหลายคนแล้วลาก / เลือกกลุ่มในช่อง "ย้ายคนที่เลือกไปกลุ่ม…" · ลากสมาชิกกลับช่องซ้าย = นำออกจากกลุ่ม',
          'ผู้ขายสีเทา (ใบอนุญาตหมดอายุ / พักงาน / สิ้นสุด) ลากเข้ากลุ่มไม่ได้',
        ],
        image: 'sel-board.jpg',
        caption: '① ยังไม่มีกลุ่ม  ② ผู้ขายไม่พร้อมขาย (สีเทา)  ③ การ์ดกลุ่ม  ④ ย้ายคนที่เลือก',
        tips: ['บนจอสัมผัส ใช้ติ๊กเลือก แล้วกด "วาง N คนที่เลือกที่นี่" บนการ์ดกลุ่มแทนการลาก'],
      },
      {
        title: 'สร้างกลุ่ม',
        body: ['กด "สร้างกลุ่ม" → กรอกชื่อ (ห้ามซ้ำใน Workspace) คำอธิบาย และเลือกสี → "สร้างกลุ่ม"'],
        image: 'sel-create.jpg',
        caption: '① ชื่อกลุ่ม  ② สี  ③ สร้างกลุ่ม',
      },
      {
        title: 'ผูก Campaign กับกลุ่ม',
        body: [
          'กดชื่อกลุ่ม → หน้ารายละเอียดกลุ่ม · ช่อง "เพิ่ม Campaign" แสดงเฉพาะ Campaign ที่มี Package และช่องทางนี้ (ที่ยังไม่ Approved จะเลือกไม่ได้) → กด "ผูก"',
          'แก้ชื่อ / คำอธิบาย / สี แล้วกด "บันทึก" · ประวัติการเปลี่ยนแปลงทั้งหมดอยู่ใน Audit log ด้านล่าง',
        ],
        image: 'sel-group.jpg',
        caption: '① ข้อมูลกลุ่ม  ② Campaign ที่ผูก  ③ เพิ่ม Campaign + ผูก',
      },
      {
        title: 'Referral links',
        body: ['ผู้ขายในกลุ่มที่ผูก Campaign ประเภท Referral ได้ลิงก์ขายรายคนอัตโนมัติ · ดูคลิก → ใบคำขอ → อนุมัติ · คัดลอกลิงก์หรือดู QR', 'ผู้ขายไม่พร้อมขาย ลิงก์ "หยุดนับ" ยอดใหม่'],
        image: 'sel-referral.jpg',
        caption: '① สรุปผล  ② ลิงก์รายผู้ขาย  ③ คัดลอก / QR',
        link: '/seller/referral',
      },
      {
        title: 'เครื่องมือ: คัดลอกกลุ่ม / Import / Audit log',
        body: [
          'คัดลอกกลุ่มจาก Workspace อื่น (ปลายทางต้องยังไม่มีกลุ่ม · ไม่คัดลอก Campaign) — ระบบแสดงผลก่อนคัดลอก',
          'Import: ดาวน์โหลด Template (.csv) → กรอก seller_Code, group_Name → ลากไฟล์มาวาง → ตรวจผลรายแถว → บันทึกแถวที่ผ่าน',
          'Audit log ค้นหาตาม Workspace / ผู้ขาย / กลุ่ม / ช่วงวัน (แก้ไขหรือลบไม่ได้)',
        ],
        image: 'sel-tools.jpg',
        caption: '① คัดลอกกลุ่ม  ② Import  ③ Audit log',
        link: '/seller/tools',
      },
    ],
  },
  {
    id: 'overview',
    no: 7,
    title: 'ติดตามผลบน Overview และตั้ง Target',
    menu: 'Overview',
    roles: ['EXECUTIVE', 'CONTENT_MAKER', 'CONTENT_APPROVER', 'CAMPAIGN_MAKER', 'CAMPAIGN_APPROVER', 'PEOPLE_ADMIN'],
    summary: 'หน้าเดียว เนื้อหาตาม Role — Executive เห็นภาพรวมยอดขาย / Target / Campaign / ผู้ขาย · Role อื่นเห็นงานที่ต้องทำและผลงาน Campaign',
    steps: [
      {
        title: 'เลือกตัวชี้วัดและตัวกรอง',
        body: ['สลับ FYP / APE / จำนวนกรมธรรม์ (ระบบจำค่าที่เลือกไว้) · ตัวกรองช่วงวันที่ ช่องทาง Package ประเภทสินค้า ประเภท Campaign มีผลทั้งหน้า', 'ตัวเลขอัปเดตอัตโนมัติทุก 30 วินาที'],
        image: 'ov-kpi.jpg',
        caption: '① ตัวชี้วัด  ② ตัวกรอง  ③ KPI สรุปผู้บริหาร',
        link: '/overview/dashboard',
      },
      {
        title: 'แนวโน้มยอดขายและผลงานราย Package',
        body: ['กราฟแท่ง = ยอดอนุมัติแยกช่องทาง · เส้นประ = Target · กด "ดูเป็นตาราง" เพื่อดูตัวเลข', 'ตาราง Package: Target จาก sale_Target (FYP ตลอดอายุ Package)'],
        image: 'ov-trend.jpg',
        caption: '① แนวโน้มรายเดือน  ② ตามช่องทาง  ③ ราย Package',
      },
      {
        title: 'ผลงานราย Campaign และผู้ขาย',
        body: ['Campaign: จำนวนสิทธิ์ตามสถานะ งบ / โควตาที่ใช้ (สีส้ม ≥ 80%) · Referral แสดงคลิก → ใบคำขอ → อนุมัติ', 'Top 10 ผู้ขาย หรือสลับ "รายกลุ่ม" เพื่อดู Target vs ยอดจริง'],
        image: 'ov-campaign.jpg',
        caption: '① ผลงานราย Campaign  ② Top ผู้ขาย / รายกลุ่ม',
      },
      {
        title: 'งานที่ต้องทำ (Maker / Approver / Seller Admin)',
        body: ['แสดงเฉพาะงานของ Role ปัจจุบัน เช่น Content / Campaign รออนุมัติ, ถูกตีกลับ, ผู้ขายใบอนุญาตใกล้หมด — กดเพื่อไปหน้าที่ต้องทำงานทันที'],
        image: 'ov-tasks.jpg',
        caption: '① งานที่ต้องทำ  ② กิจกรรมล่าสุด',
      },
      {
        title: 'ตั้ง Target',
        body: [
          'เลือกระดับ (ช่องทาง / กลุ่มผู้ขาย / ผู้ขาย), Package, Channel, ตัวชี้วัด และช่วงเดือน → กรอกค่าในตาราง (ช่องที่แก้เป็นสีส้ม) → "บันทึก"',
          'ผลรวมระดับล่างเกินระดับบน ระบบเตือนแต่ยังบันทึกได้ · Import / Export เป็น .csv',
        ],
        image: 'ov-target.jpg',
        caption: '① ระดับ  ② ตัวเลือก  ③ ตาราง Target  ④ บันทึก',
        tips: ['ตั้ง Target ได้เฉพาะ Executive / Seller Admin / System admin'],
        link: '/overview/target',
      },
    ],
  },
];

/** User journey ภาพรวม (ลำดับงานข้าม Role — doc 11) */
export interface JourneyStage {
  code: string;
  title: string;
  role: string;
  menu: string;
  output: string;
  chapter: string;
}

export const JOURNEY: JourneyStage[] = [
  { code: 'A', title: 'เตรียม Master และข้อความแสดงผล', role: 'System admin', menu: 'Master setup', output: 'ตัวเลือก Campaign / ข้อความบนหน้าขายพร้อมใช้', chapter: 'master' },
  { code: 'B', title: 'สร้าง Content หน้าขาย แล้วส่งอนุมัติ', role: 'Content Maker', menu: 'Package › Add Package', output: 'Content สถานะ Pending', chapter: 'content' },
  { code: 'C', title: 'ตรวจสอบและอนุมัติ Content', role: 'Content Approver', menu: 'Package › ตรวจสอบ Content', output: 'Content Active บนหน้าเว็บ → Package ใช้สร้าง Campaign ได้', chapter: 'content-approve' },
  { code: 'D', title: 'สร้าง Campaign (Wizard 5 ขั้น) แล้วส่งอนุมัติ', role: 'Campaign Maker', menu: 'Campaign › Add Campaign', output: 'Campaign สถานะ Pending', chapter: 'campaign' },
  { code: 'E', title: 'อนุมัติ Campaign', role: 'Campaign Approver', menu: 'Campaign › รายละเอียด', output: 'Campaign Scheduled / Active', chapter: 'campaign-approve' },
  { code: 'F', title: 'จัดกลุ่มผู้ขายและผูก Campaign', role: 'Seller Admin', menu: 'Seller', output: 'ผู้ขายในกลุ่มได้สิทธิ์ Campaign / Referral link', chapter: 'seller' },
  { code: 'G', title: 'กรมธรรม์เข้ามา → ระบบให้สิทธิ์อัตโนมัติ', role: 'ระบบ', menu: '–', output: 'Grant: Reserved → Confirmed → Fulfilled', chapter: 'campaign-approve' },
  { code: 'H', title: 'ติดตามผลและตั้ง Target', role: 'Executive / ทุก Role', menu: 'Overview', output: 'ยอดขาย vs Target, งานที่ต้องทำ', chapter: 'overview' },
];

/** ผลการตรวจสอบระบบตาม Journey (อัปเดตทุกครั้งที่ทดสอบ — doc 11 §3) */
export interface JourneyCheck {
  stage: string;
  check: string;
  role: string;
  expected: string;
  result: 'ผ่าน' | 'ไม่ผ่าน' | 'รอตรวจ';
}

export const JOURNEY_CHECKS: JourneyCheck[] = [
  { stage: '–', check: 'เปิดทุกหน้าในทุกเมนู (System Admin) ที่ 1920px', role: 'System Admin', expected: 'ไม่มี Error / หน้าว่าง', result: 'ผ่าน' },
  { stage: 'A', check: 'Master ที่สร้างเอง / Mapping / Master ที่ Sync แสดงข้อมูล', role: 'System Admin', expected: 'ตาราง + ปุ่มเพิ่ม / บันทึก / Sync ใช้งานได้', result: 'ผ่าน' },
  { stage: 'B', check: '+ Add → เลือก CHN04 › PA › Package MOCK-PA01 → Save', role: 'Content Maker', expected: 'สร้าง CT000008 (OL_PA) สถานะ Draft + Toast สีเขียว', result: 'ผ่าน' },
  { stage: 'B', check: 'Submit ขณะกรอกช่องบังคับไม่ครบ', role: 'Content Maker', expected: 'Toast สีส้ม บอกรายการที่ขาด · สถานะไม่เปลี่ยน', result: 'ผ่าน' },
  { stage: 'B', check: 'กรอกครบ (รวมช่วงแสดงผลจากปฏิทิน) → Submit', role: 'Content Maker', expected: 'สถานะ Pending · แก้ไขไม่ได้', result: 'ผ่าน' },
  { stage: 'C', check: 'อนุมัติ CT000002 v2 (มี Version ใช้งานอยู่)', role: 'Content Approver', expected: 'แสดงตารางสิ่งที่เปลี่ยนจาก v1 · อนุมัติแล้ว v2 ใช้งานแทน', result: 'ผ่าน' },
  { stage: 'C', check: 'อนุมัติ CT000008 v1 (Version แรก)', role: 'Content Approver', expected: 'แสดงข้อความ "Version แรก" แทนตารางเทียบ · Toast "เริ่มใช้งานบนหน้าเว็บ"', result: 'ผ่าน' },
  { stage: 'C', check: 'อนุมัติงานที่ตัวเองสร้าง', role: 'Content Maker', expected: 'ไม่มีเมนู ตรวจสอบ / อนุมัติ (D-06)', result: 'ผ่าน' },
  { stage: 'C', check: 'Content Approved → สร้าง Version ใหม่', role: 'Content Maker', expected: 'ได้ CT000002 v3 สถานะ Draft · v2 ยังใช้งานอยู่', result: 'ผ่าน' },
  { stage: 'D', check: 'Wizard Voucher บน MOCK-PA01 (01/10–31/12/2026 · งบ 60,000 · 200 สิทธิ์ · FYP ≥ 1,500) → Save', role: 'Campaign Maker', expected: 'ได้ Campaign Code CMP-VOU-2609-0003', result: 'ผ่าน' },
  { stage: 'D', check: 'ส่งอนุมัติ', role: 'Campaign Maker', expected: 'สถานะ Pending', result: 'ผ่าน' },
  { stage: 'E', check: 'อนุมัติ CMP-VOU-2609-0003', role: 'Campaign Approver', expected: 'สถานะ Approved · รอเริ่ม (Scheduled)', result: 'ผ่าน' },
  { stage: 'F', check: 'Workspace ใหม่ MOCK-PA01 × CHN04 ปรากฏหลัง Content อนุมัติ', role: 'Seller Admin', expected: 'แสดงในรายการ Workspace', result: 'ผ่าน' },
  { stage: 'F', check: 'สร้างกลุ่ม "ทีมออนไลน์ คิดส์ พีเอ" → ย้าย 5 คน → ผูก CMP-VOU-2609-0003', role: 'Seller Admin', expected: 'กลุ่มมี 5 คน · Campaign ผูกแล้ว · Audit log บันทึกครบ', result: 'ผ่าน' },
  { stage: 'G', check: 'หน้ารายละเอียด Campaign ที่มีกรมธรรม์ (CMP-VOU-2609-0002)', role: 'Campaign Approver', expected: 'การ์ด 6 สถานะ · แถบงบ / โควตา · ตารางสิทธิ์', result: 'ผ่าน' },
  { stage: 'H', check: 'Dashboard มุมมอง Executive (Section A–E)', role: 'Executive', expected: 'KPI / แนวโน้ม / ช่องทาง / Package / Campaign / ผู้ขาย', result: 'ผ่าน' },
  { stage: 'H', check: 'ตั้ง Target กลุ่ม "ทีมใหม่" 1.5M → บันทึก', role: 'Executive', expected: 'บันทึกสำเร็จ + Toast', result: 'ผ่าน' },
  { stage: 'H', check: 'งานที่ต้องทำ → กดรายการ', role: 'Campaign Maker', expected: 'ไปหน้ารายการพร้อมตัวกรองสถานะ', result: 'ผ่าน' },
  { stage: 'แก้ไข', check: 'กดจาก Referral / กลุ่มหนึ่งไปอีกรายการ (เปลี่ยนแค่รหัสใน URL) หน้าไม่โหลดข้อมูลใหม่', role: 'ทุก Role', expected: 'แก้แล้ว: ParamReuseStrategy — โหลดข้อมูลใหม่ทุกครั้งที่รหัสเปลี่ยน', result: 'ผ่าน' },
  { stage: 'แก้ไข', check: 'กดจากงานที่ต้องทำใน Overview แต่รายการไม่กรองสถานะ', role: 'Maker / Approver', expected: 'แก้แล้ว: หน้ารายการอ่าน ?status= จาก URL', result: 'ผ่าน' },
  { stage: 'แก้ไข', check: 'อนุมัติ Content Version แรก แสดงชื่อ Field ภายใน (agentCard.showPhone …)', role: 'Content Approver', expected: 'แก้แล้ว: แสดงข้อความ Version แรกแทน', result: 'ผ่าน' },
];
