# Notes de vérification, lot « suivi-3 » (22 septembre 2026)

> **Comment fusionner ce lot.** Le line-up de Dystopia (id 435) doit **écraser** celui du
> catalogue, qui est l'affiche 2025 : il faut donc `--force`, pas `--merge`. C'est sans risque
> pour les deux autres fiches du lot, Lunchmeat (id 221) dont les 9 noms publiés sont tous
> repris dans les 37 proposés, et MAYDAY (id 241) dont le line-up est vide. Détail fiche par
> fiche plus bas.

## id 406, Elektricity, Reims, 23-28 septembre 2026 : RIEN ÉCRIT, fiche à réexaminer

Aucune source indépendante ne confirme une édition 2026. Ce que j'ai trouvé, dans l'ordre :

- **La Cartonnerie, la salle organisatrice, n'a aucune trace du festival.** Son agenda public
  (https://www.cartonnerie.fr/agenda/) liste ses dates jusqu'en 2027 et ne porte aucun événement
  entre le 23 et le 28 septembre 2026 (les seules dates de la semaine sont le mar. 22 et le ven. 25,
  sans rapport). Sa recherche interne https://www.cartonnerie.fr/?s=elektricity ne rend **aucun
  résultat**.
- **Wikipédia (fr) redirige « Elektricity » vers « La Magnifique Society »** et écrit que l'édition
  2016 a été annulée, la dernière édition tenue étant celle de 2015, le festival ayant été remplacé
  par La Magnifique Society (2017-2023, elle-même arrêtée).
  https://fr.wikipedia.org/wiki/Elektricity
- **Songkick ne liste aucune édition à venir** : dernières entrées 2016, 2015, 2014…
  https://www.songkick.com/fr/festivals/133446-elektricity
- **Le domaine officiel historique `elektricityfestival.fr` ne porte plus le festival** : il
  redirige aujourd'hui vers https://www.le-spot.eu/ (« Le Spot, l'art de vivre »), sans rapport.
- **jds.fr, la meilleure source française, ne connaît aucune date électro à Reims en septembre 2026.**
  L'agenda https://www.jds.fr/reims/agenda/electro-335_B ne rend que deux MusicEvent, tous deux en
  2027 (Acid Arab le 13/03/2027 à La Cartonnerie, Electro Symphony le 28/04/2027 à la Reims Arena).
- La page https://www.manege-reims.eu/elektricity existe mais décrit la **10e édition** (Sébastien
  Tellier, Nicolas Jaar, Gesaffelstein, Woodkid), c'est-à-dire 2013 : exactement le piège « une page
  sans année se lit comme si elle datait d'aujourd'hui ».
- Les seules pages qui annoncent « 23-28 septembre 2026 » sont des agrégateurs de fiches
  (festivalenfrance.com, leguidedesfestivals.com, guide-festivals.eu) et **notre propre fiche**,
  que les moteurs me renvoient en boucle.

**Ce n'est pas un line-up manquant, c'est probablement un événement qui n'existe pas.** Rien n'a
donc été écrit, ni line-up, ni tarif, ni description : ce serait inventer la tenue même du festival.
Décision éditoriale à prendre à la main, hors de mon périmètre : soit une source de première main
(communiqué de La Cartonnerie ou de Césaré, réseaux sociaux du festival) confirme la reprise, soit
la fiche se retire en suivant la règle du dépôt, `REMOVED` dans `merge.py` plus une entrée dans
`lib/renamed.ts` pour ne pas laisser `/festival/elektricity` tomber en 404.

## id 221, Lunchmeat Festival, Prague, 24-27 septembre 2026 : complet

- **Line-up** : 37 noms repris du programme officiel jour par jour
  (https://lunchmeatfestival.cz/2026/program/), du jeudi 24 au dimanche 27 au Trade Fair Palace.
  Les collaborations affichées en binôme (« KMRU & Nick Verstand », « Woesum & Guz Reichwald »,
  « Bitter Babe b2b Lechuga Zafiro ») sont éclatées en noms individuels, comme le catalogue le fait
  déjà pour les 9 noms qu'il portait.
- **Non repris, et c'est un choix** : la soirée d'ouverture du **mercredi 23 à l'Ankali**
  (3C 273, Matthew D. Gantt, Tati au Miel). Autre salle, hors de la plage de dates de la fiche.
- **Non repris non plus** : les studios purement visuels du dôme planétarium (PAST Studio,
  Studio Above&Below, Einar Fehrholz). C'est une installation billetée à part, pas l'affiche du
  Trade Fair Palace, et les faire entrer créerait des fiches artistes pour des studios de
  scénographie.
- **Tarif** : 650 Kč, billet du jeudi, plus bas tarif général encore en vente sur la plage de la
  fiche (https://lunchmeatfestival.cz/2026/tickets/). Vendredi et samedi 750 Kč, **dimanche SOLD
  OUT**, **pass 4 nuits SOLD OUT**. Les 450 et 520 Kč sont un tarif étudiant ISIC de moins de 26
  ans, pas une entrée générale. Le billet de 300 Kč du mercredi ouvre l'Ankali, pas la fiche.
  Conversion refusée, on garde Kč : le catalogue annonçait 90 € « estimated », soit à peu près le
  pass complet aujourd'hui épuisé.
- **Billetterie** : la page officielle vend via Resident Advisor
  (https://ra.co/events/2314919, événement « Main Event at National Gallery Prague »). Je n'ai pas
  pu ouvrir ra.co depuis le conteneur (403), le lien est celui que pose la page officielle.

## id 241, MAYDAY Poland, Katowice, 10 novembre 2026 : complet

- **Line-up** : 20 noms, ce que la page d'accueil de mayday.pl annonce elle-même (« Jedna noc,
  16 godzin muzyki, 20 artystów »). Le piège est ici, et il a failli coûter cher : la page
  `LINE UP` ne rend **aucun texte**, les noms ne vivent que dans les attributs `alt` de ses
  portraits. En revanche le site porte **aussi** deux pages `podzial-na-sceny` (répartition par
  scène) et `time-table-en` (horaires) parfaitement lisibles, et **ce sont celles de 2025** :
  `wp-json` donne `modified` au 22/10/2025 et au 06/11/2025, et leurs noms (Richie Hawtin,
  Anfisa Letyago, Collabs 3000, SHLØMO, Fatima Hajji…) ne recoupent pas la grille 2026. **Ne pas
  les fusionner.** Les portraits de la page LINE UP, eux, ont tous été téléversés le 03/09/2026.
- **Orthographes** : les `alt` du site sont fautifs, ils sont recoupés sur l'article de muno.pl
  (https://muno.pl/news/mayday-poland-2026-nadchodzi-oto-pelny-sklad/), qui donne « Sven Väth »
  pour « Sven Vath », « Felix Kröcher » pour « Felix Krocher », « Cristobal Pesce » pour
  « Christobal Pesce » et « Peter Pahn » pour « Peter Phan ».
- **Friends of Mayday** ne figure pas sur la grille de portraits, mais chez muno.pl et sur
  l'hymne 2026 « Iconic », signé Friends Of Mayday et PETER PAHN. C'est aussi le nom qui tenait
  le créneau d'intermède en 2025. Il est repris, c'est le 20e nom qui manquait au compte annoncé.
- **Tarif** : 349 zł, e-Ticket de la boutique officielle, JSON-LD en `schema.org/InStock`,
  confirmé par la page de la salle (spodekkatowice.pl, « Bilety od: 349 zł »). Le catalogue
  portait 339 zł, c'est le palier précédent. **Le billet à 289 zł n'est pas retenu** : sa fiche
  dit « Masz 16-19 lat », âge vérifié à l'entrée, c'est un tarif réduit et pas une entrée
  générale, même raison que le tarif étudiant de Lunchmeat. Biletomat, revendeur, affiche
  « od 369 zł », donc plus cher que le guichet.
- Le jour de la semaine confirme l'année : le 10 novembre 2026 est un mardi, veille du 11
  novembre, jour férié polonais, ce qui est le créneau historique de MAYDAY.

## id 246, Taksirat Festival, Skopje, 26 novembre au 7 décembre 2026 : description seule

- **Line-up : rien, et c'est la bonne réponse.** Le site officiel n'a **rien publié depuis
  novembre 2025** : `wp-json` donne comme dernier contenu « Таксират #27 - ден 2 » au 06/11/2025,
  et la billetterie officielle `mktickets.mk/event/taks27/` vend « Таксират #27 **06.12.2025** ».
- **Piège évité, et il était gros.** Les moteurs rendent pour « Taksirat 2026 » un line-up complet
  (Sven Väth, Lacuna Coil, Ezhel, ONYX, Dubioza Kolektiv, PASS-N-G-R, WISH.KO…) présenté comme
  « jour 1 / jour 2 ». **C'est l'affiche de décembre 2025**, ce que confirment les fiches
  rockthenight.eu, dont les URLs portent « 6 декември 2025 » et « 7 декември 2025 ». Fusionner
  aurait republié une affiche périmée sous une date à venir.
- **Les dates 2026 tiennent, elles.** https://ekran.mk/dobredojdovte-na-festivalot-taksirat-2026-vo-skopje/,
  article daté du 18 septembre 2026, écrit « Од 26 ноември до 7 декември 2026 година », 28e
  édition, et précise que la programmation complète sera annoncée à l'automne et que les tarifs
  2026 ne sont pas publiés. **À repasser dans quelques semaines.**
- **Tarif : rien d'écrit.** Aucune page ne vend quoi que ce soit pour 2026. La seule donnée
  chiffrée est historique (ekran.mk cite « environ 16 euros » pour une soirée les années
  précédentes, festivalfinder.eu « 10 to 25 euro » pour 2024). Le 20 € `estimated` du catalogue
  reste donc ce qu'il est, un ordre de grandeur, et je ne le remplace pas par un autre ordre de
  grandeur.
- **Deux points à vérifier à la main, hors de mon périmètre** : le site officiel écrit que
  « Таксират 1 » s'est tenu le **27 novembre 1999**, là où la fiche du catalogue dit 1998 ; et
  ekran.mk annonce un changement de lieu pour 2026, du Скопски саем vers le
  **СЦ Јане Сандански**, alors que l'édition 2025 était à l'arène Boris Trajkovski. Le catalogue
  dit « Salles multiples, Skopje », ce qui reste vrai d'un festival éclaté, mais la source est
  unique et je ne l'ai pas recoupée.

## id 65, No Sleep Festival, Belgrade, 28 novembre 2026 : RIEN ÉCRIT, fiche à réexaminer

Même famille de problème qu'Elektricity, en moins tranché.

- **Le site officiel ne connaît pas cette date.** `nosleepfestival.com` affiche une page
  « No Sleep Festival 2026 » entièrement consacrée au **4 avril 2026** (Indira Paganotto,
  DJ Gigola, BIIA, Juno, Valentinø) au Main Hangar du port de Belgrade. Son dernier article
  date du **26 mars 2026** et ses pages n'ont pas bougé depuis le 3 février 2026. Rien sur
  un 28 novembre.
- **Songkick ne liste aucune édition à venir** :
  https://www.songkick.com/festivals/2717024-no-sleep, « Sorry we don't know about any
  upcoming festivals just yet! ».
- Les seules pages qui annoncent le 28 novembre 2026 et une fourchette de prix sont des
  agrégateurs de destination (events.europa.tips, eurotravelo.com), c'est-à-dire des pages
  de contenu automatique, pas une source.
- **Ce qui plaide pour la fiche** : le 28 novembre 2026 est bien un samedi, et le créneau
  historique de No Sleep est le dernier samedi de novembre. **Ce qui plaide contre** : le
  festival a sauté toute l'année 2025 (le site parle d'« a year-long break »), il est revenu
  au **printemps** 2026 et non à l'automne, et le contexte serbe est explicite dans leur propre
  communiqué de mars 2026 (« This will be my last performance in Serbia until EXIT and freedom
  return »).
- Rien n'a donc été écrit. Aucun line-up n'est publié, aucun billet n'est en vente, et le
  55 € du catalogue n'est adossé à aucune page. **À trancher à la main** : confirmer la date
  auprès d'EXIT, ou traiter la fiche comme l'édition d'avril 2026 déjà passée.

## id 435, Dystopia Festival, Saint-Étienne, 4 et 5 décembre 2026 : complet, ET UNE AFFICHE PÉRIMÉE AU CATALOGUE

- **À fusionner en `--force`, pas en `--merge`.** Les 8 noms actuellement au catalogue
  (Angerfist, AniMe, N-Vitral, OGUZ, Vladimir Cauchemar, Sub Zero Project, Adjuzt, Dual Damage)
  sont l'affiche de l'**édition 2025**, tenue les 5 et 6 décembre 2025 : c'est ce que liste
  l'article de RADIO FG daté du 7 novembre 2025
  (https://www.radiofg.com/page-contenu-article-323, « Angerfist, Vladimir Cauchemar, Sub Zero
  Project, Hysta, Basswell, Dr. Peacock, Azyr »). Aucun de ces noms n'est sur l'affiche 2026,
  **sauf N-Vitral**, qui y revient par le show « Slaughterhouse by N-Vitral & Deadly Guns ».
  Une fusion `--merge` garderait donc sept noms faux.
- **Source du line-up** : le visuel line-up A-Z de l'organisateur,
  https://dystopia-festival.com/wp-content/uploads/2026/07/DSE26_LU_1920x1080_v3.jpg, qui porte
  en clair « DYSTOPIA SAINT-ÉTIENNE, 4 & 5 DÉCEMBRE 2026, PARC EXPO ». Il est recoupé avec la
  galerie d'artistes de https://dystopia-festival.com/saint-etienne/, dont les 40 vignettes
  portent une image par nom, téléversées en juillet 2026 et taguées vendredi ou samedi.
  La page elle-même annonce « 2 scènes, 40 artistes, 20 h de son ».
- **Le line-up n'est lisible ni dans le HTML ni dans `wp-json`** : la galerie Elementor ne rend
  que des URLs de vignettes, sans `alt`. Les noms ont été lus dans les **noms de fichiers**
  (`DSE26_{Nom}_700x800.jpg`) puis **vérifiés sur l'affiche**, ce qui était indispensable :
  `TDDvsMC` est en réalité « THE DOPE DOCTOR vs MIND COMPRESSOR », `LESSSS` est le nom masqué
  « L***** » de l'affiche, et `99Prblmz` s'écrit « 99PROBLEMZ ».
- **Choix de découpage** : les duos annoncés en « vs » ou « & » sont éclatés en noms individuels,
  et les **titres de show ne sont pas repris comme artistes** (« Slaughterhouse » pour N-Vitral
  & Deadly Guns, « Noisemakers » pour Sickmode & Krowdexx, « Super Nova » pour Fraw,
  « Carnage : Frozen Veins » pour Omnya, « Everything Changes » pour Vertile). Villain et
  Tha Watcher sont repris, l'affiche les crédite en « hosted by ».
- **Un nom reste masqué sur l'affiche** (« L***** », fichier `DSE26_LESSSS`), donc non repris :
  c'est une annonce à venir, pas une donnée.
- **Tarif** : 50,99 € et non 49. La billetterie officielle Billetweb
  (https://www.billetweb.fr/shop.php?event=dystopia-2026-saint-etienne) porte trois catégories et
  quatre paliers chacune ; **les paliers Early-bird et Advance sont épuisés partout**. Le plus
  bas tarif encore vendu est le **Late pass 1 jour à 50,99 €** (vendredi comme samedi). Pour
  mémoire, pass 2 jours Late 94,99 €, Last Chance 105,99 €, et pass 1 jour Last Chance 55,99 €
  le vendredi, 54,99 € le samedi. Retenir les 40,99 € d'origine aurait été le piège du palier
  épuisé, retenir le pass 2 jours celui du pass complet.
- Billetweb donne aussi l'horaire exact, « Fri Dec 04, 2026 at 06:00 PM to Sun Dec 06, 2026 at
  04:00 AM », ce qui confirme l'`endDate` au 5 décembre du catalogue (deux nuits, la seconde
  finit à l'aube du 6) et la limite d'âge à 16 ans.

## id 430, Overmono à l'Olympia, Paris, 14 novembre 2026 : tarif, billetterie et description

- **Line-up : rien à ajouter, et c'est correct.** Aucune première partie n'est annoncée, ni sur
  la page de l'Olympia, ni chez jds.fr, ni sur les billetteries. Le line-up reste le seul nom.
- **Tarif** : 44,19 €, plancher affiché par la salle elle-même
  (https://www.olympiahall.com/agenda/overmono/, « De 44,19 € à 49,86 € »), même plancher chez
  DICE. Le bouton « Réserver » est actif, ce qui se vérifie par comparaison : la date de Kid
  Francescoli du 18 novembre affiche « Pas de billets disponibles actuellement ». Trois
  catégories à la billetterie, mezzanine et balcon assis numéroté, balcon assis numéroté,
  orchestre debout en placement libre. Le catalogue portait 44 €, arrondi.
- **Billetterie** : le lien profond de la billetterie officielle de la salle. Le domaine
  `billetterie.olympiahall.com` n'est dans aucun réseau d'affiliation branché sur le site,
  donc `outboundRel()` lui posera `nofollow` et rien d'autre.
- **Description** : la page de la salle donne le contexte que la fiche n'avait pas, la tournée
  Pure Devotion, le deuxième album des frères Tom et Ed Russell, onze titres, les synthétiseurs
  des années 70 et 80, le haut-parleur d'annonces de gare, la cymbale passée au four, les voix
  de John Joseph Holt, Kindora et Ruthven, le live refondu en 2024, la tête d'affiche du West
  Holts de Glastonbury et l'Alexandra Palace complet. L'organisateur est « Super ! ».
- jds.fr confirme indépendamment la date et l'heure par son JSON-LD `MusicEvent`
  (`startDate: 2026-11-14T20:00:00+01:00`, L'Olympia Bruno Coquatrix, 28 bd des Capucines).
