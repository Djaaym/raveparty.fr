#!/usr/bin/env python3
"""Récolte les métadonnées publiques de chaque artiste du catalogue.

    python3 .research/artists/harvest.py --source lastfm
    python3 .research/artists/harvest.py --source mb
    python3 .research/artists/harvest.py --source wd     # après mb

Pourquoi une récolte automatique plutôt que des agents seuls : on a 1 887 artistes,
et un modèle qui « se souvient » du style d'un DJ de club allemand se trompe sans
qu'on puisse le savoir. Ces trois sources publient une donnée qu'on peut citer :

- **Last.fm** (`/music/{nom}/+tags`) — les tags de la communauté, classés par
  popularité. C'est la source la plus dense pour l'électronique : « hard techno »,
  « rawstyle », « neurofunk » y sont posés par des milliers d'auditeurs. Bruitée
  (des noms de pays, des blagues), donc filtrée en aval par la table de
  correspondance, jamais reprise telle quelle.
- **MusicBrainz** — l'état civil : type (personne / groupe), pays, année de début,
  désambiguïsation, et surtout les *relations* vers Wikidata, Discogs et le site
  officiel. Un req/s maximum, c'est la règle du service.
- **Wikidata** — P136 (genre musical), P18 (image), P27 (nationalité), P569. C'est
  la seule source qui donne une photo dont la licence est explicite.

Rien n'est écrit dans l'app par ce script : il dépose du brut dans harvest/, que
`genres.py` interprète. Reprise possible — chaque source garde son fichier et
saute ce qu'elle a déjà.
"""
import argparse, json, re, sys, time, unicodedata, urllib.parse
from pathlib import Path
import subprocess

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
        lm = re.search(r"lineup: \[(.*?)\]", line)
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
    return sorted((s for s in artists if s not in done), key=lambda s: (-artists[s]["n"], s))


def load(name: str) -> dict:
    f = OUT / f"{name}.json"
    return json.loads(f.read_text()) if f.exists() else {}


def save(name: str, data: dict) -> None:
    (OUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True))


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
        code, body = fetch(f"https://musicbrainz.org/ws/2/artist/?query={q}&fmt=json&limit=5", UA_API)
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
    """Genres (P136), photo (P18), nationalité (P27) — pour les artistes qui ont un
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, choices=["lastfm", "mb", "wd", "list"])
    ap.add_argument("--limit", type=int, default=10**6)
    a = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    artists = catalogue_artists()
    if a.source == "list":
        save("catalogue", artists)
        print(f"{len(artists)} artistes -> harvest/catalogue.json")
        return 0
    {"lastfm": lastfm, "mb": mb, "wd": wd}[a.source](artists, a.limit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
