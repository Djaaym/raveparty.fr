#!/usr/bin/env python3
"""Récolte des permaliens Instagram embarquables, depuis les sites des organisateurs.

  python3 .research/socials/posts.py --limit 40        # essaie 40 comptes
  python3 .research/socials/posts.py --kind event      # ne traite que les festivals

Pourquoi ce script existe : Meta ne laisse plus lire les derniers posts d'un compte
tiers (Basic Display fermée, Graph API réservée au propriétaire du jeton, oEmbed
soumis à un jeton d'application). Le seul gisement légal de permaliens, ce sont les
pages qui les publient déjà — à commencer par **le site officiel de l'organisateur**,
qui embarque très souvent son propre fil Instagram.

Deux filtres, et aucun permalien ne passe sans les deux :

1. **Le post existe.** Le lecteur officiel répond 200 même pour un code inventé ; la
   seule preuve est la présence d'une URL média `scontent` dans la réponse.
2. **Le post appartient bien au compte attendu.** Un site peut embarquer le post d'un
   artiste invité ou d'un partenaire. L'afficher sous le nom du festival serait une
   fausse attribution, donc on lit le `username` que renvoie l'embed et on compare.

Le résultat va dans `socials-posts.json`, que `ingest.py` fusionne avec le reste.
"""
import argparse, json, re, subprocess, sys, time
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
OUT = SRC_DIR / "socials-posts.json"

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
CODE_RE = re.compile(r"instagram\.com/(?:[A-Za-z0-9._]+/)?(?:p|reel|tv)/([A-Za-z0-9_-]{5,})")
MAX_POSTS = 6
PAUSE = 1.2          # Instagram renvoie 429 dès qu'on le bouscule (cf. avatars.py)


def fetch(url: str, timeout: int = 25, follow: bool = True) -> str:
    """curl, pas urllib — et sans `-L` sur Instagram.

    Deux pièges empilés, tous deux silencieux. urllib et curl ne reçoivent pas la même
    page du lecteur Instagram (600 Ko de coquille contre 260 Ko de vraie réponse), et
    surtout : **suivre les redirections mène au mur de connexion**. Une page de login
    répond 200, fait 600 Ko et ne contient évidemment aucun post — le script conclut
    alors « permalien mort » sur des posts parfaitement valides. D'où `follow=False`
    pour les embeds, et `-L` conservé pour les sites d'organisateurs, qui redirigent
    légitimement (http→https, apex→www).
    """
    cmd = ["curl", "-s", "-m", str(timeout), "-A", UA]
    if follow:
        cmd.append("-L")
    try:
        out = subprocess.run(cmd + [url], capture_output=True, timeout=timeout + 10)
        return out.stdout.decode("utf-8", "ignore")
    except (subprocess.TimeoutExpired, OSError):
        return ""


def owner_of(code: str) -> str | None:
    """Le compte auteur du post, ou None si l'embed ne rend rien (post mort/privé)."""
    html = fetch(f"https://www.instagram.com/p/{code}/embed/captioned/", follow=False)
    if "scontent" not in html:
        return None
    names = re.findall(r'"username":"([A-Za-z0-9._]+)"', html)
    if not names:
        # L'embed varie : à défaut du JSON, le handle apparaît dans le lien du profil.
        names = re.findall(r'instagram\.com/([A-Za-z0-9._]+)/\?utm_source=ig_embed', html)
    return names[0] if names else None


def candidates(entry: dict) -> list[str]:
    """Les codes trouvés sur le site de l'organisateur, dans l'ordre de la page."""
    site = entry.get("site")
    if not site:
        return []
    found, seen = [], set()
    for path in ("", "/news", "/actualites", "/about"):
        html = fetch(site.rstrip("/") + path)
        for m in CODE_RE.finditer(html):
            c = m.group(1)
            if c not in seen:
                seen.add(c)
                found.append(c)
        if len(found) >= MAX_POSTS * 2:
            break
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="nombre de comptes à traiter")
    ap.add_argument("--kind", help="event | venue | artist")
    args = ap.parse_args()

    targets, seen_keys = [], set()
    for path in sorted(SRC_DIR.glob("*.json")):
        if path.name == OUT.name:
            continue
        try:
            rows = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        for r in rows:
            if not (r.get("instagram") and r.get("site")):
                continue
            if args.kind and r.get("kind") != args.kind:
                continue
            k = (r.get("kind"), r.get("key"))
            if k in seen_keys:
                continue
            seen_keys.add(k)
            targets.append(r)
    if args.limit:
        targets = targets[: args.limit]

    out, checked = [], 0
    for i, r in enumerate(targets, 1):
        handle = r["instagram"].lstrip("@").lower()
        codes = candidates(r)
        good = []
        for c in codes[: MAX_POSTS * 2]:
            if len(good) >= MAX_POSTS:
                break
            checked += 1
            who = owner_of(c)
            time.sleep(PAUSE)
            if who and who.lower() == handle:
                good.append(f"https://www.instagram.com/p/{c}/")
        print(f"[{i}/{len(targets)}] {r['key']}: {len(codes)} candidat(s) → {len(good)} retenu(s)", flush=True)
        if good:
            out.append({
                "kind": r["kind"], "key": r["key"], "instagram": r["instagram"], "posts": good,
                "verified": f"permaliens embarqués sur {r['site']}, auteur confirmé "
                            f"@{handle} par le lecteur officiel Instagram",
            })
            OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"\n{len(out)} compte(s) avec posts, {checked} permaliens testés → {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
