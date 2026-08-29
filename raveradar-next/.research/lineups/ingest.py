#!/usr/bin/env python3
"""
Greffe un line-up annoncé depuis sur une fiche déjà publiée.

`merge.py` ajoute des événements ; il ne sait pas en corriger un. Or 171 fiches à
venir affichent « Programmation à venir » parce que l'affiche n'était pas sortie le
jour où on les a saisies — et une donnée saisie une fois ne se re-vérifie jamais toute
seule. C'est le pendant de la règle des annulations : le calendrier bouge après nous.

Entrée : un JSON par lot dans ce répertoire.

    [{"id": 122, "title": "NDK Festival", "lineup": ["…"], "source": "https://…"}]

`title` n'est pas décoratif : c'est le garde-fou contre la dérive d'id. Les ids de
`lib/data.ts` ne bougent pas, mais un agent qui recopie mal une ligne écrirait un
line-up sur la mauvaise soirée — faute invisible, et exactement le genre d'erreur que
ce dépôt paie deux fois. Comparaison sur une forme normalisée (casse, accents,
ponctuation), donc « Unsound Warsaw - Soft Power » passe pour « Unsound Warsaw – Soft
Power ».

Règles de contenu, les mêmes que partout : `source` doit être une URL http(s), un
line-up vide est refusé (c'est déjà l'état de la fiche, l'écrire n'apprend rien), et
une fiche qui a **déjà** un line-up n'est pas écrasée sans `--force` — le lot d'un
agent ne vaut pas mieux que ce qui est publié.

    python3 .research/lineups/ingest.py --dry
    python3 .research/lineups/ingest.py
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parents[1] / "lib" / "data.ts"

# Les noms qui ne sont pas des artistes : un agent recopie parfois l'intitulé d'une
# scène ou une mention d'affiche. Aucun n'a sa place dans `lineup`, qui alimente
# l'index des fiches artistes (`buildArtists()`).
NOT_AN_ARTIST = re.compile(
    r"^(tba|tbc|t\.b\.a\.?|line[- ]?up|programmation|à venir|coming soon|more tba|"
    r"secret guest|special guest|guest|and more|\+ more|others?|various artists?|va)$",
    re.I,
)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def read_events(src: str) -> dict:
    """id -> (numéro de ligne, ligne, titre, line-up actuel)."""
    out = {}
    for i, line in enumerate(src.split("\n")):
        m = re.match(r"\s*\{ id: (\d+), title: \"((?:[^\"\\]|\\.)*)\"", line)
        if not m:
            continue
        cur = re.search(r" lineup: \[([^\]]*)\]", line)
        out[int(m.group(1))] = (i, line, m.group(2), (cur.group(1).strip() if cur else None))
    return out


def clean(names, seen_titles) -> list:
    """Noms d'artistes : espaces normalisés, intitulés de scène retirés, dédupliqués."""
    out, seen = [], set()
    for raw in names:
        n = re.sub(r"\s+", " ", str(raw)).strip().strip(",;")
        if not n or NOT_AN_ARTIST.match(n):
            continue
        k = norm(n)
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(n)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="n'écrit rien, montre le diff")
    ap.add_argument("--force", action="store_true", help="écrase un line-up déjà publié")
    ap.add_argument("files", nargs="*", help="lots à lire (défaut : tous les .json du répertoire)")
    a = ap.parse_args()

    lots = [Path(f) for f in a.files] or sorted(p for p in HERE.glob("*.json"))
    if not lots:
        print("aucun lot à lire dans .research/lineups/", file=sys.stderr)
        return 1

    src = DATA.read_text()
    lines = src.split("\n")
    events = read_events(src)

    applied, skipped, errors = [], [], []
    seen_ids = {}

    for lot in lots:
        try:
            rows = json.loads(lot.read_text())
        except json.JSONDecodeError as e:
            errors.append(f"{lot.name}: JSON illisible ({e})")
            continue
        for r in rows:
            tag = f"{lot.name}#{r.get('id', '?')}"
            eid = r.get("id")
            if not isinstance(eid, int) or eid not in events:
                errors.append(f"{tag}: id absent de lib/data.ts")
                continue
            i, line, title, cur = events[eid]
            if norm(r.get("title", "")) != norm(title):
                errors.append(f"{tag}: titre discordant — lot « {r.get('title')} » / catalogue « {title} »")
                continue
            src_url = str(r.get("source", ""))
            if not src_url.startswith(("http://", "https://")):
                errors.append(f"{tag}: `source` manquante ou non http(s)")
                continue
            names = clean(r.get("lineup", []), title)
            if not names:
                errors.append(f"{tag}: line-up vide après nettoyage — rien à greffer")
                continue
            if cur not in (None, "") and not a.force:
                skipped.append(f"{tag}: line-up déjà publié, gardé (--force pour écraser)")
                continue
            if eid in seen_ids:
                errors.append(f"{tag}: déjà traité par {seen_ids[eid]} — deux lots se contredisent")
                continue
            seen_ids[eid] = lot.name
            payload = ", ".join('"' + n.replace('"', '\\"') + '"' for n in names)
            lines[i] = re.sub(r" lineup: \[[^\]]*\]", f" lineup: [{payload}]", line, count=1)
            applied.append((eid, title, names, src_url))

    for e in errors:
        print(f"  ✗ {e}")
    for s in skipped:
        print(f"  · {s}")
    for eid, title, names, url in applied:
        print(f"  ✓ {eid:>4} {title}\n         {len(names)} artistes : {', '.join(names[:6])}"
              f"{'…' if len(names) > 6 else ''}\n         {url}")

    print(f"\n{len(applied)} line-up(s) greffé(s), {len(skipped)} ignoré(s), {len(errors)} refusé(s)")
    if a.dry:
        print("(--dry : rien écrit)")
        return 1 if errors else 0
    if applied:
        DATA.write_text("\n".join(lines))
        print(f"→ {DATA.relative_to(HERE.parents[1])} réécrit")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
