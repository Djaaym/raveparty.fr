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

## Éditions annoncées au catalogue mais introuvables à la source
- id 383 Rong Open Air Malta 06-09/05/2027 : rongevents.com s'arrête à l'édition 2026,
  le sitemap n'a aucune URL 2027, le slug 2027 rend 404. Aucune source ne confirme la date.
- id 2394 Forbidden Fruit 05-06/06/2027 : le site officiel n'a qu'une page « SIGN UP FOR FF27 ».

## Tarifs à arbitrer (écart important, source récente contre catalogue)
- id 336 Anyma : DICE vend 85,74 €, le catalogue dit 126.
- id 62 Zamna Tulum : seul un multipass 3 entrées à 375 USD est vendu, aucun billet
  à la journée. Le 120 $ du catalogue n'est donc pas confirmé, et le pass ne le remplace pas.
- id 344 Robot Festival : aucune entrée à 8 € constatée (soirée à partir de 35 €).

## Contrôle d'affiliation (fait, RAS)
147 hôtes distincts dans les lots, 103 jamais vus au catalogue. Les seuls liens
rémunérés sont 7 Ticketmaster/Live Nation, tous couverts par AFFILIATE_HOSTS, donc
rel="sponsored" se déduit du domaine sans rien déclarer fiche par fiche.
go.kaboodle.co.uk résout vers bookings.kaboodle.com, portail de réservation propre
à Snowbombing lié depuis son site officiel : non rémunéré, donc nofollow seul.

## Annulé / inexistant, suite
- id 1377 Fakear au Cabaret Aléatoire (Marseille) : donné ANNULÉ par Songkick, absent
  de La Friche, de jds.fr et de la tournée. Seul 13.agendaculturel.fr le liste encore.
- id 415 Sam Feldt au Central Chapelle le 09/10 : introuvable partout, y compris dans
  l'agenda officiel du lieu (sept→déc 2026) et sur la fiche artiste Shotgun. Fiche
  probablement erronée.

## Doublons publiés, suite
- 870 ≡ 1380 (Autechre) — même lien Shotgun.

## Tarifs faux, suite
- id 583 Mecanik Paradize : 39,90 €, le catalogue dit 25 en « estimated ».
- id 1376 Fakear Grenoble : 27 €, catalogue 31,60.

## Balayage des liens déjà en place (527 URLs re-vérifiées en série)

434 URLs confirmées en vente par leur JSON-LD (`offers[].availability` = InStock).
75 chez des hôtes qui bloquent tout robot, donc non vérifiables depuis le conteneur
et laissées telles quelles : ticketmaster.*, goout.net, dice.fm, entrio.hr,
eventu.al, pumpehuset.dk, ra.co en HTML.

**13 dates dont la page s'affiche mais ne vend plus rien** (toutes les offres en
SoldOut). Le lien n'est pas cassé et reste honnête, il montre la vérité, donc il
n'a pas été changé : c'est une file de re-vérification, pas une correction. Une
soirée épuisée peut être remise en vente, et l'organisateur vend parfois encore
là où le guichet est fermé.

  1358 Tiësto at GASWRX, Birmingham, 13/12
  1313 Framework pres. Ben UFO & Papa Nugs, Leeds, 20/11
  1243 Jamie Fielding + Hidde Van Wee, Leeds, 30/10
  1220 Shy FX, Leeds, 24/10
  1090 Circus Birthday, Liverpool, 26/09
   796 Tiësto at Blackstone Street Warehouse, Liverpool, 12/12
  1041 Crazy P Day Party, Liverpool, 19/09
   690 Annie Mac at Invisible Wind Factory, Liverpool, 16/10
    57 The Warehouse Project: KI/KI, Manchester, 18/09
   469 The Warehouse Project: You&Me, Manchester, 03/10
  1095 Tre Reynolds, Manchester, 26/09
  1361 Afta Dark, Nottingham, 19/12
  1074 Detonate x The Brickworks: LTJ Bukem, Nottingham, 25/09

## Annulé, suite (campagne de reprise)
- id 1427 Project X Events - Love To House, Basing House, 26/09/2026 : **ANNULÉ**.
  La fiche Skiddle porte `cancellation type=cancelled` daté du 29/08/2026 et n'a plus
  aucune offre. À retirer du catalogue avec une entrée dans lib/renamed.ts vers une
  cible pertinente, jamais en 404 : son URL est indexée.
