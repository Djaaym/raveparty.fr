#!/usr/bin/env python3
"""Ingère les photos trouvées par les agents dans public/posters/ + lib/data.ts.

  python3 .research/photos/ingest.py --dry     # rapport sans rien écrire
  python3 .research/photos/ingest.py           # télécharge, optimise, patche data.ts

Pour chaque URL retenue on produit deux fichiers dans public/posters/ :
  {slug}.jpg       ratio d'origine, ≤1200 px — Open Graph et JSON-LD
  {slug}_min.webp  crop 4:5 à 560×700       — le poster des cartes

Deux événements qui pointent la même URL (une photo de salle partagée par toutes
ses dates) partagent le même fichier : la dédup se fait sur l'URL *et* sur le
hash du contenu téléchargé.
"""
import argparse
import re, hashlib, io, json, subprocess, sys, time, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PHOTOS_DIR = ROOT / ".research" / "photos"
OUT_DIR = ROOT / "public" / "posters"
DATA_TS = ROOT / "lib" / "data.ts"

MIN_WIDTH = 500          # en dessous, la photo pixellise sur une carte 4:5
MIN_BYTES = 15_000
FLAT_STD = 18            # écart-type sous lequel l'image est probablement un logo sur fond uni
FULL_MAX = 1200          # largeur de référence Open Graph ; au-delà on alourdit le repo pour rien
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


BROWSER_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126 Safari/537.36")
# Wikimedia demande un agent identifiable et coupe les rafales anonymes : sur 272
# téléchargements d'affilée, plusieurs fichiers Commons revenaient tronqués alors
# qu'ils se téléchargeaient sans problème un par un.
WIKI_UA = "RaveRadarBot/1.0 (https://raveparty.fr; event poster fetch) curl"


CACHE = PHOTOS_DIR / ".cache"


def looks_like_image(raw: bytes) -> bool:
    """Signature de fichier. Un site qui répond une page d'erreur en 200 renvoie
    souvent 20-40 Ko de HTML : sans ce garde-fou elle finit dans le cache, et
    l'échec devient définitif au lieu d'être retenté."""
    return (
        raw[:3] == b"\xff\xd8\xff"                            # JPEG
        or raw[:4] == b"\x89PNG"                              # PNG
        or raw[:4] == b"GIF8"                                 # GIF
        or (raw[:4] == b"RIFF" and raw[8:12] == b"WEBP")      # WebP
        or raw[4:8] == b"ftyp"                                # AVIF / HEIF
    )


def fetch(url: str, tries: int = 3):
    """curl plutôt que urllib : le proxy sortant est déjà configuré pour lui.

    Les octets réussis sont mis en cache sur disque : relancer le script ne
    retente alors que les URLs encore en échec, au lieu de re-solliciter les
    ~270 hôtes (c'est ce matraquage qui faisait tomber des fichiers Commons
    au hasard d'un run à l'autre).
    """
    CACHE.mkdir(exist_ok=True)
    blob = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if blob.exists() and blob.stat().st_size >= MIN_BYTES:
        cached = blob.read_bytes()
        if looks_like_image(cached):
            return cached
        blob.unlink()                         # page d'erreur mise en cache par erreur

    wiki = "wikimedia.org" in url
    ua = WIKI_UA if wiki else BROWSER_UA
    p = None
    for attempt in range(tries):
        if wiki:
            time.sleep(0.4)                   # on reste poli avec Commons
        p = subprocess.run(
            ["curl", "-sL", "-m", "60", "--retry", "2", "--retry-delay", "2", "-A", ua, url],
            capture_output=True,
        )
        if p.returncode == 0 and len(p.stdout) >= MIN_BYTES and looks_like_image(p.stdout):
            blob.write_bytes(p.stdout)
            return p.stdout
        time.sleep(1.5 * (attempt + 1))
    return p.stdout if p and p.returncode == 0 else b""


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
CRED_START, CRED_END = "/* PHOTO_CREDITS:start */\n", "/* PHOTO_CREDITS:end */"


def commons_credit(row):
    """(auteur, licence, page) pour une image Commons — sinon None.

    Une affiche d'organisateur se reprend telle quelle : c'est lui qui la diffuse pour
    annoncer sa soirée. Un fichier Commons n'est réutilisable **qu'à la condition** de
    citer l'auteur et la licence, et de renvoyer vers la page du fichier ; c'est le
    texte du CC BY / CC BY-SA. On ne devine donc rien : sans auteur ET licence
    lisibles dans le `credit` du lot, l'entrée est refusée plutôt que publiée nue.

    Les agents écrivent le crédit en clair, sous l'une ou l'autre de ces formes :
        "Wayne 1313 / Wikimedia Commons, CC BY-SA 4.0"
        "KaiKnight2 / Wikimedia Commons (CC BY-SA 4.0)"
    """
    if "upload.wikimedia.org" not in (row.get("url") or ""):
        return None
    credit = (row.get("credit") or "").strip()
    lic = re.search(r"(CC[ -]BY(?:[ -]SA)?(?:[ -]\d(?:\.\d)?)?|CC0|public domain)", credit, re.I)
    author = credit.split("/")[0].strip(" ,;")
    if not lic or not author:
        return None
    page = (row.get("sourcePage") or "").strip()
    return author, lic.group(1).upper().replace(" ", "-").replace("CC-BY", "CC BY"), page


def patch_credits_ts(credits, events, dry):
    """Réécrit la map PHOTO_CREDITS entre ses marqueurs."""
    src = DATA_TS.read_text()
    def esc(s): return (s or "").replace("\\", "\\\\").replace('"', '\\"')
    lines = []
    for eid in sorted(credits):
        if eid not in events:
            continue
        a, l, p = credits[eid]
        lines.append(f'  {eid}: {{ author: "{esc(a)}", license: "{esc(l)}", page: "{esc(p)}" }},')
    body = ("export const PHOTO_CREDITS: Record<number, PhotoCredit> = {"
            + ("\n" + "\n".join(lines) + "\n" if lines else "") + "};\n")
    i, j = src.index(CRED_START) + len(CRED_START), src.index(CRED_END)
    if not dry:
        DATA_TS.write_text(src[:i] + body + src[j:])
    return len(lines)


def patch_data_ts(mapping, events, dry):
    """Réécrit la map PHOTOS entre les deux marqueurs de lib/data.ts.

    La map est reconstruite intégralement à chaque passage, ce qui a un effet de bord
    dangereux : une URL qui échoue *ce jour-là* disparaît de `mapping`, donc de la map,
    et l'événement repasse au dégradé de genre — alors que son fichier est toujours dans
    `public/posters/`. Il suffit d'un 429 de Commons ou d'un site momentanément à terre
    pour retirer d'un coup des dizaines d'images en production, sans que rien ne
    l'annonce. On réinjecte donc l'entrée précédente quand son fichier existe encore :
    le seul cas où l'on retire vraiment une image, c'est quand son fichier a disparu.
    """
    src = DATA_TS.read_text()
    i0, j0 = src.index(START) + len(START), src.index(END)
    previous = {int(m.group(1)): m.group(2)
                for m in re.finditer(r'^\s*(\d+): "([^"]+)"', src[i0:j0], re.M)}
    kept_back = [eid for eid, f in previous.items()
                 if eid not in mapping and eid in events and (OUT_DIR / f).exists()]
    for eid in kept_back:
        mapping[eid] = previous[eid]
    if kept_back:
        print(f"  ↩ {len(kept_back)} entrée(s) conservée(s) : téléchargement en échec "
              f"aujourd'hui, mais le fichier est toujours là → {sorted(kept_back)[:12]}"
              + (" …" if len(kept_back) > 12 else ""))
    lines = []
    for eid in sorted(mapping):
        # Un id peut avoir disparu du catalogue depuis le dernier passage (fusion de
        # deux fiches doublons, par exemple). Le laisser dans la map la rendrait
        # menteuse, et ferait planter le prochain ingest sur `events[eid]`.
        if eid not in events:
            continue
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
    ap.add_argument("--prune", action="store_true",
                    help="retire de la map PHOTOS les ids absents du catalogue, sans rien télécharger")
    ap.add_argument("--refetch", action="store_true",
                    help="retélécharge aussi les images déjà ingérées (par défaut on les saute)")
    args = ap.parse_args()

    events, already = load_events()

    if args.prune:
        src = DATA_TS.read_text()
        i, j = src.index(START) + len(START), src.index(END)
        cur = {int(m.group(1)): m.group(2)
               for m in re.finditer(r'^\s*(\d+): "([^"]+)"', src[i:j], re.M)}
        dead = [k for k in cur if k not in events]
        print(f"map PHOTOS : {len(cur)} entrées, {len(dead)} orpheline(s) → {dead}")
        n = patch_data_ts(cur, events, args.dry)
        print(f"{n} entrées conservées" + (" (--dry : rien écrit)" if args.dry else ""))
        return
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

    # Les lots s'accumulent, et chaque passage retéléchargeait l'intégralité de
    # l'historique — 513 URLs pour 290 nouveautés. Ce n'est pas seulement lent : les
    # hôtes finissent par nous limiter, et un run a passé deux heures à s'acharner sur
    # les fichiers Commons des anciens lots, tous déjà sur le disque, sans en obtenir
    # un seul. On saute donc ce qui est déjà ingéré et dont le fichier est là — le
    # résultat est identique, `patch_data_ts()` réinjectant ces entrées de toute façon.
    src_now = DATA_TS.read_text()
    i0, j0 = src_now.index(START) + len(START), src_now.index(END)
    done = {int(m.group(1)): m.group(2)
            for m in re.finditer(r'^\s*(\d+): "([^"]+)"', src_now[i0:j0], re.M)}
    skipped_urls = [u for u, grp in by_url.items()
                    if all(g["id"] in done and (OUT_DIR / done[g["id"]]).exists() for g in grp)]
    if not args.refetch:
        for u in skipped_urls:
            del by_url[u]
        print(f"{len(skipped_urls)} URL(s) déjà ingérées et présentes sur disque — ignorées "
              f"(--refetch pour les reprendre)")
    print(f"{len(by_url)} URLs distinctes à télécharger\n")

    mapping, by_hash, rejected = {}, {}, []
    credits, unattributed = {}, []
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
            # L'attribution suit le fichier, pas le lot : elle est donc recalculée à
            # chaque passage, ce qui rattrape aussi les entrées Commons ingérées avant
            # que la map existe.
            c = commons_credit(g)
            if c:
                credits[g["id"]] = c
            elif "upload.wikimedia.org" in g["url"]:
                unattributed.append((g["id"], g["src"], g.get("credit")))

    # Un fichier Commons sans auteur ni licence lisibles ne peut pas être publié : le
    # crédit est la condition de la licence. On le retire plutôt que de le servir nu.
    for eid, src_file, raw_credit in unattributed:
        mapping.pop(eid, None)
        rejected.append((f"(id {eid})", "Commons sans attribution", [eid]))
        print(f"  ✗ attribution absente  id={eid} ({src_file}) credit={raw_credit!r}")

    n = patch_data_ts(mapping, events, args.dry) if mapping else 0
    nc = patch_credits_ts(credits, events, args.dry)
    still = [i for i in events if i not in already and i not in mapping]
    print(f"\n{'—' * 60}")
    print(f"photos retenues        : {len(mapping)} événements / {len(by_hash)} fichiers")
    print(f"crédits Commons        : {nc} (auteur + licence affichés sous l'image)")
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
