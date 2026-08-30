# France — fiches laissées sans line-up (relevé du 30 août 2026)

26 fiches sur la liste de travail, **6 line-ups relevés** (`lineups-france.json`), 20 laissés vides.
Rien n'a été écrit sans une page qui publie la programmation **de cette date et de cette ville**.

## ⚠️ À vérifier avant tout — anomalies de catalogue

### id=428 — Positive Education Festival (fiche : 12→15/11/2026, Parc Expo & Le Clapier)
Deux sources presse indépendantes donnent l'édition 2026 **les 6 et 7 novembre 2026**, dans la
**future halle événementielle de la Cité du design** — pas au Parc Expo. La fiche est en plus
`trending: true`, donc mise en avant en page d'accueil.
- https://42info.fr/positive-education-fait-son-retour-a-saint-etienne-les-6-et-7-novembre-2026/ (4 août 2026)
- https://www.tl7.fr/actualites-loire/actualite/actualite_1/apres-une-annee-d-absence-positive-education-revient-a-saint-etienne_14516.html

Le line-up est tout de même relevé (mêmes noms dans les deux articles), mais **date, `endDate` et
`venue` sont à corriger**. `positive-education.net` est injoignable depuis le conteneur
(502 au proxy, puis ETIMEOUT), et `fr.ra.co/events/2486660` est bloqué : la confirmation
définitive demandera un accès hors conteneur.
Le line-up relevé est **partiel et annoncé comme tel** (« une trentaine d'artistes et plusieurs
invités surprises » à venir) — à repasser en septembre.

### id=406 — Elektricity (fiche : 23/09/2026, La Cartonnerie, Reims)
Aucune trace de l'édition 2026 sur l'agenda de La Cartonnerie
(https://www.cartonnerie.fr/agenda/ — 53 événements listés, aucun Elektricity), ni sur l'agenda
électro jds de Reims (https://www.jds.fr/reims/agenda/electro-335_B). Les domaines
`elektricity.fr`, `elektricityfestival.fr` et `elektricity-festival.com` ne répondent pas depuis
le conteneur. **La tenue même de l'édition 2026 mériterait d'être confirmée** avant d'annoncer
la date à un mois de l'échéance.

## Pièges évités (ne pas « corriger » ces fiches avec ces pages)

- **id=439 Illusion BZH Edition** — `lorient-evenements.bzh/agenda/illusion-bzh-edition/` publie un
  line-up complet (MANDRAGORA, HYSTA, SKÖNE, SPICE UP!, GRAVIITY, LE BASK vs REMZCORE,
  EL DESPERADO). C'est **l'édition du 14 décembre 2024**. La page de la date qui nous intéresse est
  `lorient-evenements.bzh/agenda/illusion/` (« ILLUSION fait son retour à Lorient le samedi
  12 décembre 2026 — Infos/réservations à venir »), et le producteur confirme le 12/12/2026 à 20h,
  44 €, 2 stages, **sans un seul nom** : https://diogene.fr/artistes/illusion-bzh-edition/
- **id=412 Synthony au Zénith de Paris** — la page officielle
  (https://synthony.com/events/europe/paris/) affiche « Covering music by AVICII • BOB SINCLAR •
  CALVIN HARRIS • DARUDE • DAVID GUETTA • ERIC PRYDZ • SWEDISH HOUSE MAFIA • FISHER ». Ce sont les
  **auteurs des morceaux repris** par l'orchestre, pas les artistes présents. Les mettre en
  `lineup` créerait huit fiches artistes affirmant que David Guetta joue au Zénith le 1er octobre.
  Les interprètes réels (orchestre, DJ, chanteur·ses) ne sont pas nommés.
- **id=443 Bass Impakt - Hard Is Coming #5** — la billetterie Billetweb `hard-is-coming-by-bass-impakt`
  est celle de l'édition du **17 décembre 2022** (« Cet événement est terminé »), et la fiche
  eTerritoire remonte à 2022 elle aussi. La seule page qui parle bien du **samedi 19 décembre 2026**
  (https://www.monpatelin.fr/soiree-bass-impakt-a-la-manufacture-02100-saint-quentin-a117876.html)
  ne cite aucun artiste.
- **id=159 Festival Plein Air** — https://www.festivalpleinair.fr/ affiche en gros la
  « PROGRAMMATION 2026 » (Pegassi, Bon Entendeur, Benny Benassi, Feder, Cerrone, Acid Arab,
  Boys Noize…) juste sous l'annonce 2027. C'est l'édition **passée** ; le site précise
  « Premiers artistes annoncés en décembre ! ».

## Programmation pas encore annoncée (rien à relever)

| id | fiche | ce que dit la source |
|----|-------|----------------------|
| 113 | Techno Parade, Paris, 19/09 | Seuls les **10 chars** sont dévoilés (Tomorrow Dreams, Technopol, Visit Detroit, Fun Radio…) — ce sont des sound systems, pas des artistes. La fiche jds le confirme : « Le programme de la prochaine édition n'est pas encore disponible » (https://www.jds.fr/paris/concerts/electro/techno-parade-paris-262388_A). Les ~200 DJ ne sont jamais publiés en amont. |
| 911 | Bunker Brestois, Brest, 16/10 | Page officielle complète (horaires, tarifs, coproduction Astropolis) mais **aucun nom** : https://www.lacarene.fr/bunker-brestois-9.html |
| 433 | Pulse 2#, Perpignan, 20/11 | Date et tarif confirmés (ven. 20/11/2026, 20h30, El Mediator, festival Aujourd'hui Musiques), `performer[]` absent du JSON-LD jds : https://www.jds.fr/perpignan/concerts/electro/pulse-2-1598831_A — le site de L'Archipel charge son agenda en JS, hors de portée. |
| 927 | Fulgurances Électroniques, Orléans, 21/11 | « TARIFS ET OUVERTURE DE LA BILLETTERIE À VENIR », aucun artiste : https://www.lastrolabe.org/agenda/fulgurance-2lectronique/ |
| 138 | Les Rencontres Trans Musicales, Rennes, 02/12 | **Annonce datée** : « Toute la programmation des Trans dévoilée le 17 septembre » (article du 27/08/2026) — https://www.lestrans.com/ . À relancer après le 17 septembre. |
| 444 | Crazy New Year, Bourg-en-Bresse, 31/12 | « La line up du Crazy New Year 2026 — Les prochains noms seront dévoilés prochainement » : https://ainterexpo.com/agenda/crazy-new-year-festival/ |
| 143 | Snowboxx, Avoriaz, 13/03/2027 | Dates 13→20 mars 2027 confirmées, page en « sign up for 2027 » / paliers de billetterie, aucun artiste : https://www.snowboxx.com/ |
| 144 | Tomorrowland Winter, Alpe d'Huez, 20/03/2027 | Dates 20→27 mars 2027 confirmées, pré-inscription ouverte, line-up non annoncé. |
| 145 | Reperkusound, Lyon, 26/03/2027 | RPK#21 confirmé les 26, 27 et 28 mars 2027 ; le site affiche un compte à rebours vers le **26/11/2026 à 18h**, date de la révélation : https://www.reperkusound.com/ |
| 150 | Nuits Sonores, Lyon, 05/05/2027 | Le « Programmation A→Z » en ligne est celui de l'édition **mai 2026** ; pour 2027, seule une pré-inscription : https://nuits-sonores.com/ |
| 165 | Les Nuits Secrètes, Aulnoye-Aymeries, 23/07/2027 | Dates 23·24·25 juillet 2027 et pass en vente, aucun nom : https://lesnuitssecretes.com/ |

## Non traitées — au-delà de six mois, aucune affiche attendue

Conformément au brief (« au-delà de six mois, les affiches sont rarement sorties »), ces fiches de
mai-juin 2027 n'ont pas fait l'objet d'une recherche approfondie ; leurs sites officiels sont par
ailleurs injoignables depuis le conteneur (`insane-festival.com`, `marvellousisland.com`,
`alunafestival.fr`, `lebonair.org` → pas de réponse au proxy) :

- id=151 Insane Festival (Apt, 05/05/2027)
- id=152 Festival Le Bon Air (Marseille, 14/05/2027)
- id=153 Marvellous Island Festival (Torcy, 15/05/2027)
- id=157 Aluna Festival (Ruoms, 24/06/2027)

## Notes sur les line-ups relevés

- **id=116 Festival Maintenant** — la page officielle intitule sa liste « artistes **et
  intervenant·es** » : elle mêle musiciens (Noémi Büchi, Gaspar Claus, Katarina Gryvul, Dj Startup)
  et artistes d'installation / arts numériques (Émilie Brout & Maxime Marion, Pinaffo & Pluvinage,
  Guillaumit). C'est bien l'affiche telle qu'elle est publiée, mais l'index artistes en héritera.
- **id=407 Détonation Festival** — « Héla Fattoumi / Eric Lamoureux » (chorégraphes) est programmé
  les deux jours ; l'entrée n'apparaît qu'une fois après dédup.
- **id=122 NDK Festival** — la fiche du catalogue porte le 07/10 (premier jour) ; les quatre
  soirées annoncées (07→10/10) sont réunies dans un seul `lineup`, Ellen Allien en tête.
