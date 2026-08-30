#!/usr/bin/env python3
"""Ingère les comptes sociaux trouvés par les agents dans lib/socials.ts.

  python3 .research/socials/ingest.py --dry     # rapport, n'écrit rien
  python3 .research/socials/ingest.py           # patche lib/socials.ts

Le garde-fou principal est la clé : `key` doit exister *à l'identique* dans
lib/data.ts (un titre d'événement, un `venue`, ou un nom de line-up). Une clé
approximative (accent oublié, « Sonar » pour « Sónar ») est rejetée avec son
motif au lieu de créer une entrée que personne n'ira jamais chercher.

Le second garde-fou est `verified` : pas de preuve, pas d'entrée. C'est la même
règle que `sources` dans lib/bios.ts, pour la même raison, un lien social faux
envoie le lecteur chez quelqu'un d'autre, et nous fait mentir en public.
"""
import argparse, json, re, subprocess, sys, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = Path(__file__).resolve().parent
DATA_TS = ROOT / "lib" / "data.ts"
SOCIALS_TS = ROOT / "lib" / "socials.ts"

START, END = "/* SOCIALS:start */\n", "/* SOCIALS:end */"

NETWORKS = ["instagram", "site", "facebook", "tiktok", "youtube",
            "soundcloud", "spotify", "bandcamp", "x", "ra"]
# Réseaux stockés sous forme de handle : une URL entière y est ramenée au pseudo.
HANDLE_NETS = {"instagram", "tiktok", "x", "soundcloud"}
KINDS = {"event": "EVENT_SOCIALS", "venue": "VENUE_SOCIALS", "artist": "ARTIST_SOCIALS"}

HANDLE_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,28}[A-Za-z0-9_])?$")
# Chemins réservés d'Instagram : un « handle » qui vaut `explore` ou `reel` vient
# d'une URL mal découpée, pas d'un compte.
RESERVED = {"p", "reel", "reels", "explore", "accounts", "stories", "tv", "s",
            "about", "developer", "legal", "privacy", "instagram", "directory"}
SHORTCODE_RE = re.compile(r"instagram\.com/(?:[A-Za-z0-9._]+/)?(?:p|reel|tv)/([A-Za-z0-9_-]+)")
MAX_POSTS = 6


def slugify(s: str) -> str:
    """Doit rester le miroir de `slugify()` dans lib/data.ts, c'est la clé des maps."""
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def known_keys():
    """Les titres, salles et artistes réellement présents dans le catalogue."""
    src = DATA_TS.read_text()
    titles, venues, artists = set(), set(), set()
    for line in re.findall(r"^  \{ id: \d+,.*$", src, re.M):
        def f(k):
            m = re.search(r"\b" + k + r': "((?:[^"\\]|\\.)*)"', line)
            return m.group(1).replace('\\"', '"') if m else None
        if t := f("title"):
            titles.add(t)
        if v := f("venue"):
            venues.add(v)
        m = re.search(r"lineup: \[([^\]]*)\]", line)
        if m:
            for name in re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)):
                artists.add(name.replace('\\"', '"').strip())
    return {"event": titles, "venue": venues, "artist": artists}


def norm_value(net: str, raw: str, reject) -> str | None:
    """Ramène un champ à sa forme canonique : handle nu, ou URL https complète."""
    v = (raw or "").strip()
    if not v:
        return None
    if net in HANDLE_NETS:
        if v.startswith("http"):
            m = re.match(r"https?://(?:www\.)?[^/]+/(?:@)?([^/?#]+)", v)
            if not m:
                return reject(f"URL {net} illisible : {v}")
            v = m.group(1)
        v = v.lstrip("@").rstrip("/")
        if not HANDLE_RE.match(v):
            return reject(f"handle {net} invalide : {v!r}")
        if net == "instagram" and v.lower() in RESERVED:
            return reject(f"handle instagram réservé : {v!r}")
        return v
    if not v.startswith("http"):
        v = "https://" + v.lstrip("/")
    if v.startswith("http://"):
        # Les plateformes servent toutes en https et redirigent : l'agent a simplement
        # recopié un vieux lien. Le site officiel d'un festival, lui, peut réellement
        # n'exister qu'en http, on ne devine pas à sa place, on écarte le champ.
        if net == "site":
            return reject(f"site en http, non corrigeable sans vérification : {v}")
        v = "https://" + v[len("http://"):]
    return v


def load():
    """Toutes les entrées des fichiers JSON, validées une par une."""
    rows, problems = [], []
    for path in sorted(SRC_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            problems.append(f"{path.name}: JSON illisible ({exc})")
            continue
        if not isinstance(data, list):
            problems.append(f"{path.name}: le fichier doit contenir un tableau")
            continue
        for i, raw in enumerate(data):
            rej = []
            def reject(msg, _r=rej):
                _r.append(msg)
                return None
            kind, key = raw.get("kind"), (raw.get("key") or "").strip()
            if kind not in KINDS:
                problems.append(f"{path.name}#{i}: kind inconnu {kind!r}")
                continue
            if not key:
                problems.append(f"{path.name}#{i}: key vide")
                continue
            if not (raw.get("verified") or "").strip():
                problems.append(f"{path.name}#{i} [{key}]: pas de preuve `verified`")
                continue
            entry = {}
            for net in NETWORKS:
                if net in raw:
                    val = norm_value(net, raw[net], reject)
                    if val:
                        entry[net] = val
            posts = []
            for p in raw.get("posts") or []:
                m = SHORTCODE_RE.search(str(p))
                if m:
                    posts.append(m.group(1))
                else:
                    rej.append(f"permalien de post illisible : {p}")
            if posts:
                entry["posts"] = posts[:MAX_POSTS]
            problems.extend(f"{path.name}#{i} [{key}]: {r}" for r in rej)
            if not any(n in entry for n in NETWORKS):
                problems.append(f"{path.name}#{i} [{key}]: aucun réseau exploitable")
                continue
            rows.append({"kind": kind, "key": key, "entry": entry,
                         "verified": raw["verified"].strip(), "src": path.name})
    return rows, problems


def merge(rows, known):
    """Une map par `kind`, indexée par slug. Premier arrivé, premier servi."""
    out = {k: {} for k in KINDS}
    stats, problems = Counter(), []
    for r in rows:
        if r["key"] not in known[r["kind"]]:
            problems.append(f"{r['src']} [{r['key']}]: absent de data.ts ({r['kind']}), clé ignorée")
            stats["clé inconnue"] += 1
            continue
        slug = slugify(r["key"])
        if not slug:
            continue
        cur = out[r["kind"]].get(slug)
        if cur is None:
            out[r["kind"]][slug] = dict(r["entry"])
            stats[r["kind"]] += 1
            continue
        # Doublon : on complète les trous, on ne remplace jamais une valeur déjà posée,
        # et on signale les désaccords, deux agents qui donnent deux Instagram
        # différents pour la même entité veulent dire qu'au moins un se trompe.
        for net, val in r["entry"].items():
            if net not in cur:
                cur[net] = val
            elif cur[net] != val and net != "posts":
                problems.append(f"{r['src']} [{r['key']}]: {net} en conflit ({cur[net]} vs {val}), on garde le premier")
                stats["conflit"] += 1
    return out, stats, problems


def render(maps) -> str:
    """Le bloc TypeScript entre les marqueurs. Une entité par ligne, comme lib/i18n.ts."""
    def val(v):
        return json.dumps(v, ensure_ascii=False)

    chunks = []
    for kind, const in KINDS.items():
        entries = maps[kind]
        lines = [f"export const {const}: Record<string, Socials> = {{"]
        for slug in sorted(entries):
            fields = ", ".join(
                f"{net}: {val(entries[slug][net])}"
                for net in NETWORKS + ["posts"]
                if net in entries[slug]
            )
            lines.append(f"  {json.dumps(slug)}: {{ {fields} }},")
        lines.append("};")
        chunks.append("\n".join(lines) if entries else f"export const {const}: Record<string, Socials> = {{}};")
    return "\n\n".join(chunks) + "\n"


BROWSER_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def post_renders(code: str) -> bool:
    """Le lecteur officiel rend-il vraiment ce post ?

    Instagram répond 200 quel que soit le code : une page inexistante renvoie la même
    coquille que la bonne, en plus court. Le seul signal exploitable est la présence d'une
    URL média `scontent`, l'image du post.
    """
    try:
        out = subprocess.run(
            ["curl", "-s", "-m", "25", "-A", BROWSER_UA,
             f"https://www.instagram.com/p/{code}/embed/captioned/"],
            capture_output=True, timeout=35,
        )
        return b"scontent" in out.stdout
    except (subprocess.TimeoutExpired, OSError):
        return False


def check_posts(maps) -> list[str]:
    """Signale les permaliens que le lecteur officiel ne rend pas. **Ne supprime rien.**

    La tentation serait de retirer d'office les posts qui ne répondent pas. Ce serait un
    piège : Instagram sert son mur de connexion dès qu'un serveur enchaîne les requêtes,
    et cette page-là répond 200, pèse 600 Ko et ne contient aucun média, exactement la
    signature d'un post mort. Un validateur qui supprime effacerait donc des données
    parfaitement bonnes le jour où Instagram décide de nous limiter, sans que personne
    ne s'en aperçoive. On rapporte, un humain tranche. Quand *tous* les posts échouent,
    c'est le mur, pas le catalogue.
    """
    bad, total, seen = [], 0, {}
    for kind, entries in maps.items():
        for slug, entry in entries.items():
            for c in entry.get("posts") or []:
                total += 1
                if c not in seen:
                    seen[c] = post_renders(c)
                if not seen[c]:
                    bad.append(f"{kind}/{slug} : post non rendu par le lecteur officiel ({c})")
    if bad and len(bad) == total:
        return [f"aucun des {total} posts n'a été rendu : Instagram sert son mur de "
                f"connexion, vérification non concluante, rien à conclure sur les données"]
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="rapport seul, n'écrit pas")
    ap.add_argument("--check-posts", action="store_true",
                    help="interroge Instagram et signale les permaliens non rendus")
    args = ap.parse_args()

    rows, problems = load()
    maps, stats, more = merge(rows, known_keys())
    problems += more
    if args.check_posts:
        problems += check_posts(maps)

    total = sum(len(m) for m in maps.values())
    print(f"{len(rows)} entrées lues → {total} retenues "
          f"(événements {len(maps['event'])}, salles {len(maps['venue'])}, artistes {len(maps['artist'])})")
    posts = sum(len(e.get("posts", [])) for m in maps.values() for e in m.values())
    if posts:
        print(f"{posts} posts Instagram embarqués")
    if problems:
        print(f"\n{len(problems)} problème(s) :")
        for p in problems:
            print("  -", p)
    if args.dry:
        print("\n--dry : rien écrit.")
        return 0

    src = SOCIALS_TS.read_text()
    if START not in src or END not in src:
        print("marqueurs SOCIALS:start/end introuvables dans lib/socials.ts", file=sys.stderr)
        return 1
    head, rest = src.split(START, 1)
    _, tail = rest.split(END, 1)
    SOCIALS_TS.write_text(head + START + render(maps) + END + tail)
    print(f"\nlib/socials.ts mis à jour.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
