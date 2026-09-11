#!/usr/bin/env python3
"""Re-vérifie les coordonnées d'une salle, parce que c'est elles qui décident du lien hôtel.

Depuis que la recherche Booking est centrée sur `lat`/`lng` (voir `lib/hotels.ts`), une
coordonnée approximative ne se voit **nulle part** sur le site : la fiche affiche la bonne
ville, la carte du lieu est trop zoomée pour qu'un décalage se remarque, et le lien part
quand même. Le lecteur, lui, se voit proposer des hôtels à l'autre bout de
l'agglomération. `scripts/check-hotels.mjs` attrape le point qui a changé de pays ; il ne
peut rien dire du point qui désigne le centre-ville au lieu de la salle.

Ce script pose la question qui manque : **le géocodeur place-t-il cette salle là où le
catalogue la place ?** Il interroge Nominatim sur « {venue}, {city}, {country} », compare
au point stocké et classe l'écart. Il ne tranche pas tout seul : un géocodeur se trompe
d'homonyme aussi bien qu'un agent de recherche (« Warehouse » existe dans dix villes),
d'où `--apply`, qui ne réécrit que les cas où le nom rendu par OSM **correspond** au
libellé du catalogue.

    python3 .research/coords/verify.py --since-id 2054            # rapport
    python3 .research/coords/verify.py --since-id 2054 --apply    # + réécriture des sûrs

Nominatim limite à une requête par seconde : les réponses sont mises en cache dans
`cache.json`, y compris les vides, un second passage ne recoûte donc rien.
"""
import argparse, json, math, os, re, subprocess, sys, time, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "..", "lib", "data.ts")
CACHE = os.path.join(HERE, "cache.json")
UA = "RaveRadar/1.0 (https://raveparty.fr)"

# Rayons, en km. Sous PROCHE le géocodeur confirme le point ; au-delà de LOIN il désigne
# autre chose, et c'est là qu'un homonyme se cache.
PROCHE, LOIN = 0.6, 3.0

def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s)

def haversine(a1, o1, a2, o2):
    r = 6371.0
    p1, p2 = math.radians(a1), math.radians(a2)
    dp, do = math.radians(a2 - a1), math.radians(o2 - o1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(do / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))

def decimals(x):
    s = repr(float(x))
    return len(s.split(".")[1].rstrip("0")) if "." in s else 0

def events():
    src = open(DATA, encoding="utf-8").read()
    start = src.index("export const EVENTS")
    end = src.index("];", start)
    for line in src[start:end].split("\n"):
        m = re.match(r'\s*\{ id: (\d+),', line)
        if not m:
            continue
        g = lambda k: (re.search(r'\b%s: "((?:[^"\\]|\\.)*)"' % k, line) or [None, None])[1]
        n = lambda k: (re.search(r"\b%s: (-?[\d.]+)" % k, line) or [None, None])[1]
        yield {"id": int(m.group(1)), "title": g("title"), "city": g("city"),
               "country": g("country"), "venue": g("venue"),
               "lat": float(n("lat")), "lng": float(n("lng")), "line": line}

def load_cache():
    try:
        return json.load(open(CACHE, encoding="utf-8"))
    except Exception:
        return {}

def geocode(q, cache):
    if q in cache:
        return cache[q]
    url = ("https://nominatim.openstreetmap.org/search"
           "?q=%s&format=json&limit=3&addressdetails=1" % requests_quote(q))
    try:
        out = subprocess.run(["curl", "-sS", "--max-time", "30", "-A", UA, url],
                             capture_output=True, text=True, timeout=45).stdout
        res = json.loads(out)
    except Exception as e:
        print("   !! %s: %s" % (q, e), file=sys.stderr)
        res = []
    cache[q] = res
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    time.sleep(1.1)          # la limite de Nominatim est d'une requête par seconde
    return res

def requests_quote(s):
    from urllib.parse import quote
    return quote(s)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since-id", type=int, default=0)
    ap.add_argument("--ids", help="liste d'ids séparés par des virgules")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    want = set(int(x) for x in a.ids.split(",")) if a.ids else None
    keep = (lambda e: e["id"] in want) if want else (lambda e: e["id"] >= a.since_id)
    evs = [e for e in events() if keep(e)]
    print("%d fiches à vérifier\n" % len(evs))

    cache = load_cache()
    buckets = {"ok": [], "proche": [], "loin": [], "introuvable": []}
    fixes = {}

    for e in evs:
        q = "%s, %s, %s" % (e["venue"], e["city"], e["country"])
        res = geocode(q, cache) or geocode("%s, %s" % (e["venue"], e["city"]), cache)
        if not res:
            buckets["introuvable"].append((e, None, None))
            continue
        best, bestd = None, 1e9
        for r in res:
            d = haversine(e["lat"], e["lng"], float(r["lat"]), float(r["lon"]))
            if d < bestd:
                best, bestd = r, d
        named = norm(e["venue"])[:14] and norm(e["venue"])[:14] in norm(best.get("name") or "") \
            or norm(best.get("name") or "")[:14] in norm(e["venue"])
        row = (e, best, bestd)
        if bestd <= PROCHE:
            buckets["ok"].append(row)
        elif bestd <= LOIN:
            buckets["proche"].append(row)
            if named and decimals(e["lat"]) <= 3:
                fixes[e["id"]] = (float(best["lat"]), float(best["lon"]), best.get("name"))
        else:
            buckets["loin"].append(row)
            if named:
                fixes[e["id"]] = (float(best["lat"]), float(best["lon"]), best.get("name"))

    for k, label in [("loin", "ÉCART > %g km" % LOIN), ("proche", "écart %g-%g km" % (PROCHE, LOIN)),
                     ("introuvable", "salle non géocodée")]:
        rows = buckets[k]
        print("\n=== %s : %d" % (label, len(rows)))
        for e, best, d in rows:
            tag = " -> CORRIGEABLE" if e["id"] in fixes else ""
            print("  #%-5d %-34.34s %-22.22s %-13.13s %s%s"
                  % (e["id"], e["venue"], e["city"], e["country"],
                     ("%.2f km, OSM=%s" % (d, (best.get("name") or "?")[:30])) if best else "aucun résultat", tag))
    print("\n=== confirmé (<= %g km) : %d" % (PROCHE, len(buckets["ok"])))
    coarse = [e for e in evs if decimals(e["lat"]) <= 2 or decimals(e["lng"]) <= 2]
    print("=== coordonnée à 2 décimales ou moins (~1 km) : %d" % len(coarse))
    for e in coarse[:40]:
        print("  #%-5d %-34.34s %s, %s" % (e["id"], e["venue"], e["city"], e["country"]))

    if not a.apply:
        print("\n%d corrections possibles (relance avec --apply)" % len(fixes))
        return
    src = open(DATA, encoding="utf-8").read()
    n = 0
    for eid, (lat, lng, name) in fixes.items():
        pat = re.compile(r'(\{ id: %d,.*? lat: )(-?[\d.]+)(, lng: )(-?[\d.]+)' % eid)
        new, k = pat.subn(lambda m: "%s%.5f%s%.5f" % (m.group(1), lat, m.group(3), lng), src, count=1)
        if k:
            src, n = new, n + 1
    open(DATA, "w", encoding="utf-8").write(src)
    print("\n%d coordonnées réécrites dans lib/data.ts" % n)

if __name__ == "__main__":
    main()
