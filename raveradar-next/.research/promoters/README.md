# Organisateurs (`/organisateurs/{slug}`)

Un organisateur, c'est la marque derrière une soirée : un collectif (Possession,
Teletech), un promoteur de festival (Hangar, Awakenings), un club qui édite sa propre
programmation hors les murs (Fuse, C12). Ce n'est **pas** une salle : la salle a déjà
`/lieux/{slug}`, et publier deux pages pour la même chose les met en concurrence, ce
que le dépôt évite partout ailleurs.

## Ce qu'un lot contient

Un fichier JSON par lot (`promoters-{region}.json`), un tableau d'objets :

```json
[
  {
    "slug": "teletech",
    "name": "Teletech",
    "kind": "collectif",
    "city": "Manchester",
    "country": "UK",
    "since": 2019,
    "desc": "Deux ou trois phrases en français, factuelles et sourcées.",
    "descEn": "The same in English.",
    "site": "https://teletech.uk/",
    "instagram": "https://www.instagram.com/teletechuk/",
    "match": ["teletech"],
    "venues": ["Depot Mayfield"],
    "verified": "Site officiel : année de création et ville. Instagram vérifié par le lien du site.",
    "sources": ["https://...", "https://..."]
  }
]
```

- `kind` vaut `collectif`, `organisateur`, `club` ou `label`.
- `country` reprend **exactement** la clé du catalogue (`UK`, pas `United Kingdom` ;
  `Czech Republic`, pas `Czechia`). Une variante crée une page concurrente.
- `since` est l'année de création, uniquement si une source la donne. Sinon, on omet
  le champ : une absence est une réponse, une année approximative est une invention.
- `desc` est en français, source de vérité. Pas de tiret cadratin (U+2014), nulle part.
- `match` : les libellés qui identifient la marque **dans le titre** d'un événement du
  catalogue. La correspondance se fait sur des suites de mots entières du slug du
  titre, jamais sur une sous-chaîne : « fuse » ne doit pas attraper « Fusebox ».
- `venues` : les libellés de salle du catalogue (à la lettre près) dont **toute** la
  programmation est celle de cette marque, typiquement son propre club. Dans le doute,
  on laisse vide : revendiquer les soirées d'un autre promoteur est pire que rien.
- `countries` (facultatif) restreint la correspondance aux pays où la marque tourne.
  C'est le garde-fou des noms courants : « Circus » attrapait « David Guetta presents
  Galactic Circus » à Ibiza.
- `exclude` (facultatif) écarte un titre qui correspond quand même. Une soirée qui
  *invite* la marque n'est pas une soirée *de* la marque.
- `verified` dit quelle source prouve quoi, `sources` porte les URLs.

## Règles

- **Dans le doute, on n'ajoute pas.** Même règle que `.research/socials/` : un lien ou
  une affirmation fausse envoie nos lecteurs chez quelqu'un d'autre.
- **Un nom générique existe dans dix villes** (« Warehouse », « Depot », « Basement ») :
  toujours recouper la ville avant de poser un `match`.
- **Pas de donnée inventée** : année de création, ville d'origine et résidents ne
  s'écrivent que d'après une source citée.
- Une marque qui ne touche **aucun** événement du catalogue n'entre pas dans le lot :
  sa page serait vide.

## Ingestion

    python3 .research/promoters/ingest.py --dry    # puis sans --dry
    python3 .research/promoters/ingest.py --show   # les titres attrapés, marque par marque

`--show` est la relecture qui compte : aucune mesure ne dit si une correspondance
désigne bien la marque, seul l'œil qui passe sur les titres attrapés le dit. C'est la
règle des planches-contact de `.research/artists/sheets.py`, transposée ici.

Le script valide le schéma, refuse un `country` inconnu du catalogue, refuse un
`venues` absent du catalogue, calcule combien d'événements chaque marque touche, et
réécrit la map de `lib/promoters.ts` entre les marqueurs `PROMOTERS:start/end`. Ne pas
éditer la map à la main.
