#!/usr/bin/env python3
"""Récolte les métadonnées publiques de chaque artiste du catalogue.

    python3 .research/artists/harvest.py --source lastfm
    python3 .research/artists/harvest.py --source mb
    python3 .research/artists/harvest.py --source wd     # après mb

Pourquoi une récolte automatique plutôt que des agents seuls : on a 1 887 artistes,
et un modèle qui « se souvient » du style d'un DJ de club allemand se trompe sans
qu'on puisse le savoir. Ces trois sources publient une donnée qu'on peut citer :

- **Last.fm** (`/music/{nom}/+tags`), les tags de la communauté, classés par
  popularité. C'est la source la plus dense pour l'électronique : « hard techno »,
  « rawstyle », « neurofunk » y sont posés par des milliers d'auditeurs. Bruitée
  (des noms de pays, des blagues), donc filtrée en aval par la table de
  correspondance, jamais reprise telle quelle.
- **MusicBrainz**, l'état civil : type (personne / groupe), pays, année de début,
  désambiguïsation, et surtout les *relations* vers Wikidata, Discogs et le site
  officiel. Un req/s maximum, c'est la règle du service.
- **Wikidata**, P136 (genre musical), P18 (image), P27 (nationalité), P569. C'est
  la seule source qui donne une photo dont la licence est explicite.

Rien n'est écrit dans l'app par ce script : il dépose du brut dans harvest/, que
`genres.py` interprète. Reprise possible, chaque source garde son fichier et
saute ce qu'elle a déjà.
"""
import argparse, json, re, sys, time, unicodedata, urllib.parse
from pathlib import Path
import subprocess

# Un artiste du catalogue s'appelle littéralement « [IVY] ». Un `\[(.*?)\]` non gourmand
# s'arrête donc sur SON crochet et tronque le line-up : les noms qui suivent
# disparaissent de l'index, sans erreur ni message. On ne reconnaît que des chaînes
# entre guillemets, ce qu'un crochet ne peut pas interrompre.
LINEUP = re.compile(r'lineup: \[((?:"(?:[^"\\]|\\.)*"(?:, )?)*)\]')

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "harvest"
UA_BROWSER = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
UA_API = "RaveRadar/1.0 (https://raveparty.fr; djaym.info@gmail.com)"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def catalogue_artists() -> dict:
    """slug -> {name, n, genres} lu directement dans lib/data.ts."""
    src = (ROOT / "lib" / "data.ts").read_text()
    out = {}
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        lm = LINEUP.search(line)
        gm = re.search(r"genres: \[(.*?)\]", line)
        if not lm:
            continue
        gs = re.findall(r'"([^"]+)"', gm.group(1)) if gm else []
        for raw in re.findall(r'"((?:[^"\\]|\\.)*)"', lm.group(1)):
            name = raw.replace('\\"', '"').strip()
            s = slugify(name)
            if not s:
                continue
            a = out.setdefault(s, {"name": name, "n": 0, "genres": {}})
            a["n"] += 1
            for g in gs:
                a["genres"][g] = a["genres"].get(g, 0) + 1
    return out


def fetch(url: str, ua: str, timeout: int = 25) -> tuple:
    """(code, body). curl et pas urllib : le proxy sortant ne rend pas la même
    page aux deux (déjà payé sur le lecteur Instagram, cf. CLAUDE.md)."""
    p = subprocess.run(
        ["curl", "-sL", "-A", ua, "-H", "Accept: text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
         "-H", "Accept-Language: en-US,en;q=0.9", "--max-time", str(timeout), "-w", "\n%{http_code}", url],
        capture_output=True, text=True,
    )
    body = p.stdout
    code = body.rsplit("\n", 1)[-1].strip() if "\n" in body else "0"
    return (int(code) if code.isdigit() else 0), body.rsplit("\n", 1)[0]


def order(artists: dict, done: dict) -> list:
    """Les plus programmés d'abord : une récolte interrompue couvre alors les
    artistes que le site met le plus en avant, pas les trois premiers de data.ts."""
    todo = sorted((s for s in artists if s not in done), key=lambda s: (-artists[s]["n"], s))
    if SHARD_N > 1:
        todo = [s for i, s in enumerate(todo) if i % SHARD_N == SHARD_K]
    MINE.update(todo)
    return todo


SHARD_K, SHARD_N = 0, 1


# Découpage en lots parallèles. La latence vient de la file d'attente du proxy, pas du
# service : trois travailleurs sur des tranches disjointes rendent trois fois plus dans
# le même temps. Chacun écrit **son** fichier - deux processus sur un même JSON se
# recouvriraient l'un l'autre à chaque sauvegarde.
SHARD = ""


def load(name: str) -> dict:
    """Tout ce qui a déjà été récolté pour cette source, tous lots confondus."""
    out = {}
    for f in sorted(OUT.glob(f"{name}.json")) + sorted(OUT.glob(f"{name}.*of*.json")):
        try:
            out.update(json.loads(f.read_text()))
        except json.JSONDecodeError:
            pass  # un lot en cours d'écriture : il sera relu au prochain passage
    return out


def save(name: str, data: dict) -> None:
    """N'écrit que ce que *ce* lot a récolté, pour ne pas piétiner ses voisins."""
    f = OUT / (f"{name}{SHARD}.json")
    prev = {}
    if f.exists():
        try:
            prev = json.loads(f.read_text())
        except json.JSONDecodeError:
            prev = {}
    mine = {k: v for k, v in data.items() if k in prev or k in MINE}
    f.write_text(json.dumps({**prev, **mine}, ensure_ascii=False, indent=1, sort_keys=True))


MINE: set = set()


# ---------------------------------------------------------------- Last.fm
def lastfm(artists: dict, limit: int) -> None:
    data = load("lastfm")
    todo = order(artists, data)[:limit]
    print(f"last.fm: {len(todo)} à faire ({len(data)} déjà)", flush=True)
    for i, slug in enumerate(todo, 1):
        name = artists[slug]["name"]
        url = "https://www.last.fm/music/" + urllib.parse.quote(name, safe="") + "/+tags"
        # Last.fm étrangle sans le dire : au-delà d'une requête par seconde il répond
        # 406 (et parfois 502) au lieu de 429. Une seule tentative ferait passer les
        # deux tiers du catalogue pour des artistes inconnus, ce qui est exactement le
        # genre de trou qu'on ne verrait plus ensuite. D'où le repli progressif.
        for attempt in range(4):
            code, html = fetch(url, UA_BROWSER)
            if code in (200, 404):
                break
            time.sleep(4 * (attempt + 1))
        if code == 404:
            data[slug] = {"found": False}
        elif code == 200:
            tags = []
            for t in re.findall(r'href="/tag/([^"]+)"', html):
                t = urllib.parse.unquote(t.replace("+", " ")).strip().lower()
                if t and t not in tags:
                    tags.append(t)
            # Le nom rendu par last.fm : sert à repérer une redirection vers un homonyme.
            m = re.search(r'<h1[^>]*class="header-new-title"[^>]*>(.*?)</h1>', html, re.S)
            data[slug] = {"found": True, "tags": tags[:25], "lfname": (m.group(1).strip() if m else None)}
        else:
            data[slug] = {"found": None, "code": code}
        if i % 20 == 0:
            save("lastfm", data)
            print(f"  {i}/{len(todo)}", flush=True)
        time.sleep(1.6)
    save("lastfm", data)
    print("last.fm terminé", flush=True)


# ---------------------------------------------------------------- MusicBrainz
def mb(artists: dict, limit: int) -> None:
    data = load("mb")
    todo = order(artists, data)[:limit]
    print(f"musicbrainz: {len(todo)} à faire ({len(data)} déjà)", flush=True)
    for i, slug in enumerate(todo, 1):
        name = artists[slug]["name"]
        q = urllib.parse.quote(f'artist:"{name}"')
        # MusicBrainz répond **503** quand l'IP dépasse sa limite d'une requête par
        # seconde, et l'IP est celle du proxy, donc partagée. Traiter ce 503 comme une
        # réponse enregistrerait « artiste introuvable » pour quelqu'un que la base
        # connaît, et un faux négatif de ce genre ne se revoit jamais : la ligne est
        # écrite, et la reprise la saute.
        for attempt in range(4):
            code, body = fetch(f"https://musicbrainz.org/ws/2/artist/?query={q}&fmt=json&limit=5", UA_API)
            if code in (200, 404):
                break
            time.sleep(3 * (attempt + 1))
        if code not in (200, 404):
            time.sleep(1.05)
            continue
        rec = {"found": False}
        if code == 200:
            try:
                res = json.loads(body).get("artists", [])
            except Exception:
                res = []
            # Correspondance exacte sur le nom normalisé, sinon on ne prend rien :
            # « Mind » ou « Kobra » renverraient n'importe quel groupe de rock.
            best = next((a for a in res if slugify(a.get("name", "")) == slug and a.get("score", 0) >= 90), None)
            if best:
                rec = {
                    "found": True,
                    "mbid": best.get("id"),
                    "name": best.get("name"),
                    "type": best.get("type"),
                    "country": best.get("country"),
                    "area": (best.get("area") or {}).get("name"),
                    "begin": (best.get("life-span") or {}).get("begin"),
                    "ended": (best.get("life-span") or {}).get("ended"),
                    "disambiguation": best.get("disambiguation"),
                    "tags": sorted(
                        [(t["name"].lower(), t.get("count", 0)) for t in best.get("tags", [])],
                        key=lambda x: -x[1],
                    ),
                    # Deux entrées exactes homonymes = ambigu, on le note pour les agents.
                    "homonyms": sum(1 for a in res if slugify(a.get("name", "")) == slug),
                }
        data[slug] = rec
        if i % 20 == 0:
            save("mb", data)
            print(f"  {i}/{len(todo)}", flush=True)
        time.sleep(1.05)  # règle MusicBrainz : 1 requête/seconde
    save("mb", data)
    print("musicbrainz terminé", flush=True)


# ---------------------------------------------------------------- Wikidata
def wd(artists: dict, limit: int) -> None:
    """Genres (P136), photo (P18), nationalité (P27), pour les artistes qui ont un
    MBID, via la propriété P434 (MusicBrainz artist ID). Une recherche par nom
    ramènerait des homonymes ; l'identifiant, non."""
    mbdata = load("mb")
    data = load("wd")
    have = [s for s in artists if mbdata.get(s, {}).get("mbid") and s not in data][:limit]
    print(f"wikidata: {len(have)} à faire ({len(data)} déjà)", flush=True)
    B = 40
    for k in range(0, len(have), B):
        chunk = have[k : k + B]
        vals = " ".join('"%s"' % mbdata[s]["mbid"] for s in chunk)
        query = f"""
SELECT ?mbid ?item ?itemLabel ?genreLabel ?img ?citLabel ?born WHERE {{
  VALUES ?mbid {{ {vals} }}
  ?item wdt:P434 ?mbid .
  OPTIONAL {{ ?item wdt:P136 ?genre . }}
  OPTIONAL {{ ?item wdt:P18 ?img . }}
  OPTIONAL {{ ?item wdt:P27 ?cit . }}
  OPTIONAL {{ ?item wdt:P569 ?born . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en,fr". }}
}}"""
        url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(query)
        code, body = fetch(url, UA_API, timeout=60)
        rows = []
        if code == 200:
            try:
                rows = json.loads(body)["results"]["bindings"]
            except Exception:
                rows = []
        by = {}
        for r in rows:
            m = r["mbid"]["value"]
            e = by.setdefault(m, {"qid": r["item"]["value"].rsplit("/", 1)[-1], "genres": [], "img": None,
                                  "citizenship": None, "born": None})
            if "genreLabel" in r and r["genreLabel"]["value"] not in e["genres"]:
                e["genres"].append(r["genreLabel"]["value"])
            if "img" in r:
                e["img"] = r["img"]["value"]
            if "citLabel" in r:
                e["citizenship"] = r["citLabel"]["value"]
            if "born" in r:
                e["born"] = r["born"]["value"][:10]
        for s in chunk:
            data[s] = by.get(mbdata[s]["mbid"], {"found": False})
        save("wd", data)
        print(f"  {min(k+B, len(have))}/{len(have)}", flush=True)
        time.sleep(2)
    print("wikidata terminé", flush=True)


# ---------------------------------------------------------------- Discogs
def discogs(artists: dict, limit: int) -> None:
    """Les styles agrégés de la discographie.

    Discogs étiquette les **disques**, pas les artistes : un artiste n'y a pas de
    champ « genre ». Mais la recherche de sorties par nom d'artiste rend, pour chaque
    disque, un `genre` grossier (« Electronic ») et un `style` fin (« Hard Techno »,
    « Tech House », « Neurofunk »). Compter les styles de la discographie donne le
    profil le plus précis qu'on puisse obtenir sans lire une biographie, et il est
    daté, ce qu'aucune autre source ne donne : un producteur passé de la trance à la
    techno le montre dans ses sorties.

    `genres` sert de garde-fou homonyme, comme OFF_GENRE pour last.fm : une
    discographie majoritairement « Rock » ou « Hip Hop » n'est pas la nôtre.

    Sans jeton, l'API tolère ~25 requêtes/minute : d'où la temporisation, et pas de
    parallélisme.
    """
    from collections import Counter
    data = load("discogs")
    todo = order(artists, data)[:limit]
    print(f"discogs: {len(todo)} à faire ({len(data)} déjà)", flush=True)
    for i, slug in enumerate(todo, 1):
        name = artists[slug]["name"]
        url = ("https://api.discogs.com/database/search?type=release&per_page=50&artist="
               + urllib.parse.quote(name))
        code, body = fetch(url, UA_API)
        rec = {"found": False}
        if code == 200:
            try:
                res = json.loads(body).get("results", [])
            except Exception:
                res = []
            if res:
                st, ge = Counter(), Counter()
                for r in res:
                    for x in r.get("style") or []:
                        st[x.lower()] += 1
                    for x in r.get("genre") or []:
                        ge[x.lower()] += 1
                rec = {"found": True, "n": len(res), "styles": st.most_common(12),
                       "genres": ge.most_common(5)}
        data[slug] = rec
        if i % 20 == 0:
            save("discogs", data)
            print(f"  {i}/{len(todo)}", flush=True)
        time.sleep(2.5)
    save("discogs", data)
    print("discogs terminé", flush=True)


# ---------------------------------------------------------------- Wikidata par nom
def wdlabel(artists: dict, limit: int) -> None:
    """Wikidata interrogé directement par le nom, sans passer par MusicBrainz.

    La route prévue au départ était MusicBrainz → P434 → Wikidata. Elle est correcte
    mais impraticable ici : MusicBrainz limite à une requête par seconde **par IP**, et
    l'IP est celle du proxy, partagée, on encaissait 40 % de 503 et un débit d'environ
    une fiche par minute, soit dix-huit heures pour le catalogue.

    Wikidata accepte au contraire **soixante noms par requête** en SPARQL : trente-deux
    requêtes couvrent les 1 887 artistes. Le prix à payer est l'homonymie, puisqu'on
    interroge une chaîne de caractères et non un identifiant. Trois garde-fous :

    - le libellé doit correspondre **exactement** (`rdfs:label`, pas une recherche floue) ;
    - l'entité doit être un musicien, un DJ, un producteur ou un groupe (P106 / P31) ;
    - **deux entités pour un même nom = on n'écrit rien.** C'est la règle « Jazzy » : sans
      moyen de trancher, une fiche vide vaut mieux qu'une fiche fausse, et ici l'enjeu
      n'est pas qu'une étiquette de genre, c'est le visage affiché sur la page de
      quelqu'un.
    """
    data = load("wdlabel")
    todo = order(artists, data)[:limit]
    print(f"wikidata (par nom) : {len(todo)} à faire ({len(data)} déjà)", flush=True)
    B = 60
    for k in range(0, len(todo), B):
        chunk = todo[k : k + B]
        # Le libellé Wikidata est sensible à la casse et aux accents : on envoie la
        # graphie du catalogue, échappée pour SPARQL.
        vals = " ".join('"%s"@en' % artists[s]["name"].replace("\\", "").replace('"', '\\"') for s in chunk)
        query = f"""
SELECT ?name ?item ?genreLabel ?img ?citLabel ?born ?mb ?desc WHERE {{
  VALUES ?name {{ {vals} }}
  ?item rdfs:label ?name .
  {{ ?item wdt:P106 ?occ . VALUES ?occ {{ wd:Q130857 wd:Q183945 wd:Q639669 wd:Q36834 wd:Q488205 }} }}
  UNION {{ ?item wdt:P31 wd:Q215380 }}
  OPTIONAL {{ ?item wdt:P136 ?genre . }}
  OPTIONAL {{ ?item wdt:P18 ?img . }}
  OPTIONAL {{ ?item wdt:P27 ?cit . }}
  OPTIONAL {{ ?item wdt:P569 ?born . }}
  OPTIONAL {{ ?item wdt:P434 ?mb . }}
  OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en,fr". }}
}}"""
        url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(query)
        code, body = fetch(url, UA_API, timeout=120)
        rows = []
        if code == 200:
            try:
                rows = json.loads(body)["results"]["bindings"]
            except Exception:
                rows = []
        if code != 200:
            print(f"  ✗ lot {k // B} : HTTP {code}", flush=True)
            time.sleep(10)
            continue
        by_name: dict = {}
        for r in rows:
            n = r["name"]["value"]
            qid = r["item"]["value"].rsplit("/", 1)[-1]
            e = by_name.setdefault(n, {})
            it = e.setdefault(qid, {"qid": qid, "genres": [], "img": None, "citizenship": None,
                                    "born": None, "mbid": None, "desc": None})
            if "genreLabel" in r and r["genreLabel"]["value"] not in it["genres"]:
                it["genres"].append(r["genreLabel"]["value"])
            for key, prop in (("img", "img"), ("citizenship", "citLabel"), ("born", "born"),
                              ("mbid", "mb"), ("desc", "desc")):
                if prop in r and not it[key]:
                    it[key] = r[prop]["value"]
        for slug in chunk:
            items = by_name.get(artists[slug]["name"], {})
            if len(items) > 1:
                data[slug] = {"found": False, "ambiguous": [i["qid"] for i in items.values()]}
            elif items:
                it = next(iter(items.values()))
                it["found"] = True
                if it["born"]:
                    it["born"] = it["born"][:10]
                data[slug] = it
            else:
                data[slug] = {"found": False}
        save("wdlabel", data)
        print(f"  {min(k + B, len(todo))}/{len(todo)}", flush=True)
        time.sleep(2)
    print("wikidata (par nom) terminé", flush=True)


def wdcat(artists: dict, limit: int) -> None:
    """La **catégorie Commons** de l'artiste (P373), là où vivent ses photos.

    P18 ne rend qu'une image par artiste, celle que Wikidata a élue, et c'est parfois
    une vue de scène où l'artiste est un point au fond. La catégorie Commons, elle,
    contient tout ce qui a été versé sur lui : sur Nina Kraviz, une vingtaine de
    fichiers, dont plusieurs vrais portraits. C'est le gisement qui manquait.

    Mêmes garde-fous que `wdlabel()`, dont cette requête est le jumeau : libellé exact,
    entité musicienne, et **deux entités pour un nom = on n'écrit rien**. Une catégorie
    Commons attrapée sur un homonyme verserait ses photos sur la fiche de quelqu'un
    d'autre, ce qui est précisément l'erreur qu'on répare.
    """
    data = load("wdcat")
    todo = order(artists, data)[:limit]
    print(f"wikidata (catégories Commons) : {len(todo)} à faire ({len(data)} déjà)", flush=True)
    B = 60
    for k in range(0, len(todo), B):
        chunk = todo[k : k + B]
        vals = " ".join('"%s"@en' % artists[s]["name"].replace("\\", "").replace('"', '\\"') for s in chunk)
        query = f"""
SELECT ?name ?item ?cat ?desc WHERE {{
  VALUES ?name {{ {vals} }}
  ?item rdfs:label ?name .
  {{ ?item wdt:P106 ?occ . VALUES ?occ {{ wd:Q130857 wd:Q183945 wd:Q639669 wd:Q36834 wd:Q488205 }} }}
  UNION {{ ?item wdt:P31 wd:Q215380 }}
  OPTIONAL {{ ?item wdt:P373 ?cat . }}
  OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }}
}}"""
        url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(query)
        code, body = fetch(url, UA_API, timeout=120)
        if code != 200:
            print(f"  ✗ lot {k // B} : HTTP {code}", flush=True)
            time.sleep(10)
            continue
        try:
            rows = json.loads(body)["results"]["bindings"]
        except Exception:
            rows = []
        by_name: dict = {}
        for r in rows:
            e = by_name.setdefault(r["name"]["value"], {})
            qid = r["item"]["value"].rsplit("/", 1)[-1]
            it = e.setdefault(qid, {"qid": qid, "cat": None, "desc": None})
            for key, prop in (("cat", "cat"), ("desc", "desc")):
                if prop in r and not it[key]:
                    it[key] = r[prop]["value"]
        for slug in chunk:
            items = by_name.get(artists[slug]["name"], {})
            if len(items) > 1:
                data[slug] = {"found": False, "ambiguous": [i["qid"] for i in items.values()]}
            elif items:
                data[slug] = dict(next(iter(items.values())), found=True)
            else:
                data[slug] = {"found": False}
        save("wdcat", data)
        print(f"  {min(k + B, len(todo))}/{len(todo)}", flush=True)
        time.sleep(2)
    print("wikidata (catégories Commons) terminé", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, choices=["lastfm", "mb", "wd", "wdlabel", "wdcat", "discogs", "list"])
    ap.add_argument("--limit", type=int, default=10**6)
    ap.add_argument("--shard", default="", help="k/n, ce lot traite un artiste sur n")
    a = ap.parse_args()
    global SHARD, SHARD_K, SHARD_N
    if a.shard:
        k, n = a.shard.split("/")
        SHARD_K, SHARD_N = int(k), int(n)
        SHARD = f".{SHARD_K}of{SHARD_N}"
    OUT.mkdir(exist_ok=True)
    artists = catalogue_artists()
    if a.source == "list":
        # Écriture entière, pas la fusion par lot de `save()` : celle-ci n'écrit que ce
        # que le lot courant a récolté, donc le catalogue ne pouvait jamais *rétrécir*.
        # Un artiste retiré d'un line-up (« Fused », qui était le nom d'une soirée) y
        # restait, et la fusion continuait de lui compter des genres.
        (OUT / "catalogue.json").write_text(
            json.dumps(artists, ensure_ascii=False, indent=1, sort_keys=True))
        print(f"{len(artists)} artistes -> harvest/catalogue.json")
        return 0
    {"lastfm": lastfm, "mb": mb, "wd": wd, "wdlabel": wdlabel, "wdcat": wdcat,
     "discogs": discogs}[a.source](artists, a.limit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
