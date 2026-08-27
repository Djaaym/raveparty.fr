#!/usr/bin/env python3
"""Régénère le visuel de garde de la page d'accueil en WebP responsive.

  python3 scripts/hero-image.py https://…/nouveau-visuel.png
  python3 scripts/hero-image.py /chemin/local.png

Écrit public/hero/rave-{hash}-{768,1280,1920}.webp et rappelle la constante
`HERO_BASE` à mettre à jour dans components/Hero.tsx.

Pourquoi trois largeurs et pas une : l'image couvre toute la largeur du viewport
(`sizes="100vw"`), donc un mobile de 412 px ne doit pas payer les octets d'un
écran 27 pouces. Le hash du fichier source est dans le nom : c'est ce qui rend le
fichier immuable, donc cacheable un an (voir `headers()` dans next.config.mjs).

La qualité est basse à dessein (70) : le visuel est peint à 42 % d'opacité derrière
un masque radial, aucun détail n'y survit de toute façon.
"""
import hashlib, subprocess, sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public" / "hero"
WIDTHS = (768, 1280, 1920)
QUALITY = 70


def main(src: str) -> int:
    raw = (
        subprocess.run(["curl", "-sL", "-m", "120", src], capture_output=True, check=True).stdout
        if src.startswith("http")
        else Path(src).read_bytes()
    )
    digest = hashlib.sha1(raw).hexdigest()[:10]
    tmp = OUT.parent / f".hero-src-{digest}"
    OUT.mkdir(parents=True, exist_ok=True)
    tmp.write_bytes(raw)
    im = Image.open(tmp).convert("RGB")
    for w in WIDTHS:
        if w > im.width:
            continue
        out = OUT / f"rave-{digest}-{w}.webp"
        im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(
            out, "WEBP", quality=QUALITY, method=6
        )
        print(f"  {out.relative_to(OUT.parents[1])}  {out.stat().st_size / 1024:.0f} Ko")
    tmp.unlink()
    print(f'\ncomponents/Hero.tsx → const HERO_BASE = "/hero/rave-{digest}";')
    print("Supprimer les fichiers de l'ancien hash : ils ne servent plus.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
