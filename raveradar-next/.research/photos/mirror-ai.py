#!/usr/bin/env python3
"""Rapatrie les affiches IA du CDN Higgsfield dans public/posters/.

  python3 .research/photos/mirror-ai.py --dry   # rapport sans rien écrire
  python3 .research/photos/mirror-ai.py         # télécharge, ré-encode, patche data.ts

Pourquoi : le CDN servait les PNG bruts du générateur, 3 à 4 Mo pièce pour une
image affichée sur 560 px de large, et des « _min.webp » à 171 Ko de moyenne,
jusqu'à 630 Ko, quand la même vignette pèse 45 Ko dans public/posters/. Un
listing de 24 cartes tirait donc 4 Mo d'images, et la fiche d'un festival illustré
par une affiche IA chargeait le PNG plein format en LCP. S'ajoutait un `Cache-Control`
absent sur les PNG (les _min.webp, eux, étaient bien en immutable) et une origine
tierce de plus à résoudre avant la première image.

On produit exactement les deux mêmes dérivés que `ingest.py` pour les photos, avec
le même nommage `{slug}-{hash}`, le hash de contenu rend le fichier immuable, donc
cacheable un an (voir `headers()` dans next.config.mjs) :

  ai-{slug}-{hash}.jpg       ratio d'origine, ≤1200 px (<img> pleine page, OG, JSON-LD
  ai-{slug}-{hash}_min.webp  crop 4:5 à 560×700       ) le poster des cartes

Le préfixe `ai-` garde le répertoire lisible : ces fichiers sont des visuels
d'illustration, pas des photos, et `imageAlt()` le dit déjà au lecteur.
"""
import argparse, hashlib, io, re, subprocess, sys, unicodedata
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "posters"
DATA_TS = ROOT / "lib" / "data.ts"
CACHE = Path(__file__).resolve().parent / ".cache-ai"

CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3EfATp4Hvlogg4NEZfgyJXfo5Sh/"
FULL_MAX = 1200
THUMB_W, THUMB_H = 560, 700
MIN_BYTES = 15_000

Image.MAX_IMAGE_PIXELS = 120_000_000
IMAGES_DECL = "export const IMAGES: Record<number, string> = {"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)[:48] or "poster"


def load():
    src = DATA_TS.read_text()
    block = src[src.index(IMAGES_DECL) + len(IMAGES_DECL):]
    block = block[: block.index("\n};")]
    images = {int(k): v for k, v in re.findall(r'^\s*(\d+): "([^"]+)",', block, re.M)}
    titles = {}
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        eid = int(re.search(r"id: (\d+)", line).group(1))
        m = re.search(r'title: "((?:[^"\\]|\\.)*)"', line)
        titles[eid] = m.group(1) if m else f"event-{eid}"
    return src, images, titles


def fetch(name: str) -> bytes:
    """curl (le proxy sortant est configuré pour lui) + cache disque : relancer le
    script ne retélécharge pas les ~800 Mo de PNG déjà rapatriés."""
    CACHE.mkdir(exist_ok=True)
    blob = CACHE / name
    if blob.exists() and blob.stat().st_size >= MIN_BYTES:
        return blob.read_bytes()
    for attempt in range(3):
        p = subprocess.run(["curl", "-sL", "-m", "120", CDN + name], capture_output=True)
        if p.returncode == 0 and len(p.stdout) >= MIN_BYTES and p.stdout[:4] == b"\x89PNG":
            blob.write_bytes(p.stdout)
            return p.stdout
    return b""


def derivatives(im: Image.Image, slug: str, dry: bool):
    """Mêmes dérivés que `ingest.py`, un seul gabarit de poster sur tout le site."""
    full = im.copy()
    full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)

    w, h = im.size
    target = THUMB_W / THUMB_H
    if w / h > target:
        nw = int(h * target)
        box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = int(w / target)
        top = int((h - nh) * 0.35)
        box = (0, top, w, top + nh)
    thumb = im.crop(box).resize((THUMB_W, THUMB_H), Image.LANCZOS)

    if not dry:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        full.save(OUT_DIR / f"{slug}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        thumb.save(OUT_DIR / f"{slug}_min.webp", "WEBP", quality=72, method=5)
    return full.size


def patch(src: str, mapping: dict, titles: dict, dry: bool, complete: bool) -> str:
    head = src[: src.index(IMAGES_DECL) + len(IMAGES_DECL)]
    rest = src[src.index(IMAGES_DECL) + len(IMAGES_DECL):]
    tail = rest[rest.index("\n};"):]
    lines = "\n".join(f'  {eid}: "{f}", // {titles.get(eid, "")}' for eid, f in sorted(mapping.items()))
    out = head + "\n" + lines + tail
    # Un seul id encore servi par le CDN et la base doit y rester : `imageFull()`
    # concatène IMG_BASE au nom de fichier, il n'y a pas de base par entrée.
    if complete:
        out = out.replace(
            'const IMG_BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3EfATp4Hvlogg4NEZfgyJXfo5Sh/";',
            'const IMG_BASE = "/posters/";',
        )
    if not dry:
        DATA_TS.write_text(out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    src, images, titles = load()
    todo = {k: v for k, v in images.items() if v.endswith(".png")}
    if args.limit:
        todo = dict(list(todo.items())[: args.limit])
    print(f"{len(todo)} affiches IA à rapatrier ({len(images) - len(todo)} déjà locales)")

    raws = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        for eid, raw in zip(todo, pool.map(lambda e: fetch(todo[e]), todo)):
            raws[eid] = raw

    mapping = {k: v for k, v in images.items() if not v.endswith(".png")}
    by_hash, failed, saved = {}, [], 0
    for i, (eid, raw) in enumerate(sorted(raws.items()), 1):
        if not raw:
            failed.append(eid)
            print(f"  [{i}/{len(raws)}] ✗ download id={eid} {todo[eid]}")
            continue
        digest = hashlib.sha1(raw).hexdigest()[:10]
        if digest in by_hash:
            slug = by_hash[digest]
        else:
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            slug = f"ai-{slugify(titles.get(eid, ''))}-{digest}"
            size = derivatives(im, slug, args.dry)
            by_hash[digest] = slug
            if not args.dry:
                saved += len(raw) - (OUT_DIR / f"{slug}.jpg").stat().st_size
            print(f"  [{i}/{len(raws)}] ✓ {slug}.jpg {size[0]}×{size[1]}")
        mapping[eid] = f"{slug}.jpg"

    if failed:
        print(f"\n⚠️  {len(failed)} échecs, ids {failed} conservés sur le CDN")
        for eid in failed:
            mapping[eid] = images[eid]
    patch(src, mapping, titles, args.dry, not failed)
    print(f"\n{'-' * 60}")
    print(f"fichiers écrits : {len(by_hash)} × 2   ({saved / 1048576:.0f} Mo de PNG évités)")
    print(f"map IMAGES      : {len(mapping)} entrées" + ("  (dry)" if args.dry else ""))
    if failed:
        print("IMG_BASE reste sur le CDN tant qu'un id y pointe, relancer le script.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
