#!/usr/bin/env python3
"""Comble les derniers trous d'images par emprunt entre éditions d'un même festival.

  python3 .research/photos/fill_alias.py --dry
  python3 .research/photos/fill_alias.py

À lancer APRÈS ingest.py. Un événement sans visuel emprunte celui d'un autre
événement au **titre strictement identique** — c'est-à-dire une autre édition du
même festival, ce que `nextEdition()` regroupe déjà. On ne rapproche jamais deux
titres seulement « proches » : « Verknipt Festival » et « Verknipt ADE » sont deux
line-ups différents, et se tromper d'affiche est pire que le dégradé de genre.
"""
import argparse, re
from pathlib import Path

DATA_TS = Path(__file__).resolve().parents[2] / "lib" / "data.ts"
START, END = "/* ALIAS:start */\n", "/* ALIAS:end */"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    src = DATA_TS.read_text()

    def keys(name):
        b = src[src.index(f"export const {name}: Record<number, string> = {{"):]
        b = b[: b.index("\n};")]
        return {int(m) for m in re.findall(r"^\s*(\d+):", b, re.M)}

    illustrated = keys("IMAGES") | keys("PHOTOS")

    events = {}
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        eid = int(re.search(r"id: (\d+)", line).group(1))
        t = re.search(r'title: "((?:[^"\\]|\\.)*)"', line)
        d = re.search(r'date: "([\d-]+)"', line)
        events[eid] = (t.group(1) if t else "", d.group(1) if d else "")

    by_title = {}
    for eid, (title, _) in events.items():
        if eid in illustrated:
            by_title.setdefault(title, []).append(eid)

    alias = {}
    for eid, (title, _) in sorted(events.items()):
        if eid in illustrated or title not in by_title:
            continue
        # la source la plus récente parmi les éditions illustrées du même festival
        alias[eid] = max(by_title[title], key=lambda i: events[i][1])

    lines = [
        f'  {eid}: {src_id}, // {events[eid][0]} {events[eid][1][:4]} ← édition {events[src_id][1][:4]}'
        for eid, src_id in sorted(alias.items())
    ]
    body = "const IMAGE_ALIAS: Record<number, number> = {" + ("\n" + "\n".join(lines) + "\n" if lines else "") + "};\n"
    i, j = src.index(START) + len(START), src.index(END)
    if not args.dry:
        DATA_TS.write_text(src[:i] + body + src[j:])

    still = [e for e in events if e not in illustrated and e not in alias]
    print(f"illustrés (image propre) : {len(illustrated)}")
    print(f"alias posés              : {len(alias)}")
    for eid, s in sorted(alias.items()):
        print(f"    {eid} {events[eid][0]} ({events[eid][1]}) ← {s} ({events[s][1]})")
    print(f"toujours sans image      : {len(still)} → {sorted(still)}")
    if args.dry:
        print("\n(--dry : rien n'a été écrit)")


if __name__ == "__main__":
    main()
