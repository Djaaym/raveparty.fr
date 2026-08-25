#!/usr/bin/env python3
"""Régénère lib/venue-photos.ts — les fichiers de public/posters/ qui montrent le LIEU.

`PHOTOS` (lib/data.ts) mélange trois choses par construction : une photo de mainstage,
une photo de salle, et l'affiche officielle de l'organisateur. Les trois illustrent
légitimement un *événement*. Une seule illustre le *lieu* : mettre le flyer d'une
soirée sur la carte d'un club, c'est montrer autre chose que ce que la carte annonce.

Les lots de `.research/photos/` portent déjà l'information (`kind: "venue"`), elle
n'était simplement pas remontée jusqu'à l'app. Ce script fait le pont : ids marqués
venue -> fichiers correspondants dans PHOTOS.

    python3 .research/photos/venue-shots.py
"""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

ids = set()
for f in sorted(glob.glob(os.path.join(ROOT, ".research/photos/*.json"))):
    if os.path.basename(f).startswith("_ingest-report"):
        continue
    try:
        d = json.load(open(f, encoding="utf-8"))
    except json.JSONDecodeError:
        continue
    rows = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
    for r in rows:
        if isinstance(r, dict) and r.get("kind") == "venue" and isinstance(r.get("id"), int):
            ids.add(r["id"])

data = open(os.path.join(ROOT, "lib/data.ts"), encoding="utf-8").read()
block = data[data.index("export const PHOTOS"):]
block = block[: block.index("\n};")]
photos = {int(m[1]): m[2] for m in re.finditer(r"^\s*(\d+):\s*\"([^\"]+)\"", block, re.M)}

files = sorted({photos[i] for i in ids if i in photos})
out = os.path.join(ROOT, "lib/venue-photos.ts")
open(out, "w", encoding="utf-8").write(
    "/* GÉNÉRÉ — ne pas éditer à la main : `python3 .research/photos/venue-shots.py`.\n"
    " *\n"
    " * Les fichiers de `PHOTOS` (lib/data.ts) qui montrent la SALLE et pas l'événement.\n"
    " * `PHOTOS` mélange trois choses par construction — photo de mainstage, photo de\n"
    " * salle, affiche officielle de l'organisateur — et les trois illustrent\n"
    " * légitimement un événement. Une seule illustre le lieu : mettre le flyer d'une\n"
    " * soirée sur la carte d'un club montre autre chose que ce que la carte annonce.\n"
    " * Les lots de `.research/photos/` portaient déjà l'information (`kind: \"venue\"`),\n"
    " * elle ne remontait simplement pas jusqu'à l'app.\n"
    " */\n"
    f"export const VENUE_SHOTS: ReadonlySet<string> = new Set([\n"
    + "".join(f'  "{f}",\n' for f in files)
    + "]);\n"
)
print(f"{len(ids)} ids marqués venue -> {len(files)} fichiers -> lib/venue-photos.ts")
