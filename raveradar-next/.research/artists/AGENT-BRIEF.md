# Brief agent — fiches artistes (genres + bio)

Tu documentes des **personnes réelles**. La règle du projet s'applique ici plus qu'ailleurs :
**rien d'inventé, rien de mémoire — tout fait publié doit venir d'une page que tu as ouverte**
et dont tu cites l'URL. Un artiste que tu n'arrives pas à vérifier : tu ne l'écris pas, tu le
listes dans `skipped` avec la raison. Une fiche absente est normale ; une fiche fausse ne l'est pas.

## Ce que tu produis

Deux fichiers, dans `.research/artists/` :

1. `genres-lot{N}.json` — **l'objectif principal**, un objet par artiste :

```json
{
  "name": "Indira Paganotto",          // nom EXACT du lot (il sert de clé, ne le reformate pas)
  "main": ["Psytrance", "Hard Techno"], // 1 à 3 clés, PRIS DANS LA LISTE FERMÉE ci-dessous, le principal d'abord
  "sub": ["Psy-Trance Techno"],         // 0 à 3 sous-genres, libellés libres, PAS un doublon d'une clé de `main`
  "sources": ["https://…"],             // >= 1 URL ouverte par toi qui atteste le style
  "confidence": "high"                  // high = une source le dit noir sur blanc ; medium = déduit du label/des sorties
}
```

**Liste fermée pour `main`** (orthographe exacte, ce sont les pages du site) :
`Techno` · `Hard Techno` · `Acid Techno` · `Hardstyle` · `Hardcore` · `EDM` ·
`Drum & Bass` · `House` · `Trance` · `Psytrance` · `Warehouse`

- `Warehouse` n'est pas un style musical : ne l'attribue **jamais** à un artiste.
- Un artiste a rarement plus de 2 genres principaux. Si tu en mets 3, c'est que la source
  décrit vraiment un profil large (un DJ open-format, un producteur passé de la trance à la techno).
- `sub` sert à ce que `main` ne sait pas dire : `Minimal Techno`, `Industrial Techno`,
  `Melodic Techno`, `Peak Time Techno`, `Dub Techno`, `Tech House`, `Deep House`, `Afro House`,
  `Progressive House`, `Bass House`, `Frenchcore`, `Uptempo`, `Rawstyle`, `Euphoric Hardstyle`,
  `Gabber`, `Neurofunk`, `Liquid Drum & Bass`, `Jungle`, `Goa Trance`, `Progressive Trance`,
  `Uplifting Trance`, `Hardgroove`, `Schranz`, `Breakbeat`, `UK Garage`, `Dubstep`, `Electro`,
  `Ambient`, `Downtempo`, `Disco`, `Big Room`, `Future House`, `Melodic House`, `Organic House`…
  La liste n'est pas fermée, mais reste sur des noms de styles **employés par la source**.

2. `bios-lot{N}.json` — la bio quand tu as de quoi l'écrire (2 à 4 phrases) :

```json
{
  "name": "Indira Paganotto",
  "bio_fr": "…", "bio_en": "…",   // 120 à 700 signes chacune, FR = source de vérité
  "origin": "Madrid, Espagne",     // optionnel
  "since": 2018,                    // optionnel, année de début de sortie/carrière
  "labels": ["ARTCORE"],           // optionnel
  "sources": ["https://…"]          // obligatoire
}
```

Faits seulement : d'où l'artiste vient, ce qu'il joue, ce pour quoi il est connu (label, résidence,
disque marquant). **Pas de superlatif** : « l'un des plus grands », « figure incontournable »,
« légende vivante » sont rejetés automatiquement par l'ingest — ils sont vrais de personne.
Si une info manque, on l'omet ; on ne comble pas.

3. Si tu trouves une photo **sur Wikimedia Commons** (et nulle part ailleurs — une photo de presse
   ou d'Instagram est un travail protégé), ajoute dans l'entrée bio :
   `"commons": "https://commons.wikimedia.org/wiki/File:…"`. Ne télécharge rien, c'est `avatars.py`
   qui s'en charge.

## Sources

Ce qui répond depuis ce conteneur : **Wikipédia / Wikidata**, **last.fm** (`/music/{Nom}/+tags`),
**MusicBrainz** (`musicbrainz.org/ws/2/artist/?query=…&fmt=json`), **Discogs API**
(`api.discogs.com/database/search?q=…&type=artist`), **SoundCloud**, **Bandcamp**, les **sites
officiels d'artistes et de labels**, les **pages artiste des festivals** (awakenings.com,
tomorrowland.com, amsterdam-dance-event.nl, dourfestival.eu…), la presse (Mixmag, DJ Mag,
Trax, Beatportal, Electronic Groove, Skiddle news).

Ce qui est **bloqué** (403/406, n'y perds pas de temps) : ra.co (Resident Advisor), beatport.com,
bandsintown.com, songkick.com, shotgun.live.

Un tag last.fm seul n'est **pas** une source suffisante pour `confidence: "high"` — c'est du
crowdsourcing. Il l'est pour `medium`, et il vaut mieux qu'une intuition.

## Pièges déjà payés sur ce projet

- **Un nom de scène peut cacher deux personnes.** « Jazzy » a désigné une DJ hard techno suisse
  et une chanteuse-DJ irlandaise. Recoupe avec les événements du lot (colonne `genres_evenements`,
  et le nom du festival si tu le trouves) : si le doute demeure, `skipped`.
- **Le champ `genres_evenements` du lot est un indice, pas une vérité** : c'est l'étiquetage des
  soirées où l'artiste joue. Un festival étiqueté sur huit styles étiquette du même coup les
  cinquante noms de son affiche. Il sert à départager deux homonymes, pas à décider du style.
- **Écris au fil de l'eau** : dès les 5 premières fiches, puis toutes les ~5. Une session
  interrompue à la fin sans écriture perd tout le travail. Réécris le fichier complet à chaque fois
  (liste JSON valide, jamais un fragment).
