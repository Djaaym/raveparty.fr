#!/usr/bin/env python3
"""Audit d'intégrité du catalogue — étape 3 du protocole « Ajouter des événements
en masse » (voir CLAUDE.md). À lancer après chaque `merge.py`.

    python3 .research/audit.py

Contrôle : ids uniques, genres connus, `country` présent dans COUNTRY_FR *et*
COUNTRY_FLAG (c'est ce test qui attrape les synonymes du type « United Kingdom »
qui créent une deuxième page pays), devise stockée en symbole et non en code ISO
(« EUR55 »), coordonnées dans la fenêtre européenne, `desc`/`descEn`/`time`
présents, `endDate` postérieure à `date`, titre sans année d'édition, `region`
sur les fiches françaises, collision de slug (titre, année), collision de
créneau (ville, salle, jour), entrées orphelines dans les maps indexées par id,
et dates FR inatteignables depuis toute page `/rave-party/{lieu}`.

Sort en 1 dès qu'une anomalie est trouvée.
"""
import os, re, sys, unicodedata

# Un artiste du catalogue s'appelle littéralement « [IVY] ». Un `\[(.*?)\]` non gourmand
# s'arrête donc sur SON crochet et tronque le line-up : les noms qui suivent
# disparaissent de l'index, sans erreur ni message. On ne reconnaît que des chaînes
# entre guillemets, ce qu'un crochet ne peut pas interrompre.
LINEUP = re.compile(r'lineup: \[((?:"(?:[^"\\]|\\.)*"(?:, )?)*)\]')

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = open(os.path.join(ROOT, "lib/data.ts")).read()
# Les couleurs de genre et les libellés de pays ont quitté data.ts pour `lib/display.ts`,
# un module feuille : un composant client qui importe le catalogue embarque ses 830 Ko
# dans le bundle du navigateur (voir l'en-tête de display.ts). Même chose pour `PLACES`,
# passé dans `lib/places-list.ts`. L'audit lit donc les deux fichiers, concaténés — il
# ne cherche que des déclarations, l'ordre n'a pas d'importance.
src += "\n" + open(os.path.join(ROOT, "lib/display.ts")).read()
places_src = (open(os.path.join(ROOT, "lib/places.ts")).read()
              + "\n" + open(os.path.join(ROOT, "lib/places-list.ts")).read())

GENRES = set(re.findall(r'^  "?([A-Za-z &]+?)"?: \{ c1:', src, re.M))
# Les maps sont en format compact (plusieurs paires par ligne), clé nue ou entre
# guillemets quand elle contient un espace.
PAIR = re.compile(r'(?:"([^"]+)"|([A-Za-z][\w]*))\s*:\s*"([^"]+)"')
def parse_map(name):
    # Ancré sur la déclaration : depuis que ces maps vivent dans `lib/display.ts`,
    # `data.ts` en contient aussi le *nom*, dans sa ligne d'import — la chercher sans
    # `export const` tombait dessus et rendait une map vide, donc tout le catalogue
    # « absent de COUNTRY_FR ».
    body = re.search(rf'export const {name}[^{{]*\{{(.*?)\n\}};', src, re.S).group(1)
    return {(a or b): v for a, b, v in PAIR.findall(body)}
CFR, CFLAG = parse_map("COUNTRY_FR"), parse_map("COUNTRY_FLAG")

def slugify(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")

ev = []
for line in src.split("\n"):
    if not re.match(r'\s*\{ id: \d+,', line): continue
    d = dict(re.findall(r'(\w+): "((?:[^"\\]|\\.)*)"', line))
    d["id"] = int(re.search(r'id: (\d+)', line).group(1))
    for k in ("lat", "lng", "price"):
        m = re.search(rf'{k}: (-?[\d.]+)', line)
        if m: d[k] = float(m.group(1))
    g = re.search(r'genres: \[([^\]]*)\]', line)
    d["genres"] = re.findall(r'"([^"]+)"', g.group(1)) if g else []
    l = LINEUP.search(line)
    d["lineup"] = re.findall(r'"([^"]+)"', l.group(1)) if l else []
    ev.append(d)

bad = []
seen_id, seen_slug = {}, {}
for e in ev:
    tag = f'#{e["id"]} {e.get("title","?")}'
    if e["id"] in seen_id: bad.append(f'{tag}: id dupliqué (aussi « {seen_id[e["id"]]} »)')
    seen_id[e["id"]] = e.get("title")
    for g in e["genres"]:
        if g not in GENRES: bad.append(f'{tag}: genre inconnu « {g} »')
    if not e["genres"]: bad.append(f'{tag}: aucun genre')
    c = e.get("country", "")
    if c not in CFR: bad.append(f'{tag}: country « {c} » absent de COUNTRY_FR')
    if c not in CFLAG: bad.append(f'{tag}: country « {c} » absent de COUNTRY_FLAG')
    cur = e.get("currency", "")
    if re.fullmatch(r"[A-Z]{3}", cur) and cur not in ("CHF", "RSD", "BGN"):
        bad.append(f'{tag}: devise en code ISO « {cur} » (attendu : symbole)')
    if not cur: bad.append(f'{tag}: devise vide')
    lat, lng = e.get("lat"), e.get("lng")
    if lat is None or lng is None: bad.append(f'{tag}: coordonnées manquantes')
    elif not (34 < lat < 72 and -26 < lng < 46) and c != "Mexico":
        bad.append(f'{tag}: coordonnées hors Europe ({lat},{lng})')
    if not e.get("descEn"): bad.append(f'{tag}: descEn manquant')
    if not e.get("desc"): bad.append(f'{tag}: desc manquant')
    if not e.get("time"): bad.append(f'{tag}: horaire manquant')
    if e.get("endDate") and e["endDate"] < e["date"]:
        bad.append(f'{tag}: endDate < date')
    if re.search(r"\b20\d\d\b", e.get("title", "")):
        bad.append(f'{tag}: le titre porte une année')
    if c == "France" and not e.get("region"):
        bad.append(f'{tag}: événement FR sans region (département)')
    s = slugify(e.get("title", ""))
    key = (s, e.get("date", "")[:4])
    if key in seen_slug: bad.append(f'{tag}: slug+année en collision avec « {seen_slug[key]} »')
    seen_slug[key] = e.get("title")

booked = {}
for e in ev:
    k = (slugify(e.get("city","")), slugify(e.get("venue","")), e.get("date",""))
    if k in booked: bad.append(f'#{e["id"]} {e.get("title")}: même (ville, salle, jour) que « {booked[k]} »')
    booked[k] = e.get("title")

# Couverture PLACES : `eventsForPlace` matche sur la ville OU la région, donc une
# ville sans entrée propre reste atteignable via la page de son département.
names = set()
for m in re.finditer(r'\{ slug: "([^"]+)", label: "([^"]+)"[^}]*?(?:match: \[([^\]]*)\])?\s*\}', places_src):
    names.add(slugify(m.group(2)))
    if m.group(3): names |= {slugify(x) for x in re.findall(r'"([^"]+)"', m.group(3))}
for m in re.finditer(r'match: \[([^\]]*)\]', places_src):
    names |= {slugify(x) for x in re.findall(r'"([^"]+)"', m.group(1))}
names |= {slugify(x) for x in re.findall(r'label: "([^"]+)"', places_src)}
orphan = sorted({f'{e["city"]} ({e.get("region","?")})' for e in ev
                 if e.get("country") == "France" and e.get("date", "") >= "2026-08-18"
                 and slugify(e["city"]) not in names and slugify(e.get("region", "")) not in names})

# Maps indexées par id : entrées orphelines
ids = {e["id"] for e in ev}
for name in ("IMAGES", "PHOTOS", "TICKETS"):
    m = re.search(rf'const {name}[^{{]*\{{(.*?)\n\}};', src, re.S)
    if not m: continue
    keys = {int(k) for k in re.findall(r'^\s*(\d+):', m.group(1), re.M)}
    dead = sorted(keys - ids)
    if dead: bad.append(f'{name}: {len(dead)} entrée(s) sur des ids supprimés → {dead[:10]}')

print(f"{len(ev)} événements, {len(GENRES)} genres, {len(CFR)} pays FR / {len(CFLAG)} drapeaux")
if orphan:
    print(f"\n⚠ Dates FR à venir hors de toute page lieu ({len(orphan)}) : {', '.join(orphan)}")
if bad:
    print(f"\n✗ {len(bad)} anomalie(s) :")
    for b in bad: print("  -", b)
    sys.exit(1)
print("\n✓ Aucune anomalie")
