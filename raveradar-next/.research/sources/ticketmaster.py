#!/usr/bin/env python3
"""
Collecteur Ticketmaster, via l'API Discovery.

**Pourquoi une clé, et pourquoi il n'y a pas de contournement.** Tous les domaines
`ticketmaster.*` répondent **403 depuis le conteneur**, y compris leur `robots.txt` :
`.fr`, `.de`, `.co.uk`, `.it`, vérifié à nouveau. Il n'existe donc aucune route de
lecture directe, contrairement à Skiddle dont les pages de salle restent ouvertes. Live
Nation, du même groupe, répond bien 200 mais ne rend côté serveur que le titre, la date
et la salle : ni coordonnées, ni tarif, ni line-up, c'est-à-dire pas de quoi produire une
fiche que nos propres règles accepteraient (« coordonnées introuvables, on n'ajoute pas
l'événement »).

L'API Discovery, elle, est joignable et documentée. Elle demande une clé gratuite sur
`developer.ticketmaster.com`, qu'un script ne peut pas obtenir. Posez
`TICKETMASTER_API_KEY` et le collecteur tourne ; sans elle il le dit et sort sans rien
écrire, plutôt que de laisser croire à une collecte vide.

**Ce que cette source apporte que les deux autres n'ont pas.** Sa réponse porte le
classement de la billetterie elle-même : `classifications[].segment` (« Music »),
`genre` (« Dance/Electronic ») et `subGenre` (« Techno », « House », « Trance »). C'est
une attribution faite par celui qui vend le billet, donc une preuve bien plus solide
qu'un mot-clé pêché dans un texte, et elle sert de filtre de périmètre en même temps :
un segment « Sports » ou un genre « Rock » ne franchit pas la porte.

Elle apporte aussi les marchés où le catalogue est mince : l'Allemagne et l'Italie, où
le relevé de `.research/ticketmaster.md` avait justement trouvé le gisement.

**Le lien de billetterie n'a pas besoin de tag.** `ticketmaster.*` et `livenation.*` sont
dans `AFFILIATE_HOSTS` : le tag Impact les réécrit en lien affilié, et `rel="sponsored"`
se déduit du domaine. Contrairement à Skiddle, on ne colle rien dans l'URL.

    TICKETMASTER_API_KEY=… python3 .research/sources/ticketmaster.py
    python3 .research/sources/ticketmaster.py --fixture .research/sources/tm-fixture.json

Le mode `--fixture` rejoue la mise au format sur une réponse enregistrée, sans réseau :
c'est ce qui permet de vérifier le mapping quand on n'a pas de clé sous la main.
"""
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    RESEARCH, artist_styles, classify, clean, fold, genres_for, guess_type,
    is_electro, make_desc, name_tour_dates, slugify, tidy_title, weekly_residencies,
    write_review,
)
from departements import departement  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
OUT = os.path.join(RESEARCH, "events-ticketmaster-auto.json")
REVIEW = os.path.join(HERE, "ticketmaster-a-relire.md")

API = "https://app.ticketmaster.com/discovery/v2/events.json"
TIMEOUT = 30
# L'API annonce un plafond de 5 000 requêtes par jour et compte les siennes dans des
# en-têtes `Rate-Limit-*`. On reste très en dessous, mais on s'impose quand même un
# rythme : une source qu'on ne bouscule pas est une source qui reste ouverte.
DELAY = 0.4
# `size * page` doit rester sous 1 000 (documenté) : au-delà l'API refuse la page.
PAGE_SIZE = 200
MAX_PAGES = 4

# Les pays où le catalogue a quelque chose à gagner. Le relevé de `.research/ticketmaster.md`
# situe le gisement réel en Italie, en Allemagne et à Manchester ; la France y est pour le
# marché prioritaire, les autres pour les festivals que Ticketmaster distribue.
COUNTRIES = {
    "FR": "France", "DE": "Germany", "IT": "Italy", "GB": "UK", "IE": "Ireland",
    "NL": "Netherlands", "BE": "Belgium", "ES": "Spain", "PT": "Portugal",
    "AT": "Austria", "CH": "Switzerland", "SE": "Sweden", "DK": "Denmark",
    "NO": "Norway", "FI": "Finland", "PL": "Poland", "CZ": "Czech Republic",
}

# Le vocabulaire de Ticketmaster vers les onze cases du site. Ce qui n'y figure pas n'est
# **pas** traduit au plausible : « Electronica », « Downtempo » ou « Ambient » ne sont
# aucune de nos onze catégories, et leur en coller une serait exactement l'invention que
# la règle de contenu interdit. Ces fiches retombent alors sur l'artiste ou sur le titre,
# et à défaut partent en relecture.
SUBGENRE_MAP = {
    "house": "House", "deep house": "House", "tech house": "House",
    "progressive house": "House", "disco house": "House", "funky house": "House",
    "techno": "Techno", "minimal techno": "Techno", "detroit techno": "Techno",
    "hard techno": "Hard Techno", "schranz": "Hard Techno",
    "acid": "Acid Techno", "acid house": "Acid Techno",
    "trance": "Trance", "psy trance": "Psytrance", "psytrance": "Psytrance",
    "goa trance": "Psytrance",
    "drum & bass": "Drum & Bass", "drum and bass": "Drum & Bass",
    "jungle": "Drum & Bass", "liquid": "Drum & Bass",
    "hardstyle": "Hardstyle", "hard dance": "Hardstyle",
    "hardcore": "Hardcore", "gabber": "Hardcore",
    "edm": "EDM", "dance": "EDM", "club dance": "EDM", "electro": "EDM",
}


def fetch(url: str, use_cache: bool = True) -> str:
    key = re.sub(r"[^a-zA-Z0-9]+", "-", url.split("apikey=")[0])[-110:]
    path = os.path.join(CACHE, "tm-" + key + ".json")
    if use_cache and os.path.exists(path):
        return open(path, encoding="utf-8", errors="replace").read()
    r = subprocess.run(["curl", "-s", "--max-time", str(TIMEOUT), url],
                       capture_output=True, text=True)
    body = r.stdout or ""
    os.makedirs(CACHE, exist_ok=True)
    open(path, "w", encoding="utf-8").write(body)
    time.sleep(DELAY)
    return body


def search(key: str, cc: str, page: int, use_cache: bool) -> dict:
    q = urllib.parse.urlencode({
        "apikey": key, "countryCode": cc,
        # Le classement de Ticketmaster fait à la fois le filtre de périmètre et
        # l'attribution de genre : on ne demande que ce segment.
        "classificationName": "Dance/Electronic",
        "startDateTime": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "size": PAGE_SIZE, "page": page, "sort": "date,asc",
    })
    try:
        return json.loads(fetch(f"{API}?{q}", use_cache) or "{}")
    except json.JSONDecodeError:
        return {}


def collect(key: str, use_cache: bool) -> tuple[list[dict], list[str]]:
    """Les événements bruts de l'API, pays par pays."""
    rows: list[dict] = []
    notes: list[str] = []
    for cc in COUNTRIES:
        for page in range(MAX_PAGES):
            data = search(key, cc, page, use_cache)
            fault = data.get("fault")
            if fault:
                notes.append(f"{cc} : {fault.get('faultstring')}")
                break
            got = ((data.get("_embedded") or {}).get("events")) or []
            rows += [dict(e, _cc=cc) for e in got if isinstance(e, dict)]
            info = data.get("page") or {}
            if page + 1 >= int(info.get("totalPages") or 0):
                break
        print(f"  {cc} : {sum(1 for r in rows if r.get('_cc') == cc)} date(s)")
    return rows, notes


# ------------------------------------------------------------------ mapping

def event_genres(ev: dict) -> tuple[list[str], bool]:
    """Les genres tirés du classement de Ticketmaster, et si l'événement est du ressort.

    `segment` doit être « Music » et `genre` contenir « Dance » ou « Electronic » : c'est
    l'opérateur du billet qui le dit, ce qui vaut mieux que n'importe quelle heuristique
    sur le titre. Le `subGenre` donne ensuite le style, quand il correspond à l'une de nos
    onze cases ; sinon on ne traduit rien, et l'appelant retombe sur l'artiste.
    """
    on_topic = False
    out: list[str] = []
    for c in ev.get("classifications") or []:
        if not isinstance(c, dict):
            continue
        seg = fold((c.get("segment") or {}).get("name") or "")
        gen = fold((c.get("genre") or {}).get("name") or "")
        sub = fold((c.get("subGenre") or {}).get("name") or "")
        if seg == "music" and ("dance" in gen or "electronic" in gen):
            on_topic = True
        for label in (sub, gen):
            m = SUBGENRE_MAP.get(label)
            if m and m not in out:
                out.append(m)
    return out, on_topic


def best_image(ev: dict) -> str:
    """L'image la plus grande, en préférant un format portrait.

    `imageThumb()` recadre en 4:5 : une image paysage s'y fait couper, une affiche
    portrait y survit. Ticketmaster en rend une dizaine par événement, dans plusieurs
    ratios, on prend donc la plus haute résolution du meilleur ratio disponible.
    """
    best, score = "", (-1, -1.0)
    for im in ev.get("images") or []:
        if not isinstance(im, dict) or not im.get("url"):
            continue
        w, h = float(im.get("width") or 0), float(im.get("height") or 0)
        if not w or not h:
            continue
        # L'orientation prime sur la taille, et ce n'est pas une préférence esthétique :
        # une pondération par la surface laissait un paysage de 2048x1152 battre un
        # portrait de 640x960, alors que c'est justement le paysage que le crop 4:5
        # d'`imageThumb()` coupe. On choisit donc le meilleur portrait s'il en existe un,
        # et seulement à défaut le plus grand paysage.
        s = (1 if h >= w else 0, w * h)
        if s > score:
            best, score = im["url"], s
    return best


def to_rows(raw: list[dict], styles: dict[str, list[str]]) -> tuple[list[dict], list[tuple[str, str, str]]]:
    today = dt.date.today().isoformat()
    kept: list[dict] = []
    review: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    for ev in raw:
        name = tidy_title(clean(ev.get("name")))
        url = clean(ev.get("url"))
        if not name or not url:
            continue

        dates = ev.get("dates") or {}
        start = dates.get("start") or {}
        date = clean(start.get("localDate"))
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date or "") or date < today:
            review.append((url, name, f"date absente ou passée ({date or 'vide'})"))
            continue
        # `timeTBA` / `noSpecificTime` disent explicitement que l'heure n'est pas fixée :
        # on ne la devine pas, même règle que sur les deux autres sources.
        t = clean(start.get("localTime"))
        if not re.match(r"\d{2}:\d{2}", t or ""):
            review.append((url, name, "horaire non publié par la source"))
            continue
        time_s = t[:5]

        status = fold((dates.get("status") or {}).get("code") or "")
        if status in ("cancelled", "canceled", "postponed"):
            review.append((url, name, f"annoncé {status} par la billetterie"))
            continue

        emb = (ev.get("_embedded") or {})
        venues = [v for v in (emb.get("venues") or []) if isinstance(v, dict)]
        if not venues:
            review.append((url, name, "aucune salle rattachée"))
            continue
        v = venues[0]
        venue = clean(v.get("name"))
        city = clean((v.get("city") or {}).get("name"))
        loc = v.get("location") or {}
        try:
            lat, lng = round(float(loc.get("latitude")), 5), round(float(loc.get("longitude")), 5)
        except (TypeError, ValueError):
            review.append((url, name, "coordonnées manquantes"))
            continue
        if not (venue and city):
            review.append((url, name, "salle ou ville manquante"))
            continue

        key = (slugify(city), slugify(venue), date)
        if key in seen:
            continue
        seen.add(key)

        lineup = [clean(a.get("name")) for a in (emb.get("attractions") or [])
                  if isinstance(a, dict) and a.get("name")]
        # Une « attraction » qui porte le nom de l'événement est la marque, pas un artiste.
        lineup = [a for a in lineup if a and fold(a) != fold(name)]

        tm_genres, on_topic = event_genres(ev)
        blob = " ".join([name, clean(ev.get("info") or ev.get("pleaseNote")), venue, " ".join(lineup)])
        _, off = classify(blob)
        if off:
            review.append((url, name, f"hors périmètre : {', '.join(off[:3])}"))
            continue
        if not on_topic:
            review.append((url, name, "classé hors Dance/Electronic par la billetterie"))
            continue

        # L'artiste attribué reste prioritaire : c'est la règle du projet, et elle est
        # plus fine qu'un sous-genre de billetterie (« Dance » couvre tout). Le classement
        # Ticketmaster prend la suite, le titre en dernier.
        genres = genres_for(name, lineup, styles) or tm_genres
        if not genres:
            review.append((url, name, "aucun genre reconnu" + ("" if is_electro(blob) else ", et rien qui dise que c'est électronique")))
            continue

        end = clean(((dates.get("end") or {}).get("localDate")))
        multi = bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", end or "")
                     and (dt.date.fromisoformat(end) - dt.date.fromisoformat(date)).days >= 2)

        price, cur = None, "€"
        sym = {"EUR": "€", "GBP": "£", "USD": "$", "CHF": "CHF", "SEK": "kr",
               "DKK": "kr", "NOK": "kr", "PLN": "zł", "CZK": "Kč"}
        for pr in ev.get("priceRanges") or []:
            if not isinstance(pr, dict):
                continue
            cur = sym.get(str(pr.get("currency") or ""), cur)
            try:
                p = float(pr.get("min"))
            except (TypeError, ValueError):
                continue
            if p > 0 and (price is None or p < price):
                price = p

        country = COUNTRIES.get(ev.get("_cc"), "France")
        desc, desc_en = make_desc(name, venue, city, date, end if multi else None,
                                  time_s, lineup, price, cur)
        row = {
            "title": name, "type": guess_type(name, venue, multi), "genres": genres[:4],
            "city": city, "country": country, "lat": lat, "lng": lng,
            "date": date, "time": time_s, "price": price or 0, "currency": cur,
            "venue": venue, "trending": False, "lineup": lineup,
            "desc": desc, "descEn": desc_en, "sources": [url],
            # Pas de tag à coller : `ticketmaster.*` et `livenation.*` sont dans
            # `AFFILIATE_HOSTS`, le tag Impact réécrit le lien et `rel="sponsored"` se
            # déduit du domaine.
            "ticketUrl": url,
        }
        if multi:
            row["endDate"] = end
        if country == "France":
            region = departement(clean(v.get("postalCode")))
            if region:
                row["region"] = region
        if not price:
            row["note"] = "tarif non communiqué par la source"
        # `_poster` est ignoré par `merge.py` (comme `_subgenres`, `_source`, `_geocode`)
        # et sert la relecture : le visuel de l'organisateur ne rentre pas au catalogue
        # par le lot, il passe par `.research/photos/`, mais le perdre en route
        # obligerait à rouvrir la fiche pour le retrouver.
        img = best_image(ev)
        if img:
            row["_poster"] = img
        kept.append(row)
    return kept, review


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fixture", help="rejouer la mise au format sur une réponse enregistrée")
    ap.add_argument("--check", action="store_true",
                    help="vérifier que la clé est acceptée, sans rien collecter")
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()

    styles = artist_styles()
    print(f"{len(styles)} artiste(s) déjà attribué(s) dans lib/artist-genres.ts.")

    if args.fixture:
        data = json.load(open(args.fixture, encoding="utf-8"))
        raw = [dict(e, _cc=e.get("_cc", "FR"))
               for e in ((data.get("_embedded") or {}).get("events") or [])]
        print(f"Mode fixture : {len(raw)} date(s) lue(s) dans {args.fixture}.")
    else:
        key = os.environ.get("TICKETMASTER_API_KEY", "").strip()
        if not key:
            # Sortir en 0 et le dire : le workflow ne doit pas échouer parce qu'une
            # source facultative n'est pas configurée, et un lot vide écrit en silence
            # laisserait croire que Ticketmaster n'a rien à offrir.
            print()
            print("TICKETMASTER_API_KEY n'est pas posée, rien n'a été collecté.")
            print("  Les domaines ticketmaster.* répondent 403 depuis un serveur, il n'y a")
            print("  donc pas de route de repli : c'est l'API Discovery ou rien.")
            print("  Clé gratuite : https://developer.ticketmaster.com/ (Discovery API v2),")
            print("  puis TICKETMASTER_API_KEY en variable d'environnement ou en secret GitHub.")
            return
        if args.check:
            # Une requête minimale, uniquement pour voir si la clé passe. Les deux
            # refus de l'API sont distincts et se corrigent différemment :
            # `FailedToResolveAPIKey` veut dire qu'aucune clé n'est arrivée (variable
            # mal nommée, secret absent), `InvalidApiKey` qu'une clé est arrivée mais
            # n'est pas la bonne (Consumer Secret collé à la place du Consumer Key,
            # espace en trop). Un « échec » sans plus serait inutilisable.
            probe = json.loads(fetch(f"{API}?{urllib.parse.urlencode({'apikey': key, 'countryCode': 'FR', 'size': 1})}", False) or "{}")
            fault = probe.get("fault") or {}
            if fault:
                print(f"  ✗ refusée : {fault.get('faultstring')}")
                print(f"    code : {(fault.get('detail') or {}).get('errorcode')}")
                if "Invalid" in str(fault.get("faultstring")):
                    print("    Une clé est bien arrivée mais n'est pas reconnue :")
                    print("    c'est le **Consumer Key** qu'il faut, pas le Consumer Secret.")
                else:
                    print("    Aucune clé n'est arrivée : vérifier le nom de la variable.")
                sys.exit(1)
            total = (probe.get("page") or {}).get("totalElements")
            print(f"  ✓ clé acceptée. {total} date(s) visible(s) en France, tous genres confondus.")
            return
        print("Route API Discovery.")
        raw, notes = collect(key, not args.no_cache)
        for n in notes:
            print(f"  ! {n}")
        print(f"{len(raw)} date(s) lue(s).")

    # Le mode fixture n'écrit **jamais** dans `.research/events-*.json` : c'est le motif
    # que `merge.py` ramasse, et les fiches de la fixture sont inventées de toutes pièces.
    # Un lot de test oublié là et fusionné publierait des événements qui n'existent pas,
    # ce qui est le pire défaut imaginable pour cet annuaire. Il sort donc dans
    # `sources/`, hors de portée du glob.
    out = os.path.join(HERE, "fixture-out.json") if args.fixture else OUT

    kept, review = to_rows(raw, styles)
    tours = name_tour_dates(kept)
    for e in weekly_residencies(kept):
        review.append((e["sources"][0], e["title"], "soirée récurrente, la date distinctive se choisit à la main"))
    kept.sort(key=lambda e: e["date"])
    open(out, "w", encoding="utf-8").write(json.dumps(kept, ensure_ascii=False, indent=2) + "\n")
    write_review(REVIEW, "Ticketmaster", review)

    print()
    print(f"{len(kept)} fiche(s) écrite(s) dans {os.path.relpath(out, RESEARCH)}")
    if tours:
        print(f"  dont {tours} date(s) de tournée renommée(s) avec leur salle (clé de dédup)")
    print(f"{len(review)} fiche(s) laissée(s) à la relecture dans {os.path.relpath(REVIEW, RESEARCH)}")
    print()
    print("Rien n'est publié : la suite est celle de tout lot,")
    print("  python3 .research/merge.py --dry   puis sans --dry")
    print("  python3 .research/audit.py && npm run build")


if __name__ == "__main__":
    main()
