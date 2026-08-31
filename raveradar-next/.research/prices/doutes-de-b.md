# Lot de-b (Allemagne / Autriche / Suisse) - doutes et fiches laissées telles quelles

Relevé du 31 août 2026. Tout ce qui suit est ce que je **n'ai pas** pu trancher sur une
source primaire lisible depuis le conteneur.

## 1. Fiches qui demandent une vérification humaine (par ordre de gravité)

### 777 - FAIRGROUND Festival (28/11/2026, Messegelände Hannover) : line-up publié faux
Le catalogue annonce **Amelie Lens, Charlotte de Witte, Kyanu, Maddix**. Aucun de ces quatre
noms ne figure sur l'affiche 2026 de l'organisateur
(<https://fairground-festival.de/lineup/>), qui liste 30 artistes sur quatre scènes, têtes
d'affiche Boris Brejcha, Deborah de Luca, Alfred Heinrichs et Kevin de Vries. Ce sont
vraisemblablement des noms d'une édition précédente. Le line-up de remplacement est dans
`lineups-verif-de-b.json` ; l'organisateur promet 6 scènes et 70+ artistes, l'affiche n'est
donc pas close.

### 803 - Psy-Spirits (19/12/2026, Edelfettwerk, Hambourg) : introuvable sur les deux sites officiels
- L'agenda de l'organisateur (<https://psy-spirits.de/events/>) ne liste **qu'un** événement
  à venir : Empire of Goa, 03/10/2026, au **Docks Reeperbahn**, pas à l'Edelfettwerk.
- L'agenda de la salle (<https://edelfettwerk.de/events/>) s'arrête au 27/11/2026 et ne
  porte rien le 19/12.
Ce n'est pas une preuve d'annulation (le calendrier de la salle peut simplement ne pas aller
si loin), mais la fiche annonce une date, une salle et un organisateur dont aucun des deux
sites ne parle. À revérifier avant de la laisser en avant.

### 560 - YN x BCCO Club Night : « A-Z » n'est pas un artiste
Le catalogue porte **« A-Z »** en tête de line-up. C'est l'en-tête de la liste sur la fiche
Grelle Forelle (« lineup / A-Z »), pas un DJ. Il a donc une fiche `/artistes/a-z` fantôme.
Le line-up corrigé (8 noms réels) est dans le JSON.

### 839 - Arena Rave (20/02/2027, Messe Leipzig) : absent du site de l'organisateur
<https://arena-rave.de/> ne liste, en « upcoming », que Arena Rave Rostock (04/12/2026) et
deux soirées Boom Room au Docks ; l'édition Leipzig 2027 n'y apparaît **ni** en à venir
**ni** en passé. Elle est en revanche référencée par des agendas tiers
(<https://raveintograve.de/festival/arena-rave-leipzig-2027/>, eventim, leipzig-im.de).
Un résumé de moteur de recherche évoquait une annulation ; **je n'ai trouvé aucune source
qui l'affirme**, donc à ne surtout pas supprimer sur ce seul soupçon. À reposer à
l'organisateur ou à surveiller.

### 663 - FOG Festival : Franck Vigroux
Il est au catalogue mais n'apparaît sur aucune des pages 2026 accessibles
(<https://www.fogstudio.ch/about-fog/>, <https://www.kaserne-basel.ch/de/events/fog2026>).
Le programme complet (26 contributions annoncées) n'est publié nulle part de lisible :
See Tickets CH répond 403 et la page « FOG Festival » du site porte encore le texte 2025.
Je l'ai **conservé** dans le line-up du JSON pour ne pas le perdre à la fusion, mais il est
à reverifier.

## 2. Line-ups réellement non annoncés (fiche correcte, rien à ajouter)

| id | fiche | ce que dit la source |
|---|---|---|
| 503 / 506 | KitKatClub au Bootshaus (24/10 et 30/12) | « DJ LineUp: to be announced » sur la fiche du 24/10 ; la fiche du 30/12 n'a aucun contenu. <https://bootshaus.tv/events/sa-24-10-2026-kitkatclub> |
| 756 | Wonderful Days Cologne (14/11) | « ein hochkarätiges Line-up » sans un nom. <https://wonderfuldays-festival.com/event-item/wonderful-days-the-classic-rave-festival-vol-x/> |
| 373 | Rave on Snow (10-13/12) | 70 DJs annoncés, aucun nommé. <https://raveonsnow.com/> (la page `/lineup` est en 404) |
| 763 | Polaris Festival (Verbier) | « LINE UP WILL BE ANNOUNCED SOON ». <https://polarisfestival.ch/> |
| 141 | CTM Festival (22-31/01/2027) | thème « process…ing » annoncé, programme non publié. <https://www.ctm-festival.de/> |
| 834 | Masters of Hardcore Austria (13/02/2027) | « 𝐋𝐈𝐍𝐄-𝐔𝐏: TBA ». <https://www.volume.at/events/masters-of-hardcore-austria-2027-2027-02-13/> |
| 845 | Elevate Festival (04-07/03/2027) | le site en est encore à « Thank you for Elevate Festival 2026 ». <https://elevate.at/de/> |
| 147 | Time Warp (03/04/2027) | fiche officielle complète (Maimarkthalle, 19:00-14:00, 5 floors) mais « expect a powerful lineup », aucun nom. <https://www.time-warp.de/germany/mannheim/> |
| 164 | Parookaville (16-18/07/2027) | page Line-Up : « so far » suivi de rien. <https://www.parookaville.com/en/line-up/> |
| 658 | Nature One (29/07-01/08/2027) | « At the moment, no lineup is available ». <https://www.nature-one.de/en/lineup> |
| 394 | Electric Love (08-10/07/2027) | dates confirmées, aucune page line-up. <https://www.electriclove.at/en/> |
| 390 | Ikarus Festival (25-27/06/2027) | ikarus-festival.**com** rend un certificat auto-signé (curl refuse) ; le site vivant est ikarus-festival.**de**, où aucun nom n'est annoncé. **Corriger le lien du catalogue si besoin.** |
| 386 | Sputnik Spring Break (14-17/05/2027) | le site est une page MDR rendue en JS, illisible depuis le conteneur ; la seule mention trouvée est le line-up **2026**. |
| 496 / 500 / 556 / 607 / 629 / 643 / 683 / 755 | soirées à une seule tête d'affiche | vérifié : Vertile, OGUZ, Trancemaster Krause, Thylacine, Mija, Ellen Allien et Paul van Dyk sont bien seuls (les autres places sont « tba »). Rien à ajouter. |
| 872 / 527 / 338 / 351 / 366 | Cosmic Gate, Hard Cœur, Hard Bounce, Ninja Warriors, Space Odyssey | line-up du catalogue **confirmé au mot près** sur la fiche officielle. Rien à ajouter. |

## 3. Line-ups introuvables faute d'accès (sources bloquées)

- **670 - Verknipt Berlin (09-10/10/2026, Club OST)** : `verknipt.org` et `verknipt.nl`
  répondent 403 (Cloudflare) en curl **et** en WebFetch ; RA est bloqué ; l'agenda de
  <https://clubost.de/> s'arrête au 30 septembre. La date et la salle sont confirmées par
  le titre de la page Verknipt (« Verknipt Germany tour Berlin | 9 & 10 October, 2026 -
  Club OST »), mais aucune affiche lisible.
- **804 - Verknipt Stadion (19/12/2026, Hallenstadion Zurich)** : même mur Cloudflare.
  L'agenda suisse ubwg.ch, qui reprend le communiqué, écrit « Line-Up: tba ». Le **tarif**,
  lui, est publié par la salle et il est dans `prices-de-b.json`.
- **378 - Hippie New Year (31/12/2026, Ritter Butzke)** : la fiche du club
  (<https://club.ritterbutzke.com/event/311226-HippieNewYear>) ne publie pas de line-up
  (« Grundsätzlich veröffentlichen wir den timetable vorab nicht ») et la billetterie non
  plus. Des noms circulent sur RA (bloqué) ; je ne les recopie pas.
- **755 - NTO à O der Klub (14/11/2026, Vienne)** : <https://o-klub.at/> ne rend que ses
  quatre prochaines dates, le reste passe par un « Load More » en JS. Date non reconfirmée.

## 4. Tarifs non obtenus, et pourquoi

- **D! Club Lausanne (527, 540, 338, 351, 607, 366)** : la billetterie est un **widget
  Weezevent en JS** (`widget.weezevent.com/ticket/E…`) qui ne rend qu'un `<div id="root">`
  vide, en curl comme en WebFetch ; la page miroir `my.weezevent.com` porte la description
  mais pas les tarifs, et l'API publique renvoie 404 sur tous les points d'accès essayés.
  Les six fiches gardent leur valeur actuelle. Les line-ups, eux, ont été vérifiés.
- **Grelle Forelle (543 Mahlwerk, 556 Trancemaster Krause)** : preventes sur `stager.co`
  (page vide sans JS) et `eventim-light.com` (503). Les quatre autres soirées Grelle Forelle
  passent par ticket.io et leurs tarifs sont dans le JSON.
- **498 - Unreal Weekender Night II** : **SOLD OUT**, la billetterie ne vend plus que des
  casiers. Aucun tarif d'entrée lisible, et la fiche devrait sans doute le dire.
  <https://unreal-bootshaus.ticket.io/Zt24QJcV>
- **539 - Schranz is Back** : les quatre phases de prévente (15/18/21/24 EUR) sont
  ausverkauft, il ne reste que la caisse du soir, dont le tarif n'est pas publié. J'ai
  écrit 24 EUR en `estimated` avec la raison.
- **317 - Beatpatrol Festival** : billetterie oeticket (famille eventim), bloquée. Le
  catalogue garde 119 EUR estimé. Line-up, lui, vérifié et complet.
- **728 / 743 - Sky Club Leipzig** : les pages `/event/tickets/…` affichent le line-up
  complet mais aucun prix.
- **683 - Paul van Dyk au Docks** : billetterie `tickets.me-events.de`, application JS.
- **763 - Polaris Festival** : billetterie Smeetz en JS, aucun montant dans le HTML.
- **164 - Parookaville** : `tickets.parookaville.com` redirige vers `shop.ticketpay.de`,
  qui répond 403. Le catalogue garde 149 EUR estimé.
- **147 - Time Warp** : le shop `tickets.time-warp.de/…/offsale` ne rend rien.
  Le catalogue garde 89 EUR estimé.
- **148 - Snowbombing** : vendu en **packages** (voyage + hébergement + wristband), pas en
  billet d'entrée ; les Early Birds sont sold out et la vague suivante n'est pas ouverte.
  Le 269 GBP estimé du catalogue reste ce qu'on peut dire de moins faux.

## 5. Notes de devise (à vérifier à la fusion)

Deux fiches suisses portaient un tarif **en euros** alors que le paiement se fait en francs :
- **326 Teletech x DAY|RAVE** (Bâle) : catalogue « ≈ 38 € », réel **CHF 25**.
- **374 Azyr au Nordstern** (Bâle) : catalogue « ≈ 38 € », réel **CHF 20**.
Les autres fiches suisses du lot (527/540/338/351/607/366 à Lausanne, 663 à Bâle, 666 et 804
à Zurich, 763 à Verbier) sont à contrôler pour la même raison.

## 6. Sources du lot, ce qui marche et ce qui ne marche pas

**Marche** : `bootshaus.tv/events/{slug}` (bloc Begin/End/**Location**/Line-Up), les pages
`ticket.io` **via WebFetch uniquement** (403 en curl), `grelleforelle.com` (avec
`www.`, sinon connexion coupée), `dclub.ch/agenda/{date}/{slug}`, `tickets.nordstern.com`,
`postgarage.at` + `shop.eventjet.at`, `skyclub-leipzig.de/event/tickets/…`,
`docks.de/events/…`, `maag-moments.ch`, `hallenstadion.ch`, `liquicity.com` +
`tickets.memorandum.at`, `renate.cc`, `fogstudio.ch`, `kaserne-basel.ch`,
`fairground-festival.de`, `raveonsnow.ticket.io`, `time-warp.de`, `volume.at`.

**Bloqué depuis le conteneur** : Resident Advisor (403), `verknipt.org` / `verknipt.nl`,
`mastersofhardcore.com` et `.at` (Cloudflare/wpewaf), `seetickets.com`, `shop.celebratix.io`,
`shop.ticketpay.de`, `events.tickethead.io`, `eventim-light.com` (503), `oeticket`,
`ticketcorner`, `songkick.com` (406), les widgets Weezevent et Smeetz.
`postgarage.at` et `grelleforelle.com` exigent le préfixe `www.`.
