#!/usr/bin/env python3
"""
Génère la favicon du site — de vrais fichiers, et c'est tout le sujet.

`app/(fr|en)/layout.tsx` déclarait l'icône en `data:image/svg+xml,...`. Un navigateur
l'affiche très bien, **Google non** : sa documentation demande un fichier que
Googlebot puisse *explorer*, à une URL stable et non bloquée par robots.txt — un URI
`data:` n'est pas une URL, il n'y a rien à demander, donc rien à indexer, et le
résultat de recherche retombe sur le globe générique. Même exigence pour la taille :
un multiple de 48 px, carré.

Rien à installer : PNG écrit à la main (zlib est dans la bibliothèque standard), ICO
assemblé autour de ces PNG (conteneur accepté par tous les navigateurs actuels).
Anticrénelage par suréchantillonnage — on rend à SS fois la taille puis on moyenne.

    python3 scripts/favicon.py

Le motif : le point de la nav (`.brand .dot`) devenu radar — un point central et deux
ondes concentriques, dans le dégradé de marque `--grad-main` sur le noir du site.
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public"

# Les couleurs du site (app/globals.css), pas une approximation.
BLACK = (0x0A, 0x0B, 0x11)
STOPS = [(0.0, (0x2F, 0x7B, 0xFF)), (0.48, (0x8B, 0x5C, 0xFF)), (1.0, (0xFF, 0x2D, 0x9B))]

# Géométrie en fraction du côté. Le rayon extérieur reste sous 0,44 : les surfaces qui
# recadrent une favicon en cercle (Google en tête) mordent les bords.
DOT_R = 0.105
RINGS = [(0.250, 0.037), (0.395, 0.034)]


def grad(x: float, y: float) -> tuple:
    """Le dégradé à 115° de `--grad-main`, échantillonné en (x, y) normalisés."""
    dx, dy = math.sin(math.radians(115)), -math.cos(math.radians(115))
    t = ((x - 0.5) * dx + (y - 0.5) * dy) / (abs(dx) + abs(dy)) + 0.5
    t = min(1.0, max(0.0, t))
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return STOPS[-1][1]


def render(size: int, ss: int = 4) -> bytes:
    """RGBA brut, rendu à `size * ss` puis moyenné vers `size`."""
    n = size * ss
    big = bytearray(n * n * 4)
    for py in range(n):
        y = (py + 0.5) / n
        for px in range(n):
            x = (px + 0.5) / n
            d = math.hypot(x - 0.5, y - 0.5)
            i = (py * n + px) * 4
            if d > 0.5:  # hors du disque : transparent, la surface hôte décide du fond
                continue
            ink = d <= DOT_R or any(abs(d - r) <= w for r, w in RINGS)
            r, g, b = grad(x, y) if ink else BLACK
            big[i : i + 4] = bytes((r, g, b, 255))

    out = bytearray(size * size * 4)
    area = ss * ss
    for oy in range(size):
        for ox in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                base = ((oy * ss + sy) * n + ox * ss) * 4
                for sx in range(ss):
                    px = big[base + sx * 4 : base + sx * 4 + 4]
                    # Prémultiplié : moyenner la couleur d'un pixel transparent
                    # ramènerait du noir sur le bord du disque.
                    a = px[3]
                    acc[0] += px[0] * a
                    acc[1] += px[1] * a
                    acc[2] += px[2] * a
                    acc[3] += a
            i = (oy * size + ox) * 4
            a = acc[3] // area
            if a == 0:
                continue
            out[i : i + 4] = bytes((acc[0] // acc[3], acc[1] // acc[3], acc[2] // acc[3], a))
    return bytes(out)


def png(size: int, rgba: bytes) -> bytes:
    raw = b"".join(b"\x00" + rgba[y * size * 4 : (y + 1) * size * 4] for y in range(size))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def ico(entries: list) -> bytes:
    """Conteneur ICO à charges PNG (accepté partout depuis Vista / IE11)."""
    head = struct.pack("<HHH", 0, 1, len(entries))
    offset = 6 + 16 * len(entries)
    dirs, blobs = b"", b""
    for size, blob in entries:
        dirs += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
        blobs += blob
    return head + dirs + blobs


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cache: dict = {}

    def blob(size: int) -> bytes:
        if size not in cache:
            # Le suréchantillonnage coûte le carré du facteur : on l'abaisse sur les
            # grandes tailles, où un pixel pèse de toute façon moins.
            cache[size] = png(size, render(size, 4 if size <= 192 else 2))
            print(f"  {size:>3}px  {len(cache[size]):>6} o")
        return cache[size]

    # Google lit d'abord le .ico de la racine et veut un multiple de 48.
    (OUT / "favicon.ico").write_bytes(ico([(s, blob(s)) for s in (16, 32, 48)]))
    for size, name in ((48, "icon.png"), (96, "icon-96.png"), (192, "icon-192.png"),
                       (512, "icon-512.png"), (180, "apple-touch-icon.png")):
        (OUT / name).write_bytes(blob(size))
        print(f"  → public/{name}")
    print(f"  → public/favicon.ico ({(OUT / 'favicon.ico').stat().st_size} o)")


if __name__ == "__main__":
    main()
