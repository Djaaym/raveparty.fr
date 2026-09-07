#!/usr/bin/env python3
"""
Collecteur Skiddle : l'API si une clé est posée, sinon les pages de salle.

**Pourquoi Skiddle.** 421 des 529 dates britanniques du catalogue viennent d'un export
Skiddle d'août 2026, figé depuis. Un guichet ne vaut que rafraîchi : les soirées de club
se publient à quatre ou huit semaines, donc un export de trois mois est déjà une photo
d'un calendrier qui a changé. Skiddle est aussi le deuxième réseau d'affiliation branché
(`?sktag=15816`), donc chaque date retrouvée chez lui est une date qui peut rapporter.

## Deux routes, et pourquoi les deux existent

**L'API** (`api_key`, documentée sur github.com/Skiddle/web-api/wiki) est la bonne route :
filtres `country`, `eventcode`, `minDate`, pagination, et `description=1` qui rend les
genres et les artistes. Elle demande une **clé gratuite sur inscription**
(`skiddle.com/api/join.php`), qu'un script ne peut pas obtenir. Posez `SKIDDLE_API_KEY`
et c'est elle qui sert.

**Les pages de salle** sont la route sans clé, et elle est déjà éprouvée : le `robots.txt`
de Skiddle liste explicitement `ClaudeBot` avec un `Crawl-delay: 2`, respecté ici, et
**une page de salle porte le JSON-LD de toutes ses dates**, une quarantaine en une seule
requête. C'est de loin le point d'entrée le plus rentable, et c'est ce qui rend ce script
utile aujourd'hui plutôt que le jour où quelqu'un remplira un formulaire.

Les deux routes se rejoignent sur une **forme intermédiaire commune**, si bien que le
classement, la mise au format et le rapport sont partagés (`common.py`) et que la route
API n'ajoute que sa façon d'aller chercher.

## Ce que le script refuse

Les mêmes trois refus que le collecteur jds, pour la même raison, publier demanderait de
deviner : hors périmètre (`OFF_TOPIC`), pas de preuve forte de genre, pas d'horaire. Plus
deux qui sont propres à Skiddle :

**On ignore la `endDate` de Skiddle.** Elle porte l'heure de fermeture, pas un dernier
jour : une soirée du 18 septembre 22 h à 3 h du matin y finit « le 19 », et un « All Day
Rave » de midi à midi mesure 24 h. Reprise telle quelle, `isPast()` garderait la soirée
du samedi « à venir » tout le dimanche, exactement ce que les trois portes de mise en
avant existent pour empêcher. Un festival multi-jours se reconnaît autrement, à un écart
d'au moins deux jours.

**Le tarif est le plus bas encore en vente.** Les offres sont des paliers (« First
Release », « TIER 1 ») avec chacun son `availability` : retenir le plus bas sans regarder
publierait un palier `SoldOut` que personne ne peut plus payer, ce que la campagne des
tarifs avait déjà payé sur Index: HorsegiirL.

    python3 .research/sources/skiddle.py               # route disponible
    SKIDDLE_API_KEY=… python3 .research/sources/skiddle.py
    python3 .research/sources/skiddle.py --limit 10    # essai court
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
    APP, RESEARCH, artist_styles, classify, clean, fold, genres_for, guess_type,
    is_electro, make_desc, name_tour_dates, slugify, tidy_title, weekly_residencies,
    write_review,
)

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
OUT = os.path.join(RESEARCH, "events-skiddle-auto.json")
REVIEW = os.path.join(HERE, "skiddle-a-relire.md")

API = "https://www.skiddle.com/api/v1/events/search/"
VENUE_SITEMAP = "https://d1plawd8huk6hh.cloudfront.net/sitemaps/venues1.xml"
# Le `robots.txt` de Skiddle nomme ClaudeBot et lui impose 2 secondes. On les respecte,
# et on s'annonce sous ce nom parce que c'est celui qui est autorisé : un user-agent de
# navigateur reçoit un 202 vide du pare-feu applicatif, ce qui n'est pas une façon
# honnête de contourner une règle.
UA = "ClaudeBot/1.0 (+https://www.raveparty.fr)"
DELAY = 2.0
TIMEOUT = 30
# Les pays où Skiddle a autre chose que des bars de vacances. Hors UK et Irlande, son
# catalogue de soirées ne recoupe pas le nôtre (relevé dans `.research/skiddle.md`).
COUNTRIES = {"GB": "UK", "IE": "Ireland"}


def fetch(url: str, use_cache: bool = True) -> str:
    key = re.sub(r"[^a-zA-Z0-9]+", "-", url)[-120:]
    path = os.path.join(CACHE, key + ".txt")
    if use_cache and os.path.exists(path):
        return open(path, encoding="utf-8", errors="replace").read()
    r = subprocess.run(["curl", "-s", "--max-time", str(TIMEOUT), "-A", UA, url],
                       capture_output=True, text=True)
    body = r.stdout or ""
    os.makedirs(CACHE, exist_ok=True)
    open(path, "w", encoding="utf-8").write(body)
    time.sleep(DELAY)
    return body


# ------------------------------------------------------------- forme commune

def norm_event(*, name: str, url: str, start: str, end: str, venue: str, city: str,
               country: str, lat, lng, image: str, desc: str,
               offers: list[dict], performers: list[str]) -> dict:
    """La forme intermédiaire, identique quelle que soit la route.

    Elle existe pour que tout ce qui décide (genre, périmètre, format) soit écrit une
    fois : la route API et la route JSON-LD ne diffèrent alors que par la façon de
    remplir ces champs, ce qui est la seule chose qui les distingue vraiment.
    """
    return {"name": name, "url": url, "start": start, "end": end, "venue": venue,
            "city": city, "country": country, "lat": lat, "lng": lng, "image": image,
            "desc": desc, "offers": offers, "performers": performers}


def in_stock_price(offers: list[dict]) -> tuple[float | None, str, bool]:
    """Le plus bas tarif **encore en vente**, sa devise, et s'il reste quelque chose.

    Les offres Skiddle sont des paliers successifs, chacun avec son `availability`.
    Retenir le plus bas sans regarder publierait un palier épuisé : c'est l'erreur payée
    sur Index: HorsegiirL, un dernier palier à 53 € que personne ne pouvait plus payer.
    Le troisième retour dit si **une seule** offre est encore ouverte : une soirée dont
    tout est `SoldOut` reste une information, mais son tarif n'en est plus une.
    """
    sym = {"GBP": "£", "EUR": "€", "USD": "$"}
    best: float | None = None
    cur = "£"
    open_any = False
    for o in offers:
        if not isinstance(o, dict):
            continue
        avail = str(o.get("availability") or "")
        sold = "soldout" in fold(avail).replace(" ", "")
        cur = sym.get(str(o.get("priceCurrency") or ""), cur)
        try:
            p = float(str(o.get("price") or o.get("lowPrice") or "").replace(",", "."))
        except ValueError:
            continue
        if sold:
            continue
        open_any = True
        # Un billet à 0 n'est pas une entrée libre chez Skiddle, c'est une liste
        # d'invités : on ne retient que les montants non nuls, et l'absence devient
        # « tarif inconnu », jamais « gratuit ».
        if p > 0 and (best is None or p < best):
            best = p
    return best, cur, open_any


# --------------------------------------------------------------- route API

def api_search(key: str, country: str, code: str, page: int, use_cache: bool) -> dict:
    q = urllib.parse.urlencode({
        "api_key": key, "country": country, "eventcode": code,
        "minDate": dt.date.today().isoformat(), "limit": 100, "offset": page * 100,
        # `description=1` est ce qui fait rendre les genres et les artistes : sans lui la
        # réponse ne porte que le squelette, et il n'y aurait aucune preuve de genre.
        "description": 1, "ticketsavailable": 1,
    })
    try:
        return json.loads(fetch(f"{API}?{q}", use_cache) or "{}")
    except json.JSONDecodeError:
        return {}


def from_api(key: str, use_cache: bool) -> tuple[list[dict], list[str]]:
    """Les événements vus par l'API, dans la forme commune.

    La réponse est enveloppée (`{error, errormessage, totalcount, results}`) et le
    schéma d'un résultat n'est pas publié : on lit donc chaque champ **défensivement**,
    en essayant les noms plausibles, et on **signale** ce qu'on n'a pas su lire au lieu
    de rendre une fiche amputée en silence. C'est la seule attitude tenable sur un
    contrat qu'on n'a pas pu voir tourner.
    """
    out: list[dict] = []
    notes: list[str] = []
    for cc in COUNTRIES:
        for code in ("CLUB", "FEST"):
            for page in range(0, 20):
                data = api_search(key, cc, code, page, use_cache)
                if data.get("error"):
                    notes.append(f"{cc}/{code} : {data.get('errormessage')} (code {data.get('errorcode')})")
                    break
                rows = data.get("results") or []
                if not rows:
                    break
                for r in rows:
                    g = lambda *ks: next((r[k] for k in ks if isinstance(r, dict) and r.get(k)), None)  # noqa: E731
                    venue = r.get("venue") or {}
                    out.append(norm_event(
                        name=clean(g("eventname", "name", "title")),
                        url=clean(g("link", "url")),
                        start=clean(g("startdate", "openingtimes", "date")),
                        end=clean(g("enddate")),
                        venue=clean(venue.get("name") if isinstance(venue, dict) else venue),
                        city=clean(venue.get("town") or venue.get("city") if isinstance(venue, dict) else ""),
                        country=COUNTRIES[cc],
                        lat=(venue.get("latitude") if isinstance(venue, dict) else None),
                        lng=(venue.get("longitude") if isinstance(venue, dict) else None),
                        image=clean(g("largeimageurl", "imageurl")),
                        desc=clean(g("description")),
                        offers=[{"price": g("entryprice", "minprice"), "priceCurrency": "GBP",
                                 "availability": "InStock"}],
                        performers=[clean(a.get("name")) for a in (r.get("artists") or [])
                                    if isinstance(a, dict) and a.get("name")],
                    ))
                if len(rows) < 100:
                    break
    return out, notes


# ------------------------------------------------------- route pages de salle

def catalogue_venues() -> set[tuple[str, str]]:
    """Les salles UK et irlandaises que le catalogue programme déjà, en (ville, salle).

    On ne parcourt pas les 14 536 pages de salle du sitemap : on rafraîchit celles qu'on
    référence, ce qui est le besoin (un guichet figé depuis août) et ce qui borne le
    crawl à une soixantaine de requêtes.
    """
    out: set[tuple[str, str]] = set()
    src = open(os.path.join(APP, "lib", "data.ts"), encoding="utf-8").read()
    for line in src.split("\n"):
        if not re.match(r"\s*\{ id: \d+,", line):
            continue
        m = re.search(r'country: "([^"]+)"', line)
        if not m or m.group(1) not in ("UK", "Ireland"):
            continue
        v = re.search(r'venue: "((?:[^"\\]|\\.)*)"', line)
        c = re.search(r'city: "([^"]+)"', line)
        if v and c:
            out.add((slugify(c.group(1)), slugify(v.group(1))))
    return out


def venue_pages(use_cache: bool) -> list[str]:
    """Les URLs de salle du sitemap qui correspondent à une salle du catalogue."""
    xml = fetch(VENUE_SITEMAP, use_cache)
    want = catalogue_venues()
    urls: list[str] = []
    for u in re.findall(r"<loc>([^<]+)</loc>", xml):
        m = re.match(r"https://www\.skiddle\.com/whats-on/([^/]+)/([^/]+)/?$", u)
        if m and (slugify(m.group(1)), slugify(m.group(2))) in want:
            urls.append(u)
    return urls


def from_venues(use_cache: bool, limit: int | None) -> list[dict]:
    """Les événements lus dans le JSON-LD des pages de salle."""
    pages = venue_pages(use_cache)
    if limit:
        pages = pages[:limit]
    print(f"{len(pages)} page(s) de salle du catalogue retrouvée(s) sur Skiddle.")
    out: list[dict] = []
    for i, u in enumerate(pages, 1):
        page = fetch(u, use_cache)
        for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S):
            try:
                data = json.loads(block)
            except Exception:
                continue
            for node in data if isinstance(data, list) else [data]:
                if not isinstance(node, dict) or node.get("@type") != "EntertainmentBusiness":
                    continue
                for e in node.get("event") or []:
                    if not isinstance(e, dict):
                        continue
                    loc = e.get("location") or {}
                    adr = loc.get("address") if isinstance(loc, dict) else {}
                    adr = adr if isinstance(adr, dict) else {}
                    geo = loc.get("geo") if isinstance(loc, dict) else {}
                    geo = geo if isinstance(geo, dict) else {}
                    cc = adr.get("addressCountry")
                    cc = cc.get("name") if isinstance(cc, dict) else cc
                    out.append(norm_event(
                        name=clean(e.get("name")), url=clean(e.get("url")),
                        start=clean(e.get("startDate")), end=clean(e.get("endDate")),
                        venue=clean(loc.get("name") if isinstance(loc, dict) else "") or clean(node.get("name")),
                        city=clean(adr.get("addressLocality")),
                        country=COUNTRIES.get(str(cc).strip().upper(), "UK"),
                        lat=geo.get("latitude"), lng=geo.get("longitude"),
                        image=clean(e.get("image")), desc=clean(e.get("description")),
                        offers=[o for o in (e.get("offers") or []) if isinstance(o, dict)],
                        performers=[clean(p.get("name")) for p in (e.get("performer") or [])
                                    if isinstance(p, dict) and p.get("name")],
                    ))
        if i % 10 == 0:
            print(f"  … {i}/{len(pages)}")
    return out


# ------------------------------------------------------------------ pipeline

def to_catalogue(rows: list[dict], styles: dict[str, list[str]]) -> tuple[list[dict], list[tuple[str, str, str]]]:
    today = dt.date.today().isoformat()
    kept: list[dict] = []
    review: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    for r in rows:
        name, url = tidy_title(r["name"]), r["url"]
        if not name or not url:
            continue
        date = r["start"][:10]
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date) or date < today:
            review.append((url, name, f"date absente ou passée ({date or 'vide'})"))
            continue
        m = re.search(r"T(\d{2}):(\d{2})", r["start"])
        if not m:
            review.append((url, name, "horaire non publié par la source"))
            continue
        time_s = f"{m.group(1)}:{m.group(2)}"

        venue, city = r["venue"], r["city"]
        try:
            lat, lng = round(float(r["lat"]), 5), round(float(r["lng"]), 5)
        except (TypeError, ValueError):
            review.append((url, name, "coordonnées manquantes"))
            continue
        if not (venue and city):
            review.append((url, name, "salle ou ville manquante"))
            continue

        # Skiddle publie parfois deux fois la même soirée (« NIGHTVISION Presents: Funk
        # Tribu » et « Nightvision presents Funk Tribu // Glasgow ») : la clé (ville,
        # salle, jour) les réunit, comme `booked` dans merge.py.
        key = (slugify(city), slugify(venue), date)
        if key in seen:
            continue
        seen.add(key)

        lineup = [a for a in r["performers"] if a]
        _, off = classify(" ".join([name, r["desc"][:1200], venue, " ".join(lineup)]))
        if off:
            review.append((url, name, f"hors périmètre : {', '.join(off[:3])}"))
            continue
        genres = genres_for(name, lineup, styles)
        if not genres:
            weak, _ = classify(r["desc"])
            review.append((url, name,
                           "genre seulement mentionné dans la description de la source" if weak
                           else "aucun genre reconnu" + ("" if is_electro(f"{name} {r['desc']}") else ", et rien qui dise que c'est électronique")))
            continue

        # La `endDate` de Skiddle est une heure de fermeture, pas un dernier jour : voir
        # l'en-tête. Un vrai multi-jours se reconnaît à un écart d'au moins deux jours.
        end = r["end"][:10] if re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["end"][:10] or "") else ""
        multi = bool(end and (dt.date.fromisoformat(end) - dt.date.fromisoformat(date)).days >= 2)

        price, cur, on_sale = in_stock_price(r["offers"])
        desc, desc_en = make_desc(name, venue, city, date, end if multi else None, time_s, lineup, price, cur)
        ev = {
            "title": name, "type": guess_type(name, venue, multi), "genres": genres[:4],
            "city": city, "country": r["country"], "lat": lat, "lng": lng,
            "date": date, "time": time_s, "price": price or 0, "currency": cur,
            "venue": venue, "trending": False, "lineup": lineup,
            "desc": desc, "descEn": desc_en, "sources": [url],
        }
        if multi:
            ev["endDate"] = end
        # Le tag d'affiliation se pose en clair dans l'URL, c'est tout le contrat Skiddle.
        # Mais **seulement si quelque chose est encore en vente** : une soirée dont tous
        # les paliers sont `SoldOut` garde sa fiche, c'est un événement réel, et perd son
        # lien billetterie. La règle est celle du relevé d'affiliation, « un lien qui
        # promet la soirée et ne vend rien vaut moins que pas de lien du tout », et
        # `ticketUrl()` retombe alors sur son défaut.
        if on_sale:
            ev["ticketUrl"] = url + ("&" if "?" in url else "?") + "sktag=15816"
        if not price:
            # Les deux libellés portent « non communiqué », et ce n'est pas un hasard :
            # c'est le motif que `merge.py` cherche pour poser `priceNote: "unknown"`.
            # Sans lui, `price: 0` s'affiche « GRATUIT », ce qui est le pire faux qu'un
            # annuaire puisse publier, et le premier essai écrivait « plus aucun billet
            # en vente », qui ne déclenchait rien.
            ev["note"] = ("tarif non communiqué par la source" if on_sale
                          else "tarif non communiqué, plus aucun billet en vente")
        kept.append(ev)
    return kept, review


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, help="ne lire que les N premières pages de salle")
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()
    use_cache = not args.no_cache

    styles = artist_styles()
    print(f"{len(styles)} artiste(s) déjà attribué(s) dans lib/artist-genres.ts.")

    key = os.environ.get("SKIDDLE_API_KEY", "").strip()
    if key:
        print("Route API (SKIDDLE_API_KEY posée).")
        rows, notes = from_api(key, use_cache)
        for n in notes:
            print(f"  ! {n}")
        if not rows:
            print("  L'API n'a rien rendu, repli sur les pages de salle.")
            rows = from_venues(use_cache, args.limit)
    else:
        print("Route pages de salle (pas de SKIDDLE_API_KEY).")
        print("  Une clé gratuite s'obtient sur https://www.skiddle.com/api/join.php ;")
        print("  posée, elle donne les filtres pays, type et date, et la pagination.")
        rows = from_venues(use_cache, args.limit)

    print(f"{len(rows)} date(s) lue(s).")
    kept, review = to_catalogue(rows, styles)
    tours = name_tour_dates(kept)
    for e in weekly_residencies(kept):
        review.append((e["sources"][0], e["title"], "soirée récurrente, la date distinctive se choisit à la main"))
    kept.sort(key=lambda e: e["date"])
    open(OUT, "w", encoding="utf-8").write(json.dumps(kept, ensure_ascii=False, indent=2) + "\n")
    write_review(REVIEW, "Skiddle", review)

    print()
    print(f"{len(kept)} fiche(s) écrite(s) dans {os.path.relpath(OUT, RESEARCH)}")
    if tours:
        print(f"  dont {tours} date(s) de tournée renommée(s) avec leur salle (clé de dédup)")
    print(f"{len(review)} fiche(s) laissée(s) à la relecture dans {os.path.relpath(REVIEW, RESEARCH)}")
    print()
    print("Rien n'est publié : la suite est celle de tout lot,")
    print("  python3 .research/merge.py --dry   puis sans --dry")
    print("  python3 .research/audit.py && npm run build")


if __name__ == "__main__":
    main()
