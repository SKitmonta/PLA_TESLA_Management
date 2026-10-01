/**
 * เมนู Seller (doc 07) — ผู้ขายจำลอง + กลุ่ม + Campaign ที่ผูก + Referral link + Audit log ตั้งต้น
 * แก้/เพิ่มได้ที่นี่ แล้วรัน npm run db:reset (หรือ POST /api/dev/reset-data)
 *
 *  ตัวแทน CHN01   : 90000101 … 90000160 (60 คน) — ใช้กับ Workspace ST000006 × CHN01 (ALL)
 *                   กรณีพิเศษ: 90000103 / 90000114 ใบอนุญาตหมดใน 30 วัน · 90000107 ใบอนุญาตหมดอายุ · 90000108 พักงาน · 90000119 สิ้นสุด
 *  พนักงาน CHN04  : 80000001 … 80000025 (25 คน) — Workspace ST000007 × CHN04 / MOCK-OB02 × CHN04 (ALL)
 *  CUSTOM         : 99000003, 99000011 (package_seller ของ ST000014 × CHN01)
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

const FIRST = ['สมชาย', 'สุภาพร', 'วิชัย', 'กมลวรรณ', 'ธนพล', 'ปิยะนุช', 'อนุชา', 'ศศิธร', 'ณัฐวุฒิ', 'พิมพ์ชนก', 'ประเสริฐ', 'จันทร์เพ็ญ'];
const LAST = ['ใจดี', 'ศรีสุข', 'มั่นคง', 'รุ่งเรือง', 'ทองดี', 'แสงทอง', 'บุญมา', 'วงศ์สวัสดิ์', 'พรหมมา', 'สายสุวรรณ', 'ชัยมงคล'];
const BRANCHES = ['สาขากรุงเทพ 1', 'สาขากรุงเทพ 2', 'สาขาเชียงใหม่', 'สาขาขอนแก่น', 'สาขาหาดใหญ่'];
const TEAMS = ['หน่วย A', 'หน่วย B', 'หน่วย C'];
const LEVELS = ['ตัวแทน', 'ผู้จัดการหน่วย', 'ผู้จัดการภาค'];

const name = (i: number) => `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
const phone = (i: number) => `08${String(10000000 + i * 7919).slice(0, 8)}`;

/** วันที่เป็น YYYY-MM-DD นับจากวันนี้ (ให้กรณี "หมดใน 30 วัน" ถูกต้องทุกครั้งที่ Reset) */
function fromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function referralToken(campaign: string, seller: string): string {
  return createHash('sha1').update(`${campaign}:${seller}`).digest('base64url').slice(0, 8);
}

export function seedSellers(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO seller (seller_code, seller_name, seller_type, branch, team, level, license_no, license_expiry, status, channel_codes, phone, email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (let i = 1; i <= 60; i++) {
    const code = String(90000100 + i);
    let expiry = fromToday(200 + i * 11);
    let status = 'ACTIVE';
    if (i === 3 || i === 14) expiry = fromToday(12 + i);
    if (i === 7) expiry = fromToday(-20);
    if (i === 8) status = 'SUSPENDED';
    if (i === 19) status = 'TERMINATED';
    insert.run(
      code, name(i), 'AGENT', BRANCHES[i % BRANCHES.length], TEAMS[i % TEAMS.length], LEVELS[i % 9 === 0 ? 1 : i % 23 === 0 ? 2 : 0],
      `6${String(1000000 + i * 373).slice(0, 7)}`, expiry, status, '["CHN01"]', phone(i), `agent${code}@example.com`,
    );
  }
  for (let i = 1; i <= 25; i++) {
    const code = String(80000000 + i);
    insert.run(
      code, name(i + 60), 'EMPLOYEE', 'สำนักงานใหญ่', i <= 12 ? 'ฝ่ายขายดิจิทัล' : 'ฝ่าย Telesales', 'พนักงาน',
      null, null, i === 9 ? 'SUSPENDED' : 'ACTIVE', '["CHN04"]', phone(i + 60), `staff${code}@example.com`,
    );
  }
  // รายชื่อ CUSTOM ของ ST000014 × CHN01 (ชื่อตาม package_seller)
  insert.run('99000003', 'ภาคิน ปรีชากุล', 'AGENT', 'สาขากรุงเทพ 1', 'หน่วย A', 'ตัวแทน', '69000003', fromToday(400), 'ACTIVE', '["CHN01"]', '0812345003', 'agent99000003@example.com');
  insert.run('99000011', 'ศิริพร วงศ์ใหญ่', 'AGENT', 'สาขาเชียงใหม่', 'หน่วย B', 'ตัวแทน', '69000011', fromToday(90), 'ACTIVE', '["CHN01"]', '0812345011', 'agent99000011@example.com');
}

type SeedGroup = { pkg: string; ch: string; name: string; desc: string; color: string; members: string[]; campaigns: string[] };

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => String(from + k));

const GROUPS: SeedGroup[] = [
  { pkg: 'ST000006', ch: 'CHN01', name: 'ทีมกรุงเทพ', desc: 'ตัวแทนเขตกรุงเทพและปริมณฑล', color: '#2854a7', members: range(90000111, 90000132).filter((s) => s !== '90000119'), campaigns: ['CMP-VOU-2609-0002', 'CMP-REF-2609-0002'] },
  { pkg: 'ST000006', ch: 'CHN01', name: 'ทีมภาคเหนือ', desc: 'ตัวแทนภาคเหนือ', color: '#0f8a5f', members: range(90000133, 90000152), campaigns: ['CMP-REF-2609-0002'] },
  { pkg: 'ST000006', ch: 'CHN01', name: 'ทีมใหม่', desc: '', color: '#b45309', members: [], campaigns: [] },
  { pkg: 'ST000007', ch: 'CHN04', name: 'ทีมดิจิทัล', desc: 'พนักงานฝ่ายขายดิจิทัล', color: '#7c3aed', members: range(80000001, 80000012), campaigns: ['CMP-REF-2609-0001'] },
];

export function seedPeople(db: DatabaseSync): void {
  const exists = db.prepare('SELECT COUNT(*) AS n FROM seller_group').get() as { n: number };
  if (exists.n) return;

  const group = db.prepare(
    `INSERT INTO seller_group (package_code, channel_code, group_name, description, color, created_by, created_at, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, 'U005', '2026-09-20 09:00:00', 'U005', '2026-09-24 10:02:00')`,
  );
  const member = db.prepare("INSERT OR IGNORE INTO group_member (package_code, channel_code, seller_code, group_id, joined_at) VALUES (?, ?, ?, ?, '2026-09-20 09:30:00')");
  const bind = db.prepare("INSERT OR IGNORE INTO group_campaign (group_id, campaign_code, bound_by, bound_at) VALUES (?, ?, 'U005', '2026-09-24 10:02:00')");
  const link = db.prepare('INSERT OR IGNORE INTO referral_link (campaign_code, seller_code, token, clicks, applications, approved) VALUES (?, ?, ?, ?, ?, ?)');
  const log = db.prepare(
    `INSERT INTO people_audit_log (action, package_code, channel_code, group_id, group_name, seller_code, campaign_code, detail, actor_id, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const ids: Record<string, number> = {};
  for (const g of GROUPS) {
    const id = Number(group.run(g.pkg, g.ch, g.name, g.desc || null, g.color).lastInsertRowid);
    ids[g.name] = id;
    log.run('CREATE_GROUP', g.pkg, g.ch, id, g.name, null, null, `สร้างกลุ่ม "${g.name}"`, 'U005', 'UI', '2026-09-20 09:00:00');
    for (const s of g.members) member.run(g.pkg, g.ch, s, id);
    for (const c of g.campaigns) {
      bind.run(id, c);
      log.run('BIND', g.pkg, g.ch, id, g.name, null, c, `+ ${c}`, 'U005', 'UI', '2026-09-24 10:02:00');
      if (!c.startsWith('CMP-REF')) continue;
      g.members.forEach((s, k) => {
        const clicks = Math.max(0, 120 - k * 9 + ((k * 37) % 23));
        const apps = Math.floor(clicks / 9);
        link.run(c, s, referralToken(c, s), clicks, apps, Math.floor(apps * 0.65));
      });
    }
  }
  const bkk = ids['ทีมกรุงเทพ'];
  const north = ids['ทีมภาคเหนือ'];
  log.run('IMPORT', 'ST000006', 'CHN01', null, null, null, null, '12 แถวผ่าน · 2 แถวไม่ผ่าน', 'U005', 'IMPORT', '2026-09-24 09:40:00');
  log.run('MOVE', 'ST000006', 'CHN01', bkk, 'ทีมกรุงเทพ', '90000114', null, 'ยังไม่มีกลุ่ม → ทีมกรุงเทพ', 'U005', 'UI', '2026-09-23 16:40:00');
  log.run('MOVE', 'ST000006', 'CHN01', north, 'ทีมภาคเหนือ', '90000140', null, 'ทีมกรุงเทพ → ทีมภาคเหนือ', 'U005', 'UI', '2026-09-22 11:05:00');
  log.run('SYNC_REMOVE', 'ST000006', 'CHN01', bkk, 'ทีมกรุงเทพ', '90000119', null, 'Removed by sync — ไม่อยู่ในรายชื่อ Package', null, 'SYNC', '2026-09-20 09:15:00');
}
