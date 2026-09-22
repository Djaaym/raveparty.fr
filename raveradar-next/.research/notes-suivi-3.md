# Notes de vérification, lot « suivi-3 » (22 septembre 2026)

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
