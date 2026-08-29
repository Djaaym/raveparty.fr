#!/usr/bin/env python3
"""Contrôle d'intégrité de lib/artist-genres.ts.

    python3 .research/artists/audit.py

Ce que la fusion ne peut pas vérifier elle-même, parce qu'elle ne lit pas le résultat :

- un slug qui n'apparaît dans aucun line-up (la page n'existe pas — même famille de
  bug que les maps IMAGES/PHOTOS/TICKETS laissées avec des ids morts) ;
- un genre principal qui n'est pas une clé de `GENRES`, ou qui vaut « Warehouse » :
  c'est un lieu, pas un style, et l'écrire sur une personne serait faux ;
- un sous-genre qui répète son genre principal, ou qui est en réalité une des onze
  catégories (« Acid » = « Acid Techno ») — il devrait être un lien, pas une pilule morte ;
- **l'écart avec le calendrier** : un artiste dont aucun genre attribué n'apparaît dans
  aucune de ses soirées. Ce n'est pas forcément une erreur — un producteur d'ambient
  programmé sur une soirée techno est un cas réel — mais c'est la signature d'un
  homonyme, et ça se relit à la main.
"""
import json, re, sys, unicodedata
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

MAIN_OK = {"Techno", "Hard Techno", "Acid Techno", "Hardstyle", "Hardcore", "EDM",
           "Drum & Bass", "House", "Trance", "Psytrance", "Warehouse"}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def main() -> int:
    cat = json.loads((HERE / "harvest" / "catalogue.json").read_text())
    src = (ROOT / "lib" / "artist-genres.ts").read_text()
    body = src[src.index("/* STYLES:start") : src.index("/* STYLES:end")]

    styles = {}
    for m in re.finditer(r'^  "([^"]+)": \{ m: \[(.*?)\], s: \[(.*?)\], src: "([^"]*)" \},', body, re.M):
        slug, mains, subs, s_src = m.groups()
        styles[slug] = {
            "m": re.findall(r'"([^"]+)"', mains),
            "s": re.findall(r'"([^"]+)"', subs),
            "src": s_src,
        }

    errs, warns = [], []
    for slug, st in styles.items():
        if slug not in cat:
            errs.append(f"{slug} : absent de tous les line-ups")
            continue
        for g in st["m"]:
            if g not in MAIN_OK:
                errs.append(f"{slug} : genre principal inconnu « {g} »")
            if g == "Warehouse":
                errs.append(f"{slug} : « Warehouse » est un lieu, pas un style")
        if not st["m"] and st["src"] != "hors-perimetre":
            errs.append(f"{slug} : aucun genre principal")
        for sub in st["s"]:
            if sub in st["m"]:
                errs.append(f"{slug} : sous-genre « {sub} » répète son genre principal")
            if sub in MAIN_OK:
                warns.append(f"{slug} : « {sub} » est une catégorie du site — devrait être un lien")
        ev = set(cat[slug]["genres"])
        # « Hors périmètre » contredit le calendrier par construction — c'est même la
        # raison d'être du marqueur. Le signaler serait du bruit.
        if ev and st["m"] and not (ev & set(st["m"])):
            warns.append(
                f"{slug} ({cat[slug]['name']}) : attribué {'/'.join(st['m'])}, "
                f"programmé en {'/'.join(sorted(ev))} [{st['src']}]"
            )

    by_src = Counter(st["src"] for st in styles.values())
    off = sum(1 for st in styles.values() if st["src"] == "hors-perimetre")
    subs = Counter(s for st in styles.values() for s in st["s"])
    print(f"{len(styles)} artistes attribués sur {len(cat)} ({100*len(styles)//max(len(cat),1)} %)")
    print(f"  dont {by_src.get('research', 0)} vérifiés à la main")
    print(f"  dont {off} qu'aucune des onze catégories ne décrit (genres volontairement vides)")
    for s_src, n in by_src.most_common(8):
        if s_src != "research":
            print(f"  {s_src or '(vide)':32} {n}")
    print(f"{len(subs)} sous-genres distincts · les plus fréquents : "
          + ", ".join(f"{k} ({v})" for k, v in subs.most_common(10)))

    if errs:
        print(f"\n✗ {len(errs)} erreur(s) :")
        for e in errs[:40]:
            print("  " + e)
    if warns:
        print(f"\n⚠ {len(warns)} écart(s) avec le calendrier, à relire :")
        for w in warns[:40]:
            print("  " + w)
    if not errs and not warns:
        print("\n✓ rien à signaler")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
