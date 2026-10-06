"""make_seller_report.py — builds docs/17-seller-tesla-report.html from seller-api-results.json + the fixed facts below.
Style = docs/16-campaign-close-test-report.html (same tokens / dark mode)."""
import html
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
DOCS = HERE.parent.parent / "docs"
res = json.loads((HERE / "seller-api-results.json").read_text(encoding="utf-8"))
style = re.search(r"<style>.*?</style>", (DOCS / "16-campaign-close-test-report.html").read_text(encoding="utf-8"), re.S).group(0)
e = html.escape

api_rows = "\n".join(
    f'<tr><td>{e(r["case"])}</td><td>{e(r["title"])}</td><td>{e(r["detail"])}</td>'
    f'<td><span class="tag {"ok" if r["pass"] else "bad"}">{"ผ่าน" if r["pass"] else "ไม่ผ่าน"}</span></td></tr>'
    for r in res["results"])
api_pass = sum(r["pass"] for r in res["results"])
api_total = len(res["results"])

ui = [
    ("UI-01", "Workspace list จาก Tesla", "9 Workspace · จำนวนผู้ขาย / กลุ่ม / ยังไม่มีกลุ่ม ตรงกับ API"),
    ("UI-02", "Board ST000027 × CHN08", "ผู้ขาย 8 คนจาก M_AGENT · โหมด ALL · ประเภทตัวแทน / พนักงาน · วันหมดใบอนุญาต"),
    ("UI-03", "สร้างกลุ่ม \"ทีมทดสอบ UI\" (สีเขียว)", "การ์ดกลุ่มขึ้นทันที"),
    ("UI-04", "เลือก 3 คน → วางเข้ากลุ่ม", "toast \"ย้าย 3 คนไปกลุ่ม…แล้ว\" · ยังไม่มีกลุ่ม 8 → 5"),
    ("UI-05", "รายละเอียดกลุ่ม → ผูก CMP25690011", "toast \"ผูก Campaign แล้ว\" · CMP25690008 แสดงเหตุผล \"ปิดถาวรแล้ว\""),
    ("UI-06", "วันที่ \"แก้ไขล่าสุด\"", "พบบั๊กรูปแบบวันที่ (ISO จาก API v2) → แก้ dateTime() แล้วแสดง 06/10/2026 22:07"),
    ("UI-07", "เครื่องมือ / Audit log · Referral links", "Audit แสดงทุก action ของวันนี้ · Referral: ยังไม่มี Campaign Referral ที่ Approved"),
]
ui_rows = "\n".join(f'<tr><td>{a}</td><td>{e(b)}</td><td>{e(c)}</td><td><span class="tag ok">ผ่าน</span></td></tr>' for a, b, c in ui)

shots = [
    ("sl-01-workspaces.png", "Workspace — 9 รายการจาก Tesla", "wide"),
    ("sl-02-board.png", "Board — กลุ่ม \"ทีมทดสอบ UI\" 3 คน + CMP25690011 (ชื่อผู้ขายปิดไว้)", ""),
    ("sl-03-group-detail.png", "รายละเอียดกลุ่ม — สมาชิก · Campaign ที่ผูก · เหตุผลที่ผูกไม่ได้", ""),
    ("sl-04-tools.png", "เครื่องมือ — คัดลอก / Import / Audit log", "wide"),
    ("sl-05-referral.png", "Referral links — ยังไม่มี Campaign Referral ที่ Approved", "wide"),
]
fig = "\n".join(f'<figure class="{c}"><img src="img/seller/{f}" alt="{e(t)}"><figcaption>{e(t)}</figcaption></figure>' for f, t, c in shots)

page = f"""<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seller บน Tesla — สรุปและผลทดสอบ</title>
{style}
</head>
<body>
<main>
  <header class="top">
    <div>
      <h1>เมนู Seller ต่อ Tesla Admin API</h1>
      <p class="sub">สรุปงานและผลทดสอบ · กลุ่มผู้ขาย · ผูก Campaign · คัดลอก / Import / Audit · (รวมงานเช้า: ประเภท Campaign จาก Tesla)</p>
    </div>
    <div class="stamp">6 ต.ค. 2569 (ค่ำ) · DEV (TESLA_ADMIN) · ทดสอบ API + หน้าจอจริง</div>
  </header>

  <section class="kpis" aria-label="ตัวเลขสรุป">
    <div class="kpi"><b>{api_pass}/{api_total}</b><span>ทดสอบ API บน DEV</span></div>
    <div class="kpi"><b>7/7</b><span>ทดสอบผ่านหน้าจอ</span></div>
    <div class="kpi"><b>727/727</b><span>unit test · ใหม่ 25 (Seller)</span></div>
    <div class="kpi"><b>14</b><span>เส้น API ใหม่ /api/v2/people</span></div>
    <div class="kpi"><b>V038</b><span>4 ตาราง · ลง DEV แล้ว</span></div>
  </section>

  <h2>สิ่งที่ตัดสินใจ (ข้อ 1–5 ตามที่อนุญาต)</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>#</th><th>เรื่อง</th><th>ที่ทำ</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>ขอบเขตรอบแรก</td><td>กลุ่มผู้ขายครบ (Workspace · Board · ย้าย · รายละเอียดกลุ่ม · ผูก Campaign · คัดลอก · Import · Audit) · Referral แสดงรายการลิงก์ได้ แต่ยอดคลิก / ใบคำขอ / กรมธรรม์ = 0 (ยังไม่มีแหล่งข้อมูล)</td></tr>
      <tr><td>2</td><td>Migration</td><td><code>V038__add_seller_group.sql</code> + rollback · ลง DEV แล้ว (ได้รับอนุญาต) · <b>ยังไม่ผ่าน DBA review</b></td></tr>
      <tr><td>3</td><td>ข้อมูลส่วนบุคคล</td><td>ไม่เก็บ / ไม่ส่ง เบอร์โทร · อีเมล · เลขใบอนุญาต (null เสมอ) · ใช้แค่วันหมดอายุใบอนุญาต · หน้าจอเขียน "มี (ไม่เก็บเลขที่ · PDPA)" · รูปในรายงานปิดชื่อผู้ขาย</td></tr>
      <tr><td>4</td><td>พนักงาน (EMPLOYEE)</td><td>ใช้ M_AGENT อย่างเดียว: Agent / Broker = ตัวแทน (ต้องมีใบอนุญาต) · Direct / Marketer = พนักงาน (ไม่ต้องมี) — <span class="tag warn">รอ BA ยืนยัน</span> ว่าพนักงานขายมาจากระบบไหน</td></tr>
      <tr><td>5</td><td>กลุ่ม ↔ Campaign</td><td>เก็บการผูกอย่างเดียว (D-03 ไม่ต้องอนุมัติ) · ยังไม่ใช้คำนวณสิทธิ์</td></tr>
    </tbody>
  </table></div>

  <h2>กติกาที่ใช้หา "ผู้ขายของ Workspace"</h2>
  <div class="card">
    <ul class="plain">
      <li><b>Workspace</b> = Package × ช่องทาง ที่มี Content Approved / Published (แหล่งเดียวกับตัวเลือก Package ของ Campaign)</li>
      <li><b>โหมด</b> จาก GIO (<code>T_PACKAGE.gio_payload</code> → <code>package_Channels[].seller_Selection_Mode</code>) — DEV ทุก Workspace เป็น ALL</li>
      <li><b>ALL</b>: ตัวแทนที่ <code>AGENT_TYPE</code> หรือช่องทางขายที่ ACTIVE ใน <code>T_AGENT_CHANNEL</code> เป็นคำหนึ่งในชื่อช่องทาง — "Agent Online" ← Agent · "Broker Online" ← Broker · "Direct Online" ← Direct</li>
      <li><b>CUSTOM</b>: เฉพาะรหัสใน <code>package_Sellers</code> (เทียบรหัสตัวแทน หรือรหัสขายรายช่องทาง) · รหัสที่ไม่พบใน M_AGENT แสดงเป็น "ไม่พบข้อมูลตัวแทน (Porsche)"</li>
      <li><b>พร้อมขาย</b> = Active และ (ตัวแทน) ใบอนุญาตยังไม่หมดอายุ · เตือนเมื่อหมดภายใน 30 วัน · ไม่พร้อมขายลากเข้ากลุ่มไม่ได้</li>
      <li><span class="tag warn">สมมติฐาน</span> การจับคู่ชื่อช่องทาง Porsche ↔ CHN0x ใช้คำในชื่อ — ควรให้ BA ยืนยัน หรือทำตาราง mapping</li>
    </ul>
  </div>

  <h2>สิ่งที่สร้าง</h2>
  <div class="grid2">
    <div class="card">
      <h3><span class="tag be">BE</span> Tesla Admin API (<code>254a06f</code>)</h3>
      <ul class="plain">
        <li><code>SellerV2Controller</code> <code>/api/v2/people</code>: workspaces · board · groups (สร้าง / แก้ / ลบ) · move · import · bind / unbind · referrals · copy · audit</li>
        <li><code>SellerV2Service</code> + <code>SellerV2Rules</code> (กติกาเดียวกับ Mock prototype) · <code>SellerV2Repository</code> — ทุกการเขียนหลายแถวอยู่ใน transaction เดียวกับ Audit</li>
        <li>V038: <code>T_SELLER_GROUP</code> (ชื่อห้ามซ้ำใน Workspace · ลบแบบ soft) · <code>_MEMBER</code> (1 คน 1 กลุ่มต่อ Workspace) · <code>_CAMPAIGN</code> · <code>T_SELLER_AUDIT_LOG</code> (เพิ่มได้อย่างเดียว)</li>
        <li>คัดลอกกลุ่มกันชนกันด้วย advisory lock · ชื่อซ้ำจับจาก unique index → 409</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="tag fe">FE</span> TESLA Management v2 (<code>ee2603a</code>)</h3>
      <ul class="plain">
        <li>14 route <code>/api/people/*</code> → Tesla · <code>/api/people</code> เป็นเส้นของ Tesla (ไม่ตกไป Mock)</li>
        <li><code>dateTime()</code> อ่านเวลา ISO ของ API v2 ได้ (เดิมแสดงเพี้ยน)</li>
        <li>คอลัมน์ใบอนุญาต: "มี (ไม่เก็บเลขที่ · PDPA)" แทนการเขียน "ไม่ต้องมี" ผิด ๆ</li>
        <li>สคริปต์ <code>test_seller_api.py</code> (30 กรณี · เก็บกวาดเอง) + <code>mask-names.js</code> ปิดชื่อก่อนถ่ายรูป</li>
      </ul>
    </div>
  </div>

  <h2>ผลทดสอบ API บน DEV ({api_pass}/{api_total})</h2>
  <p class="muted">Workspace ทดสอบ {e(res["workspace"])} · ปลายทางคัดลอก {e(res["copyTarget"])} · รันเมื่อ {e(res["at"])} · กลุ่มทดสอบ "ทดสอบ-…" ถูกลบหลังจบ (ประวัติยังอยู่)</p>
  <div class="tablewrap"><table>
    <thead><tr><th>#</th><th>กรณี</th><th>ผลที่ได้</th><th>ผล</th></tr></thead>
    <tbody>
{api_rows}
    </tbody>
  </table></div>

  <h2>ผลทดสอบผ่านหน้าจอ (7/7)</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>#</th><th>กรณี</th><th>ผลที่ได้</th><th>ผล</th></tr></thead>
    <tbody>
{ui_rows}
    </tbody>
  </table></div>

  <h2>รูปหน้าจอ</h2>
  <div class="shots">
{fig}
  </div>

  <h2>งานเช้า–บ่ายวันนี้ (สรุป)</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>งาน</th><th>ผล</th><th>Commit</th></tr></thead>
    <tbody>
      <tr><td>ปิด Campaign ถาวร + คืน Stock</td><td>DEV 11/11 · คู่มือ 1.2 · รายงาน 16</td><td>BE fd73075 · FE 499f37c</td></tr>
      <tr><td>ประเภท Campaign (MS-01) จาก Tesla · ลบ KEEP_LOCAL</td><td>Wizard 9 การ์ด (ไม่มี RIDER) · ตัวกรองรายการ · 702/702</td><td>BE 300eba2 · FE 5ad1aa7</td></tr>
      <tr><td>เมนู Seller บน Tesla (รายงานนี้)</td><td>API {api_pass}/{api_total} · หน้าจอ 7/7 · 727/727</td><td>BE 254a06f · FE ee2603a</td></tr>
    </tbody>
  </table></div>

  <h2>สถานะข้อมูลบน DEV</h2>
  <div class="tablewrap"><table>
    <tbody>
      <tr><td>V038</td><td>4 ตารางใหม่ (ลงแล้ว) · rollback = <code>V038__rollback.sql</code></td></tr>
      <tr><td>กลุ่ม "ทีมทดสอบ UI"</td><td>ST000027 × CHN08 · สมาชิก 3 คน · ผูก CMP25690011 — <b>ทิ้งไว้ให้ดูพรุ่งนี้</b> (ลบได้ที่หน้ารายละเอียดกลุ่ม)</td></tr>
      <tr><td>กลุ่ม "ทดสอบ-…"</td><td>ลบแล้ว (soft delete) · Audit ยังอยู่ใน T_SELLER_AUDIT_LOG</td></tr>
    </tbody>
  </table></div>

  <h2>ข้อจำกัด / งานต่อ</h2>
  <div class="card">
    <ul class="plain">
      <li><span class="tag warn">ตัดสินใจ</span> ชื่อช่องทาง Porsche (Bancassurance / Broker / Direct) ↔ CHN0x — ตอนนี้เทียบคำในชื่อ</li>
      <li><span class="tag warn">ตัดสินใจ</span> พนักงานขาย (EMPLOYEE) มาจากไหน — ตอนนี้ใช้ Direct / Marketer ใน M_AGENT</li>
      <li>Referral: ยังไม่มีแหล่งยอดคลิก / ใบคำขอ / กรมธรรม์ · ลิงก์เป็นแบบคำนวณ (ไม่เก็บ token)</li>
      <li>API ยังไม่ตรวจ Role (Seller Admin) — รวมในงาน "ตรวจ Role จาก UAM"</li>
      <li>V038 ต้องให้ DBA ตรวจก่อน merge เข้า <code>uat</code> (เหมือน V035–V037)</li>
      <li>การผูก Campaign กับกลุ่มยังไม่ถูกใช้ตอนคำนวณสิทธิ์ (รอบัญชีการแจกสิทธิ์)</li>
      <li>ข้อมูล M_AGENT บน DEV sync ล่าสุด 24/09/2026 (8 คน) — ถ้า Porsche เพิ่มคนต้อง sync ใหม่ (<code>POST /api/v1/agent/sync</code>)</li>
    </ul>
  </div>

  <footer>ข้อมูลทั้งหมดเป็นข้อมูลทดสอบบน DEV · ไม่มีข้อมูลลูกค้าจริง · ชื่อผู้ขายในรูปถูกปิดไว้ · สร้างโดย Claude Code ร่วมกับเจ้าของงาน · ตรวจทานก่อนนำไปใช้อ้างอิง</footer>
</main>
</body>
</html>
"""
out = DOCS / "17-seller-tesla-report.html"
out.write_text(page, encoding="utf-8")
print("->", out)
