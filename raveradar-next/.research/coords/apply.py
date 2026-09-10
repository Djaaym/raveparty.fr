#!/usr/bin/env python3
"""Applique un lot de coordonnées re-vérifiées à `lib/data.ts`.

Un lot est un tableau de `{id, venue, lat, lng, address, source}`. `venue` est le
garde-fou contre la dérive d'id, exactement comme `title` dans `.research/lineups/` :
écrire la coordonnée d'une salle sur une autre fiche est une faute **invisible**, la
page continue d'afficher la bonne ville et seul le lien hôtel ment.

Trois refus, tous en amont de l'écriture :
- moins de 4 décimales, c'est plus de 10 m d'incertitude sur un point qui sert à classer
  des hôtels par distance : le lot n'a alors rien apporté ;
- pas de `source` http(s) : une coordonnée sans source est une donnée inventée ;
- un déplacement de plus de 60 km, qui est un changement de ville et pas une correction.
  `--force` le permet, à relire à la main.

Le test « le point est dans son pays » n'est pas répété ici : `npm run check:hotels` le
fait déjà, et une seconde copie de la table des boîtes englobantes divergerait.

    python3 .research/coords/apply.py lot.json --dry   # puis sans --dry
"""
import argparse, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "..", "lib", "data.ts")

def haversine(a1, o1, a2, o2):
    p1, p2 = math.radians(a1), math.radians(a2)
    dp, do = math.radians(a2 - a1), math.radians(o2 - o1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(do / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))

def decimals(x):
    s = ("%.10f" % float(x)).rstrip("0")
    return len(s.split(".")[1]) if "." in s else 0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lots", nargs="+")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    rows = []
    for p in a.lots:
        rows += json.load(open(p, encoding="utf-8"))

    src = open(DATA, encoding="utf-8").read()
    applied, skipped = 0, []
    for r in rows:
        eid = r.get("id")
        m = re.search(r'\{ id: %s, title: "((?:[^"\\]|\\.)*)".*?venue: "((?:[^"\\]|\\.)*)"' % eid, src)
        if not m:
            skipped.append((eid, "id introuvable dans data.ts")); continue
        if r.get("venue") and r["venue"].strip() != m.group(2):
            skipped.append((eid, 'venue du lot "%s" != catalogue "%s"' % (r.get("venue"), m.group(2)))); continue
        if not str(r.get("source", "")).startswith("http"):
            skipped.append((eid, "pas de source http(s)")); continue
        lat, lng = float(r["lat"]), float(r["lng"])
        if decimals(lat) < 4 or decimals(lng) < 4:
            skipped.append((eid, "moins de 4 décimales (%s, %s)" % (lat, lng))); continue
        cur = re.search(r'\{ id: %s,.*? lat: (-?[\d.]+), lng: (-?[\d.]+)' % eid, src)
        d = haversine(float(cur.group(1)), float(cur.group(2)), lat, lng)
        if d > 60 and not a.force:
            skipped.append((eid, "déplacement de %.0f km, relire (--force)" % d)); continue
        print("  #%-5s %-30.30s %8.3f km  %s" % (eid, m.group(2), d, r.get("address", "")[:60]))
        pat = re.compile(r'(\{ id: %s,.*? lat: )(-?[\d.]+)(, lng: )(-?[\d.]+)' % eid)
        src, k = pat.subn(lambda mm: "%s%s%s%s" % (mm.group(1), repr(lat), mm.group(3), repr(lng)), src, count=1)
        applied += k

    print("\n%d coordonnées à écrire, %d écartées" % (applied, len(skipped)))
    for s in skipped:
        print("   SKIP #%s : %s" % s)
    if a.dry:
        print("\n(dry run, data.ts inchangé)")
        return
    open(DATA, "w", encoding="utf-8").write(src)
    print("\nécrit dans lib/data.ts")

if __name__ == "__main__":
    main()
