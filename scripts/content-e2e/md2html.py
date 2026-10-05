"""md2html.py <in.md> <out.html> — tiny Markdown subset → printable HTML (for the Online content manual PDF).
Handles: # headings, > quotes, --- rules, | tables |, - / 1. lists (one nesting level), ![img](src), **bold**, `code`, [text](link)."""
import html
import pathlib
import re
import sys

src = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2])
base = src.parent


def inline(s: str) -> str:
    s = s.replace("\\*", "\x00")
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", s)
    return s.replace("\x00", "*")


def img(line: str) -> str:
    m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", line.strip())
    alt, path = m.group(1), m.group(2)
    uri = (base / path).resolve().as_uri()
    return f'<figure><img src="{uri}" alt="{html.escape(alt)}"><figcaption>{html.escape(alt)}</figcaption></figure>'


lines = src.read_text(encoding="utf-8").splitlines()
body, i = [], 0
while i < len(lines):
    line = lines[i]
    t = line.strip()
    if not t:
        i += 1
        continue
    if t == "---":
        body.append("<hr>")
        i += 1
    elif t.startswith("#"):
        level = len(t) - len(t.lstrip("#"))
        body.append(f"<h{level}>{inline(t[level:].strip())}</h{level}>")
        i += 1
    elif t.startswith(">"):
        buf = []
        while i < len(lines) and lines[i].strip().startswith(">"):
            buf.append(inline(lines[i].strip()[1:].strip()))
            i += 1
        body.append("<blockquote>" + "<br>".join(buf) + "</blockquote>")
    elif t.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
            i += 1
        head, data = rows[0], [r for r in rows[2:]]
        h = "".join(f"<th>{inline(c)}</th>" for c in head)
        d = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in data)
        body.append(f"<table><thead><tr>{h}</tr></thead><tbody>{d}</tbody></table>")
    elif t.startswith("!["):
        body.append(img(t))
        i += 1
    elif re.match(r"^(-|\d+\.)\s", t):
        ordered = bool(re.match(r"^\d+\.", t))
        tag = "ol" if ordered else "ul"
        items = []
        while i < len(lines) and lines[i].strip() and (re.match(r"^(-|\d+\.)\s", lines[i].strip()) or lines[i].startswith("   ")):
            raw = lines[i]
            if raw.startswith("   ") and items:
                items[-1][1].append(inline(re.sub(r"^(-|\d+\.)\s", "", raw.strip())))
            else:
                items.append([inline(re.sub(r"^(-|\d+\.)\s", "", raw.strip())), []])
            i += 1
        lis = "".join(f"<li>{a}" + (("<ul>" + "".join(f"<li>{s}</li>" for s in sub) + "</ul>") if sub else "") + "</li>" for a, sub in items)
        body.append(f"<{tag}>{lis}</{tag}>")
    else:
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#|>|\||!\[|-\s|\d+\.\s|---$)", lines[i].strip()):
            buf.append(inline(lines[i].strip()))
            i += 1
        body.append("<p>" + " ".join(buf) + "</p>")

CSS = """
@page { size: A4; margin: 14mm 13mm 16mm; }
body { font-family: 'Leelawadee UI', 'Noto Sans Thai', Tahoma, sans-serif; font-size: 10.5pt; color: #1f2937; line-height: 1.55; }
h1 { font-size: 21pt; color: #00317a; margin: 0 0 8px; }
h2 { font-size: 15pt; color: #00317a; border-bottom: 2px solid #e2edff; padding-bottom: 4px; margin: 22px 0 10px; break-after: avoid; }
h3 { font-size: 12.5pt; color: #0b4aa2; margin: 16px 0 6px; break-after: avoid; }
blockquote { margin: 8px 0 14px; padding: 8px 12px; background: #f3f7ff; border-left: 4px solid #0b4aa2; color: #374151; font-size: 9.5pt; }
hr { border: 0; border-top: 1px solid #e5e7eb; margin: 18px 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9.3pt; break-inside: auto; }
th { background: #00317a; color: #fff; text-align: left; padding: 5px 7px; }
td { border-bottom: 1px solid #e5e7eb; padding: 5px 7px; vertical-align: top; }
tr { break-inside: avoid; }
code { background: #f1f5f9; padding: 0 4px; border-radius: 3px; font-size: 9pt; }
figure { margin: 8px 0 14px; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; max-height: 225mm; border: 1px solid #d1d5db; border-radius: 6px; }
figcaption { font-size: 8.5pt; color: #6b7280; margin-top: 3px; }
ul, ol { margin: 4px 0 10px; padding-left: 22px; }
li { margin: 2px 0; }
"""
title = re.sub(r"<[^>]+>", "", body[0]) if body else "Manual"
out.write_text(f'<!doctype html><html lang="th"><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{"".join(body)}</body></html>', encoding="utf-8")
print("html ->", out)
