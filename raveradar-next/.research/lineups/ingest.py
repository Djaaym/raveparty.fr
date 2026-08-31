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
    r"secret guest|special guest|guest|and more|\+ more|others?|various artists?|va|"
    # « A-Z » est l'en-tête d'une liste d'affiche triée alphabétiquement, pas un nom :
    # recopié tel quel, il ouvre une fiche `/artistes/a-z` qu'aucune date ne remplit.
    r"a\s?-\s?z|a to z|by name|alphabetical)$",
    re.I,
)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


# `lineup: [...]` ne se délimite pas sur le premier `]` : « Daniel[i] » est un nom
# d'artiste de l'affiche Meakusma, et un motif `[^\]]*` s'arrête dessus, donc écrit le
# nouveau tableau **avant** la fin de l'ancien et casse `data.ts` 800 pages plus loin.
# Le `]` qui ferme est celui qu'on rencontre hors chaîne : c'est ce que dit ce motif,
# en n'avalant les crochets que lorsqu'ils sont entre guillemets. Même raison pour la
# lambda à l'écriture : `re.sub` relit les échappements du remplacement, donc un nom
# portant un backslash y deviendrait une référence de groupe.
LINEUP = re.compile(r' lineup: \[((?:[^"\[\]]|"(?:[^"\\]|\\.)*")*)\]')


def read_events(src: str) -> dict:
    """id -> (numéro de ligne, ligne, titre, line-up actuel)."""
    out = {}
    for i, line in enumerate(src.split("\n")):
        m = re.match(r"\s*\{ id: (\d+), title: \"((?:[^\"\\]|\\.)*)\"", line)
        if not m:
            continue
        cur = LINEUP.search(line)
        out[int(m.group(1))] = (i, line, m.group(2), (cur.group(1).strip() if cur else None))
    return out


# Un b2b n'est pas un artiste. `lineup` alimente `buildArtists()` via `slugify(name)` :
# « Miss K8 b2b Mad Dog » créerait `/artistes/miss-k8-b2b-mad-dog`, une fiche à une date
# et sans portrait, au lieu de renforcer les deux fiches qui existent déjà. C'est
# exactement la page satellite que le projet refuse partout ailleurs. On sépare.
B2B = re.compile(r"\s+(?:b2b|b3b|vs\.?)\s+", re.I)

# Une entrée d'affiche qui énumère trois noms séparés par des virgules est une liste,
# pas un artiste — « Brandon Lopez, Gerald Cleaver, Pat Thomas » sont trois musiciens.
# À deux parts seulement on ne coupe pas : le doute existe (un nom de scène peut porter
# une virgule), et deux noms passent de toute façon sous la longueur qui alerte.
LIST = re.compile(r"\s*,\s*")

# Ce qui suit annonce une œuvre, pas un co-artiste : « Ambassade pres. Manrira »,
# « Dave Huismans presents ex_libris LIVE », « Slikback feat. maltdisney ». L'interprète
# est à gauche — c'est lui qui a une fiche, le titre de la pièce n'en aura jamais.
CUT_AT = re.compile(r"\s+(?:presents?|pres\.|performs?|plays|feat\.|featuring|invite[sz]?)\s+", re.I)

# Une parenthèse qui contient une espace ou une virgule décrit le format ou la
# distribution — « (A/V Show) », « (dj set) », « (Michael Thieke, Tom Malmendier) ».
# Une parenthèse courte et compacte est au contraire la convention de désambiguïsation
# du catalogue (« Jazzy (CH) », « Michaela (Collide) ») : on la garde.
PAREN = re.compile(r"\s*\([^)]*[ ,][^)]*\)\s*$")

# Reste après nettoyage : un titre d'œuvre que le nettoyage n'a pas su couper. Il se
# reconnaît à une **paire** de guillemets, ou à une longueur déraisonnable — surtout pas
# à l'apostrophe seule : « Ak'chamel » et « D'Angelo » sont des noms d'artistes, et
# l'apostrophe typographique ’ est le même caractère que le guillemet fermant.
WORK_TITLE = re.compile(r"[«»“”\"]|‘[^’]*’")
MAX_LEN = 48


def clean(names, tag, errors) -> list:
    """Noms d'artistes : b2b séparés, œuvres coupées, formats retirés, dédupliqués."""
    out, seen = [], set()
    for raw in names:
        n0 = re.sub(r"\s+", " ", str(raw)).strip().strip(",;")
        n0 = PAREN.sub("", n0)
        n0 = CUT_AT.split(n0)[0].strip()
        parts = B2B.split(n0)
        if len(parts) == 1 and len(LIST.split(n0)) >= 3:
            parts = LIST.split(n0)
        for n in (x.strip() for x in parts):
            n = PAREN.sub("", n).strip().strip(",;")
            if not n or NOT_AN_ARTIST.match(n):
                continue
            if WORK_TITLE.search(n) or len(n) > MAX_LEN:
                # Écarté, pas refusé : un lot de 147 noms ne se jette pas pour un titre
                # d'œuvre. Mais jamais en silence — c'est une ligne d'affiche perdue,
                # l'opérateur doit pouvoir la rattraper à la main.
                errors.append(f"{tag}: « {n} » écarté, ressemble à un titre d'œuvre plutôt qu'à un artiste")
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
    ap.add_argument("--merge", action="store_true",
                    help="ajoute les noms manquants à un line-up déjà publié, sans en retirer")
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
            names = clean(r.get("lineup", []), tag, errors)
            if not names:
                errors.append(f"{tag}: line-up vide après nettoyage — rien à greffer")
                continue
            if cur not in (None, ""):
                # Un lot d'agent complète une affiche partielle bien plus souvent qu'il
                # ne la corrige : la fusion est donc le mode utile, et le seul qui ne
                # puisse rien perdre. Un nom publié absent du lot n'est pas une erreur
                # de l'affiche, c'est une source que l'agent n'a pas lue — le remplacer
                # à l'aveugle retirerait Modeselektor de Waterworks. L'ordre du
                # catalogue passe devant, les nouveaux noms suivent.
                published = re.findall(r'"((?:[^"\\]|\\.)*)"', cur)
                if a.merge:
                    have = {norm(n) for n in published}
                    add = [n for n in names if norm(n) not in have]
                    if not add:
                        skipped.append(f"{tag}: rien à ajouter, les {len(published)} noms publiés couvrent le lot")
                        continue
                    names = published + add
                elif not a.force:
                    skipped.append(f"{tag}: line-up déjà publié, gardé "
                                   "(--merge pour compléter, --force pour écraser)")
                    continue
            if eid in seen_ids:
                errors.append(f"{tag}: déjà traité par {seen_ids[eid]} — deux lots se contredisent")
                continue
            seen_ids[eid] = lot.name
            payload = ", ".join('"' + n.replace('"', '\\"') + '"' for n in names)
            lines[i] = LINEUP.sub(lambda _: f" lineup: [{payload}]", line, count=1)
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
