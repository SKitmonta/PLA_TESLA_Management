"""secshot.py <name> <css-selector> [pad]
Scroll the element into view, take a VIEWPORT screenshot through cdp.py, then crop it to the element's
current rect with Pillow (cdp.py --selector misplaces the clip when the page scrolls inside a container).
Uses $PORTFILE (headless Chrome) like c.sh."""
import json
import pathlib
import os
import subprocess
import sys

from PIL import Image

CDP = r"C:/Users/arthit/.claude/skills/browser-use/scripts/cdp.py"
SHOTS = str(pathlib.Path(__file__).resolve().parent.parent / "shots")
ENV = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
CONN = ["--portfile", os.environ["PORTFILE"]]


def cdp(*args):
    r = subprocess.run(["python", CDP, *args, *CONN, "--match", "localhost:4200", "--outdir", SHOTS],
                       capture_output=True, text=True, encoding="utf-8", env=ENV, timeout=120)
    if r.returncode != 0:
        sys.exit(r.stdout + r.stderr)
    return r.stdout.strip()


def main():
    name, sel = sys.argv[1], sys.argv[2]
    pad = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    expr = (
        "(async()=>{const e=document.querySelector(%s); e.scrollIntoView({block:'start'});"
        "await new Promise(r=>setTimeout(r,800)); const r=e.getBoundingClientRect();"
        "return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height,dpr:devicePixelRatio,vw:innerWidth,vh:innerHeight});})()"
    ) % json.dumps(sel)
    rect = json.loads(json.loads(cdp("js", expr)))
    cdp("shot", name + "-raw")
    raw = os.path.join(SHOTS, name + "-raw.png")
    img = Image.open(raw)
    s = img.width / rect["vw"]
    box = (max(0, int((rect["x"] - pad) * s)), max(0, int((rect["y"] - pad) * s)),
           min(img.width, int((rect["x"] + rect["w"] + pad) * s)), min(img.height, int((rect["y"] + rect["h"] + pad) * s)))
    out = os.path.join(SHOTS, name + ".png")
    img.crop(box).save(out)
    os.remove(raw)
    cut = rect["y"] + rect["h"] > rect["vh"]
    print(f"{name}.png {box[2]-box[0]}x{box[3]-box[1]}{'  [!] taller than viewport - cut' if cut else ''}")


if __name__ == "__main__":
    main()
