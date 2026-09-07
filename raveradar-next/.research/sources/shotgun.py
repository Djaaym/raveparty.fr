#!/usr/bin/env python3
"""
Collecteur Shotgun, par les pages de ville et le JSON-LD des fiches.

**Pourquoi celle-là, et pourquoi elle est légitime.** Le `robots.txt` de `shotgun.live`
tient en trois lignes, `User-Agent: * / Allow: /` plus un sitemap : aucun agent nommé,
aucune zone fermée, et surtout **aucune réserve de droits**, ni article 4 de la
directive 2019/790, ni en-tête `Content-Signal`. C'est exactement ce qui manquait à DICE
et à Resident Advisor, tous deux en `ClaudeBot / Disallow: /` avec réserve expresse, et
c'est pourquoi ces deux-là ne seront pas branchés (le relevé est dans
`docs/source-auto.md`). Vérifié à nouveau avant d'écrire ce fichier.

**Ce que cette source apporte que les trois autres n'ont pas.** Shotgun est le guichet de
la scène électro française : là où jds.fr donne l'agenda des salles déclarées et
Ticketmaster les grosses jauges, Shotgun porte la soirée de club vendue à cent
personnes, celle qui n'existe nulle part ailleurs sous forme structurée. Sur Paris seule,
son agenda annonce plus de deux mille dates sur soixante-huit jours, quand tout le
catalogue européen en compte mille quatre cents. C'est le rééquilibrage France que
l'arrivée de Skiddle avait rendu nécessaire.

**La collecte se fait en deux temps, et c'est ce qui la rend supportable.**

1. *La page de ville*, une requête par ville. `?page=N` y est **cumulatif** et non
   paginant : `?page=40` rend les quarante premières pages d'un coup, donc l'agenda
   entier d'une ville tient dans un seul appel. Chaque carte porte déjà le titre, la
   salle, le jour, l'heure locale, le prix d'appel **et les étiquettes de genre de
   Shotgun**. C'est assez pour décider, sans ouvrir une seule fiche, si l'événement est
   de notre ressort.
2. *La fiche*, une requête par événement retenu, uniquement pour ce que la carte n'a
   pas : les **coordonnées** (sans elles on n'ajoute pas l'événement, règle de contenu),
   l'adresse complète, le line-up et l'heure de fin. Son `application/ld+json` est un
   `MusicEvent` complet.

**Les étiquettes de genre sont le classement de la billetterie elle-même**, donc la même
preuve que `classifications[]` chez Ticketmaster, et bien plus solide qu'un mot-clé pêché
dans un texte. Elles servent des deux côtés : elles attribuent le style quand il
correspond à l'une de nos onze cases, et elles **excluent** quand elles disent « Salsa,
Reggaeton, Bouyon ». Une carte sans étiquette retombe sur l'artiste puis sur le titre,
et à défaut part en relecture, comme partout ailleurs.

**Trois pièges propres à cette source, tous payés à la lecture.**

- *Le JSON-LD est en UTC, le catalogue stocke l'heure locale.* Une soirée parisienne
  annoncée `2026-09-07T21:59:00.000Z` commence à 23 h 59, pas à 21 h 59, et l'écart passe
  à deux heures l'été. On convertit donc par `zoneinfo`, d'après le pays de l'adresse.
- *`endDate` est l'heure de fermeture, jamais la fin d'un festival.* C'est le défaut déjà
  payé sur Skiddle, ici sous une autre forme : le champ existe et il est faux. Une soirée
  de club qui ferme à 4 h porte un `endDate` au lendemain, et `isPast()` la garderait « à
  venir » toute la journée du dimanche. La règle qui tranche les deux cas d'un coup est
  la **journée qui commence à 6 h** : le dernier jour est celui de la fin moins six
  heures, donc une fermeture à l'aube revient à la nuit qui l'a commencée, et le festival
  du 11 au 13 septembre à 2 h du matin finit bien le 12.
- *Un tarif d'appel n'est pas forcément une entrée.* Les offres portent des billets
  « -12 ans » à 0 €, des vestiaires, des navettes, des places de parking et des paliers
  déjà épuisés. On ne retient que ce qui est **en vente** (`InStock` ou
  `LimitedAvailability`), **non nul**, et dont le libellé ne dit pas autre chose qu'une
  entrée. C'est la leçon du « à partir de 8 € » de Skiddle, qui était un casier.

**Le lien de billetterie est un lien nu.** `shotgun.live` n'est dans aucun réseau
d'affiliation branché ici : pas de tag à coller comme sur Skiddle, pas de domaine dans
`AFFILIATE_HOSTS` comme Ticketmaster. `outboundRel()` lui posera `nofollow` et rien
d'autre, ce qui est exact : un lien qui ne rapporte rien ne se déclare pas sponsorisé.

    python3 .research/sources/shotgun.py                 # tout, avec cache
    python3 .research/sources/shotgun.py --city paris    # une ville
    python3 .research/sources/shotgun.py --no-cache      # ce que fait le workflow

Ce que le collecteur n'a pas publié, et pourquoi, est écrit dans
`.research/sources/shotgun-a-relire.md`. **Y compris ce que les plafonds ont laissé de
côté** : une troncature silencieuse laisserait croire qu'une ville n'a rien à offrir.
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
import urllib.parse
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    RESEARCH, artist_styles, city_regions, classify, clean, drop_edition_year, fold,
    fr_place_case, genres_for, guess_type, is_electro, make_desc, name_tour_dates,
    slugify, tidy_title, weekly_residencies, write_review,
)
from departements import departement  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
OUT = os.path.join(RESEARCH, "events-shotgun-auto.json")
REVIEW = os.path.join(HERE, "shotgun-a-relire.md")

BASE = "https://shotgun.live"
# Le `robots.txt` n'impose aucun `Crawl-delay`. On s'en donne un quand même, et on
# s'annonce : une source qu'on ne bouscule pas est une source qui reste ouverte, et
# `ClaudeBot/1.0` est le nom sous lequel ce dépôt lit déjà Skiddle.
UA = "ClaudeBot/1.0 (+https://raveparty.fr)"
TIMEOUT = 120
DELAY = 0.3

# `?page=N` est cumulatif : une seule requête rend les N premières pages. Quarante
# couvre l'agenda entier de presque toutes les villes ; Paris déborde, et la troncature
# est **écrite dans le rapport** au lieu d'être avalée.
PAGES = 40
# Le budget de requêtes de fiches, par ville. La collecte complète de Paris demanderait
# à elle seule plus de mille appels, soit une demi-heure pour une ville : le plafond est
# ce qui garde une exécution hebdomadaire sous vingt minutes. Ce qu'il écarte est listé.
PER_CITY = 60
# Au-delà, une date n'est plus annoncée mais supposée : « en août, les dates FR de
# janvier-mars suivant sont majoritairement non annoncées » (CLAUDE.md).
MONTHS = 8

# ------------------------------------------------------------------ géographie

# Les villes de Shotgun qui sont en Europe. Le slug ne sert **qu'à la découverte** : la
# ville et le pays publiés viennent de l'adresse de la fiche, pas de cette table, ce qui
# permet d'y laisser des libellés qui sont des régions (« aix-marseille »,
# « cote-d-azur », « pau-tarbes ») sans jamais les écrire au catalogue.
#
# Les Açores, Madère et les Canaries sont volontairement absentes : le fuseau y est
# calculé d'après le pays (voir `TZ`), et il n'y est pas celui du continent. Une heure de
# décalage sur une heure de début est une donnée fausse, pas une approximation.
CITIES = [
    # France
    "paris", "lyon", "aix-marseille", "bordeaux", "lille", "toulouse", "nantes",
    "rennes", "strasbourg", "montpellier", "cote-d-azur", "grenoble", "rouen", "reims",
    "dijon", "angers", "tours", "caen", "brest", "le-havre", "clermont-ferrand",
    "metz", "nancy", "mulhouse", "besancon", "amiens", "orleans", "poitiers",
    "limoges", "saint-etienne", "valence", "chambery", "annecy", "perpignan",
    "pau-tarbes", "la-rochelle", "biarritz", "bourges", "troyes", "vannes",
    "saint-brieuc", "le-mans", "le-touquet", "arles-avignon", "corse",
    # Benelux, Allemagne, Suisse
    "brussels", "liege", "amsterdam", "berlin", "cologne", "frankfurt", "hamburg",
    "geneva", "lausanne", "zurich", "sion", "neuchatel", "luxembourg",
    # Îles Britanniques
    "london", "manchester", "bristol", "dublin",
    # Péninsule ibérique, Méditerranée, Nord et Est
    "barcelona", "madrid", "alicante", "malaga", "mallorca", "galicia", "ibiza",
    "lisbon", "porto", "alentejo", "algarve", "center-pt", "north-pt",
    "copenhagen", "warsaw", "thessaloniki", "crete", "malta",
]

# Les entrées de `CITIES` qui décrivent une **zone** et non une ville. Shotgun s'en sert
# aussi comme `addressLocality` quand l'organisateur n'a rempli aucune adresse, et
# « Aix-Marseille » se retrouve alors publié comme nom de ville. C'est la règle
# « un `venue` qui décrit un ensemble de lieux n'est pas une salle » (`isMultiVenueLabel`),
# appliquée cette fois à la ville : une zone n'a pas d'agenda, elle n'a pas de page.
NOT_A_CITY = {
    "aix-marseille", "cote-d-azur", "pau-tarbes", "arles-avignon", "evian-thonon",
    "center-pt", "north-pt", "galicia", "alentejo", "algarve", "corse", "crete",
    "mallorca", "madeira", "azores",
}

# Le code ISO de l'adresse vers le libellé du catalogue. **C'est une clé, pas un
# affichage** : `COUNTRY_FR` et `COUNTRY_FLAG` sont indexés dessus et `/pays/{slug}` en
# dérive, donc « United Kingdom » au lieu de « UK » fabriquerait une seconde page pays en
# concurrence avec la première. Un pays absent d'ici n'entre pas au catalogue.
COUNTRY = {
    "FR": "France", "BE": "Belgium", "NL": "Netherlands", "DE": "Germany",
    "GB": "UK", "IE": "Ireland", "ES": "Spain", "PT": "Portugal",
    "CH": "Switzerland", "LU": "Luxembourg", "DK": "Denmark", "PL": "Poland",
    "GR": "Greece", "MT": "Malta", "IT": "Italy", "AT": "Austria",
    "CZ": "Czech Republic", "SE": "Sweden", "NO": "Norway", "FI": "Finland",
    "HR": "Croatia", "HU": "Hungary", "RO": "Romania", "SI": "Slovenia",
    "RS": "Serbia", "BG": "Bulgaria", "SK": "Slovakia", "EE": "Estonia",
    "LV": "Latvia", "LT": "Lithuania", "IS": "Iceland", "AL": "Albania",
    "ME": "Montenegro", "MK": "North Macedonia", "BA": "Bosnia and Herzegovina",
    "CY": "Cyprus", "GE": "Georgia",
}

TZ = {
    "FR": "Europe/Paris", "BE": "Europe/Brussels", "NL": "Europe/Amsterdam",
    "DE": "Europe/Berlin", "GB": "Europe/London", "IE": "Europe/Dublin",
    "ES": "Europe/Madrid", "PT": "Europe/Lisbon", "CH": "Europe/Zurich",
    "LU": "Europe/Luxembourg", "DK": "Europe/Copenhagen", "PL": "Europe/Warsaw",
    "GR": "Europe/Athens", "MT": "Europe/Malta", "IT": "Europe/Rome",
    "AT": "Europe/Vienna", "CZ": "Europe/Prague", "SE": "Europe/Stockholm",
    "NO": "Europe/Oslo", "FI": "Europe/Helsinki", "HR": "Europe/Zagreb",
    "HU": "Europe/Budapest", "RO": "Europe/Bucharest", "SI": "Europe/Ljubljana",
    "RS": "Europe/Belgrade", "BG": "Europe/Sofia", "SK": "Europe/Bratislava",
    "EE": "Europe/Tallinn", "LV": "Europe/Riga", "LT": "Europe/Vilnius",
    "IS": "Atlantic/Reykjavik", "AL": "Europe/Tirane", "ME": "Europe/Podgorica",
    "MK": "Europe/Skopje", "BA": "Europe/Sarajevo", "CY": "Asia/Nicosia",
    "GE": "Asia/Tbilisi",
}

# La devise que le pays emploie réellement. Elle sert de **garde-fou**, pas de
# conversion : un anniversaire londonien est ressorti à « 58 $ » parce que son
# organisateur avait laissé la devise sur USD dans le formulaire de Shotgun. Publier ça,
# c'est annoncer un montant que personne ne paiera à l'entrée, et la règle du projet est
# justement de n'afficher que celui-là. Une offre libellée dans une devise étrangère au
# pays est donc écartée comme un vestiaire l'est : la fiche reste, le tarif part en
# « non communiqué ».
CURRENCY_OF = {
    "FR": "EUR", "BE": "EUR", "NL": "EUR", "DE": "EUR", "ES": "EUR", "PT": "EUR",
    "LU": "EUR", "IE": "EUR", "IT": "EUR", "AT": "EUR", "GR": "EUR", "MT": "EUR",
    "SI": "EUR", "SK": "EUR", "EE": "EUR", "LV": "EUR", "LT": "EUR", "FI": "EUR",
    "CY": "EUR", "HR": "EUR", "ME": "EUR",
    "GB": "GBP", "CH": "CHF", "DK": "DKK", "PL": "PLN", "CZ": "CZK", "SE": "SEK",
    "NO": "NOK", "IS": "ISK", "HU": "HUF", "RO": "RON", "RS": "RSD", "BG": "BGN",
    "AL": "ALL", "MK": "MKD", "BA": "BAM", "GE": "GEL",
}

# On stocke le symbole local et on ne convertit pas : le montant affiché doit être celui
# qu'on paie à l'entrée (CLAUDE.md). `merge.py` normalise ce qu'il ne connaît pas.
SYMBOL = {
    "EUR": "€", "GBP": "£", "USD": "$", "CHF": "CHF", "SEK": "kr", "DKK": "kr",
    "NOK": "kr", "ISK": "kr", "PLN": "zł", "CZK": "Kč", "HUF": "Ft", "RON": "lei",
    "RSD": "RSD", "BGN": "лв", "HRK": "€", "GEL": "GEL",
}

# ------------------------------------------------------ le vocabulaire de Shotgun

# Les étiquettes de Shotgun vers les onze cases du site. Relevé sur l'agenda parisien
# complet, cent trente et un libellés distincts, pas une liste devinée.
#
# **Ce qui n'a pas d'équivalent n'est pas traduit au plausible.** « Electro »,
# « Dubstep », « Uk Garage », « Breakbeat », « Industrial » ou « Ambient » ne sont aucune
# de nos onze catégories, et leur en coller une serait l'invention que la règle de
# contenu interdit ; ils vivent plus bas, en preuve de périmètre. Même chose pour
# « Dance », « Club » et « Bounce », trop larges pour désigner quoi que ce soit.
PILL = {
    "techno": "Techno", "minimal techno": "Techno", "detroit techno": "Techno",
    "deep techno": "Techno", "dub techno": "Techno", "hypnotic techno": "Techno",
    "german techno": "Techno",
    "hard techno": "Hard Techno", "hard groove": "Hard Techno", "schranz": "Hard Techno",
    "acid techno": "Acid Techno", "acidcore": "Acid Techno",
    "hardstyle": "Hardstyle", "rawstyle": "Hardstyle", "hard dance": "Hardstyle",
    "hard bounce": "Hardstyle",
    "hardcore": "Hardcore", "gabber": "Hardcore", "uptempo": "Hardcore",
    "frenchcore": "Hardcore", "terrorcore": "Hardcore",
    "house": "House", "tech house": "House", "deep house": "House",
    "disco house": "House", "minimal house": "House", "afro house": "House",
    "arabic house": "House", "progressive house": "House", "latin house": "House",
    "electro house": "House", "chicago house": "House", "tribal house": "House",
    "bass house": "House", "acid house": "House", "deep tech": "House",
    "trance": "Trance", "hard trance": "Trance", "progressive trance": "Trance",
    "psytrance": "Psytrance", "progressive psytrance": "Psytrance",
    "goa trance": "Psytrance",
    "drum & bass": "Drum & Bass", "drum and bass": "Drum & Bass",
    "jungle": "Drum & Bass", "neurofunk": "Drum & Bass",
    "edm": "EDM", "big room": "EDM",
}
# « Melodic House & Techno » est le seul libellé qui en désigne deux : il est traité à
# part pour ne pas avoir à mettre des listes en valeur de `PILL` pour un cas unique.
PILL_PAIRS = {"melodic house & techno": ["House", "Techno"]}

# Électronique sans être l'une de nos onze cases. Ces étiquettes ne décident d'aucun
# genre, elles disent seulement « c'est bien pour nous » : l'attribution repart alors sur
# l'artiste, puis sur le titre.
PILL_SCOPE = {
    "electro", "electronica", "club", "bass", "indie dance", "dance", "dubstep",
    "breakbeat", "uk garage", "garage", "ghettotech", "footwork", "jersey club",
    "ebm", "industrial", "minimal synth", "dark wave", "ambient", "downtempo",
    "experimental", "vaporwave", "eurodance", "raw", "bounce", "nu-disco",
    "italo disco", "synthpop", "new wave", "trip hop", "idm",
}

# ------------------------------------------------------------------ réseau

def fetch(url: str, use_cache: bool = True) -> str:
    key = re.sub(r"[^a-zA-Z0-9]+", "-", url.replace(BASE, ""))[-110:]
    path = os.path.join(CACHE, "sg-" + key + ".html")
    if use_cache and os.path.exists(path):
        return open(path, encoding="utf-8", errors="replace").read()
    r = subprocess.run(["curl", "-s", "--max-time", str(TIMEOUT), "-A", UA, url],
                       capture_output=True, text=True)
    body = r.stdout or ""
    os.makedirs(CACHE, exist_ok=True)
    open(path, "w", encoding="utf-8").write(body)
    time.sleep(DELAY)
    return body


# ------------------------------------------------------------------ la page de ville

CARD = re.compile(r'<a data-slot="tracked-link" href="(?=/en/(?:events|festivals)/)')
STATUS = {"Free", "–", "-", "Sold out", "Waiting list", "Pre-registration"}
MONTHS_EN = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def card_date(token: str, today: dt.date) -> str | None:
    """« Mon, Sep 7 » vers une date ISO, l'année déduite par progression.

    La carte ne porte pas l'année : Shotgun n'affiche que le jour et le mois. On la
    déduit en prenant la première occurrence à venir, ce qui est juste parce que
    l'agenda est rendu dans l'ordre chronologique et ne remonte jamais au passé. C'est la
    règle « quand une source ne donne pas l'année, la déduire » de CLAUDE.md, dans sa
    forme la plus sûre : ici la seule chose à trancher est un passage de décembre à
    janvier.
    """
    m = re.search(r"([A-Z][a-z]{2}),?\s+(\d{1,2})$", token.strip())
    if not m:
        m = re.search(r"(\d{1,2})\s+([A-Z][a-z]{2})$", token.strip())
        if not m:
            return None
        day, mon = int(m.group(1)), MONTHS_EN.get(m.group(2).lower())
    else:
        mon, day = MONTHS_EN.get(m.group(1).lower()), int(m.group(2))
    if not mon:
        return None
    for year in (today.year, today.year + 1):
        try:
            d = dt.date(year, mon, day)
        except ValueError:
            continue
        if d >= today:
            return d.isoformat()
    return None


def parse_city(body: str, today: dt.date) -> list[dict]:
    """Les cartes d'une page de ville : href, titre, salle, jour, heure, prix, genres."""
    out: list[dict] = []
    for chunk in CARD.split(body)[1:]:
        end = chunk.find("</a>")
        if end < 0:
            continue
        href = chunk[:chunk.find('"')]
        toks = [html.unescape(t).strip()
                for t in re.sub(r"<[^>]+>", "\x00", chunk[:end]).split("\x00")]
        # Le premier jeton est la fin de l'attribut `href`, les séparateurs « | » et les
        # « + 2 » d'un débordement d'étiquettes ne portent rien.
        toks = [t for t in toks[1:] if t and t != "|" and t != "+" and not t.isdigit()]
        if len(toks) < 4:
            continue
        title, venue = toks[0], toks[1]
        date = card_date(toks[2], today)
        rest = toks[3:]
        time_s = ""
        if rest and re.match(r"^\d{1,2}:\d{2}\s*(AM|PM)?$", rest[0], re.I):
            time_s, rest = rest[0], rest[1:]
        # Le créneau du prix ne porte pas toujours un prix : sur l'agenda parisien
        # complet il dit « Free » 361 fois, « – » 91, « Waiting list » 63,
        # « Pre-registration » 12 et « Sold out » 9. Les laisser passer les versait dans
        # les étiquettes de genre, où « Free » devenait une preuve *contraire* et
        # écartait huit soirées qui étaient bien pour nous. Le montant lui-même ne sert
        # à rien ici, il est relu dans les offres de la fiche : on ne fait que consommer
        # le jeton.
        if rest and (re.match(r"^[€£$]\s?[\d.,]+$", rest[0]) or rest[0] in STATUS):
            rest = rest[1:]
        out.append({
            "href": href, "title": title, "venue": venue, "date": date,
            "time": time_s, "pills": rest,
            "is_festival": href.startswith("/en/festivals/"),
        })
    return out


def pill_genres(pills: list[str]) -> tuple[list[str], bool, list[str]]:
    """Ce que les étiquettes de Shotgun disent : nos genres, le périmètre, le hors-sujet.

    Trois réponses et non deux. « Techno » attribue et prouve ; « Electro » prouve sans
    attribuer ; « Reggaeton » est une preuve **contraire**, et c'est la plus utile des
    trois, puisqu'elle écarte sans avoir à ouvrir la fiche.
    """
    genres: list[str] = []
    scope = False
    off: list[str] = []
    for p in pills:
        f = fold(p)
        got = PILL_PAIRS.get(f) or ([PILL[f]] if f in PILL else [])
        if got:
            scope = True
            for g in got:
                if g not in genres:
                    genres.append(g)
        elif f in PILL_SCOPE:
            scope = True
        else:
            off.append(p)
    return genres, scope, off


# ------------------------------------------------------------------ la fiche

def jsonld(body: str) -> dict:
    for b in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>',
                        body, re.S):
        try:
            d = json.loads(html.unescape(b))
        except json.JSONDecodeError:
            continue
        if isinstance(d, dict) and d.get("@type") in ("MusicEvent", "Event", "Festival"):
            return d
    return {}


def local(iso: str | None, tz: str) -> dt.datetime | None:
    """Un instant UTC du JSON-LD rendu dans le fuseau du lieu.

    Le catalogue stocke l'heure locale : publier `21:59` pour une soirée parisienne qui
    ouvre à 23 h 59 serait faux de deux heures, et faux d'une seule en hiver, ce qui est
    pire, un décalage constant se repère.
    """
    if not iso:
        return None
    try:
        return dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(ZoneInfo(tz))
    except (ValueError, KeyError):
        return None


# La journée d'un agenda de nuit ne commence pas à minuit : une soirée qui ferme à 4 h
# appartient à la nuit qui l'a commencée. Six heures est le point où l'on cesse de
# rencontrer des fermetures de club, et la borne est **inclusive** : la fermeture la plus
# courante de tout l'agenda est exactement 6 h, et une soustraction de six heures la
# renvoyait au jour suivant à minuit pile, donc du mauvais côté.
#
# Six heures ne suffisaient pourtant pas : le Rex Club ferme à 7 h, et une soirée du
# mercredi ressortait en festival de deux jours. La borne est donc à **10 h**, et ce
# n'est pas un réglage au jugé : entre 6 h et 10 h, rien ne *commence*, ni un club ni un
# festival, donc tout ce qui finit là est la queue de la nuit précédente. Se tromper de
# ce côté-là est aussi le moins cher : un jour de trop garde une soirée finie en avant,
# un jour de moins ne fait que retirer une archive un peu tôt.
NIGHT_END = dt.time(10, 0)


def last_day(start: dt.datetime, end: dt.datetime | None) -> str | None:
    """Le dernier jour réel, ou `None` quand l'événement tient dans une seule nuit.

    `endDate` est réservé aux vraies dates multi-jours (CLAUDE.md) : c'est `isPast()` qui
    le lit, donc une soirée du samedi soir marquée jusqu'au dimanche resterait « à
    venir » tout le dimanche, exactement ce que les trois portes de mise en avant
    existent pour empêcher.

    Vérifié sur les deux cas qui comptent : une soirée du 7 qui ferme le 8 à 6 h rend
    `None`, un festival du 11 qui ferme le 13 à 2 h rend le 12.
    """
    if not end or end <= start:
        return None
    d = end.date() if end.time() > NIGHT_END else end.date() - dt.timedelta(days=1)
    return d.isoformat() if d > start.date() else None


# Ce qui se vend sur une billetterie sans être une entrée. Le « à partir de 8 € » de
# Skiddle était un casier ; ici ce sont des vestiaires, des navettes et des billets
# enfant. Cherché en **mots entiers**, pour la raison habituelle (« bus » est dans
# « business », « don » dans « London »).
#
# **Deux listes et non une, et c'est le premier essai qui l'a montré.** Une liste unique
# contenant « drink » écartait « Entrée avant minuit + 1 drink », qui est le tarif
# d'entrée normal de la moitié des clubs parisiens : les deux fiches testées sont
# ressorties à zéro euro alors que leur carte annonçait 10 €. Un supplément **cité à
# côté d'une entrée** ne change pas la nature de l'offre ; ce qui la change, c'est de ne
# pas être une entrée du tout (un vestiaire) ou de ne pas être *cette* entrée-là (un
# tarif enfant). D'où la règle : `NEVER` gagne toujours, `UNLESS_ADMISSION` ne coupe que
# si rien dans le libellé ne dit « entrée ».
NEVER = [
    "vestiaire", "cloakroom", "casier", "locker", "parking", "navette", "shuttle",
    "bus", "camping", "caravane", "tente", "donation", "adhesion", "adhésion",
    "membership", "goodies", "merch", "tshirt", "t-shirt", "assurance", "insurance",
    "-12ans", "-12 ans", "enfant", "child", "kids", "moins de 12",
]
UNLESS_ADMISSION = ["verre", "glass", "gobelet", "repas", "meal", "boisson", "drink"]
ADMISSION = [
    "entree", "entrée", "entry", "entrance", "billet", "ticket", "pass", "admission",
    "place", "prevente", "prévente", "presale", "tarif", "early", "late", "normal",
]
ON_SALE = ("instock", "limitedavailability", "presale", "preorder")


def has(text: str, words: list[str]) -> bool:
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)


def entry_price(offers, cc: str) -> tuple[float | None, str, bool]:
    """Le plus bas tarif d'entrée réellement en vente, sa devise, et s'il reste des places.

    Trois façons de se tromper, toutes déjà payées ailleurs : retenir un palier
    **épuisé** que personne ne peut plus payer, recopier un montant qui n'est pas une
    entrée, ou prendre un zéro pour une entrée libre. Un billet à 0 sur cette
    billetterie est une guest list ou un tarif enfant, pas la gratuité : sans tarif
    retenu, on écrit `note` et `merge.py` en fait `priceNote`, jamais « GRATUIT ».
    """
    if isinstance(offers, dict):
        offers = [offers]
    want = CURRENCY_OF.get(cc)
    price, cur, sale = None, "", False
    for o in offers or []:
        if not isinstance(o, dict):
            continue
        avail = fold(str(o.get("availability") or "")).rsplit("/", 1)[-1]
        if avail not in ON_SALE:
            continue
        sale = True
        name = fold(str(o.get("name") or ""))
        if has(name, NEVER):
            continue
        if has(name, UNLESS_ADMISSION) and not has(name, ADMISSION):
            continue
        iso = str(o.get("priceCurrency") or "").upper()
        if want and iso and iso != want:
            continue
        try:
            p = float(o.get("price"))
        except (TypeError, ValueError):
            continue
        if p <= 0:
            continue
        if price is None or p < price:
            price, cur = p, iso or want or ""
    return price, SYMBOL.get(cur, cur or "€"), sale


def is_address(label: str, street: str, postal: str, city: str) -> bool:
    """Vrai quand ce qu'on nous donne pour nom de salle est en fait son adresse.

    Shotgun laisse l'organisateur remplir le champ librement, et « 10 Rue de Lappe,
    75011 Paris, France » y arrive tel quel. Publier ça, c'est ouvrir
    `/lieux/10-rue-de-lappe-75011-paris-france` : le `/lieux/300-lieux-dans-amsterdam`
    que la règle interdit, arrivé par une porte de plus. Une adresse n'a ni agenda ni
    habitués, elle n'a pas de page.

    Trois signatures, aucune n'étant une supposition : le libellé **est** l'adresse, il
    contient le code postal, ou il commence par un numéro de voie suivi d'un mot de
    voirie. « Studio 56 » et « Level 3 » n'en portent aucune, c'est pourquoi le numéro
    seul ne suffit pas.
    """
    f = fold(label)
    if not f or f == fold(city):
        return True
    if street and f == fold(street):
        return True
    if postal and fold(postal) in f:
        return True
    return bool(re.match(r"^\d+\s*(bis|ter)?\s*,?\s*"
                         r"(rue|av|avenue|bd|boulevard|place|quai|chemin|route|impasse|"
                         r"allee|allée|cours|street|st|road|rd|lane|str|strasse|straat|"
                         r"weg|via|calle|carrer|plaza)\b", f))


def poster(url: str) -> str:
    """Le visuel de l'organisateur sans la boîte 1200x630 que Shotgun lui impose.

    Le JSON-LD sert l'image en `c_limit,w_1200,h_630`, un cadre paysage : une affiche
    portrait y arrive rognée, et c'est précisément ce que le crop 4:5 d'`imageThumb()`
    couperait ensuite une seconde fois. Retirer la hauteur du gabarit Cloudinary rend le
    fichier dans son propre format, sans appel supplémentaire.
    """
    return re.sub(r"/upload/c_limit,w_\d+,h_\d+/", "/upload/c_limit,w_1400/", url or "")


# ------------------------------------------------------------------ collecte

def collect(cities: list[str], pages: int, per_city: int, months: int,
            use_cache: bool) -> tuple[list[dict], list[tuple[str, str, str]]]:
    today = dt.date.today()
    horizon = (today + dt.timedelta(days=31 * months)).isoformat()
    review: list[tuple[str, str, str]] = []
    picked: list[dict] = []
    seen: set[str] = set()

    for city in cities:
        url = f"{BASE}/en/cities/{urllib.parse.quote(city)}?page={pages}"
        cards = parse_city(fetch(url, use_cache), today)
        if not cards:
            print(f"  {city} : rien (page vide ou ville inconnue)")
            continue

        # Ce qui est de notre ressort, décidé sur la seule carte : pas une requête de
        # fiche dépensée sur une soirée reggaeton.
        keep: list[dict] = []
        for c in cards:
            full = BASE + c["href"]
            if c["href"] in seen:
                continue
            if not c["date"] or c["date"] > horizon:
                continue
            _, off_topic = classify(f"{c['title']} {' '.join(c['pills'])}")
            if off_topic:
                review.append((full, c["title"], f"hors périmètre : {', '.join(off_topic[:3])}"))
                seen.add(c["href"])
                continue
            genres, scope, off = pill_genres(c["pills"])
            if not scope and off:
                review.append((full, c["title"],
                               f"classé {', '.join(off[:3])} par la billetterie"))
                seen.add(c["href"])
                continue
            c["_pill_genres"], c["_url"] = genres, full
            keep.append(c)

        # Les festivals d'abord, le reste par date. Le plafond doit couper la longue
        # traîne des soirées de semaine, pas la page qui capitalise : un festival est
        # rare (56 sur 2 039 à Paris) et c'est lui qui porte la requête à volume.
        keep.sort(key=lambda c: (not c["is_festival"], c["date"]))
        for c in keep:
            seen.add(c["href"])
        chosen, left = keep[:per_city], keep[per_city:]
        for c in left:
            review.append((c["_url"], c["title"],
                           f"écarté par le plafond de {per_city} fiches sur {city}"))
        picked += chosen
        print(f"  {city} : {len(cards)} carte(s), {len(keep)} du ressort, "
              f"{len(chosen)} fiche(s) à lire" + (f" ({len(left)} laissées)" if left else ""))

    return picked, review


def to_rows(picked: list[dict], styles: dict[str, list[str]],
            use_cache: bool) -> tuple[list[dict], list[tuple[str, str, str]]]:
    today = dt.date.today().isoformat()
    regions = city_regions()
    kept: list[dict] = []
    review: list[tuple[str, str, str]] = []
    booked: set[tuple[str, str, str]] = set()

    for i, c in enumerate(picked, 1):
        if i % 100 == 0:
            print(f"    {i}/{len(picked)} fiche(s) lue(s)")
        url = c["_url"]
        d = jsonld(fetch(url, use_cache))
        if not d:
            review.append((url, c["title"], "fiche sans donnée structurée"))
            continue

        status = fold(str(d.get("eventStatus") or "")).rsplit("/", 1)[-1]
        if status and status not in ("eventscheduled", "eventrescheduled"):
            review.append((url, c["title"], f"annoncé {status} par la billetterie"))
            continue

        place = d.get("location") if isinstance(d.get("location"), dict) else {}
        addr = place.get("address") if isinstance(place.get("address"), dict) else {}
        geo = place.get("geo") if isinstance(place.get("geo"), dict) else {}
        cc = str(addr.get("addressCountry") or "").strip().upper()
        country = COUNTRY.get(cc)
        if not country:
            review.append((url, c["title"], f"pays hors périmètre ou inconnu ({cc or 'vide'})"))
            continue

        start = local(d.get("startDate"), TZ[cc])
        if not start:
            review.append((url, c["title"], "date de début illisible"))
            continue
        date = start.date().isoformat()
        if date < today:
            review.append((url, c["title"], f"date passée ({date})"))
            continue
        end = last_day(start, local(d.get("endDate"), TZ[cc]))

        city = clean(addr.get("addressLocality"))
        # Shotgun rend la ville en capitales initiales sur chaque segment. C'est de
        # l'orthographe, pas du contenu, et ça s'affiche partout, donc on la remet
        # d'aplomb, mais **seulement là où la règle s'applique** : « Vila Nova de Gaia »
        # n'obéit pas à la grammaire française.
        if cc in ("FR", "BE", "CH", "LU"):
            city = fr_place_case(city)
        street, postal = clean(addr.get("streetAddress")), clean(addr.get("postalCode"))
        if slugify(city) in NOT_A_CITY:
            review.append((url, c["title"],
                           f"libellé de zone au lieu d'une ville ({city})"))
            continue
        venue = ""
        for cand in (clean(place.get("name")), clean(c["venue"])):
            if cand and not is_address(cand, street, postal, city):
                venue = cand
                break
        if not (venue and city):
            review.append((url, c["title"], "salle non nommée (adresse ou ville à la place)"))
            continue
        try:
            lat = round(float(geo.get("latitude")), 5)
            lng = round(float(geo.get("longitude")), 5)
        except (TypeError, ValueError):
            # Règle de contenu : coordonnées introuvables, on n'ajoute pas l'événement.
            review.append((url, c["title"], "coordonnées manquantes"))
            continue

        # La clé secondaire de `merge.py` : un club ne tient pas deux soirées billetées
        # le même soir dans la même salle. On la refait ici pour ne pas envoyer deux
        # fiches du même lot se disputer la même nuit.
        key = (slugify(city), slugify(venue), date)
        if key in booked:
            continue
        booked.add(key)

        name = drop_edition_year(tidy_title(clean(d.get("name")) or c["title"]), date)
        # Ceinture et bretelles derrière le NFKC de `tidy_title()` : un titre fait
        # uniquement d'émojis ou de symboles rendrait toujours un slug vide, donc une
        # fiche sur `/event` au lieu de `/event/{slug}`, donc un build en échec. On ne
        # peut pas lui inventer un nom, on le rend à la relecture.
        if not slugify(name):
            review.append((url, c["title"], "titre sans une seule lettre, slug impossible"))
            continue
        perf = d.get("performer")
        if isinstance(perf, dict):
            perf = [perf]
        lineup = [clean(p.get("name")) for p in (perf or [])
                  if isinstance(p, dict) and p.get("name")]
        lineup = [a for a in lineup if a and fold(a) != fold(name)]

        blob = f"{name} {' '.join(lineup)}"
        _, off_topic = classify(blob)
        if off_topic:
            review.append((url, name, f"hors périmètre : {', '.join(off_topic[:3])}"))
            continue

        # L'artiste d'abord, les étiquettes de la billetterie ensuite, le titre en
        # dernier. `genres_for()` enchaîne l'artiste puis le titre, donc l'appeler avec
        # le titre laisserait un mot-clé pêché dans un nom de soirée passer **devant**
        # le classement de la plateforme, qui est une attribution faite par celui qui
        # vend le billet. On lui demande donc l'artiste seul (titre vide) et on remet le
        # titre en dernier recours.
        genres = (genres_for("", lineup, styles) or c["_pill_genres"]
                  or classify(name)[0])
        if not genres:
            review.append((url, name, "aucun genre reconnu"
                           + ("" if is_electro(blob) else ", et rien qui dise que c'est électronique")))
            continue

        price, cur, on_sale = entry_price(d.get("offers"), cc)
        desc, desc_en = make_desc(name, venue, city, date, end,
                                  start.strftime("%H:%M"), lineup, price, cur)
        row = {
            "title": name,
            "type": guess_type(name, venue, bool(end)),
            "genres": genres[:4],
            "city": city, "country": country, "lat": lat, "lng": lng,
            "date": date, "time": start.strftime("%H:%M"),
            "price": price or 0, "currency": cur,
            "venue": venue, "trending": False, "lineup": lineup,
            "desc": desc, "descEn": desc_en, "sources": [url],
            # Lien nu : `shotgun.live` n'est dans aucun réseau branché ici, donc
            # `outboundRel()` lui pose `nofollow` et rien d'autre. Un lien qui ne
            # rapporte rien ne se déclare pas sponsorisé.
            "ticketUrl": url,
        }
        if end:
            row["endDate"] = end
        if country == "France":
            # Le code postal d'abord, c'est une correspondance exacte ; le relevé du
            # catalogue ensuite, pour les fiches qui n'ont aucune adresse. Sans l'un ni
            # l'autre on n'écrit rien : `audit.py` le signalera, ce qui vaut mieux qu'un
            # département inventé, il porte une page.
            region = departement(postal) or regions.get(fold(city))
            if region:
                row["region"] = region
        if not price:
            row["note"] = ("plus aucun billet en vente, tarif non communiqué"
                           if not on_sale else "tarif non communiqué par la source")
        img = poster(clean(d.get("image")))
        if img:
            row["_poster"] = img
        kept.append(row)
    return kept, review


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--city", action="append", help="ne collecter que cette ville (répétable)")
    ap.add_argument("--pages", type=int, default=PAGES,
                    help=f"profondeur de la page de ville, cumulative (défaut {PAGES})")
    ap.add_argument("--per-city", type=int, default=PER_CITY,
                    help=f"plafond de fiches lues par ville (défaut {PER_CITY})")
    ap.add_argument("--months", type=int, default=MONTHS,
                    help=f"horizon en mois (défaut {MONTHS})")
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()

    styles = artist_styles()
    print(f"{len(styles)} artiste(s) déjà attribué(s) dans lib/artist-genres.ts.")
    cities = args.city or CITIES
    print(f"{len(cities)} ville(s), horizon {args.months} mois, "
          f"plafond {args.per_city} fiche(s) par ville.")

    picked, review = collect(cities, args.pages, args.per_city, args.months,
                             not args.no_cache)
    print(f"{len(picked)} fiche(s) à lire.")
    kept, more = to_rows(picked, styles, not args.no_cache)
    review += more

    tours = name_tour_dates(kept)
    for e in weekly_residencies(kept):
        review.append((e["sources"][0], e["title"],
                       "soirée récurrente, la date distinctive se choisit à la main"))
    kept.sort(key=lambda e: e["date"])
    open(OUT, "w", encoding="utf-8").write(json.dumps(kept, ensure_ascii=False, indent=2) + "\n")
    write_review(REVIEW, "Shotgun", review)

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
