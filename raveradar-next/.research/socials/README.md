# Comptes sociaux vérifiés (`.research/socials/`)

Chaque fichier JSON de ce répertoire est **un tableau d'objets**. `ingest.py` les lit tous,
valide, déduplique, et réécrit les trois maps de `lib/socials.ts` entre les marqueurs
`/* SOCIALS:start */` et `/* SOCIALS:end */`. **Ne jamais éditer `lib/socials.ts` à la main.**

```bash
python3 .research/socials/ingest.py --dry   # rapport, n'écrit rien
python3 .research/socials/ingest.py         # patche lib/socials.ts
```

## Schéma

```jsonc
{
  "kind": "event",                       // "event" | "venue" | "artist"
  "key": "Awakenings Summer Festival",   // voir « La clé » ci-dessous — copie EXACTE
  "instagram": "awakenings",             // le handle SANS @ ni URL
  "site": "https://www.awakenings.com",
  "facebook": "https://www.facebook.com/awakenings",
  "tiktok": "awakenings",
  "youtube": "https://www.youtube.com/@awakenings",
  "soundcloud": "awakenings",
  "spotify": "https://open.spotify.com/artist/xxxx",
  "bandcamp": "https://xxx.bandcamp.com",
  "x": "awakenings",
  "ra": "https://ra.co/promoters/1234",
  "posts": ["https://www.instagram.com/p/XXXXXXXX/"],   // facultatif, voir plus bas
  "verified": "https://www.awakenings.com — le pied de page du site officiel renvoie vers instagram.com/awakenings"
}
```

Seuls `kind`, `key`, `verified` et **au moins un réseau** sont obligatoires. Tous les autres
champs sont facultatifs : mieux vaut une entrée qui ne porte que l'Instagram qu'une entrée
complétée au jugé.

## La clé

| `kind`   | `key`                                                                 |
|----------|-----------------------------------------------------------------------|
| `event`  | le champ `title` de l'événement dans `lib/data.ts`, **au caractère près** |
| `venue`  | le champ `venue` de l'événement, au caractère près                     |
| `artist` | le nom tel qu'il apparaît dans un `lineup[]`, au caractère près        |

`ingest.py` **rejette toute clé absente de `lib/data.ts`** — c'est le garde-fou contre les
noms approximatifs. Accents, casse, ponctuation et suffixes comptent : `Sónar`, pas `Sonar` ;
`999999999`, pas `9999999999`.

Une clé `event` vaut pour **toutes les éditions** du même festival (le titre ne porte jamais
l'année, cf. CLAUDE.md). Une clé `venue` vaut pour toutes les dates de la salle, et sert de
repli sur les fiches de soirées de club qui n'ont pas de compte de marque à elles.

## Règle de vérification — la seule qui compte

> **Dans le doute, on n'ajoute pas.** Une entrée absente affiche « pas de réseaux » ;
> une entrée fausse envoie nos lecteurs chez quelqu'un d'autre et nous fait mentir en public.

Le champ `verified` doit décrire **la preuve**, pas l'impression. Preuves acceptables,
de la plus forte à la plus faible :

1. **Le site officiel de l'entité renvoie vers ce compte** (pied de page, page contact, header).
   C'est la preuve reine : elle vient de l'intéressé lui-même.
2. Le compte est **certifié** (badge Meta) *et* son nom, sa bio et son contenu correspondent
   sans ambiguïté (ville, genre, dates que nous listons).
3. La billetterie officielle (page Dice, Shotgun, Resident Advisor de l'organisateur) ou la
   page Wikipédia de l'entité renvoie vers ce compte.
4. Le compte lui-même renvoie en bio vers le site officiel que nous connaissons — lien croisé.

Ne suffisent **pas** : un compte de fan, un agrégateur, un homonyme plausible, un compte
trouvé au seul flair du handle, un compte régional d'une marque internationale (`@ultra` ≠
`@ultraeurope`), un compte inactif depuis des années quand un autre publie les mêmes dates.

Pièges connus sur ce catalogue :

- **Homonymes d'artistes.** Un nom de scène peut cacher deux personnes (cf. « Jazzy » dans
  CLAUDE.md). Recouper le pays et le genre de nos dates avant de trancher ; sinon, sauter.
- **Noms très courts ou communs** (`Novah`, `Worship`, `Rise`, `Teho`) : la probabilité de
  tomber sur un homonyme est forte. Exiger la preuve n°1 ou n°3.
- **Marques déclinées** : `@awakenings` ≠ `@awakenings.upclose`. Si la déclinaison a son
  propre compte, c'est celui-là qui va sur la fiche de cette déclinaison.
- **Salle vs promoteur** : une soirée organisée par un collectif dans un club a deux comptes.
  Le compte de la salle va en `kind: "venue"`, celui du collectif en `kind: "event"`.
- **Comptes supprimés/privés** : si le profil ne répond plus, ne pas l'inscrire.

## Le champ `posts`

Meta ne permet plus de lire les derniers posts d'un compte tiers : l'API Basic Display est
fermée depuis décembre 2024, la Graph API exige le jeton du propriétaire du compte, et
l'oEmbed exige un jeton d'application **et** un permalien connu d'avance. Le site n'ira donc
jamais chercher tout seul « les 6 derniers posts » — ce serait du scraping, contraire aux CGU.

En revanche, **un permalien de post que nous connaissons peut être embarqué légalement** via
le lecteur officiel d'Instagram (`/p/{code}/embed`), qui sert le contenu depuis Instagram et
affiche le compte, la légende et le lien. `posts` accepte donc jusqu'à **6 permaliens**, du
plus récent au plus ancien. Ne le remplir que pour les comptes majeurs, et uniquement avec
des posts publics vus de ses yeux — un permalien inventé affiche un cadre vide.

C'est un champ de confort : une entrée sans `posts` reste parfaitement utile, elle affiche
la carte de profil et les liens.
