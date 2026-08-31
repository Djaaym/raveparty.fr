# Lot nl - doutes et fiches laissees telles quelles

Aucune fiche du lot ne semble annulee. Les points ci-dessous sont soit des donnees
non publiees a ce jour (31 aout 2026), soit des sources que je n'ai pas pu ouvrir.

## Dates verifiees au passage (aucune correction a faire)

- 565 **Shelter: Archie Hamilton** : le slug de la page Shelter dit `19-09-...` mais la page
  elle-meme affiche **26.09.2026**, et la vignette de l'agenda porte `data-date="2026-09-26"`.
  Le catalogue a raison, c'est le slug de l'organisateur qui est errone.
  https://www.shelteramsterdam.nl/event/19-09-archie-hamilton-dxnby-jhobei-more/
- 332 **BASIS x BCCO w/ Ignez** : bien le **vendredi 18 septembre** (une recherche renvoie
  parfois le 19, c'est faux). https://clubbasis.nl/events/
- 128 **Awakenings ADE - Drumcode** : 22/10, SugarFactory, confirme par awakenings.com.
- 132 **Boris Brejcha pres. FCKNG SERIOUS x Loveland** : 24/10, Theater Amsterdam, 15h30-21h30.
- 158 **Defqon.1 2027** : 24-27 juin 2027 confirme sur defqon1.com.
- 146 **DGTL Amsterdam 2027** : 26-28 mars 2027 confirme sur dgtl.nl.
- 388 **Intents Festival** : 4-6 juin 2027 confirme sur intentsfestival.nl.
- 382 **Rewire 2027** : 8-11 avril 2027 confirme, et Diamanda Galas est bien le **seul** nom
  annonce a ce jour (« Ahead of the first line-up announcement later this year »).
  https://rewirefestival.nl/event/rewire-2027
- 815 **Ghosttown** : 09/01/2027 TivoliVredenburg confirme (organisateur Dance 2 Eden).
  Onglets « Line-up » et « Tickets » vides sur la page officielle.
- 824 **PACT** : sam. 23 jan. 2027, Het Sieraad, 16h-00h, « 6-hand live performance | Support TBA ».
  Le line-up a trois noms du catalogue est donc complet. https://hetsieraad.nl/
- 788 **Vieze Asbak b2b Kruelty All Day Long** : 05/12/2026 AFAS Live confirme par l'organisateur
  (Free Your Mind), **« completely sold out »**. A noter : la date **n'apparait pas** dans
  l'agenda d'afaslive.nl, ce n'est pas un signe d'annulation, la salle ne liste pas ce loueur.
  https://freeyourmindfestival.nl/events/vieze-asbak-b2b-kruelty-all-day-long/

## Prix laisses tels quels, et pourquoi

- **Toutes les fiches Shelter Amsterdam** (535, 546, 551, 553, 565, 609, 613, 617) : la
  billetterie passe par **fourvenues.com**, qui repond 403 depuis le conteneur (mur anti-bot,
  y compris via WebFetch et via l'iframe `assets/iframe/...`). Le site de la salle ne publie
  aucun tarif. Les 20 € estimes restent.
- **609 Shelter ADE: 20 Years of The Warehouse Project** et **613 / 617** : les affiches Shelter
  sont des **images**, aucun line-up en texte sur le site. Rien a ajouter sans inventer.
- 316 **Draaimolen** : festival **sold out**, revente TicketSwap uniquement. Le tarif retenu
  (83 €) vient de festivalfans.nl, pas de la billetterie, d'ou `estimated`.
- 328 **BASIS x HARDLINE w/ Alarico** : contrairement aux deux autres soirees BASIS, la fiche
  ne publie **que** le doorsale (20 €), pas le tarif early entry. J'ai prefere ne rien ecrire
  plutot que d'ecrire 20 € comme prix d'entree.
- 341 **Supremacy** et 381 **Masters of Hardcore**, 820 **Supremacy Classics** : les boutiques
  `shop.supremacy.nl` / `shop.mastersofhardcore.com` sont des SPA Astro rendues en JS, aucun
  tarif dans le HTML servi.
- 345 **Gabber Resistance** : 35 € vient de djguide.nl (source secondaire), d'ou `estimated`.
  La page Maassilo confirme la date mais pas le tarif.
- 358 **Pussy Lounge** (Ahoy, 31/10) : **sold out** et **aucun artiste annonce** a ce jour
  (b2s communique une soiree « line-up d'artistes iconiques » sans noms). Line-up laisse vide.
- 370 **Toffler Indoor Festival - 15 Years** : billetterie Paylogic (API authentifiee), et
  `tofflerindoorfestival.nl` n'a publie **aucun** line-up 2026 a ce jour.
- 387 **Toffler Festival 2027** : billetterie **pas encore ouverte** (« sign up newsletter »).
- 388 **Intents Festival 2027** : la page `/tickets/` annonce « **No sale at the moment** ».
  Les tarifs Super Early Bird qui y figurent (Friday Regular 39 €, weekend+camping 179 €)
  ne portent **aucun millesime** et pourraient etre ceux de 2026 : non repris.
- 154 **Awakenings Upclose 2027** : « Regular ticketsale for Upclose 2027 starts end of 2026 ».
- 161 **Awakenings Festival 2027** : billets en vente mais aucun tarif ni line-up dans le HTML.
- 461, 467 (**Thuishaven**), 942, 358, 788, 365 : **sold out**, donc aucun tarif courant a lire.
  Pour 461 et 467 le line-up, lui, est complet et a ete recupere.
- 127 **Amsterdam Dance Event** : programme-ombrelle de 300+ lieux, il n'y a pas de « prix
  d'entree » unique a verifier ; le pass ADE se vend par jour et par soiree.
- 375 **Liquicity Winterfestival** : la page officielle affiche « **ARTISTS TBA** ».

## Sources qui n'ont pas repondu depuis le conteneur

- `ra.co`, `partyflock.nl`, `tivolivredenburg.nl`, `elrow.com` (502 constant, donc **711 elrow
  ADE - Dance with the Serpent** reste sans line-up ni tarif), `fourvenues.com`,
  `shop.eventix.io` / `weeztix` (SPA + API authentifiee), `shopping-api.paylogic.com`
  (OAuth), `intents-festival.nl`, `deinterventie.nl`, `gabberresistance.nl`.
- `djguide.nl` repond de facon intermittente puis bascule en 403 : utilisable pour une ou
  deux pages, pas pour un balayage.
- `draaimolenfestival.nl` et `pussylounge.nl` sont **des noms de domaine en vente**, ce ne
  sont plus les sites officiels (draaimolen.nu et b2s.nl / pussy-lounge par b2s les remplacent).

## Points de nommage a relire avant fusion

- 316 **Draaimolen** : j'ai **ecarte** « Emma » et « Dimitri » de l'affiche (prenoms seuls,
  homonymes impossibles a trancher, ils creeraient une fiche artiste fausse), ainsi que
  « To Be Announced », « The Secret Guest », « The Secret Live Act » et un « The Secret b2b »
  laisse incomplet par la source. Les b2b sont eclates en noms individuels.
- 945 **FRENZY x SHOCKWERK** : radion.amsterdam ecrit « Diachi Wada », le catalogue « Daichi
  Wada ». J'ai garde la graphie du catalogue.
- 353 **Megarave** : l'affiche de la salle est tout en capitales ; remise en casse normale,
  et « PANIC & MC ALEE (3 HOUR SET) » separe en deux artistes.
- 340 **De Interventie - Blackout II** : la ligne de la salle est
  « DT43 B2B VINO SPECIAL, CLOSING, IMPERIA, MYSTERY ACT(S), ØRGIE, RAXELLER, SNTS ».
  « CLOSING » et « MYSTERY ACT(S) » ne sont pas des noms d'artiste, ecartes.
