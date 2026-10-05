"""Full-page screenshot of the Content Editor for each content (read-only — no Save).
The editor scrolls inside <main class="content">, so: expand every section, scroll main one screen at a time,
take a viewport shot each time and stitch the main area with Pillow.
Usage: python shot_contents.py CT000004 CT000005 ...   → docs/img/upload-api-test/<code>.png"""
import json
import os
import sys

from PIL import Image

from update_all import cdp, run_js, S

OUT = S.parent.parent / "docs" / "img" / "upload-api-test"
TMP = S / "hl-shots"


def shot(label):
    cdp("shot", label, "--outdir", str(TMP), timeout=180)
    return Image.open(TMP / f"{label}.png").convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(exist_ok=True)
    for code in sys.argv[1:]:
        print(cdp("goto", f"http://localhost:4200/package/add/{code}", "--wait", ".sec-nav", "--settle", "3"), flush=True)
        g = run_js("", "fullpage-prep.js")
        print("prep:", g, flush=True)
        first = shot(f"{code}-0")
        k = first.width / g["vw"]
        top, left, w, h = round(g["y"] * k), round(g["x"] * k), round(g["w"] * k), round(g["h"] * k)
        canvas = Image.new("RGB", (first.width, top + round(g["total"] * k)), "white")
        canvas.paste(first.crop((0, 0, first.width, top + h)), (0, 0))
        y, i = h, 1
        while y < round(g["total"] * k):
            actual = json.loads(json.loads(cdp("js", "(async()=>{const m=document.querySelector('main.content');m.scrollTop=%d;"
                                                   "await new Promise(r=>setTimeout(r,700));return JSON.stringify(m.scrollTop);})()" % (y / k))))
            img = shot(f"{code}-{i}")
            canvas.paste(img.crop((left, top, left + w, top + h)), (left, top + round(actual * k)))
            y += h
            i += 1
        canvas.save(OUT / f"{code}.png", optimize=True)
        for f in TMP.glob(f"{code}-*.png"):
            os.remove(f)
        print(f"{code}.png {canvas.width}x{canvas.height}", flush=True)


if __name__ == "__main__":
    main()
