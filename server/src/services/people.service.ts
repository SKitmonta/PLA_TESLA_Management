/**
 * Seller (เดิม People management) — doc 07
 *   P-01 Workspace list · P-02 Board จัดกลุ่ม (Drag & Drop) · P-03 รายละเอียดกลุ่ม & ผูก Campaign
 *   P-04 Referral links · P-05 เครื่องมือ (คัดลอกกลุ่ม / Import / Export / Audit log)
 * Workspace = Package × Channel ที่มี Content Approved (PM-03) · 1 คนอยู่ได้ 1 กลุ่มต่อ Workspace (D-05)
 * พร้อมขาย = Active และ (ตัวแทน: ใบอนุญาตยังไม่หมดอายุ / พนักงาน: ไม่ต้องมีใบอนุญาต) — PM-02, PM-06
 */
import { getDb, transaction } from '../db/database.js';
import { referralToken } from '../db/seed/people.seed.js';
import { AppError } from '../middleware/error-handler.js';

type DbRow = Record<string, string | number | null>;
type Source = 'UI' | 'IMPORT' | 'COPY' | 'SYNC';

const TODAY = "date('now', 'localtime')";

/** Package × Channel ที่มี Content Approved (หรือมี Version ที่อนุมัติแล้ว) และ Package ยังเปิดใช้งาน */
const WORKSPACE_SQL = `
  SELECT DISTINCT c.package_code, c.channel_code, p.name_th, COALESCE(pc.seller_selection_mode, p.seller_selection_mode) AS mode,
         ch.name_en AS channel_name
    FROM content c
    JOIN package p ON p.package_code = c.package_code AND p.is_active = 1
    LEFT JOIN package_channel pc ON pc.package_code = c.package_code AND pc.channel_code = c.channel_code
    LEFT JOIN synced_master ch ON ch.master_type = 'CHANNEL' AND ch.code = c.channel_code
   WHERE c.status <> 'INACTIVE'
     AND (c.status = 'APPROVED' OR EXISTS (SELECT 1 FROM content_version v WHERE v.content_code = c.content_code))`;

export interface SellerView {
  sellerCode: string;
  sellerName: string;
  sellerType: 'AGENT' | 'EMPLOYEE';
  branch: string | null;
  team: string | null;
  level: string | null;
  licenseNo: string | null;
  licenseExpiry: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  phone: string | null;
  email: string | null;
  ready: boolean;
  /** เหตุผลที่ไม่พร้อมขาย / คำเตือน */
  reason: string | null;
  licenseWarning: boolean;
  groupId: number | null;
}

// ---------------------------------------------------------------- helpers
function mask(v: string | null, keep = 3): string | null {
  if (!v) return v;
  if (v.includes('@')) {
    const [u, d] = v.split('@');
    return `${u.slice(0, 2)}•••@${d}`;
  }
  return `${v.slice(0, keep)}•••${v.slice(-2)}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sellerView(r: DbRow): SellerView {
  const type = String(r['seller_type']) as SellerView['sellerType'];
  const status = String(r['status']) as SellerView['status'];
  const expiry = r['license_expiry'] as string | null;
  let reason: string | null = null;
  if (status === 'SUSPENDED') reason = 'พักงาน';
  else if (status === 'TERMINATED') reason = 'สิ้นสุดสัญญา';
  else if (type === 'AGENT' && (!expiry || expiry < today())) reason = 'ใบอนุญาตหมดอายุ';
  const licenseWarning = !reason && type === 'AGENT' && !!expiry && expiry <= plusDays(30);
  return {
    sellerCode: String(r['seller_code']),
    sellerName: String(r['seller_name'] ?? ''),
    sellerType: type,
    branch: r['branch'] as string | null,
    team: r['team'] as string | null,
    level: r['level'] as string | null,
    licenseNo: r['license_no'] as string | null,
    licenseExpiry: expiry,
    status,
    phone: mask(r['phone'] as string | null),
    email: mask(r['email'] as string | null),
    ready: !reason,
    reason,
    licenseWarning,
    groupId: (r['group_id'] as number | null) ?? null,
  };
}

function workspaceRow(pkg: string, ch: string): DbRow {
  const ws = getDb().prepare(`${WORKSPACE_SQL} AND c.package_code = ? AND c.channel_code = ?`).get(pkg, ch) as DbRow | undefined;
  if (!ws) throw new AppError(404, `ไม่พบ Workspace ${pkg} × ${ch} (ต้องมี Content Approved)`, 'NOT_FOUND');
  return ws;
}

/** รายชื่อผู้ขายของ Workspace ตาม Selection mode (PM-05) + กลุ่มปัจจุบัน */
export function workspaceSellers(pkg: string, ch: string, mode: string): SellerView[] {
  const db = getDb();
  const rows =
    mode === 'CUSTOM'
      ? (db
          .prepare(
            `SELECT COALESCE(s.seller_code, ps.seller_code) AS seller_code, COALESCE(s.seller_name, ps.seller_name) AS seller_name,
                    COALESCE(s.seller_type, 'AGENT') AS seller_type, s.branch, s.team, s.level, s.license_no, s.license_expiry,
                    COALESCE(s.status, 'ACTIVE') AS status, s.phone, s.email, m.group_id
               FROM package_seller ps
               LEFT JOIN seller s ON s.seller_code = ps.seller_code
               LEFT JOIN group_member m ON m.package_code = ps.package_code AND m.channel_code = ps.channel_code AND m.seller_code = ps.seller_code
              WHERE ps.package_code = ? AND ps.channel_code = ?
              ORDER BY 1`,
          )
          .all(pkg, ch) as DbRow[])
      : (db
          .prepare(
            `SELECT s.*, m.group_id FROM seller s
               LEFT JOIN group_member m ON m.package_code = ? AND m.channel_code = ? AND m.seller_code = s.seller_code
              WHERE s.channel_codes LIKE ?
              ORDER BY s.seller_code`,
          )
          .all(pkg, ch, `%"${ch}"%`) as DbRow[]);
  return rows.map(sellerView);
}

function groupsOf(pkg: string, ch: string): DbRow[] {
  return getDb()
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM group_member m WHERE m.group_id = g.group_id) AS member_count
         FROM seller_group g WHERE g.package_code = ? AND g.channel_code = ? AND g.is_deleted = 0
        ORDER BY g.group_id`,
    )
    .all(pkg, ch) as DbRow[];
}

function boundCampaigns(groupId: number) {
  return (
    getDb()
      .prepare(
        `SELECT c.campaign_code, c.name_th, c.type_code, c.status, c.start_date, c.end_date, gc.bound_at, u.user_name AS bound_by_name,
                t.name_en AS type_name
           FROM group_campaign gc
           JOIN campaign c ON c.campaign_code = gc.campaign_code
           LEFT JOIN custom_master_item t ON t.type_code = 'MS-01' AND t.item_code = c.type_code
           LEFT JOIN app_user u ON u.user_id = gc.bound_by
          WHERE gc.group_id = ? ORDER BY gc.bound_at`,
      )
      .all(groupId) as DbRow[]
  ).map((r) => ({
    campaignCode: String(r['campaign_code']),
    nameTh: String(r['name_th']),
    typeCode: String(r['type_code']),
    typeName: r['type_name'] as string | null,
    status: String(r['status']),
    startDate: r['start_date'] as string | null,
    endDate: r['end_date'] as string | null,
    boundAt: String(r['bound_at']),
    boundByName: r['bound_by_name'] as string | null,
  }));
}

function log(
  action: string,
  pkg: string,
  ch: string,
  actor: string | null,
  extra: { groupId?: number | null; groupName?: string | null; seller?: string | null; campaign?: string | null; detail?: string; source?: Source } = {},
): void {
  getDb()
    .prepare(
      `INSERT INTO people_audit_log (action, package_code, channel_code, group_id, group_name, seller_code, campaign_code, detail, actor_id, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(action, pkg, ch, extra.groupId ?? null, extra.groupName ?? null, extra.seller ?? null, extra.campaign ?? null, extra.detail ?? null, actor, extra.source ?? 'UI');
}

function getGroupRow(id: number): DbRow {
  const g = getDb().prepare('SELECT * FROM seller_group WHERE group_id = ? AND is_deleted = 0').get(id) as DbRow | undefined;
  if (!g) throw new AppError(404, 'ไม่พบกลุ่ม (อาจถูกลบแล้ว)', 'NOT_FOUND');
  return g;
}

function touch(id: number, actor: string): void {
  getDb().prepare("UPDATE seller_group SET updated_by = ?, updated_at = datetime('now', 'localtime') WHERE group_id = ?").run(actor, id);
}

// ---------------------------------------------------------------- P-01 Workspace list
export interface WorkspaceQuery {
  search?: string;
  channel?: string;
  mode?: string;
}

export function listWorkspaces(q: WorkspaceQuery) {
  const db = getDb();
  const rows = db.prepare(`${WORKSPACE_SQL} ORDER BY c.package_code, c.channel_code`).all() as DbRow[];
  const s = (q.search ?? '').trim().toLowerCase();
  return rows
    .filter((r) => !s || String(r['package_code']).toLowerCase().includes(s) || String(r['name_th']).toLowerCase().includes(s))
    .filter((r) => !q.channel || r['channel_code'] === q.channel)
    .filter((r) => !q.mode || r['mode'] === q.mode)
    .map((r) => {
      const pkg = String(r['package_code']);
      const ch = String(r['channel_code']);
      const sellers = workspaceSellers(pkg, ch, String(r['mode']));
      const groups = groupsOf(pkg, ch);
      const campaigns = db
        .prepare(
          `SELECT COUNT(DISTINCT gc.campaign_code) AS n FROM group_campaign gc JOIN seller_group g ON g.group_id = gc.group_id
            WHERE g.package_code = ? AND g.channel_code = ? AND g.is_deleted = 0`,
        )
        .get(pkg, ch) as { n: number };
      const last = db
        .prepare('SELECT MAX(created_at) AS t FROM people_audit_log WHERE package_code = ? AND channel_code = ?')
        .get(pkg, ch) as { t: string | null };
      return {
        packageCode: pkg,
        nameTh: String(r['name_th']),
        channelCode: ch,
        channelName: r['channel_name'] as string | null,
        mode: String(r['mode']) as 'ALL' | 'CUSTOM',
        sellerCount: sellers.length,
        groupCount: groups.length,
        ungrouped: sellers.filter((x) => x.groupId === null).length,
        notReady: sellers.filter((x) => !x.ready).length,
        campaignCount: campaigns.n,
        updatedAt: last.t,
      };
    });
}

// ---------------------------------------------------------------- P-02 Board
export function getBoard(pkg: string, ch: string) {
  const ws = workspaceRow(pkg, ch);
  const sellers = workspaceSellers(pkg, ch, String(ws['mode']));
  const groups = groupsOf(pkg, ch).map((g) => {
    const id = Number(g['group_id']);
    return {
      groupId: id,
      groupName: String(g['group_name']),
      description: g['description'] as string | null,
      color: String(g['color']),
      memberCount: Number(g['member_count']),
      notReadyCount: sellers.filter((s) => s.groupId === id && !s.ready).length,
      campaigns: boundCampaigns(id).map((c) => ({ campaignCode: c.campaignCode, nameTh: c.nameTh, typeCode: c.typeCode })),
      updatedAt: String(g['updated_at']),
    };
  });
  return {
    workspace: {
      packageCode: pkg,
      nameTh: String(ws['name_th']),
      channelCode: ch,
      channelName: ws['channel_name'] as string | null,
      mode: String(ws['mode']),
    },
    groups,
    sellers,
  };
}

// ---------------------------------------------------------------- กลุ่ม (BR-PM-003)
export interface GroupInput {
  groupName?: string;
  description?: string | null;
  color?: string;
}

function cleanName(pkg: string, ch: string, raw: unknown, exclude?: number): string {
  const name = String(raw ?? '').trim();
  if (!name) throw new AppError(422, 'กรุณากรอกชื่อกลุ่ม', 'REQUIRED');
  if (name.length > 100) throw new AppError(422, 'ชื่อกลุ่มยาวได้ไม่เกิน 100 ตัวอักษร', 'TOO_LONG');
  const dup = getDb()
    .prepare('SELECT group_id FROM seller_group WHERE package_code = ? AND channel_code = ? AND is_deleted = 0 AND group_name = ? AND group_id <> ?')
    .get(pkg, ch, name, exclude ?? -1);
  if (dup) throw new AppError(409, `ชื่อกลุ่ม "${name}" มีอยู่แล้วใน Workspace นี้`, 'DUPLICATE');
  return name;
}

const COLOR = /^#[0-9a-f]{6}$/i;

export function createGroup(pkg: string, ch: string, input: GroupInput, actor: string) {
  workspaceRow(pkg, ch);
  const name = cleanName(pkg, ch, input.groupName);
  const color = input.color && COLOR.test(input.color) ? input.color : '#2854a7';
  const id = Number(
    getDb()
      .prepare('INSERT INTO seller_group (package_code, channel_code, group_name, description, color, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(pkg, ch, name, input.description?.trim() || null, color, actor, actor).lastInsertRowid,
  );
  log('CREATE_GROUP', pkg, ch, actor, { groupId: id, groupName: name, detail: `สร้างกลุ่ม "${name}"` });
  return getGroup(id);
}

export function updateGroup(id: number, input: GroupInput, actor: string) {
  const g = getGroupRow(id);
  const pkg = String(g['package_code']);
  const ch = String(g['channel_code']);
  const name = cleanName(pkg, ch, input.groupName, id);
  const color = input.color && COLOR.test(input.color) ? input.color : String(g['color']);
  const desc = input.description?.trim() || null;
  const changes: string[] = [];
  if (name !== g['group_name']) changes.push(`ชื่อ "${g['group_name']}" → "${name}"`);
  if (desc !== (g['description'] ?? null)) changes.push('คำอธิบาย');
  if (color !== g['color']) changes.push(`สี ${g['color']} → ${color}`);
  getDb()
    .prepare("UPDATE seller_group SET group_name = ?, description = ?, color = ?, updated_by = ?, updated_at = datetime('now', 'localtime') WHERE group_id = ?")
    .run(name, desc, color, actor, id);
  if (changes.length) log('UPDATE_GROUP', pkg, ch, actor, { groupId: id, groupName: name, detail: `แก้ไข ${changes.join(', ')}` });
  return getGroup(id);
}

/** ลบกลุ่ม → สมาชิกกลับเป็น "ยังไม่มีกลุ่ม", ถอด Campaign ทันที, เก็บประวัติ (BR-PM-003) */
export function deleteGroup(id: number, actor: string) {
  const g = getGroupRow(id);
  const pkg = String(g['package_code']);
  const ch = String(g['channel_code']);
  const name = String(g['group_name']);
  transaction((db) => {
    const members = db.prepare('SELECT COUNT(*) AS n FROM group_member WHERE group_id = ?').get(id) as { n: number };
    const camps = db.prepare('SELECT campaign_code FROM group_campaign WHERE group_id = ?').all(id) as { campaign_code: string }[];
    db.prepare('DELETE FROM group_member WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM group_campaign WHERE group_id = ?').run(id);
    db.prepare("UPDATE seller_group SET is_deleted = 1, updated_by = ?, updated_at = datetime('now', 'localtime') WHERE group_id = ?").run(actor, id);
    for (const c of camps) log('UNBIND', pkg, ch, actor, { groupId: id, groupName: name, campaign: c.campaign_code, detail: `- ${c.campaign_code} (ลบกลุ่ม)` });
    log('DELETE_GROUP', pkg, ch, actor, { groupId: id, groupName: name, detail: `ลบกลุ่ม "${name}" · สมาชิก ${members.n} คนกลับเป็น "ยังไม่มีกลุ่ม"` });
  });
  return { ok: true };
}

// ---------------------------------------------------------------- ย้ายผู้ขาย (BR-PM-004, BR-PM-005)
export function moveSellers(pkg: string, ch: string, codes: unknown, target: unknown, actor: string, source: Source = 'UI') {
  const ws = workspaceRow(pkg, ch);
  const list = Array.isArray(codes) ? [...new Set(codes.map(String))] : [];
  if (!list.length) throw new AppError(422, 'ยังไม่ได้เลือกผู้ขาย', 'REQUIRED');
  const groupId = target === null || target === undefined || target === '' ? null : Number(target);
  let groupName = 'ยังไม่มีกลุ่ม';
  if (groupId !== null) {
    const g = getGroupRow(groupId);
    if (g['package_code'] !== pkg || g['channel_code'] !== ch) throw new AppError(422, 'กลุ่มปลายทางไม่อยู่ใน Workspace นี้', 'INVALID');
    groupName = String(g['group_name']);
  }
  const sellers = new Map(workspaceSellers(pkg, ch, String(ws['mode'])).map((s) => [s.sellerCode, s]));
  const names = new Map(groupsOf(pkg, ch).map((g) => [Number(g['group_id']), String(g['group_name'])]));
  const skipped: { sellerCode: string; reason: string }[] = [];
  let moved = 0;
  transaction((db) => {
    for (const code of list) {
      const s = sellers.get(code);
      if (!s) {
        skipped.push({ sellerCode: code, reason: 'ไม่อยู่ในรายชื่อ Workspace' });
        continue;
      }
      // ไม่พร้อมขาย: ลากเข้ากลุ่มไม่ได้ (นำออกจากกลุ่มได้)
      if (!s.ready && groupId !== null) {
        skipped.push({ sellerCode: code, reason: s.reason ?? 'ไม่พร้อมขาย' });
        continue;
      }
      if (s.groupId === groupId) continue;
      if (groupId === null) db.prepare('DELETE FROM group_member WHERE package_code = ? AND channel_code = ? AND seller_code = ?').run(pkg, ch, code);
      else
        db.prepare(
          `INSERT INTO group_member (package_code, channel_code, seller_code, group_id) VALUES (?, ?, ?, ?)
           ON CONFLICT (package_code, channel_code, seller_code) DO UPDATE SET group_id = excluded.group_id, joined_at = datetime('now', 'localtime')`,
        ).run(pkg, ch, code, groupId);
      const from = s.groupId === null ? 'ยังไม่มีกลุ่ม' : names.get(s.groupId) ?? '-';
      log('MOVE', pkg, ch, actor, { groupId, groupName: groupId === null ? from : groupName, seller: code, detail: `${code}: ${from} → ${groupName}`, source });
      if (s.groupId !== null) touch(s.groupId, actor);
      moved++;
    }
    if (groupId !== null && moved) touch(groupId, actor);
  });
  return { moved, skipped, board: getBoard(pkg, ch) };
}

// ---------------------------------------------------------------- P-03 รายละเอียดกลุ่ม & ผูก Campaign (BR-PM-006)
export function getGroup(id: number) {
  const g = getGroupRow(id);
  const pkg = String(g['package_code']);
  const ch = String(g['channel_code']);
  const ws = workspaceRow(pkg, ch);
  const members = workspaceSellers(pkg, ch, String(ws['mode'])).filter((s) => s.groupId === id);
  const bound = boundCampaigns(id);
  const boundCodes = new Set(bound.map((b) => b.campaignCode));
  const candidates = (
    getDb()
      .prepare(
        `SELECT c.campaign_code, c.name_th, c.type_code, c.status, c.start_date, c.end_date, t.name_en AS type_name,
                CASE WHEN c.status = 'APPROVED' AND c.end_date IS NOT NULL AND c.end_date < ${TODAY} THEN 1 ELSE 0 END AS expired
           FROM campaign c
           LEFT JOIN custom_master_item t ON t.type_code = 'MS-01' AND t.item_code = c.type_code
          WHERE c.package_codes LIKE ? AND c.channel_codes LIKE ?
          ORDER BY c.start_date DESC, c.campaign_code`,
      )
      .all(`%"${pkg}"%`, `%"${ch}"%`) as DbRow[]
  )
    .filter((r) => !boundCodes.has(String(r['campaign_code'])))
    .map((r) => {
      const status = String(r['status']);
      let reason: string | null = null;
      if (status !== 'APPROVED') reason = 'ยังไม่ Approved';
      else if (r['expired'] === 1) reason = 'หมดอายุแล้ว';
      return {
        campaignCode: String(r['campaign_code']),
        nameTh: String(r['name_th']),
        typeCode: String(r['type_code']),
        typeName: r['type_name'] as string | null,
        status,
        startDate: r['start_date'] as string | null,
        endDate: r['end_date'] as string | null,
        bindable: !reason,
        reason,
      };
    });
  const logs = auditLog({ groupId: id, limit: 50 });
  return {
    groupId: id,
    groupName: String(g['group_name']),
    description: g['description'] as string | null,
    color: String(g['color']),
    workspace: { packageCode: pkg, nameTh: String(ws['name_th']), channelCode: ch, channelName: ws['channel_name'] as string | null, mode: String(ws['mode']) },
    members,
    campaigns: bound,
    candidates,
    logs,
    updatedAt: String(g['updated_at']),
  };
}

export function bindCampaign(id: number, code: unknown, actor: string) {
  const g = getGroupRow(id);
  const pkg = String(g['package_code']);
  const ch = String(g['channel_code']);
  const campaign = String(code ?? '');
  const c = getDb()
    .prepare(`SELECT *, CASE WHEN end_date IS NOT NULL AND end_date < ${TODAY} THEN 1 ELSE 0 END AS expired FROM campaign WHERE campaign_code = ?`)
    .get(campaign) as DbRow | undefined;
  if (!c) throw new AppError(404, `ไม่พบ Campaign ${campaign}`, 'NOT_FOUND');
  if (c['status'] !== 'APPROVED' || c['expired'] === 1)
    throw new AppError(422, 'ผูกได้เฉพาะ Campaign ที่ Approved และยังไม่หมดอายุ', 'NOT_BINDABLE');
  if (!String(c['package_codes']).includes(`"${pkg}"`) || !String(c['channel_codes']).includes(`"${ch}"`))
    throw new AppError(422, `Campaign นี้ไม่ได้ครอบคลุม ${pkg} × ${ch}`, 'NOT_BINDABLE');
  const res = getDb().prepare('INSERT OR IGNORE INTO group_campaign (group_id, campaign_code, bound_by) VALUES (?, ?, ?)').run(id, campaign, actor);
  if (res.changes) {
    touch(id, actor);
    log('BIND', pkg, ch, actor, { groupId: id, groupName: String(g['group_name']), campaign, detail: `+ ${campaign}` });
  }
  return getGroup(id);
}

export function unbindCampaign(id: number, campaign: string, actor: string) {
  const g = getGroupRow(id);
  const res = getDb().prepare('DELETE FROM group_campaign WHERE group_id = ? AND campaign_code = ?').run(id, campaign);
  if (res.changes) {
    touch(id, actor);
    log('UNBIND', String(g['package_code']), String(g['channel_code']), actor, { groupId: id, groupName: String(g['group_name']), campaign, detail: `- ${campaign}` });
  }
  return getGroup(id);
}

// ---------------------------------------------------------------- P-04 Referral links (CC-10)
const REF_BASE = 'https://www.philliplife.com/r/';

/** Campaign Referral ที่ผูกกับกลุ่มแล้ว (อย่างน้อย 1 กลุ่ม) */
export function listReferrals() {
  const rows = getDb()
    .prepare(
      `SELECT c.campaign_code, c.name_th, c.status, c.start_date, c.end_date, c.package_codes, c.channel_codes,
              (SELECT COUNT(*) FROM group_campaign gc JOIN seller_group g ON g.group_id = gc.group_id AND g.is_deleted = 0
                WHERE gc.campaign_code = c.campaign_code) AS group_count
         FROM campaign c WHERE c.type_code = 'REFERRAL' AND c.status = 'APPROVED' ORDER BY c.start_date DESC`,
    )
    .all() as DbRow[];
  return rows.map((r) => {
    const detail = referralDetail(String(r['campaign_code']));
    return {
      campaignCode: String(r['campaign_code']),
      nameTh: String(r['name_th']),
      startDate: r['start_date'] as string | null,
      endDate: r['end_date'] as string | null,
      packageCodes: JSON.parse(String(r['package_codes'])) as string[],
      channelCodes: JSON.parse(String(r['channel_codes'])) as string[],
      groupCount: Number(r['group_count']),
      ...detail.stats,
    };
  });
}

export function referralDetail(code: string) {
  const db = getDb();
  const c = db
    .prepare(
      `SELECT c.*, CASE WHEN c.start_date > ${TODAY} THEN 'SCHEDULED'
                         WHEN c.end_date IS NOT NULL AND c.end_date < ${TODAY} THEN 'EXPIRED' ELSE 'ACTIVE' END AS display_status
         FROM campaign c WHERE c.campaign_code = ?`,
    )
    .get(code) as DbRow | undefined;
  if (!c || c['type_code'] !== 'REFERRAL') throw new AppError(404, `ไม่พบ Campaign Referral ${code}`, 'NOT_FOUND');

  // ผู้ขายในกลุ่มที่ผูก Campaign นี้ → ลิงก์รายคน (สร้างให้อัตโนมัติถ้ายังไม่มี)
  const members = db
    .prepare(
      `SELECT m.package_code, m.channel_code, m.seller_code, g.group_id, g.group_name, g.color
         FROM group_campaign gc
         JOIN seller_group g ON g.group_id = gc.group_id AND g.is_deleted = 0
         JOIN group_member m ON m.group_id = g.group_id
        WHERE gc.campaign_code = ?
        ORDER BY m.seller_code`,
    )
    .all(code) as DbRow[];
  const addLink = db.prepare('INSERT OR IGNORE INTO referral_link (campaign_code, seller_code, token) VALUES (?, ?, ?)');
  for (const m of members) addLink.run(code, m['seller_code'], referralToken(code, String(m['seller_code'])));

  const sellerRow = db.prepare('SELECT * FROM seller WHERE seller_code = ?');
  const linkRow = db.prepare('SELECT * FROM referral_link WHERE campaign_code = ? AND seller_code = ?');
  const links = members.map((m) => {
    const sc = String(m['seller_code']);
    const s = sellerRow.get(sc) as DbRow | undefined;
    const view = s ? sellerView({ ...s, group_id: m['group_id'] }) : null;
    const l = linkRow.get(code, sc) as DbRow;
    return {
      sellerCode: sc,
      sellerName: view?.sellerName ?? sc,
      groupId: Number(m['group_id']),
      groupName: String(m['group_name']),
      groupColor: String(m['color']),
      url: `${REF_BASE}${l['token']}`,
      clicks: Number(l['clicks']),
      applications: Number(l['applications']),
      approved: Number(l['approved']),
      // ไม่พร้อมขาย → ลิงก์หยุดนับยอดใหม่ (PM-02)
      active: view?.ready ?? false,
      reason: view?.reason ?? null,
    };
  });
  const sum = (k: 'clicks' | 'applications' | 'approved') => links.reduce((a, l) => a + l[k], 0);
  const groups = new Set(links.map((l) => l.groupId));
  const pkgs = JSON.parse(String(c['package_codes'])) as string[];
  const agentContent = db
    .prepare("SELECT content_code FROM content WHERE package_code = ? AND template_code = 'AGENT' AND status = 'APPROVED'")
    .get(pkgs[0] ?? '') as { content_code: string } | undefined;
  return {
    campaignCode: code,
    nameTh: String(c['name_th']),
    displayStatus: String(c['display_status']),
    startDate: c['start_date'] as string | null,
    endDate: c['end_date'] as string | null,
    packageCodes: pkgs,
    channelCodes: JSON.parse(String(c['channel_codes'])) as string[],
    attributionDays: Number((JSON.parse(String(c['campaign_data'] ?? '{}')) as { benefit?: { attributionDays?: number } }).benefit?.attributionDays ?? 30),
    agentContentCode: agentContent?.content_code ?? null,
    stats: {
      activeLinks: links.filter((l) => l.active).length,
      totalLinks: links.length,
      groupCount: groups.size,
      clicks: sum('clicks'),
      applications: sum('applications'),
      approved: sum('approved'),
    },
    links,
  };
}

// ---------------------------------------------------------------- P-05 เครื่องมือ
/** คัดลอกกลุ่ม (BR-PM-008) — ปลายทางต้องยังไม่มีกลุ่ม · ไม่คัดลอก Campaign · preview = true แค่คำนวณ */
export function copyGroups(input: { fromPackage?: string; fromChannel?: string; toPackage?: string; toChannel?: string; preview?: boolean }, actor: string) {
  const { fromPackage: fp = '', fromChannel: fc = '', toPackage: tp = '', toChannel: tc = '' } = input;
  if (!fp || !fc || !tp || !tc) throw new AppError(422, 'กรุณาเลือก Workspace ต้นทางและปลายทาง', 'REQUIRED');
  if (fp === tp && fc === tc) throw new AppError(422, 'ต้นทางและปลายทางต้องเป็นคนละ Workspace', 'INVALID');
  const src = workspaceRow(fp, fc);
  const dst = workspaceRow(tp, tc);
  if (groupsOf(tp, tc).length) throw new AppError(409, 'คัดลอกได้เฉพาะเข้า Workspace ที่ยังไม่มีกลุ่ม', 'HAS_GROUPS');
  const srcSellers = workspaceSellers(fp, fc, String(src['mode']));
  const dstSellers = new Map(workspaceSellers(tp, tc, String(dst['mode'])).map((s) => [s.sellerCode, s]));
  const plan = groupsOf(fp, fc).map((g) => {
    const id = Number(g['group_id']);
    const members = srcSellers.filter((s) => s.groupId === id);
    const ok = members.filter((m) => dstSellers.get(m.sellerCode)?.ready);
    const notInDst = members.filter((m) => !dstSellers.has(m.sellerCode)).length;
    const notReady = members.length - ok.length - notInDst;
    return {
      groupName: String(g['group_name']),
      description: g['description'] as string | null,
      color: String(g['color']),
      sourceCount: members.length,
      copyCount: ok.length,
      skipNotInTarget: notInDst,
      skipNotReady: notReady,
      codes: ok.map((m) => m.sellerCode),
    };
  });
  if (input.preview) return { preview: true, groups: plan.map(({ codes: _c, ...p }) => p) };
  transaction((db) => {
    for (const p of plan) {
      const id = Number(
        db
          .prepare('INSERT INTO seller_group (package_code, channel_code, group_name, description, color, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(tp, tc, p.groupName, p.description, p.color, actor, actor).lastInsertRowid,
      );
      const add = db.prepare('INSERT OR IGNORE INTO group_member (package_code, channel_code, seller_code, group_id) VALUES (?, ?, ?, ?)');
      for (const code of p.codes) add.run(tp, tc, code, id);
      log('COPY', tp, tc, actor, {
        groupId: id,
        groupName: p.groupName,
        source: 'COPY',
        detail: `คัดลอกจาก ${fp} × ${fc} · ${p.copyCount} คน${p.sourceCount - p.copyCount ? ` · ข้าม ${p.sourceCount - p.copyCount}` : ''}`,
      });
    }
  });
  return { preview: false, groups: plan.map(({ codes: _c, ...p }) => p) };
}

/** Import (BR-PM-009) — rows = [{ sellerCode, groupName }] · commit = false → ตรวจอย่างเดียว */
export function importRows(pkg: string, ch: string, rows: unknown, commit: boolean, actor: string) {
  const ws = workspaceRow(pkg, ch);
  const list = (Array.isArray(rows) ? rows : []) as { sellerCode?: unknown; groupName?: unknown }[];
  if (!list.length) throw new AppError(422, 'ไฟล์ไม่มีข้อมูล', 'EMPTY');
  if (list.length > 10000) throw new AppError(422, 'ไฟล์มีเกิน 10,000 แถว', 'TOO_MANY');
  const sellers = new Map(workspaceSellers(pkg, ch, String(ws['mode'])).map((s) => [s.sellerCode, s]));
  const groups = new Map(groupsOf(pkg, ch).map((g) => [String(g['group_name']), Number(g['group_id'])]));
  const groupNames = new Map([...groups].map(([n, id]) => [id, n]));
  const seen = new Set<string>();
  const result = list.map((r, i) => {
    const sellerCode = String(r.sellerCode ?? '').trim();
    const groupName = String(r.groupName ?? '').trim();
    const row = { row: i + 2, sellerCode, groupName, ok: false, message: '', newGroup: false };
    const s = sellers.get(sellerCode);
    if (!sellerCode || !groupName) row.message = 'ข้อมูลไม่ครบ';
    else if (groupName.length > 100) row.message = 'ชื่อกลุ่มเกิน 100 ตัวอักษร';
    else if (seen.has(sellerCode)) row.message = 'รหัสซ้ำในไฟล์';
    else if (!s) row.message = 'ไม่พบรหัสใน Workspace';
    else if (!s.ready) row.message = `ไม่พร้อมขาย (${s.reason})`;
    else {
      row.ok = true;
      row.newGroup = !groups.has(groupName);
      const current = s.groupId === null ? null : groupNames.get(s.groupId);
      row.message = row.newGroup ? 'ผ่าน · สร้างกลุ่มใหม่' : current && current !== groupName ? `ผ่าน · ย้ายจาก ${current}` : 'ผ่าน';
    }
    seen.add(sellerCode);
    return row;
  });
  const passed = result.filter((r) => r.ok);
  if (!commit) return { committed: false, rows: result, passed: passed.length, failed: result.length - passed.length };
  transaction((db) => {
    for (const r of passed) {
      let id = groups.get(r.groupName);
      if (id === undefined) {
        id = Number(
          db.prepare('INSERT INTO seller_group (package_code, channel_code, group_name, created_by, updated_by) VALUES (?, ?, ?, ?, ?)').run(pkg, ch, r.groupName, actor, actor).lastInsertRowid,
        );
        groups.set(r.groupName, id);
        log('CREATE_GROUP', pkg, ch, actor, { groupId: id, groupName: r.groupName, detail: `สร้างกลุ่ม "${r.groupName}" จาก Import`, source: 'IMPORT' });
      }
      db.prepare(
        `INSERT INTO group_member (package_code, channel_code, seller_code, group_id) VALUES (?, ?, ?, ?)
         ON CONFLICT (package_code, channel_code, seller_code) DO UPDATE SET group_id = excluded.group_id, joined_at = datetime('now', 'localtime')`,
      ).run(pkg, ch, r.sellerCode, id);
    }
    log('IMPORT', pkg, ch, actor, { source: 'IMPORT', detail: `${passed.length} แถวผ่าน · ${result.length - passed.length} แถวไม่ผ่าน` });
  });
  return { committed: true, rows: result, passed: passed.length, failed: result.length - passed.length };
}

// ---------------------------------------------------------------- Audit log (BR-PM-011)
export interface AuditQuery {
  pkg?: string;
  ch?: string;
  groupId?: number;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function auditLog(query: AuditQuery) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (query.pkg) (where.push('l.package_code = ?'), params.push(query.pkg));
  if (query.ch) (where.push('l.channel_code = ?'), params.push(query.ch));
  if (query.groupId) (where.push('l.group_id = ?'), params.push(Number(query.groupId)));
  if (query.q) {
    where.push('(l.seller_code LIKE ? OR l.group_name LIKE ? OR l.campaign_code LIKE ?)');
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }
  if (query.from) (where.push('date(l.created_at) >= ?'), params.push(query.from));
  if (query.to) (where.push('date(l.created_at) <= ?'), params.push(query.to));
  const limit = Math.min(Number(query.limit) || 200, 500);
  return (
    getDb()
      .prepare(
        `SELECT l.*, u.user_name FROM people_audit_log l LEFT JOIN app_user u ON u.user_id = l.actor_id
          ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY l.created_at DESC, l.log_id DESC LIMIT ${limit}`,
      )
      .all(...params) as DbRow[]
  ).map((r) => ({
    logId: Number(r['log_id']),
    action: String(r['action']),
    packageCode: String(r['package_code']),
    channelCode: String(r['channel_code']),
    groupId: r['group_id'] as number | null,
    groupName: r['group_name'] as string | null,
    sellerCode: r['seller_code'] as string | null,
    campaignCode: r['campaign_code'] as string | null,
    detail: r['detail'] as string | null,
    actorName: (r['user_name'] as string | null) ?? (r['actor_id'] ? String(r['actor_id']) : 'ระบบ'),
    source: String(r['source']),
    createdAt: String(r['created_at']),
  }));
}
