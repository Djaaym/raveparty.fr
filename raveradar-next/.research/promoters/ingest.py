#!/usr/bin/env python3
"""Ingère les lots d'organisateurs et réécrit la map de lib/promoters.ts.

    python3 .research/promoters/ingest.py --dry   # puis sans --dry

Le schéma et les règles de vérification sont dans le README de ce répertoire. Ce
script ne juge pas de la qualité d'une source, il refuse ce qui est structurellement
faux et rapporte ce qui est douteux :

- un `country` absent du catalogue (c'est le test qui attrape « United Kingdom » là où
  le catalogue dit « UK », le même synonyme qui avait fabriqué une seconde page pays) ;
- un libellé de `venues` qui n'existe pas au catalogue à la lettre près, donc qui ne
  ramènera jamais rien ;
- un slug en double entre deux lots, signalé au lieu d'être écrasé en silence ;
- un tiret cadratin dans un texte publié, interdit partout dans le dépôt.

Il calcule aussi, avec **exactement** la règle de `lib/promoters.ts` (mots entiers,
jamais une sous-chaîne), combien d'événements chaque marque touche, sur combien de
salles et de villes. Une marque sans page (moins de deux dates, ou tout dans une seule
salle) est écrite quand même dans la map : c'est `build()` qui tranche au build, et la
marque entrera d'elle-même le jour où un lot lui apporte une date ailleurs.
"""
import glob, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
DRY = "--dry" in sys.argv
SHOW = "--show" in sys.argv
KINDS = {"collectif", "organisateur", "club", "label"}


def slugify(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def words(s):
    return [w for w in slugify(s).split("-") if w]


def run_of(hay, needle):
    n = len(needle)
    return n > 0 and any(hay[i:i + n] == needle for i in range(len(hay) - n + 1))


def esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


# ---- le catalogue, pour valider et pour compter -----------------------------
data = open(os.path.join(ROOT, "lib/data.ts"), encoding="utf-8").read()
EVENTS = [
    {"title": m[1], "city": m[2], "country": m[3], "venue": m[4]}
    for m in re.finditer(
        r'\{ id: \d+, title: "(.*?)", type: "\w+", genres: \[.*?\], city: "(.*?)", country: "(.*?)",'
        r'.*?venue: "(.*?)"',
        data,
    )
]
if not EVENTS:
    sys.exit("catalogue illisible : aucun événement extrait de lib/data.ts")
COUNTRIES = {e["country"] for e in EVENTS}
VENUE_SLUGS = {slugify(e["venue"]) for e in EVENTS}
INDEXED = [(words(e["title"]), slugify(e["venue"]), e) for e in EVENTS]

# ---- les lots ---------------------------------------------------------------
rows, seen, errors, warnings = [], {}, [], []
for path in sorted(glob.glob(os.path.join(HERE, "promoters-*.json"))):
    name = os.path.basename(path)
    try:
        lot = json.load(open(path, encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{name} : JSON illisible ({exc})")
        continue
    if not isinstance(lot, list):
        errors.append(f"{name} : le lot doit être un tableau")
        continue
    for i, r in enumerate(lot):
        where = f"{name}[{i}]"
        if not isinstance(r, dict):
            errors.append(f"{where} : entrée qui n'est pas un objet")
            continue
        missing = [k for k in ("name", "kind", "city", "country", "desc", "match") if not r.get(k)]
        if missing:
            errors.append(f"{where} ({r.get('name', '?')}) : champ(s) manquant(s) {', '.join(missing)}")
            continue
        if not r.get("verified") or not r.get("sources"):
            errors.append(f"{where} ({r['name']}) : `verified` et `sources` sont obligatoires")
            continue
        if r["kind"] not in KINDS:
            errors.append(f"{where} ({r['name']}) : `kind` inconnu « {r['kind']} »")
            continue
        if r["country"] not in COUNTRIES:
            errors.append(
                f"{where} ({r['name']}) : pays « {r['country']} » absent du catalogue "
                f"(une variante crée une page concurrente)"
            )
            continue
        slug = r.get("slug") or slugify(r["name"])
        if slug in seen:
            errors.append(f"{where} ({r['name']}) : slug « {slug} » déjà fourni par {seen[slug]}")
            continue
        for field in ("desc", "descEn", "name"):
            if "—" in (r.get(field) or ""):
                errors.append(f"{where} ({r['name']}) : tiret cadratin dans `{field}`")
        bad = [v for v in (r.get("venues") or []) if slugify(v) not in VENUE_SLUGS]
        if bad:
            errors.append(f"{where} ({r['name']}) : salle(s) absente(s) du catalogue : {', '.join(bad)}")
            continue
        since = r.get("since")
        if since is not None and not (isinstance(since, int) and 1970 <= since <= 2026):
            errors.append(f"{where} ({r['name']}) : `since` invalide ({since})")
            continue

        needles = [words(m) for m in r["match"]]
        nots = [words(m) for m in (r.get("exclude") or [])]
        only = set(r.get("countries") or [])
        vslugs = {slugify(v) for v in (r.get("venues") or [])}
        held = [
            e
            for ttl, vsl, e in INDEXED
            if (not only or e["country"] in only)
            and (vsl in vslugs or any(run_of(ttl, n) for n in needles))
            and not any(run_of(ttl, n) for n in nots)
        ]
        if not held:
            errors.append(f"{where} ({r['name']}) : aucune date au catalogue, sa page serait vide")
            continue
        venues = {slugify(e["venue"]) for e in held}
        cities = {slugify(e["city"]) for e in held}
        titles = {slugify(e["title"]) for e in held}
        if len(held) < 2 or (len(venues) < 2 and len(cities) < 2) or len(titles) < 2:
            warnings.append(
                f"{r['name']} : {len(held)} date(s), {len(venues)} salle(s), {len(cities)} ville(s), "
                f"{len(titles)} titre(s) -> pas de page, une fiche de lieu ou de festival dit déjà la même chose"
            )
        off = {e["country"] for e in held} - {r["country"]} - set(r.get("countries") or [])
        if off:
            warnings.append(f"{r['name']} : dates hors de son pays d'attache ({', '.join(sorted(off))})")

        seen[slug] = name
        r["slug"] = slug
        r["_held"] = len(held)
        r["_venues"] = len(venues)
        r["_cities"] = len(cities)
        r["_titles"] = len(titles)
        r["_held_rows"] = held
        rows.append(r)

rows.sort(key=lambda r: r["slug"])

print(f"{len(rows)} organisateur(s) retenu(s) sur {len(seen)} slug(s).")
for w in warnings:
    print(f"  avertissement : {w}")
for e in errors:
    print(f"  ERREUR : {e}")
if errors:
    sys.exit("lot refusé, rien n'a été écrit")

if SHOW:
    for r in rows:
        print(f"\n== {r['slug']} ({len(r['_held_rows'])})")
        for e in sorted(r["_held_rows"], key=lambda e: e["title"]):
            print(f"   {e['country']:<14} {e['city']:<14} {e['venue'][:28]:<28} {e['title']}")

for r in rows:
    print(f"  {r['slug']:<28} {r['_held']:>3} dates  {r['_venues']:>2} salles  {r['_cities']:>2} villes  {r['_titles']:>2} titres")

# ---- réécriture de la map ---------------------------------------------------
def emit(r):
    parts = [f'slug: "{esc(r["slug"])}"', f'name: "{esc(r["name"])}"', f'kind: "{r["kind"]}"',
             f'city: "{esc(r["city"])}"', f'country: "{esc(r["country"])}"']
    if r.get("since"):
        parts.append(f'since: {r["since"]}')
    parts.append(f'desc: "{esc(" ".join(r["desc"].split()))}"')
    if r.get("descEn"):
        parts.append(f'descEn: "{esc(" ".join(r["descEn"].split()))}"')
    for k in ("site", "instagram"):
        if r.get(k):
            parts.append(f'{k}: "{esc(r[k])}"')
    parts.append("match: [" + ", ".join(f'"{esc(m)}"' for m in r["match"]) + "]")
    for k in ("countries", "exclude"):
        if r.get(k):
            parts.append(f"{k}: [" + ", ".join(f'"{esc(v)}"' for v in r[k]) + "]")
    if r.get("venues"):
        parts.append("venues: [" + ", ".join(f'"{esc(v)}"' for v in r["venues"]) + "]")
    return "  { " + ", ".join(parts) + " },"


block = "/* PROMOTERS:start */\nconst RAW: Promoter[] = [\n" + "\n".join(emit(r) for r in rows) + "\n];\n/* PROMOTERS:end */"
path = os.path.join(ROOT, "lib/promoters.ts")
src = open(path, encoding="utf-8").read()
start = src.index("/* PROMOTERS:start */")
end = src.index("/* PROMOTERS:end */") + len("/* PROMOTERS:end */")
out = src[:start] + block + src[end:]
if DRY:
    print("\n--dry : lib/promoters.ts inchangé.")
else:
    open(path, "w", encoding="utf-8").write(out)
    print(f"\nlib/promoters.ts réécrit ({len(rows)} entrées).")
