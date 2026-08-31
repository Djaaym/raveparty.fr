#!/usr/bin/env python3
"""Récupère le lot des dépôts vérifiés depuis /admin et l'écrit dans .research/.

  python3 .research/from-submissions.py --site https://www.raveparty.fr

Puis, comme pour n'importe quel lot de recherche :

  python3 .research/merge.py --dry && python3 .research/merge.py
  python3 .research/audit.py

## Ce que ce script n'est pas

Il ne convertit rien. La conversion d'un dépôt vers le format du catalogue vit dans
**`lib/catalog-export.ts`**, et elle y vit **une seule fois** : ce script en était une
seconde implémentation, en Python, et deux conversions écrites séparément finissent
toujours par diverger sans qu'aucune ait raison sur l'autre. Il ne reste ici qu'un client
du point d'accès, pour ceux qui préfèrent une commande au bouton « Exporter le lot » de
la console.

Le mot de passe demandé est `ADMIN_PASSWORD` (à défaut `TRACKING_PASSWORD`), le même que
celui de la console. Il peut aussi venir de l'environnement, sous le même nom.
"""
import getpass, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "events-promoteurs.json")

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv[:-1] else default

SITE = (arg("--site") or os.environ.get("SITE_URL") or "https://www.raveparty.fr").rstrip("/")
DRY = "--dry" in sys.argv

# Tout le dépôt passe par curl : `urllib` et `curl` ne reçoivent pas toujours la même
# réponse à travers un proxy, leçon déjà payée sur le lecteur Instagram.
def post(path, body, cookie=None):
    cmd = ["curl", "-s", "-m", "60", "-D", "-", "-H", "content-type: application/json",
           "-d", json.dumps(body)]
    if cookie:
        cmd += ["-H", f"cookie: {cookie}"]
    cmd.append(SITE + path)
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    head, _, payload = out.partition("\r\n\r\n") if "\r\n\r\n" in out else out.partition("\n\n")
    return head, payload

def main():
    password = os.environ.get("ADMIN_PASSWORD") or os.environ.get("TRACKING_PASSWORD")
    if not password:
        password = getpass.getpass(f"Mot de passe de {SITE}/admin : ")

    head, _ = post("/api/admin/auth", {"password": password})
    cookie = None
    for line in head.split("\n"):
        if line.lower().startswith("set-cookie:") and "rr_admin=" in line:
            cookie = line.split(":", 1)[1].strip().split(";")[0]
    if not cookie:
        sys.exit("Connexion refusée. Vérifie ADMIN_PASSWORD, ou le --site.")

    _, payload = post("/api/admin/data", {"kind": "export"}, cookie)
    try:
        data = json.loads(payload)
    except Exception:
        sys.exit(f"Réponse illisible : {payload[:200]}")
    if not data.get("ok"):
        sys.exit(f"Export refusé : {data}")

    rows = json.loads(data["json"])
    print(f"{data['count']} événement(s) prêt(s).")
    for r in rows:
        print(f"  · {r['title']} ({r['date']}) → {r['lat']}, {r['lng']}")

    if DRY:
        print(f"\n(dry run, {OUT} non écrit)")
    else:
        open(OUT, "w", encoding="utf-8").write(json.dumps(rows, ensure_ascii=False, indent=1))
        print(f"\nécrit dans {os.path.relpath(OUT, os.getcwd())}")

    print("\nÀ RELIRE AVANT DE FUSIONNER")
    if data.get("missingCoords"):
        print(f"  · sans coordonnées, relance dans un instant : {', '.join(data['missingCoords'])}")
    if data.get("needsRegion"):
        print(f"  · `region` (département) à ajouter à la main : {', '.join(data['needsRegion'])}")
    if data.get("needsEnglish"):
        print(f"  · `descEn` reprend le français : {', '.join(data['needsEnglish'])}")
    print("  · Vérifier le point géocodé, le tarif et la billetterie sur la page officielle.")
    print("  · Prévoir une image : .research/photos/ pour une photo, sinon une affiche IA.")
    print("\nEnsuite : python3 .research/merge.py --dry")

main()
