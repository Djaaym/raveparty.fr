#!/usr/bin/env python3
"""
Remplace la description d'une fiche déjà publiée, en FR et en EN.

Troisième chaîne du même motif que `.research/lineups/` et `.research/prices/`, et
elle manquait. `merge.py` ajoute des événements, `lineups/ingest.py` greffe une
affiche annoncée depuis, `prices/ingest.py` confirme un tarif : rien ne savait
corriger le texte. Or `desc` est ce qui décide de la valeur d'une fiche pour un
lecteur arrivé de Google, et le relevé d'audience le montre en clair, les fiches à
description courte sont aussi celles qui tiennent 7 à 10 secondes d'attention quand
la moyenne du site est à 23.

Entrée : un JSON par lot dans ce répertoire.

    [{"id": 376, "title": "FCKNYE Festival", "desc": "…", "descEn": "…",
      "source": "https://…"}]

`title` est le garde-fou contre la dérive d'id, exactement comme dans les deux
chaînes jumelles : un id recopié de travers écrirait la description d'un festival
sur la fiche d'un autre, faute invisible à la relecture du lot.

Règles de contenu, les mêmes que partout :

  * `source` doit être une URL http(s), la page où l'information est visible.
  * Rien d'inventé. Une description est un résumé de faits publiés, pas une
    impression : ce script ne peut pas le vérifier, la relecture si.
  * **Aucun tiret cadratin.** La règle vaut pour tout le dépôt, et une description
    est du contenu publié : le caractère est refusé à l'entrée plutôt que corrigé
    en silence, pour que l'opérateur voie ce que le lot a produit.
  * Une seule ligne. `merge.py` écrit `desc` sur une ligne et son échappement ne
    couvre que `\\` et `"` : un retour à la ligne casse `data.ts` au build, des
    milliers de pages plus loin, et le diagnostic n'est pas évident.
  * `descEn` vide supprime la traduction et `/en` retombe sur le français. Laisser
    une version anglaise sous un texte français réécrit ferait dire deux choses
    différentes à la même fiche, et c'est l'anglaise qui serait fausse.

Par défaut une description déjà publiée n'est **pas** écrasée, même règle que pour
un line-up : le lot d'un agent ne vaut pas mieux que ce qui est en ligne. `--grow`
accepte le remplacement quand le nouveau texte apporte vraiment de la matière,
`--force` passe outre.

    python3 .research/descs/ingest.py --dry --grow
    python3 .research/descs/ingest.py --grow
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parents[1] / "lib" / "data.ts"

# Bornes de bon sens. En dessous, le texte n'apprend rien de plus que le gabarit de la
# fiche, qui affiche déjà le lieu, la ville et les dates. Au-dessus, ce n'est plus une
# description mais un guide, et le dépôt a `lib/guides.ts` pour ça.
MIN_LEN = 120
MAX_LEN = 900

# Ce qui gagne à remplacer un texte publié : au moins un tiers de matière en plus.
# Sous ce seuil, deux descriptions équivalentes se valent, et celle qui est en ligne a
# l'avantage d'avoir été relue.
GROW_RATIO = 1.3

EM_DASH = "—"

# Les deux champs se lisent séparément : ` desc: ` ne peut pas attraper ` descEn: `,
# la lettre qui suit n'étant pas un deux-points. Le corps admet les guillemets
# échappés, sinon une description citant une salle entre guillemets couperait court.
DESC = re.compile(r' desc: "((?:[^"\\]|\\.)*)"')
DESC_EN = re.compile(r' descEn: "((?:[^"\\]|\\.)*)"')


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def esc(s: str) -> str:
    """Le même échappement que `merge.py`, et pas un de plus : `data.ts` est du
    TypeScript, pas du JSON, et sur-échapper produirait des antislashs visibles."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def read_events(src: str) -> dict:
    """id -> (numéro de ligne, ligne, titre, desc actuelle, descEn actuelle)."""
    out = {}
    for i, line in enumerate(src.split("\n")):
        m = re.match(r"\s*\{ id: (\d+), title: \"((?:[^\"\\\\]|\\\\.)*)\"", line)
        if not m:
            continue
        d, e = DESC.search(line), DESC_EN.search(line)
        out[int(m.group(1))] = (i, line, m.group(2), d.group(1) if d else None, e.group(1) if e else None)
    return out


def check(text: str, field: str, tag: str, errors: list):
    """Rend le texte nettoyé, ou None si le lot doit être refusé."""
    if text is None:
        return None
    t = str(text).strip()
    if not t:
        return ""
    if "\n" in t or "\r" in t or "\t" in t:
        errors.append(f"{tag}: `{field}` contient un retour à la ligne, ce qui casse data.ts au build")
        return None
    if EM_DASH in t:
        errors.append(f"{tag}: `{field}` contient un tiret cadratin, interdit dans tout le dépôt")
        return None
    if any(unicodedata.category(c) == "Cc" for c in t):
        errors.append(f"{tag}: `{field}` contient un caractère de contrôle")
        return None
    if len(t) < MIN_LEN:
        errors.append(f"{tag}: `{field}` fait {len(t)} caractères, sous le minimum de {MIN_LEN}")
        return None
    if len(t) > MAX_LEN:
        errors.append(f"{tag}: `{field}` fait {len(t)} caractères, au-dessus du maximum de {MAX_LEN}")
        return None
    return re.sub(r"\s+", " ", t)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="n'écrit rien, montre ce qui changerait")
    ap.add_argument("--grow", action="store_true",
                    help=f"remplace une description publiée si la nouvelle est {GROW_RATIO}x plus longue")
    ap.add_argument("--force", action="store_true", help="remplace une description publiée sans condition")
    ap.add_argument("files", nargs="*", help="lots à lire (défaut : tous les .json du répertoire)")
    a = ap.parse_args()

    lots = [Path(f) for f in a.files] or sorted(p for p in HERE.glob("*.json"))
    if not lots:
        print("aucun lot à lire dans .research/descs/", file=sys.stderr)
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
            i, line, title, cur, cur_en = events[eid]
            if norm(r.get("title", "")) != norm(title):
                errors.append(f"{tag}: titre discordant, lot « {r.get('title')} » / catalogue « {title} »")
                continue
            if not str(r.get("source", "")).startswith(("http://", "https://")):
                errors.append(f"{tag}: `source` manquante ou non http(s)")
                continue
            if eid in seen_ids:
                errors.append(f"{tag}: déjà traité par {seen_ids[eid]}, deux lots se contredisent")
                continue

            new = check(r.get("desc"), "desc", tag, errors)
            if new is None and "desc" in r:
                continue
            new_en = check(r.get("descEn"), "descEn", tag, errors) if "descEn" in r else None
            if new_en is None and "descEn" in r and r.get("descEn"):
                continue
            if not new:
                errors.append(f"{tag}: aucune `desc` utilisable dans le lot")
                continue
            if cur and norm(cur) == norm(new):
                skipped.append(f"{tag}: description identique à celle publiée")
                continue
            if cur and not a.force:
                if not a.grow:
                    skipped.append(f"{tag}: description déjà publiée, gardée "
                                   "(--grow pour remplacer si le lot apporte de la matière, --force sans condition)")
                    continue
                if len(new) < len(cur) * GROW_RATIO:
                    skipped.append(f"{tag}: {len(cur)} → {len(new)} caractères, pas assez pour remplacer "
                                   f"un texte relu (seuil {GROW_RATIO}x)")
                    continue

            out = DESC.sub(lambda _: f' desc: "{esc(new)}"', line, count=1)
            if new_en is not None:
                if cur_en is not None:
                    out = DESC_EN.sub(lambda _: f' descEn: "{esc(new_en)}"', out, count=1)
                elif new_en:
                    # Pas de `descEn` sur la ligne : on la pose juste après `desc`, là où
                    # le reste du catalogue la porte, pour que les fiches se relisent pareil.
                    out = DESC.sub(lambda m: m.group(0) + f', descEn: "{esc(new_en)}"', out, count=1)
            lines[i] = out
            seen_ids[eid] = lot.name
            applied.append((eid, title, cur, new, new_en, str(r["source"])))

    for e in errors:
        print(f"  ✗ {e}")
    for s in skipped:
        print(f"  · {s}")
    for eid, title, cur, new, new_en, url in applied:
        print(f"  ✓ {eid:>4} {title}")
        print(f"         desc   {len(cur or '')} → {len(new)} caractères")
        print(f"         {new[:150]}{'…' if len(new) > 150 else ''}")
        if new_en is not None:
            print(f"         descEn {len(new_en)} caractères" if new_en else "         descEn vidée")
        print(f"         {url}")

    print(f"\n{len(applied)} description(s) remplacée(s), {len(skipped)} ignorée(s), {len(errors)} refusée(s)")
    if a.dry:
        print("(--dry : rien écrit)")
        return 1 if errors else 0
    if applied:
        DATA.write_text("\n".join(lines))
        print(f"→ {DATA.relative_to(HERE.parents[1])} réécrit")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
