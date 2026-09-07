#!/usr/bin/env python3
"""
Collecteur automatique : l'agenda électro de jds.fr vers un lot `.research/events-*.json`.

**Pourquoi celui-ci d'abord.** Le catalogue est saisi à la main, lot par lot, et ne se
rafraîchit que si quelqu'un lance un agent. Conséquence mesurée : 481 dates à venir au
Royaume-Uni contre 166 en France, parce qu'un guichet britannique (Skiddle) a été branché
et qu'aucune source française ne l'a été. jds.fr est la meilleure source FR disponible
depuis le conteneur, et la seule qui publie un **JSON-LD `MusicEvent` complet** : date,
heure, salle, ville, code postal, coordonnées exactes, tarifs et line-up, d'un seul
`curl`. 349 dates y sont listées, contre 166 au catalogue.

**Ce que ce script fait, et ce qu'il ne fait pas.** Il collecte, il met au format, il
classe, et il **s'arrête là**. Il n'écrit pas dans `lib/data.ts` : il produit un lot que
`merge.py` fusionnera après relecture, exactement comme un lot d'agent. La règle du
projet ne s'assouplit pas parce que la donnée arrive par une machine, elle vient d'une
source *structurée*, ce qui rend la relecture plus rapide, pas facultative.

**Trois refus, et ils sont le cœur du script.**

1. **Un agenda « electro » n'est pas un agenda électro.** Celui de jds contient des
   « Candlelight : hommage à Hans Zimmer », des tributes Daft Punk à l'orchestre et des
   ciné-concerts. Ingérer sans filtre remplirait un annuaire de rave de concerts aux
   chandelles. On ne publie donc que ce qui porte une **preuve positive** d'électronique.
2. **Sans preuve de genre, pas de fiche.** `genres` est obligatoire et validé sur les
   onze clés de `GENRES` : le déduire de « c'est dans la rubrique electro » serait
   exactement l'invention que la règle de contenu interdit. Aucun mot-clé reconnu dans le
   titre, la description ou le line-up, et la fiche part en relecture.
3. **Sans horaire publié, pas de fiche.** `startDate` porte l'heure sur la grande
   majorité des dates ; quand il ne la porte pas, c'est en général un festival dont jds
   écrit noir sur blanc que « les horaires seront communiqués par l'organisateur ». La
   chercher dans le corps de la page ramène l'horaire d'un événement de la colonne
   latérale, vérifié. On ne devine pas une heure de porte.

**Le piège du lien de billetterie.** `offers[].url` est un lien **Tradedoubler de jds** :
le reprendre tel quel enverrait la commission de nos lecteurs chez eux, sur un lien que
nous présenterions comme la billetterie officielle. On en extrait la destination réelle
(paramètre `url(...)`), et à défaut on n'écrit pas de `ticketUrl`.

**La description est la nôtre.** Celle de jds est leur texte éditorial, le republier
serait le reprendre. On engendre une phrase de faits (salle, ville, dates, tête
d'affiche, tarif), comme `lib/pagecopy.ts` le fait pour les pages : c'est un point de
départ que la relecture améliore, jamais une affirmation empruntée.

    python3 .research/sources/jds.py            # collecte et écrit le lot
    python3 .research/sources/jds.py --limit 20 # essai court
    python3 .research/sources/jds.py --no-cache # ignore le cache disque

Puis, comme n'importe quel lot :

    python3 .research/merge.py --dry && python3 .research/merge.py
    python3 .research/audit.py && npm run build
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from departements import departement  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
# Rempli au début de `harvest()` : la map des genres attribués, lue une fois.
STYLES: dict[str, list[str]] = {}
RESEARCH = os.path.dirname(HERE)
APP = os.path.dirname(RESEARCH)
CACHE = os.path.join(HERE, ".cache")
OUT = os.path.join(RESEARCH, "events-jds-auto.json")
REVIEW = os.path.join(HERE, "jds-a-relire.md")

AGENDA = "https://www.jds.fr/agenda/electro-335_B"
MAX_PAGES = 20
# jds n'impose pas de `Crawl-delay` (robots.txt : « Allow: / », rien d'autre). On s'en
# pose un quand même : 350 fiches à pleine vitesse sur le site d'un tiers est le genre de
# chose qui fait fermer une porte ouverte.
DELAY = 0.7
TIMEOUT = 25


# ----------------------------------------------------------------- réseau

def fetch(url: str, use_cache: bool = True) -> str:
    """Le HTML d'une URL, via curl comme tout le reste du dépôt, avec cache disque.

    curl et non urllib : même URL, `avatars.py` a mesuré 200 en 0,2 s à curl contre 429
    à urllib. Le cache existe pour que retoucher une règle de classement ne re-télécharge
    pas 349 pages, ce qui finirait par ressembler à une attaque.
    """
    key = re.sub(r"[^a-zA-Z0-9]+", "-", url)[-120:]
    path = os.path.join(CACHE, key + ".html")
    if use_cache and os.path.exists(path):
        return open(path, encoding="utf-8", errors="replace").read()
    r = subprocess.run(
        ["curl", "-s", "--max-time", str(TIMEOUT), "-A", "RaveRadar/1.0 (+https://www.raveparty.fr)", url],
        capture_output=True, text=True,
    )
    body = r.stdout or ""
    os.makedirs(CACHE, exist_ok=True)
    open(path, "w", encoding="utf-8").write(body)
    time.sleep(DELAY)
    return body


def agenda_links(use_cache: bool) -> list[str]:
    """Les URLs de fiches de l'agenda, page par page jusqu'à ce qu'il n'y ait plus rien.

    La pagination ne dit pas où elle s'arrête : la dernière page rend les mêmes liens que
    la précédente. On s'arrête donc quand une page n'apporte aucune fiche nouvelle, pas
    sur un numéro codé en dur qui deviendrait faux au premier événement ajouté.
    """
    seen: list[str] = []
    known: set[str] = set()
    for p in range(1, MAX_PAGES + 1):
        url = AGENDA if p == 1 else f"{AGENDA}?page={p}"
        found = {
            l for l in re.findall(r'href="(https://www\.jds\.fr/[^"]*_A)"', fetch(url, use_cache))
            # `/actu/` est une brève de la rédaction, pas un événement.
            if "/actu/" not in l
        }
        new = [l for l in sorted(found) if l not in known]
        if not new:
            break
        known |= found
        seen += new
    return seen


def music_event(page: str) -> dict | None:
    """Le nœud `MusicEvent` du JSON-LD de la page, s'il y en a un."""
    for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S):
        try:
            data = json.loads(block)
        except Exception:
            continue
        for node in data if isinstance(data, list) else [data]:
            if isinstance(node, dict) and node.get("@type") in ("MusicEvent", "Event", "Festival"):
                return node
    return None


# ------------------------------------------------------- classement éditorial

def fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


# Ce qui n'a rien à faire dans un annuaire de rave, même listé sous « electro ». La liste
# est faite de ce qu'on a réellement vu passer sur cet agenda, pas de suppositions : des
# concerts aux chandelles, des tributes joués par un orchestre, des ciné-concerts, des
# spectacles et des dîners dansants.
OFF_TOPIC = [
    "candlelight", "hommage a", "tribute", "cover band", "orchestre", "orchestra",
    "symphoniq", "philharmoni", "cine-concert", "cine concert", "comedie musicale",
    "spectacle equestre", "diner spectacle", "brunch", "karaoke", "blind test",
    "quiz", "conference", "atelier", "exposition", "theatre", "opera",
    "gospel", "chorale", "harmonie municipale", "bal populaire", "the dansant",
]

# La preuve positive. L'ordre compte : « hard techno » doit être testé avant « techno »,
# et « psytrance » avant « trance », sinon le plus court emporte le plus long.
# La preuve positive, cherchée **en mots entiers** et **jamais dans le nom de la salle**.
# Les deux règles viennent d'un premier essai raté, et chacune a un cas nommé :
# « house » est une sous-chaîne de « Warehouse », donc les neuf dates du Warehouse de
# Nantes sont sorties étiquetées House ; et « jungle » a classé en drum & bass La Jungle,
# duo de noise-rock belge, sur son seul nom. C'est la règle « Ain est une sous-chaîne de
# Saintes » d'`eventsForPlace()`, repayée deux fois.
#
# Les libellés trop courants ont donc été retirés plutôt que corrigés : « jungle »,
# « garage », « minimal » et « disco » sont des mots français ou des noms de groupes
# avant d'être des genres. Ce qu'ils auraient attrapé, la carte des artistes l'attrape
# mieux. L'ordre compte encore : « hard techno » avant « techno », « psytrance » avant
# « trance ».
GENRE_HINTS: list[tuple[str, str]] = [
    ("hard techno", "Hard Techno"), ("hardtechno", "Hard Techno"),
    ("acid techno", "Acid Techno"), ("acidcore", "Acid Techno"),
    ("psytrance", "Psytrance"), ("psy-trance", "Psytrance"), ("goa", "Psytrance"),
    ("hardstyle", "Hardstyle"), ("rawstyle", "Hardstyle"),
    ("frenchcore", "Hardcore"), ("uptempo", "Hardcore"), ("hardcore", "Hardcore"),
    ("tekno", "Hardcore"), ("terrorcore", "Hardcore"),
    ("drum & bass", "Drum & Bass"), ("drum and bass", "Drum & Bass"),
    ("drum'n'bass", "Drum & Bass"), ("dnb", "Drum & Bass"), ("neurofunk", "Drum & Bass"),
    ("tech house", "House"), ("deep house", "House"), ("afro house", "House"),
    ("house", "House"),
    ("trance", "Trance"),
    ("techno", "Techno"),
    ("edm", "EDM"), ("mainstage", "EDM"), ("big room", "EDM"),
    ("warehouse", "Warehouse"),
]


# Ce qui suffit à dire « c'est bien de l'électronique », même sans nom de style : un
# libellé de rubrique ne suffit pas, mais ces mots-là sont portés par le contenu.
ELECTRO_HINTS = [
    "electro", "dj set", "dj-set", "club", "rave", "soiree techno", "clubbing",
    "boiler room", "after", "warm up", "b2b", "live set", "sound system",
]


def artist_styles() -> dict[str, list[str]]:
    """Les genres attribués aux artistes, lus dans `lib/artist-genres.ts`.

    C'est **la** bonne source pour classer une soirée dont le titre est un nom
    d'artiste, et le projet l'a déjà construite : 1 549 attributions récoltées sur
    Wikidata, MusicBrainz et des lots de recherche, avec la règle « le style d'un
    artiste est attribué, pas déduit du calendrier ». Chercher un mot-clé dans le texte
    éditorial de jds à la place, c'est ce qui a fait passer French 79, groupe de
    synthwave marseillais, pour de la techno parce que le mot traînait dans un
    paragraphe. On lit le fichier au motif, comme `audit.py` lit `data.ts` : une entrée
    tient sur une ligne.
    """
    path = os.path.join(APP, "lib", "artist-genres.ts")
    out: dict[str, list[str]] = {}
    try:
        src = open(path, encoding="utf-8").read()
    except OSError:
        return out
    for slug, main in re.findall(r'^\s*"([^"]+)":\s*\{\s*m:\s*\[([^\]]*)\]', src, re.M):
        genres = re.findall(r'"([^"]+)"', main)
        if genres:
            out[slug] = genres
    return out


def slugify(s: str) -> str:
    """Copie conforme de `slugify()` (lib/display.ts), pour retrouver la clé d'un artiste."""
    s = fold(s)
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def classify(text: str) -> tuple[list[str], list[str]]:
    """Les genres reconnus dans le texte, et les motifs hors périmètre trouvés.

    On rend les deux : un appelant qui ne verrait que les genres publierait un
    « hommage techno symphonique » au motif qu'il contient « techno ».
    """
    t = fold(text)
    off = [w for w in OFF_TOPIC if w in t]
    genres: list[str] = []
    for needle, genre in GENRE_HINTS:
        # `\b` sur la forme réduite : c'est ce qui empêche « house » de se déclencher
        # au milieu de « warehouse », et « goa » au milieu de « goal ».
        if re.search(rf"\b{re.escape(needle)}\b", t) and genre not in genres:
            genres.append(genre)
    return genres, off


def is_electro(text: str) -> bool:
    t = fold(text)
    return any(w in t for w in ELECTRO_HINTS)


# ------------------------------------------------------------- mise au format

def clean(s: str | None) -> str:
    """Le texte d'un champ JSON-LD, entités HTML résolues et espaces normalisés."""
    if not s:
        return ""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


# Les redirecteurs d'affiliation croisés sur jds, plus les grands réseaux : leurs liens
# portent l'identifiant du site qui les publie, jamais le nôtre.
AFFILIATE_REDIRECTORS = (
    "tradedoubler", "awin1.com", "awin.com", "zenaps", "effiliation", "kwanko",
    "netaffiliation", "affilae", "clickbank", "impactradius", "evyy.net", "prf.hn",
    "anrdoezrs", "dpbolvw", "kqzyfj", "jdoqocy", "tkqlhce",
)


def real_ticket_url(offers) -> str | None:
    """La vraie billetterie, extraite du lien Tradedoubler de jds.

    `offers[].url` ressemble à `https://pdt.tradedoubler.com/click?a(...)p(...)url(<URL
    encodée>)`. Reprendre ce lien tel quel publierait **leur** lien affilié sous notre
    nom : le lecteur croit aller à la billetterie officielle et la commission part chez
    un tiers. On récupère la destination, et si on ne sait pas la lire on ne met rien,
    `ticketUrl()` retombe alors sur son défaut.
    """
    for o in offers if isinstance(offers, list) else [offers]:
        if not isinstance(o, dict):
            continue
        u = o.get("url") or ""
        m = re.search(r"url\(([^)]+)\)", u)
        if m:
            dest = urllib.parse.unquote(m.group(1))
            if dest.startswith("http"):
                return dest
        if u.startswith("http"):
            host = urllib.parse.urlparse(u).netloc.lower()
            # Liste de refus et non liste d'acceptation : un réseau d'affiliation qu'on
            # ne connaîtrait pas encore doit être écarté par défaut, pas laissé passer.
            # Le premier essai a publié un `awin1.com/pclick.php?...a=634278`, c'est-à-dire
            # l'identifiant Awin **de jds** : le lecteur croit aller à la billetterie
            # officielle et la commission part chez un tiers.
            if any(bad in host for bad in AFFILIATE_REDIRECTORS) or "jds.fr" in host:
                continue
            return u
    return None


def lowest_price(offers) -> tuple[float | None, str]:
    """Le tarif d'entrée le plus bas réellement vendu, et sa devise.

    `AggregateOffer.lowPrice` est exactement ce que le projet veut afficher : ni le pass
    complet, ni le montant barré, ni un dernier palier épuisé. Un 0 n'est pas une entrée
    libre (c'est la leçon des billets à 0 de Skiddle, qui sont des listes d'invités), il
    est rendu comme « inconnu ».
    """
    best: float | None = None
    cur = "€"
    for o in offers if isinstance(offers, list) else [offers]:
        if not isinstance(o, dict):
            continue
        if o.get("priceCurrency") == "EUR":
            cur = "€"
        for k in ("lowPrice", "price"):
            v = o.get(k)
            if v in (None, ""):
                continue
            try:
                p = float(str(v).replace(",", "."))
            except ValueError:
                continue
            if p > 0 and (best is None or p < best):
                best = p
    return best, cur


def tidy_title(name: str) -> str:
    """Retire du titre ce qui décrit l'affiche plutôt que l'événement.

    jds écrit « Digitalism + Première Partie », « Joris Delacroix + Guest », « Lewis
    Ofman + 1ère Partie » : la première partie n'est pas nommée, donc la mention
    n'apprend rien et se retrouverait dans le `<title>` de la page, dans le slug et dans
    la clé de dédup. On ne touche à rien d'autre : le titre reste celui de la source,
    c'est sous ce nom que la soirée se cherche.
    """
    t = re.sub(r"\s*\+\s*(1[eè]re|premi[eè]re)\s+partie\s*$", "", name, flags=re.I)
    t = re.sub(r"\s*\+\s*guests?\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*\+\s*(et\s+)?(plus|more)\s*$", "", t, flags=re.I)
    return re.sub(r"\s{2,}", " ", t).strip(" -–")


def guess_type(name: str, venue: str, multi_day: bool) -> str:
    """Festival, Warehouse ou Club, les trois seules valeurs qu'`EventType` admette.

    Un événement sur plusieurs jours est un festival, c'est la seule déduction sûre. Le
    reste se lit dans le libellé : un mot explicite l'emporte, sinon on dit « Club », qui
    est le cas majoritaire d'un agenda de soirées et le moins engageant des trois.
    """
    t = fold(f"{name} {venue}")
    if multi_day or "festival" in t:
        return "Festival"
    if any(w in t for w in ("warehouse", "entrepot", "hangar", "friche", "usine")):
        return "Warehouse"
    return "Club"


def make_desc(name: str, venue: str, city: str, date: str, end: str | None,
              time_s: str, lineup: list[str], price: float | None, cur: str) -> tuple[str, str]:
    """La description, faite de faits et pas empruntée.

    Celle de jds est leur texte : la reprendre serait republier leur travail, et sa voix
    n'est pas la nôtre. On assemble donc ce que la donnée structurée affirme. C'est plat
    par construction, et c'est assumé : la relecture qui précède la fusion est exactement
    l'endroit où une description se réécrit, avec une source sous les yeux.
    """
    def fr_date(iso: str) -> str:
        mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
                "août", "septembre", "octobre", "novembre", "décembre"]
        d = dt.date.fromisoformat(iso)
        return f"{d.day} {mois[d.month - 1]} {d.year}"

    def en_date(iso: str) -> str:
        d = dt.date.fromisoformat(iso)
        return d.strftime("%-d %B %Y")

    when_fr = f"du {fr_date(date)} au {fr_date(end)}" if end and end != date else f"le {fr_date(date)}"
    when_en = f"from {en_date(date)} to {en_date(end)}" if end and end != date else f"on {en_date(date)}"
    head = ", ".join(lineup[:4])
    more = len(lineup) - 4

    fr = f"{name} {when_fr} à {venue}, {city}, à partir de {time_s}."
    en = f"{name} {when_en} at {venue}, {city}, from {time_s}."
    if head:
        fr += f" Au line-up : {head}" + (f" et {more} autre{'s' if more > 1 else ''} nom{'s' if more > 1 else ''}." if more > 0 else ".")
        en += f" On the bill: {head}" + (f" and {more} more name{'s' if more > 1 else ''}." if more > 0 else ".")
    if price:
        amount = f"{price:g} {cur}"
        fr += f" Entrée à partir de {amount}."
        en += f" Entry from {amount}."
    return fr, en


# ------------------------------------------------------------------- collecte

def harvest(limit: int | None, use_cache: bool) -> tuple[list[dict], list[tuple[str, str, str]]]:
    global STYLES
    STYLES = artist_styles()
    print(f"{len(STYLES)} artiste(s) déjà attribué(s) dans lib/artist-genres.ts.")
    links = agenda_links(use_cache)
    if limit:
        links = links[:limit]
    print(f"{len(links)} fiche(s) à lire.")
    today = dt.date.today().isoformat()
    kept: list[dict] = []
    review: list[tuple[str, str, str]] = []

    for i, url in enumerate(links, 1):
        page = fetch(url, use_cache)
        node = music_event(page)
        if not node:
            review.append((url, "?", "pas de JSON-LD MusicEvent sur la page"))
            continue

        name = clean(node.get("name"))
        start = node.get("startDate") or ""
        end_raw = node.get("endDate") or ""
        date = start[:10]
        end = end_raw[:10] if end_raw else ""
        if not date or date < today:
            review.append((url, name, f"date absente ou passée ({date or 'vide'})"))
            continue

        loc = node.get("location") or {}
        if isinstance(loc, list):
            loc = next((x for x in loc if isinstance(x, dict)), {})
        if not isinstance(loc, dict):
            loc = {}
        # `address` est tantôt un `PostalAddress`, tantôt une simple chaîne : sans ce
        # test, une fiche sur dix fait tomber tout le lot sur un `.get` d'une `str`.
        adr = loc.get("address")
        adr = adr if isinstance(adr, dict) else {}
        geo = loc.get("geo")
        geo = geo if isinstance(geo, dict) else {}
        venue = clean(loc.get("name") if isinstance(loc, dict) else "")
        city = clean(adr.get("addressLocality"))
        lat, lng = geo.get("latitude"), geo.get("longitude")
        if not (venue and city and lat and lng):
            review.append((url, name, "salle, ville ou coordonnées manquantes"))
            continue
        if clean(adr.get("addressCountry")) not in ("FR", "France", ""):
            review.append((url, name, f'pays hors France ({adr.get("addressCountry")})'))
            continue

        # L'horaire ne se devine pas : voir l'en-tête du module.
        m = re.search(r"T(\d{2}):(\d{2})", start)
        if not m:
            review.append((url, name, "horaire non publié par la source"))
            continue
        time_s = f"{m.group(1)}:{m.group(2)}"

        performers = node.get("performer") or []
        lineup = [clean(p.get("name")) for p in performers if isinstance(p, dict) and p.get("name")]
        # Aucun filtrage sur « le performer est dans le titre » : c'était le cas d'un
        # premier essai, et il retirait exactement la tête d'affiche, puisqu'une soirée
        # de club s'appelle le plus souvent du nom de qui y joue (« Bob Sinclar au
        # Warehouse »). Il visait l'organisateur crédité en `performer` (« Les concerts
        # Candlelight »), qu'il n'attrapait pas, le test étant dans l'autre sens ; ces
        # fiches-là sortent par `OFF_TOPIC`, ce qui est leur vraie raison de sortir.
        lineup = [a for a in lineup if a]

        body = clean(node.get("description"))[:1500]
        # Le hors-périmètre se cherche partout, y compris dans le texte : « Candlelight »
        # et « hommage à » sont des refus quel que soit l'endroit où ils apparaissent.
        _, off = classify(" ".join([name, body, venue, " ".join(lineup)]))
        if off:
            review.append((url, name, f"hors périmètre : {', '.join(off[:3])}"))
            continue

        # La preuve du genre, elle, doit être **forte**. Deux sources l'une ou l'autre :
        # un nom de style dans le titre ou la salle, ou un artiste que le projet a déjà
        # attribué (`ARTIST_STYLES`, 1 511 noms). Un mot-clé pêché dans le texte
        # éditorial de jds ne compte pas : c'est ce qui a fait passer French 79, groupe
        # de synthwave, pour de la techno sur le premier essai.
        # L'artiste passe **avant** le titre : c'est la seule source qui sache vraiment
        # ce qui va être joué, et le projet l'a déjà construite avec la règle « le style
        # d'un artiste est attribué, pas déduit ». Kölsch rend House et Techno, Vortek's
        # rend Hardcore, Hard Techno et Acid Techno, là où le titre ne dit rien.
        from_artists: list[str] = []
        for a in lineup:
            for g in STYLES.get(slugify(a), []):
                if g not in from_artists:
                    from_artists.append(g)
        # Le titre seulement, jamais la salle : un club qui s'appelle « Warehouse » ne
        # dit rien de ce qu'on y joue ce soir-là.
        from_title, _ = classify(name)
        genres = from_artists or from_title
        if not genres:
            weak, _ = classify(f"{body} {venue}")
            why = ("genre seulement mentionné dans la description de la source"
                   if weak else
                   "aucun genre reconnu" + ("" if is_electro(f"{name} {body}") else ", et rien qui dise que c'est électronique"))
            review.append((url, name, why))
            continue

        price, cur = lowest_price(node.get("offers"))
        desc, desc_en = make_desc(name, venue, city, date, end, time_s, lineup, price, cur)
        ev = {
            "title": tidy_title(name),
            "type": guess_type(name, venue, bool(end and end != date)),
            "genres": genres[:4],
            "city": city,
            "country": "France",
            "lat": round(float(lat), 5),
            "lng": round(float(lng), 5),
            "date": date,
            "time": time_s,
            "price": price if price else 0,
            "currency": cur,
            "venue": venue,
            "trending": False,
            "lineup": lineup,
            "desc": desc,
            "descEn": desc_en,
            "sources": [url],
        }
        if end and end != date:
            ev["endDate"] = end
        region = departement(adr.get("postalCode"))
        if region:
            ev["region"] = region
        if not price:
            # `merge.py` lit `note` pour poser `priceNote` : un tarif absent est « inconnu »,
            # jamais « gratuit ». Un 0 affiché « GRATUIT » est le pire faux d'un annuaire.
            ev["note"] = "tarif non communiqué par la source"
        ticket = real_ticket_url(node.get("offers"))
        if ticket:
            ev["ticketUrl"] = ticket
        kept.append(ev)
        if i % 25 == 0:
            print(f"  … {i}/{len(links)}")

    return kept, review


def name_tour_dates(events: list[dict]) -> int:
    """Les dates d'une tournée prennent le nom de leur salle.

    La clé de dédup de `merge.py` est **(titre normalisé, année)** : elle regroupe les
    éditions d'un festival, ce qui est ce qu'on veut, mais elle voit aussi les neuf dates
    de la tournée de Fakear comme un seul événement, et huit seraient rejetées en
    doublon. Le catalogue résout déjà ce cas en mettant la salle dans le titre (« NTO
    Live au Bikini », « PACT à La Laiterie ») : c'est la convention à appliquer, pas la
    clé à assouplir, puisque c'est elle qui empêche « Sónar 2026 » et « Sónar » de faire
    deux pages.

    On ne renomme que ce qui se répète : une date unique garde son titre, qui est le nom
    sous lequel on la cherche.
    """
    seen: dict[str, int] = {}
    for e in events:
        key = fold(e["title"])
        seen[key] = seen.get(key, 0) + 1
    renamed = 0
    for e in events:
        if seen[fold(e["title"])] > 1:
            # « Tournée » et « Tour » dans le titre décrivent la série, pas la date : la
            # salle les remplace avantageusement.
            base = re.sub(r"\s*[-–]\s*(tourn[ée]e|tour|dream tour)\s*$", "", e["title"], flags=re.I)
            e["title"] = f"{base} à {e['venue']}"
            renamed += 1
    return renamed


def write_review(review: list[tuple[str, str, str]]) -> None:
    """Ce qui n'a pas été publié, avec l'URL et la raison.

    Un collecteur qui jette en silence est un collecteur qu'on ne peut pas corriger : ce
    fichier est la moitié utile du script. Un festival écarté faute d'horaire s'ajoute à
    la main en trois minutes, encore faut-il savoir qu'il existe.
    """
    by_reason: dict[str, list[tuple[str, str]]] = {}
    for url, name, why in review:
        by_reason.setdefault(why.split(" :")[0], []).append((name, url))
    lines = [
        "# jds.fr, ce que le collecteur n'a pas publié",
        "",
        f"> Écrit par `python3 .research/sources/jds.py` le {dt.date.today().isoformat()}.",
        "> Chaque ligne est une fiche que le script a refusé de produire seul. Rien ici",
        "> n'est une erreur : ce sont les cas où publier demanderait de deviner. Les",
        "> reprendre à la main est rapide, l'URL est à côté.",
        "",
    ]
    for why, rows in sorted(by_reason.items(), key=lambda kv: -len(kv[1])):
        lines.append(f"## {why} ({len(rows)})")
        lines.append("")
        for name, url in sorted(rows):
            lines.append(f"- [{name}]({url})")
        lines.append("")
    open(REVIEW, "w", encoding="utf-8").write("\n".join(lines))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, help="ne lire que les N premières fiches")
    ap.add_argument("--no-cache", action="store_true", help="ignorer le cache disque")
    args = ap.parse_args()

    kept, review = harvest(args.limit, not args.no_cache)
    tours = name_tour_dates(kept)
    kept.sort(key=lambda e: e["date"])
    open(OUT, "w", encoding="utf-8").write(json.dumps(kept, ensure_ascii=False, indent=2) + "\n")
    write_review(review)

    print()
    print(f"{len(kept)} fiche(s) écrite(s) dans {os.path.relpath(OUT, RESEARCH)}")
    if tours:
        print(f"  dont {tours} date(s) de tournée renommée(s) avec leur salle (clé de dédup)")
    print(f"{len(review)} fiche(s) laissée(s) à la relecture dans {os.path.relpath(REVIEW, RESEARCH)}")
    print()
    print("Rien n'est publié : la suite est la même que pour un lot d'agent,")
    print("  python3 .research/merge.py --dry   puis sans --dry")
    print("  python3 .research/audit.py && npm run build")


if __name__ == "__main__":
    main()
