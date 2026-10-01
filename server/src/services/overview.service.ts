/**
 * Overview — Dashboard (OV-A…OV-F) และตั้ง Target (BR-OV-004) — doc 08
 *   ตัวชี้วัด (OV-02): FYP · APE = Σ(เบี้ยงวด × งวดต่อปี) + 10% × เบี้ยครั้งเดียว (OV-06) · POLICY = จำนวนกรมธรรม์
 *   Section ตาม Role (OV-03, BR-OV-001): Executive = A–E · System admin = A–F · Role อื่น = D + F — Section ที่ไม่มีสิทธิ์ไม่ถูกส่งไปหน้าจอ
 *   ยอดขาย = กรมธรรม์สถานะอนุมัติ ตามวันที่ยื่นใบคำขอในช่วงที่เลือก (ไม่รวมยกเลิก Free look — KPI-01)
 */
import { getDb, transaction } from '../db/database.js';
import { AppError } from '../middleware/error-handler.js';
import { workspaceSellers } from './people.service.js';

type DbRow = Record<string, string | number | null>;
export type Metric = 'FYP' | 'APE' | 'POLICY';
type Level = 'CHANNEL' | 'GROUP' | 'SELLER';

/** มูลค่าตามตัวชี้วัดของกรมธรรม์ 1 ฉบับ (SQL) */
const VALUE_SQL: Record<Metric, string> = {
  FYP: 'p.fyp',
  APE: "CASE WHEN p.payment_mode = 'PMM01' THEN p.modal_premium * 0.1 ELSE p.fyp END",
  POLICY: '1',
};

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface DashboardQuery {
  from?: string;
  to?: string;
  channel?: string;
  package?: string;
  productType?: string;
  campaignType?: string;
  metric?: Metric;
}

interface Scope {
  from: string;
  to: string;
  metric: Metric;
  where: string;
  params: (string | number)[];
}

function metricOf(v: unknown): Metric {
  return v === 'APE' || v === 'POLICY' ? v : 'FYP';
}

/** เงื่อนไขกรอง policy_sale (alias p) ตามตัวกรองทั้งหน้า */
function scope(q: DashboardQuery): Scope {
  const today = TODAY();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from ?? '') ? q.from! : `${today.slice(0, 8)}01`;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to ?? '') ? q.to! : today;
  const where = ['p.submitted_date BETWEEN ? AND ?'];
  const params: (string | number)[] = [from, to];
  if (q.channel) (where.push('p.channel_code = ?'), params.push(q.channel));
  if (q.package) (where.push('p.package_code = ?'), params.push(q.package));
  if (q.productType) {
    where.push("EXISTS (SELECT 1 FROM package_plan pl WHERE pl.package_code = p.package_code AND pl.plan_role = 'MASTER' AND pl.product_type_code = ?)");
    params.push(q.productType);
  }
  return { from, to, metric: metricOf(q.metric), where: where.join(' AND '), params };
}

/** เดือน (YYYY-MM) ทั้งหมดที่อยู่ในช่วงวันที่ */
function monthsIn(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.slice(0, 7).split('-').map(Number);
  const [ty, tm] = to.slice(0, 7).split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) (m = 1), y++;
  }
  return out;
}

/** Target ระดับช่องทางรวม ในเดือนที่เลือก (ตัวชี้วัดเดียวกัน) — null = ยังไม่ได้ตั้ง */
function channelTarget(months: string[], metric: Metric, q: DashboardQuery): number | null {
  if (!months.length) return null;
  const where = ["level = 'CHANNEL'", 'metric = ?', `period IN (${months.map(() => '?').join(',')})`];
  const params: (string | number)[] = [metric, ...months];
  if (q.channel) (where.push('channel_code = ?'), params.push(q.channel));
  if (q.package) (where.push('package_code = ?'), params.push(q.package));
  if (q.productType) {
    where.push("EXISTS (SELECT 1 FROM package_plan pl WHERE pl.package_code = sales_target.package_code AND pl.plan_role = 'MASTER' AND pl.product_type_code = ?)");
    params.push(q.productType);
  }
  const r = getDb().prepare(`SELECT COUNT(*) AS n, SUM(value) AS v FROM sales_target WHERE ${where.join(' AND ')}`).get(...params) as { n: number; v: number | null };
  return r.n ? Number(r.v) : null;
}

const pct = (a: number, b: number | null) => (b ? Math.round((a / b) * 1000) / 10 : null);

// ---------------------------------------------------------------- Section ตาม Role
export function sectionsFor(role: string): string[] {
  if (role === 'SYS_ADMIN') return ['A', 'B', 'C', 'D', 'E', 'F'];
  return role === 'EXECUTIVE' ? ['A', 'B', 'C', 'D', 'E'] : ['D', 'F'];
}

export function dashboard(q: DashboardQuery, actor: { userId: string; role: string }) {
  const s = scope(q);
  const sections = sectionsFor(actor.role);
  const out: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    metric: s.metric,
    from: s.from,
    to: s.to,
    sections,
  };
  if (sections.includes('A')) out['kpi'] = kpi(s, q);
  if (sections.includes('B')) {
    out['trend'] = trend(s, q);
    out['byChannel'] = byChannel(s);
  }
  if (sections.includes('C')) out['packages'] = packages(s, q);
  if (sections.includes('D')) out['campaigns'] = campaigns(s, q);
  if (sections.includes('E')) out['sellers'] = sellers(s);
  if (sections.includes('F')) {
    out['tasks'] = tasks(actor);
    out['activity'] = activity();
  }
  return out;
}

// ---------------------------------------------------------------- OV-A KPI
function grantWhere(s: Scope, q: DashboardQuery): { where: string; params: (string | number)[] } {
  const where = ['g.submitted_date BETWEEN ? AND ?'];
  const params: (string | number)[] = [s.from, s.to];
  if (q.channel) (where.push('c.channel_codes LIKE ?'), params.push(`%"${q.channel}"%`));
  if (q.package) (where.push('c.package_codes LIKE ?'), params.push(`%"${q.package}"%`));
  if (q.campaignType) (where.push('c.type_code = ?'), params.push(q.campaignType));
  return { where: where.join(' AND '), params };
}

function kpi(s: Scope, q: DashboardQuery) {
  const db = getDb();
  const v = VALUE_SQL[s.metric];
  const sales = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN p.status = 'APPROVED' THEN ${v} END), 0) AS sales,
              SUM(p.status = 'APPROVED') AS approved,
              SUM(p.status IN ('APPROVED', 'DECLINED', 'FL_CANCELLED')) AS decided,
              COUNT(*) AS applications
         FROM policy_sale p WHERE ${s.where}`,
    )
    .get(...s.params) as { sales: number; approved: number | null; decided: number | null; applications: number };
  const target = channelTarget(monthsIn(s.from, s.to), s.metric, q);

  const gw = grantWhere(s, q);
  const g = db
    .prepare(
      `SELECT SUM(g.status IN ('RESERVED','CONFIRMED','FULFILLED')) AS eligible,
              SUM(g.status IN ('CONFIRMED','FULFILLED')) AS granted,
              COALESCE(SUM(CASE WHEN g.status IN ('CONFIRMED','FULFILLED') THEN g.benefit_value END), 0) AS used,
              COALESCE(SUM(CASE WHEN g.status = 'RESERVED' THEN g.benefit_value END), 0) AS reserved,
              COALESCE(SUM(CASE WHEN g.status IN ('CONFIRMED','FULFILLED') THEN g.fyp END), 0) AS granted_fyp
         FROM campaign_grant g JOIN campaign c ON c.campaign_code = g.campaign_code WHERE ${gw.where}`,
    )
    .get(...gw.params) as { eligible: number | null; granted: number | null; used: number; reserved: number; granted_fyp: number };

  // งบรวมของ Campaign ที่อนุมัติแล้วและมีงบ (KPI-06) — คงเหลือ = งบ − ใช้จริง − จอง (ทั้งอายุ Campaign)
  const cw: string[] = ["c.status IN ('APPROVED','SUSPENDED')", "json_extract(c.campaign_data, '$.budget') IS NOT NULL"];
  const cp: (string | number)[] = [];
  if (q.channel) (cw.push('c.channel_codes LIKE ?'), cp.push(`%"${q.channel}"%`));
  if (q.package) (cw.push('c.package_codes LIKE ?'), cp.push(`%"${q.package}"%`));
  if (q.campaignType) (cw.push('c.type_code = ?'), cp.push(q.campaignType));
  const budget = db
    .prepare(
      `SELECT COALESCE(SUM(json_extract(c.campaign_data, '$.budget')), 0) AS total,
              COALESCE(SUM((SELECT SUM(g.benefit_value) FROM campaign_grant g WHERE g.campaign_code = c.campaign_code AND g.status IN ('RESERVED','CONFIRMED','FULFILLED'))), 0) AS committed
         FROM campaign c WHERE ${cw.join(' AND ')}`,
    )
    .get(...cp) as { total: number; committed: number };

  const granted = Number(g.granted ?? 0);
  return {
    sales: Number(sales.sales),
    target,
    targetPct: pct(Number(sales.sales), target),
    approved: Number(sales.approved ?? 0),
    applications: Number(sales.applications),
    eligible: Number(g.eligible ?? 0),
    approvalRate: sales.decided ? Math.round((Number(sales.approved) / Number(sales.decided)) * 1000) / 10 : null,
    budget: { total: Number(budget.total), used: Number(g.used), reserved: Number(g.reserved), remaining: Math.max(0, Number(budget.total) - Number(budget.committed)) },
    costPerPolicy: granted ? Math.round(Number(g.used) / granted) : null,
    salesPerBudget: Number(g.used) ? Math.round((Number(g.granted_fyp) / Number(g.used)) * 10) / 10 : null,
  };
}

// ---------------------------------------------------------------- OV-B แนวโน้ม + ตามช่องทาง
function trend(s: Scope, q: DashboardQuery) {
  // รายเดือนของปีที่เลือก (ม.ค. → เดือนของวันสิ้นสุด) · ตัวกรองอื่นเหมือนทั้งหน้า
  const year = s.to.slice(0, 4);
  const months = monthsIn(`${year}-01-01`, s.to);
  const where = s.where.replace('p.submitted_date BETWEEN ? AND ?', 'p.submitted_date BETWEEN ? AND ?');
  const params = [`${year}-01-01`, s.to, ...s.params.slice(2)];
  const rows = getDb()
    .prepare(
      `SELECT substr(p.submitted_date, 1, 7) AS m, p.channel_code AS ch, SUM(${VALUE_SQL[s.metric]}) AS v
         FROM policy_sale p WHERE ${where} AND p.status = 'APPROVED' GROUP BY 1, 2`,
    )
    .all(...params) as { m: string; ch: string; v: number }[];
  const channels = [...new Set(rows.map((r) => r.ch))].sort();
  return {
    months,
    actual: months.map((m) => rows.filter((r) => r.m === m).reduce((a, r) => a + Number(r.v), 0)),
    target: months.map((m) => channelTarget([m], s.metric, q)),
    byChannel: channels.map((ch) => ({ channelCode: ch, values: months.map((m) => Number(rows.find((r) => r.m === m && r.ch === ch)?.v ?? 0)) })),
  };
}

function byChannel(s: Scope) {
  return (
    getDb()
      .prepare(
        `SELECT p.channel_code AS ch, m.name_en AS name, SUM(${VALUE_SQL[s.metric]}) AS v, COUNT(*) AS n
           FROM policy_sale p LEFT JOIN synced_master m ON m.master_type = 'CHANNEL' AND m.code = p.channel_code
          WHERE ${s.where} AND p.status = 'APPROVED' GROUP BY 1 ORDER BY v DESC`,
      )
      .all(...s.params) as { ch: string; name: string | null; v: number; n: number }[]
  ).map((r) => ({ channelCode: r.ch, channelName: r.name, value: Number(r.v), policies: Number(r.n) }));
}

// ---------------------------------------------------------------- OV-C ราย Package
function packages(s: Scope, q: DashboardQuery) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.package_code AS pkg, p.channel_code AS ch, k.name_th, k.sale_target, k.sale_start_date,
              SUM(CASE WHEN p.status = 'APPROVED' THEN ${VALUE_SQL[s.metric]} END) AS v,
              SUM(p.status = 'APPROVED') AS n
         FROM policy_sale p JOIN package k ON k.package_code = p.package_code
        WHERE ${s.where} GROUP BY 1, 2 ORDER BY v DESC`,
    )
    .all(...s.params) as DbRow[];
  const life = db.prepare("SELECT COALESCE(SUM(fyp), 0) AS v FROM policy_sale WHERE package_code = ? AND status = 'APPROVED'");
  const activeCampaigns = db.prepare(
    `SELECT COUNT(*) AS n FROM campaign WHERE status = 'APPROVED' AND package_codes LIKE ? AND channel_codes LIKE ?
        AND (start_date IS NULL OR start_date <= date('now','localtime')) AND (end_date IS NULL OR end_date >= date('now','localtime'))
        ${q.campaignType ? 'AND type_code = ?' : ''}`,
  );
  return rows.map((r) => {
    const pkg = String(r['pkg']);
    const ch = String(r['ch']);
    const target = r['sale_target'] === null ? null : Number(r['sale_target']);
    // sale_Target = FYP ตลอดอายุ Package (OV-05) → เทียบได้เฉพาะ FYP · ยอดสะสมตั้งแต่เริ่มขาย
    const lifetime = target !== null && s.metric === 'FYP' ? Number((life.get(pkg) as { v: number }).v) : null;
    const camp = activeCampaigns.get(`%"${pkg}"%`, `%"${ch}"%`, ...(q.campaignType ? [q.campaignType] : [])) as { n: number };
    return {
      packageCode: pkg,
      nameTh: String(r['name_th']),
      channelCode: ch,
      target: s.metric === 'FYP' ? target : null,
      actual: Number(r['v'] ?? 0),
      lifetime,
      targetPct: lifetime !== null ? pct(lifetime, target) : null,
      policies: Number(r['n'] ?? 0),
      activeCampaigns: camp.n,
    };
  });
}

// ---------------------------------------------------------------- OV-D ราย Campaign
function campaigns(s: Scope, q: DashboardQuery) {
  const db = getDb();
  const where = ["c.status IN ('APPROVED','SUSPENDED','PENDING')"];
  const params: (string | number)[] = [];
  if (q.channel) (where.push('c.channel_codes LIKE ?'), params.push(`%"${q.channel}"%`));
  if (q.package) (where.push('c.package_codes LIKE ?'), params.push(`%"${q.package}"%`));
  if (q.campaignType) (where.push('c.type_code = ?'), params.push(q.campaignType));
  const rows = db
    .prepare(
      `SELECT c.*, t.name_en AS type_name,
              CASE c.status WHEN 'APPROVED' THEN CASE WHEN c.start_date > date('now','localtime') THEN 'SCHEDULED'
                   WHEN c.end_date IS NOT NULL AND c.end_date < date('now','localtime') THEN 'EXPIRED' ELSE 'ACTIVE' END
                   ELSE c.status END AS display_status
         FROM campaign c LEFT JOIN custom_master_item t ON t.type_code = 'MS-01' AND t.item_code = c.type_code
        WHERE ${where.join(' AND ')} ORDER BY display_status = 'ACTIVE' DESC, c.end_date IS NULL, c.end_date`,
    )
    .all(...params) as DbRow[];
  const stat = db.prepare(
    `SELECT status, COUNT(*) AS n, SUM(benefit_value) AS v FROM campaign_grant
      WHERE campaign_code = ? AND submitted_date BETWEEN ? AND ? GROUP BY status`,
  );
  const lifeUsed = db.prepare(
    `SELECT SUM(CASE WHEN status IN ('CONFIRMED','FULFILLED') THEN benefit_value END) AS used,
            SUM(status IN ('CONFIRMED','FULFILLED')) AS n FROM campaign_grant WHERE campaign_code = ?`,
  );
  const ref = db.prepare('SELECT SUM(clicks) AS c, SUM(applications) AS a, SUM(approved) AS p FROM referral_link WHERE campaign_code = ?');
  return rows.map((r) => {
    const code = String(r['campaign_code']);
    const data = JSON.parse(String(r['campaign_data'] ?? '{}')) as { budget?: number | null; quotaTotal?: number | null };
    const st: Record<string, number> = { RESERVED: 0, CONFIRMED: 0, FULFILLED: 0, RELEASED: 0, CLAWED_BACK: 0, NOT_GRANTED: 0 };
    for (const x of stat.all(code, s.from, s.to) as { status: string; n: number }[]) st[x.status] = Number(x.n);
    const life = lifeUsed.get(code) as { used: number | null; n: number | null };
    const isRef = r['type_code'] === 'REFERRAL';
    const rf = isRef ? (ref.get(code) as { c: number | null; a: number | null; p: number | null }) : null;
    return {
      campaignCode: code,
      nameTh: String(r['name_th']),
      typeCode: String(r['type_code']),
      typeName: r['type_name'] as string | null,
      displayStatus: String(r['display_status']),
      endDate: r['end_date'] as string | null,
      stats: st,
      budget: data.budget ?? null,
      budgetUsed: Number(life.used ?? 0),
      budgetPct: data.budget ? pct(Number(life.used ?? 0), data.budget) : null,
      quotaTotal: data.quotaTotal ?? null,
      quotaUsed: Number(life.n ?? 0),
      quotaPct: data.quotaTotal ? pct(Number(life.n ?? 0), data.quotaTotal) : null,
      referral: rf ? { clicks: Number(rf.c ?? 0), applications: Number(rf.a ?? 0), approved: Number(rf.p ?? 0) } : null,
    };
  });
}

// ---------------------------------------------------------------- OV-E กลุ่ม / ผู้ขาย
function sellers(s: Scope) {
  const db = getDb();
  const v = VALUE_SQL[s.metric];
  const top = db
    .prepare(
      `SELECT p.seller_code, se.seller_name, se.seller_type, g.group_name, g.color,
              SUM(${v}) AS v, COUNT(*) AS n
         FROM policy_sale p
         LEFT JOIN seller se ON se.seller_code = p.seller_code
         LEFT JOIN group_member m ON m.package_code = p.package_code AND m.channel_code = p.channel_code AND m.seller_code = p.seller_code
         LEFT JOIN seller_group g ON g.group_id = m.group_id AND g.is_deleted = 0
        WHERE ${s.where} AND p.status = 'APPROVED' AND p.seller_code IS NOT NULL
        GROUP BY p.seller_code ORDER BY v DESC LIMIT 10`,
    )
    .all(...s.params) as DbRow[];
  const months = monthsIn(s.from, s.to);
  const groups = db
    .prepare(
      `SELECT g.group_id, g.group_name, g.color, g.package_code, g.channel_code,
              (SELECT COUNT(*) FROM group_member m WHERE m.group_id = g.group_id) AS members
         FROM seller_group g WHERE g.is_deleted = 0 ORDER BY g.package_code, g.group_id`,
    )
    .all() as DbRow[];
  const actual = db.prepare(
    `SELECT COALESCE(SUM(${v}), 0) AS v, COUNT(*) AS n FROM policy_sale p
      JOIN group_member m ON m.package_code = p.package_code AND m.channel_code = p.channel_code AND m.seller_code = p.seller_code
     WHERE m.group_id = ? AND p.status = 'APPROVED' AND ${s.where}`,
  );
  const target = db.prepare(
    `SELECT COUNT(*) AS c, SUM(value) AS v FROM sales_target WHERE level = 'GROUP' AND ref_id = ? AND metric = ?
        AND period IN (${months.map(() => '?').join(',') || "''"})`,
  );
  const referral = db.prepare(
    `SELECT SUM(l.clicks) AS c, SUM(l.applications) AS a, SUM(l.approved) AS p FROM referral_link l
      JOIN group_member m ON m.seller_code = l.seller_code AND m.group_id = ?
      JOIN group_campaign gc ON gc.group_id = m.group_id AND gc.campaign_code = l.campaign_code`,
  );
  return {
    top: top.map((r, i) => ({
      rank: i + 1,
      sellerCode: String(r['seller_code']),
      sellerName: (r['seller_name'] as string | null) ?? String(r['seller_code']),
      sellerType: r['seller_type'] as string | null,
      groupName: r['group_name'] as string | null,
      groupColor: r['color'] as string | null,
      value: Number(r['v']),
      policies: Number(r['n']),
    })),
    groups: groups.map((g) => {
      const id = Number(g['group_id']);
      const a = actual.get(id, ...s.params) as { v: number; n: number };
      const t = target.get(String(id), s.metric, ...months) as { c: number; v: number | null };
      const rf = referral.get(id) as { c: number | null; a: number | null; p: number | null };
      const tv = t.c ? Number(t.v) : null;
      return {
        groupId: id,
        groupName: String(g['group_name']),
        color: String(g['color']),
        workspace: `${g['package_code']} × ${g['channel_code']}`,
        members: Number(g['members']),
        target: tv,
        actual: Number(a.v),
        targetPct: pct(Number(a.v), tv),
        policies: Number(a.n),
        referral: rf.c ? { clicks: Number(rf.c), applications: Number(rf.a ?? 0), approved: Number(rf.p ?? 0) } : null,
      };
    }),
  };
}

// ---------------------------------------------------------------- OV-F งานที่ต้องทำ & ความเคลื่อนไหว
interface Task {
  key: string;
  label: string;
  count: number;
  link: string;
  query?: Record<string, string>;
  detail?: string;
}

function tasks(actor: { userId: string; role: string }): Task[] {
  const db = getDb();
  const n = (sql: string, ...p: (string | number)[]) => Number((db.prepare(sql).get(...p) as { n: number }).n);
  const first = (sql: string, ...p: (string | number)[]) => (db.prepare(sql).get(...p) as { c: string } | undefined)?.c;
  const out: Task[] = [];
  const role = actor.role;
  const all = role === 'SYS_ADMIN';

  if (all || role === 'CONTENT_APPROVER') {
    const c = n("SELECT COUNT(*) AS n FROM content WHERE status = 'PENDING'");
    out.push({ key: 'content-pending', label: 'Content รออนุมัติ', count: c, link: '/package/add', query: { status: 'PENDING' }, detail: first("SELECT content_code AS c FROM content WHERE status = 'PENDING' ORDER BY updated_at") });
  }
  if (all || role === 'CONTENT_MAKER') {
    out.push({ key: 'content-rejected', label: 'Content ถูกตีกลับ (ของฉัน)', count: n("SELECT COUNT(*) AS n FROM content WHERE status = 'REJECTED' AND created_by = ?", actor.userId), link: '/package/add', query: { status: 'DRAFT' } });
    out.push({ key: 'content-draft', label: 'Content Draft ของฉัน', count: n("SELECT COUNT(*) AS n FROM content WHERE status = 'DRAFT' AND created_by = ?", actor.userId), link: '/package/add', query: { status: 'DRAFT' } });
  }
  if (all || role === 'CAMPAIGN_APPROVER') {
    out.push({ key: 'campaign-pending', label: 'Campaign รออนุมัติ', count: n("SELECT COUNT(*) AS n FROM campaign WHERE status = 'PENDING'"), link: '/campaign/list', query: { status: 'PENDING' }, detail: first("SELECT campaign_code AS c FROM campaign WHERE status = 'PENDING' ORDER BY updated_at") });
  }
  if (all || role === 'CAMPAIGN_MAKER' || role === 'CAMPAIGN_APPROVER') {
    if (role !== 'CAMPAIGN_APPROVER') out.push({ key: 'campaign-rejected', label: 'Campaign ถูกตีกลับ (ของฉัน)', count: n("SELECT COUNT(*) AS n FROM campaign WHERE status = 'REJECTED' AND created_by = ?", actor.userId), link: '/campaign/list', query: { status: 'DRAFT' } });
    const expiring = n(
      "SELECT COUNT(*) AS n FROM campaign WHERE status = 'APPROVED' AND end_date BETWEEN date('now','localtime') AND date('now','localtime','+7 day')",
    );
    const quota = (
      db
        .prepare(
          `SELECT c.campaign_code, json_extract(c.campaign_data, '$.quotaTotal') AS q,
                  (SELECT COUNT(*) FROM campaign_grant g WHERE g.campaign_code = c.campaign_code AND g.status IN ('RESERVED','CONFIRMED','FULFILLED')) AS u
             FROM campaign c WHERE c.status = 'APPROVED' AND json_extract(c.campaign_data, '$.quotaTotal') > 0`,
        )
        .all() as { campaign_code: string; q: number; u: number }[]
    ).filter((r) => r.u / r.q >= 0.8);
    out.push({
      key: 'campaign-expiring',
      label: 'Campaign หมดอายุใน 7 วัน / โควตา ≥ 80%',
      count: expiring + quota.length,
      link: '/campaign/list',
      query: { status: 'EXPIRING' },
      detail: quota.map((r) => r.campaign_code).join(', ') || undefined,
    });
  }
  if (all || role === 'PEOPLE_ADMIN' || role === 'CAMPAIGN_MAKER') {
    out.push({
      key: 'license',
      label: 'ผู้ขายใบอนุญาตหมดใน 30 วัน (อยู่ในกลุ่ม)',
      count: n(
        `SELECT COUNT(DISTINCT s.seller_code) AS n FROM seller s JOIN group_member m ON m.seller_code = s.seller_code
          WHERE s.seller_type = 'AGENT' AND s.status = 'ACTIVE' AND s.license_expiry BETWEEN date('now','localtime') AND date('now','localtime','+30 day')`,
      ),
      link: '/seller/workspace',
    });
    // ผู้ขายยังไม่มีกลุ่ม — Workspace ที่มีกลุ่มแล้วแต่ยังมีคนตกค้างมากที่สุด
    const ws = db.prepare('SELECT DISTINCT package_code, channel_code FROM seller_group WHERE is_deleted = 0').all() as { package_code: string; channel_code: string }[];
    let worst: { pkg: string; ch: string; n: number } | null = null;
    for (const w of ws) {
      const mode = (db.prepare('SELECT COALESCE(pc.seller_selection_mode, p.seller_selection_mode) AS m FROM package p LEFT JOIN package_channel pc ON pc.package_code = p.package_code AND pc.channel_code = ? WHERE p.package_code = ?').get(w.channel_code, w.package_code) as { m: string } | undefined)?.m ?? 'ALL';
      const left = workspaceSellers(w.package_code, w.channel_code, mode).filter((x) => x.groupId === null && x.ready).length;
      if (!worst || left > worst.n) worst = { pkg: w.package_code, ch: w.channel_code, n: left };
    }
    if (worst)
      out.push({ key: 'ungrouped', label: `ผู้ขายยังไม่มีกลุ่ม (${worst.pkg} × ${worst.ch})`, count: worst.n, link: `/seller/workspace/${worst.pkg}/${worst.ch}` });
  }
  return out;
}

function activity() {
  return (
    getDb()
      .prepare(
        `SELECT * FROM (
           SELECT l.created_at AS at, l.object_type AS kind, l.object_code AS code, l.action, l.reason AS detail, u.user_name AS actor
             FROM approval_log l LEFT JOIN app_user u ON u.user_id = l.actor_id
           UNION ALL
           SELECT l.created_at, 'SELLER', COALESCE(l.group_name, l.package_code || ' × ' || l.channel_code), l.action, l.detail, COALESCE(u.user_name, 'ระบบ')
             FROM people_audit_log l LEFT JOIN app_user u ON u.user_id = l.actor_id
         ) ORDER BY at DESC LIMIT 8`,
      )
      .all() as DbRow[]
  ).map((r) => ({
    at: String(r['at']),
    kind: String(r['kind']),
    code: String(r['code']),
    action: String(r['action']),
    detail: r['detail'] as string | null,
    actor: (r['actor'] as string | null) ?? '–',
  }));
}

// ---------------------------------------------------------------- ตัวเลือกตัวกรอง
export function options() {
  const db = getDb();
  const packages = db
    .prepare(
      `SELECT p.package_code, p.name_th, p.sale_target, p.sale_start_date, p.sale_end_date,
              (SELECT group_concat(channel_code) FROM package_channel c WHERE c.package_code = p.package_code) AS channels,
              (SELECT product_type_code FROM package_plan pl WHERE pl.package_code = p.package_code AND pl.plan_role = 'MASTER' LIMIT 1) AS product_type
         FROM package p WHERE p.is_active = 1 ORDER BY p.package_code`,
    )
    .all() as DbRow[];
  return {
    packages: packages.map((p) => ({
      packageCode: String(p['package_code']),
      nameTh: String(p['name_th']),
      saleTarget: p['sale_target'] === null ? null : Number(p['sale_target']),
      channels: String(p['channels'] ?? '').split(',').filter(Boolean),
      productType: p['product_type'] as string | null,
    })),
    channels: (db.prepare("SELECT code, name_en FROM synced_master WHERE master_type = 'CHANNEL' AND is_active = 1 AND name_en IS NOT NULL ORDER BY code").all() as DbRow[]).map((r) => ({
      code: String(r['code']),
      name: r['name_en'] as string,
    })),
    productTypes: (db.prepare("SELECT code, name_th FROM synced_master WHERE master_type = 'PRODUCT_TYPE' ORDER BY code").all() as DbRow[]).map((r) => ({
      code: String(r['code']),
      name: String(r['name_th']),
    })),
    campaignTypes: (db.prepare("SELECT item_code, name_en, name_th FROM custom_master_item WHERE type_code = 'MS-01' AND is_active = 1 ORDER BY sort_order").all() as DbRow[]).map((r) => ({
      code: String(r['item_code']),
      name: String(r['name_en'] ?? r['name_th']),
    })),
  };
}

// ---------------------------------------------------------------- ตั้ง Target (BR-OV-004)
export interface TargetQuery {
  level?: Level;
  pkg?: string;
  ch?: string;
  metric?: Metric;
  from?: string; // YYYY-MM
  to?: string;
}

function levelOf(v: unknown): Level {
  return v === 'GROUP' || v === 'SELLER' ? v : 'CHANNEL';
}

function periods(from?: string, to?: string): string[] {
  const f = /^\d{4}-\d{2}$/.test(from ?? '') ? from! : TODAY().slice(0, 7);
  const t = /^\d{4}-\d{2}$/.test(to ?? '') ? to! : f;
  const list = monthsIn(`${f}-01`, `${t}-01`);
  if (!list.length || list.length > 24) throw new AppError(422, 'ช่วงเดือนไม่ถูกต้อง (เลือกได้ไม่เกิน 24 เดือน)', 'INVALID');
  return list;
}

/** แถวที่ตั้ง Target ได้ตามระดับ */
function targetRows(level: Level, pkg: string, ch: string): { refId: string; name: string; sub?: string }[] {
  const db = getDb();
  if (level === 'CHANNEL') {
    const name = (db.prepare("SELECT name_en FROM synced_master WHERE master_type = 'CHANNEL' AND code = ?").get(ch) as { name_en: string } | undefined)?.name_en;
    return [{ refId: ch, name: `${ch} ${name ?? ''}`.trim() }];
  }
  if (level === 'GROUP')
    return (db.prepare('SELECT group_id, group_name FROM seller_group WHERE package_code = ? AND channel_code = ? AND is_deleted = 0 ORDER BY group_id').all(pkg, ch) as DbRow[]).map((g) => ({
      refId: String(g['group_id']),
      name: String(g['group_name']),
    }));
  const mode = (db.prepare('SELECT COALESCE(pc.seller_selection_mode, p.seller_selection_mode) AS m FROM package p LEFT JOIN package_channel pc ON pc.package_code = p.package_code AND pc.channel_code = ? WHERE p.package_code = ?').get(ch, pkg) as { m: string } | undefined)?.m ?? 'ALL';
  const groups = new Map((db.prepare('SELECT group_id, group_name FROM seller_group WHERE package_code = ? AND channel_code = ?').all(pkg, ch) as DbRow[]).map((g) => [Number(g['group_id']), String(g['group_name'])]));
  return workspaceSellers(pkg, ch, mode)
    .filter((s) => s.ready || s.groupId !== null)
    .map((s) => ({ refId: s.sellerCode, name: `${s.sellerCode} · ${s.sellerName}`, sub: s.groupId ? groups.get(s.groupId) : 'ยังไม่มีกลุ่ม' }));
}

export function getTargets(q: TargetQuery) {
  const level = levelOf(q.level);
  const metric = metricOf(q.metric);
  const pkg = q.pkg ?? '';
  const ch = q.ch ?? '';
  if (!pkg || !ch) throw new AppError(422, 'กรุณาเลือก Package และ Channel', 'REQUIRED');
  const pk = getDb().prepare('SELECT package_code, name_th, sale_target FROM package WHERE package_code = ?').get(pkg) as DbRow | undefined;
  if (!pk) throw new AppError(404, `ไม่พบ Package ${pkg}`, 'NOT_FOUND');
  const list = periods(q.from, q.to);
  const values = getDb()
    .prepare(
      `SELECT ref_id, period, value FROM sales_target WHERE level = ? AND package_code = ? AND channel_code = ? AND metric = ?
          AND period IN (${list.map(() => '?').join(',')})`,
    )
    .all(level, pkg, ch, metric, ...list) as { ref_id: string; period: string; value: number }[];
  const rows = targetRows(level, pkg, ch).map((r) => ({
    ...r,
    values: Object.fromEntries(list.map((p) => [p, values.find((v) => v.ref_id === r.refId && v.period === p)?.value ?? null])) as Record<string, number | null>,
  }));
  // Target ระดับที่ใหญ่กว่า (ใช้เตือนผลรวมเกิน — ไม่บล็อก)
  const channelSum = level === 'CHANNEL' ? null : channelTarget(list, metric, { package: pkg, channel: ch });
  return {
    level,
    metric,
    packageCode: pkg,
    packageName: String(pk['name_th']),
    channelCode: ch,
    saleTarget: pk['sale_target'] === null ? null : Number(pk['sale_target']),
    periods: list,
    rows,
    parentTarget: channelSum,
    warnings: targetWarnings(level, metric, pkg, ch, list, pk['sale_target'] === null ? null : Number(pk['sale_target'])),
  };
}

/** BR-OV-004: ผลรวม FYP ระดับล่างเกิน Target ระดับบน → เตือน (ไม่บล็อก) */
function targetWarnings(level: Level, metric: Metric, pkg: string, ch: string, list: string[], saleTarget: number | null): string[] {
  const db = getDb();
  const out: string[] = [];
  const sum = (lv: Level) =>
    Number(
      (db
        .prepare(`SELECT COALESCE(SUM(value), 0) AS v FROM sales_target WHERE level = ? AND package_code = ? AND metric = ? ${lv === 'CHANNEL' ? '' : 'AND channel_code = ?'}`)
        .get(...(lv === 'CHANNEL' ? [lv, pkg, metric] : [lv, pkg, metric, ch])) as { v: number }).v,
    );
  if (metric === 'FYP' && saleTarget !== null && sum('CHANNEL') > saleTarget)
    out.push(`ผลรวม Target ระดับช่องทางของ ${pkg} (${sum('CHANNEL').toLocaleString('en-US')}) เกิน sale_Target ของ Package (${saleTarget.toLocaleString('en-US')})`);
  if (level !== 'CHANNEL') {
    for (const p of list) {
      const parent = channelTarget([p], metric, { package: pkg, channel: ch });
      const child = Number(
        (db.prepare('SELECT COALESCE(SUM(value), 0) AS v FROM sales_target WHERE level = ? AND package_code = ? AND channel_code = ? AND metric = ? AND period = ?').get(level, pkg, ch, metric, p) as {
          v: number;
        }).v,
      );
      if (parent !== null && child > parent) out.push(`${p}: ผลรวม Target ระดับ${level === 'GROUP' ? 'กลุ่ม' : 'ผู้ขาย'} (${child.toLocaleString('en-US')}) เกิน Target ช่องทาง (${parent.toLocaleString('en-US')})`);
    }
  }
  return out;
}

export function saveTargets(
  body: { level?: Level; pkg?: string; ch?: string; metric?: Metric; values?: { refId: string; period: string; value: number | null }[] },
  actor: string,
) {
  const level = levelOf(body.level);
  const metric = metricOf(body.metric);
  const pkg = body.pkg ?? '';
  const ch = body.ch ?? '';
  if (!pkg || !ch) throw new AppError(422, 'กรุณาเลือก Package และ Channel', 'REQUIRED');
  const allowed = new Set(targetRows(level, pkg, ch).map((r) => r.refId));
  const list = Array.isArray(body.values) ? body.values : [];
  let saved = 0;
  transaction((db) => {
    const up = db.prepare(
      `INSERT INTO sales_target (level, ref_id, package_code, channel_code, metric, period, value, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (level, ref_id, package_code, channel_code, metric, period) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now','localtime')`,
    );
    const del = db.prepare('DELETE FROM sales_target WHERE level = ? AND ref_id = ? AND package_code = ? AND channel_code = ? AND metric = ? AND period = ?');
    for (const v of list) {
      if (!allowed.has(String(v.refId))) continue;
      if (!/^\d{4}-\d{2}$/.test(v.period)) throw new AppError(422, `เดือนไม่ถูกต้อง: ${v.period}`, 'INVALID');
      if (v.value === null || v.value === undefined || (v.value as unknown) === '') {
        del.run(level, String(v.refId), pkg, ch, metric, v.period);
        continue;
      }
      const num = Number(v.value);
      if (!Number.isFinite(num) || num < 0) throw new AppError(422, 'Target ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป', 'INVALID');
      if (metric === 'POLICY' && !Number.isInteger(num)) throw new AppError(422, 'Target จำนวนกรมธรรม์ต้องเป็นจำนวนเต็ม', 'INVALID');
      up.run(level, String(v.refId), pkg, ch, metric, v.period, num, actor);
      saved++;
    }
  });
  const periodsSaved = [...new Set(list.map((v) => v.period))].sort();
  return { saved, ...getTargets({ level, pkg, ch, metric, from: periodsSaved[0], to: periodsSaved[periodsSaved.length - 1] }) };
}
