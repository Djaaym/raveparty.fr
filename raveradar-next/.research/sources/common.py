"""
Ce que tous les collecteurs partagent : classer, mettre au format, rendre compte.

Un collecteur de source se résume à trois choses : aller chercher, décider ce qui mérite
d'entrer au catalogue, et écrire le lot au format de `merge.py`. Seule la première est
propre à une source. Les deux autres portent les règles du projet, et les écrire deux
fois, c'est se garantir qu'elles divergeront à la première correction, exactement le
motif que `lib/catalog-export.ts` a fermé pour la conversion des dépôts de promoteurs.

Ce module ne connaît donc aucune source : ni jds, ni Skiddle, ni HTTP. Il porte le
vocabulaire éditorial, la mise au format et le rapport de relecture.
"""
import datetime as dt
import html
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.dirname(HERE)
APP = os.path.dirname(RESEARCH)


# ------------------------------------------------------------------ texte

def fold(s: str) -> str:
    """Minuscules sans accents, la forme sur laquelle on compare."""
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def slugify(s: str) -> str:
    """Copie conforme de `slugify()` (lib/display.ts), pour retrouver la clé d'un artiste."""
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", fold(s))).strip("-")


def clean(s: str | None) -> str:
    """Le texte d'un champ, balises retirées, entités résolues, espaces normalisés."""
    if not s:
        return ""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", str(s)))).strip()


# -------------------------------------------------------- classement éditorial

# Ce qui n'a rien à faire dans un annuaire de rave, même listé sous « electro » ou
# « clubbing ». La liste est faite de ce qu'on a réellement vu passer sur les agendas
# lus, pas de suppositions : concerts aux chandelles, tributes joués par un orchestre,
# ciné-concerts, spectacles, dîners dansants.
OFF_TOPIC = [
    "candlelight", "hommage a", "tribute", "cover band", "orchestre", "orchestra",
    "symphoniq", "symphony orchestra", "philharmoni", "cine-concert", "cine concert",
    "comedie musicale", "spectacle equestre", "diner spectacle", "brunch", "karaoke",
    "blind test", "quiz night", "conference", "atelier", "exposition", "theatre",
    "opera", "gospel", "chorale", "harmonie municipale", "bal populaire", "the dansant",
    "musical", "pantomime", "wrestling", "bingo",
]

# La preuve positive, cherchée **en mots entiers** et **jamais dans le nom de la salle**.
# Les deux règles viennent d'un premier essai raté sur jds, et chacune a un cas nommé :
# « house » est une sous-chaîne de « Warehouse », donc les neuf dates du Warehouse de
# Nantes sont sorties étiquetées House ; et « jungle » a classé en drum & bass La Jungle,
# duo de noise-rock belge, sur son seul nom. C'est la règle « Ain est une sous-chaîne de
# Saintes » d'`eventsForPlace()`, repayée deux fois.
#
# Les libellés trop courants ont été retirés plutôt que corrigés : « jungle », « garage »,
# « minimal » et « disco » sont des mots courants ou des noms de groupes avant d'être des
# genres. Ce qu'ils auraient attrapé, la carte des artistes l'attrape mieux. L'ordre
# compte : « hard techno » avant « techno », « psytrance » avant « trance ».
GENRE_HINTS: list[tuple[str, str]] = [
    ("hard techno", "Hard Techno"), ("hardtechno", "Hard Techno"),
    ("acid techno", "Acid Techno"), ("acidcore", "Acid Techno"),
    ("psytrance", "Psytrance"), ("psy-trance", "Psytrance"), ("goa", "Psytrance"),
    ("hardstyle", "Hardstyle"), ("rawstyle", "Hardstyle"),
    ("frenchcore", "Hardcore"), ("uptempo", "Hardcore"), ("hardcore", "Hardcore"),
    ("tekno", "Hardcore"), ("terrorcore", "Hardcore"), ("gabber", "Hardcore"),
    ("drum & bass", "Drum & Bass"), ("drum and bass", "Drum & Bass"),
    ("drum'n'bass", "Drum & Bass"), ("dnb", "Drum & Bass"), ("neurofunk", "Drum & Bass"),
    ("liquid dnb", "Drum & Bass"),
    ("tech house", "House"), ("deep house", "House"), ("afro house", "House"),
    ("house", "House"),
    ("trance", "Trance"),
    ("techno", "Techno"),
    ("edm", "EDM"), ("mainstage", "EDM"), ("big room", "EDM"),
    ("warehouse", "Warehouse"),
]

# Ce qui dit « c'est bien de l'électronique » sans nommer de style. Sert à distinguer,
# dans le rapport de relecture, « aucun genre reconnu » de « et ce n'est probablement pas
# pour nous » : les deux ne demandent pas le même travail à la relecture.
ELECTRO_HINTS = [
    "electro", "dj set", "dj-set", "club night", "clubbing", "rave", "soiree techno",
    "boiler room", "afters", "warm up", "b2b", "live set", "sound system", "all night long",
]


def classify(text: str) -> tuple[list[str], list[str]]:
    """Les genres reconnus dans le texte, et les motifs hors périmètre trouvés.

    On rend les deux : un appelant qui ne verrait que les genres publierait un
    « hommage techno symphonique » au motif qu'il contient « techno ».
    """
    t = fold(text)
    off = [w for w in OFF_TOPIC if w in t]
    genres: list[str] = []
    for needle, genre in GENRE_HINTS:
        # `\b` sur la forme réduite : c'est ce qui empêche « house » de se déclencher au
        # milieu de « warehouse », et « goa » au milieu de « goal ».
        if re.search(rf"\b{re.escape(needle)}\b", t) and genre not in genres:
            genres.append(genre)
    return genres, off


def is_electro(text: str) -> bool:
    t = fold(text)
    return any(w in t for w in ELECTRO_HINTS)


def artist_styles() -> dict[str, list[str]]:
    """Les genres attribués aux artistes, lus dans `lib/artist-genres.ts`.

    C'est **la** bonne source pour classer une soirée dont le titre est un nom d'artiste,
    et le projet l'a déjà construite : 1 511 attributions récoltées sur Wikidata,
    MusicBrainz et des lots de recherche, avec la règle « le style d'un artiste est
    attribué, pas déduit du calendrier ». Chercher un mot-clé dans un texte éditorial à
    la place, c'est ce qui a fait passer French 79, groupe de synthwave, pour de la
    techno. On lit le fichier au motif, comme `audit.py` lit `data.ts`.
    """
    out: dict[str, list[str]] = {}
    try:
        src = open(os.path.join(APP, "lib", "artist-genres.ts"), encoding="utf-8").read()
    except OSError:
        return out
    for slug, main in re.findall(r'^\s*"([^"]+)":\s*\{\s*m:\s*\[([^\]]*)\]', src, re.M):
        genres = re.findall(r'"([^"]+)"', main)
        if genres:
            out[slug] = genres
    return out


def genres_for(name: str, lineup: list[str], styles: dict[str, list[str]]) -> list[str]:
    """Les genres d'un événement, sur preuve forte uniquement.

    Deux sources, dans cet ordre. **L'artiste d'abord** : c'est la seule qui sache
    vraiment ce qui va être joué, Kölsch rend House et Techno, Vortek's rend Hardcore,
    Hard Techno et Acid Techno, là où le titre ne dit rien. **Le titre ensuite**, jamais
    la salle : un club qui s'appelle « Warehouse » ne dit rien de ce qu'on y joue ce
    soir-là. Une mention perdue dans la description de la source ne compte pas.

    Rend une liste vide quand rien n'est sûr, et c'est une réponse : sans preuve, la
    fiche part en relecture au lieu d'être étiquetée au plausible.
    """
    from_artists: list[str] = []
    for a in lineup:
        for g in styles.get(slugify(a), []):
            if g not in from_artists:
                from_artists.append(g)
    if from_artists:
        return from_artists
    return classify(name)[0]


# ---------------------------------------------------------------- mise au format

def tidy_title(name: str) -> str:
    """Retire du titre ce qui décrit l'affiche plutôt que l'événement.

    Les agendas écrivent « Digitalism + Première Partie », « Joris Delacroix + Guest »,
    « … // Glasgow » : la première partie n'est pas nommée, la ville est déjà un champ, et
    ces mentions se retrouveraient dans le `<title>` de la page, dans le slug et dans la
    clé de dédup. On ne touche à rien d'autre : le titre reste celui de la source, c'est
    sous ce nom que la soirée se cherche.
    """
    t = re.sub(r"\s*\+\s*(1[eè]re|premi[eè]re)\s+partie\s*$", "", name, flags=re.I)
    t = re.sub(r"\s*\+\s*guests?\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*\+\s*(et\s+)?(plus|more)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*//\s*[A-Za-zÀ-ÿ' -]{3,24}\s*$", "", t)
    return re.sub(r"\s{2,}", " ", t).strip(" -–")


def guess_type(name: str, venue: str, multi_day: bool) -> str:
    """Festival, Warehouse ou Club, les trois seules valeurs qu'`EventType` admette.

    Un événement sur plusieurs jours est un festival, c'est la seule déduction sûre. Le
    reste se lit dans le libellé : un mot explicite l'emporte, sinon « Club », qui est le
    cas majoritaire d'un agenda de soirées et le moins engageant des trois.
    """
    t = fold(f"{name} {venue}")
    if multi_day or "festival" in t:
        return "Festival"
    if any(w in t for w in ("warehouse", "entrepot", "hangar", "friche", "usine", "depot")):
        return "Warehouse"
    return "Club"


MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]


def make_desc(name: str, venue: str, city: str, date: str, end: str | None,
              time_s: str, lineup: list[str], price: float | None, cur: str) -> tuple[str, str]:
    """La description, faite de faits et pas empruntée.

    Celle de la source est son texte éditorial : la reprendre serait republier son
    travail, et sa voix n'est pas la nôtre. On assemble donc ce que la donnée structurée
    affirme. C'est plat par construction, et c'est assumé : la relecture qui précède la
    fusion est exactement l'endroit où une description se réécrit, source sous les yeux.
    """
    def fr(iso: str) -> str:
        d = dt.date.fromisoformat(iso)
        return f"{d.day} {MOIS[d.month - 1]} {d.year}"

    def en(iso: str) -> str:
        d = dt.date.fromisoformat(iso)
        return f"{d.day} {d.strftime('%B %Y')}"

    when_fr = f"du {fr(date)} au {fr(end)}" if end and end != date else f"le {fr(date)}"
    when_en = f"from {en(date)} to {en(end)}" if end and end != date else f"on {en(date)}"
    # « à partir de 20:00 » se lit comme une machine : l'heure française s'écrit « 20 h ».
    h, m = time_s.split(":")
    hour_fr = f"{int(h)} h" + (f" {m}" if m != "00" else "")
    head = ", ".join(lineup[:4])
    more = len(lineup) - 4

    f_ = f"{name} {when_fr} à {venue}, {city}, à partir de {hour_fr}."
    e_ = f"{name} {when_en} at {venue}, {city}, from {time_s}."
    if head:
        f_ += f" Au line-up : {head}" + (f" et {more} autre{'s' if more > 1 else ''} nom{'s' if more > 1 else ''}." if more > 0 else ".")
        e_ += f" On the bill: {head}" + (f" and {more} more name{'s' if more > 1 else ''}." if more > 0 else ".")
    if price:
        amount = f"{price:g} {cur}" if cur not in ("£", "$") else f"{cur}{price:g}"
        f_ += f" Entrée à partir de {amount}."
        e_ += f" Entry from {amount}."
    return f_, e_


def name_tour_dates(events: list[dict]) -> int:
    """Les dates d'une tournée prennent le nom de leur salle.

    La clé de dédup de `merge.py` est **(titre normalisé, année)** : elle regroupe les
    éditions d'un festival, ce qui est voulu, mais elle voit aussi les neuf dates de la
    tournée de Fakear comme un seul événement, et huit seraient rejetées en doublon. Le
    catalogue résout déjà ce cas en mettant la salle dans le titre (« NTO Live au
    Bikini ») : c'est la convention à appliquer, pas la clé à assouplir, puisque c'est
    elle qui empêche « Sónar 2026 » et « Sónar » de faire deux pages.

    On ne renomme que ce qui se répète : une date unique garde son titre, qui est le nom
    sous lequel on la cherche.
    """
    seen: dict[str, int] = {}
    for e in events:
        seen[fold(e["title"])] = seen.get(fold(e["title"]), 0) + 1
    renamed = 0
    for e in events:
        if seen[fold(e["title"])] > 1:
            base = re.sub(r"\s*[-–]\s*(tourn[ée]e|tour|dream tour|uk tour)\s*$", "", e["title"], flags=re.I)
            e["title"] = f"{base} à {e['venue']}"
            renamed += 1
    return renamed


def weekly_residencies(events: list[dict]) -> list[dict]:
    """Retire les soirées récurrentes qui restent homonymes après le suffixe de salle.

    `name_tour_dates()` distingue une tournée en ajoutant la salle, ce qui marche parce
    qu'une tournée change de salle. Une **résidence hebdomadaire** ne change pas : les
    quatre « Insomnia London » du Phonox et les « Your Mum's House: Every Thursday at
    Basing House » gardent le même titre, donc la même clé (titre, année), donc trois
    sur quatre seraient rejetées en doublon par `merge.py` et la quatrième serait prise
    au hasard.

    C'est le cas que `CLAUDE.md` décrit pour les Klubnacht berlinoises : « leurs
    hebdomadaires quasi homonymes s'effondrent sur la clé de dédup, n'en retenir que les
    dates distinctives ». Quelle date est distinctive ne se décide pas à la machine, donc
    on les sort du lot et on les rend à la relecture, entières.
    """
    by_key: dict[tuple[str, str], list[dict]] = {}
    for e in events:
        by_key.setdefault((fold(e["title"]), fold(e["venue"])), []).append(e)
    dropped = [e for rows in by_key.values() if len(rows) > 1 for e in rows]
    events[:] = [e for rows in by_key.values() if len(rows) == 1 for e in rows]
    return dropped


def write_review(path: str, source: str, review: list[tuple[str, str, str]]) -> None:
    """Ce qui n'a pas été publié, avec l'URL et la raison.

    Un collecteur qui jette en silence est un collecteur qu'on ne peut pas corriger : ce
    fichier est la moitié utile du script. Un festival écarté faute d'horaire s'ajoute à
    la main en trois minutes, encore faut-il savoir qu'il existe.
    """
    by_reason: dict[str, list[tuple[str, str]]] = {}
    for url, name, why in review:
        by_reason.setdefault(why.split(" :")[0], []).append((name, url))
    lines = [
        f"# {source}, ce que le collecteur n'a pas publié",
        "",
        f"> Écrit le {dt.date.today().isoformat()}.",
        "> Chaque ligne est une fiche que le script a refusé de produire seul. Rien ici",
        "> n'est une erreur : ce sont les cas où publier demanderait de deviner. Les",
        "> reprendre à la main est rapide, l'URL est à côté.",
        "",
    ]
    for why, rows in sorted(by_reason.items(), key=lambda kv: -len(kv[1])):
        lines.append(f"## {why} ({len(rows)})")
        lines.append("")
        for name, url in sorted(rows)[:120]:
            lines.append(f"- [{name}]({url})")
        if len(rows) > 120:
            lines.append(f"- … et {len(rows) - 120} autre(s)")
        lines.append("")
    open(path, "w", encoding="utf-8").write("\n".join(lines))
