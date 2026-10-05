"""Upload API test — POST /tesla-admin/api/v1/image/upload, fired with fetch() from inside the app page (headless Chrome, CDP).
Negative cases are rejected before the file is stored → run back to back.
Positive cases store a real file → ONE AT A TIME, >= 20 s apart (antivirus), under the dummy package APITEST01 only.
Usage: python test_upload_api.py [U-01 ...]   (no args = all) · results → upload-api-results.json"""
import json
import sys
import time

from update_all import run_js, S

RESULTS = S / "upload-api-results.json"
GAP = 20
PKG = dict(PackageCode="APITEST01", ChannelCode="CHN04", VersionNo=1)
MB = 1024 * 1024


def form(**kw):
    f = dict(PKG, Kind="image", Slot="thumb_main", LangCode="TH")
    f.update(kw)
    return {k: v for k, v in f.items() if v is not None}


JPG = dict(make="brand", name="t.jpg", type="image/jpeg", w=800, h=600)
PNG = dict(make="canvas", name="t.png", type="image/png")
PDF = dict(make="pdf", name="t.pdf", type="application/pdf")
SVG_OK = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="24" fill="#00317a"/><text x="60" y="70" font-size="20" fill="#f5a623" text-anchor="middle">API</text></svg>'

# (id, description, CASE, expect http, expect code, stores a file?)
CASES = [
    # ---------------- A. rejected
    ("U-01a", "ไม่แนบไฟล์", dict(form=form(), file=dict(make="none")), 400, "TS_FILE_E_0001", False),
    ("U-01b", "ไฟล์ 0 byte", dict(form=form(), file=dict(make="empty", name="t.png", type="image/png")), 400, "TS_FILE_E_0001", False),
    ("U-02a", "PackageCode ตัวพิมพ์เล็ก", dict(form=form(PackageCode="apitest01"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-02b", "PackageCode มี ../ (path traversal)", dict(form=form(PackageCode="../ST000024"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-02c", "PackageCode ยาว 51 ตัว", dict(form=form(PackageCode="A" * 51), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-02d", "ChannelCode มีขีด (-)", dict(form=form(ChannelCode="CHN-04"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-02e", "ไม่ส่ง ChannelCode", dict(form=form(ChannelCode=None), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-03", "VersionNo = 0", dict(form=form(VersionNo=0), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-04a", "Kind ไม่รู้จัก (video)", dict(form=form(Kind="video"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-04b", "Slot ไม่รู้จัก (hero_bg)", dict(form=form(Slot="hero_bg"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-05a", "ไม่ส่ง LangCode (banner_desktop)", dict(form=form(Slot="banner_desktop", LangCode=None), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-05b", "LangCode = JP", dict(form=form(LangCode="JP"), file=PNG), 400, "TS_VAL_E_0001", False),
    ("U-06a", "tc_doc ไม่ส่ง Index", dict(form=form(Kind="pdf", Slot="tc_doc"), file=PDF), 400, "TS_VAL_E_0001", False),
    ("U-06b", "tc_doc Index = 0", dict(form=form(Kind="pdf", Slot="tc_doc", Index=0), file=PDF), 400, "TS_VAL_E_0001", False),
    ("U-06c", "tc_doc Index = 11", dict(form=form(Kind="pdf", Slot="tc_doc", Index=11), file=PDF), 400, "TS_VAL_E_0001", False),
    ("U-07a", "รูป 5 MB + 1 byte", dict(form=form(), file=dict(make="padpng", name="big.png", type="image/png", total=5 * MB + 1)), 413, "TS_FILE_E_0002", False),
    ("U-07b", "PDF 10 MB + 1 byte", dict(form=form(Kind="pdf", Slot="tc_doc", Index=1), file=dict(make="pad", head="%PDF-1.4\n", name="big.pdf", type="application/pdf", total=10 * MB + 1)), 413, "TS_FILE_E_0002", False),
    ("U-07c", "PDF 12 MB (เกินเพดาน multipart 11 MB)", dict(form=form(Kind="pdf", Slot="tc_doc", Index=1), file=dict(make="pad", head="%PDF-1.4\n", name="huge.pdf", type="application/pdf", total=12 * MB)), 413, "TS_FILE_E_0002", False),
    ("U-08a", "นามสกุล .exe", dict(form=form(), file=dict(make="padpng", name="t.exe", type="image/png", total=64)), 415, "TS_FILE_E_0003", False),
    ("U-08b", "นามสกุล .txt", dict(form=form(), file=dict(make="text", text="hello", name="t.txt", type="text/plain")), 415, "TS_FILE_E_0003", False),
    ("U-09", "นามสกุล .png แต่ MIME text/plain", dict(form=form(), file=dict(make="padpng", name="t.png", type="text/plain", total=64)), 415, "TS_FILE_E_0003", False),
    ("U-10a", "ปลอมเป็น PNG (เนื้อไฟล์ PDF)", dict(form=form(), file=dict(make="pdf", name="t.png", type="image/png")), 400, "TS_FILE_E_0004", False),
    ("U-10b", "ปลอมเป็น JPG (เนื้อไฟล์ข้อความ)", dict(form=form(), file=dict(make="text", text="MZ not an image", name="t.jpg", type="image/jpeg")), 400, "TS_FILE_E_0004", False),
    ("U-10c", "ปลอมเป็น PDF (เนื้อไฟล์ PNG)", dict(form=form(Kind="pdf", Slot="tc_doc", Index=1), file=dict(make="canvas", name="t.pdf", type="application/pdf")), 400, "TS_FILE_E_0004", False),
    ("U-11a", "SVG มี <script>", dict(form=form(), file=dict(make="text", text='<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', name="t.svg", type="image/svg+xml")), 400, "TS_FILE_E_0004", False),
    ("U-11b", "SVG มี onload=", dict(form=form(), file=dict(make="text", text='<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="1" height="1"/></svg>', name="t.svg", type="image/svg+xml")), 400, "TS_FILE_E_0004", False),
    ("U-11c", "SVG มี javascript: ลิงก์", dict(form=form(), file=dict(make="text", text='<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect width="9" height="9"/></a></svg>', name="t.svg", type="image/svg+xml")), 400, "TS_FILE_E_0004", False),
    ("U-11d", "ไฟล์ .svg ที่ไม่ใช่ SVG", dict(form=form(), file=dict(make="text", text="<html><body>x</body></html>", name="t.svg", type="image/svg+xml")), 400, "TS_FILE_E_0004", False),
    ("U-12", "Kind=pdf แต่ส่งรูป .png", dict(form=form(Kind="pdf", Slot="tc_doc", Index=1), file=PNG), 415, "TS_FILE_E_0003", False),
    # ---------------- B. stored (APITEST01 / CHN04 / v1) — one at a time
    ("U-13a", "banner_desktop TH (.jpg 1920×640)", dict(form=form(Slot="banner_desktop"), file=dict(JPG, w=1920, h=640, name="banner-desktop.jpg"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-13b", "banner_mobile TH (.jpg 750×900)", dict(form=form(Slot="banner_mobile"), file=dict(JPG, w=750, h=900, name="banner-mobile.jpg"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-13c", "thumb_main TH (.png)", dict(form=form(), file=dict(PNG, w=800, h=600), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-14", "product_icon ไม่ส่ง LangCode (.png)", dict(form=form(Slot="product_icon", LangCode=None), file=dict(PNG, w=120, h=120, name="icon.png"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-15a", "tc_doc PDF Index 1", dict(form=form(Kind="pdf", Slot="tc_doc", Index=1), file=dict(PDF, name="terms-1.pdf"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-15b", "tc_doc PDF Index 2", dict(form=form(Kind="pdf", Slot="tc_doc", Index=2), file=dict(PDF, name="terms-2.pdf"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-16", "banner_desktop EN (.jpg)", dict(form=form(Slot="banner_desktop", LangCode="EN"), file=dict(JPG, w=1920, h=640, name="banner-desktop-en.jpg"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-17a", "thumb_main EN (.webp)", dict(form=form(LangCode="EN"), file=dict(make="canvas", canvasType="image/webp", name="t.webp", type="image/webp", w=800, h=600), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-17b", "banner_headline_icon TH (.gif)", dict(form=form(Slot="banner_headline_icon"), file=dict(make="gif", name="t.gif", type="image/gif"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-17c", "banner_promotion_card TH (.bmp)", dict(form=form(Slot="banner_promotion_card"), file=dict(make="bmp", name="t.bmp", type="image/bmp"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-17d", "header_highlight_icon (.svg สะอาด)", dict(form=form(Slot="header_highlight_icon"), file=dict(make="text", text=SVG_OK, name="t.svg", type="image/svg+xml"), verify=True), 200, "TS_FILE_S_0001", True),
    ("U-18", "เขียนทับ thumb_main TH (.png) ซ้ำ 1 ครั้ง", dict(form=form(), file=dict(PNG, w=800, h=600, color="#c0392b"), verify=True), 200, "TS_FILE_S_0001", True),
]


def main():
    only = set(sys.argv[1:])
    res = json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else {}
    last_store = 0.0
    for cid, desc, case, exp_http, exp_code, stores in CASES:
        if only and cid not in only:
            continue
        if stores:
            wait = GAP - (time.time() - last_store)
            if wait > 0:
                time.sleep(wait)
        out = run_js("const CASE = " + json.dumps(dict(case, id=cid), ensure_ascii=False) + ";", "u-body.js", timeout=120)
        if stores:
            last_store = time.time()
        ok = (exp_http is None or out.get("http") == exp_http) and (exp_code is None or out.get("code") == exp_code)
        if stores:
            ok = ok and out.get("fetch", {}).get("sameBytes") is True
        else:
            ok = ok and bool(out.get("thai"))   # every rejection carries a Thai detail (F-03 / F-07)
        out.update(desc=desc, expect=f"{exp_http} {exp_code}", pass_=ok)
        res[cid] = out
        RESULTS.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{'PASS' if ok else 'FAIL'} {cid} {desc} -> {out.get('http')} {out.get('code')} {out.get('fileName', '')} {out.get('fetch', '')} {out.get('thai') or ''} {'' if ok else out.get('message') or out}", flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
