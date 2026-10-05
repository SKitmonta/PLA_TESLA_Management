"""Update every editable content in Package management (DEV, Tesla API) through the real editor page:
fill only empty fields, upload real files ONE AT A TIME (>= 20 s apart, new file names only — antivirus), Save, verify.
Usage: python update_all.py [CT000009 ...]   (no args = all)"""
import base64
import json
import os
import pathlib
import subprocess
import sys
import time

S = pathlib.Path(__file__).resolve().parent
J = S / "js"
CDP = r"C:/Users/arthit/.claude/skills/browser-use/scripts/cdp.py"
PORTFILE = str(S / "hl-profile" / "DevToolsActivePort")
ENV = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
LIB = (J / "lib.js").read_text(encoding="utf-8")
UPLOAD_GAP = 20
RESULTS = S / "update-results.json"
_last_upload = [0.0]


def cdp(*args, timeout=150):
    r = subprocess.run(["python", CDP, *args, "--portfile", PORTFILE, "--match", "localhost:4200"],
                       capture_output=True, text=True, encoding="utf-8", env=ENV, timeout=timeout)
    return r.stdout.strip() or r.stderr.strip()


def run_js(prelude: str, body_file: str, timeout=150):
    body = (J / body_file).read_text(encoding="utf-8")
    src = "(async () => {\n" + LIB + "\ntry {\nconst __r = await (async () => {\n" + prelude + "\n" + body + "\n})();\nreturn JSON.stringify(__r);\n} catch (e) { return JSON.stringify({ error: 'STEP ERROR: ' + e.message }); }\n})()"
    tmp = J / f".run-{os.getpid()}.js"
    tmp.write_text(src, encoding="utf-8")
    try:
        out = cdp("js", "--file", str(tmp), timeout=timeout)
    finally:
        tmp.unlink(missing_ok=True)
    try:
        return json.loads(json.loads(out))
    except Exception:
        return {"raw": out[:500]}


def b64(name):
    return base64.b64encode((S / "assets" / name).read_bytes()).decode()


# ---------------------------------------------------------------- uploads per template
def ol_ob_uploads(c):
    en, th = c["en"], c["th"]
    return [
        dict(sel="#sec-TH input[type=file]", path="card.image", name="thumb.jpg", w=800, h=600, title=en, sub=th),
        dict(sel="#sec-BN input[type=file]", idx=0, path="hero.bgDesktop", name="banner-desktop.jpg", w=1920, h=640, title=en, sub=c["headline"]),
        dict(sel="#sec-BN input[type=file]", idx=1, path="hero.bgMobile", name="banner-mobile.jpg", w=750, h=900, title=en, sub=th),
        dict(sel="#sec-KF input[type=file]", path="featureIcon", name="icon.jpg", w=800, h=600, title="Key Features", sub=en),
        dict(sel="#sec-DOC input[type=file]", docs=True, name=f"terms-{c['pkg']}.pdf", pdf=f"tc-{c['code']}.pdf"),
    ]


def agent_uploads(c):
    en, th = c["en"], c["th"]
    return [
        dict(sel="app-sec-hero-banner input[type=file]", idx=0, path="hero.bgDesktop", name="banner-desktop.jpg", w=1920, h=640, title=en, sub=c["headline"]),
        dict(sel="app-sec-hero-banner input[type=file]", idx=1, path="hero.bgMobile", name="banner-mobile.jpg", w=750, h=900, title=en, sub=th),
        dict(sel="app-sec-product-card input[type=file]", path="card.image", name="card.jpg", w=800, h=600, title=en, sub=th),
        dict(sel="app-sec-sticky-bar input[type=file]", path="sticky.icon", name="icon.jpg", w=800, h=600, title=en, sub="Product icon"),
        dict(sel="app-sec-summary input[type=file]", path="summary.attachment", name=f"terms-{c['pkg']}.pdf", pdf=f"tc-{c['code']}.pdf"),
    ]


SAMPLE = " (ข้อมูลตัวอย่าง)"

CONTENTS = [
    # ---------------- OL_OB
    dict(code="CT000005", pkg="ST000007", template="OL_OB", new_version=True, en="Max Ten One 10/1 Xtra", th="แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า",
         headline="จ่ายครั้งเดียว คุ้มครอง 10 ปี",
         set={"display.startDate": "2026-10-06", "page.slug": "max-ten-one-10-1-xtra", "page.category": "SAVING",
              "page.seoDescription": "ประกันออมทรัพย์ จ่ายเบี้ยครั้งเดียว คุ้มครอง 10 ปี สมัครออนไลน์ได้ ไม่ต้องตรวจสุขภาพ" + SAMPLE,
              "tagFilter.featureTags": ["NO_HEALTH_Q", "SHORT_PAY"],
              "card.bullets": ["จ่ายเบี้ยครั้งเดียวจบ", "คุ้มครอง 10 ปี", "ไม่ต้องตรวจสุขภาพ"],
              "hero.headline": "จ่ายครั้งเดียว คุ้มครอง 10 ปี", "hero.subHeadline": "ออมง่าย สมัครออนไลน์ได้ทันที",
              "advantages.header": "ทำไมต้อง Max Ten One 10/1 Xtra"},
         kf=["SINGLE_PREMIUM", "LIFE_COVERAGE", "EASY_TO_SIGN_UP"], ka=["EASY_BUY", "NO_HEALTH_CHECK", "TAX_DEDUCTIBLE"]),
    dict(code="CT000009", pkg="ST000024", template="OL_OB", en="Max 10/10 Xtra Plus", th="แม็กซ์ เท็น เท็น เอ็กซ์ตร้า พลัส",
         headline="ออม 10 ปี คุ้มครอง 10 ปี",
         set={"display.startDate": "2026-10-06", "page.slug": "max-10-10-xtra-plus", "page.category": "SAVING",
              "page.seoDescription": "ประกันออมทรัพย์ ชำระเบี้ย 10 ปี คุ้มครอง 10 ปี ไม่ต้องตรวจสุขภาพ" + SAMPLE,
              "tagFilter.featureTags": ["TAX_BENEFIT", "GUARANTEE"],
              "card.bullets": ["ชำระเบี้ย 10 ปี", "คุ้มครอง 10 ปี", "ไม่ต้องตรวจสุขภาพ"],
              "hero.headline": "ออม 10 ปี คุ้มครอง 10 ปี", "hero.subHeadline": "เก็บเงินอย่างมีวินัย พร้อมความคุ้มครองชีวิต",
              "advantages.header": "ทำไมต้อง Max 10/10 Xtra Plus"},
         kf=["LIFE_COVERAGE", "DEATH_COVERAGE", "TAX"], ka=["TOTAL_AMOUNT_RECEIVED", "GUARANTEE", "TAX_2"]),
    dict(code="CT000011", pkg="ST000025", template="OL_OB", en="Max Ten One 10/1 Xtra", th="แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า",
         headline="จ่ายครั้งเดียว คุ้มครอง 10 ปี",
         set={"tagFilter.featureTags": ["NO_HEALTH_Q", "SHORT_PAY"],
              "card.bullets": ["จ่ายเบี้ยครั้งเดียวจบ", "คุ้มครอง 10 ปี", "สมัครผ่านตัวแทนออนไลน์"],
              "hero.subHeadline": "สมัครผ่านตัวแทนออนไลน์ได้ทันที", "advantages.header": "ทำไมต้อง Max Ten One 10/1 Xtra"},
         kf=["SINGLE_PREMIUM", "LIFE_COVERAGE", "EASY_TO_SIGN_UP"], ka=["EASY_BUY", "EASY_REGISTER", "FAST_APPROVAL"]),
    dict(code="CT000012", pkg="ST000026", template="OL_OB", en="Max Ten One 10/1 Xtra", th="แม็กซ์ เท็น วัน 10/1 เอ็กซ์ตร้า",
         headline="จ่ายครั้งเดียว คุ้มครอง 10 ปี",
         set={"display.startDate": "2026-10-06", "page.category": "SAVING",
              "page.seoDescription": "ประกันออมทรัพย์ จ่ายเบี้ยครั้งเดียว คุ้มครอง 10 ปี ผ่านโบรกเกอร์ออนไลน์" + SAMPLE,
              "tagFilter.featureTags": ["NO_HEALTH_Q", "SHORT_PAY"],
              "card.bullets": ["จ่ายเบี้ยครั้งเดียวจบ", "คุ้มครอง 10 ปี", "ไม่ต้องตรวจสุขภาพ"],
              "hero.subHeadline": "ซื้อผ่านโบรกเกอร์ออนไลน์ได้สะดวก", "advantages.header": "ทำไมต้อง Max Ten One 10/1 Xtra"},
         kf=["SINGLE_PREMIUM", "LIFE_COVERAGE", "EASY_TO_SIGN_UP"], ka=["EASY_BUY", "NO_HEALTH_CHECK", "GUARANTEE"]),
    # ---------------- AGENT
    dict(code="CT000004", pkg="ST000006", template="AGENT", en="Happy value 90/20", th="แฮปปี้ แวลู 90/20",
         headline="คุ้มครองถึงอายุ 90 ปี ชำระเบี้ย 20 ปี",
         set={"display.startDate": "2026-10-06", "page.slug": "happy-value-90-20", "page.category": "ตลอดชีพ",
              "page.seoDescription": "ประกันชีวิตตลอดชีพ คุ้มครองถึงอายุ 90 ปี ชำระเบี้ย 20 ปี" + SAMPLE,
              "hero.headline": "คุ้มครองถึงอายุ 90 ปี ชำระเบี้ย 20 ปี", "hero.subHeadline": "วางแผนมรดกให้คนที่คุณรัก",
              "keyFeatures": [{"icon": "", "topic": "คุ้มครองถึงอายุ", "value": "90 ปี"}, {"icon": "", "topic": "ระยะเวลาชำระเบี้ย", "value": "20 ปี"}, {"icon": "", "topic": "อายุที่รับประกัน", "value": "1 วัน – 65 ปี"}],
              "sticky.minPremium": 12000, "calculator.minPremium": 12000, "calculator.maxPremium": 1000000,
              "highlights.header": "จุดเด่นของแผน", "highlights.cards": [{"image": "", "title": "คุ้มครองยาว", "value": "ถึงอายุ 90 ปี"}, {"image": "", "title": "ชำระเบี้ยสั้น", "value": "20 ปี"}, {"image": "", "title": "มรดก", "value": "ส่งต่อความมั่งคั่ง"}],
              "important.coverageYears": 20, "benefits.samplePremium": 12000, "benefits.note": "ตัวเลขเพื่อประกอบการอธิบายเท่านั้น" + SAMPLE,
              "card.bullets": ["คุ้มครองถึงอายุ 90 ปี", "ชำระเบี้ย 20 ปี", "ส่งต่อมรดก"],
              "sellingPoints.tags": ["วางแผนมรดก", "ครอบครัว"], "sellingPoints.points": [{"point": "คุ้มครองยาวถึงอายุ 90 ปี", "how": "เหมาะกับลูกค้าที่ต้องการสร้างมรดก"}],
              "sellingPoints.faqs": [{"q": "ต้องตรวจสุขภาพไหม", "a": "ตามเกณฑ์ของบริษัท"}], "social.hashtag": "#HappyValue #PhillipLife"}),
    dict(code="CT000013", pkg="ST000011", template="AGENT", en="Asset Choice 95/60", th="แอสเสท ช้อยส์ 95/60",
         headline="คุ้มครองถึงอายุ 95 ปี ชำระเบี้ยถึงอายุ 60 ปี",
         set={"display.startDate": "2026-10-06", "page.slug": "asset-choice-95-60", "page.category": "ตลอดชีพ",
              "page.seoDescription": "ประกันชีวิตตลอดชีพ คุ้มครองถึงอายุ 95 ปี ชำระเบี้ยถึงอายุ 60 ปี" + SAMPLE,
              "hero.headline": "คุ้มครองถึงอายุ 95 ปี ชำระเบี้ยถึงอายุ 60 ปี", "hero.subHeadline": "สร้างหลักประกันให้ครอบครัวระยะยาว",
              "keyFeatures": [{"icon": "", "topic": "คุ้มครองถึงอายุ", "value": "95 ปี"}, {"icon": "", "topic": "ชำระเบี้ยถึงอายุ", "value": "60 ปี"}, {"icon": "", "topic": "อายุที่รับประกัน", "value": "1 วัน – 55 ปี"}],
              "sticky.minPremium": 15000, "calculator.minPremium": 15000, "calculator.maxPremium": 2000000,
              "highlights.header": "จุดเด่นของแผน", "highlights.cards": [{"image": "", "title": "คุ้มครองยาว", "value": "ถึงอายุ 95 ปี"}, {"image": "", "title": "ชำระเบี้ย", "value": "ถึงอายุ 60 ปี"}, {"image": "", "title": "ความมั่นคง", "value": "หลักประกันครอบครัว"}],
              "important.coverageYears": 30, "benefits.samplePremium": 15000, "benefits.note": "ตัวเลขเพื่อประกอบการอธิบายเท่านั้น" + SAMPLE,
              "card.bullets": ["คุ้มครองถึงอายุ 95 ปี", "ชำระเบี้ยถึงอายุ 60 ปี", "หลักประกันครอบครัว"],
              "sellingPoints.tags": ["หลักประกันครอบครัว", "วัยทำงาน"], "sellingPoints.points": [{"point": "คุ้มครองถึงอายุ 95 ปี", "how": "เหมาะกับหัวหน้าครอบครัววัยทำงาน"}],
              "sellingPoints.faqs": [{"q": "ชำระเบี้ยถึงเมื่อไร", "a": "ถึงอายุ 60 ปี"}], "social.hashtag": "#AssetChoice #PhillipLife"}),
    dict(code="CT000008", pkg="ST000022", template="AGENT", en="PA Shield Care", th="พีเอ ชิลล์แคร์",
         headline="คุ้มครองอุบัติเหตุ 24 ชั่วโมง",
         set={"display.startDate": "2026-10-06", "page.slug": "pa-shield-care", "page.category": "อุบัติเหตุ",
              "page.seoDescription": "ประกันอุบัติเหตุส่วนบุคคล คุ้มครอง 24 ชั่วโมงทั่วโลก" + SAMPLE,
              "hero.headline": "คุ้มครองอุบัติเหตุ 24 ชั่วโมง", "hero.subHeadline": "อุ่นใจทุกการเดินทาง",
              "keyFeatures": [{"icon": "", "topic": "ความคุ้มครอง", "value": "24 ชั่วโมงทั่วโลก"}, {"icon": "", "topic": "อายุที่รับประกัน", "value": "30 วัน – 70 ปี"}, {"icon": "", "topic": "การตรวจสุขภาพ", "value": "ตอบคำถามสุขภาพ"}],
              "sticky.minPremium": 1500, "calculator.minPremium": 1500, "calculator.maxPremium": 50000,
              "highlights.header": "จุดเด่นของแผน", "highlights.cards": [{"image": "", "title": "คุ้มครอง", "value": "24 ชั่วโมง"}, {"image": "", "title": "ค่ารักษา", "value": "จากอุบัติเหตุ"}, {"image": "", "title": "สมัครง่าย", "value": "ตอบคำถามสุขภาพ"}],
              "important.coverageYears": 1, "benefits.samplePremium": 1500, "benefits.note": "ตัวเลขเพื่อประกอบการอธิบายเท่านั้น" + SAMPLE,
              "card.bullets": ["คุ้มครอง 24 ชั่วโมง", "ค่ารักษาจากอุบัติเหตุ", "สมัครง่าย"],
              "sellingPoints.tags": ["อุบัติเหตุ", "เดินทาง"], "sellingPoints.points": [{"point": "คุ้มครองอุบัติเหตุ 24 ชั่วโมง", "how": "เหมาะกับลูกค้าที่เดินทางบ่อย"}],
              "sellingPoints.faqs": [{"q": "ต้องตรวจสุขภาพไหม", "a": "ตอบคำถามสุขภาพ"}], "social.hashtag": "#PAShieldCare #PhillipLife"}),
    # ---------------- OL_PA
    dict(code="CT000015", pkg="ST000030", template="OL_PA", en="PA Test 001", th="อุบัติเหตุ ทดสอบ",
         headline="คุ้มครองอุบัติเหตุ ซื้อออนไลน์ได้ทันที",
         set={"display.startDate": "2026-10-06", "page.slug": "pa-test-001",
              "page.seoDescription": "ประกันอุบัติเหตุส่วนบุคคล ซื้อออนไลน์ผ่านตัวแทน" + SAMPLE,
              "hero.headline": "คุ้มครองอุบัติเหตุ ซื้อออนไลน์ได้ทันที", "hero.subHeadline": "ความคุ้มครองที่เลือกได้ตามแผน",
              "plans.0.premium": 1200, "quickFacts.premium": 1200, "quickFacts.coveragePeriod": "1 ปี",
              "coverage": [{"topic": "เสียชีวิต สูญเสียอวัยวะ ทุพพลภาพถาวรสิ้นเชิง (อ.บ.1)", "amount": 500000, "unit": "บาท"}, {"topic": "ค่ารักษาพยาบาลจากอุบัติเหตุ", "amount": 50000, "unit": "บาท/ครั้ง"}],
              "coverageTable.header": "ตารางผลประโยชน์",
              "coverageTable.groups": [{"name": "ความคุ้มครองหลัก", "rows": [{"name": "อ.บ.1", "amounts": {"PAN003": 500000}}, {"name": "ค่ารักษาพยาบาล", "amounts": {"PAN003": 50000}}]}],
              "sticky.minPremium": 1200, "calculator.minPremium": 1200, "calculator.maxPremium": 20000,
              "highlights.header": "จุดเด่นของแผน", "highlights.cards": [{"image": "", "title": "อ.บ.1", "value": "500,000 บาท"}, {"image": "", "title": "ค่ารักษา", "value": "50,000 บาท/ครั้ง"}, {"image": "", "title": "ระยะเวลา", "value": "1 ปี"}],
              "important.coverageYears": 1, "card.bullets": ["อ.บ.1 สูงสุด 500,000 บาท", "ค่ารักษา 50,000 บาท/ครั้ง", "ซื้อออนไลน์ได้ทันที"]}),
]


def save_results(res):
    RESULTS.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")


def process(c, res):
    code = c["code"]
    print(f"\n===== {code} ({c['template']}) {c['en']}", flush=True)
    r = res.setdefault(code, {})
    print(cdp("goto", f"http://localhost:4200/package/add/{code}", "--wait", ".sec-nav", "--settle", "3"), flush=True)
    if c.get("new_version"):
        st = run_js("", "nv-body.js")
        print("new version:", st, flush=True)
        r["newVersion"] = st
        print(cdp("goto", f"http://localhost:4200/package/add/{code}", "--wait", ".sec-nav", "--settle", "3"), flush=True)
    fill = run_js("const PLAN = " + json.dumps(c, ensure_ascii=False) + ";", "fill-body.js")
    print("fill:", fill, flush=True)
    r["fill"] = fill
    if fill.get("skipped") or fill.get("error"):
        save_results(res)
        return
    # save the text first — uploads may take a while
    r["save1"] = run_js("", "save-body.js")
    print("save1:", r["save1"].get("toasts"), flush=True)
    ups = ol_ob_uploads(c) if c["template"] == "OL_OB" else agent_uploads(c)
    r["uploads"] = []
    for u in ups:
        u = dict(u, tag="PhillipLife · " + c["pkg"])
        if "pdf" in u:
            pdf = u.pop("pdf")
            if not (S / "assets" / pdf).exists():
                # no sample PDF made for this content (it already had documents) → nothing to upload
                print("upload", u["name"], "->", {"skipped": "no sample " + pdf}, flush=True)
                r["uploads"].append({"name": u["name"], "skipped": "no sample " + pdf})
                continue
            u["b64"] = b64(pdf)
        wait = UPLOAD_GAP - (time.time() - _last_upload[0])
        if wait > 0:
            time.sleep(wait)
        out = run_js("const UP = " + json.dumps(u, ensure_ascii=False) + ";", "upload-body.js", timeout=120)
        if out.get("ok"):
            _last_upload[0] = time.time()
        short = {k: v for k, v in out.items() if k != "b64"}
        print("upload", u["name"], "->", short, flush=True)
        r["uploads"].append({"name": u["name"], **short})
        save_results(res)
    r["save"] = run_js("", "save-body.js")
    print("save:", json.dumps(r["save"], ensure_ascii=False), flush=True)
    save_results(res)


def main():
    only = set(sys.argv[1:])
    res = json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else {}
    for c in CONTENTS:
        if only and c["code"] not in only:
            continue
        process(c, res)
    save_results(res)
    print("\nDONE", flush=True)


if __name__ == "__main__":
    main()
