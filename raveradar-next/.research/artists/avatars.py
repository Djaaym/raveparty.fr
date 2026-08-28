#!/usr/bin/env python3
"""Télécharge les portraits Wikimedia Commons et les uniformise.

  python3 .research/artists/avatars.py --dry   # rapport sans rien écrire
  python3 .research/artists/avatars.py         # télécharge, écrit public/artists/
                                               # et réécrit lib/artist-photos.ts

Trois façons d'apporter un portrait, toutes vers Commons et nulle part ailleurs :

- `photo_url` + `photo_author` + `photo_license` + `photo_page` dans un lot de bios —
  la forme historique, où l'agent a déjà relevé les termes ;
- `commons` dans un lot de bios : l'URL de la page du fichier, ou son titre
  (`File:…`). Le script interroge alors l'API Commons pour l'auteur et la licence.
  C'est la forme à préférer : relever une licence à la main, c'est se tromper un jour ;
- **Wikidata P18**, récolté par harvest.py, pour *tout* artiste du catalogue — y compris
  ceux qui n'ont pas de bio. C'est ce qui débloque le plus de portraits : le lien est
  fait par l'identifiant MusicBrainz, donc sans risque d'homonyme.

Seules les licences libres passent : CC0, domaine public, CC BY, CC BY-SA. Un « NC »
ou un « ND » est refusé — un annuaire est un usage qu'elles n'autorisent pas.

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
import argparse, hashlib, io, json, re, sys, time, unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote as urllib_quote, unquote as urllib_unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "artists"
PHOTOS_TS = ROOT / "lib" / "artist-photos.ts"
HARVEST = HERE / "harvest"

API = "https://commons.wikimedia.org/w/api.php"
# Licences acceptées. Commons n'héberge que du libre, mais « libre » y couvre aussi des
# variantes que notre usage n'autorise pas : un NC interdit l'exploitation commerciale
# et un ND toute retouche — or on recadre et on vire les portraits en duotone.
FREE = re.compile(r"^(cc0|cc[ -]by([ -]sa)?([ -][\d.]+)?|public domain|pd-)", re.I)
DENY = re.compile(r"\b(nc|nd|noncommercial|noderiv)\b", re.I)

SIZE = 400          # affiché en 160-200 px, donc net en écran 2×
MIN_SRC = 320       # en dessous, l'upscale se voit
CROP_BIAS = 0.34    # repli quand aucun visage n'est détecté (le visage n'est pas au centre)
FACE_MODEL = Path("/tmp/claude-0/-home-user-raveparty-fr/6b60d075-55de-5423-9bd7-18eadc001735/scratchpad/yunet.onnx")
FACE_MIN_RATIO = 0.055  # un visage plus petit que ça = photo de scène, pas un portrait
HEAD_ROOM = 1.9         # largeur du carré en multiples de la largeur du visage
# Artistes qui jouent masqués : le détecteur ne trouve rien, et pourtant la photo
# est la bonne — le masque EST leur identité scénique documentée, plus reconnaissable
# qu'un visage. On saute la détection pour eux, sans désarmer le filtre ailleurs.
MASKED = {"boris-brejcha", "marshmello", "angerfist", "vladimir-cauchemar", "dr-peacock"}
# Duotone : ombres vers le bleu-violet du site, hautes lumières vers un blanc chaud.
SHADOW = (26, 22, 48)
HIGHLIGHT = (243, 243, 248)
MIX = 0.72          # 1 = duotone pur, 0 = niveaux de gris
THROTTLE = 1.2      # secondes entre deux requêtes Commons

from PIL import Image, ImageOps

try:
    import cv2, numpy as np
except ImportError:  # sans OpenCV on retombe sur le cadrage géométrique
    cv2 = None

UA = "RaveRadarBot/1.0 (https://www.raveparty.fr; contact via site) Python-urllib"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def fetch(url: str) -> bytes:
    """Commons exige un User-Agent identifiable, et lève un 429 si on le bouscule.

    Un premier passage sans temporisation a perdu 15 portraits sur 52 pour cette
    seule raison : les fichiers existaient, c'est la cadence qui était fautive.
    D'où l'attente entre deux requêtes et le repli exponentiel — et la reprise
    incrémentale plus bas, qui rend un nouveau passage presque gratuit.
    """
    req = Request(url, headers={"User-Agent": UA})
    delay = 4
    for attempt in range(4):
        try:
            with urlopen(req, timeout=45) as r:
                time.sleep(THROTTLE)
                return r.read()
        except HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(delay)
                delay *= 2
                continue
            raise
    raise RuntimeError("unreachable")


# La route Wikidata par libellé interroge une chaîne de caractères, pas un identifiant :
# elle peut tomber sur un homonyme. Pour une étiquette de genre, le risque est supportable
# (la table de correspondance ignore ce qu'elle ne reconnaît pas) ; pour un **portrait**,
# non — publier le visage de quelqu'un d'autre sur la fiche d'un artiste est une autre
# classe d'erreur. On ne retient donc une photo que si l'entité se décrit elle-même comme
# venant de la musique électronique.
ELECTRONIC = re.compile(
    r"\b(dj|disc jockey|electronic|electronica|techno|house|trance|hardcore|hardstyle|"
    r"gabber|drum and bass|drum'n'bass|dnb|jungle|dubstep|edm|acid|rave|psytrance|"
    r"record producer|music producer|producer)\b", re.I)


def is_our_artist(entity: dict) -> bool:
    """Vrai si les genres ou la description Wikidata parlent de musique électronique."""
    hay = " ".join(entity.get("genres") or []) + " " + (entity.get("desc") or "")
    return bool(ELECTRONIC.search(hay))


def commons_title(ref: str) -> str:
    """Accepte une URL de page Commons, une URL upload.wikimedia, ou un titre nu."""
    ref = (ref or "").strip()
    if not ref:
        return ""
    if "/wiki/" in ref:
        ref = ref.split("/wiki/", 1)[1]
    elif "upload.wikimedia.org" in ref:
        ref = ref.split("?", 1)[0].rsplit("/", 1)[-1]
    ref = urllib_unquote(ref).replace("_", " ")
    return ref if ref.lower().startswith("file:") else "File:" + ref


def resolve_commons(title: str) -> dict | None:
    """L'URL du fichier, son auteur et sa licence, tels que Commons les énonce.

    Relever ces trois champs à la main est la meilleure façon de publier un jour une
    photo sous une licence qu'on n'a pas lue. L'API les donne d'un coup, et c'est elle
    qui fait foi.
    """
    q = (f"{API}?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata"
         f"&titles={urllib_quote(title)}")
    try:
        pages = json.loads(fetch(q).decode()).get("query", {}).get("pages", {})
    except Exception:
        return None
    for _, page in pages.items():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        url = (info.get("url") or "").split("?", 1)[0]
        lic = (meta.get("LicenseShortName", {}).get("value") or "").strip()
        author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value") or "").strip()
        author = re.sub(r"\s+", " ", author)[:120]
        if not (url and lic and author):
            return None
        if DENY.search(lic) or not FREE.match(lic.replace("-", " ").strip()):
            return {"denied": lic}
        return {"url": url, "author": author, "license": lic,
                "page": "https://commons.wikimedia.org/wiki/" + urllib_quote(title.replace(" ", "_"), safe=":()_,.!'-")}
    return None


def duotone(img: Image.Image) -> Image.Image:
    """Niveaux de gris → rampe SHADOW→HIGHLIGHT, puis remélangé avec l'original."""
    grey = ImageOps.grayscale(img)
    ramp = []
    for c in range(3):
        ramp += [int(SHADOW[c] + (HIGHLIGHT[c] - SHADOW[c]) * i / 255) for i in range(256)]
    toned = grey.convert("RGB")
    toned = toned.point(ramp)
    return Image.blend(grey.convert("RGB"), toned, MIX)


def biggest_face(img: Image.Image):
    """Boîte du plus grand visage, ou None. Renvoie aussi sa taille relative.

    Un cadrage géométrique ne peut pas deviner où regarder : sur une photo de
    scène en 5000 px de large, le centre tombe sur une platine et l'artiste finit
    hors champ. Un premier passage a produit des nuques et des torses. La
    détection sert donc à deux choses — centrer, et rejeter ce qui n'est pas un
    portrait (aucun visage trouvé, ou un visage trop petit dans le cadre).
    """
    if cv2 is None:
        return None
    w, h = img.size
    # YuNet plafonne en résolution utile ; on lui donne une version réduite.
    scale = min(1.0, 1024 / max(w, h))
    small = img.resize((int(w * scale), int(h * scale)), Image.BILINEAR) if scale < 1 else img
    arr = np.array(small)[:, :, ::-1]  # RGB -> BGR
    det = cv2.FaceDetectorYN_create(str(FACE_MODEL), "", (arr.shape[1], arr.shape[0]), 0.6)
    _, faces = det.detect(arr)
    if faces is None or len(faces) == 0:
        return None
    fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])[:4]
    return (fx / scale, fy / scale, fw / scale, fh / scale)


def square(img: Image.Image, face=None) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    if face:
        fx, fy, fw, fh = face
        # Carré large autour de la tête, borné par l'image : on veut le visage et
        # un peu d'épaules, pas un gros plan sur les narines.
        side = int(min(side, max(fw * HEAD_ROOM, fh * HEAD_ROOM)))
        cx, cy = fx + fw / 2, fy + fh * 0.62   # un peu sous le centre du visage
        left = int(min(max(0, cx - side / 2), w - side))
        top = int(min(max(0, cy - side / 2), h - side))
    elif w > h:
        left, top = (w - h) // 2, 0
    else:
        left, top = 0, int((h - w) * CROP_BIAS)
    return img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)


def write_module(out_map: dict) -> None:
    """Réécrit la map de lib/artist-photos.ts entre ses marqueurs.

    Le portrait ne passe plus par lib/bios.ts : il y était rattaché à la bio, ce qui
    rendait la photo conditionnée au texte — un artiste dont on trouvait le portrait
    sans savoir écrire deux phrases sourcées gardait son initiale dans un rond.
    """
    def esc(x: str) -> str:
        return x.replace("\\", "\\\\").replace('"', '\\"')

    lines = [
        f'  "{k}": {{ file: "{esc(v["file"])}", author: "{esc(v["author"])}", '
        f'license: "{esc(v["license"])}", page: "{esc(v["page"])}" }},'
        for k, v in sorted(out_map.items())
    ]
    block = "export const ARTIST_PHOTOS: Record<string, ArtistPhoto> = {\n" + "\n".join(lines) + "\n};"
    src = PHOTOS_TS.read_text()
    start, end = src.index("/* PHOTOS:start"), src.index("/* PHOTOS:end")
    PHOTOS_TS.write_text(src[: src.index("\n", start) + 1] + block + "\n" + src[end:])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--force", action="store_true", help="retélécharge même si le fichier existe")
    ap.add_argument("--limit", type=int, default=0, help="nombre max de portraits Wikidata par passage")
    args = ap.parse_args()

    rows = []
    for f in sorted(HERE.glob("bios-*.json")):
        try:
            rows += json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ {f.name} : JSON invalide ({e})")
            return 1

    # --- les candidats, dans l'ordre d'autorité --------------------------------
    # slug -> (nom, url du fichier, auteur, licence, page Commons)
    cands, resolved, denied = {}, 0, []
    for r in rows:
        name = (r.get("name") or "").strip()
        slug = slugify(name)
        if not slug or slug in cands:
            continue
        url = (r.get("photo_url") or "").strip()
        if url:  # forme historique : les termes ont déjà été relevés par l'agent
            cands[slug] = (name, url, (r.get("photo_author") or "").strip(),
                           (r.get("photo_license") or "").strip(), (r.get("photo_page") or "").strip())
        elif (r.get("commons") or "").strip():
            got = resolve_commons(commons_title(r["commons"]))
            resolved += 1
            time.sleep(THROTTLE)
            if got and "denied" in got:
                denied.append((name, got["denied"])); continue
            if got:
                cands[slug] = (name, got["url"], got["author"], got["license"], got["page"])

    # Wikidata P18 : le gisement le plus large, et le seul qui couvre les artistes sans
    # bio. Le rattachement passe par l'identifiant MusicBrainz, pas par le nom — c'est
    # ce qui évite de coller le portrait d'un homonyme sur une fiche.
    cat_file = HARVEST / "catalogue.json"
    wd = {}
    for name in ("wd", "wdlabel"):
        f = HARVEST / f"{name}.json"
        if f.exists():
            for k, v in json.loads(f.read_text()).items():
                if v.get("img"):
                    wd.setdefault(k, v)
    if wd and cat_file.exists():
        cat = json.loads(cat_file.read_text())
        todo = [(s, v) for s, v in sorted(wd.items(), key=lambda kv: -cat.get(kv[0], {}).get("n", 0))
                if v.get("img") and s not in cands and s in cat and is_our_artist(v)]
        if args.limit:
            todo = todo[: args.limit]
        for slug, v in todo:
            got = resolve_commons(commons_title(v["img"]))
            resolved += 1
            time.sleep(THROTTLE)
            if got and "denied" in got:
                denied.append((cat[slug]["name"], got["denied"])); continue
            if got:
                cands[slug] = (cat[slug]["name"], got["url"], got["author"], got["license"], got["page"])

    print(f"{len(cands)} candidat(s) · {resolved} licence(s) lue(s) sur Commons "
          f"· {len(denied)} refusée(s) pour cause de licence")
    for name, lic in denied:
        print(f"  ✗ {name:32} licence non réutilisable : {lic}")

    OUT.mkdir(parents=True, exist_ok=True)
    seen_hash, out_map, skipped = {}, {}, []

    for slug, (name, url, author, lic, page) in cands.items():
        if not url.startswith("https://upload.wikimedia.org/"):
            skipped.append((name, "hors Wikimedia Commons")); continue
        if not (author and lic and page):
            skipped.append((name, "auteur ou licence manquant → réutilisation non conforme")); continue

        dest = OUT / f"{slug}.webp"
        if dest.exists() and not args.force and not args.dry:
            prev = json.loads((HERE / "avatars.json").read_text()) if (HERE / "avatars.json").exists() else {}
            out_map[slug] = prev.get(slug, {"file": dest.name, "author": author, "license": lic, "page": page})
            continue

        try:
            raw = fetch(url)
            img = Image.open(io.BytesIO(raw))
            img = ImageOps.exif_transpose(img).convert("RGB")
        except Exception as e:
            skipped.append((name, f"téléchargement/décodage : {str(e)[:60]}")); continue

        if min(img.size) < MIN_SRC:
            skipped.append((name, f"trop petite ({img.size[0]}×{img.size[1]})")); continue

        face = biggest_face(img)
        if cv2 is not None and slug not in MASKED:
            if face is None:
                skipped.append((name, "aucun visage détecté — probable photo de scène")); continue
            ratio = face[2] / min(img.size)
            if ratio < FACE_MIN_RATIO:
                skipped.append((name, f"visage trop petit dans le cadre ({ratio:.1%})")); continue

        h = hashlib.sha1(raw).hexdigest()[:10]
        if h in seen_hash and seen_hash[h] != slug:
            skipped.append((name, f"même image que {seen_hash[h]} — probable erreur d'identification"))
            continue
        seen_hash[h] = slug

        if not args.dry:
            duotone(square(img, face)).save(OUT / f"{slug}.webp", "WEBP", quality=86, method=6)
        out_map[slug] = {"file": f"{slug}.webp", "author": author, "license": lic, "page": page}
        print(f"  ✓ {name:32} {img.size[0]}×{img.size[1]} → {slug}.webp  [{lic}]")

    print(f"\n{len(out_map)} portrait(s) · {len(skipped)} écarté(s)")
    for name, why in skipped:
        print(f"  ✗ {name:32} {why}")

    meta = HERE / "avatars.json"
    if not args.dry:
        meta.write_text(json.dumps(out_map, indent=1, ensure_ascii=False))
        write_module(out_map)
        print(f"\n✓ public/artists/, {meta.name} et lib/artist-photos.ts écrits.")
    else:
        print("\n--dry : rien écrit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
