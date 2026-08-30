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
# La clé (titre, année) ne voit pas que « Pandemic » et « Pandemic w/ Vortek's »,
# même salle et même nuit, sont le même événement : 30 doublons sont passés comme ça,
# soit 30 pages en concurrence l'une avec l'autre. Ce qui identifie réellement une
# date, c'est (ville, salle, jour) - un club ne tient pas deux soirées billetées le
# même soir dans la même salle.
# Une fiche = une ligne, et l'ordre des champs y est city … date … venue : on lit
# donc ligne par ligne plutôt qu'avec un motif unique, qui n'aurait jamais matché.
booked = set()
for _line in src.split("\n"):
    if not re.match(r'\s*\{ id: \d+,', _line): continue
    _c = re.search(r'city: "([^"]+)"', _line)
    _v = re.search(r'venue: "((?:[^"\\]|\\.)*)"', _line)
    _d = re.search(r'date: "([\d-]+)"', _line)
    if _c and _v and _d: booked.add((norm(_c.group(1)), norm(_v.group(1)), _d.group(1)))
next_id = max(int(m) for m in re.findall(r"\{ id: (\d+),", src)) + 1

# Researchers occasionally return a French exonym; the dataset uses English ones.
# Les chercheurs rendent tantôt un code ISO, tantôt le symbole local. On stocke le
# symbole : le montant affiché est celui que le lecteur paiera à l'entrée, pas une
# conversion en euros que personne n'a publiée (et qui bougerait tous les jours).
CURRENCY_FIX = {"EUR": "€", "GBP": "£", "USD": "$",
                "CZK": "Kč", "PLN": "zł", "CHF": "CHF", "HUF": "Ft", "RON": "lei",
                "DKK": "kr", "SEK": "kr", "NOK": "kr", "ISK": "kr",
                # "дин" en cyrillique sur un site FR/EN ne dit rien à personne.
                "дин": "RSD", "RSD": "RSD", "BGN": "BGN", "лв": "BGN"}

# Le libellé de pays est une clé, pas un affichage : COUNTRY_FR / COUNTRY_FLAG sont
# indexés dessus et `/pays/{slug}` en dérive. Un agent qui rend "United Kingdom" là où
# le catalogue dit "UK" crée une deuxième page pays, moitié moins fournie, en
# concurrence avec la première - le doublon qu'on passe justement notre temps à éviter.
COUNTRY_FIX = {"United Kingdom": "UK", "Great Britain": "UK", "England": "UK",
               "Scotland": "UK", "Wales": "UK", "Czechia": "Czech Republic",
               "Holland": "Netherlands", "The Netherlands": "Netherlands"}

# Un événement retiré du catalogue ne doit jamais y revenir par une refusion.
# La clé de dédup se lit dans lib/data.ts : dès qu'une fiche en est retirée, la clé
# disparaît avec elle et le JSON de recherche qui l'avait apportée la réinjecte au
# merge suivant. C'est arrivé à Time Warp Spain - supprimé parce que time-warp.de
# porte un communiqué d'annulation, et candidat au retour à chaque exécution depuis.
# Une suppression est une décision éditoriale : elle se consigne ici, pas seulement
# dans l'absence d'une ligne. Format : (titre normalisé, année) -> raison.
REMOVED = {("timewarpspain", "2026"): "annulé (communiqué sur time-warp.de)"}

CITY_FIX = {"Copenhague": "Copenhagen", "Varsovie": "Warsaw", "Prague": "Prague",
            "Vienne": "Vienna", "Munich": "Munich", "Cologne": "Cologne", "Bucarest": "Bucharest",
            "Athenes": "Athens", "Athènes": "Athens", "Lisbonne": "Lisbon", "Moscou": "Moscow"}

REQUIRED = {"title","type","genres","city","country","lat","lng","date","time",
            "price","currency","venue","trending","lineup","desc","descEn"}
GENRES = {"Techno","Hard Techno","Acid Techno","Hardstyle","Hardcore","EDM",
          "Drum & Bass","House","Trance","Psytrance","Free Party","Warehouse"}
# `type` était validé sur sa seule présence, alors que EventType (lib/types.ts) n'admet
# que ces trois valeurs : un lot rendant "Rave" ou "Open Air" passait le merge et cassait
# le build 7 000 pages plus loin, sur une erreur de typage au milieu de data.ts. Le coût
# se paie au build, pas ici - d'où le rejet en amont. TYPE_FIX rattrape les deux
# synonymes déjà vus plutôt que de perdre une fiche par ailleurs vérifiée : une grande
# salle couverte est un "Warehouse", un plein air est un "Festival".
TYPES = {"Festival","Club","Warehouse"}
TYPE_FIX = {"Rave": "Warehouse", "Open Air": "Festival", "Open-Air": "Festival",
            "Openair": "Festival", "Concert": "Club", "Party": "Club"}

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
        e["type"] = TYPE_FIX.get(e["type"], e["type"])
        if e["type"] not in TYPES:
            rejected.append((fn, e["title"], f'bad type {e["type"]!r}')); continue
        if (e.get("endDate") or e["date"]) < "2026-08-25":
            rejected.append((fn, e["title"], "already over")); continue
        # Normalise BEFORE the dedup key: a title carrying its edition year
        # ("Sziget Festival 2026") must match the stored "Sziget Festival",
        # otherwise an already-merged event comes back as a duplicate.
        e["title"] = re.sub(r"\s+20[0-9][0-9]$", "", e["title"])
        gone = REMOVED.get((norm(e["title"]), e["date"][:4]))
        if gone:
            rejected.append((fn, e["title"], f"retiré du catalogue : {gone}")); continue
        e["city"] = CITY_FIX.get(e["city"], e["city"])
        e["country"] = COUNTRY_FIX.get(e["country"], e["country"])
        e["currency"] = CURRENCY_FIX.get(e["currency"], e["currency"])
        key = (norm(e["title"]), e["date"][:4])
        bkey = (norm(e["city"]), norm(e["venue"]), e["date"])
        if key in existing or key in seen:
            skipped.append((fn, e["title"], e["date"])); continue
        if bkey in booked:
            skipped.append((fn, e["title"], e["date"] + " (même salle, même soir)")); continue
        seen.add(key); booked.add(bkey); rows.append(e); kept += 1
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
          f'venue: "{esc(e["venue"])}"']
    # Un `venue` descriptif en français ("Site outdoor d'Oigny") fuiterait tel quel
    # sur /en : `venueLabelL()` ne bascule que s'il trouve `venueEn`.
    if e.get("venueEn"): f.append(f'venueEn: "{esc(e["venueEn"])}"')
    f += [f'trending: {"true" if e["trending"] else "false"}',
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
    print("\n(dry run, data.ts untouched)" if DRY else "\nnothing to merge")
    sys.exit(0)

marker = "];\n\n/* AI-generated key-art posters"
assert marker in src, "events array end marker not found"
src = src.replace(marker,
    "\n  /* ---------- Pan-European expansion: verified events ----------\n"
    "     Researched per region, cross-checked against official sites, RA, Songkick,\n"
    "     Skiddle/Dice and local press. `priceNote` flags unconfirmed gate prices. */\n"
    + "\n".join(out) + "\n" + marker, 1)

# On ne cherche plus un commentaire précis après la map : celui-ci a déjà changé une
# fois (SPONSORED_TICKETS s'est intercalé) et le merge est mort dessus. On repart de
# la déclaration de TICKETS et on insère juste avant l'accolade qui la ferme.
tstart = src.index("const TICKETS: Record<number, string> = {")
tend = src.index("\n};", tstart)
src = src[:tend] + "\n" + "\n".join(tickets) + src[tend:]
open(DATA, "w").write(src)
print(f"\nwritten to lib/data.ts")
