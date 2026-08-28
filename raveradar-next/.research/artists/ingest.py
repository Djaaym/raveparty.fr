#!/usr/bin/env python3
"""Ingère les bios d'artistes trouvées par les agents dans lib/bios.ts.

  python3 .research/artists/ingest.py --dry    # rapport sans rien écrire
  python3 .research/artists/ingest.py          # valide et réécrit la map BIOS

Lit tous les `bios-*.json` de ce répertoire. Chaque fichier est une liste d'objets :

  {
    "name":    "Charlotte de Witte",         # nom EXACT tel qu'il figure dans un lineup
    "bio_fr":  "…", "bio_en": "…",           # 2 à 4 phrases, faits uniquement
    "origin":  "Gand, Belgique",             # optionnel
    "since":   2010,                         # optionnel
    "labels":  ["KNTXT"],                    # optionnel
    "sources": ["https://…", "https://…"]    # obligatoire, ≥1, http(s)
  }

Le script refuse tout ce qui n'est pas vérifiable ou pas rattachable :

- une bio sans source, ou dont les sources ne sont pas des URL http(s) ;
- un artiste dont le slug n'apparaît dans AUCUN lineup de data.ts — c'est le
  signe d'une faute de frappe sur le nom, et la page n'existerait pas ;
- une bio trop courte (moins de 120 signes : ça n'apporte rien) ou trop longue
  (plus de 700 : ce n'est plus un résumé) ;
- les formules creuses non sourçables ("l'un des plus grands", "légende
  vivante"…), qui sont vraies de personne et imprimables sur tout le monde.

La dédup se fait sur le slug ; en cas de doublon, l'entrée qui cite le plus de
sources gagne. La map est réécrite entre les marqueurs BIOS:start / BIOS:end —
ne pas l'éditer à la main.

Le **portrait ne passe plus par ici** : il vit dans lib/artist-photos.ts, écrit par
avatars.py. Il était rattaché à la bio, ce qui rendait la photo conditionnée au texte —
un artiste dont on trouvait le portrait sur Commons sans savoir écrire deux phrases
sourcées restait affiché avec son initiale.
"""
import argparse, json, re, sys, unicodedata
from pathlib import Path

# Un artiste du catalogue s'appelle littéralement « [IVY] ». Un `\[(.*?)\]` non gourmand
# s'arrête donc sur SON crochet et tronque le line-up : les noms qui suivent
# disparaissent de l'index, sans erreur ni message. On ne reconnaît que des chaînes
# entre guillemets, ce qu'un crochet ne peut pas interrompre.
LINEUP = re.compile(r'lineup: \[((?:"(?:[^"\\]|\\.)*"(?:, )?)*)\]')

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DATA_TS = ROOT / "lib" / "data.ts"
BIOS_TS = ROOT / "lib" / "bios.ts"

MIN_LEN, MAX_LEN = 120, 700

# Tournures qui signalent une bio écrite de mémoire plutôt que lue quelque part.
PUFF = re.compile(
    r"\b(l'un des plus|une des plus|légende vivante|incontournable|mythique|"
    r"figure emblématique|sans conteste|indiscutablement|le meilleur|la meilleure|"
    r"one of the most|living legend|undisputed|iconic figure|the greatest)\b",
    re.I,
)


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def lineup_slugs() -> dict:
    """slug -> nom tel qu'écrit dans data.ts (le premier rencontré fait foi)."""
    src = DATA_TS.read_text()
    out = {}
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        m = LINEUP.search(line)
        if not m:
            continue
        for name in re.findall(r'"([^"]+)"', m.group(1)):
            out.setdefault(slugify(name.strip()), name.strip())
    return out


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    known = lineup_slugs()
    files = sorted(HERE.glob("bios-*.json"))
    if not files:
        print("Aucun fichier bios-*.json dans .research/artists/")
        return 1

    kept, rejected = {}, []
    for f in files:
        try:
            rows = json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"✗ {f.name} : JSON invalide ({e})")
            return 1
        for r in rows:
            name = (r.get("name") or "").strip()
            slug = slugify(name)
            why = None
            srcs = [s for s in (r.get("sources") or []) if isinstance(s, str) and s.startswith("http")]
            fr, en = (r.get("bio_fr") or "").strip(), (r.get("bio_en") or "").strip()

            if not slug:
                why = "nom vide"
            elif slug not in known:
                why = "n'apparaît dans aucun lineup (faute de frappe ?)"
            elif not srcs:
                why = "aucune source http(s)"
            elif not fr or not en:
                why = "bio_fr ou bio_en manquante"
            elif not (MIN_LEN <= len(fr) <= MAX_LEN):
                why = f"bio_fr hors bornes ({len(fr)} signes)"
            elif not (MIN_LEN <= len(en) <= MAX_LEN):
                why = f"bio_en hors bornes ({len(en)} signes)"
            elif PUFF.search(fr) or PUFF.search(en):
                why = "formule creuse non sourçable"

            if why:
                rejected.append((name or "(sans nom)", f.name, why))
                continue

            entry = {"slug": slug, "name": known[slug], "fr": fr, "en": en, "srcs": srcs,
                     "origin": (r.get("origin") or "").strip(), "since": r.get("since"),
                     "labels": [l.strip() for l in (r.get("labels") or []) if isinstance(l, str) and l.strip()]}
            prev = kept.get(slug)
            if prev is None or len(srcs) > len(prev["srcs"]):
                kept[slug] = entry

    print(f"{len(files)} fichier(s) · {len(kept)} bio(s) retenue(s) · {len(rejected)} rejetée(s)")
    for name, f, why in rejected:
        print(f"  ✗ {name:32} [{f}] {why}")
    if not kept:
        return 1

    lines = []
    for slug in sorted(kept):
        e = kept[slug]
        extra = ""
        if e["origin"]:
            extra += f', origin: "{esc(e["origin"])}"'
        if isinstance(e["since"], int):
            extra += f', since: {e["since"]}'
        if e["labels"]:
            extra += ", labels: [" + ", ".join(f'"{esc(l)}"' for l in e["labels"]) + "]"
        srcs = ", ".join(f'"{esc(s)}"' for s in e["srcs"])
        lines.append(
            f'  "{slug}": {{ slug: "{slug}", bio: {{ fr: "{esc(e["fr"])}", en: "{esc(e["en"])}" }}'
            f'{extra}, sources: [{srcs}] }}, // {e["name"]}'
        )

    block = "export const BIOS: Record<string, ArtistBio> = {\n" + "\n".join(lines) + "\n};"
    src = BIOS_TS.read_text()
    start, end = src.index("/* BIOS:start"), src.index("/* BIOS:end")
    head = src[: src.index("\n", start) + 1]
    new = head + block + "\n" + src[end:]

    if args.dry:
        print(f"\n--dry : {len(kept)} entrées prêtes, lib/bios.ts inchangé.")
        return 0
    BIOS_TS.write_text(new)
    print(f"\n✓ lib/bios.ts réécrit — {len(kept)} bios.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
