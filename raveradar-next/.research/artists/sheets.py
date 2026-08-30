#!/usr/bin/env python3
"""Planches-contact des portraits publiés, pour les relire à l'oeil.

    python3 .research/artists/sheets.py            # tout le corpus
    python3 .research/artists/sheets.py --only amelie-lens,nina-kraviz

Pourquoi ce script existe : `avatars.py` sait mesurer (un visage est-il là, est-il
assez grand, l'image est-elle nette) mais il ne sait pas **qui** est sur la photo.
C'est exactement l'erreur qui a fait publier un badaud sur la fiche d'Amelie Lens :
tous les seuils étaient verts. La seule vérification qui attrape ça est un oeil qui
passe sur la grille, et pour qu'un oeil y passe il faut une planche, pas 263 onglets.

Les images sortent dans `.research/artists/sheets/` (hors dépôt), vingt-quatre par
planche, chacune sous son nom d'artiste.
"""
import argparse, json, math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "sheets"
COLS, ROWS, CELL, LABEL = 6, 4, 190, 26
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="", help="liste de slugs séparés par des virgules")
    args = ap.parse_args()

    meta = json.loads((HERE / "avatars.json").read_text())
    cat_file = HERE / "harvest" / "catalogue.json"
    names = {k: v["name"] for k, v in json.loads(cat_file.read_text()).items()} if cat_file.exists() else {}
    keep = {s.strip() for s in args.only.split(",") if s.strip()}
    items = sorted((k, v) for k, v in meta.items() if not keep or k in keep)
    try:
        font = ImageFont.truetype(FONT, 13)
    except OSError:
        font = ImageFont.load_default()

    OUT.mkdir(exist_ok=True)
    per = COLS * ROWS
    for page in range(math.ceil(len(items) / per)):
        chunk = items[page * per : (page + 1) * per]
        sheet = Image.new("RGB", (COLS * CELL, ROWS * (CELL + LABEL)), (12, 12, 18))
        draw = ImageDraw.Draw(sheet)
        for i, (slug, v) in enumerate(chunk):
            x, y = (i % COLS) * CELL, (i // COLS) * (CELL + LABEL)
            f = ROOT / "public" / "artists" / v["file"]
            if f.exists():
                sheet.paste(Image.open(f).convert("RGB").resize((CELL - 6, CELL - 6)), (x + 3, y + 3))
            draw.text((x + 4, y + CELL + 2), names.get(slug, slug)[:26], font=font, fill=(235, 235, 245))
        sheet.save(OUT / f"sheet{page:02d}.png")
    print(f"{len(items)} portrait(s) sur {math.ceil(len(items) / per)} planche(s) → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
