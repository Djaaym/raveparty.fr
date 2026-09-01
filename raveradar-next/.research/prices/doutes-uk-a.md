# Lot uk-a - doutes et fiches laissées telles quelles

Date de vérification : 31 août 2026. Sources utilisées : sites officiels des salles et des
festivals, pages de LIEU de Skiddle (les pages d'événement Skiddle sont derrière un WAF en
curl, les pages de lieu portent un JSON par date avec `minPrice`/`maxPrice`/`ticketStatusText`),
et DICE (JSON-LD `MusicEvent` lisible en curl). Resident Advisor, Ticketmaster, See Tickets
et Kaboodle répondent 403 depuis le conteneur.

## Alerte sérieuse : une fiche qui semble annulée

**id 216 - Todd Terje at Concorde 2 (Brighton, 12/09/2026).**
Trois signaux concordants, aucun n'est une preuve à lui seul mais ensemble ils suffisent à
lever la main :
- DICE, la billetterie de la salle, publie pour cette date un JSON-LD `MusicEvent` portant
  `"eventStatus": "https://schema.org/EventCancelled"` et une offre à `lowPrice 0.00` :
  https://dice.fm/event/mx757k-todd-terje-12th-sep-concorde-2-brighton-tickets
- La page événement du site de la salle, `https://www.concorde2.co.uk/event/todd-terje`,
  répond **404**.
- La page de lieu Skiddle de Concorde 2 ne liste **aucune date le 12/09** (elle liste bien
  le 05, le 19 et le 26 septembre).

Rien n'a été supprimé ni modifié. À trancher à la main : si l'annulation se confirme, la
fiche se retire et `/festival/todd-terje-at-concorde-2` entre dans `lib/renamed.ts` plutôt
que de tomber en 404, avec élagage de ses entrées `IMAGES` / `PHOTOS` / `TICKETS`.

## Dates annoncées complètes (pas un doute, une information à afficher)

- **id 468 - The Warehouse Project: You&Me - Friday (02/10)** : « SOLD OUT » sur
  thewarehouseproject.com/calendar/, liste d'attente sur Skiddle. Le tarif relevé (57,80 £)
  est le dernier palier vendu.
- **id 480 - The Warehouse Project: NexUp (31/10)** : « SOLD OUT » sur le calendrier
  officiel, `0-0` + liste d'attente sur Skiddle, donc **aucun tarif** relevable.
- **id 224 - FLY House Heads Glasgow (25/09)** : liste d'attente sur Skiddle (fourchette
  31-37,50 £), mais encore vendu 34,99 £ chez FLY sur DICE. C'est le prix DICE qui a été retenu.

## Line-ups qui n'existent pas encore

- **id 466 - Steppers at Drumsheds (26/09)** : la page officielle Drumsheds affiche « TBA »
  en toutes lettres, et la fiche Skiddle ne nomme que le promoteur (« Continental GT »).
  Rien à écrire.
- **id 487 - The Warehouse Project: FAC51 The Haçienda (05/12)** : « Lineup revealed soon.
  Sign up now » sur le calendrier officiel. Pas d'affiche, et pas de billetterie ouverte
  (la date n'apparaît pas dans la page de lieu Skiddle de Depot Mayfield), donc pas de tarif
  non plus. À repasser à J-60.
- **id 252 - Field Day (29/05/2027)** : fielddayfestivals.com n'annonce que la date et un
  formulaire d'inscription (« Make sure you're on the list to hear first about our lineup
  announcements and next wave of tickets »). Aucun nom, aucun tarif publié.
- **id 260 - Parklife (10-11/07/2027)** : « line-up to be announced » ; seul le tarif est
  publié et il a été relevé.
- **id 689 - Eric Prydz at GASWRX (16/10)** et **id 702 - The Warehouse Project: Eric Prydz
  (17/10)** : les deux pages officielles portent l'artiste seul (« ERIC PRYDZ + MORE TBA »
  à Birmingham, « ERIC PRYDZ - CONCOURSE ONLY » à Manchester). Le line-up du catalogue est
  déjà juste, rien à ajouter.
- **id 705 - Eats Everything & Groove Armada at The Prospect Building (17/10)** : le titre
  officiel de la soirée est « History Of Rave: Eats Everything, Groove Armada + More TBA ».
  Les deux têtes d'affiche sont bien les seules annoncées.
- **id 634 - Lucid Dreams: Acid Techno (20/11)** : la page SWG3 (The Poetry Club) ne publie
  aucun nom (« their biggest event yet »). Les quatre noms du catalogue viennent donc d'une
  autre source, non recoupée ici : ni confirmés, ni infirmés.

## Line-up ajouté depuis une source secondaire, à recouper

- **id 233 - No Bounds Festival (09-11/10, Sheffield/Rotherham)**. Le site officiel est une
  application monopage derrière un challenge : `noboundsfestival.co.uk/lineup` renvoie la
  même coquille que la page d'accueil en curl, et WebFetch n'obtient que « Please wait while
  your request is being verified ». Les noms ajoutés (Mark Fell, Blawan, The Black Dog,
  Kid Acne, Oppidan, Main Phase, 96 Back, Rian Treanor) viennent de l'article d'Exposed
  Magazine du 10/06/2026, qui reprend l'annonce de première vague :
  https://www.exposedmagazine.co.uk/whats-new/no-bounds-celebrates-south-yorkshires-electronic-pioneers-in-2026-lineup/
  C'est une source de presse, pas l'organisateur : à relire avant publication. Le tarif
  (75 £ estimé au catalogue) n'a pas pu être vérifié, la billetterie n'étant accessible que
  depuis le site bloqué.

## Tarifs non trouvés (la fiche reste telle quelle)

- **id 211 - FOLD presents Bassiani (Extended) (05/09)** : FOLD ne vend que via Resident
  Advisor, bloqué. Le line-up, lui, est confirmé sur la page officielle.
- **id 237 - Teletech Glasgow (24/10, Room 2)** : Skiddle rend `0-0` + « Waiting List ».
- **id 243 - Teletech Newcastle (14/11, World Headquarters)** : la page de lieu Skiddle de
  World Headquarters ne liste aucun événement, et teletech.events affiche « 0 » pour cette
  date. Second lien : Ticketmaster, bloqué.
- **id 249 - Teletech Belfast (26/12, The Telegraph Building)** : même situation, la page de
  lieu Skiddle est vide et teletech.events affiche « 0 ». Le line-up est également absent
  (aucun nom sur teletech.events pour cette date).
- **id 719 - Cowgate Block Party (24/10)** et **id 747 - Free Time: Dusky (08/11)** : Sneaky
  Pete's vend via See Tickets, qui répond 403 en curl comme en WebFetch. Le line-up complet
  de la Block Party, lui, est publié sur sneakypetes.co.uk et a été récupéré.
- **id 795 - Sub Club: Mr Scruff (12/12)** : le bouton « BUY TICKETS » de subclub.co.uk
  pointe sur ra.co/events/2467330, bloqué. La date, elle, est confirmée par le site du club.
- **id 486 - FUSE 18th Birthday (28/11, Drumsheds)** : la date n'apparaît pas dans la page de
  lieu Skiddle de Drumsheds (qui s'arrête au 13/11) et le lien officiel passe par Kaboodle,
  dont la boutique est rendue en JavaScript. Line-up complet récupéré, tarif inchangé.

## Détails de saisie à arbitrer

- **id 671 - SWG3: Notion** : SWG3 écrit « Orla Hannigan », Skiddle « Orla Halligan » pour
  le même nom sur la même date. L'orthographe de la salle a été retenue.
- **Tarifs Skiddle** : le champ retenu est `minPrice`, c'est-à-dire le « From £X » affiché
  par Skiddle, et la fourchette complète est rappelée dans le `note` de chaque entrée. Sur
  quelques dates l'écart est large (id 674 Cristoph, 8-15 £ ; id 242 SYNRG, 10-22 £ alors
  que le catalogue estimait 20 £) : si le palier bas est déjà épuisé, le tarif affiché sera
  optimiste. À arbitrer au moment de la fusion.
- **id 214 - FLY Open Air Edinburgh** : le catalogue estimait 65 £, la billetterie officielle
  DICE ne vend plus que le pass week-end à 91,29 £ (aucun billet à la journée en vente). Le
  tarif a été remonté à 91 £, c'est ce qu'on paie aujourd'hui, mais ce n'est pas le tarif
  d'entrée d'origine du festival.
