"""test_seller_api.py — FE v2 menu Seller on Tesla Admin API v2 (DEV, run-api.ps1 -Mode DevWrite).

Exercises /tesla-admin/api/v2/people/* end to end and writes seller-api-results.json.
Creates test groups named "ทดสอบ-…" in ONE workspace and deletes them again at the end (soft delete + audit kept).
Prints / stores no seller names; seller codes are masked (PDPA, rules.md §3).
"""
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://localhost:5277/tesla-admin/api/v2/people"
CAMPAIGN = "http://localhost:5277/tesla-admin/api/v2/campaign"
HDR = {"X-User-Id": "U009", "Content-Type": "application/json"}
OUT = pathlib.Path(__file__).with_name("seller-api-results.json")
results = []


def call(method, url, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=HDR)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            env = json.loads(r.read().decode("utf-8"))
            return r.status, env.get("data", {}).get("result")
    except urllib.error.HTTPError as e:
        env = json.loads(e.read().decode("utf-8") or "{}")
        return e.code, (env.get("data") or {}).get("result")


def mask(code):
    return code if not code or len(code) <= 4 else code[:2] + "••" + code[-2:]


def check(case, title, ok, detail):
    results.append({"case": case, "title": title, "pass": bool(ok), "detail": detail})
    print(("PASS " if ok else "FAIL ") + case + " " + title + " — " + detail)


def errs(res):
    return " · ".join((res or {}).get("errors", []))


# ---------------------------------------------------------------- clean leftovers of an earlier run
_, pre = call("GET", BASE + "/workspaces")
for w in pre or []:
    if w["groupCount"]:
        _, bd = call("GET", f"{BASE}/workspaces/{w['packageCode']}/{w['channelCode']}")
        for g in bd["groups"]:
            if g["groupName"].startswith("ทดสอบ-"):
                call("DELETE", f"{BASE}/groups/{g['groupId']}")

# ---------------------------------------------------------------- P-01
st, ws = call("GET", BASE + "/workspaces")
check("SL-01", "รายการ Workspace", st == 200 and len(ws) > 0,
      f"{len(ws)} Workspace · " + ", ".join(f"{w['packageCode']}×{w['channelCode']}:{w['sellerCount']} คน/{w['mode']}" for w in ws))
st, f = call("GET", BASE + "/workspaces?channel=CHN07")
check("SL-02", "กรองช่องทาง CHN07", st == 200 and f and all(w["channelCode"] == "CHN07" for w in f), f"{len(f or [])} รายการ")

# pick a workspace that an Approved campaign covers (so binding is really exercised), else the one with most sellers
_, camps = call("GET", CAMPAIGN + "?pageSize=100")
covered = {(p, c) for x in camps["items"] if x["status"] == "APPROVED" for p in x["packageCodes"] for c in x["channelCodes"]}
free = [w for w in ws if w["groupCount"] == 0]
target = sorted(free, key=lambda w: (-((w["packageCode"], w["channelCode"]) in covered), -w["sellerCount"]))[0]
pkg, ch = target["packageCode"], target["channelCode"]
other = next(w for w in ws if w["groupCount"] == 0 and w["channelCode"] == ch and w["packageCode"] != pkg)

# ---------------------------------------------------------------- P-02
st, board = call("GET", f"{BASE}/workspaces/{pkg}/{ch}")
sellers = board["sellers"]
ready = [s for s in sellers if s["ready"]]
check("SL-03", f"Board {pkg}×{ch}", st == 200 and len(sellers) == target["sellerCount"],
      f"ผู้ขาย {len(sellers)} คน · พร้อมขาย {len(ready)} · ประเภท {sorted({s['sellerType'] for s in sellers})}")
check("SL-04", "ไม่มีเบอร์ / อีเมล / เลขใบอนุญาต (PDPA)",
      all(s["phone"] is None and s["email"] is None and s["licenseNo"] is None for s in sellers), "ทุกคนเป็น null")
st, nf = call("GET", f"{BASE}/workspaces/NOPE/{ch}")
check("SL-05", "Workspace ที่ไม่มี → 404", st == 404, errs(nf))

# ---------------------------------------------------------------- groups
st, g1 = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/groups", {"groupName": "ทดสอบ-ทีม A", "description": "กลุ่มทดสอบ", "color": "#1F8A4C"})
check("SL-06", "สร้างกลุ่ม", st == 200 and g1["groupName"] == "ทดสอบ-ทีม A" and g1["color"] == "#1f8a4c", f"groupId {g1 and g1.get('groupId')}")
gid = g1["groupId"]
st, dup = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/groups", {"groupName": "ทดสอบ-ทีม A"})
check("SL-07", "ชื่อซ้ำ → 409", st == 409, errs(dup))
st, empty = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/groups", {"groupName": "  "})
check("SL-08", "ชื่อว่าง → 400", st == 400, errs(empty))
st, g2 = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/groups", {"groupName": "ทดสอบ-ทีม B"})
gid2 = g2["groupId"]

# ---------------------------------------------------------------- move
codes = [s["sellerCode"] for s in sellers]
st, mv = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/move", {"sellerCodes": codes[:2] + ["NOPE01"], "groupId": gid})
check("SL-09", "ย้ายเข้ากลุ่ม (+ รหัสที่ไม่อยู่ใน Workspace)", st == 200 and any(s["reason"] == "ไม่อยู่ในรายชื่อ Workspace" for s in mv["skipped"]),
      f"ย้าย {mv['moved']} · ข้าม {[(mask(s['sellerCode']), s['reason']) for s in mv['skipped']]}")
in_group = [s for s in mv["board"]["sellers"] if s["groupId"] == gid]
check("SL-10", "Board หลังย้าย", len(in_group) == mv["moved"], f"สมาชิกในกลุ่ม {len(in_group)} คน")
st, mv2 = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/move", {"sellerCodes": codes[:1], "groupId": None})
check("SL-11", "นำออกจากกลุ่ม", st == 200 and mv2["moved"] == 1, "1 คนกลับเป็น ยังไม่มีกลุ่ม")
st, bad = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/move", {"sellerCodes": [], "groupId": gid})
check("SL-12", "ไม่ได้เลือกผู้ขาย → 400", st == 400, errs(bad))

# ---------------------------------------------------------------- update
st, up = call("PUT", f"{BASE}/groups/{gid}", {"groupName": "ทดสอบ-ทีม A1", "description": "แก้แล้ว", "color": "#c2610c"})
check("SL-13", "แก้ชื่อ / สี", st == 200 and up["groupName"] == "ทดสอบ-ทีม A1" and up["color"] == "#c2610c",
      up and next((l["detail"] for l in up["logs"] if l["action"] == "UPDATE_GROUP"), ""))
st, up2 = call("PUT", f"{BASE}/groups/{gid}", {"groupName": "ทดสอบ-ทีม B"})
check("SL-14", "แก้เป็นชื่อซ้ำ → 409", st == 409, errs(up2))

# ---------------------------------------------------------------- bind
cand = up["candidates"]
bindable = [c for c in cand if c.get("bindable")]
check("SL-15", "Campaign ที่ผูกได้ / ไม่ได้", len(cand) > 0 and all((c.get("reason") is None) == c.get("bindable") for c in cand),
      f"{len(cand)} Campaign ครอบคลุม {pkg}×{ch} · ผูกได้ {len(bindable)} · " + ", ".join(f"{c['campaignCode']}:{c.get('reason') or 'ผูกได้'}" for c in cand))
bound_code = None
if bindable:
    bound_code = bindable[0]["campaignCode"]
    st, b = call("POST", f"{BASE}/groups/{gid}/campaigns", {"campaignCode": bound_code})
    check("SL-16", f"ผูก {bound_code}", st == 200 and any(c["campaignCode"] == bound_code for c in b["campaigns"]), "อยู่ในรายการผูกแล้ว")
    st, ub = call("DELETE", f"{BASE}/groups/{gid}/campaigns/{bound_code}")
    st2, rb = call("POST", f"{BASE}/groups/{gid}/campaigns", {"campaignCode": bound_code})
    check("SL-16b", f"ถอด {bound_code} แล้วผูกใหม่", st == 200 and not ub["campaigns"] and st2 == 200 and len(rb["campaigns"]) == 1,
          "ถอดแล้วไม่เหลือ · ผูกใหม่ได้ (ใช้ต่อในการลบกลุ่ม)")
else:
    check("SL-16", "ผูก Campaign", False, "ไม่มี Campaign ที่ผูกได้ใน Workspace นี้")
not_bindable = [c for c in cand if c.get("bindable") is False]
if not_bindable:
    st, nb = call("POST", f"{BASE}/groups/{gid}/campaigns", {"campaignCode": not_bindable[0]["campaignCode"]})
    check("SL-17", f"ผูก {not_bindable[0]['campaignCode']} ({not_bindable[0]['reason']}) → 400", st == 400, errs(nb))
st, nc = call("POST", f"{BASE}/groups/{gid}/campaigns", {"campaignCode": "CMP00000000"})
check("SL-18", "Campaign ที่ไม่มี → 404", st == 404, errs(nc))

# ---------------------------------------------------------------- import / copy / audit
rows = [{"sellerCode": codes[0], "groupName": "ทดสอบ-ทีม C"}, {"sellerCode": codes[0], "groupName": "ทดสอบ-ทีม A1"},
        {"sellerCode": "NOPE01", "groupName": "ทดสอบ-ทีม A1"}, {"sellerCode": "", "groupName": "x"}]
st, imp = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/import", {"rows": rows, "commit": False})
check("SL-19", "Import ตรวจอย่างเดียว", st == 200 and not imp["committed"] and imp["passed"] == 1,
      " · ".join(f"แถว {r['row']}: {r['message']}" for r in imp["rows"]))
st, imp2 = call("POST", f"{BASE}/workspaces/{pkg}/{ch}/import", {"rows": rows, "commit": True})
st3, board3 = call("GET", f"{BASE}/workspaces/{pkg}/{ch}")
gc = next((g for g in board3["groups"] if g["groupName"] == "ทดสอบ-ทีม C"), None)
check("SL-20", "Import บันทึก → สร้างกลุ่มใหม่", st == 200 and imp2["committed"] and gc and gc["memberCount"] == 1, f"กลุ่ม ทดสอบ-ทีม C สมาชิก {gc and gc['memberCount']}")

st, pv = call("POST", BASE + "/copy", {"fromPackage": pkg, "fromChannel": ch, "toPackage": other["packageCode"], "toChannel": ch, "preview": True})
check("SL-21", f"คัดลอก (Preview) → {other['packageCode']}×{ch}", st == 200 and pv["preview"] and len(pv["groups"]) == 3,
      " · ".join(f"{g['groupName']}: {g['copyCount']}/{g['sourceCount']}" for g in pv["groups"]))
st, same = call("POST", BASE + "/copy", {"fromPackage": pkg, "fromChannel": ch, "toPackage": pkg, "toChannel": ch, "preview": True})
check("SL-22", "คัดลอกเข้า Workspace เดียวกัน → 400", st == 400, errs(same))
st, ok_copy = call("POST", BASE + "/copy", {"fromPackage": pkg, "fromChannel": ch, "toPackage": other["packageCode"], "toChannel": ch, "preview": False})
st2, again = call("POST", BASE + "/copy", {"fromPackage": pkg, "fromChannel": ch, "toPackage": other["packageCode"], "toChannel": ch, "preview": True})
check("SL-23", "คัดลอกจริง แล้วคัดลอกซ้ำ → 409", st == 200 and st2 == 409, errs(again))

st, audit = call("GET", f"{BASE}/audit?pkg={pkg}&ch={ch}")
actions = sorted({a["action"] for a in audit})
check("SL-24", "Audit log", st == 200 and {"CREATE_GROUP", "MOVE", "UPDATE_GROUP", "IMPORT"} <= set(actions), f"{len(audit)} แถว · {actions}")
st, aq = call("GET", f"{BASE}/audit?q=" + urllib.parse.quote("ทดสอบ-ทีม C"))
check("SL-25", "ค้นหา Audit (q)", st == 200 and all("ทดสอบ-ทีม C" in (a["groupName"] or "") for a in aq), f"{len(aq)} แถว")

st, refs = call("GET", BASE + "/referrals")
check("SL-26", "Referral links", st == 200 and isinstance(refs, list), f"{len(refs)} Campaign Referral ที่ Approved (ยอดคลิก = 0: ยังไม่มีแหล่งข้อมูล)")

# ---------------------------------------------------------------- delete (clean up the test groups)
st, dl = call("DELETE", f"{BASE}/groups/{gid}")
st2, gone = call("GET", f"{BASE}/groups/{gid}")
check("SL-27", "ลบกลุ่ม (ถอด Campaign + สมาชิกกลับเป็น ยังไม่มีกลุ่ม)", st == 200 and st2 == 404, errs(gone))
st, aud2 = call("GET", f"{BASE}/audit?groupId={gid}")
check("SL-28", "ประวัติกลุ่มที่ลบยังอยู่", st == 200 and any(a["action"] == "DELETE_GROUP" for a in aud2),
      " · ".join(a["action"] for a in aud2))
for w in (pkg, other["packageCode"]):
    _, bd = call("GET", f"{BASE}/workspaces/{w}/{ch}")
    for g in bd["groups"]:
        if g["groupName"].startswith("ทดสอบ-"):
            call("DELETE", f"{BASE}/groups/{g['groupId']}")
_, after = call("GET", BASE + "/workspaces")
left = [w for w in after if w["groupCount"] > 0 and w["packageCode"] in (pkg, other["packageCode"]) and w["channelCode"] == ch]
check("SL-29", "เก็บกวาดกลุ่มทดสอบ", not left, "ไม่เหลือกลุ่มทดสอบใน 2 Workspace")

OUT.write_text(json.dumps({"at": time.strftime("%Y-%m-%d %H:%M"), "workspace": f"{pkg}×{ch}", "copyTarget": f"{other['packageCode']}×{ch}",
                           "results": results}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n{sum(r['pass'] for r in results)}/{len(results)} pass → {OUT.name}")
