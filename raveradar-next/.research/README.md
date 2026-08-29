# Recherche événements — fichiers de travail

JSON produits par les agents de recherche, fusionnés dans `lib/data.ts` par
`merge.py`. Versionnés volontairement : le répertoire temporaire de session peut
être purgé en cours de route, et la recherche coûte cher à refaire.

Schéma d'un événement : voir `lib/types.ts` (`RaveEvent`) plus les champs de
travail `ticketUrl`, `sources` et `note` (`note` contenant « indicatif » ou
« non vérifié » devient `priceNote: "estimated"`).

## Rafraîchir un line-up déjà publié

`merge.py` ajoute des événements, il ne sait pas en corriger un. Les fiches saisies
avant la sortie de l'affiche affichent « Programmation à venir » — et une donnée
saisie une fois ne se re-vérifie jamais toute seule. `.research/lineups/` porte les
lots de rafraîchissement, `.research/lineups/ingest.py` les greffe :

    python3 .research/lineups/ingest.py --dry   # puis sans --dry

Un lot est un tableau de `{id, title, lineup, source}`. `title` est le garde-fou
contre la dérive d'id — écrire un line-up sur la mauvaise soirée est une faute
invisible. `source` doit être une URL http(s) exacte. Une fiche qui a **déjà** un
line-up n'est pas écrasée sans `--force` : le lot d'un agent ne vaut pas mieux que ce
qui est publié.
