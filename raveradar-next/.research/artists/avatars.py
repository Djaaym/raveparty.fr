#!/usr/bin/env python3
"""Télécharge les portraits Wikimedia Commons et les uniformise.

  python3 .research/artists/avatars.py --dry   # rapport sans rien écrire
  python3 .research/artists/avatars.py         # télécharge et écrit public/artists/

Les sources sont hétérogènes par nature : une photo de scène sous-exposée à côté
d'un portrait studio en plein jour. Sur une grille d'artistes ça fait un patchwork.
La cohérence ne peut donc pas venir de la source, elle vient du traitement — même
cadrage carré, même taille, même virage duotone sur la palette du site.

Le recadrage est décentré vers le haut (CROP_BIAS) : sur une photo en pied, le
centre géométrique tombe sur le torse, pas sur le visage.

Chaque fichier retenu porte sa licence dans lib/bios.ts — voir le champ `photo`.
Sans auteur ni licence, la photo est rejetée : une image CC BY sans crédit est
une contrefaçon, pas un raccourci.
"""
import argparse, hashlib, io, json, re, sys, unicodedata
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "artists"

SIZE = 400          # affiché en 160-200 px, donc net en écran 2×
MIN_SRC = 320       # en dessous, l'upscale se voit
CROP_BIAS = 0.34    # part de la hauteur laissée au-dessus du carré (visage ≠ centre)
# Duotone : ombres vers le bleu-violet du site, hautes lumières vers un blanc chaud.
SHADOW = (26, 22, 48)
HIGHLIGHT = (243, 243, 248)
MIX = 0.72          # 1 = duotone pur, 0 = niveaux de gris

from PIL import Image, ImageOps

UA = "RaveRadarBot/1.0 (https://www.raveparty.fr; contact via site) Python-urllib"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def fetch(url: str) -> bytes:
    # Commons refuse les requêtes sans User-Agent identifiable.
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=45) as r:
        return r.read()


def duotone(img: Image.Image) -> Image.Image:
    """Niveaux de gris → rampe SHADOW→HIGHLIGHT, puis remélangé avec l'original."""
    grey = ImageOps.grayscale(img)
    ramp = []
    for c in range(3):
        ramp += [int(SHADOW[c] + (HIGHLIGHT[c] - SHADOW[c]) * i / 255) for i in range(256)]
    toned = grey.convert("RGB")
    toned = toned.point(ramp)
    return Image.blend(grey.convert("RGB"), toned, MIX)


def square(img: Image.Image) -> Image.Image:
    w, h = img.size
    if w > h:
        left = (w - h) // 2
        img = img.crop((left, 0, left + h, h))
    elif h > w:
        top = int((h - w) * CROP_BIAS)
        img = img.crop((0, top, w, top + w))
    return img.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    rows = []
    for f in sorted(HERE.glob("bios-*.json")):
        try:
            rows += json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ {f.name} : JSON invalide ({e})")
            return 1

    OUT.mkdir(parents=True, exist_ok=True)
    seen_hash, out_map, skipped = {}, {}, []

    for r in rows:
        name = (r.get("name") or "").strip()
        slug = slugify(name)
        url = (r.get("photo_url") or "").strip()
        author = (r.get("photo_author") or "").strip()
        lic = (r.get("photo_license") or "").strip()
        page = (r.get("photo_page") or "").strip()

        if not url:
            continue
        if not url.startswith("https://upload.wikimedia.org/"):
            skipped.append((name, "hors Wikimedia Commons")); continue
        if not (author and lic and page):
            skipped.append((name, "auteur ou licence manquant → réutilisation non conforme")); continue

        try:
            raw = fetch(url)
            img = Image.open(io.BytesIO(raw))
            img = ImageOps.exif_transpose(img).convert("RGB")
        except Exception as e:
            skipped.append((name, f"téléchargement/décodage : {str(e)[:60]}")); continue

        if min(img.size) < MIN_SRC:
            skipped.append((name, f"trop petite ({img.size[0]}×{img.size[1]})")); continue

        h = hashlib.sha1(raw).hexdigest()[:10]
        if h in seen_hash and seen_hash[h] != slug:
            skipped.append((name, f"même image que {seen_hash[h]} — probable erreur d'identification"))
            continue
        seen_hash[h] = slug

        if not args.dry:
            duotone(square(img)).save(OUT / f"{slug}.webp", "WEBP", quality=86, method=6)
        out_map[slug] = {"file": f"{slug}.webp", "author": author, "license": lic, "page": page}
        print(f"  ✓ {name:32} {img.size[0]}×{img.size[1]} → {slug}.webp  [{lic}]")

    print(f"\n{len(out_map)} portrait(s) · {len(skipped)} écarté(s)")
    for name, why in skipped:
        print(f"  ✗ {name:32} {why}")

    meta = HERE / "avatars.json"
    if not args.dry:
        meta.write_text(json.dumps(out_map, indent=1, ensure_ascii=False))
        print(f"\n✓ public/artists/ + {meta.name} écrits. Lance ingest.py pour patcher lib/bios.ts.")
    else:
        print("\n--dry : rien écrit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
