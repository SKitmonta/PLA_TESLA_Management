"""Sample Terms & Conditions PDFs (Thai) per package — printed with headless Chrome. Clearly marked as sample documents."""
import pathlib
import subprocess

S = pathlib.Path(__file__).resolve().parent
OUT = S / "assets"
OUT.mkdir(exist_ok=True)
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"

PKGS = {
    "CT000005": ("ST000007", "แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า ชนิดไม่มีเงินปันผล", "Max Ten One 10/1 Xtra", "CHN04 Direct Online", "ประกันแบบสะสมทรัพย์"),
    "CT000009": ("ST000024", "แม็กซ์ เท็น เท็น เอ็กซ์ตร้า พลัส", "Max 10/10 Xtra Plus", "CHN04 Direct Online", "ประกันแบบสะสมทรัพย์"),
    "CT000004": ("ST000006", "แฮปปี้ แวลู 90/20 ชนิดไม่มีเงินปันผล", "Happy value 90/20", "CHN01 Agent", "ประกันชีวิตตลอดชีพ"),
    "CT000013": ("ST000011", "แอสเสท ช้อยส์ 95/60 ชนิดไม่มีเงินปันผล", "Asset Choice 95/60", "CHN01 Agent", "ประกันชีวิตตลอดชีพ"),
    "CT000008": ("ST000022", "พีเอ ชิลล์แคร์", "PA Shield Care", "CHN01 Agent", "ประกันอุบัติเหตุส่วนบุคคล"),
    "CT000015": ("ST000030", "อุบัติเหตุ ทดสอบ", "PA Test 001", "CHN07 Agent Online", "ประกันอุบัติเหตุส่วนบุคคล"),
}

TPL = """<!doctype html><html lang="th"><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 18mm 16mm; }}
body {{ font-family: 'Leelawadee UI', Tahoma, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.6; }}
.band {{ background: #00317a; color: #fff; padding: 14px 18px; border-radius: 8px; }}
.band h1 {{ margin: 0; font-size: 18pt; }} .band p {{ margin: 2px 0 0; font-size: 10pt; opacity: .9; }}
.warn {{ margin: 12px 0; padding: 8px 12px; border: 1px solid #f59e0b; background: #fffbeb; color: #92400e; border-radius: 6px; font-size: 10pt; }}
h2 {{ color: #00317a; font-size: 13pt; border-bottom: 2px solid #e2edff; padding-bottom: 3px; margin-top: 18px; }}
td {{ padding: 4px 8px; border-bottom: 1px solid #e5e7eb; }} table {{ border-collapse: collapse; width: 100%; }}
footer {{ margin-top: 24px; font-size: 9pt; color: #6b7280; }}
</style></head><body>
<div class="band"><h1>เงื่อนไขทั่วไป — {th}</h1><p>{en} · {pkg} · {chn}</p></div>
<div class="warn"><b>เอกสารตัวอย่างสำหรับทดสอบระบบ (DEV)</b> — ไม่ใช่เงื่อนไขกรมธรรม์จริง ห้ามใช้อ้างอิงกับลูกค้า</div>
<table><tr><td>ประเภทสินค้า</td><td>{sub}</td></tr><tr><td>รหัส Package</td><td>{pkg}</td></tr><tr><td>ช่องทางจำหน่าย</td><td>{chn}</td></tr></table>
<h2>1. ความคุ้มครอง</h2><p>บริษัทจะจ่ายผลประโยชน์ตามที่ระบุในตารางผลประโยชน์ของกรมธรรม์ ภายใต้เงื่อนไขและข้อยกเว้นของสัญญา (ข้อความตัวอย่าง)</p>
<h2>2. การชำระเบี้ยประกันภัย</h2><p>ผู้เอาประกันภัยต้องชำระเบี้ยประกันภัยตามงวดที่กำหนด หากไม่ชำระภายในระยะเวลาผ่อนผัน สัญญาอาจสิ้นผลบังคับ (ข้อความตัวอย่าง)</p>
<h2>3. ข้อยกเว้นความคุ้มครอง</h2><p>รายละเอียดข้อยกเว้นเป็นไปตามที่ระบุในกรมธรรม์ประกันภัยฉบับจริง (ข้อความตัวอย่าง)</p>
<h2>4. ระยะเวลาพิจารณากรมธรรม์</h2><p>ผู้เอาประกันภัยสามารถขอยกเลิกกรมธรรม์ภายในระยะเวลาที่กฎหมายกำหนด (ข้อความตัวอย่าง)</p>
<footer>สร้างโดยระบบทดสอบ TESLA Management · 5 ต.ค. 2569</footer>
</body></html>"""

for code, (pkg, th, en, chn, sub) in PKGS.items():
    html = S / f"tc-{code}.html"
    html.write_text(TPL.format(th=th, en=en, pkg=pkg, chn=chn, sub=sub), encoding="utf-8")
    pdf = OUT / f"tc-{code}.pdf"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--user-data-dir={S / 'pdf-profile'}",
                    f"--print-to-pdf={pdf}", html.as_uri()], capture_output=True, timeout=90)
    html.unlink()
    print(code, pdf.name, pdf.stat().st_size, "bytes")
