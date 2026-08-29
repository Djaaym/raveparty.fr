# Recherche événements - fichiers de travail

JSON produits par les agents de recherche, fusionnés dans `lib/data.ts` par
`merge.py`. Versionnés volontairement : le répertoire temporaire de session peut
être purgé en cours de route, et la recherche coûte cher à refaire.

Schéma d'un événement : voir `lib/types.ts` (`RaveEvent`) plus les champs de
travail `ticketUrl`, `sources` et `note` (`note` contenant « indicatif » ou
« non vérifié » devient `priceNote: "estimated"`).
