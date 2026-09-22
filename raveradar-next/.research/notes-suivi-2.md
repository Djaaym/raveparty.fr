# Notes de vérification, lot « suivi 2 » (Royaume-Uni + Italie + Danemark)

Vérifications faites le 22 septembre 2026. Une ligne par fiche, puis ce qui n'est pas tranché.

## Ce qui est écrit, fiche par fiche

### id 222, AVA London, 24-26/09/2026, The British Library
- **Line-up : 26 noms écrits.** Programme final publié par l'organisateur
  (https://avafestival.com/ava-london-announces-final-2026-programme-schedule/), recoupé par
  https://www.dancerebels.com/2026/09/10/ava-london-final-artist-additions-and-delegate-information/
  Conférence à la British Library : Moby (keynote à distance), Oklou, The Avalanches, Fabio,
  Grooverider, Footsie, Jamz Supernova, FLOHIO, Shy One, Tim & Barry, Elkka, Sama' Abdulhadi,
  patten, Elijah. Soirées du programme, dans les autres salles : Blawan, Mala, Bitter Babe
  (Outernet, vendredi), Optimo, Swoose, Holly Lester, Body Clinic, JWY (FOLD, vendredi),
  Skin On Skin, Evian Christ, Croatian Amor, mi-el (EartH, samedi).
- **Tarif : 85 £ au lieu de 151 £.** La page de billetterie officielle
  (https://avafestival.com/london/tickets/) vend un Thursday Conference Day Pass et un Friday
  Conference Day Pass « from £85 », tous deux en vente. Le 151 £ du catalogue est le Pro Pass
  journée seule, c'est-à-dire le pass complet des deux journées, pas le tarif d'entrée.
- **Billetterie :** lien approfondi vers la page tarifs plutôt que vers `/london/` (`replaceTicket`).
- **Description réécrite** : formule de la conférence, salles des soirées, et le fait que les
  soirées sont billettées séparément du pass.

### id 466, Steppers at Drumsheds, 26/09/2026
- **Line-up : rien écrit, et c'est la réponse.** La fiche officielle Drumsheds
  (https://drumshedslondon.com/event/steppers/) affiche « TBA » à quatre jours de la date, et le
  JSON-LD Skiddle ne porte que le promoteur (« Continental GT »), pas une affiche.
- **Tarif : pas de ligne prix.** Le tarif officiel affiché reste « FROM £38.45 + BF », soit
  exactement la valeur du catalogue ; `prices/ingest.py` arrondit à l'entier, donc une ligne prix
  aurait dégradé 38.45 en 38 sans rien apprendre. Seule la billetterie est reprise.
- **Billetterie :** lien approfondi vers la fiche du lieu, à la place de `/whats-on/`. Attention,
  la vente est **fermée** : Drumsheds affiche « JOIN WAITING LIST » et l'unique offre Skiddle
  (« Extra Release », 36,50 £) est en `SoldOut`. Le lien mène donc à la liste d'attente.
- **Description réécrite** : salle X, 17 h - 1 h, 18+, affiche non publiée, liste d'attente.
- **À corriger hors de ces deux chaînes :** le catalogue porte `time: "13:00"`, l'organisateur
  annonce 17 h - 1 h.

### id 475, Bugged Out! 2001 On, 10/10/2026, Drumsheds
- **Line-up : rien à ajouter.** Les 24 entrées du catalogue couvrent exactement l'affiche publiée
  par Drumsheds (https://drumshedslondon.com/event/bugged-out-2001/), à un détail de forme près :
  le catalogue réunit « Kittin & The Hacker » là où la salle écrit « Kittin b2b The Hacker ».
  Pas de ligne de line-up, donc.
- **Tarif : 36,95 £** (« Early Entry - Pre 2pm », en vente), le plus bas palier réellement vendu
  au 22/09. Le premier palier d'entrée générale (51,95 £) est épuisé, les suivants sont à 56,95 £.
  Arrondi par l'ingest à 37, soit la valeur déjà publiée : la ligne ne sert qu'à dater la
  vérification.
- **Description réécrite** : trois salles X / Y / Z, 13 h - 22 h 30, 18+, lives et volet french touch.

### id 473, Don't Let Daddy Know London, 09/10/2026, Drumsheds
- **Line-up : rien à ajouter.** Les 8 noms du catalogue sont exactement ceux de la fiche officielle
  (https://drumshedslondon.com/event/dldk/) : Ben Nicky, Dimitri Vegas, HALŌ, Krewella,
  Nicky Romero, R3HAB, plus Amy Wiles et P.O.U en support.
- **Tarif : 44,95 £ au lieu de 34 £.** Le 34 £ du catalogue vient du palier « General Admission -
  3 for 2 » (33,96 £), aujourd'hui **épuisé**, de même que la 1re release à 49,95 £. Le plus bas
  palier encore en vente est « Pre-8pm Entry » à 44,95 £ (puis Pre-9pm à 49,95 £ et GA 2e release
  à 54,95 £). Arrondi à 45 par l'ingest.
- **Description réécrite** : huitième édition britannique et première à Londres, salle X,
  19 h - 3 h, 18+.

### id 558, Tomorrowland Symphony of Unity, 25/09/2026, Arena di Verona
- **Line-up : rien écrit, volontairement.** Le spectacle n'a pas d'affiche de DJs : c'est un
  orchestre d'une cinquantaine de musiciens dirigé par **Kevin Houben** (Orchestre national de
  Belgique), qui rejoue des morceaux d'Avicii, Tiësto, David Guetta, Faithless, Energy 52,
  Eric Prydz et Swedish House Mafia. Ces noms ne jouent pas, ils sont au répertoire : les écrire
  au line-up serait faux. Le chef d'orchestre reste hors du line-up lui aussi (il ouvrirait une
  fiche artiste dont les genres seraient déduits du calendrier électro, exactement ce que la
  règle sur `ARTIST_STYLES` interdit) ; il est nommé dans la description.
- **Tarif : 45 €, `estimated`.** Aucune billetterie n'est lisible depuis le conteneur
  (TicketOne 503, Ticketmaster 403, teatro.it et rockol derrière Cloudflare, ticketsms.it est une
  SPA dont l'API répond 502). Le « a partire da 45 euro » vient d'une source secondaire,
  concerti-italia.it, d'où `estimated` et non `null`.
- **Billetterie : inchangée**, le lien Ticketmaster encapsulé (affilié Impact) est conservé.
- **Description réécrite** sur la fiche du promoteur Zed Live
  (https://zedlive.com/evento/arena-di-verona-vr-symphony-of-unity-tomorrowland/) : origine 2019 au
  Tomorrowland, passage au Sphere de Las Vegas, première italienne, chef d'orchestre, répertoire,
  aftershow officiel.

### id 255, Roskilde Festival, 26/06 au 03/07/2027
- **Line-up : rien, et c'est publié comme tel.** `roskilde-festival.dk/en/line-up/` répond 404 et
  le site pousse au contraire « Send music wishes for RF27 » (actualité du 14/09/2026) : aucune
  vague d'artistes n'est annoncée pour 2027. Un line-up trouvé ailleurs serait celui de RF26.
- **Tarif : rien écrit.** https://www.roskilde-festival.dk/en/tickets/ annonce « Ticket sales for
  RF27 will kick off soon » : aucun tarif publié, donc les 2 616 kr `estimated` du catalogue
  restent le meilleur état possible. Ne pas les passer en confirmé.
- Dates confirmées par l'en-tête du site officiel : 26/6 - 3/7 2027.

## Ce que je ne tranche pas

1. **Richie Hawtin à AVA London, à vérifier à la main avant la date.** Il figure au line-up publié
   du catalogue et il était bien dans la **première** annonce de l'organisateur
   (https://avafestival.com/ava-london-conference-announces-first-speakers/). Deux éléments vont
   contre : le **programme final**, qui détaille chaque session par salle et par horaire, ne le
   porte plus (https://avafestival.com/ava-london-announces-final-2026-programme-schedule/), pas
   plus que la reprise du 10/09 chez Dance Rebels ; et une recherche web rend la phrase « Due to
   unforeseen circumstances, Richie Hawtin is no longer able to attend AVA in London » sans que
   j'aie pu remonter à la page qui la porte (avafestival.com répond 403 en curl, et la version
   WebFetch de l'article ne contient pas la phrase). Je ne le retire donc pas, c'est une décision
   de relecture : `--merge` ne peut pas l'enlever de toute façon, il faut une correction à la main.
2. **AVA London, périmètre du line-up.** J'ai inclus les artistes des trois soirées (Outernet,
   FOLD, EartH), qui font partie du programme officiel mais se jouent hors de la British Library
   et se billettent séparément. Si la convention est de ne garder que ce qui se passe dans la
   salle de la fiche, retirer les douze derniers noms de la liste (de Blawan à mi-el).
3. **AVA London, « Bonobo ».** La page Eventbrite de la conférence
   (https://www.eventbrite.co.uk/e/ava-london-conference-2026-tickets-1985454923122) le cite parmi
   les intervenants, aucune annonce de l'organisateur ne le confirme. Non écrit.
4. **AVA London, deux noms laissés de côté faute de savoir les orthographier.** « ANNA DISCLAIM »
   (atelier d'échantillonnage avec patten) et les invités du live de Bitter Babe, « Koch.a » et
   « AliA », apparaissent en capitales ou en graphie incertaine dans les communiqués : ils
   ouvriraient une fiche artiste au titre douteux.
5. **AVA London, quel tarif d'entrée pour la fiche.** J'ai retenu 85 £, le pass d'une journée de
   conférence à la British Library, la salle de la fiche. Les soirées du programme se vendent
   moins cher et séparément (FOLD à partir de 16 £, Outernet à partir de 22,50 £, Round Chapel et
   EartH à partir de 25 £) : si la fiche doit annoncer le point d'entrée le moins cher du festival
   quel que soit le lieu, c'est 16 £ qu'il faut écrire.
6. **Heure de Vérone.** Le catalogue porte « 20:00 - 23:00 », le promoteur Zed Live annonce 21:00
   et concerti-italia 21:00 avec ouverture des portes à 19:00, tandis que le titre de la page
   TicketOne affiche 20:00. Je n'ai pas touché à l'heure et je ne l'ai pas écrite dans la
   description. À trancher sur la billetterie le jour venu.
7. **Aftershow de Vérone.** « Tomorrowland Symphony of Unity Aftershow », Gran Guardia,
   25/09 de 23 h 30 à 3 h, avec YVES V, COMRAD et HIISAK, billet à part
   (https://www.ticketsms.it/event/Tomorrowland-Symphony-Of-Unity-Aftershow-Verona-Gran-Guardia-25-09-2026).
   C'est une autre salle et une autre billetterie : ces trois noms ne sont donc pas entrés au
   line-up de la fiche Arena. Cela ferait une fiche à part entière si on veut la saisir.
8. **Trois tarifs sur quatre seront ignorés sans `--force`.** Les fiches 222, 473 et 475 portent un
   prix sans `priceNote`, donc « déjà confirmé » aux yeux de `prices/ingest.py`, qui les saute.
   Les deux qui changent vraiment et méritent le `--force` sont **222 (151 £ vers 85 £)** et
   **473 (34 £ vers 45 £)**.
