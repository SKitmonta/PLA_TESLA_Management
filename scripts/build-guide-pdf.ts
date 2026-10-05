/**
 * สร้าง PDF คู่มือการใช้งาน — รวมทุกอย่างในเมนู User guide เป็นไฟล์เดียว:
 *   ปก · สารบัญ · เลือกอ่านตาม Role · ภาพรวม User journey · บทที่ 0–7 (ทีละขั้นตอน + รูปหน้าจอ) · ผลการตรวจสอบระบบ
 * เนื้อหามาจาก client/src/app/features/user-guide/guide-content.ts (ไฟล์เดียวกับหน้าจอ) + รูปใน client/public/assets/guide/
 *
 * รัน (ที่ root):  node_modules/.bin/tsx scripts/build-guide-pdf.ts   → docs/TESLA-Management-User-Guide.pdf
 * ใช้ Microsoft Edge / Chrome ในเครื่องแบบ headless ผ่าน DevTools Protocol — ไม่ต้องติดตั้ง package เพิ่ม
 * (ระบุ browser เองได้ด้วย env BROWSER_PATH) · เลขหน้าในสารบัญคำนวณจากการพิมพ์ทีละส่วนก่อน แล้วพิมพ์ทั้งเล่มอีกรอบ
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GUIDE, JOURNEY, JOURNEY_CHECKS, type GuideChapter } from '../client/src/app/features/user-guide/guide-content';
import { ROLE_LABEL, type RoleCode } from '../client/src/app/core/models/user.model';
import { APP_INFO } from '../client/src/app/core/app-info';

const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'docs', 'TESLA-Management-User-Guide.pdf');
const ASSETS = join(ROOT, 'client', 'public', 'assets');

const BROWSERS = [
  process.env['BROWSER_PATH'],
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const ROLE_ORDER: RoleCode[] = ['SYS_ADMIN', 'CONTENT_MAKER', 'CONTENT_APPROVER', 'CAMPAIGN_MAKER', 'CAMPAIGN_APPROVER', 'PEOPLE_ADMIN', 'EXECUTIVE'];

// ---------------------------------------------------------------- ส่วนของเล่ม (แต่ละส่วนขึ้นหน้าใหม่)
type SectionId = string;
const SECTIONS: SectionId[] = ['front', 'journey', ...GUIDE.map((c) => `ch-${c.id}`), 'appendix'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileUrl = (...parts: string[]) => pathToFileURL(join(...parts)).href;
const stepCount = GUIDE.reduce((n, c) => n + c.steps.length, 0);
const passed = JOURNEY_CHECKS.filter((c) => c.result === 'ผ่าน').length;

/** "① เมนูหลัก  ② Role …" → รายการทีละหมายเลข */
function captionItems(caption: string): string[] {
  return caption
    .split(/(?=[\u2460-\u2473])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function roleChips(roles: RoleCode[]): string {
  if (roles.length === ROLE_ORDER.length) return '<span class="chip">ทุก Role</span>';
  return roles.map((r) => `<span class="chip">${esc(ROLE_LABEL[r])}</span>`).join('');
}

function pageRef(pages: Record<SectionId, number> | null, id: SectionId): string {
  return pages ? String(pages[id]) : '00';
}

// ---------------------------------------------------------------- HTML
function cover(): string {
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
  <section class="cover">
    <img class="logo" src="${fileUrl(ASSETS, 'figma', 'logo.svg')}" alt="">
    <div class="cover-band">
      <div class="eyebrow">USER GUIDE</div>
      <div class="cover-title">คู่มือการใช้งาน</div>
      <div class="cover-sub">TESLA Management</div>
      <div class="cover-mods">Overview · Package (Content) · Campaign · Seller · Master setup</div>
    </div>
    <dl class="cover-info">
      <div><dt>เวอร์ชันระบบ</dt><dd>System v${esc(APP_INFO.version)} (${esc(APP_INFO.releaseDate)})</dd></div>
      <div><dt>จัดทำเมื่อ</dt><dd>${esc(today)}</dd></div>
      <div><dt>เนื้อหา</dt><dd>${GUIDE.length} บท · ${stepCount} ขั้นตอนพร้อมรูปหน้าจอ · User journey ${JOURNEY.length} ขั้น · ผลการตรวจสอบ ${JOURNEY_CHECKS.length} รายการ</dd></div>
    </dl>
    <div class="howto">
      <h2 class="plain">วิธีอ่านคู่มือนี้</h2>
      <ul>
        <li>แต่ละบทเรียงขั้นตอน 1 → 2 → 3 ทำตามลำดับได้เลย · ใต้รูปมีคำอธิบายหมายเลข ① ② ③ ที่อยู่ในกรอบสีแดง</li>
        <li>กดชื่อบทในสารบัญเพื่อไปยังบทนั้น หรือใช้ Bookmark ด้านข้างของโปรแกรมอ่าน PDF</li>
        <li>ต้องการดูรายละเอียดหน้าจอ ให้ซูมเข้าที่รูป — รูปเป็นความละเอียดเดียวกับหน้าจอจริง</li>
        <li>เมนูที่เห็นขึ้นกับ Role — ถ้าไม่เห็นเมนูตามคู่มือ ให้สลับ Role ที่ปุ่มผู้ใช้มุมขวาบน (บทที่ 0)</li>
      </ul>
    </div>
    <p class="cover-note">สร้างจากเมนู User guide ในระบบ (Prototype) — ภาพหน้าจอใช้ข้อมูลจำลอง</p>
  </section>`;
}

function contents(pages: Record<SectionId, number> | null): string {
  // Role ของแต่ละบทอยู่ในตาราง "เลือกอ่านตาม Role" ด้านล่าง — สารบัญจึงไม่ซ้ำคอลัมน์ Role
  const rows = [
    `<tr><td class="no">–</td><td><a href="#journey">ภาพรวม User journey</a><small>ลำดับงานข้าม Role ตั้งแต่เตรียมข้อมูลจนติดตามยอดขาย</small></td><td>ทุกเมนู</td><td class="pg">${pageRef(pages, 'journey')}</td></tr>`,
    ...GUIDE.map(
      (c) => `<tr><td class="no">${c.no}</td><td><a href="#ch-${c.id}">${esc(c.title)}</a><small>${c.steps.length} ขั้นตอน</small></td><td>${esc(c.menu)}</td><td class="pg">${pageRef(pages, `ch-${c.id}`)}</td></tr>`,
    ),
    `<tr><td class="no">ผ</td><td><a href="#appendix">ผลการตรวจสอบระบบตาม Journey</a><small>ผ่าน ${passed} / ${JOURNEY_CHECKS.length} รายการ</small></td><td>–</td><td class="pg">${pageRef(pages, 'appendix')}</td></tr>`,
  ];
  const matrix = ROLE_ORDER.map((r) => {
    const cells = GUIDE.map((c) => {
      const mine = c.roles.includes(r);
      const can = r === 'SYS_ADMIN';
      return `<td class="${mine ? 'on' : can ? 'can' : ''}">${mine ? '●' : can ? '○' : ''}</td>`;
    }).join('');
    return `<tr><th>${esc(ROLE_LABEL[r])}</th>${cells}</tr>`;
  }).join('');
  return `
  <section class="sheet">
    <h1>สารบัญ</h1>
    <table class="toc">
      <thead><tr><th class="no">บท</th><th>เรื่อง</th><th>เมนู</th><th class="pg">หน้า</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>

    <h2 class="plain">เลือกอ่านตาม Role</h2>
    <table class="matrix">
      <thead><tr><th>Role</th>${GUIDE.map((c) => `<th>บท ${c.no}</th>`).join('')}</tr></thead>
      <tbody>${matrix}</tbody>
    </table>
    <p class="legend">● บทที่ Role นี้ใช้งานโดยตรง · ○ System Admin ทำได้ทุก Function</p>
  </section>`;
}

function journey(pages: Record<SectionId, number> | null): string {
  const no = new Map(GUIDE.map((c) => [c.id, c.no]));
  const stages = JOURNEY.map(
    (s) => `
      <li class="stage">
        <span class="code">${esc(s.code)}</span>
        <div class="stage-body">
          <div class="stage-title">${esc(s.title)} <span class="chip ${s.role === 'ระบบ' ? 'sys' : ''}">${esc(s.role)}</span></div>
          <div class="stage-meta"><span>เมนู: <b>${esc(s.menu)}</b></span><span>ผลลัพธ์: ${esc(s.output)}</span></div>
        </div>
        <a class="stage-ref" href="#ch-${s.chapter}">บทที่ ${no.get(s.chapter)}<small>หน้า ${pageRef(pages, `ch-${s.chapter}`)}</small></a>
      </li>`,
  ).join('');
  return `
  <section class="sheet" id="journey">
    <h1>ภาพรวม User journey</h1>
    <p class="lead">ลำดับงานตั้งแต่เตรียมข้อมูลจนติดตามยอดขาย — แต่ละขั้นทำโดย Role ต่างกัน ผลลัพธ์ของขั้นก่อนหน้าเป็นจุดเริ่มของขั้นถัดไป ·
      คอลัมน์ขวาบอกบทที่อธิบายขั้นนั้นทีละขั้นตอน</p>
    <ol class="journey">${stages}</ol>
  </section>`;
}

function chapter(c: GuideChapter): string {
  const steps = c.steps
    .map((s, i) => {
      const caption = s.caption
        ? `<figcaption><b>หมายเลขในภาพ</b><ul>${captionItems(s.caption).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></figcaption>`
        : '';
      const tips = s.tips?.length
        ? `<div class="tips"><b>ข้อควรรู้</b><ul>${s.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`
        : '';
      return `
      <section class="step">
        <div class="step-head"><span class="num">${i + 1}</span><h2>${esc(s.title)}</h2></div>
        <div class="step-text">${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <figure>
          <img src="${fileUrl(ASSETS, 'guide', s.image)}" alt="${esc(s.title)}">
          ${caption}
        </figure>
        ${tips}
      </section>`;
    })
    .join('');
  return `
  <section class="sheet" id="ch-${c.id}">
    <header class="chapter-head">
      <div class="eyebrow">CHAPTER ${c.no} · ${c.steps.length} ขั้นตอน</div>
      <h1>บทที่ ${c.no} · ${esc(c.title)}</h1>
      <p>${esc(c.summary)}</p>
      <div class="chapter-meta"><span>เมนู: <b>${esc(c.menu)}</b></span><span class="roles">Role: ${roleChips(c.roles)}</span></div>
    </header>
    ${steps}
  </section>`;
}

function appendix(): string {
  const rows = JOURNEY_CHECKS.map(
    (c) => `<tr><td class="stage-col"><b>${esc(c.stage)}</b></td><td>${esc(c.check)}</td><td>${esc(c.role)}</td><td>${esc(c.expected)}</td>
      <td><span class="result ${c.result === 'ผ่าน' ? 'ok' : 'bad'}">${esc(c.result)}</span></td></tr>`,
  ).join('');
  return `
  <section class="sheet" id="appendix">
    <h1>ภาคผนวก · ผลการตรวจสอบระบบตาม Journey</h1>
    <p class="lead">ผ่าน <b>${passed} / ${JOURNEY_CHECKS.length}</b> รายการ · ตรวจบน localhost ที่ 1920px ด้วยข้อมูลตั้งต้น (Reset data) ·
      คอลัมน์ "ขั้น" อ้างอิงขั้น A–H ในภาพรวม User journey</p>
    <table class="checks">
      <thead><tr><th>ขั้น</th><th>สิ่งที่ตรวจ</th><th>Role ที่ใช้</th><th>ผลที่คาด</th><th>ผล</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function section(id: SectionId, pages: Record<SectionId, number> | null): string {
  if (id === 'front') return cover() + contents(pages);
  if (id === 'journey') return journey(pages);
  if (id === 'appendix') return appendix();
  const c = GUIDE.find((g) => `ch-${g.id}` === id);
  if (!c) throw new Error(`ไม่รู้จักส่วน ${id}`);
  return chapter(c);
}

const CSS = `
@page {
  size: A4;
  margin: 16mm 15mm 18mm;
  @bottom-left { content: "TESLA Management · คู่มือการใช้งาน"; font-family: 'Noto Sans Thai', 'Leelawadee UI', sans-serif; font-size: 8pt; color: #7a8599; }
  @bottom-right { content: "หน้า " counter(page) " / " counter(pages); font-family: 'Noto Sans Thai', 'Leelawadee UI', sans-serif; font-size: 8pt; color: #7a8599; }
}
@page cover { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }

:root { --navy: #00194b; --blue: #2854a7; --ink: #191919; --muted: #5d5d5d; --line: #d7deed; --soft: #f4f7fc; --light: #e2edff; --amber: #b45309; --amber-bg: #fff6e8; --ok: #0f8a5f; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: 'Noto Sans Thai', 'Leelawadee UI', sans-serif; font-size: 10.5pt; line-height: 1.65; color: var(--ink); }
a { color: var(--blue); text-decoration: none; }
h1 { font-size: 20pt; line-height: 1.3; color: var(--navy); margin: 0 0 4mm; }
h2.plain { font-size: 13pt; color: var(--navy); margin: 7mm 0 2.5mm; }
p { margin: 0 0 2mm; }
.lead { color: var(--muted); margin-bottom: 6mm; }
.sheet { break-before: page; }
.chip { display: inline-block; font-size: 8pt; line-height: 1.5; padding: 0.3mm 2.2mm; margin: 0.6mm 1mm 0.6mm 0; border-radius: 99px; background: var(--light); color: var(--navy); font-weight: 600; white-space: nowrap; }
.chip.sys { background: #eceef3; color: var(--muted); }

/* ปก */
.cover { page: cover; height: 296mm; padding: 22mm 20mm 18mm; display: flex; flex-direction: column; overflow: hidden; }
.cover .logo { height: 15mm; width: auto; align-self: flex-start; }
.cover-band { margin: 30mm -20mm 0; padding: 16mm 20mm 14mm; background: linear-gradient(100deg, var(--navy) 0%, var(--blue) 100%); color: #fff; }
.cover-band .eyebrow { font-size: 10pt; letter-spacing: 0.3em; opacity: 0.75; }
.cover-title { font-size: 40pt; font-weight: 700; line-height: 1.25; margin-top: 2mm; }
.cover-sub { font-size: 22pt; font-weight: 600; opacity: 0.95; }
.cover-mods { margin-top: 5mm; font-size: 10.5pt; opacity: 0.85; }
.cover-info { margin: 14mm 0 0; display: grid; gap: 4mm; }
.cover-info div { display: grid; grid-template-columns: 32mm 1fr; border-bottom: 1px solid var(--line); padding-bottom: 3mm; }
.cover-info dt { color: var(--muted); }
.cover-info dd { margin: 0; font-weight: 600; color: var(--navy); }
.cover-note { margin-top: auto; font-size: 9pt; color: var(--muted); border-left: 3px solid var(--blue); padding-left: 4mm; }

/* สารบัญ */
table { border-collapse: collapse; width: 100%; }
.toc th, .toc td { border-bottom: 1px solid var(--line); padding: 1.6mm 2mm; text-align: left; vertical-align: top; line-height: 1.5; }
.toc thead th { font-size: 9pt; color: var(--muted); font-weight: 600; border-bottom: 1.5px solid var(--navy); }
.toc td small { display: block; font-size: 8.5pt; color: var(--muted); }
.toc td a { font-weight: 700; color: var(--navy); }
.toc td:nth-child(3) { font-size: 9pt; color: var(--muted); width: 58mm; }
.toc .no { width: 9mm; text-align: center; font-weight: 700; color: var(--blue); }
.toc .pg { width: 12mm; text-align: right; font-weight: 700; color: var(--navy); }
.howto { margin-top: 10mm; background: var(--soft); border: 1px solid var(--line); border-radius: 3mm; padding: 0 5mm 2.5mm; break-inside: avoid; }
.howto h2.plain { margin-top: 2.5mm; }
.howto ul { margin: 0; padding-left: 5mm; }
.howto li { margin-bottom: 0.6mm; }
.matrix th, .matrix td { border: 1px solid var(--line); padding: 1.1mm 1.5mm; text-align: center; font-size: 9pt; line-height: 1.5; }
.matrix thead th { background: var(--soft); color: var(--navy); }
.matrix tbody th { text-align: left; font-weight: 600; white-space: nowrap; }
.matrix td.on { color: var(--blue); font-size: 11pt; }
.matrix td.can { color: #9aa6bb; }
.legend { font-size: 8.5pt; color: var(--muted); margin-top: 2mm; }

/* User journey */
.journey { list-style: none; margin: 0; padding: 0; position: relative; }
.journey::before { content: ""; position: absolute; left: 5.5mm; top: 4mm; bottom: 4mm; width: 2px; background: var(--line); }
.stage { position: relative; display: grid; grid-template-columns: 11mm 1fr 24mm; gap: 4mm; align-items: center; padding: 3.5mm 0; break-inside: avoid; }
.stage .code { width: 11mm; height: 11mm; border-radius: 50%; background: linear-gradient(135deg, var(--navy), var(--blue)); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; position: relative; }
.stage-title { font-weight: 700; color: var(--navy); }
.stage-meta { font-size: 9pt; color: var(--muted); display: flex; flex-wrap: wrap; gap: 1mm 5mm; }
.stage-meta b { color: var(--ink); }
.stage-ref { text-align: right; font-weight: 700; color: var(--blue); }
.stage-ref small { display: block; font-weight: 400; color: var(--muted); font-size: 8.5pt; }

/* บท */
.chapter-head { background: linear-gradient(100deg, var(--navy) 0%, var(--blue) 100%); color: #fff; border-radius: 4mm; padding: 6mm 7mm 5mm; margin-bottom: 6mm; break-inside: avoid; break-after: avoid; }
.chapter-head .eyebrow { font-size: 9pt; letter-spacing: 0.08em; opacity: 0.8; }
.chapter-head h1 { color: #fff; margin: 1mm 0 2mm; font-size: 21pt; }
.chapter-head p { opacity: 0.92; }
.chapter-meta { margin-top: 3mm; font-size: 9pt; display: flex; flex-wrap: wrap; gap: 1mm 6mm; align-items: center; }
.chapter-meta .chip { background: rgba(255,255,255,0.18); color: #fff; }
.step { break-inside: avoid; margin-bottom: 9mm; }
.step-head { display: flex; align-items: center; gap: 3mm; margin: 0 0 2.5mm; break-after: avoid; }
.step h2 { font-size: 13pt; line-height: 1.4; color: var(--navy); margin: 0; }
.step .num { flex: none; width: 8mm; height: 8mm; border-radius: 50%; background: linear-gradient(135deg, var(--navy), var(--blue)); color: #fff; font-size: 10.5pt; display: flex; align-items: center; justify-content: center; }
.step-text { padding-left: 11mm; }
figure { margin: 3mm 0 0; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 2mm; }
figcaption { margin-top: 2mm; background: var(--light); border-radius: 2mm; padding: 2mm 4mm; font-size: 9pt; color: var(--navy); }
figcaption b { display: block; font-size: 8.5pt; color: var(--blue); margin-bottom: 0.5mm; }
figcaption ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5mm 6mm; }
.tips { margin-top: 2.5mm; background: var(--amber-bg); border-left: 3px solid var(--amber); border-radius: 0 2mm 2mm 0; padding: 2mm 4mm; font-size: 9.5pt; }
.tips b { color: var(--amber); }
.tips ul { margin: 0.5mm 0 0; padding-left: 5mm; }

/* ภาคผนวก */
.checks th, .checks td { border-bottom: 1px solid var(--line); padding: 1.8mm 1.8mm; text-align: left; vertical-align: top; font-size: 8.8pt; line-height: 1.5; }
.checks thead th { color: var(--muted); border-bottom: 1.5px solid var(--navy); }
.checks tr { break-inside: avoid; }
.checks .stage-col { width: 12mm; color: var(--navy); }
.checks td:nth-child(3) { width: 33mm; }
.result { display: inline-block; font-size: 8pt; font-weight: 700; padding: 0.3mm 2.2mm; border-radius: 99px; white-space: nowrap; }
.result.ok { background: #dff3ec; color: var(--ok); }
.result.bad { background: #fde8e8; color: #b42318; }
`;

function buildHtml(ids: SectionId[], pages: Record<SectionId, number> | null): string {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>คู่มือการใช้งาน TESLA Management</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=block" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>${ids.map((id) => section(id, pages)).join('')}</body>
</html>`;
}

// ---------------------------------------------------------------- DevTools Protocol (WebSocket ในตัว Node)
type Json = Record<string, unknown>;

class Cdp {
  private seq = 0;
  private readonly pending = new Map<number, { ok: (v: Json) => void; fail: (e: Error) => void }>();
  private readonly waiters: { method: string; sessionId?: string; ok: (v: Json) => void }[] = [];

  private constructor(private readonly ws: WebSocket) {
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data)) as { id?: number; method?: string; sessionId?: string; result?: Json; error?: { message: string }; params?: Json };
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p?.fail(new Error(msg.error.message));
        else p?.ok(msg.result ?? {});
        return;
      }
      const i = this.waiters.findIndex((w) => w.method === msg.method && w.sessionId === msg.sessionId);
      if (i >= 0) this.waiters.splice(i, 1)[0].ok(msg.params ?? {});
    });
  }

  static connect(url: string): Promise<Cdp> {
    return new Promise((ok, fail) => {
      const ws = new WebSocket(url);
      ws.addEventListener('open', () => ok(new Cdp(ws)));
      ws.addEventListener('error', () => fail(new Error(`เชื่อม DevTools ไม่ได้: ${url}`)));
    });
  }

  send<T = Json>(method: string, params: Json = {}, sessionId?: string): Promise<T> {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise<T>((ok, fail) => this.pending.set(id, { ok: ok as (v: Json) => void, fail }));
  }

  once(method: string, sessionId?: string): Promise<Json> {
    return new Promise((ok) => this.waiters.push({ method, sessionId, ok }));
  }

  close(): void {
    this.ws.close();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function launchBrowser(profile: string): Promise<{ proc: ChildProcess; cdp: Cdp }> {
  const exe = BROWSERS.find((p): p is string => !!p && existsSync(p));
  if (!exe) throw new Error('ไม่พบ Edge / Chrome — ตั้ง env BROWSER_PATH ให้ชี้ไปที่ไฟล์ browser');
  const proc = spawn(
    exe,
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore' },
  );
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150; i++) {
    if (existsSync(portFile)) {
      const [port, path] = readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
      if (port && path) return { proc, cdp: await Cdp.connect(`ws://127.0.0.1:${port}${path}`) };
    }
    await sleep(100);
  }
  proc.kill();
  throw new Error('browser ไม่เปิด DevTools ภายใน 15 วินาที');
}

/** รอฟอนต์ + รูปโหลดครบ แล้วคืนรูปที่โหลดไม่ได้ / ฟอนต์ที่ใช้จริง */
const READY_JS = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
  return {
    broken: [...document.images].filter((img) => !img.naturalWidth).map((img) => img.src),
    notoSansThai: document.fonts.check('12px "Noto Sans Thai"'),
  };
})()`;

async function printPdf(cdp: Cdp, html: string, workDir: string): Promise<{ pdf: Buffer; notoSansThai: boolean }> {
  const file = join(workDir, 'guide.html');
  writeFileSync(file, html, 'utf8');
  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  const loaded = cdp.once('Page.loadEventFired', sessionId);
  await cdp.send('Page.navigate', { url: pathToFileURL(file).href }, sessionId);
  await loaded;
  const ready = await cdp.send<{ result: { value: { broken: string[]; notoSansThai: boolean } } }>(
    'Runtime.evaluate',
    { expression: READY_JS, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  const { broken, notoSansThai } = ready.result.value;
  if (broken.length) throw new Error(`โหลดรูปไม่ได้: ${broken.join(', ')}`);
  const { data } = await cdp.send<{ data: string }>(
    'Page.printToPDF',
    { printBackground: true, preferCSSPageSize: true, generateTaggedPDF: true, generateDocumentOutline: true },
    sessionId,
  );
  await cdp.send('Target.closeTarget', { targetId });
  return { pdf: Buffer.from(data, 'base64'), notoSansThai };
}

/** นับหน้าจาก Page object ใน PDF ที่ Chromium สร้าง */
function countPages(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

async function main(): Promise<void> {
  const workDir = mkdtempSync(join(tmpdir(), 'tesla-guide-'));
  const profile = join(workDir, 'profile');
  const { proc, cdp } = await launchBrowser(profile);
  try {
    // รอบ 1: พิมพ์ทีละส่วนเพื่อหาจำนวนหน้า (ทุกส่วนขึ้นหน้าใหม่ จึงนับแยกได้ตรงกับทั้งเล่ม)
    const pages: Record<SectionId, number> = {};
    let next = 1;
    for (const id of SECTIONS) {
      const { pdf } = await printPdf(cdp, buildHtml([id], null), workDir);
      pages[id] = next;
      next += countPages(pdf);
    }
    // รอบ 2: ทั้งเล่มพร้อมเลขหน้าในสารบัญ
    const { pdf, notoSansThai } = await printPdf(cdp, buildHtml(SECTIONS, pages), workDir);
    const total = countPages(pdf);
    if (total !== next - 1) throw new Error(`จำนวนหน้าไม่ตรง: ทั้งเล่ม ${total} หน้า แต่นับทีละส่วนได้ ${next - 1} หน้า`);
    writeFileSync(OUT, pdf);
    console.log(`สร้างแล้ว: ${OUT}`);
    console.log(`${total} หน้า · ${(pdf.length / 1024 / 1024).toFixed(1)} MB · ฟอนต์ ${notoSansThai ? 'Noto Sans Thai' : 'สำรอง (Leelawadee UI — โหลด Google Fonts ไม่ได้)'}`);
    console.log(SECTIONS.map((id) => `${id}=${pages[id]}`).join(' · '));
  } finally {
    await cdp.send('Browser.close').catch(() => undefined);
    cdp.close();
    await new Promise((r) => (proc.exitCode !== null ? r(null) : proc.once('exit', r)));
    rmSync(workDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
