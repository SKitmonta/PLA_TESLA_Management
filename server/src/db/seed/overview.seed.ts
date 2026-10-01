/**
 * Overview (doc 08) — ใบคำขอ / กรมธรรม์จำลอง + Target ตั้งต้น + สิทธิ์ Campaign ที่เกิดจากกรมธรรม์เหล่านั้น
 * สุ่มแบบกำหนดค่าได้ (Seed คงที่) → Reset กี่ครั้งก็ได้ตัวเลขเดิม · ช่วงวันที่ = 1 ม.ค. 2026 ถึงวันนี้
 * แก้ปริมาณ / ช่วงเบี้ยได้ที่ STREAMS แล้วรัน npm run db:reset (หรือ POST /api/dev/reset-data)
 */
import type { DatabaseSync } from 'node:sqlite';

type Mode = 'PMM01' | 'PMM02' | 'PMM03' | 'PMM04' | 'PMM05';
const PER_YEAR: Record<Mode, number> = { PMM01: 1, PMM02: 1, PMM03: 2, PMM04: 4, PMM05: 12 };

interface Stream {
  pkg: string;
  ch: string;
  start: string;
  /** ใบคำขอเฉลี่ยต่อวัน */
  perDay: number;
  modes: Mode[];
  /** เบี้ยต่อปี (หรือเบี้ยครั้งเดียว) ต่ำสุด – สูงสุด */
  premium: [number, number];
}

const STREAMS: Stream[] = [
  { pkg: 'ST000006', ch: 'CHN01', start: '2026-09-01', perDay: 8, modes: ['PMM02', 'PMM03', 'PMM04', 'PMM05'], premium: [12_000, 90_000] },
  { pkg: 'ST000007', ch: 'CHN04', start: '2026-01-01', perDay: 5, modes: ['PMM01'], premium: [3_000, 60_000] },
  { pkg: 'MOCK-OB02', ch: 'CHN04', start: '2026-01-01', perDay: 1.6, modes: ['PMM01'], premium: [5_000, 50_000] },
  { pkg: 'MOCK-PA01', ch: 'CHN04', start: '2026-01-01', perDay: 0.4, modes: ['PMM02'], premium: [1_500, 3_000] },
  { pkg: 'MOCK-MC01', ch: 'CHN01', start: '2026-01-01', perDay: 1.1, modes: ['PMM02', 'PMM05'], premium: [15_000, 80_000] },
  { pkg: 'MOCK-MC01', ch: 'CHN04', start: '2026-01-01', perDay: 0.8, modes: ['PMM02', 'PMM05'], premium: [15_000, 60_000] },
  { pkg: 'MOCK-BK01', ch: 'CHN02', start: '2026-01-01', perDay: 0.6, modes: ['PMM02'], premium: [20_000, 100_000] },
];

/** สุ่มแบบกำหนดค่าได้ (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function addDays(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  return iso(new Date(y, m - 1, d + n));
}

export function seedPolicies(db: DatabaseSync): void {
  const exists = db.prepare('SELECT COUNT(*) AS n FROM policy_sale').get() as { n: number };
  if (exists.n) return;
  const rand = rng(20260928);
  const today = iso(new Date());
  const insert = db.prepare(
    `INSERT INTO policy_sale (application_no, policy_no, package_code, channel_code, seller_code, referral_campaign,
       submitted_date, approved_date, payment_mode, modal_premium, fyp, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  let seq = 0;
  let pol = 0;
  // ผู้ขายที่ขายได้ (กลุ่มที่ Active จะขายได้มากกว่า)
  const agents = Array.from({ length: 60 }, (_, i) => String(90000101 + i)).filter((c) => !['90000107', '90000108', '90000119'].includes(c));
  const top = agents.filter((c) => Number(c) >= 90000111 && Number(c) <= 90000152);
  const staff = Array.from({ length: 25 }, (_, i) => String(80000001 + i)).filter((c) => c !== '80000009');

  for (let day = '2026-01-01'; day <= today; day = addDays(day, 1)) {
    const weekday = new Date(day).getDay();
    for (const s of STREAMS) {
      if (day < s.start) continue;
      const base = s.perDay * (weekday === 0 || weekday === 6 ? 0.6 : 1.15);
      const n = Math.floor(base + rand());
      for (let k = 0; k < n; k++) {
        seq++;
        const mode = s.modes[Math.floor(rand() * s.modes.length)];
        const annual = Math.round((s.premium[0] + (s.premium[1] - s.premium[0]) * rand() ** 1.6) / 100) * 100;
        const per = PER_YEAR[mode];
        const modal = Math.round(annual / per);
        const fyp = modal * per;
        let seller: string | null = null;
        let referral: string | null = null;
        if (s.ch === 'CHN01' || s.ch === 'CHN02') {
          seller = rand() < 0.6 ? top[Math.floor(rand() ** 1.8 * top.length)] : agents[Math.floor(rand() * agents.length)];
          if (s.pkg === 'ST000006' && top.includes(seller) && rand() < 0.2) referral = 'CMP-REF-2609-0002';
        } else if (rand() < 0.35) seller = staff[Math.floor(rand() * staff.length)];

        const age = Math.round((new Date(today).getTime() - new Date(day).getTime()) / 86_400_000);
        let status = 'APPROVED';
        const r = rand();
        if (age < 3) status = 'PENDING';
        else if (r < 0.09) status = 'DECLINED';
        else if (age < 10 && r < 0.2) status = 'PENDING';
        else if (age > 20 && r > 0.975) status = 'FL_CANCELLED';
        const approved = status === 'APPROVED' || status === 'FL_CANCELLED' ? addDays(day, 2 + Math.floor(rand() * 6)) : null;
        insert.run(
          `A26${String(seq).padStart(6, '0')}`,
          approved ? `P26${String(++pol).padStart(6, '0')}` : null,
          s.pkg,
          s.ch,
          seller,
          referral,
          day,
          approved && approved <= today ? approved : approved ? today : null,
          mode,
          modal,
          fyp,
          status,
        );
      }
    }
  }
}

/** สิทธิ์ Campaign จากกรมธรรม์จำลอง — ตามเงื่อนไข FYP ขั้นต่ำ / ช่วงวัน / Package × Channel / โควตา */
const GRANT_RULES: { code: string; pkg: string; ch: string; from: string; to: string; minFyp: number; value: number; quota: number }[] = [
  { code: 'CMP-VOU-2606-0001', pkg: 'ST000007', ch: 'CHN04', from: '2026-06-01', to: '2026-08-31', minFyp: 0, value: 500, quota: 190 },
  { code: 'CMP-VOU-2609-0001', pkg: 'ST000007', ch: 'CHN04', from: '2026-09-01', to: '2026-12-31', minFyp: 30_000, value: 1000, quota: 500 },
  { code: 'CMP-VOU-2609-0002', pkg: 'ST000006', ch: 'CHN01', from: '2026-09-01', to: '2026-11-30', minFyp: 20_000, value: 1000, quota: 200 },
];

const GRANT_STATUS: Record<string, (age: number) => string> = {
  APPROVED: (age) => (age > 15 ? 'FULFILLED' : 'CONFIRMED'),
  PENDING: () => 'RESERVED',
  DECLINED: () => 'RELEASED',
  FL_CANCELLED: () => 'CLAWED_BACK',
};

export function seedPolicyGrants(db: DatabaseSync): void {
  const exists = db.prepare("SELECT COUNT(*) AS n FROM campaign_grant WHERE application_no LIKE 'A26%'").get() as { n: number };
  if (exists.n) return;
  const today = new Date(iso(new Date())).getTime();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO campaign_grant (campaign_code, application_no, policy_no, seller_code, seller_name, fyp, benefit_value, status, submitted_date)
     VALUES (?, ?, ?, ?, (SELECT seller_name FROM seller WHERE seller_code = ?), ?, ?, ?, ?)`,
  );
  for (const g of GRANT_RULES) {
    const rows = db
      .prepare(
        `SELECT * FROM policy_sale WHERE package_code = ? AND channel_code = ? AND submitted_date BETWEEN ? AND ? AND fyp >= ?
          ORDER BY submitted_date, application_no`,
      )
      .all(g.pkg, g.ch, g.from, g.to, g.minFyp) as Record<string, string | number | null>[];
    let used = 0;
    for (const p of rows) {
      if (used >= g.quota) break;
      const age = Math.round((today - new Date(String(p['submitted_date'])).getTime()) / 86_400_000);
      const status = GRANT_STATUS[String(p['status'])](age);
      if (status !== 'RELEASED' && status !== 'CLAWED_BACK') used++;
      insert.run(g.code, p['application_no'], p['policy_no'], p['seller_code'], p['seller_code'], p['fyp'], g.value, status, p['submitted_date']);
    }
  }
}

/** Target ตั้งต้น (OV-01): ช่องทางของ Package รายเดือน + กลุ่มผู้ขายของ ST000006 × CHN01 */
export function seedTargets(db: DatabaseSync): void {
  const exists = db.prepare('SELECT COUNT(*) AS n FROM sales_target').get() as { n: number };
  if (exists.n) return;
  const insert = db.prepare(
    "INSERT OR IGNORE INTO sales_target (level, ref_id, package_code, channel_code, metric, period, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'U006', '2026-08-25 10:00:00')",
  );
  const months = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `2026-${String(from + i).padStart(2, '0')}`);
  for (const m of months(1, 12)) {
    insert.run('CHANNEL', 'CHN04', 'ST000007', 'CHN04', 'FYP', m, 3_200_000);
    insert.run('CHANNEL', 'CHN04', 'ST000007', 'CHN04', 'POLICY', m, 120);
    insert.run('CHANNEL', 'CHN04', 'MOCK-OB02', 'CHN04', 'FYP', m, 900_000);
  }
  for (const m of months(9, 12)) {
    insert.run('CHANNEL', 'CHN01', 'ST000006', 'CHN01', 'FYP', m, 8_000_000);
    insert.run('CHANNEL', 'CHN01', 'ST000006', 'CHN01', 'POLICY', m, 180);
  }
  const groups = db.prepare("SELECT group_id, group_name FROM seller_group WHERE package_code = 'ST000006' AND channel_code = 'CHN01' AND is_deleted = 0").all() as {
    group_id: number;
    group_name: string;
  }[];
  const perGroup: Record<string, number> = { ทีมกรุงเทพ: 3_500_000, ทีมภาคเหนือ: 2_800_000 };
  for (const g of groups) {
    if (!perGroup[g.group_name]) continue;
    for (const m of months(9, 12)) insert.run('GROUP', String(g.group_id), 'ST000006', 'CHN01', 'FYP', m, perGroup[g.group_name]);
  }
}
