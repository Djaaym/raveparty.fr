# Vérification des liens de billetterie

Un lot par fichier `bNN.json`, écrit par un agent de vérification. Une entrée décrit
**une** fiche du catalogue :

```json
{"id": 2159, "status": "ok|soldout|cancelled|none", "url": "https://…",
 "checked_on": "domaine de la source", "price": 28, "currency": "€",
 "priceNote": "estimated", "note": "ce qui a été vérifié"}
```

`python3 apply.py --dry` puis sans `--dry` reporte les lots dans la map `TICKETS`
de `lib/data.ts`. Le script refuse une URL racine **comme s'il n'y avait pas de
lien** : c'est le défaut que toute la campagne corrige, un lien qui ouvre l'accueil
d'un site demande au lecteur de refaire la recherche que la fiche connaissait déjà.

## Ce qu'on a appris en la menant

- **L'API GraphQL de Resident Advisor répond en clair** alors que `ra.co` en HTML
  est en 403 depuis le conteneur. C'est la découverte qui a le plus rapporté :
  RA est le premier index de billetterie électronique en Europe et il était
  jusqu'ici entièrement fermé.

  ```bash
  curl -sS -X POST https://ra.co/graphql -A "ClaudeBot/1.0" \
    -H "Content-Type: application/json" -H "Referer: https://ra.co/" \
    -d '{"query":"query{search(searchTerm:\"Fuse\",limit:10,indices:[EVENT]){id searchType value contentUrl date}}"}'
  ```

  `search.value` porte « SOLD OUT » quand la soirée est complète.
  `event(id){promotionalLinks{title url}}` donne la billetterie de l'organisateur,
  celle qu'il faut retenir avant le lien RA lui-même.

- **Un 403 en masse n'est pas un lien mort.** Le premier balayage, lancé à douze
  requêtes en parallèle, a rendu 230 `403` dont 156 sur Skiddle. Repassé en série
  avec le `Crawl-delay: 2` que son `robots.txt` demande, Skiddle répond 200 sur
  toutes. Mesurer le débit d'un service avant d'écrire la boucle coûte cinq minutes.

- **Les hôtes qui bloquent vraiment** tout robot depuis le conteneur, et sur
  lesquels un lien ne peut donc être retenu que confirmé par ailleurs :
  `ticketmaster.*`, `goout.net`, `dice.fm`, `entrio.hr`, `eventu.al`,
  `pumpehuset.dk`, `fnacspectacles.com` (intermittent, `ClaudeBot/1.0` passe parfois).

- **Une page qui s'affiche ne vend pas forcément.** La preuve lisible côté serveur
  est `offers[].availability` dans le JSON-LD. Une page `/festivals/` de Skiddle
  n'a aucune offre : c'est une page line-up, pas une caisse.

- **Trois façons de se tromper de tarif**, toutes constatées ici : recopier le pass
  complet, retenir un palier épuisé, ou prendre le montant barré. Le tarif d'entrée
  est le plus bas **réellement en vente**. Une guest list à 0 n'est pas une entrée
  libre.

`A-VERIFIER.md` porte ce que la campagne a trouvé **au-delà** des liens : dates
contestées par la source officielle, doublons publiés, événements déplacés, tarifs
faux. Rien n'y est corrigé automatiquement, ce sont des décisions éditoriales.
