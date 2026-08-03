#!/usr/bin/env python3
"""Ingère les photos trouvées par les agents dans public/posters/ + lib/data.ts.

  python3 .research/photos/ingest.py --dry     # rapport sans rien écrire
  python3 .research/photos/ingest.py           # télécharge, optimise, patche data.ts

Pour chaque URL retenue on produit deux fichiers dans public/posters/ :
  {slug}.jpg       ratio d'origine, ≤1600 px — Open Graph et JSON-LD
  {slug}_min.webp  crop 4:5 à 560×700       — le poster des cartes

Deux événements qui pointent la même URL (une photo de salle partagée par toutes
ses dates) partagent le même fichier : la dédup se fait sur l'URL *et* sur le
hash du contenu téléchargé.
"""
import argparse, hashlib, io, json, re, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PHOTOS_DIR = ROOT / ".research" / "photos"
OUT_DIR = ROOT / "public" / "posters"
DATA_TS = ROOT / "lib" / "data.ts"

MIN_WIDTH = 500          # en dessous, la photo pixellise sur une carte 4:5
MIN_BYTES = 15_000
FLAT_STD = 18            # écart-type sous lequel l'image est probablement un logo sur fond uni
FULL_MAX = 1600
THUMB_W, THUMB_H = 560, 700

from PIL import Image, ImageStat
Image.MAX_IMAGE_PIXELS = 120_000_000


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)[:48] or "photo"


def load_events():
    src = DATA_TS.read_text()
    block = src[src.index("export const IMAGES: Record<number, string> = {"):]
    block = block[: block.index("\n};")]
    have = {int(m) for m in re.findall(r"^\s*(\d+):", block, re.M)}
    events = {}
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        def f(k):
            m = re.search(r"\b" + k + r': "((?:[^"\\]|\\.)*)"', line)
            return m.group(1) if m else None
        eid = int(re.search(r"id: (\d+)", line).group(1))
        events[eid] = dict(id=eid, title=f("title"), city=f("city"), venue=f("venue"), type=f("type"))
    return events, have


def candidates(url: str):
    """URLs à essayer dans l'ordre.

    Les vignettes Commons arrivent souvent en 220px, trop petites pour une carte.
    Attention : upload.wikimedia.org ne sert *que* des largeurs standard — 960,
    1280 et 1920 répondent, 1024/1200/1600 renvoient un 400. D'où la cascade,
    qui finit sur le fichier d'origine (hors /thumb/).
    """
    url = url.split("?")[0] if "upload.wikimedia.org" in url else url
    if "upload.wikimedia.org" in url and "/thumb/" in url:
        out = [re.sub(r"/\d+px-", f"/{w}px-", url) for w in (1280, 1920, 960)]
        original = re.sub(r"/thumb/(.+)/[^/]+$", r"/\1", url)
        return out + [original]
    return [url]


def fetch(url: str):
    """curl plutôt que urllib : le proxy sortant est déjà configuré pour lui."""
    p = subprocess.run(
        ["curl", "-sL", "-m", "45", "--retry", "2", "-A",
         "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
         url],
        capture_output=True,
    )
    return p.stdout if p.returncode == 0 else b""


def quality_check(raw: bytes):
    """→ (Image RGB, None) si l'image est utilisable, sinon (None, raison)."""
    if len(raw) < MIN_BYTES:
        return None, f"trop léger ({len(raw)} o)"
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
    except Exception as e:
        return None, f"illisible ({type(e).__name__})"
    if im.width < MIN_WIDTH:
        return None, f"trop petit ({im.width}×{im.height})"
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (10, 11, 17))
        conv = im.convert("RGBA")
        bg.paste(conv, mask=conv.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    stat = ImageStat.Stat(im.resize((64, 64)))
    if sum(stat.stddev) / 3 < FLAT_STD:
        return None, "image plate (logo/aplat ?)"
    return im, None


def derivatives(im: Image.Image, slug: str, dry: bool):
    full = im.copy()
    full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)

    # crop 4:5 centré, en gardant le haut de l'image (une scène est rarement au sol)
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


START, END = "/* PHOTOS:start */\n", "/* PHOTOS:end */"


def patch_data_ts(mapping, events, dry):
    """Réécrit la map PHOTOS entre les deux marqueurs de lib/data.ts."""
    src = DATA_TS.read_text()
    lines = []
    for eid in sorted(mapping):
        e = events[eid]
        title = e["title"].replace("*/", "")
        lines.append(f'  {eid}: "{mapping[eid]}", // {title} — {e["city"]}')
    body = "export const PHOTOS: Record<number, string> = {\n" + "\n".join(lines) + "\n};\n"
    i, j = src.index(START) + len(START), src.index(END)
    new = src[:i] + body + src[j:]
    if not dry:
        DATA_TS.write_text(new)
    return len(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    events, already = load_events()
    entries, seen_ids, dupes = [], set(), 0
    for f in sorted(PHOTOS_DIR.glob("photos-*.json")):
        try:
            data = json.loads(f.read_text())
        except Exception as e:
            print(f"!! {f.name} illisible : {e}")
            continue
        for row in data:
            eid, url = row.get("id"), (row.get("image") or "").strip()
            if not isinstance(eid, int) or eid not in events:
                print(f"!! {f.name}: id inconnu {eid!r}")
                continue
            if eid in already:
                continue                      # déjà une affiche Higgsfield, on n'y touche pas
            if not url.startswith("https://"):
                print(f"!! {f.name}: id {eid} URL non https ({url[:60]})")
                continue
            if eid in seen_ids:
                dupes += 1
                continue
            seen_ids.add(eid)
            entries.append(dict(id=eid, url=url, src=f.name, kind=row.get("kind"), credit=row.get("credit"),
                                sourcePage=row.get("sourcePage")))

    print(f"{len(entries)} événements proposés ({dupes} doublons ignorés), sur {len(events)} au total")

    by_url = {}
    for e in entries:
        by_url.setdefault(e["url"], []).append(e)
    print(f"{len(by_url)} URLs distinctes à télécharger\n")

    mapping, by_hash, rejected = {}, {}, []
    for i, (url, group) in enumerate(sorted(by_url.items()), 1):
        raw = b""
        for cand in candidates(url):
            raw = fetch(cand)
            if len(raw) >= MIN_BYTES:
                break
        if not raw:
            rejected.append((url, "téléchargement échoué", [g["id"] for g in group]))
            print(f"  [{i}/{len(by_url)}] ✗ download  {url[:80]}")
            continue
        digest = hashlib.sha1(raw).hexdigest()[:10]
        if digest in by_hash:                 # même fichier servi par deux URLs
            slug = by_hash[digest]
        else:
            im, why = quality_check(raw)
            if im is None:
                rejected.append((url, why, [g["id"] for g in group]))
                print(f"  [{i}/{len(by_url)}] ✗ {why:<24} {url[:70]}")
                continue
            base = group[0]
            ev = events[base["id"]]
            label = ev["venue"] if base.get("kind") == "venue" else ev["title"]
            slug = f"{slugify(label)}-{digest}"
            size = derivatives(im, slug, args.dry)
            by_hash[digest] = slug
            print(f"  [{i}/{len(by_url)}] ✓ {slug}.jpg {size[0]}×{size[1]} → {len(group)} event(s)")
        for g in group:
            mapping[g["id"]] = f"{slug}.jpg"

    n = patch_data_ts(mapping, events, args.dry) if mapping else 0
    still = [i for i in events if i not in already and i not in mapping]
    print(f"\n{'—' * 60}")
    print(f"photos retenues        : {len(mapping)} événements / {len(by_hash)} fichiers")
    print(f"rejets                 : {len(rejected)} URLs")
    print(f"déjà illustrés (IA)    : {len(already)}")
    print(f"toujours sans image    : {len(still)}")
    if args.dry:
        print("\n(--dry : rien n'a été écrit)")
    if rejected:
        print("\nRejets détaillés :")
        for url, why, ids in rejected:
            print(f"  {why:<28} ids={ids} {url[:70]}")
    json.dump({"mapping": mapping, "still_missing": sorted(still),
               "rejected": [{"url": u, "why": w, "ids": i} for u, w, i in rejected]},
              open(PHOTOS_DIR / "_ingest-report.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
