#!/usr/bin/env python3
"""Exporte les dépôts promoteurs validés vers un lot que `merge.py` sait lire.

  python3 .research/from-submissions.py --dry     rapport seul
  python3 .research/from-submissions.py           écrit events-promoteurs.json

Puis, comme pour n'importe quel lot de recherche :

  python3 .research/merge.py --dry && python3 .research/merge.py
  python3 .research/audit.py

## Pourquoi ce script existe

Approuver un dépôt dans /admin ne met rien en ligne : le catalogue est un fichier
TypeScript relu à la main, et une fiche y entre par `merge.py`. Ce script est le pont
qui manquait entre les deux, et il s'arrête là où commence le jugement : il **prépare**
un lot, il ne publie pas.

## Ce qu'il complète, et ce qu'il refuse de deviner

Le formulaire de dépôt ne demande pas de coordonnées, un promoteur tape « Le Sucre,
Lyon ». Sans elles, l'événement n'a ni point sur la carte ni distance pour « autour de
moi ». Le script géocode donc la salle via Nominatim (OpenStreetMap), et **saute la
fiche plutôt que d'inventer un point** quand il ne trouve rien.

Il ne remplit pas `region` (le département, qui alimente `/rave-party/{dept}`) : mesuré,
Nominatim rend « Métropole de Lyon » là où le catalogue dit « Rhône », et rien du tout
pour Paris. Une valeur approximative y serait pire que l'absence, puisqu'elle créerait
une page de département qui n'existe pas. Les fiches françaises concernées sont listées
en fin de rapport, à compléter à la main.

Il ne traduit pas non plus : sans description anglaise fournie, `descEn` reprend le texte
français, ce que la fiche affiche déjà de toute façon (`eventDesc()` retombe sur `desc`).
Le rapport les liste, la traduction reste à faire.

## D'où viennent les données

Du même Redis que la console, avec les mêmes variables, dans le même ordre de préférence
que `lib/kv.ts`. Le plus simple pour les avoir en local :

  vercel env pull .env.local

Le script lit ce fichier tout seul s'il est là.
"""
import json, os, re, sys, time, urllib.parse, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "events-promoteurs.json")
CACHE = os.path.join(HERE, ".geocache.json")
DRY = "--dry" in sys.argv

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

def load_env_local():
    """`.env.local` d'abord, sans écraser ce qui est déjà dans l'environnement."""
    path = os.path.join(HERE, "..", ".env.local")
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

def creds():
    """Même précédence que `kvCreds("ACCOUNTS_KV_REST_API")` côté application."""
    for u, t in [("ACCOUNTS_KV_REST_API_URL", "ACCOUNTS_KV_REST_API_TOKEN"),
                 ("KV_REST_API_URL", "KV_REST_API_TOKEN"),
                 ("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN")]:
        if os.environ.get(u) and os.environ.get(t):
            return os.environ[u].rstrip("/"), os.environ[t]
    sys.exit("Aucune variable de magasin trouvée. Lance `vercel env pull .env.local` "
             "depuis raveradar-next/, ou pose ACCOUNTS_KV_REST_API_URL et "
             "ACCOUNTS_KV_REST_API_TOKEN dans ton environnement.")

# Tout le dépôt passe par curl : `urllib` et `curl` ne reçoivent pas toujours la même
# réponse à travers le proxy, et c'est une leçon déjà payée sur le lecteur Instagram.
def http(url, headers=(), data=None, timeout=30):
    cmd = ["curl", "-s", "-m", str(timeout)]
    for h in headers:
        cmd += ["-H", h]
    if data is not None:
        cmd += ["-d", data]
    cmd.append(url)
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.stdout

# --------------------------------------------------------------------------
# Lecture des dépôts
# --------------------------------------------------------------------------

def redis(commands, url, token):
    body = json.dumps(commands)
    raw = http(f"{url}/pipeline", [f"authorization: Bearer {token}",
                                   "content-type: application/json"], body)
    try:
        out = json.loads(raw)
    except Exception:
        sys.exit(f"Réponse illisible du magasin : {raw[:200]}")
    return out if isinstance(out, list) else [out]

def fetch_submissions():
    url, token = creds()
    ids = redis([["LRANGE", "rr:pro:sall", 0, -1]], url, token)[0].get("result") or []
    if not ids:
        return []
    rows = []
    for i in range(0, len(ids), 40):
        chunk = ids[i:i + 40]
        for reply in redis([["GET", f"rr:pro:s:{x}"] for x in chunk], url, token):
            raw = reply.get("result")
            if isinstance(raw, str) and raw:
                try:
                    rows.append(json.loads(raw))
                except Exception:
                    pass
    return rows

# --------------------------------------------------------------------------
# Géocodage
# --------------------------------------------------------------------------

# Nominatim demande un agent identifiable et une requête par seconde au maximum.
# Les deux sont des conditions d'usage, pas des recommandations.
UA = "RaveRadar/1.0 (https://www.raveparty.fr; djaym.info@gmail.com)"
GAP = 1.2
_last = [0.0]

def geocode(queries, cache):
    for q in queries:
        if not q:
            continue
        if q in cache:
            hit = cache[q]
            if hit:
                return hit["lat"], hit["lng"], q
            continue
        wait = GAP - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        params = urllib.parse.urlencode({"q": q, "format": "jsonv2", "limit": 1})
        raw = http(f"https://nominatim.openstreetmap.org/search?{params}", [f"user-agent: {UA}"])
        try:
            data = json.loads(raw)
        except Exception:
            data = []
        # On mémorise aussi les réponses vides : c'est un appel par requête, non groupable,
        # et une recherche qui ne donne rien ne donnera rien de plus au passage suivant.
        cache[q] = {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])} if data else None
        json.dump(cache, open(CACHE, "w"), ensure_ascii=False)
        if cache[q]:
            return cache[q]["lat"], cache[q]["lng"], q
    return None, None, None

# --------------------------------------------------------------------------
# Conversion
# --------------------------------------------------------------------------

def plain(md):
    """Le Markdown réduit de `lib/richtext.ts` ramené au texte que stocke le catalogue.

    Les sauts de ligne disparaissent : `merge.py` écrit `desc` dans une chaîne TypeScript
    entre guillemets simples sur une ligne, et son `esc()` n'échappe que `\\` et `"`. Un
    retour à la ligne y casserait le fichier, 7 000 pages plus loin, au build.
    """
    s = md.replace("\r\n", "\n")
    s = re.sub(r"\[([^\]\n]{1,120})\]\((https?://[^\s)]{1,300})\)", r"\1 (\2)", s)
    s = re.sub(r"\*\*([^*\n]+)\*\*", r"\1", s)
    s = re.sub(r"(^|[^*])\*([^*\n]+)\*(?!\*)", r"\1\2", s)
    s = re.sub(r"^[ \t]*[-*][ \t]+", "", s, flags=re.M)

    # Les lignes se recollent en phrases, pas bout à bout : un élément de liste qui ne
    # finit pas par une ponctuation reçoit un point, sinon « Rooftop, techno hypnotique
    # Salle du bas, hard groove » se lit comme une seule phrase bancale.
    parts = []
    for line in s.split("\n"):
        line = re.sub(r"\s+", " ", line).strip()
        if not line:
            continue
        if parts and parts[-1][-1] not in ".!?:;,":
            parts[-1] += "."
        parts.append(line)
    if parts and parts[-1][-1] not in ".!?":
        parts[-1] += "."
    return " ".join(parts)

def price_of(sub):
    """`price` numérique plus le `note` que `merge.py` lit pour en déduire `priceNote`."""
    raw = (sub.get("price") or "").replace(",", ".").strip()
    if not raw:
        return 0, "tarif non communiqué par l'organisateur"
    val = float(raw)
    val = int(val) if val == int(val) else val
    if sub.get("priceNote") == "estimated":
        return val, "tarif indicatif, à confirmer sur la billetterie"
    if sub.get("priceNote") == "unknown":
        return 0, "tarif non communiqué par l'organisateur"
    return val, ""

def convert(sub, cache):
    venue, city, country = sub.get("venue", ""), sub.get("city", ""), sub.get("country", "")
    address = sub.get("address", "")
    lat, lng, used = geocode([
        f"{venue}, {address}, {city}, {country}" if address else None,
        f"{venue}, {city}, {country}",
        f"{address}, {city}, {country}" if address else None,
        f"{city}, {country}",
    ], cache)
    if lat is None:
        return None, "aucune coordonnée trouvée pour la salle ni pour la ville"

    price, note = price_of(sub)
    desc = plain(sub.get("desc", ""))
    desc_en = plain(sub.get("descEn", "")) or desc

    ev = {
        "title": sub["title"],
        "type": sub.get("type", "Club"),
        # Un seul genre : `merge.py` n'accepte que les onze clés de `GENRES`, et les
        # sous-genres sont des libellés libres qui n'ont pas de champ au catalogue.
        # Ils voyagent quand même dans le fichier, pour la relecture.
        "genres": [sub["genre"]],
        "city": city,
        "country": country,
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "date": sub["date"],
        "time": sub.get("time") or "23:00",
        "price": price,
        "currency": sub.get("currency") or "€",
        "venue": venue,
        "trending": False,
        "lineup": sub.get("lineup") or [],
        "desc": desc,
        "descEn": desc_en,
    }
    if sub.get("endDate") and sub["endDate"] != sub["date"]:
        ev["endDate"] = sub["endDate"]
    if note:
        ev["note"] = note
    if sub.get("ticketUrl"):
        ev["ticketUrl"] = sub["ticketUrl"]
    # Clés ignorées par `merge.py`, gardées pour celui qui relit le lot.
    if sub.get("subgenres"):
        ev["_subgenres"] = sub["subgenres"]
    ev["_source"] = f'dépôt {sub["id"][:8]} par {sub.get("owner", "?")}'
    ev["_geocode"] = used
    if sub.get("posterUrl") or sub.get("posterFile"):
        ev["_poster"] = sub.get("posterUrl") or sub.get("posterFile")
    return ev, None

# --------------------------------------------------------------------------

def main():
    load_env_local()
    subs = fetch_submissions()
    approved = [s for s in subs if s.get("status") == "published"]
    print(f"{len(subs)} dépôt(s) au magasin, {len(approved)} validé(s).")
    if not approved:
        print("Rien à exporter. Valide un dépôt dans /admin d'abord.")
        return

    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    rows, failed, todo_region, todo_en = [], [], [], []

    for sub in sorted(approved, key=lambda s: s.get("date", "")):
        ev, why = convert(sub, cache)
        if not ev:
            failed.append((sub.get("title", "?"), why))
            continue
        rows.append(ev)
        print(f"  ✓ {ev['title']} ({ev['date']}) → {ev['lat']}, {ev['lng']}  [{ev['_geocode']}]")
        if ev["country"] == "France":
            todo_region.append(ev["title"])
        if not plain(sub.get("descEn", "")):
            todo_en.append(ev["title"])

    for title, why in failed:
        print(f"  ✗ {title} : {why}")

    if DRY:
        print(f"\n(dry run, {OUT} non écrit)")
    else:
        json.dump(rows, open(OUT, "w"), ensure_ascii=False, indent=1)
        print(f"\n{len(rows)} événement(s) écrit(s) dans {os.path.relpath(OUT, os.getcwd())}")

    print("\nÀ RELIRE AVANT DE FUSIONNER")
    if todo_region:
        print(f"  · `region` à ajouter à la main (département) : {', '.join(todo_region)}")
        print("    Sans lui, la fiche n'apparaît pas sur /rave-party/{département}.")
    if todo_en:
        print(f"  · `descEn` reprend le français, traduction à faire : {', '.join(todo_en)}")
    print("  · Vérifier le point géocodé, le tarif et la billetterie sur la page officielle.")
    print("  · Prévoir une image : .research/photos/ pour une photo, sinon une affiche IA.")
    print("\nEnsuite : python3 .research/merge.py --dry")

main()
