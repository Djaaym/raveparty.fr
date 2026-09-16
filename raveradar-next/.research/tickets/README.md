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

## Le trou de la première campagne : l'agrégateur ne se consulte pas, il se balaie

Une fiche signalée par le propriétaire (Mosimann à la Halle Tony Garnier) avait été
examinée par un agent, qui avait rendu « aucun lien » après avoir lu la page du lieu
et constaté que ses logos Fnac et Ticketmaster pointaient vers des accueils. Shotgun
vendait la date. L'agent n'avait pas regardé.

La faute est dans le prompt, pas dans l'agent : « cherche dans cet ordre d'autorité,
site officiel puis les guichets » laisse chacun décider où s'arrêter, et beaucoup
s'arrêtent au site du lieu. D'où `sg_index.py`, qui construit **un index complet de
l'agenda Shotgun** (4 059 dates sur 80 zones) et l'apparie au catalogue.

Quatre pièges payés en le construisant, tous du même genre, une mesure qui a l'air
juste et qui ne regarde rien :

- **Shotgun sert deux formes de lien**, `/en/events/{slug}` et `/en/web/events/{slug}`.
  N'en reconnaître qu'une fait rendre « 0 date » à Paris, qui en porte 561.
- **Il range par zone, pas par commune.** Marseille s'appelle `aix-marseille`, Balma
  est dans `toulouse`. Un mauvais slug rend une coquille vide de 124 Ko qui se lit
  exactement comme « aucune date ». La liste qui fait autorité est le `CITIES` de
  `.research/sources/shotgun.py`. Anvers, Gand, Rotterdam, Utrecht et Graz ne sont
  pas couverts du tout : leur zéro est vrai.
- **La correspondance par sous-chaîne fabrique des faux**, c'est la règle « Ain est
  une sous-chaîne de Saintes » appliquée aux salles. Sur trois appariements bruts,
  deux étaient faux : une soirée lausannoise appariée à Porto, une zurichoise à Lyon.
  Il faut comparer des **mots entiers** et **vérifier la ville sur la page ouverte**.
- **Ville et jour ne suffisent toujours pas** : deux concerts différents partagent
  souvent une salle et une date (Mentissa et PACT à l'Interférence le 04/12). Le
  départage se fait sur le **nom de l'artiste** présent dans le titre Shotgun.

Et une leçon sur le script lui-même : la première exécution a parcouru ses 80 zones
puis est morte avant d'écrire son fichier, emportant quarante minutes de collecte.
C'est la règle « écrire dès les 5 premiers puis toutes les ~5 fiches, jamais une
seule écriture finale » que le dépôt impose aux agents de recherche, et qu'il faut
appliquer à ses propres outils : `sg_index.py` écrit à chaque zone et sait reprendre.
