# Lot uk-b, doutes et fiches laissees telles quelles

Verification menee le 31/08/2026. Sources primaires utilisees : `thewarehouseproject.com/calendar/`,
`swg3.tv`, `waterworksfestival.co.uk`, `subclub.co.uk`, `sneakypetes.co.uk`, `illuminaughty.co.uk`,
`document-bristol.com`, `teletech.events`, `gottwood.co.uk`, plus les billetteries `skiddle.com`
(pages de **lieu**, qui repondent, les pages d'evenement etant derriere un WAF CloudFront en curl)
et `dice.fm`.

## Ce qui merite une decision editoriale

### 745 Vini Vici & Blastoyz at Studio 338, 07/11/2026 : Blastoyz n'est plus a l'affiche
La soiree s'appelle en realite **IllumiNaughty pres. 20 Years Of Chaos**. Le site de l'organisateur
(https://illuminaughty.co.uk/event/illuminaughty-20-years/) donne l'affiche des deux scenes et
**n'y fait pas figurer Blastoyz**, alors qu'il est dans le titre de la fiche du catalogue. Un ancien
intitule Skiddle pour le meme identifiant d'evenement (42405520) disait « Ace Ventura, Blastoyz + more »,
l'intitule courant dit « Vini Vici & More ». Le titre du catalogue promet donc peut-etre un artiste
qui ne joue pas. A trancher avant fusion : soit on garde le titre et on ajoute Blastoyz au line-up,
soit on renomme la fiche (et alors passer par `lib/renamed.ts`, le slug est indexe).

### 215 Waterworks Festival, 12-13/09/2026 : Modeselektor absent de l'affiche officielle
Le catalogue porte « Daniel Avery, Midland, Leon Vynehall, Modeselektor ». Les trois premiers sont
bien sur l'affiche officielle (samedi), **Modeselektor n'y est pas**, ni samedi ni dimanche.
Il apparait en revanche dans plusieurs reprises secondaires de l'annonce initiale. Le lot de line-up
que je depose est celui du site officiel, il ne contient donc pas Modeselektor : verifier avant
d'ecraser, une suppression de nom est aussi une affirmation.

Le meme site confirme en revanche le lieu du catalogue (**The Cause**, « 36 hours of non stop music
across 7 spaces at The Cause »). Des reprises de presse evoquaient un probleme d'autorisation a
Gunnersbury Park pour 2026, la question semble reglee par ce deplacement, la fiche est bonne.

### 716 SWG3: Kimmic, 24/10/2026 : la salle n'est pas la bonne
Le catalogue dit **SWG3 TV Studio**. La fiche officielle (https://swg3.tv/events/2026/march/kimmic/)
dit « Kimmic return to SWG3, this time to take over the **Warehouse** », et l'agenda du lieu le range
aussi en SWG3 Warehouse. La salle est un champ non modifiable depuis la fiche, elle alimente
`/lieux/{slug}` : correction a faire dans `lib/data.ts`.

### 858 RTM: FJAAK & Slam & Nightwave, Sub Club, 11/09/2026 : dans 11 jours, aucun tarif public
Date, titre et affiche confirmes sur l'agenda du Sub Club (https://subclub.co.uk/). Mais la
billetterie est **exclusivement Resident Advisor** (ra.co/events/2437425), bloque depuis ce
conteneur, et le site du club n'affiche aucun prix. Reste `price: 0, priceNote: "unknown"`.

### 708 Free Time: Romare, Sneaky Pete's, 18/10/2026 : idem, RA seul
Date, salle et affiche (Romare seul, DJ set, 18h) confirmees sur
https://www.sneakypetes.co.uk/2026/10/18/romarefree-time/. Billetterie RA uniquement
(ra.co/events/2467167). Aucun tarif recuperable.

### 215 Waterworks : le tarif reste estime
Le site officiel n'a qu'un bouton « Buy tickets » vers ra.co/events/2345415. Le 85 GBP estime du
catalogue n'a donc pas pu etre confirme ni infirme.

### 477 The Warehouse Project: Alisha, 23/10/2026 : sold out, aucun tarif
Confirme sur le calendrier WHP (« ALISHA - CONCOURSE ONLY », « This show is now sold out »,
statut « FINAL VIP AVAILABLE »). C'est la seule date WHP du lot absente de la page Skiddle du
Depot Mayfield, donc aucun tarif lisible. L'estimation a 25 GBP reste en place.

### 469, 474, 488 : sold out, la billetterie n'affiche plus de tarif
You&Me Saturday (03/10), Interplanetary Criminal (10/10) et Tiesto (11/12) sont en liste d'attente
sur Skiddle avec `minPrice: 0`. Leurs estimations (38, 35, 55 GBP) restent en place faute de mieux.
Leurs affiches, elles, sont completes et deposees.

### 140 The Warehouse Project New Year's Eve, 31/12/2026 : affiche toujours non annoncee
La page officielle (https://thewarehouseproject.com/events/nye/) ne porte aucun nom, seulement
l'horaire 20h-04h et « BUY TICKETS ». Le `lineup: []` du catalogue est correct, « Programmation a
venir » est la bonne reponse. Le tarif, lui, est confirme (45 GBP, depose).

### 254 Gottwood Festival, 10-13/06/2027 : dates confirmees, rien d'autre
https://www.gottwood.co.uk/ confirme « Returning from 10th to 13th of June », mais dit aussi
« Early Bird tickets have already sold out. Sign up above to be the first to know when tickets go
live later this year ». Ni affiche ni tarif en vente. L'estimation a 195 GBP reste, le line-up vide
aussi. A repasser vers janvier 2027.

### 250 Teletech Cardiff, 12/03/2027 : evenement confirme, billetterie pas ouverte
La page officielle de l'organisateur (https://www.teletech.events/events) liste bien
« Teletech: Cardiff, 12 Mar, Cardiff, UK, Vaults » mais affiche un prix a `0`, c'est-a-dire
billetterie non ouverte. L'agenda de la salle (vaultspresents.com/listings) ne va pas jusque-la.
Line-up annonce ailleurs comme « Teletech: Kirsty [All Night Long] », ce qui correspond au line-up
du catalogue. Rien a corriger, rien a confirmer.

### 748 Marshmello & Alison Wonderland at The O2, 10/11/2026 : c'est un « Pokemon Night Out »
L'evenement est officiellement **Pokemon Night Out** au O2, avec Marshmello en tete d'affiche et
Alison Wonderland en support, sets et visuels crees pour l'occasion, 16+. Le line-up du catalogue
est donc juste. Le tarif est inaccessible : theo2.co.uk repond 406 depuis ce conteneur, la
billetterie est AXS, et les seules valeurs trouvees en ligne sont des prix de revente StubHub
(409 GBP), qui ne sont pas un tarif d'entree. Reste sans prix.

### 704 Paul van Dyk at Studio 338, 17/10/2026 : tarif ecrit en `estimated` a dessein
La billetterie (Skiddle 42410188) donne une fourchette **10 a 35,50 GBP**. Le palier a 10 GBP est
un tarif de premiere vague dont je n'ai pas pu verifier qu'il est encore ouvert, l'ecart avec le
haut de fourchette est trop grand pour l'annoncer sans « ≈ ». A repasser.

Note au passage : le site officiel de Studio 338 (studio338.co.uk/events/) ne liste plus que deux
dates et **ne porte ni cette soiree ni celle du 7 novembre**. Son agenda n'est pas fiable, c'est la
billetterie qui fait foi pour cette salle.

## Point de methode sur les tarifs WHP

Les pages d'evenement du Warehouse Project n'affichent aucun prix (une seule exception vue dans tout
le calendrier, « From £35 + BF » pour la soiree Hannah Laing du 16/10). Les tarifs deposes pour les
neuf dates WHP viennent donc de la page de lieu Skiddle du Depot Mayfield, billetterie officielle
liee depuis le site. **Ces montants incluent les frais de reservation** : la meme soiree Hannah Laing
y apparait a 39,50 GBP quand WHP annonce « £35 + BF ». Le listing Skiddle ne separe pas les deux, et
le montant retenu est bien celui qu'on paie, mais il faut le savoir si on recoupe un jour avec une
annonce d'organisateur.

## Verifications faites qui n'ont rien change (fiches laissees telles quelles)

- **463 Rampa + &ME**, **115 Solomun**, **478 Duke Dumont**, **137 Klangkuenstler**, **488 Tiesto** :
  le calendrier officiel WHP ne donne aucun autre nom que celui deja au catalogue. Le line-up court
  n'est pas un trou, c'est l'affiche.
- **858** (FJAAK, Slam, Nightwave), **591** (The Rocketman), **594** (Silva Bumpa), **716** (Kimmic),
  **807** (Jazzy), **718** (Chicane), **766** (Dusky), **678** (Lane 8), **775** (Ivy Lab),
  **708** (Romare), **725** (Romare) : affiches confirmees a l'identique sur le site du lieu ou la
  billetterie, un seul nom annonce.
- **807 SWG3: Jazzy** : la fiche SWG3 decrit « Irish dance-pop artist Jazzy... Hailing from Dublin »,
  ce qui confirme qu'il s'agit bien de **Jazzy (IE)** et non de l'homonyme suisse.
- **775 Ivy Lab at Thekla** : la billetterie intitule la date « Ivy Lab: A Farewell Tour (Bristol -
  Final Ever Set) ». Ce n'est pas une correction a apporter, mais c'est une information de fiche
  (derniere date du groupe) qui vaudrait d'etre dans la description.
