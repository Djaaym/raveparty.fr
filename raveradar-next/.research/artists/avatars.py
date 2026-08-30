#!/usr/bin/env python3
"""Télécharge les portraits Wikimedia Commons et les uniformise.

  python3 .research/artists/avatars.py --dry   # rapport sans rien écrire
  python3 .research/artists/avatars.py         # télécharge, écrit public/artists/
                                               # et réécrit lib/artist-photos.ts

Trois façons d'apporter un portrait, toutes vers Commons et nulle part ailleurs :

- `photo_url` + `photo_author` + `photo_license` + `photo_page` dans un lot de bios,
  la forme historique, où l'agent a déjà relevé les termes ;
- `commons` dans un lot de bios : l'URL de la page du fichier, ou son titre
  (`File:…`). Le script interroge alors l'API Commons pour l'auteur et la licence.
  C'est la forme à préférer : relever une licence à la main, c'est se tromper un jour ;
- **Wikidata P18**, récolté par harvest.py, pour *tout* artiste du catalogue, y compris
  ceux qui n'ont pas de bio. C'est ce qui débloque le plus de portraits : le lien est
  fait par l'identifiant MusicBrainz, donc sans risque d'homonyme.

Seules les licences libres passent : CC0, domaine public, CC BY, CC BY-SA. Un « NC »
ou un « ND » est refusé, un annuaire est un usage qu'elles n'autorisent pas.

Les sources sont hétérogènes par nature : une photo de scène sous-exposée à côté
d'un portrait studio en plein jour. Sur une grille d'artistes ça fait un patchwork.
La cohérence ne peut donc pas venir de la source, elle vient du traitement, même
cadrage carré, même taille, même virage duotone sur la palette du site.

Le recadrage est décentré vers le haut (CROP_BIAS) : sur une photo en pied, le
centre géométrique tombe sur le torse, pas sur le visage.

Chaque fichier retenu porte sa licence dans lib/bios.ts, voir le champ `photo`.
Sans auteur ni licence, la photo est rejetée : une image CC BY sans crédit est
une contrefaçon, pas un raccourci.
"""
import argparse, hashlib, io, json, re, subprocess, sys, time, unicodedata
from pathlib import Path
from urllib.parse import quote as urllib_quote, unquote as urllib_unquote

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "public" / "artists"
PHOTOS_TS = ROOT / "lib" / "artist-photos.ts"
HARVEST = HERE / "harvest"

API = "https://commons.wikimedia.org/w/api.php"
# Licences acceptées. Commons n'héberge que du libre, mais « libre » y couvre aussi des
# variantes que notre usage n'autorise pas : un NC interdit l'exploitation commerciale
# et un ND toute retouche - or on recadre et on vire les portraits en duotone.
FREE = re.compile(r"^(cc0|cc[ -]by([ -]sa)?([ -][\d.]+)?|public domain|pd-)", re.I)
DENY = re.compile(r"\b(nc|nd|noncommercial|noderiv)\b", re.I)

# La route Wikidata par libellé interroge une chaîne de caractères, pas un identifiant :
# elle peut tomber sur un homonyme. Pour une étiquette de genre, le risque est supportable
# (la table de correspondance ignore ce qu'elle ne reconnaît pas) ; pour un **portrait**,
# non - publier le visage de quelqu'un d'autre sur la fiche d'un artiste est une autre
# classe d'erreur. On ne retient donc une photo que si l'entité se décrit elle-même comme
# venant de la musique électronique.
ELECTRONIC = re.compile(
    r"\b(dj|disc jockey|electronic|electronica|techno|house|trance|hardcore|hardstyle|"
    r"gabber|drum and bass|drum'n'bass|dnb|jungle|dubstep|edm|acid|rave|psytrance|"
    r"record producer|music producer|producer)\b", re.I)

# « Above & Beyond », « Chase & Status », « The Martinez Brothers » : le nom désigne
# plusieurs personnes, donc une photo à plusieurs visages n'est pas ambiguë, elle est
# juste. La description Wikidata le dit déjà (« British electronic trio », « Belgian
# electronic music band »), pas besoin d'une requête de plus.
GROUP_DESC = re.compile(r"\b(band|duo|trio|quartet|group|collective|project)\b", re.I)

SIZE = 400          # affiché en 160-200 px, donc net en écran 2×
MIN_SRC = 320       # en dessous, l'upscale se voit
CROP_BIAS = 0.34    # repli quand aucun visage n'est détecté (le visage n'est pas au centre)
# Le détecteur de visages. Il vivait dans un répertoire temporaire de session - donc
# absent au passage suivant, et `FaceDetectorYN_create` lève sur un fichier manquant :
# la détection s'effondrait en silence et *tous* les portraits partaient en « aucun
# visage détecté ». Il se télécharge maintenant à la demande, à côté du script.
FACE_MODEL = Path(__file__).resolve().parent / "yunet.onnx"
# `github.com/.../raw/...` répond 403 depuis le conteneur, et les URL `raw.` et jsdelivr
# rendent le **pointeur git-lfs** (131 octets) plutôt que le modèle - un fichier de 131
# octets qu'OpenCV refuse ensuite sans dire pourquoi. `media.githubusercontent.com/media`
# est le point d'accès qui sert le contenu LFS lui-même.
FACE_MODEL_URL = ("https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/"
                  "face_detection_yunet/face_detection_yunet_2023mar.onnx")
FACE_MIN_RATIO = 0.055  # un visage plus petit que ça = photo de scène, pas un portrait
HEAD_ROOM = 1.9         # largeur du carré en multiples de la largeur du visage
# Deux visages « comparables », c'est un doute, pas un portrait. Voir `pick_frame()` :
# c'est la règle qui a laissé passer un badaud à la place d'Amelie Lens.
PEER = 0.55             # un second visage à plus de 55 % de la largeur du premier
GROUP_MAX = 4           # au-delà, un « groupe » est une foule, quel que soit le nom
GROUP_FACE_MIN = 0.10   # part du carré sous laquelle un visage de groupe n'est plus lisible
# Netteté du carré final, variance du laplacien. **Ce n'est qu'un plancher**, pas un
# critère de qualité : la mesure dépend autant de l'exposition que de la mise au point,
# si bien qu'un portrait net pris sur une scène sombre (Charlotte de Witte, 22) tombe
# plus bas qu'une photo molle en plein jour (Da Tweekaz, 83). Sur une médiane de 371,
# passer sous 6 ne veut plus dire « peu contrasté » mais « il n'y a plus d'image » :
# c'est le cas de &ME et de Timmy Trumpet, deux taches grises. Le reste du tri se fait
# à l'oeil, sur planche-contact, et atterrit dans `SKIP`.
MIN_SHARP = 6
# Artistes qui jouent masqués : le détecteur ne trouve rien, et pourtant la photo
# est la bonne - le masque EST leur identité scénique documentée, plus reconnaissable
# qu'un visage. On saute la détection pour eux, sans désarmer le filtre ailleurs.
MASKED = {"boris-brejcha", "marshmello", "angerfist", "vladimir-cauchemar", "dr-peacock"}
MAX_TRIES = 4   # candidats essayés par artiste avant de le laisser sans portrait
# Ce que la mesure ne peut pas voir, relu à l'oeil sur planche-contact. Même esprit que
# `REMOVED` dans merge.py : une décision éditoriale se consigne, sinon le passage suivant
# la défait. `slug -> raison`, et la raison doit être vérifiable.
SKIP: dict[str, str] = {
    "astral-projection": "cadre sur une nuque, aucun visage",
    "cassius": "photo de scène, visage illisible",
    "da-tweekaz": "projecteurs de scène, aucun visage lisible",
    "miss-k8": "silhouette lointaine derrière les platines",
    "rudimental": "photo d'interview, on ne peut pas dire qui est cadré",
    "stereo-mcs": "trop flou pour reconnaître qui que ce soit",
    "the-avalanches": "P18 = photo d'un concert des Strokes, aucun membre identifiable",
    "the-avener": "source trop petite, la vignette est une tache",
    "the-bloody-beetroots": "faux positif du détecteur, le cadre ne montre qu'une main",
    "tim-hecker": "faux positif du détecteur, le cadre montre un ampli",
    # Homonymes que Commons range exactement comme l'artiste : même nom, même forme de
    # catégorie, et une seule chose les sépare, la photo. C'est la limite de la route
    # « titre », assumée ici plutôt que dans un seuil qui ne la verrait pas.
    "alex-stein": "homonyme : l'homme en costume de « File:Alex Stein.png » n'est pas le DJ",
    "benjamin-r": "homonyme : « Benjamin R. Mixon », général de l'US Army",
    "chris-reeve": "homonyme non tranché : la catégorie Commons « Chris Reeve » est celle du coutelier",
    "dave-lambert": "homonyme : photo de 1947, c'est le chanteur de jazz",
    "will-atkinson": "homonyme : la photo montre le footballeur, en maillot",
    "maribou-state": "vignette illisible, l'artiste est à contre-jour et de dos",
    "the-blaze": "le cadre tombe sur le public, pas sur le duo",
    "infected-mushroom": "photo du concert de Chicago, mais le cadre tombe sur un décor",
    "jean-pierre": "homonyme : « Jean Pierre Audour », le préfixe du nom ne suffit pas",
    "sarah-de-warren": "le cadre ne montre qu'une casquette dans le noir",
    "scissor-sisters": "photo de scène trop sombre, on ne reconnaît personne",
    "yu-ching": "homonyme : un homme âgé masqué, ce n'est pas l'artiste",
    "kaboutertje-putlucht": "le cadre ne montre qu'un praticable de scène",
}
# Duotone : ombres vers le bleu-violet du site, hautes lumières vers un blanc chaud.
SHADOW = (26, 22, 48)
HIGHLIGHT = (243, 243, 248)
MIX = 0.72          # 1 = duotone pur, 0 = niveaux de gris
THROTTLE = 2.0      # secondes entre deux requêtes Commons (429 observé en dessous)
CACHE = Path(__file__).resolve().parent / "commons-cache.json"
# Les originaux, gardés sur disque (hors dépôt, cf. .gitignore). Retoucher un seuil de
# cadrage demande de repasser sur tout le corpus : sans ce cache, chaque essai
# re-télécharge trois cents fichiers chez Wikimedia, donc coûte un quart d'heure et
# finit en 429. Une image de Commons ne change pas, son cache non plus.
SRCS = Path(__file__).resolve().parent / ".srcs"
# Les photos déposées à la main, avec leurs termes de réutilisation dans `sources.json`.
# Elles sont **versionnées**, contrairement au cache : ce sont des originaux qu'on ne
# peut pas re-télécharger.
LOCAL = Path(__file__).resolve().parent / "local"

from PIL import Image, ImageOps

try:
    import cv2, numpy as np
    # OpenCV crache un avertissement de backend par appel au détecteur : trois cents
    # lignes qui noient le rapport, pour une information dont on ne fait rien.
    cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
except ImportError:  # sans OpenCV on retombe sur le cadrage géométrique
    cv2 = None

UA = "RaveRadarBot/1.0 (https://www.raveparty.fr; contact via site) Python-urllib"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def fetch(url: str) -> bytes:
    """Commons exige un User-Agent identifiable, et répond 429 si on le bouscule.

    Un premier passage sans temporisation a perdu 15 portraits sur 52 pour cette seule
    raison : les fichiers existaient, c'est la cadence qui était fautive. D'où l'attente
    entre deux requêtes, le repli exponentiel, et le cache de licences plus bas.

    **curl et pas urllib** : tout ce qui sort du conteneur passe par curl sur ce projet
    (même règle que le lecteur Instagram dans CLAUDE.md), le proxy ne rendant pas la
    même chose aux deux.
    """
    delay = 5
    for attempt in range(4):
        r = subprocess.run(
            ["curl", "-sL", "-A", UA, "--max-time", "60", "-w", "\n%{http_code}", url],
            capture_output=True,
        )
        body, _, code = r.stdout.rpartition(b"\n")
        if code.strip() == b"200":
            return body
        if attempt == 3:
            raise RuntimeError(f"HTTP {code.decode(errors='replace').strip() or '?'} sur {url[:80]}")
        time.sleep(delay)
        delay *= 2
    raise RuntimeError("inatteignable")


def is_our_artist(entity: dict) -> bool:
    """Vrai si les genres ou la description Wikidata parlent de musique électronique."""
    hay = " ".join(entity.get("genres") or []) + " " + (entity.get("desc") or "")
    return bool(ELECTRONIC.search(hay))


def load_cache() -> dict:
    """Les termes déjà lus sur Commons.

    Sans lui, une exécution interrompue repart de zéro, et Commons *finit* par répondre
    429 quand on enchaîne quelques centaines d'appels, donc l'interruption arrive. Trois
    cents requêtes déjà payées, refaites, qui déclenchent le 429 suivant. Les licences ne
    changent quasiment jamais : les relire à chaque passage ne coûte que du quota.
    """
    if CACHE.exists():
        try:
            return json.loads(CACHE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_cache(c: dict) -> None:
    CACHE.write_text(json.dumps(c, indent=1, ensure_ascii=False, sort_keys=True))


_CACHE = load_cache()


def commons_title(ref: str) -> str:
    """Accepte une URL de page Commons, une URL upload.wikimedia, ou un titre nu."""
    ref = (ref or "").strip()
    if not ref:
        return ""
    # Wikidata (P18) ne rend pas une page de fichier mais un *chemin de service* :
    # `.../wiki/Special:FilePath/Nom%20du%20fichier.jpg`. Sans ce cas, le titre demandé
    # devenait « File:Special:FilePath/… », que l'API ne connaît évidemment pas, et
    # deux cents portraits disparaissaient sans le moindre message d'erreur.
    if "Special:FilePath/" in ref:
        ref = ref.split("Special:FilePath/", 1)[1]
    elif "/wiki/" in ref:
        ref = ref.split("/wiki/", 1)[1]
    elif "upload.wikimedia.org" in ref:
        ref = ref.split("?", 1)[0].rsplit("/", 1)[-1]
    ref = urllib_unquote(ref).replace("_", " ")
    return ref if ref.lower().startswith("file:") else "File:" + ref


def parse_page(page: dict, title: str) -> dict:
    """Ce que Commons dit d'un fichier, réduit à ce dont on a le droit de se servir.

    On garde **deux** URL : la vignette de 960 px, qui suffit à la très grande majorité
    des cadrages, et l'original, tiré seulement quand le carré retenu est plus petit que
    la vignette de sortie (voir la remontée en résolution dans la boucle principale).
    """
    info = (page.get("imageinfo") or [{}])[0]
    meta = info.get("extmetadata") or {}
    url = (info.get("thumburl") or info.get("url") or "").split("?", 1)[0]
    lic = (meta.get("LicenseShortName", {}).get("value") or "").strip()
    author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value") or "").strip()
    author = re.sub(r"\s+", " ", author)[:120]
    if not (url and lic and author):
        return {}
    if DENY.search(lic) or not FREE.match(lic.replace("-", " ").strip()):
        return {"denied": lic}
    # Un fichier sous demande de suppression est un fichier dont les termes sont
    # contestés : republier une image pendant que Commons décide si elle avait le droit
    # d'y être, c'est exactement ce que la règle « Commons uniquement » cherche à éviter.
    if any(c["title"][9:].startswith(("Deletion requests", "Copyright violations"))
           for c in (page.get("categories") or [])):
        return {"denied": "demande de suppression en cours sur Commons"}
    return {"url": url, "author": author, "license": lic,
            "orig": (info.get("url") or "").split("?", 1)[0],
            "bytes": int(info.get("size") or 0),
            "w": int(info.get("width") or 0),
            "cats": [c["title"][9:] for c in (page.get("categories") or [])],
            "page": "https://commons.wikimedia.org/wiki/"
                    + urllib_quote(title.replace(" ", "_"), safe=":()_,.!'-")}


def resolve_many(titles: list) -> None:
    """Lit les termes de plusieurs fichiers d'un coup, et les met en cache.

    Une requête par fichier a été essayée d'abord : Commons répond 429 au bout de
    quelques centaines d'appels, et le repli exponentiel faisait tomber le débit à huit
    fichiers en dix minutes, huit heures pour le catalogue. L'API accepte **cinquante
    titres par requête** (`titles=A|B|C`), ce qui ramène le même travail à huit appels.
    Chercher la limite du service avant d'écrire la boucle aurait coûté cinq minutes.
    """
    # Une entrée mise en cache avant que `parse_page` ne rende `orig` est incomplète :
    # on la redemande, sinon la remontée en résolution ne s'appliquerait qu'aux fichiers
    # découverts après le changement.
    todo = [t for t in dict.fromkeys(titles)
            if t and (t not in _CACHE
                      or (_CACHE[t] and "denied" not in _CACHE[t] and "cats" not in _CACHE[t]))]
    for i in range(0, len(todo), 50):
        batch = todo[i : i + 50]
        # `iiurlwidth` fait rendre en plus l'URL d'une **vignette**. L'original de
        # Commons pèse souvent plusieurs mégaoctets, pour une image qu'on réduit ensuite
        # à 400 px : on tirait cent fois le poids utile, et upload.wikimedia.org a fini
        # par répondre 429 sur la moitié du lot.
        q = (f"{API}?action=query&format=json&prop=imageinfo%7Ccategories&cllimit=max&iiprop=url%7Csize%7Cextmetadata"
             f"&iiurlwidth=900&titles={urllib_quote('|'.join(batch))}")
        try:
            data = json.loads(fetch(q).decode())
        except Exception as e:
            print(f"  ⚠ lot Commons {i // 50} : {str(e)[:70]}")
            time.sleep(10)
            continue
        query = data.get("query", {})
        # L'API renomme ce qu'elle normalise (espaces, casse de l'initiale) : sans cette
        # table, la moitié des réponses ne se rattache à aucun titre demandé.
        norm = {n["from"]: n["to"] for n in query.get("normalized", [])}
        want = {norm.get(t, t): t for t in batch}
        for page in (query.get("pages") or {}).values():
            asked = want.get(page.get("title", ""))
            if asked:
                _CACHE[asked] = parse_page(page, asked)
        for t in batch:
            _CACHE.setdefault(t, {})
        save_cache(_CACHE)
        print(f"  licences lues : {min(i + 50, len(todo))}/{len(todo)}", flush=True)
        time.sleep(THROTTLE)


def resolve_commons(title: str) -> dict | None:
    """Les termes d'un fichier, servis par le cache, rempli par `resolve_many()`."""
    if title not in _CACHE:
        resolve_many([title])
    return _CACHE.get(title) or None


def source_bytes(url: str, force: bool = False) -> bytes:
    """L'original, du cache disque si on l'a déjà tiré, de Commons sinon."""
    SRCS.mkdir(exist_ok=True)
    ext = Path(url.split("?", 1)[0]).suffix.lower()[:5] or ".bin"
    f = SRCS / (hashlib.sha1(url.encode()).hexdigest()[:16] + ext)
    if f.exists() and f.stat().st_size > 1000 and not force:
        return f.read_bytes()
    raw = fetch(url)
    f.write_bytes(raw)
    # La temporisation ne portait que sur l'API : les *images* partaient à la chaîne, et
    # upload.wikimedia.org a fini par répondre 429 sur la moitié du lot. Le même service,
    # la même règle, on n'enchaîne pas. Le cache, lui, ne temporise pas : il ne sort pas.
    time.sleep(THROTTLE)
    return raw


def duotone(img: Image.Image) -> Image.Image:
    """Niveaux de gris → rampe SHADOW→HIGHLIGHT, puis remélangé avec l'original."""
    grey = ImageOps.grayscale(img)
    ramp = []
    for c in range(3):
        ramp += [int(SHADOW[c] + (HIGHLIGHT[c] - SHADOW[c]) * i / 255) for i in range(256)]
    toned = grey.convert("RGB")
    toned = toned.point(ramp)
    return Image.blend(grey.convert("RGB"), toned, MIX)


def ensure_face_model() -> bool:
    """Télécharge YuNet si besoin. Faux si on doit se passer de détection."""
    if FACE_MODEL.exists() and FACE_MODEL.stat().st_size > 10_000:
        return True
    try:
        FACE_MODEL.write_bytes(fetch(FACE_MODEL_URL))
        print(f"  ↓ détecteur de visages téléchargé ({FACE_MODEL.stat().st_size // 1024} Ko)")
        return True
    except Exception as e:
        print(f"  ⚠ détecteur indisponible ({str(e)[:60]}), cadrage géométrique seul")
        return False


def faces_of(img: Image.Image) -> list:
    """Tous les visages trouvés, du plus grand au plus petit, aux coordonnées de `img`.

    Un cadrage géométrique ne peut pas deviner où regarder : sur une photo de
    scène en 5000 px de large, le centre tombe sur une platine et l'artiste finit
    hors champ. Un premier passage a produit des nuques et des torses. La
    détection sert donc à deux choses, centrer, et rejeter ce qui n'est pas un
    portrait (aucun visage trouvé, ou un visage trop petit dans le cadre).

    Elle rend **tous** les visages, et pas seulement le plus grand : voir `pick_frame()`,
    c'est leur nombre et leurs tailles relatives qui disent si la photo décrit quelqu'un.
    """
    if cv2 is None:
        return []
    w, h = img.size
    # YuNet plafonne en résolution utile ; on lui donne une version réduite.
    scale = min(1.0, 1024 / max(w, h))
    small = img.resize((int(w * scale), int(h * scale)), Image.BILINEAR) if scale < 1 else img
    arr = np.array(small)[:, :, ::-1]  # RGB -> BGR
    det = cv2.FaceDetectorYN_create(str(FACE_MODEL), "", (arr.shape[1], arr.shape[0]), 0.6)
    _, faces = det.detect(arr)
    if faces is None or len(faces) == 0:
        return []
    out = [tuple(float(v) / scale for v in f[:4]) for f in faces]
    return sorted(out, key=lambda f: -(f[2] * f[3]))


def pick_frame(img: Image.Image, faces: list, group: bool):
    """Sur quoi cadrer, ou pourquoi on ne cadre pas. Rend `(boîte, None)` ou `(None, raison)`.

    **C'est ici qu'on a publié le visage de quelqu'un d'autre.** L'ancienne version prenait
    le plus grand visage, sans se demander si c'était celui de l'artiste. Sur la photo
    retenue pour Amelie Lens (une vue large des platines à travers la foule), le plus grand
    visage était celui d'un badaud au premier plan : sa fiche a affiché un inconnu barbu
    pendant des mois. Le détecteur n'avait pas tort, la question posée était mauvaise.

    La bonne question n'est pas « où est le plus grand visage » mais « cette photo
    désigne-t-elle quelqu'un sans ambiguïté ». Donc :

    - un seul visage dominant, on cadre dessus ;
    - un second visage à plus de `PEER` de la largeur du premier, **on ne sait pas
      lequel est l'artiste** et aucune mesure ne le dira, donc on renonce ;
    - sauf si le nom désigne un groupe (« Above & Beyond », « Chase & Status ») : le
      pluriel est alors la bonne réponse, et on cadre sur l'ensemble des visages,
      tant qu'ils tiennent dans un carré sans devenir des têtes d'épingle.

    Renoncer, c'est afficher l'initiale, ce que la fiche sait déjà faire. C'est moins
    coûteux qu'un visage faux, qui est une affirmation sur une personne réelle.
    """
    if not faces:
        return None, "aucun visage détecté, probable photo de scène"
    main = faces[0]
    if main[2] / min(img.size) < FACE_MIN_RATIO:
        return None, f"visage trop petit dans le cadre ({main[2] / min(img.size):.1%})"
    peers = [f for f in faces[1:] if f[2] >= PEER * main[2]]
    if not peers:
        return box_around(img, [main], HEAD_ROOM), None
    if not group:
        return None, (f"{len(peers) + 1} visages de taille comparable : "
                      "rien ne dit lequel est l'artiste")
    crowd = [main] + peers
    if len(crowd) > GROUP_MAX:
        return None, f"{len(crowd)} visages comparables, c'est une foule, pas un groupe"
    box = box_around(img, crowd, 1.25)
    # Deux façons de rater un cadrage de groupe : un carré plus grand que l'image (les
    # visages du bord en sortent), ou des visages si dispersés que chacun finit en tête
    # d'épingle une fois le carré ramené à 400 px.
    if box[2] >= min(img.size) or min(f[2] for f in crowd) / box[2] < GROUP_FACE_MIN:
        return None, "visages trop dispersés pour un cadrage de groupe"
    return box, None


# Largeur demandée quand la vignette de 960 ne suffit pas. **Pas l'original** : sur
# Amelie Lens, la vignette de 1920 pèse 212 Ko contre 1,3 Mo pour l'original, pour un
# carré de 400 qui n'a besoin de rien de plus. Un premier passage tirait les originaux
# et avançait à deux portraits par minute, l'essentiel du temps passé à télécharger des
# pixels qu'on jetait. Wikimedia n'accepte plus une largeur arbitraire (400 « Use
# thumbnail sizes listed on w.wiki/GHai ») : 1280 et 1920 passent, 1024, 1200, 1500 et
# 1600 rendent un 400. D'où une largeur unique, et le repli sur l'original si elle échoue.
BIG = 1920
MAX_ORIG = 30_000_000   # au-delà, l'original est un scan de plusieurs dizaines de Mo


def upscale_source(img: Image.Image, box, cand: dict, force: bool):
    """Rend l'image sur laquelle découper, en montant d'un cran en résolution s'il le faut.

    Tout part de la vignette de 960 px, et c'est le bon défaut : l'original de Commons
    pèse souvent plusieurs mégaoctets pour un carré de 400. Mais quand l'artiste est
    petit dans le cadre, ce carré ne fait plus que cent pixels de côté : ramené à 400,
    c'est une bouillie, et c'est ce qui a donné les vignettes floues de Groove Armada ou
    de KI/KI. Le pixel manquant existe pourtant, il est resté dans le fichier d'origine.

    Rend `(image, carré)` : les coordonnées du carré sont celles de la vignette, elles
    sont donc mises à l'échelle de l'image rendue. Rien à re-détecter, le rapport suffit.
    """
    url = bigger_thumb(cand.get("url") or "", cand.get("w") or 0)
    if box is None or box[2] >= SIZE or not url:
        return img, box
    weight = cand.get("bytes") or 0
    for u in (url, cand.get("orig") or ""):
        if not u.startswith("https://upload.wikimedia.org/"):
            continue
        if u != url and (not weight or weight > MAX_ORIG):
            continue  # le repli sur l'original ne vaut pas un scan de trente mégaoctets
        try:
            big = ImageOps.exif_transpose(Image.open(io.BytesIO(source_bytes(u, force)))).convert("RGB")
            break
        except Exception:
            continue
    else:
        return img, box  # la plus grande n'est pas indispensable, la vignette reste exploitable
    k = big.size[0] / img.size[0]
    if k <= 1.05:
        return img, box
    return big, [int(v * k) for v in box]


def bigger_thumb(url: str, orig_width: int) -> str:
    """La même vignette en plus grand, ou "" s'il n'y a rien de plus à demander.

    Les vignettes de Commons portent leur largeur dans le chemin
    (`.../thumb/a/ab/Nom.jpg/960px-Nom.jpg`) : demander la version supérieure est une
    substitution, pas un appel d'API de plus.
    """
    m = re.search(r"/(\d+)px-", url)
    if not m or not url.startswith("https://upload.wikimedia.org/"):
        return ""
    if int(m.group(1)) >= BIG or (orig_width and orig_width <= int(m.group(1))):
        return ""
    return url[: m.start()] + f"/{BIG}px-" + url[m.end():]


def sharpness(img: Image.Image) -> float:
    """Variance du laplacien du carré final. Zéro si OpenCV manque (donc pas de filtre).

    Le détecteur dit « il y a un visage », pas « on le voit ». Une photo de scène tirée
    du fond de la salle donne trente pixels de visage, étirés à 400 : la vignette est
    une tache. Le flou se mesure, contrairement à la ressemblance.
    """
    if cv2 is None:
        return 0.0
    grey = np.array(ImageOps.grayscale(img), dtype=np.uint8)
    return float(cv2.Laplacian(grey, cv2.CV_64F).var())


def box_around(img: Image.Image, faces: list, room: float):
    """Carré `(gauche, haut, côté)` autour d'un ou plusieurs visages, borné par l'image.

    On veut le visage et un peu d'épaules, pas un gros plan sur les narines, d'où
    `room`. Le centre est pris un peu **sous** le milieu des visages : au-dessus il n'y
    a qu'un front, en dessous il y a un buste.
    """
    w, h = img.size
    x0 = min(f[0] for f in faces); x1 = max(f[0] + f[2] for f in faces)
    y0 = min(f[1] for f in faces); y1 = max(f[1] + f[3] for f in faces)
    side = int(min(min(w, h), max(x1 - x0, y1 - y0) * room))
    cx, cy = (x0 + x1) / 2, y0 + (y1 - y0) * 0.62
    left = int(min(max(0, cx - side / 2), w - side))
    top = int(min(max(0, cy - side / 2), h - side))
    return [left, top, side]


def square(img: Image.Image, box=None) -> Image.Image:
    w, h = img.size
    if box:
        left, top, side = box
    elif w > h:
        left, top, side = (w - h) // 2, 0, h
    else:
        left, top, side = 0, int((h - w) * CROP_BIAS), w
    return img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)


def write_module(out_map: dict) -> None:
    """Réécrit la map de lib/artist-photos.ts entre ses marqueurs.

    Le portrait ne passe plus par lib/bios.ts : il y était rattaché à la bio, ce qui
    rendait la photo conditionnée au texte, un artiste dont on trouvait le portrait
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


def category_files(cat: str, limit: int = 12) -> list:
    """Les fichiers d'une catégorie Commons, du plus récemment versé au plus ancien.

    C'est le gisement que P18 laissait de côté : Wikidata n'élit qu'une image par
    artiste, souvent une vue de scène, alors que la catégorie contient tout ce qui a
    été versé sur lui. Sur Amelie Lens, P18 rendait un plan large où le premier visage
    est celui d'un badaud ; la catégorie porte aussi un portrait net.
    """
    q = (f"{API}?action=query&format=json&list=categorymembers&cmtype=file"
         f"&cmlimit={limit}&cmtitle={urllib_quote('Category:' + cat)}")
    try:
        data = json.loads(fetch(q).decode())
    except Exception:
        return []
    time.sleep(THROTTLE)
    return [m["title"] for m in data.get("query", {}).get("categorymembers", [])]


SEARCH_CACHE = Path(__file__).resolve().parent / "search-cache.json"
# Le nom doit être assez long et assez composé pour qu'un fichier qui le porte parle bien
# de lui. « Sara Landry » ne désigne qu'elle sur Commons ; « Hysta » ramène une ferme
# suédoise (« Carl Wilhelm Öbergs stuga i Hysta »), « Mind », « Kobra » ou « Rise » sont
# des mots courants. Un nom d'un seul mot n'entre donc pas par cette porte, il reste sur
# P18 et sur la catégorie Commons, qui passent par un identifiant et non par une chaîne.
SEARCH_MIN_WORDS, SEARCH_MIN_CHARS = 2, 8


def load_search() -> dict:
    if SEARCH_CACHE.exists():
        try:
            return json.loads(SEARCH_CACHE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


_SEARCH = load_search()


def title_search(name: str, limit: int = 20) -> list:
    """Les fichiers Commons dont le **titre commence par** le nom de l'artiste.

    La troisième porte, après P18 et la catégorie Commons. Elle existe parce que les
    deux premières manquent des cas évidents : Amelie Lens n'a pas de catégorie, et son
    P18 est un plan large où le premier visage est celui d'un badaud, alors que Commons
    héberge aussi « Amelie Lens Airbeat One 2026.jpg », un vrai portrait.

    **`list=allimages&aiprefix=` et pas `list=search`.** La recherche plein texte est le
    point d'accès le plus cher de l'API : mesuré ici, un 429 quasi systématique et une
    minute par nom une fois les reprises payées, soit onze heures pour le catalogue.
    Le listage par préfixe lit un index, répond en 0,4 s, et rend en prime les
    dimensions. On y perd les fichiers qui ne *commencent* pas par le nom (« DJ Amelie
    Lens au Dour.jpg »), ce qui est le bon compromis : ce sont aussi les titres où le
    nom risque le plus de désigner autre chose.

    La réponse est mise en cache, **y compris quand elle est vide** : c'est un appel par
    artiste, non groupable, et une liste vide est une information comme une autre.
    """
    if name in _SEARCH:
        return _SEARCH[name]
    q = (f"{API}?action=query&format=json&list=allimages&ailimit={limit}"
         f"&aiprefix={urllib_quote(name)}")
    try:
        data = json.loads(fetch(q).decode())
    except Exception:
        return []
    time.sleep(THROTTLE)
    out = ["File:" + i["name"].replace("_", " ")
           for i in data.get("query", {}).get("allimages", [])
           if title_matches(name, i["name"])
           and not i["name"].lower().endswith((".svg", ".gif", ".pdf"))]
    _SEARCH[name] = out
    SEARCH_CACHE.write_text(json.dumps(_SEARCH, indent=1, ensure_ascii=False, sort_keys=True))
    return out


def searchable(name: str) -> bool:
    return len(name.split()) >= SEARCH_MIN_WORDS and len(name) >= SEARCH_MIN_CHARS


# Ce que Commons dit d'un fichier quand il range un homonyme. Ces deux listes ne servent
# **que** sur la route « titre », la seule qui rattache un fichier à un artiste par une
# chaîne de caractères.
MUSIC_CAT = re.compile(
    r"\b(music|musician|musical|dj|djs|disc jockey|singer|band|album|concert|festival|"
    r"techno|house|trance|hardcore|electronic|rave|nightclub|club|rapper|hip hop|"
    r"record producer|performer|stage)\b", re.I)
NOT_MUSIC = re.compile(
    r"\b(snooker|rugby|football|footballer|cricket|basketball|tennis|boxing|boxer|"
    r"athletics|athlete|swimmer|cyclist|golf|hockey|baseball|wrestler|racing driver|"
    r"politician|politicians|democrats|republicans|senators|treasurers|mayors|"
    r"humanitarians|actresses|actors|software|programmers|bishop|general|"
    r"players of|league)\b", re.I)


def title_matches(name: str, title: str) -> bool:
    """Le titre commence-t-il par le nom, **et s'arrête-t-il là** ?

    Le piège de la sous-chaîne, encore : « Carl Dutt » préfixe « Carl Duttenhofer »,
    « Brent Honey » préfixe « Brent Honeywell », « Alyssa Rose » préfixe « Alyssa
    Rosenzweig ». Trois personnes qui ne sont pas nos artistes, et trois portraits qui
    seraient partis en ligne sous leur nom. Le nom doit tomber sur une frontière de mot.
    """
    key, t = slugify(name), slugify(title)
    rest = t[len(key):] if t.startswith(key) else None
    return rest is not None and (rest == "" or rest.startswith("-"))


def about_the_artist(entry: dict, name: str) -> bool:
    """Les catégories du fichier disent-elles que c'est bien de cet artiste qu'il s'agit ?

    **Le piège de la sous-chaîne, repayé sur des personnes.** Un préfixe « Jamie Jones »
    ramène « Jamie Jones-Buchanan », rugbyman de Leeds, et « Jamie Jones PHC », joueur de
    snooker : le nom du DJ est bien au début du titre, il ne désigne simplement pas la
    même personne. C'est la règle « Ain est une sous-chaîne de Saintes » de
    `eventsForPlace()`, avec cette fois un visage au bout.

    Deux tests, l'un négatif, l'autre positif, et il faut passer les deux :

    - **rejet** sur un sport ou un métier sans rapport, ou sur une catégorie de la forme
      « Nom (précision) » où la précision ne parle pas de musique, ce qui est exactement
      la façon dont Commons range un homonyme (« Jamie Jones (snooker player) ») ;
    - **exigence** d'une catégorie qui parle de musique ou qui porte le nom de l'artiste.
      Sans elle, on ne garde rien : c'est ce qui écarte le trésorier de Caroline du Nord
      « Benjamin R. Lacy » de la fiche du DJ Benjamin R, et le prix à payer est réel,
      le portrait d'Amelie Lens versé en 2026 n'a encore aucune catégorie utile.

    Cette porte reste la moins sûre des trois, et **elle ne remplace pas la relecture
    à l'oeil** : Commons range un homonyme parfait (« Alex Stein ») exactement comme
    l'artiste. Ce que la mesure ne voit pas finit dans `SKIP`.
    """
    # **Un fichier dans le domaine public n'est pas la photo d'un DJ vivant.** Sur cette
    # route, « Public domain » a rendu un secrétaire d'État américain pour James Baker,
    # un portrait à l'huile du XVIIIe pour James Monro, un capitaine de sauvetage de 1890
    # pour Joshua James et un tableau de la collection Vanderbilt pour Maria Louisa. Les
    # photos récentes de Commons sont en CC (ou en CC0) ; le domaine public par
    # expiration, ou parce que l'auteur est une agence fédérale, désigne autre chose.
    if re.match(r"(public domain|pd[\s-])", (entry.get("license") or "").strip(), re.I):
        return False
    cats = entry.get("cats") or []
    key = slugify(name)
    for c in cats:
        if NOT_MUSIC.search(c):
            return False
        m = re.match(re.escape(name) + r"\s*\((.+)\)$", c, re.I)
        if m and not MUSIC_CAT.search(m.group(1)):
            return False
    return any(MUSIC_CAT.search(c) or key in slugify(c) for c in cats)


def try_candidate(slug: str, c: dict, groups: set, seen_hash: dict, args):
    """Fabrique le carré d'un candidat, ou dit pourquoi il ne convient pas.

    Rend `(entrée de la map, None)` ou `(None, raison)`. C'est la même porte pour les
    trois routes (bio, P18, catégorie Commons), parce que la question posée est la même :
    cette image montre-t-elle l'artiste, assez grand et assez net pour être publiée.
    """
    url, author, lic, page = c["url"], c["author"], c["license"], c["page"]
    local = c.get("via") == "fourni"
    if not local and not url.startswith("https://upload.wikimedia.org/"):
        return None, "hors Wikimedia Commons"
    if not (author and lic and page):
        return None, "auteur ou licence manquant → réutilisation non conforme"
    try:
        raw = (LOCAL / url).read_bytes() if local else source_bytes(url, args.force)
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    except Exception as e:
        return None, f"{'lecture' if local else 'téléchargement'}/décodage : {str(e)[:60]}"
    if min(img.size) < MIN_SRC:
        return None, f"trop petite ({img.size[0]}×{img.size[1]})"

    box = None
    if cv2 is not None and slug not in MASKED:
        # Sur un fichier **fourni**, la question « qui est sur la photo » est déjà
        # tranchée par celui qui l'a déposé : les garde-fous d'identité (deux visages
        # comparables, aucun visage) n'ont plus rien à arbitrer, et refuser la photo de
        # I Hate Models parce qu'il porte un masque serait absurde. La détection ne sert
        # plus qu'à cadrer, et le cadrage géométrique reste le repli.
        box, why = pick_frame(img, faces_of(img), slug in groups or local)
        if box is None and not local:
            return None, why

    h = hashlib.sha1(raw).hexdigest()[:10]
    if h in seen_hash and seen_hash[h] != slug:
        return None, f"même image que {seen_hash[h]}, probable erreur d'identification"

    src, box = upscale_source(img, box, c, args.force)
    crop = square(src, box)
    sharp = sharpness(crop)
    if cv2 is not None and not local and sharp < MIN_SHARP:
        return None, f"carré final trop flou (netteté {sharp:.0f} < {MIN_SHARP})"
    seen_hash[h] = slug

    if not args.dry:
        duotone(crop).save(OUT / f"{slug}.webp", "WEBP", quality=86, method=6)
    print(f"  ✓ {c['name']:30} {src.size[0]}×{src.size[1]} carré {box[2] if box else '-'} "
          f"netteté {sharp:.0f} [{c.get('via', '?')}] → {slug}.webp")
    return {"file": f"{slug}.webp", "author": author, "license": lic, "page": page}, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--force", action="store_true",
                    help="ignore le cache disque des originaux et retélécharge")
    ap.add_argument("--limit", type=int, default=0,
                    help="nombre max d'artistes explorés par la route Wikidata")
    ap.add_argument("--no-cats", action="store_true",
                    help="s'en tenir à P18, sans explorer les catégories Commons")
    ap.add_argument("--no-search", action="store_true",
                    help="ne pas chercher de fichiers par le nom de l'artiste")
    ap.add_argument("--search-limit", type=int, default=0,
                    help="nombre max de noms cherchés sur Commons (les plus programmés "
                         "d'abord ; le cache rend la reprise gratuite)")
    args = ap.parse_args()

    rows = []
    for f in sorted(HERE.glob("bios-*.json")):
        try:
            rows += json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ {f.name} : JSON invalide ({e})")
            return 1

    # --- les candidats, dans l'ordre d'autorité --------------------------------
    # slug -> [ {nom, url (vignette), orig, bytes, auteur, licence, page, via}, ... ]
    # Une liste et non un fichier unique : quand le premier candidat ne montre pas
    # l'artiste (deux visages, trop flou), on essaie le suivant plutôt que de laisser
    # la fiche sans portrait.
    cands, resolved, denied = {}, 0, []

    def add(slug: str, entry: dict) -> None:
        cands.setdefault(slug, []).append(entry)

    # Qui est un groupe, d'après ce que Wikidata dit de lui. `pick_frame()` en a besoin :
    # deux visages sur la photo d'un DJ sont un doute, deux visages sur celle d'un duo
    # sont la photo du duo.
    groups, descs = set(), {}
    for _f in ("wd", "wdlabel", "wdcat"):
        _p = HARVEST / f"{_f}.json"
        if _p.exists():
            for _k, _v in json.loads(_p.read_text()).items():
                descs.setdefault(_k, _v.get("desc") or "")
                if GROUP_DESC.search(_v.get("desc") or ""):
                    groups.add(_k)

    # --- les photos déposées à la main -----------------------------------------
    # La route qui **prime sur toutes les autres** : quand quelqu'un dépose une photo,
    # c'est qu'il a une raison, et il a vu l'image. Elle ne dispense pas de déclarer
    # l'auteur et la licence, qui restent la condition d'affichage sur la fiche (voir
    # l'en-tête de lib/artist-photos.ts) : sans eux, l'entrée est refusée comme les
    # autres. C'est aussi la seule route qui accepte autre chose que Commons, donc la
    # seule où la responsabilité des droits est celle du déposant, pas d'une licence
    # lue par le script.
    src_file = LOCAL / "sources.json"
    if src_file.exists():
        try:
            local_rows = json.loads(src_file.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ local/sources.json : JSON invalide ({e})")
            return 1
        for r in local_rows:
            slug = (r.get("slug") or slugify(r.get("name") or "")).strip()
            f = (r.get("file") or "").strip()
            if not slug or not f:
                print(f"  ✗ entrée locale sans slug ni fichier : {r}")
                continue
            if not (LOCAL / f).exists():
                print(f"  ✗ {f} introuvable dans {LOCAL}")
                continue
            add(slug, {"name": r.get("name") or slug, "url": f, "orig": "", "bytes": 0,
                       "w": 0, "cats": [], "via": "fourni",
                       "author": (r.get("author") or "").strip(),
                       "license": (r.get("license") or "").strip(),
                       "page": (r.get("page") or r.get("source") or "").strip()})
        print(f"{len(local_rows)} photo(s) déposée(s) dans .research/artists/local/")

    # Tous les titres Commons dont on aura besoin, résolus en lots de cinquante avant
    # d'entrer dans les boucles : une requête par fichier prend un 429 au bout de
    # quelques centaines et le débit s'effondre.
    wanted = [commons_title(r["commons"]) for r in rows if (r.get("commons") or "").strip()]
    _wd_file, _cat_file = HARVEST / "wdlabel.json", HARVEST / "catalogue.json"
    if _wd_file.exists() and _cat_file.exists():
        _cat = json.loads(_cat_file.read_text())
        for _s, _v in json.loads(_wd_file.read_text()).items():
            if _v.get("img") and _s in _cat and is_our_artist(_v):
                wanted.append(commons_title(_v["img"]))
    print(f"{len(set(wanted))} fichier(s) Commons à qualifier")
    resolve_many(wanted)
    for r in rows:
        name = (r.get("name") or "").strip()
        slug = slugify(name)
        if not slug or slug in cands:
            continue
        url = (r.get("photo_url") or "").strip()
        if url:  # forme historique : les termes ont déjà été relevés par l'agent
            add(slug, {"name": name, "url": url, "orig": url, "bytes": 0, "via": "bio",
                       "author": (r.get("photo_author") or "").strip(),
                       "license": (r.get("photo_license") or "").strip(),
                       "page": (r.get("photo_page") or "").strip()})
        elif (r.get("commons") or "").strip():
            got = resolve_commons(commons_title(r["commons"]))
            resolved += 1
            if got and "denied" in got:
                denied.append((name, got["denied"])); continue
            if got:
                add(slug, dict(got, name=name, via="bio"))

    # Wikidata P18 : le gisement le plus large, et le seul qui couvre les artistes sans
    # bio. Le rattachement passe par l'identifiant MusicBrainz, pas par le nom, c'est
    # ce qui évite de coller le portrait d'un homonyme sur une fiche.
    cat_file = HARVEST / "catalogue.json"
    catalogue = json.loads(cat_file.read_text()) if cat_file.exists() else {}
    wd = {}
    for name in ("wd", "wdlabel"):
        f = HARVEST / f"{name}.json"
        if f.exists():
            for k, v in json.loads(f.read_text()).items():
                if v.get("img"):
                    wd.setdefault(k, v)
    todo = [(s, v) for s, v in sorted(wd.items(), key=lambda kv: -catalogue.get(kv[0], {}).get("n", 0))
            if s in catalogue and is_our_artist(v)]
    if args.limit:
        todo = todo[: args.limit]
    for slug, v in todo:
        got = resolve_commons(commons_title(v["img"]))
        resolved += 1
        if got and "denied" in got:
            denied.append((catalogue[slug]["name"], got["denied"])); continue
        if got:
            add(slug, dict(got, name=catalogue[slug]["name"], via="P18"))

    print(f"{len(cands)} artiste(s) avec au moins un candidat · {resolved} licence(s) lue(s) "
          f"sur Commons · {len(denied)} refusée(s) pour cause de licence")
    for name, lic in denied:
        print(f"  ✗ {name:32} licence non réutilisable : {lic}")

    OUT.mkdir(parents=True, exist_ok=True)
    global cv2
    if cv2 is not None and not ensure_face_model():
        cv2 = None  # sans modèle, on ne peut ni centrer ni filtrer : on ne prétend pas le faire
    seen_hash, out_map, skipped = {}, {}, {}

    def run(slug: str, entries: list) -> None:
        """Essaie les candidats d'un artiste jusqu'à ce que l'un passe les garde-fous."""
        if slug in out_map:
            return
        # Une photo déposée à la main passe **devant `SKIP`** : la liste dit « aucun
        # fichier trouvé ne montre cet artiste », pas « cet artiste n'aura pas de
        # portrait ». Déposer un fichier, c'est justement répondre à ce manque.
        if slug in SKIP and entries[0].get("via") != "fourni":
            skipped[slug] = (entries[0]["name"], "écarté à la relecture : " + SKIP[slug])
            return
        for c in entries[:MAX_TRIES]:
            entry, why = try_candidate(slug, c, groups, seen_hash, args)
            if entry:
                out_map[slug] = entry
                skipped.pop(slug, None)
                return
            # La raison retenue est celle du **premier** candidat, pas du dernier : les
            # candidats sont classés par autorité, donc c'est celle-là qui dit quoi
            # corriger. Le rapport affichait l'inverse, et une photo déposée sans crédit
            # ressortait en « aucun visage détecté », le reproche fait au fichier suivant.
            skipped.setdefault(slug, (c["name"], why))

    def note_empty(slug: str, name: str, entries: list) -> None:
        """Un filtre qui ne laisse rien passer est une décision, pas une panne.

        La distinction compte pour la conservation plus bas : sans cette trace, un
        artiste dont tous les fichiers viennent d'être refusés (licence de domaine
        public, catégorie d'homonyme) ressemblait à un artiste que Commons n'avait pas
        eu le temps de servir, et son ancien portrait était **remis**, filtres compris.
        """
        if not entries and slug not in out_map:
            skipped.setdefault(slug, (name, "aucun fichier retenu par les filtres de nom, "
                                            "de licence ou de catégorie"))

    for slug, entries in cands.items():
        run(slug, entries)

    # --- deuxième tour : les catégories Commons -------------------------------
    # Seulement pour les artistes qui n'ont toujours pas de portrait : une catégorie
    # coûte un appel d'API et quelques téléchargements, ça ne se dépense pas pour
    # remplacer une photo qui convient déjà.
    wdcat_file = HARVEST / "wdcat.json"
    if not args.no_cats and wdcat_file.exists():
        cats = json.loads(wdcat_file.read_text())
        todo2 = [(s, v["cat"]) for s, v in
                 sorted(cats.items(), key=lambda kv: -catalogue.get(kv[0], {}).get("n", 0))
                 if v.get("cat") and s in catalogue and s not in out_map
                 and ELECTRONIC.search(v.get("desc") or "")]
        if args.limit:
            todo2 = todo2[: args.limit]
        print(f"\n{len(todo2)} artiste(s) sans portrait avec une catégorie Commons")
        for slug, cat in todo2:
            titles = category_files(cat)
            if not titles:
                continue
            resolve_many(titles)
            entries = []
            for t in titles:
                got = _CACHE.get(t) or {}
                if "denied" in got:
                    denied.append((catalogue[slug]["name"], got["denied"])); continue
                if got:
                    entries.append(dict(got, name=catalogue[slug]["name"], via="cat", title=t))
            # Un fichier qui porte le nom de l'artiste dans son titre a plus de chances
            # d'être un portrait que la photo de foule versée dans la même catégorie.
            key = slugify(catalogue[slug]["name"])
            entries.sort(key=lambda e: (key not in slugify(e.get("title", "")), -(e.get("bytes") or 0)))
            note_empty(slug, catalogue[slug]["name"], entries)
            run(slug, entries)

    # --- troisième tour : la recherche par titre ------------------------------
    # Même principe que les catégories, un cran plus loin et un cran moins sûr : on ne
    # l'ouvre qu'aux noms composés (voir `searchable()`), et le titre est re-vérifié.
    if not args.no_search:
        todo3 = [s for s in sorted(catalogue, key=lambda k: -catalogue[k].get("n", 0))
                 if s not in out_map and s not in SKIP and searchable(catalogue[s]["name"])]
        cap = args.search_limit or args.limit
        if cap:
            todo3 = todo3[:cap]
        print(f"\n{len(todo3)} artiste(s) sans portrait dont le nom est cherchable sur Commons")
        # Deux temps, et c'est ce qui rend la porte praticable : un appel par nom pour
        # lister (l'index de préfixes, bon marché), puis **un seul lot de cinquante**
        # pour lire les licences. En intercalant les deux, on payait deux appels par
        # artiste, dont un cher, et Commons répondait 429 à la moitié.
        found = {}
        for i, slug in enumerate(todo3):
            titles = title_search(catalogue[slug]["name"])
            if titles:
                found[slug] = titles
            if i and i % 100 == 0:
                print(f"  cherchés : {i}/{len(todo3)} · {len(found)} avec un fichier", flush=True)
        print(f"  {len(found)} artiste(s) avec au moins un fichier à leur nom")
        resolve_many([t for ts in found.values() for t in ts])
        for slug, titles in found.items():
            name = catalogue[slug]["name"]
            # `title_matches` est re-testé ici : le cache de recherche a pu être
            # rempli par une version plus permissive du filtre.
            entries = [dict(_CACHE[t], name=name, via="titre", title=t) for t in titles
                       if _CACHE.get(t) and "denied" not in _CACHE[t]
                       and title_matches(name, t[5:]) and about_the_artist(_CACHE[t], name)]
            # Le titre le plus court d'abord : « David Guetta.jpg » est un portrait,
            # « David Guetta @ the Aragon, Chicago 4 4 2014 » est une photo de concert.
            entries.sort(key=lambda e: (len(e.get("title") or ""), -(e.get("bytes") or 0)))
            note_empty(slug, name, entries)
            run(slug, entries)

    # --- ce qu'un 429 ne doit pas emporter ------------------------------------
    # Le script rejuge tout le corpus à chaque passage, ce qui est le bon choix (une
    # règle nouvelle s'applique alors aussi à l'ancien), mais ça rend un portrait déjà
    # publié dépendant du fait que Commons réponde aujourd'hui. Un lot de licences en
    # 429, et Emiliana Torrini ou Underworld disparaissaient du site sans qu'aucune
    # règle ne les ait refusés. **Un refus n'est pas une réponse** (même leçon que les
    # 503 MusicBrainz enregistrés en « artiste introuvable » dans harvest.py) : seul un
    # garde-fou qui a vu l'image peut retirer un portrait ; une panne de réseau, non.
    prev_file = HERE / "avatars.json"
    prev = json.loads(prev_file.read_text()) if prev_file.exists() else {}
    held = []
    for slug, entry in prev.items():
        if slug in out_map or slug in SKIP or not (OUT / entry["file"]).exists():
            continue
        why = skipped.get(slug, (None, "aucun candidat résolu ce passage"))[1]
        if "téléchargement" in why or "HTTP" in why or "aucun candidat" in why:
            out_map[slug] = entry
            skipped.pop(slug, None)
            held.append((slug, why))
    if held:
        print(f"\n{len(held)} portrait(s) conservé(s) tels quels, Commons n'ayant pas répondu :")
        for slug, why in held:
            print(f"  ~ {slug:30} {why[:60]}")

    kept = len(out_map)
    print(f"\n{kept} portrait(s) · {len(skipped)} artiste(s) écarté(s)")
    for name, why in sorted(skipped.values()):
        print(f"  ✗ {name:32} {why}")

    # Un portrait retiré laisse un fichier derrière lui, et un fichier que plus aucune
    # fiche ne cite finit par être servi par erreur au prochain qui réutilise le slug.
    # Même règle que l'élagage des maps indexées par id dans .research/photos/ingest.py.
    orphans = [f for f in OUT.glob("*.webp") if f.name not in {v["file"] for v in out_map.values()}]
    if orphans:
        print(f"\n{len(orphans)} fichier(s) orphelin(s) dans public/artists/ :")
        for f in orphans:
            print(f"  - {f.name}")
            if not args.dry:
                f.unlink()

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
