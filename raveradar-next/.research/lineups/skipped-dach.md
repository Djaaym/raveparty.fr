# Line-ups DACH — fiches laissées vides (30 août 2026)

38 fiches passées en revue, 8 line-ups relevés (`lineups-dach.json`). Ci-dessous les
30 laissées vides, avec la source consultée et la raison. Aucun line-up n'a été
reconstitué depuis une édition précédente.

## ⚠️ À vérifier en priorité — signal d'annulation non confirmé

- **id=839 — Arena Rave, Messe Leipzig, 20/02/2027.** Plusieurs résumés de moteur de
  recherche affirment que l'édition est **annulée « aus produktionstechnischen
  Gründen »**, billets remboursés automatiquement. **Je n'ai pas pu le confirmer sur
  une source primaire lisible depuis le conteneur** : eventim.de répond 000/503 au
  curl, ticketcorner et RA sont bloqués, et la fiche du calendrier officiel de la
  ville (<https://www.leipzig-im.de/veranstaltung/225094/arena-rave>) présente au
  contraire l'événement comme confirmé, avec « Das Line-up wird in Kürze bekannt
  gegeben ». Idem sur <https://raveintograve.de/festival/arena-rave-leipzig-2027/>,
  qui ne mentionne aucune annulation. **À rouvrir depuis un réseau non filtré avant
  de toucher à la fiche** : si l'annulation est vraie, il faut retirer l'événement et
  faire entrer `/festival/arena-rave` dans `lib/renamed.ts`, jamais le laisser en 404.
  Line-up : aucun de toute façon.

## Fiches sans line-up publié

### Allemagne

- **id=502 — Affenkäfig Rules, Bootshaus, 23/10/2026.** La fiche officielle le dit
  explicitement : « Das Line Up hauen wir euch bald um die Ohren ».
  <https://bootshaus.tv/events/affenkaefig-rules-bootshaus-koeln>
- **id=503 — KitKatClub au Bootshaus, 24/10/2026.** « DJ LineUp: to be announced ».
  <https://bootshaus.tv/events/sa-24-10-2026-kitkatclub>
- **id=506 — KitKatClub au Bootshaus – 30 décembre, 30/12/2026.** « DJ LineUp: to be
  announced ». <https://bootshaus.tv/events/mi-30-12-2026-kitkatclub>
- **id=377 — Bootshaus & Loonyland — NYE, 31/12/2026.** Fiche officielle en ligne,
  aucun nom : « carefully curated lineups » et rien d'autre.
  <https://bootshaus.tv/events/bootshaus-loonyland-pres-nye-2026>
- **id=756 — Wonderful Days Cologne, Bootshaus, 14/11/2026.** Page de l'organisateur
  (Vol. X) : « Euch erwartet ein hochkarätiges Line-up… », aucun nom.
  <https://wonderfuldays-festival.com/event-item/wonderful-days-the-classic-rave-festival-vol-x/>
- **id=670 — Verknipt Berlin, Club OST, 09/10/2026.** `verknipt.org` répond **403
  (Cloudflare)** au curl comme au WebFetch, et RA est bloqué. Les seuls noms qui
  circulent (Vieze Asbak, Nikolina…) proviennent du **Verknipt Festival d'Utrecht**,
  pas de la date berlinoise : ne pas les recopier.
- **id=696 — Harder Force Indoor Festival, Holstenhallen Neumünster, 17/10/2026.**
  <https://www.harderforce.de/> annonce la date sans un seul nom (site Wix, reste du
  contenu en JS) ; la billetterie ticketticker.de répond 403 (Cloudflare) ; l'agenda
  du lieu (<https://www.wasgehtapp.de/location.php?id=1446>) ne liste que la date.
  ⚠️ Les noms qui remontent en recherche (D-Charged, Rooler, Krowdexx…) sont ceux du
  **Harder Force Open Air de Heide (mai 2026)**, un autre événement.
- **id=727 — Faceless Psycho City, Turbinenhalle Oberhausen, 30/10/2026.**
  « MORE INFO COMING SOON! » sur la fiche.
  <https://www.harderdates.de/event/faceless-presents-psycho-city/2026-10-30/>
- **id=793 — INSANE Strictly Hard, Docks Hamburg, 12/12/2026.** Le site officiel
  affiche la date, le lieu et le prix, aucun artiste.
  <https://insane-festival.de/events/>
- **id=803 — Psy-Spirits, Edelfettwerk Hamburg, 19/12/2026.** Le site de
  l'organisateur ne liste **qu'un seul événement à venir**, « Empire of Goa 2026 »
  le 03/10/2026 aux Docks, puis « Momentan sind keine weiteren Events gelistet ».
  Rien pour le 19/12 à l'Edelfettwerk → **la date elle-même est à re-vérifier**, en
  plus du line-up. <https://www.psy-spirits.de/>
- **id=378 — Hippie New Year, Ritter Butzke Berlin, 31/12/2026.** La fiche officielle
  existe mais le club **ne publie pas de timetable à l'avance** (« Grundsätzlich
  veröffentlichen wir den timetable vorab nicht »). Les noms qui remontent en
  recherche (Oliver Koletzki, Dominik Eulberg, Format B…) viennent de la page RA de
  l'**édition 2025**. <https://club.ritterbutzke.com/event/311226-HippieNewYear>
- **id=141 — CTM Festival, Berlin, 22/01/2027.** La section « Festival 2027 » du site
  n'a que Welcome / Theme / Open Calls / Press — ni Programme ni Artists.
  <https://www.ctm-festival.de/festival-2027>
- **id=830 — APEX, Maimarkthalle Mannheim, 30/01/2027.** « the biggest Hardstyle
  lineup in our history will be presented on two stages », aucun nom ; la vente n'est
  même pas ouverte. <https://apexfest.de/>
- **id=655 — TMF (Trier Music Festival), Messehalle Trier, 20/03/2027.** Onglet
  « Line-Up » présent mais vide, page en « SEE YOU NEXT YEAR! ».
  <https://www.tmf-festival.de/>
- **id=147 — Time Warp, Maimarkthalle Mannheim, 03/04/2027.** Page officielle de
  l'édition allemande 2027 : texte de présentation, billets en vente, **aucun nom**.
  Le line-up visible sur le site est celui du **21/03/2026**, édition passée — ne pas
  le recopier. <https://www.time-warp.de/germany/mannheim/>
- **id=149 — Mayday, Westfalenhallen Dortmund, 30/04/2027.** « Momentan ist noch kein
  LineUp verfügbar. » <https://www.mayday.de/lineup>
- **id=386 — Sputnik Spring Break, Pouch, 14/05/2027.** Le site officiel (MDR) ne
  publie que le « SSB 2026 Lineup & Running Order ».
  <https://www.sputnik-springbreak.de/>
- **id=389 — World Club Dome, Deutsche Bank Park Francfort, 04/06/2027.** Page
  Line-up de l'édition 2027 : « No items found » sur les trois jours.
  <https://www.worldclubdome.com/lineup>
- **id=390 — Ikarus Festival, Allgäu Airport, 25/06/2027.** Aucune page line-up sur le
  site (404), aucun nom annoncé. <https://www.ikarus-festival.de/>
- **id=392 — Ruhr-in-Love, OLGA-Park Oberhausen, 03/07/2027.** La page Line-up dit
  « Momentan ist noch kein LineUp verfügbar »
  (<https://www.ruhr-in-love.de/lineup>). ⚠️ La **page d'accueil** de la même édition
  cite pourtant trois noms au fil du texte (Klaudia Gawlas en b2b avec Felix Kröcher
  sur le floor « Klaudia Gawlas and Friends », Gestört aber GeiL sur la Center Stage)
  — <https://www.ruhr-in-love.de/>. Les deux pages du même site se contredisent :
  **non retenu**, à reprendre quand le line-up officiel sortira.
- **id=164 — Parookaville, Airport Weeze, 16/07/2027.** La page « Line-Up » affiche
  « so far » puis une grille vide. <https://www.parookaville.com/en/line-up/>
- **id=657 — Open Beatz Festival, Herzogenaurach, 23/07/2027.** La page Artists ne
  montre que le « Line Up 2026 ». <https://www.openbeatz.de/artists>
- **id=658 — Nature One, Raketenbasis Pydna, 29/07/2027.** « Momentan ist noch kein
  LineUp verfügbar. » <https://www.nature-one.de/lineup>

### Autriche

- **id=834 — Masters of Hardcore Austria, VAZ St. Pölten, 13/02/2027.** Date, horaires
  et tarifs confirmés partout, **aucun artiste annoncé** ; l'édition ne figure même
  pas encore dans les « Club tours/hostings » du site officiel
  (<https://www.mastersofhardcore.com/events>), et `mastersofhardcore.at` répond 403
  (Cloudflare). ⚠️ La fiche VAZ `vaz.at/events/event.php?id=5273` porte un line-up
  complet **mais pour le 18 janvier 2025** — édition passée, ne pas la recopier.
- **id=373 — Rave on Snow, Saalbach-Hinterglemm, 10/12/2026.** Site officiel :
  billetterie ouverte pour le 10-13/12/2026, mais `raveonsnow.com/lineup` répond 404
  et la dernière actualité « LINEUP ONLINE » date du 18/09/2025 (édition 2025).
  <https://raveonsnow.com/>
- **id=845 — Elevate Festival, Graz, 04/03/2027.** Le site en est encore à « Thank you
  for Elevate Festival 2026! », aucune page 2027. <https://elevate.at/en/>
- **id=394 — Electric Love Festival, Salzburgring, 08/07/2027.** Aucune page line-up
  (404) ; la date 8-10/07/2027 est confirmée, les noms non.
  <https://www.electriclove.at/en/>

### Suisse

- **id=763 — Polaris Festival, Verbier, 20/11/2026.** En toutes lettres sur le site :
  « LINE UP — WILL BE ANNOUNCED SOON ». <https://polarisfestival.ch/>
- **id=804 — Verknipt Stadion, Hallenstadion Zurich, 19/12/2026.** Page officielle du
  Hallenstadion (<https://hallenstadion.ch/events/verknipt/>) : texte de présentation,
  tarifs, aucun artiste. L'agenda partenaire ubwg.ch écrit « Line-Up: tba », et le
  promoteur suisse welovetechno.ch ne liste que la date. Les quatre noms qui
  remontent en recherche (Kruelty, Nikolina, Onlynumbers, Vieze Asbak) proviennent de
  RA, inaccessible d'ici, et ne sont recoupés par aucune source lisible → non retenus.

## Notes de méthode

- **Bloqués depuis ce conteneur** : `ra.co` / `de.ra.co`, `verknipt.org`,
  `mastersofhardcore.at`, `ticketticker.de`, `eventim.de`, `ticketcorner.ch`
  (Cloudflare ou refus du proxy sortant), ainsi que `polaris-festival.ch`,
  `raveonsnow.at` et `tmf-trier.de` (CONNECT refusé — les domaines alternatifs
  `polarisfestival.ch`, `raveonsnow.com` et `tmf-festival.de` passent, eux).
- **`bootshaus.tv` reste la meilleure source d'Allemagne** : bloc `Begin / End /
  Location / Line-Up`. Champ `Location` vérifié sur chaque fiche retenue — la fiche
  `19-9-26-bc173-airport-session` du même soir que le Sommerfest Closing se tient au
  **Moxy Köln/Bonn Flughafen**, pas au club : elle ne correspond à aucune fiche du
  catalogue.
- **`skyclub-leipzig.de/event/list`** et **`postgarage.at/program/`** sont rendus côté
  serveur et portent le line-up complet par événement : deux bonnes sources à garder.
- **`harderdates.de`** est un agenda fiable pour les harder styles allemands (fiche
  par événement, lieu, horaires) mais ne porte presque jamais le line-up.
