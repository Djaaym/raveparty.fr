# Anomalies relevées pendant la campagne billetterie (hors périmètre du lien)

## Dates contestées par la source officielle
- id 116 Festival Maintenant (Rennes) : le site officiel annonce **6-10 octobre 2026**, la fiche dit 1-11 octobre. Trancher par le jour de semaine avant de toucher.
- id 830 APEX : apexfest.de annonce **06/03/2027**, à recouper avec la fiche.

## Doublon publié
- ids 600 et 1383 : même soirée (La P'tite Fumée, Rock School Barbey, Bordeaux, 16/10/2026).
  Clé `booked` (ville, salle, jour) de merge.py non appliquée. Fusionner en gardant
  **l'id le plus ancien** (son URL est indexée) et greffer ce que l'autre apporte.

## Tarifs faux au catalogue (pas seulement absents)
- id 225 Culture Box : 150 DKK, stocké 20 €.
- id 236 Culture Box : 160 DKK, stocké 21 €.
- id 363 Culture Box : 160 DKK, stocké 20 €.
  → règle « on stocke le symbole local, on ne convertit pas » enfreinte à la saisie.

## Événement dont la billetterie n'ouvre pas encore (repli conservé, correct)
- 256 Hideout 2027 (vente annoncée pour novembre), 2413 Kamping Kitsch Club 2027
  (liste d'attente), 141 CTM 2027 (annoncé sans vente), 2394 FF27.

## Plus aucune offre en vente
- Tiësto à GASWRX (Birmingham), Skiddle : toutes les offres du JSON-LD en SoldOut.

## Déplacé / annulé (une fiche à venir ne se re-vérifie jamais toute seule)
- id 1390 Lewis Ofman, Olympia le 06/02/2027 : **déplacé à La Machine du Moulin Rouge
  le jeudi 05/02/2027**, billets Olympia remboursés (page officielle de l'Olympia).
  Salle ET date fausses. URL déjà indexée, donc passage par lib/renamed.ts si le titre change.

## Dates contestées, suite
- id 2362 I Hate Models au Kompass : la fiche officielle annonce le 21/11/2026, pas le 28/11.
- id 808 Full Circle: BYORN Invites : l'agenda Kompass ne porte aucun Full Circle le 20/12.
- id 2359 ZAZU Indoor Belgium : RA dit 28/11/2026 à la Waagnatie, Partyflock 4-5/12/2026.
- id 803 Psy-Spirits 19/12/2026 : édition non annoncée, ni par psy-spirits.de ni par l'Edelfettwerk.

## Doublons publiés, suite
- 873 ≡ 1386 (La Nuit Étincelle, Bergerac) — même billetterie.
- 425 ≡ 1388 (Hilight Tribe, Toulouse) — même page Shotgun.

## Tarifs faux au catalogue, suite
- 450 Acid Arab : 48 € annoncé par le Zénith, catalogue à 44,80.
- 134 Dream Nation : seul le LATE TICKET à 61,90 € reste, catalogue à 40.
- 777 FAIRGROUND : Standard Phase 1 à 86,11 €, le palier 60 € n'est plus vendu.
- 1384 Kölsch : 19,99 € (le palier à 0 € est une guest list SoldOut), catalogue 24.
