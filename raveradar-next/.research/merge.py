#!/usr/bin/env python3
"""Merge researched event JSON from .research/*.json into lib/data.ts.

  python3 .research/merge.py --dry     report only
  python3 .research/merge.py           write

Dedupes on (normalised title, year) against what's already in data.ts and
across the input files. `note` containing "indicatif"/"non vérifié" becomes
priceNote:"estimated"; a 0 price that isn't really free becomes "unknown".
"""
import json, re, sys, glob, os, unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "lib", "data.ts")
DRY = "--dry" in sys.argv

def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "", s)

src = open(DATA).read()
existing = {(norm(m.group(1)), m.group(2))
            for m in re.finditer(r'title: "([^"]+)".*?date: "(\d{4})-', src)}
next_id = max(int(m) for m in re.findall(r"\{ id: (\d+),", src)) + 1

# Researchers occasionally return a French exonym; the dataset uses English ones.
CURRENCY_FIX = {"EUR": "€", "GBP": "£", "USD": "$"}

CITY_FIX = {"Copenhague": "Copenhagen", "Varsovie": "Warsaw", "Prague": "Prague",
            "Vienne": "Vienna", "Munich": "Munich", "Cologne": "Cologne", "Bucarest": "Bucharest",
            "Athenes": "Athens", "Athènes": "Athens", "Lisbonne": "Lisbon", "Moscou": "Moscow"}

REQUIRED = {"title","type","genres","city","country","lat","lng","date","time",
            "price","currency","venue","trending","lineup","desc","descEn"}
GENRES = {"Techno","Hard Techno","Acid Techno","Hardstyle","Hardcore","EDM",
          "Drum & Bass","House","Trance","Psytrance","Free Party","Warehouse"}

rows, skipped, rejected = [], [], []
seen = set()
for path in sorted(glob.glob(os.path.join(HERE, "events-*.json"))):
    fn = os.path.basename(path)
    try:
        data = json.load(open(path))
    except Exception as e:
        print(f"  !! {fn} invalid JSON: {e}")
        continue
    kept = 0
    for e in data:
        missing = REQUIRED - set(e)
        if missing:
            rejected.append((fn, e.get("title", "?"), f"missing {sorted(missing)}")); continue
        bad = [g for g in e["genres"] if g not in GENRES]
        if bad:
            rejected.append((fn, e["title"], f"bad genre {bad}")); continue
        if (e.get("endDate") or e["date"]) < "2026-08-08":
            rejected.append((fn, e["title"], "already over")); continue
        # Normalise BEFORE the dedup key: a title carrying its edition year
        # ("Sziget Festival 2026") must match the stored "Sziget Festival",
        # otherwise an already-merged event comes back as a duplicate.
        e["title"] = re.sub(r"\s+20[0-9][0-9]$", "", e["title"])
        e["city"] = CITY_FIX.get(e["city"], e["city"])
        e["currency"] = CURRENCY_FIX.get(e["currency"], e["currency"])
        key = (norm(e["title"]), e["date"][:4])
        if key in existing or key in seen:
            skipped.append((fn, e["title"], e["date"])); continue
        seen.add(key); rows.append(e); kept += 1
    print(f"  {fn}: {len(data)} in, {kept} kept")

rows.sort(key=lambda e: e["date"])

def esc(s): return s.replace("\\", "\\\\").replace('"', '\\"')
def arr(xs): return "[" + ", ".join('"%s"' % esc(x) for x in xs) + "]"

out, tickets = [], []
nid = next_id
for e in rows:
    note = (e.get("note") or "").lower()
    if e["price"] == 0 and ("ne signifie pas gratuit" in note or "non communiqué" in note):
        pn = ', priceNote: "unknown"'
    elif "indicatif" in note or "non vérifié" in note or "non verifie" in note:
        pn = ', priceNote: "estimated"'
    else:
        pn = ""
    f = [f"id: {nid}", f'title: "{esc(e["title"])}"', f'type: "{e["type"]}"',
         f'genres: {arr(e["genres"])}', f'city: "{esc(e["city"])}"', f'country: "{esc(e["country"])}"']
    if e.get("region"): f.append(f'region: "{esc(e["region"])}"')
    f += [f'lat: {e["lat"]}', f'lng: {e["lng"]}', f'date: "{e["date"]}"']
    if e.get("endDate") and e["endDate"] != e["date"]: f.append(f'endDate: "{e["endDate"]}"')
    f += [f'time: "{e["time"]}"', f'price: {e["price"]}', f'currency: "{e["currency"]}"',
          f'venue: "{esc(e["venue"])}"', f'trending: {"true" if e["trending"] else "false"}',
          f'lineup: {arr(e["lineup"])}', f'desc: "{esc(e["desc"])}"', f'descEn: "{esc(e["descEn"])}"']
    out.append("  { " + ", ".join(f) + pn + " },")
    if e.get("ticketUrl"): tickets.append(f'  {nid}: "{e["ticketUrl"]}",')
    nid += 1

print(f"\nmerging {len(rows)} events, ids {next_id}..{nid-1}")
print("countries:", dict(Counter(e["country"] for e in rows).most_common()))
print("months:", dict(sorted(Counter(e["date"][:7] for e in rows).items())))
print(f"duplicates skipped: {len(skipped)} | rejected: {len(rejected)}")
for r in rejected[:15]: print("   REJECT", r)

if DRY or not rows:
    print("\n(dry run — data.ts untouched)" if DRY else "\nnothing to merge")
    sys.exit(0)

marker = "];\n\n/* AI-generated key-art posters"
assert marker in src, "events array end marker not found"
src = src.replace(marker,
    "\n  /* ---------- Pan-European expansion: verified events ----------\n"
    "     Researched per region, cross-checked against official sites, RA, Songkick,\n"
    "     Skiddle/Dice and local press. `priceNote` flags unconfirmed gate prices. */\n"
    + "\n".join(out) + "\n" + marker, 1)

tmarker = "};\n/** Ticketing link: explicit URL"
assert tmarker in src, "tickets map end marker not found"
src = src.replace(tmarker, "\n".join(tickets) + "\n" + tmarker, 1)
open(DATA, "w").write(src)
print(f"\nwritten to lib/data.ts")
