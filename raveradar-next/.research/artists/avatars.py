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
import argparse, hashlib, io, json, re, sys, time, unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "artists"

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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--force", action="store_true", help="retélécharge même si le fichier existe")
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
        print(f"\n✓ public/artists/ + {meta.name} écrits. Lance ingest.py pour patcher lib/bios.ts.")
    else:
        print("\n--dry : rien écrit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
