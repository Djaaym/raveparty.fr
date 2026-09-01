# Lot es-pt - doutes et fiches a revoir

Verification menee le 31/08/2026. Devise : `€` dans les deux pays, aucun cas de conversion.
Bloques depuis le conteneur, confirmes : Resident Advisor, Ticketmaster (.es/.com), Shotgun,
entradas.ataquilla.com (Cloudflare), fourvenues.com, mirafestival.com et monegrosfestival.com
(202 / 500 anti-bot), tomaticket.es, apdnoticies.com, quinto-canal.com.
Ce qui repond bien : **ibiza-spotlight.com** (agenda `/night/events/{aaaa}/{mm}/{jj}` + pages
`/night/promoters/{slug}`, affiche complete par salle **et** tarif « From »), **dice.fm** en curl
avec un UA de navigateur (le JSON-LD et `amount_from` sont dans le HTML servi, WebFetch prend un
403), **xceed.me**, les sites officiels de salles et de festivals.

## 1. Line-up publie qui ne correspond pas a l'edition (a remplacer, pas a completer)

- **id 335, Bloom Festival (Porto, 18-19/09/2026)** : le catalogue porte « Amelie Lens, Maceo Plex,
  Folamour, WhoMadeWho ». **Aucun de ces quatre noms** n'apparait sur l'affiche 2026, ni chez
  l'organisateur relaye par la presse locale
  (https://viva-porto.pt/the-blaze-seth-troxler-e-mais-de-40-artistas-transformam-o-aerodromo-da-maia-num-festival-de-35-horas/)
  ni sur la billetterie (https://xceed.me/de/porto/event/bloom-festival-2026/238428). L'affiche 2026
  est menee par The Blaze, Seth Troxler, Louie Vega, NTO, Bedouin, Jimi Jules. Le line-up publie est
  tres probablement celui d'une edition anterieure : **le remplacer en entier**, ne pas fusionner.
- **id 136, MIRA Digital Arts Festival (Barcelone, 6-7/11/2026)** : « Arca » figure au catalogue mais
  sur aucune des deux sources 2026 (https://www.jambase.com/festival/mira-festival-2026,
  https://metalmagazine.eu/es/post/mira-festival-2026). Le site officiel repond 202 (defi anti-bot)
  et n'a pas pu etre lu, donc **je n'affirme pas qu'Arca n'y joue pas** : a trancher sur
  mirafestival.com depuis un navigateur avant de retirer le nom.
- **id 348, Duro Festival XXL (Montmelo, 10-11/10/2026)** : « Ben Sims » est au catalogue mais ne
  figure pas sur la page line-up officielle (https://durofestival.com/line-up/), qui annonce
  pourtant 28 noms et se presente comme complete a ce stade. Meme prudence : a verifier avant
  retrait. Note de lecture : le mot « Laster » precede trois noms du Black Hangar, c'est un hote de
  scene (label), pas un artiste, je ne l'ai pas repris.

## 2. Fiches dont l'existence ou la date meritent un controle

- **id 572, Tiesto - INFINITY Lisbon (MEO Arena, 01/10/2026)** : ce n'est **pas un evenement grand
  public**. C'est la soiree de cloture du congres SBC Summit, et l'acces est reserve aux porteurs de
  pass VIP / networking / affilie / operateur / sponsor / exposant, avec un simple mail d'upgrade
  pour tout autre visiteur du salon
  (https://www.actigamer.pt/noticias/tiesto-encerra-infinity-lisboa-2026-com-espetaculo-no-meo-arena/).
  Aucune billetterie publique n'existe, donc **aucun tarif ne peut etre affiche** et la fiche promet
  une soiree ou un lecteur ne peut pas entrer. A garder telle quelle en signalant la condition
  d'acces dans `desc`, ou a retirer.
- **id 118, David Guetta presents Galactic Circus - Closing Party (UNVRS, 02/10/2026)** : la page de
  la residence (https://www.ibiza-spotlight.com/night/promoters/david-guetta-unvrs) dit que la serie
  court « chaque semaine du 5 juin au 9 octobre », et l'agenda du 2 octobre intitule la soiree
  simplement « David Guetta presents Galactic Circus », sans « Closing ». **La vraie closing est
  vraisemblablement le 09/10**, pas le 02/10. Le titre de la fiche est donc peut-etre pose sur la
  mauvaise date ; a verifier avant de garder le mot « Closing Party ».
- **id 800, INVADERS - Ogalla All Night Long (Spook Club, 18/12/2026)** : l'agenda de l'organisateur
  liste bien « Ogalla All Night Long (Spook) » au **18/12/2026**
  (https://invaders.es/eventos), mais la fiche detaillee
  (https://invaders.es/event-item/ogalla-all-night-long-spook) affiche la date du **19/12/2025** et
  la mention COMPLET, avec un line-up (b2b Hermanos Kapiya, Ivo Madkiller, Toni Massama, Hardsuel)
  qui appartient donc a l'edition precedente. Impossible de trancher : ni line-up ni tarif 2026 ecrits
  quelque part. **Ne rien reprendre de cette page**, la fiche reste en l'etat.
- **id 730, Sunnery James & Ryan Marciano - Teatro Kapital (30/10/2026)** : date confirmee par le
  seul agenda Songkick de la salle (https://www.songkick.com/venues/661151-teatro-kapital). Le site
  du Teatro Kapital n'a pas d'agenda du tout (`/agenda` repond 404, `/eventos` est une page de
  privatisation), donc pas de source de premiere main ni de tarif.
- **id 771, Trinix - Razzmatazz (25/11/2026)** : la salle annonce le concert **COMPLET**
  (« Agotado. No se venden entradas en taquilla »,
  https://www.salarazzmatazz.com/agenda/25-11-2026-trinix/). Le tarif de 26 € est le tarif d'origine,
  il reste juste, mais la fiche envoie vers une billetterie fermee.

## 3. Tarifs non trouves (la fiche reste telle quelle)

- **id 107, Sunwaves SW38** : la billetterie officielle est Fourvenues, qui repond 403 au conteneur ;
  ni le site officiel ni xceed ne publient de montant. Le 120 € estime n'est ni confirme ni infirme.
- **id 399, WOS Festival** : ataquilla.com (billetterie officielle) est derriere Cloudflare. La presse
  galicienne parle d'abonos « a partir de 80 € » (72 € avec carnet joven) et il existe des entrees a
  la journee moins cheres, dont le montant n'est publie nulle part de lisible. Le 70 € estime du
  catalogue n'est **pas** confirme : il est probablement en dessous du prix reel de l'abono et au
  dessus du prix d'une journee.
- **id 699, Happy Techno - La Terrrazza (17/10)** : la soiree n'apparait **pas** dans l'agenda DICE de
  La Terrrazza (qui saute du 16/10 au 06/11) ; Eventbrite la porte mais sans montant lisible. Le 25 €
  estime reste.
- **id 623 / 741 / 746, Max Cooper (Lisbonne, Porto, Madrid)** : les trois dates sont confirmees sur
  maxcooper.net/event mais la page ne donne aucun tarif et renvoie vers des billetteries bloquees.
- **id 136, MIRA** : plusieurs relais parlent de « journee des 50 €, pass 2 jours des 100 € », mais je
  n'ai pas pu **ouvrir** la page de billetterie officielle, donc je n'ecris rien. A noter que si ces
  montants se confirment, le 83 € estime du catalogue est faux dans les deux sens (trop cher pour une
  journee, trop peu pour le pass).
- **id 646, Hercules & Love Affair**, **id 647, Azyr & Fatima Hajji**, **id 778, OUTWORLD -
  Klangkuenstler**, **id 800**, **id 837 et 654, NTO** : aucune source ouvrable ne publie de montant.
- **id 396, Boom Festival 2027 / id 166, Monegros 2027 / id 849, Neopop 2027 / id 156, Sonar 2027** :
  aucune des quatre billetteries n'a pu etre lue (tickets.boomfestival.org ne rend que la page 2025,
  monegrosfestival.com repond 500, sonar.es ne publie encore rien pour 2027). Les tarifs estimes
  restent.

## 4. Line-ups legitimement vides ou courts, verifies

- **id 156 Sonar (17-19/06/2027)**, **id 396 Boom (18-25/07/2027)**, **id 166 Monegros
  (31/07/2027)**, **id 849 Neopop (05/08/2027)** : **aucun artiste annonce a ce jour**, verifie sur
  sonar.es/en (« inscrivez-vous pour recevoir les nouvelles de Sonar 2027 avant l'annonce
  generale ») et sur les agregateurs pour les trois autres. Le line-up vide est la bonne reponse, il
  ne faut rien y mettre. A repasser vers novembre-decembre 2026, c'est la fenetre d'annonce habituelle
  pour Sonar et Monegros.
- Les line-ups d'un seul nom des ids **564, 593, 673, 729, 734, 730, 623, 741, 746, 771, 778, 646,
  806, 837, 654** sont **corrects** : ce sont des dates de tournee ou des sets « all night long » /
  « open to close » ou l'organisateur n'annonce qu'un artiste. Ce ne sont pas des fiches incompletes.

## 5. Petits ecarts de saisie releves au passage

- **id 569** : la page d'Ibiza Spotlight ecrit « Chris Stassy », coquille evidente pour **Chris
  Stussy**, deja au catalogue sous la bonne graphie. Le trio joue en b3b avec Joseph Capriati et
  Jamie Jones, ce que le line-up plat du catalogue ne disait pas.
- **id 701, Jackies House Music Festival Lisboa** : le tarif passe de 36 € estime a **16,50 € reel**
  (DICE, `amount_from=1650`), soit plus du double d'ecart. Le catalogue surestimait largement.
- **id 121, Solomun Closing Party** : 65 € confirmes contre 50 € estimes.
- **id 348, Duro Festival XXL** : 55 € (entree a la journee, Fase 2) contre 75 € estimes, le 75 € du
  catalogue etant en fait le prix de l'abono 2 jours.
- **id 335, Bloom Festival** : j'ai retenu **35 €** (Friday Pass 4th release, la journee complete la
  moins chere encore en vente). Il existe des « Early Tickets » a 15 € et 20 €, mais ils imposent une
  entree avant 17 h ou 19 h : ce n'est pas le meme produit, et l'afficher comme prix d'entree serait
  trompeur. A arbitrer si la regle « le plus bas reellement vendu » doit primer.
