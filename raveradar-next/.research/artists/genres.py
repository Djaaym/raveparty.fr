#!/usr/bin/env python3
"""Fusionne les sources et écrit lib/artist-genres.ts.

    python3 .research/artists/genres.py --dry     # rapport, n'écrit rien
    python3 .research/artists/genres.py           # réécrit la map ARTIST_STYLES

Pourquoi ce module existe. Jusqu'ici le style d'un artiste était *déduit* des soirées
où il joue (`rankGenres`) : c'est la seule chose qu'on pouvait faire sans données, et
c'est faux dès que l'affiche est large — un festival étiqueté sur huit styles étiquette
du même coup les cinquante noms de son line-up. La déduction reste le repli ; ce que ce
script produit, c'est l'attribution : ce que l'artiste joue **d'après une source**.

Quatre entrées, par ordre d'autorité décroissante :

1. `genres-*.json` — les lots des agents de recherche. Une source citée, lue par
   quelqu'un. Elle gagne toujours : c'est la seule qui ait pu trancher un homonyme.
2. `harvest/wd.json` — Wikidata P136, rattaché par l'identifiant MusicBrainz (pas par
   le nom : c'est ce qui évite l'homonyme).
3. `harvest/mb.json` — les tags MusicBrainz, avec leur nombre de votes.
4. `harvest/lastfm.json` — les tags de la communauté last.fm, classés par popularité.
   La source la plus dense pour l'électronique, et la plus bruitée : le premier tag
   pèse six fois plus que le dixième, et `OFF_GENRE` jette la page entière quand le
   vocabulaire est celui d'un homonyme metal ou rap.

Un artiste qu'aucune source ne décrit n'entre pas dans la map : sa page continue
d'afficher les genres déduits de ses dates, comme avant. Un trou est honnête, une
étiquette inventée ne l'est pas.
"""
import argparse, json, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tagmap import TAGS, IGNORE, OFF_GENRE, ELECTRONIC_HINT  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
HARVEST = HERE / "harvest"
OUT_TS = ROOT / "lib" / "artist-genres.ts"

MAIN_KEYS = ["Techno", "Hard Techno", "Acid Techno", "Hardstyle", "Hardcore", "EDM",
             "Drum & Bass", "House", "Trance", "Psytrance"]  # « Warehouse » est un lieu, pas un style


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def norm_tag(t: str) -> str:
    return re.sub(r"\s+", " ", (t or "").strip().lower()).replace("&amp;", "&")


def vote(scores, subs, tag, weight, src):
    """Une voix pour la catégorie parente, et le libellé du sous-genre s'il y en a un."""
    t = norm_tag(tag)
    if t in IGNORE or t not in TAGS:
        return False
    main, sub = TAGS[t]
    scores[main] += weight
    if sub:
        subs[sub] += weight
    return True


def load(name):
    f = HARVEST / f"{name}.json"
    return json.loads(f.read_text()) if f.exists() else {}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()

    cat = load("catalogue")
    lfm, mb, wd = load("lastfm"), load("mb"), load("wd")
    by_name = {slugify(v["name"]): s for s, v in cat.items()}

    # --- 1. les lots des agents -------------------------------------------------
    research, bad = {}, []
    for f in sorted(HERE.glob("genres-*.json")):
        try:
            rows = json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ {f.name} : JSON invalide ({e})")
            continue
        for r in rows if isinstance(rows, list) else []:
            slug = slugify(r.get("name", ""))
            mains = [m for m in (r.get("main") or []) if m in MAIN_KEYS]
            srcs = [u for u in (r.get("sources") or []) if isinstance(u, str) and u.startswith("http")]
            if slug not in cat:
                bad.append((r.get("name"), f.name, "absent des line-ups")); continue
            if not mains:
                bad.append((r.get("name"), f.name, "aucun genre principal valide")); continue
            if not srcs:
                bad.append((r.get("name"), f.name, "aucune source http(s)")); continue
            prev = research.get(slug)
            if prev and len(prev["srcs"]) >= len(srcs):
                continue
            subs = [s.strip() for s in (r.get("sub") or []) if isinstance(s, str) and s.strip()]
            research[slug] = {"m": mains[:3], "s": [x for x in subs if x not in mains][:3],
                              "srcs": srcs, "conf": r.get("confidence", "medium")}

    # --- 2. le vote des sources automatiques -----------------------------------
    styles, stats = {}, defaultdict(int)
    for slug in cat:
        if slug in research:
            r = research[slug]
            styles[slug] = {"m": r["m"], "s": r["s"], "src": "research"}
            stats["research"] += 1
            continue

        scores, subs, used = defaultdict(float), defaultdict(float), []

        w = wd.get(slug) or {}
        for g in w.get("genres") or []:
            if vote(scores, subs, g, 5.0, "wd"):
                used.append("wikidata")

        m = mb.get(slug) or {}
        if m.get("found"):
            for tag, cnt in m.get("tags") or []:
                if vote(scores, subs, tag, 3.0 + min(cnt, 4), "mb"):
                    used.append("musicbrainz")

        l = lfm.get(slug) or {}
        tags = [norm_tag(t) for t in (l.get("tags") or [])]
        # Garde-fou homonyme : le vocabulaire d'une page metal ou rap prouve qu'on
        # ne regarde pas notre artiste. On jette last.fm, pas l'artiste.
        head = tags[:6]
        if sum(1 for t in head if t in OFF_GENRE) >= 2 and not any(t in ELECTRONIC_HINT for t in head):
            stats["homonyme last.fm"] += 1
        else:
            for i, t in enumerate(tags[:12]):
                if vote(scores, subs, t, max(1.0, 6.0 - i * 0.5), "lfm"):
                    used.append("last.fm")

        if not scores:
            stats["sans source"] += 1
            continue

        ranked = sorted(scores.items(), key=lambda kv: (-kv[1], MAIN_KEYS.index(kv[0])))
        floor = ranked[0][1] * 0.35
        mains = [g for g, v in ranked if v >= floor][:3]
        sranked = sorted(subs.items(), key=lambda kv: (-kv[1], kv[0]))
        sfloor = (sranked[0][1] * 0.3) if sranked else 0
        keep_s = [s for s, v in sranked if v >= sfloor and s not in mains][:3]
        styles[slug] = {"m": mains, "s": keep_s, "src": "+".join(sorted(set(used)))}
        stats["automatique"] += 1

    # --- 3. rapport --------------------------------------------------------------
    print(f"{len(cat)} artistes au catalogue")
    for k in sorted(stats):
        print(f"  {k:22} {stats[k]}")
    print(f"  {'attribués':22} {len(styles)}  ({100*len(styles)//max(len(cat),1)} %)")
    if bad:
        print(f"\n{len(bad)} entrée(s) d'agent rejetée(s) :")
        for n, f, why in bad[:40]:
            print(f"  ✗ {str(n):32} [{f}] {why}")

    if a.dry:
        print("\n--dry : lib/artist-genres.ts inchangé.")
        return 0

    lines = []
    for slug in sorted(styles):
        s = styles[slug]
        subs = ", ".join(f'"{x}"' for x in s["s"])
        lines.append(f'  "{slug}": {{ m: [{", ".join(chr(34)+g+chr(34) for g in s["m"])}], '
                     f's: [{subs}], src: "{s["src"]}" }}, // {cat[slug]["name"]}')
    block = "export const ARTIST_STYLES: Record<string, ArtistStyle> = {\n" + "\n".join(lines) + "\n};"
    src = OUT_TS.read_text()
    start, end = src.index("/* STYLES:start"), src.index("/* STYLES:end")
    head = src[: src.index("\n", start) + 1]
    OUT_TS.write_text(head + block + "\n" + src[end:])
    print(f"\n✓ lib/artist-genres.ts réécrit — {len(styles)} artistes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
