#!/usr/bin/env python3
"""
Confirme le tarif d'une fiche déjà publiée, et son lien de billetterie.

`merge.py` ajoute des événements, `lineups/ingest.py` greffe une affiche annoncée
depuis : il manquait la troisième chose qui se périme, le prix. Plus de la moitié du
catalogue à venir porte `priceNote` (« ≈ 45 € » ou « Tarif à venir ») parce que le
tarif n'était pas ouvert le jour de la saisie. Une donnée saisie une fois ne se
re-vérifie jamais toute seule.

Entrée : un JSON par lot dans ce répertoire.

    [{"id": 122, "title": "NDK Festival", "price": 39, "currency": "€",
      "priceNote": null, "ticketUrl": "https://…", "source": "https://…"}]

`title` est le garde-fou contre la dérive d'id, comme dans `lineups/ingest.py` :
un id recopié de travers écrirait un tarif sur la mauvaise soirée, faute invisible.

Règles de contenu, les mêmes que partout :

  * `source` doit être une URL http(s), et c'est la **page où le tarif est affiché**.
  * `priceNote: null` veut dire « lu sur la billetterie », donc affiché sans « ≈ » :
    ne l'écrire que sur une page qui vend vraiment. `"estimated"` pour un tarif
    d'après une source secondaire, `"unknown"` quand rien n'est ouvert.
  * **Le tarif d'entrée est le plus bas réellement vendu**, pas le pass complet :
    S Xpress annoncé « à partir de 71 € » alors que l'organisateur vend 39 €.
  * On stocke **le symbole local, jamais une conversion** : le montant affiché est
    celui qu'on paie à l'entrée (`490 Kč`, pas « ≈ 20 € »).
  * `price: 0` sans note = vraiment gratuit. Un tarif inconnu s'écrit
    `price: 0, priceNote: "unknown"`, jamais 0 tout court.

    python3 .research/prices/ingest.py --dry
    python3 .research/prices/ingest.py
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parents[1] / "lib" / "data.ts"

# Les codes ISO que rendent les agents, ramenés au symbole que le catalogue affiche.
# Même table que `merge.py` : un `currency: "EUR"` s'afficherait « EUR55 ».
CURRENCY_FIX = {
    "EUR": "€", "GBP": "£", "USD": "$", "CZK": "Kč", "PLN": "zł",
    "NOK": "kr", "SEK": "kr", "DKK": "kr", "CHF": "CHF", "HUF": "Ft",
    "RON": "lei", "BGN": "лв", "RSD": "RSD", "дин": "RSD", "ISK": "kr",
    "TRY": "₺", "UAH": "₴",
}
CURRENCIES = set(CURRENCY_FIX.values())

NOTES = {None: "", "": "", "confirmed": "", "estimated": "estimated", "unknown": "unknown"}

# Le garde-fou de vraisemblance se lit dans la devise, pas dans le nombre : 11 400 ISK
# est un pass de festival islandais parfaitement ordinaire, 11 400 € serait une faute de
# saisie. Un plafond unique refusait le premier pour attraper le second. Bornes larges
# exprès, elles ne sont là que pour rattraper un montant en centimes ou une colonne
# recopiée de travers.
CAP = {"€": 5000, "£": 5000, "$": 5000, "CHF": 5000,
       "zł": 20000, "Kč": 120000, "kr": 60000, "Ft": 2000000,
       "lei": 25000, "лв": 10000, "RSD": 600000, "₺": 200000, "₴": 200000}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def read_events(src: str) -> dict:
    """id -> (numéro de ligne, ligne, titre, prix, devise, note)."""
    out = {}
    for i, line in enumerate(src.split("\n")):
        m = re.match(r'\s*\{ id: (\d+), title: "((?:[^"\\]|\\.)*)"', line)
        if not m:
            continue
        price = re.search(r" price: (\d+(?:\.\d+)?)", line)
        cur = re.search(r' currency: "([^"]*)"', line)
        note = re.search(r' priceNote: "([^"]*)"', line)
        out[int(m.group(1))] = (i, line, m.group(2),
                                price.group(1) if price else None,
                                cur.group(1) if cur else None,
                                note.group(1) if note else None)
    return out


def read_tickets(lines: list) -> tuple:
    """(id -> numéro de ligne, ligne d'ouverture, ligne de fermeture) de la map TICKETS."""
    start = next(i for i, l in enumerate(lines) if l.startswith("const TICKETS"))
    end = next(i for i in range(start + 1, len(lines)) if lines[i].startswith("};"))
    idx = {}
    for i in range(start + 1, end):
        # Attention : ces lignes portent un commentaire « // Titre, Ville » en fin de
        # ligne. Un motif qui exige `",$` les rate toutes — c'est comme ça que le lien
        # Ticketmaster de Positiv Festival a été écrasé.
        m = re.match(r'\s*(\d+): "', lines[i])
        if m:
            idx[int(m.group(1))] = i
    return idx, start, end


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="n'écrit rien, montre le diff")
    ap.add_argument("--force", action="store_true",
                    help="écrase un tarif déjà confirmé (sans `priceNote`)")
    ap.add_argument("files", nargs="*", help="lots à lire (défaut : tous les .json du répertoire)")
    a = ap.parse_args()

    lots = [Path(f) for f in a.files] or sorted(p for p in HERE.glob("*.json"))
    if not lots:
        print("aucun lot à lire dans .research/prices/", file=sys.stderr)
        return 1

    src = DATA.read_text()
    lines = src.split("\n")
    events = read_events(src)
    tix, tix_start, tix_end = read_tickets(lines)

    applied, links, skipped, errors = [], [], [], []
    seen_ids, adds = {}, []

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
            i, line, title, old_price, old_cur, old_note = events[eid]
            if norm(r.get("title", "")) != norm(title):
                errors.append(f"{tag}: titre discordant — lot « {r.get('title')} » / catalogue « {title} »")
                continue
            src_url = str(r.get("source", ""))
            if not src_url.startswith(("http://", "https://")):
                errors.append(f"{tag}: `source` manquante ou non http(s)")
                continue
            if eid in seen_ids:
                errors.append(f"{tag}: déjà traité par {seen_ids[eid]} — deux lots se contredisent")
                continue

            url = str(r.get("ticketUrl") or "").strip()
            if url and not url.startswith(("http://", "https://")):
                errors.append(f"{tag}: `ticketUrl` non http(s), ignorée")
                url = ""

            has_price = "price" in r and r["price"] is not None
            if has_price:
                note_key = r.get("priceNote", None)
                if note_key not in NOTES:
                    errors.append(f"{tag}: priceNote « {note_key} » inconnu "
                                  "(null, \"estimated\" ou \"unknown\")")
                    continue
                note = NOTES[note_key]
                try:
                    price = int(round(float(r["price"])))
                except (TypeError, ValueError):
                    errors.append(f"{tag}: prix illisible « {r.get('price')} »")
                    continue
                cur = CURRENCY_FIX.get(str(r.get("currency") or old_cur or "€").strip(),
                                       str(r.get("currency") or old_cur or "€").strip())
                if cur not in CURRENCIES:
                    errors.append(f"{tag}: devise « {cur} » hors catalogue")
                    continue
                if price < 0 or price > CAP[cur]:
                    errors.append(f"{tag}: prix hors bornes ({price} {cur}, plafond {CAP[cur]})")
                    continue
                if price == 0 and note == "":
                    errors.append(f"{tag}: `price: 0` sans note annonce la gratuité — "
                                  "écrire priceNote \"unknown\" si le tarif n'est pas ouvert")
                    continue
                # Une fiche dont le tarif est déjà confirmé ne se réécrit pas sur le lot
                # d'un agent : ce qui est publié ne vaut pas moins que ce qui arrive.
                if old_note is None and not a.force:
                    skipped.append(f"{tag}: tarif déjà confirmé ({old_price} {old_cur}), gardé (--force)")
                    has_price = False
                else:
                    new = re.sub(r" price: \d+(?:\.\d+)?", f" price: {price}", line, count=1)
                    new = re.sub(r' currency: "[^"]*"', f' currency: "{cur}"', new, count=1)
                    new = re.sub(r', priceNote: "[^"]*"', "", new, count=1)
                    # Ancrage en fin de ligne, jamais un `replace()` : une description
                    # ou un line-up peut contenir la même suite de caractères.
                    if note:
                        new, k = re.subn(r" \},\s*$", f', priceNote: "{note}" }},', new)
                        if not k:
                            errors.append(f"{tag}: ligne de catalogue non reconnue, tarif non écrit")
                            continue
                    lines[i] = new
                    line = new
                    events[eid] = (i, new, title, str(price), cur, note or None)
                    applied.append((eid, title, old_price, old_cur, old_note, price, cur, note, src_url))

            if url:
                esc = url.replace("\\", "\\\\").replace('"', '\\"')
                if eid in tix:
                    j = tix[eid]
                    old = re.match(r'\s*\d+: "((?:[^"\\]|\\.)*)"', lines[j]).group(1)
                    if old == esc:
                        pass
                    elif not a.force and not r.get("replaceTicket"):
                        skipped.append(f"{tag}: billetterie déjà en place ({old}), gardée "
                                       "(--force ou \"replaceTicket\": true)")
                    else:
                        comment = re.search(r"(\s*//.*)$", lines[j])
                        lines[j] = f'  {eid}: "{esc}",' + (comment.group(1) if comment else "")
                        links.append((eid, title, old, url))
                else:
                    adds.append((eid, esc, title))
                    links.append((eid, title, None, url))

            if not has_price and not url:
                skipped.append(f"{tag}: rien à écrire (ni prix ni billetterie)")
                continue
            seen_ids[eid] = lot.name

    # Insertion des nouvelles billetteries avant l'accolade fermante de TICKETS : on
    # vise la déclaration, jamais un commentaire voisin (cf. l'ancre cassée de merge.py).
    if adds:
        block = [f'  {eid}: "{url}", // {title}' for eid, url, title in sorted(adds)]
        lines[tix_end:tix_end] = block

    for e in errors:
        print(f"  ✗ {e}")
    for s in skipped:
        print(f"  · {s}")
    for eid, title, op, oc, on, p, c, n, url in applied:
        was = f"{op} {oc}" + (f" ({on})" if on else " (confirmé)")
        now = f"{p} {c}" + (f" ({n})" if n else " (confirmé)")
        print(f"  ✓ {eid:>4} {title}\n         {was} → {now}\n         {url}")
    for eid, title, old, url in links:
        print(f"  🎟 {eid:>4} {title}\n         {'remplace ' + old if old else 'billetterie'} → {url}")

    print(f"\n{len(applied)} tarif(s) écrit(s), {len(links)} billetterie(s), "
          f"{len(skipped)} ignoré(s), {len(errors)} refusé(s)")
    if a.dry:
        print("(--dry : rien écrit)")
        return 1 if errors else 0
    if applied or links:
        DATA.write_text("\n".join(lines))
        print(f"→ {DATA.relative_to(HERE.parents[1])} réécrit")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
