/**
 * Package Master (MS-01) — Prototype
 *  - ST000006 / ST000007 / ST000014 : อ้างอิง Payload ตัวอย่าง (doc 05 §1, Mockup Package Master) — ปรับเป็นค่าจริงเมื่อได้ไฟล์ Payload
 *  - MOCK-*                           : ข้อมูลจำลองเพิ่มเติม ใช้ทดสอบ Template / Filter / กติกาช่วงวัน (is_mock = 1)
 * แก้/เพิ่ม Package ได้ในไฟล์นี้ แล้วรัน npm run db:reset
 */
import type { DatabaseSync } from 'node:sqlite';

interface SeedPlan {
  code: string;
  name: string;
  role: 'MASTER' | 'RIDER';
  pty: string;
  spt: string;
  minSi?: number;
  maxSi?: number;
  tax?: string;
  minAge: [number, 'ISDY' | 'ISYR'];
  maxAge: [number, 'ISDY' | 'ISYR'];
  uw: 'GIO' | 'SIO' | 'FUW';
}

interface SeedPackage {
  code: string;
  th: string;
  en: string;
  status: 'APP' | 'DRF';
  active: boolean;
  start: string | null;
  end: string | null;
  mode: 'ALL' | 'CUSTOM';
  channels: string[];
  /** แผนภายใน Package (1 Package มีได้หลายแผนให้ลูกค้าเลือก เช่น คิดส์ พีเอ แผน 1 / แผน 2) — ทีมเราไม่ได้ Setup แผน แค่อ่านมาแสดงใน Content */
  plans: SeedPlan[];
  freeLook: number;
  modes: string[];
  methods: string[];
  target?: number;
  description?: string;
  sellers?: [channel: string, code: string, name: string][];
  mock?: boolean;
}

const ALL_METHODS = ['PMT01', 'PMT02', 'PMT03', 'PMT04', 'PMT05', 'PMT06', 'PMT07', 'PMT08', 'PMT09'];
const ONLINE_METHODS = ['PMT02', 'PMT05', 'PMT06'];
const REGULAR_MODES = ['PMM02', 'PMM03', 'PMM04', 'PMM05'];

const MAX10: SeedPlan = {
  code: 'ENN002', name: 'แม็กซ์ เท็น วัน 10/1', role: 'MASTER', pty: 'PTY01', spt: 'SPT03',
  minSi: 5000, maxSi: 10_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISDY'], maxAge: [65, 'ISYR'], uw: 'GIO',
};

const PACKAGES: SeedPackage[] = [
  {
    code: 'ST000007', th: 'แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า ชนิดไม่มีเงินปันผล', en: 'Max Ten One 10/1 Xtra',
    status: 'APP', active: true, start: '2024-01-01', end: null, mode: 'ALL', channels: ['CHN04'],
    plans: [MAX10], freeLook: 15, modes: ['PMM01'], methods: ALL_METHODS, description: 'ใช้ทดสอบ',
  },
  {
    code: 'ST000014', th: 'แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า ชนิดไม่มีเงินปันผล', en: 'Max Ten One 10/1 Xtra',
    status: 'DRF', active: true, start: null, end: null, mode: 'CUSTOM', channels: ['CHN01'],
    plans: [MAX10], freeLook: 15, modes: ['PMM01'], methods: ALL_METHODS,
    sellers: [
      ['CHN01', '99000003', 'ภาคิน ปรีชากุล'],
      ['CHN01', '99000011', 'ศิริพร วงศ์ใหญ่'],
    ],
  },
  {
    code: 'ST000006', th: 'แฮปปี้ แวลู 90/20 ชนิดไม่มีเงินปันผล', en: 'Happy Value 90/20',
    status: 'APP', active: true, start: '2026-09-01', end: null, mode: 'ALL', channels: ['CHN01'],
    plans: [{ code: 'WLN020', name: 'แฮปปี้ แวลู 90/20', role: 'MASTER', pty: 'PTY01', spt: 'SPT02', minSi: 100_000, maxSi: 20_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISYR'], maxAge: [70, 'ISYR'], uw: 'SIO' }],
    freeLook: 15, modes: REGULAR_MODES, methods: ['PMT02', 'PMT03', 'PMT04', 'PMT05'],
  },
  {
    code: 'MOCK-PA01', th: 'คิดส์ พีเอ (ข้อมูลจำลอง — 1 Package มี 2 แผน)', en: 'Kids PA',
    status: 'APP', active: true, start: '2025-01-01', end: null, mode: 'ALL', channels: ['CHN04'], mock: true,
    plans: [
      { code: 'PAK001', name: 'คิดส์ พีเอ แผน 1', role: 'MASTER', pty: 'PTY08', spt: 'SPT-PA', minSi: 250_000, maxSi: 250_000, tax: 'NONE', minAge: [31, 'ISDY'], maxAge: [20, 'ISYR'], uw: 'GIO' },
      { code: 'PAK002', name: 'คิดส์ พีเอ แผน 2', role: 'MASTER', pty: 'PTY08', spt: 'SPT-PA', minSi: 500_000, maxSi: 500_000, tax: 'NONE', minAge: [31, 'ISDY'], maxAge: [20, 'ISYR'], uw: 'GIO' },
    ],
    freeLook: 15, modes: ['PMM02'], methods: ONLINE_METHODS,
    description: 'แผน 1 / แผน 2 เป็นข้อมูลภายใน Package เดียวกัน (FD-08) — ใช้ทำตารางเปรียบเทียบแผนใน OL_PA',
  },
  {
    code: 'MOCK-OB02', th: 'แม็กซ์ ทรี วัน 3/1 เอ็กซ์ตร้า (ข้อมูลจำลอง)', en: 'Max Three One 3/1 Xtra',
    status: 'APP', active: true, start: '2025-06-01', end: '2026-12-31', mode: 'ALL', channels: ['CHN04'], mock: true,
    plans: [{ code: 'ENN003', name: 'แม็กซ์ ทรี วัน 3/1', role: 'MASTER', pty: 'PTY01', spt: 'SPT03', minSi: 5000, maxSi: 5_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISDY'], maxAge: [70, 'ISYR'], uw: 'GIO' }],
    freeLook: 15, modes: ['PMM01'], methods: ONLINE_METHODS, target: 50_000_000,
  },
  {
    code: 'MOCK-OB03', th: 'แม็กซ์ ไฟว์ วัน 5/1 (ข้อมูลจำลอง — ยังไม่เริ่มขาย)', en: 'Max Five One 5/1',
    status: 'APP', active: true, start: '2026-12-01', end: '2027-12-31', mode: 'ALL', channels: ['CHN04'], mock: true,
    plans: [{ code: 'ENN005', name: 'แม็กซ์ ไฟว์ วัน 5/1', role: 'MASTER', pty: 'PTY01', spt: 'SPT03', minSi: 5000, maxSi: 10_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISDY'], maxAge: [65, 'ISYR'], uw: 'GIO' }],
    freeLook: 15, modes: ['PMM01'], methods: ONLINE_METHODS,
    description: 'ทดสอบ FD-09: Package เริ่มขายในอนาคต → Content เริ่มแสดงได้ตั้งแต่ 01/12/2026',
  },
  {
    code: 'MOCK-MC01', th: 'ทวีทรัพย์ 15/5 (ข้อมูลจำลอง — 2 ช่องทาง)', en: 'Tawee Sub 15/5',
    status: 'APP', active: true, start: '2026-01-01', end: null, mode: 'ALL', channels: ['CHN01', 'CHN04'], mock: true,
    plans: [{ code: 'ENN015', name: 'ทวีทรัพย์ 15/5', role: 'MASTER', pty: 'PTY01', spt: 'SPT03', minSi: 50_000, maxSi: 10_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISYR'], maxAge: [60, 'ISYR'], uw: 'SIO' }],
    freeLook: 15, modes: REGULAR_MODES, methods: ['PMT02', 'PMT04', 'PMT05'],
    description: 'ทดสอบ CD-02: 1 Package หลายช่องทาง → Content แยกตามช่องทาง (OL_OB + AGENT)',
  },
  {
    code: 'MOCK-AG02', th: 'แฮปปี้ ไลฟ์ 99/99 (ข้อมูลจำลอง — ปิดใช้งาน)', en: 'Happy Life 99/99',
    status: 'APP', active: false, start: '2023-01-01', end: '2025-12-31', mode: 'ALL', channels: ['CHN01'], mock: true,
    plans: [{ code: 'WLN099', name: 'แฮปปี้ ไลฟ์ 99/99', role: 'MASTER', pty: 'PTY01', spt: 'SPT02', minSi: 100_000, maxSi: 20_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISYR'], maxAge: [70, 'ISYR'], uw: 'FUW' }],
    freeLook: 15, modes: REGULAR_MODES, methods: ['PMT02', 'PMT03', 'PMT04'],
  },
  {
    code: 'MOCK-BK01', th: 'ออมมั่นคง 10/5 (ข้อมูลจำลอง — ช่องทางนายหน้า)', en: 'Om Mankong 10/5',
    status: 'APP', active: true, start: '2025-03-01', end: null, mode: 'ALL', channels: ['CHN02'], mock: true,
    plans: [{ code: 'ENN010', name: 'ออมมั่นคง 10/5', role: 'MASTER', pty: 'PTY01', spt: 'SPT03', minSi: 50_000, maxSi: 5_000_000, tax: 'LIFE_FULL', minAge: [1, 'ISYR'], maxAge: [60, 'ISYR'], uw: 'SIO' }],
    freeLook: 15, modes: REGULAR_MODES, methods: ['PMT02', 'PMT04'],
    description: 'ทดสอบ FD-12: ช่องทาง Broker (ชื่อไม่มีคำว่า online) → Template AGENT',
  },
];

export function seedPackages(db: DatabaseSync): void {
  const pkg = db.prepare(
    `INSERT OR IGNORE INTO package (package_code, name_th, name_en, package_type, status_code, is_active, sale_start_date, sale_end_date,
       sale_target, description, seller_selection_mode, free_look_period, is_mock, synced_at)
     VALUES (?, ?, ?, 'STN', ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-09-24 09:00:00')`,
  );
  const channel = db.prepare('INSERT OR IGNORE INTO package_channel (package_code, channel_code, seller_selection_mode) VALUES (?, ?, ?)');
  const plan = db.prepare(
    `INSERT OR IGNORE INTO package_plan (package_code, plan_code, plan_name, plan_role, product_type_code, sub_product_type_code,
       min_sum_insured, max_sum_insured, tax_exempt_type, min_issue_age, min_issue_age_method, max_issue_age, max_issue_age_method, underwrite_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const attr = db.prepare('INSERT OR IGNORE INTO package_attribute (package_code, attr_type, code) VALUES (?, ?, ?)');
  const seller = db.prepare('INSERT OR IGNORE INTO package_seller (package_code, channel_code, seller_code, seller_name) VALUES (?, ?, ?, ?)');

  for (const p of PACKAGES) {
    pkg.run(p.code, p.th, p.en, p.status, p.active ? 1 : 0, p.start, p.end, p.target ?? null, p.description ?? null, p.mode, p.freeLook, p.mock ? 1 : 0);
    for (const ch of p.channels) channel.run(p.code, ch, p.mode);
    for (const pl of p.plans) {
      plan.run(p.code, pl.code, pl.name, pl.role, pl.pty, pl.spt, pl.minSi ?? null, pl.maxSi ?? null, pl.tax ?? null,
        pl.minAge[0], pl.minAge[1], pl.maxAge[0], pl.maxAge[1], pl.uw);
    }
    for (const m of p.modes) attr.run(p.code, 'PAYMENT_MODE', m);
    for (const m of p.methods) attr.run(p.code, 'PAYMENT_METHOD', m);
    for (const g of ['M', 'F']) attr.run(p.code, 'GENDER', g);
    for (const o of ['OCC01', 'OCC02', 'OCC03', 'OCC04']) attr.run(p.code, 'OCCUPATION_CLASS', o);
    for (const [ch, code, name] of p.sellers ?? []) seller.run(p.code, ch, code, name);
  }
}
