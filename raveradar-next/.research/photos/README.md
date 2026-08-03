# Recherche de photos d'événements

Objectif : chaque événement du calendrier doit avoir une **vraie photo** qui le caractérise —
photo de mainstage, de la foule, du site du festival, de la salle, ou l'affiche officielle
publiée par l'organisateur.

## Entrée / sortie

- Entrée : `_input-{lot}.json` — la liste des événements du lot (`id`, `title`, `type`, `city`,
  `country`, `venue`, `date`, `genres`).
- Sortie : `photos-{lot}.json` — un tableau d'objets :

```json
[
  {
    "id": 494,
    "image": "https://www.bootshaus.tv/…/mainfloor.jpg",
    "sourcePage": "https://www.bootshaus.tv/events/polyamor",
    "credit": "Bootshaus",
    "kind": "venue",
    "width": 1500,
    "note": "photo du Mainfloor du club"
  }
]
```

- `kind` : `"event"` (visuel propre à cette date), `"festival"` (photo/affiche du festival),
  `"venue"` (photo de la salle — acceptable pour une soirée club sans visuel propre).
- **Écrire le fichier dès les 5 premières fiches, puis toutes les ~5.** Ne jamais attendre la fin
  pour écrire : une session purgée en cours de route fait perdre tout le travail.

## Règles

1. **Aucune URL inventée.** Chaque URL doit être vérifiée :
   `curl -sIL -m 20 "URL" | grep -i "^content-type\|^content-length"`
   → il faut un `content-type: image/*` et un poids > 20 Ko. Une URL non vérifiée ne se met pas
   dans le JSON.
2. **Largeur ≥ 800 px** de préférence (l'image sert de poster de carte). Vérifiable en
   téléchargeant : `curl -sL -o /tmp/x.jpg "URL" && python3 -c "from PIL import Image;print(Image.open('/tmp/x.jpg').size)"`.
3. **Ce qu'on veut** : une scène, une foule, un site de festival, l'intérieur d'un club, une affiche
   officielle. **Ce qu'on ne veut pas** : un logo seul sur fond uni, une bannière de cookies, un
   pictogramme, une photo sans rapport avec la musique électronique, une image de stock générique.
4. **Une photo de salle peut servir plusieurs événements** du même lieu — c'est prévu, réutilisez la
   même URL pour tous les événements d'une même salle quand ils n'ont pas de visuel propre.
5. **Mieux vaut aucune entrée qu'une mauvaise entrée.** Un événement sans photo trouvable est
   simplement absent du JSON ; il gardera son dégradé de genre.

## Où chercher

- **Wikimedia Commons en priorité quand ça existe** (licence libre, c'est le cas des gros festivals :
  Tomorrowland, Awakenings, Defqon.1, Time Warp…). Recherche :
  `https://commons.wikimedia.org/w/index.php?search=<festival>&title=Special:MediaSearch&type=image`
  L'URL directe du fichier s'obtient via l'API :
  `https://commons.wikimedia.org/w/api.php?action=query&titles=File:XXX.jpg&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json`
- **Site officiel du festival / du club** : `og:image` de la page d'accueil ou de la page de l'événement —
  `curl -sL -m 20 "URL" | grep -oiE '<meta[^>]+(og:image|twitter:image)[^>]*>'`
  Souvent la meilleure source ; pensez aussi aux pages `/gallery`, `/photos`, `/aftermovie`, `/media`.
- **Sites de salles** connus pour être server-rendered et accessibles :
  `bootshaus.tv/events/`, `thewarehouseproject.com`, `drumshedslondon.com`, `thuishaven.nl`.
- Autres agendas exploitables : `touslesfestivals.com`, `songkick.com`, `skiddle.com`, `jds.fr`.

**Bloqué par le proxy (403/429), ne pas insister** : Resident Advisor (`ra.co`), Shotgun,
`agendaculturel.fr`, infoconcert. Chromium/Playwright n'a aucun accès réseau : les sites rendus
uniquement en JS sont hors de portée, passez au suivant.
