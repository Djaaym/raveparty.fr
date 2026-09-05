# Recherche de photos d'événements

Objectif : chaque événement du calendrier doit avoir une **vraie photo** qui le caractérise,
photo de mainstage, de la foule, du site du festival, de la salle, ou l'affiche officielle
publiée par l'organisateur.

## Entrée / sortie

- Entrée : `_input-{lot}.json`, la liste des événements du lot (`id`, `title`, `type`, `city`,
  `country`, `venue`, `date`, `genres`).
- Sortie : `photos-{lot}.json`, un tableau d'objets :

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
  `"venue"` (photo de la salle, acceptable pour une soirée club sans visuel propre).
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
4. **Une photo de salle peut servir plusieurs événements** du même lieu, c'est prévu, réutilisez la
   même URL pour tous les événements d'une même salle quand ils n'ont pas de visuel propre.
5. **Mieux vaut aucune entrée qu'une mauvaise entrée.** Un événement sans photo trouvable est
   simplement absent du JSON ; il gardera son dégradé de genre.

## Visuel déposé à la main

Quand l'original n'est servi par aucune URL stable, le visuel se dépose dans
`.research/photos/local/` et son entrée porte `"image": "local:{fichier}"`. C'est la même
porte que `.research/artists/local/`, et elle a la même contrepartie : **la responsabilité
des droits est celle du déposant**, aucune licence n'étant lue par le script. Le reste ne
change pas, l'entrée passe par le même contrôle qualité et les mêmes dérivés.

Ce que cette route ne désarme pas : `commons_credit()` ne rend un crédit que pour un fichier
`upload.wikimedia.org`, donc une entrée locale ne peut pas hériter d'un crédit Commons. C'est
volontaire, un crédit faux est pire qu'un crédit absent, et remplacer une photo Commons par un
visuel d'organisateur doit retirer l'attribution avec elle (cas de l'affiche du Boom 2027, qui
a remplacé une photo CC0 d'Artem Kavalerov).

Le cas d'usage reste l'exception, pas le raccourci : le site de l'organisateur qui ne sert son
artwork que derrière un rendu JS. Une URL simplement pas encore cherchée n'en est pas un.

## Où chercher

- **Wikimedia Commons en priorité quand ça existe** (licence libre, c'est le cas des gros festivals :
  Tomorrowland, Awakenings, Defqon.1, Time Warp…). Recherche :
  `https://commons.wikimedia.org/w/index.php?search=<festival>&title=Special:MediaSearch&type=image`
  L'URL directe du fichier s'obtient via l'API :
  `https://commons.wikimedia.org/w/api.php?action=query&titles=File:XXX.jpg&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json`
- **Site officiel du festival / du club** : `og:image` de la page d'accueil ou de la page de l'événement,
  `curl -sL -m 20 "URL" | grep -oiE '<meta[^>]+(og:image|twitter:image)[^>]*>'`
  Souvent la meilleure source ; pensez aussi aux pages `/gallery`, `/photos`, `/aftermovie`, `/media`.
- **Sites de salles** connus pour être server-rendered et accessibles :
  `bootshaus.tv/events/`, `thewarehouseproject.com`, `drumshedslondon.com`, `thuishaven.nl`.
- Autres agendas exploitables : `touslesfestivals.com`, `songkick.com`, `skiddle.com`, `jds.fr`.

**Bloqué par le proxy (403/429), ne pas insister** : Resident Advisor (`ra.co`), Shotgun,
`agendaculturel.fr`, infoconcert. Chromium/Playwright n'a aucun accès réseau : les sites rendus
uniquement en JS sont hors de portée, passez au suivant.

## Vérifier avec les en-têtes de l'ingest, pas avec les vôtres

`ingest.py` télécharge **sans `Referer`**. Une image qui n'apparaît que parce que votre `curl`
en envoyait un n'arrivera donc jamais dans `public/posters/`, ou pire, arrivera transformée.

Le cas est réel : `static.djguide.nl` sert un **placeholder 500×500 identique pour tous les
événements** (79 912 octets) dès que le `Referer` manque. Une entrée par événement, toutes
« valides » au sens du content-type, toutes la même image, et `ingest.py` les aurait dédupliquées
par hash en n'en gardant qu'une, posée au hasard sur une fiche. `djguide.nl` reste un très bon
**annuaire** d'événements NL/BE (avec un User-Agent navigateur, sinon 403), mais ses images ne
sont pas exploitables.

D'où la règle : **re-vérifiez chaque URL retenue avec un `curl` nu**, sans `-e` / `--referer`,
et méfiez-vous de deux images de poids strictement identique, c'est la signature d'un
placeholder servi à la place du vrai fichier.

## Limite connue : les bannières s'agrandissent au crop

`quality_check()` ne regarde que la **largeur** (≥ 500 px) et la platitude. Il laisse donc
passer les bannières très larges, alors que la vignette de carte est un crop **4:5** : sur une
image de 851×315, la colonne conservée ne fait que 252 px de large et doit être agrandie
**2,2×** pour atteindre 560×700. Le résultat est mou.

Relevé au 13/08/2026 : **142 fichiers sur 440 dépassent 1,6:1**, une douzaine demandant plus de
1,5× d'agrandissement, surtout des couvertures Facebook (851×315) et des bandeaux de site
(1200×370). Aucun n'est faux, ils sont juste peu nets sur une carte.

À l'usage, **préférez toujours un visuel portrait ou carré** : une affiche de soirée est
presque toujours en 4:5 ou 1:1, c'est le format que ce pipeline attend. Une bannière ne se
prend qu'à défaut de mieux. Si le sujet est repris un jour, le garde-fou naturel est une
contrainte sur la **hauteur** (`h ≥ 700` pour les images larges), pas sur la largeur, mais
l'appliquer rétroactivement retirerait des images actuellement en ligne, donc c'est un
arbitrage à poser, pas un correctif à glisser.
