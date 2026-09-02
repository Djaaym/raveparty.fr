#!/usr/bin/env python3
"""Régénère lib/flyer-photos.ts, les fichiers de public/posters/ qui sont une AFFICHE.

`PHOTOS` (lib/data.ts) mélange trois choses par construction : une photo de mainstage,
une photo de salle, et l'affiche officielle publiée par l'organisateur. Les trois
illustrent légitimement un événement, mais l'`alt` n'avait que deux états et annonçait
« Photo de … » sur les trois. Dire d'une affiche que c'est une photo est faux, et
`imageAlt()` existe précisément pour rester honnête sur la source.

Les lots de `.research/photos/` portent déjà l'information dans leur `note`, elle ne
remontait simplement pas jusqu'à l'app. Ce script fait le pont, sur le modèle exact de
`venue-shots.py` : la clé est le **fichier** et pas l'id, parce qu'une même affiche de
tournée sert plusieurs dates.

Ce qui n'entre pas ici : le visuel carré d'une fiche Skiddle (`_1024.jpg`). C'est bien
ce que le promoteur a versé, mais rien ne dit que c'est une affiche plutôt qu'une
photo, et on ne devine pas.

    python3 .research/photos/flyer-shots.py
"""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AFFICHE = re.compile(r"\baffiche\b|\bflyer\b|\bposter\b|\bartwork\b", re.I)

ids = set()
for f in sorted(glob.glob(os.path.join(ROOT, ".research/photos/*.json"))):
    if os.path.basename(f).startswith("_"):
        continue
    try:
        d = json.load(open(f, encoding="utf-8"))
    except json.JSONDecodeError:
        continue
    rows = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
    for r in rows:
        if isinstance(r, dict) and isinstance(r.get("id"), int) and AFFICHE.search(r.get("note") or ""):
            ids.add(r["id"])

data = open(os.path.join(ROOT, "lib/data.ts"), encoding="utf-8").read()
block = data[data.index("export const PHOTOS"):]
block = block[: block.index("\n};")]
photos = {int(m[1]): m[2] for m in re.finditer(r"^\s*(\d+):\s*\"([^\"]+)\"", block, re.M)}

files = sorted({photos[i] for i in ids if i in photos})
open(os.path.join(ROOT, "lib/flyer-photos.ts"), "w", encoding="utf-8").write(
    "/* GÉNÉRÉ, ne pas éditer à la main : `python3 .research/photos/flyer-shots.py`.\n"
    " *\n"
    " * Les fichiers de `PHOTOS` (lib/data.ts) qui sont une AFFICHE publiée par\n"
    " * l'organisateur, et pas une photo. `imageAlt()` n'avait que deux états et\n"
    " * annonçait « Photo de … » sur les trois contenus que `PHOTOS` mélange : dire\n"
    " * d'une affiche que c'est une photo est faux, et cet `alt` existe justement pour\n"
    " * rester honnête sur la source. Les lots de `.research/photos/` portaient déjà\n"
    " * l'information dans leur `note`, elle ne remontait pas jusqu'à l'app.\n"
    " *\n"
    " * Module feuille, comme `venue-photos.ts` : la clé est le fichier et pas l'id,\n"
    " * parce qu'une affiche de tournée sert plusieurs dates.\n"
    " */\n"
    "export const FLYERS: ReadonlySet<string> = new Set([\n"
    + "".join(f'  "{f}",\n' for f in files)
    + "]);\n"
)
print(f"{len(ids)} ids marqués affiche -> {len(files)} fichiers -> lib/flyer-photos.ts")
