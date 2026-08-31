# Lot fr - doutes et fiches à revoir

Relevé du 31 août 2026. Sources ouvertes une par une (curl + JSON-LD ou WebFetch), aucune
donnée recopiée d'un résumé de moteur de recherche.

## Fiches qui semblent ne pas exister / à vérifier d'urgence

### 406 - Elektricity (Reims, 23-28/09/2026) - rien ne le confirme, tout le contredit
La fiche annonce le festival dans moins d'un mois. Or :
- l'agenda complet de **La Cartonnerie** (la salle organisatrice), relevé aujourd'hui,
  couvre septembre 2026 à avril 2027 date par date et **ne porte aucun événement entre le
  25 et le 29 septembre 2026** : <https://www.cartonnerie.fr/agenda/> (25/09 Talisco, puis
  29/09 un atelier des studios). Aucune mention du mot « Elektricity » sur le site.
- la page `elektricity` du Manège, scène nationale de Reims, est une **archive de la 10e
  édition** (elle cite « Justice dès 2005 », Sébastien Tellier, Gesaffelstein) :
  <https://www.manege-reims.eu/elektricity>. Le domaine `elektricityfestival.fr` qu'elle
  donne ne répond plus depuis le conteneur.
- France Bleu titrait « Pour remplacer le festival Elektricity, voici venu La Magnifique
  Society à Reims » : <https://www.francebleu.fr/infos/culture-loisirs/pour-remplacer-le-festival-elektricity-voici-venu-la-magnifique-society-reims-1486391043>

Les seules pages qui annoncent une édition 2026 sont des agrégateurs (festivalenfrance.com)
et notre propre fiche. **À trancher avant le 23 septembre.** Si la fiche est retirée, passer
son URL par `lib/renamed.ts` et consigner la suppression dans `REMOVED` de `merge.py`.

### 428 - Positive Education Festival : le lieu ne concorde pas
Les dates du catalogue (6-7/11/2026) sont confirmées par l'agenda de Loire Tourisme, mis à
jour le 18/08/2026, mais celui-ci donne pour lieux **Le Clapier** (2 bd Pierre Mendès) *et*
le **Parc Expo**, pas la Cité du design :
<https://www.loiretourisme.com/activites/agenda/tout-lagenda/festival-positive-education-saint-etienne-fr-3352642/>
La même page dit que « la programmation complète sera dévoilée en septembre », donc le
line-up publié (Andy Stott, Machine Girl, A Guy Called Gerald, Hajj) est une annonce
partielle et rien d'autre n'est vérifiable aujourd'hui. `positiveeducation.fr` répond 404
(« Squarespace - Website Expired »), ce qui est en soi à surveiller. Le lieu conditionne
`/lieux/{slug}` et les coordonnées de la carte : à recouper avant de corriger.

### 784 - Joachim Pastor à l'Interférence (Balma, 04/12/2026) : soirée solo ou date PACT ?
La date et la salle sont confirmées par le calendrier Songkick de l'artiste
(<https://www.songkick.com/artists/4804983-joachim-pastor/calendar>), mais elle s'insère
exactement dans la tournée **PACT** (Joachim Pastor / Joris Delacroix & Teho) : la veille,
03/12, c'est PACT au Rocher de Palmer, notre fiche 782. Le site de la salle
(<https://www.interference-toulouse.fr/programmation>) ne publie pas encore décembre et sa
billetterie est sur Shotgun, bloqué depuis le conteneur. Si c'est une date PACT, le
line-up doit passer à trois noms et le titre suivre la convention du catalogue. Aucun tarif
trouvé.

## Line-ups qui n'existent pas encore (fiche laissée telle quelle, c'est normal)

- **113 Techno Parade** (19/09/2026) : Technopol a annoncé les **10 chars**, pas les DJ.
  Ce sont des collectifs et des marques (EZPZ, Fun Radio, Organik, Phantom, Techno Ride,
  Claquettes Chaussettes, Radio Mamè, Oddity Factory, Galas Événement, Visit Detroit), pas
  des noms d'artistes : les écrire en line-up créerait dix fiches artistes fantômes.
  <https://www.lebonbon.fr/paris/culture/techno-parade-2026-10-chars-paris-septembre/>
- **412 Synthony au Zénith de Paris** : c'est un spectacle symphonique, l'affiche ne nomme
  que la cheffe d'orchestre et directrice artistique (Sarah-Grace Williams), les DJ et
  chanteurs ne sont pas annoncés. Tarif en revanche confirmé (45 €).
- **433 Pulse 2#** (Perpignan) : concert live AV du festival Aujourd'hui Musiques, ni jds ni
  L'Archipel (rendu en JS) ne nomment d'artiste. Tarif confirmé (22 €).
- **439 Illusion BZH Edition** : le site de l'organisateur (Pandemic Events) n'affiche que
  la date et le lien billetterie, <https://www.pandemic-events.com/illusion>. **Piège
  évité** : la page de Lorient Événements qui porte une programmation détaillée (Mandragora,
  Hysta, Sköne, Spice Up!, Graviity, Le Bask vs Remzcore, El Desperado) est celle de
  l'édition du **14 décembre 2024**, pas de celle du 12/12/2026.
  <https://lorient-evenements.bzh/agenda/illusion-bzh-edition/>
- **443 Bass Impakt - Hard Is Coming #5** : même piège, la seule affiche trouvable en ligne
  (Goetia, Crazy We R, Badkick, Toxic Twins, Mr. Marz, Darkside, Blueward, The Immortal,
  Hard-Beat) date des **15-16 janvier 2022** et la page le dit explicitement (« Cet
  événement est terminé »). Ne pas la reprendre.
  <https://www.eterritoire.fr/detail/activites-touristiques/hard-is-coming-a-la-manufacture/349617447/hauts-de-france,aisne,saint-quentin(2100)>
- **911 Bunker Brestois** : La Carène décrit la soirée sans nommer personne (« collectifs,
  DJ, producteur·rices et live acts »). Tarif confirmé (20 €).
- **927 Fulgurances Électroniques** : la page de L'Astrolabe porte « TARIFS ET OUVERTURE DE
  LA BILLETTERIE À VENIR » et aucun nom. Le tarif estimé à 15 € actuellement affiché n'a
  donc **aucune source** ; il vaudrait mieux le repasser en `unknown` que de le laisser
  passer pour une fourchette lue quelque part.
  <https://www.lastrolabe.org/agenda/fulgurance-2lectronique/>
- **138 Les Rencontres Trans Musicales** : Les Trans annoncent que la programmation de la
  48e édition sera dévoilée le **17 septembre 2026**. Repasser après cette date.
  <https://lestrans.com/>
- **151 Insane Festival** (6-8/05/2027) : **piège évité**. La page `insanefestival.com/line-up/`
  affiche un line-up complet, mais sous les intitulés « JEU 14 MAI (FÉRIÉ) / VEN 15 MAI /
  SAM 16 MAI », donc l'édition **2026**, déjà passée (l'Ascension 2026 tombait le 14 mai).
  Rien pour 2027.
- **150 Nuits Sonores** (mai 2027) : même piège, la liste A→Z encore en ligne sur
  <https://nuits-sonores.com/> est celle de l'édition 2026 (le site n'ouvre pour 2027 qu'une
  « pré-inscription »).
- **143 Snowboxx**, **144 Tomorrowland Winter**, **153 Marvellous Island**, **157 Aluna**,
  **165 Les Nuits Secrètes**, **145 Reperkusound** : dates 2027 confirmées sur les sites
  officiels, aucune programmation publiée. Marvellous Island écrit noir sur blanc
  « PROGRAMMATION À VENIR » pour ses deux jours.

## Prix non trouvés

- **430 → trouvé**, **453 → trouvé**. En revanche **454 Acid Arab à La BAM** (Metz,
  25/03/2027) : la page de la Cité musicale-Metz n'expose pas encore la saison 26-27 au
  crawl, et jds affiche « NC ». Fiche laissée telle quelle.
- **785 Acid Pauli au 109** (Nice) : `le109.nice.fr` ne répond pas depuis le conteneur (503
  via WebFetch, timeout via curl) et aucune billetterie n'est référencée ailleurs.
- **841 Joris Delacroix au Boeuf sur le Toit** : le line-up du catalogue est confirmé
  (Insolitum présente Joris Delacroix + Upper + Ka:Ost), mais la date du 26/02/2027 n'est
  pas encore ouverte sur la billetterie officielle de la salle
  (<https://web.digitick.com/index-css5-leboeufsurletoit-pg1.html>) et `leboeufsurletoit.fr`
  répond 403.
- **436 Rise Festival** : Rise ne vend pas un billet d'entrée mais des **packages semaine**
  (billet + 7 nuits + forfait de ski), le prix « le plus bas réellement vendu » n'a donc pas
  le même sens qu'ailleurs. `rise-festival.com` et `skiddle.com` répondent 403/202 depuis le
  conteneur. Le 269 € estimé du catalogue n'a pas été confirmé ni infirmé.
- **435 Dystopia Festival** : le site officiel rend sa billetterie en JS, aucun tarif lisible.
  Les 49 € estimés restent tels quels.

## Points de détail

- **407 Détonation** : le line-up officiel liste aussi **Héla Fattoumi / Eric Lamoureux**
  (chorégraphes, pièce de danse) et **« nous étions une armée »** (titre de création). Les
  deux sont écartés du lot : ce ne sont pas des artistes de musique, et le second est un
  titre d'œuvre.
- **583 Mecanik Paradize** : le site officiel écrit « Christoph », le catalogue « Cristoph ».
  C'est bien le DJ britannique Cristoph, orthographe du catalogue conservée. Le dimanche 11
  (accès libre) est une journée d'arts de rue, ses intervenants ne sont pas retenus.
  Le tarif est marqué `estimated` : il vient de l'agenda de Toulouse Métropole, pas de la
  billetterie de l'organisateur, qui est sur Shotgun (bloqué).
- **159 Festival Plein Air** (Douai, 25-26/06/2027) : `festivalpleinair.fr` répond, mais le
  site est **figé en 2022** (mention « © 2022 les Jardins Production », « Revivez l'édition
  2021 », affiche datée « samedi 20 & dimanche 21 août »). Les dates 2027 du catalogue
  viennent de jds ; elles ne sont donc confirmées par aucune source de l'organisateur.
- **592 The Ring x Club de Jour** : le JSON-LD du Warehouse porte un palier à 0,00 € marqué
  `SoldOut`. Le prix retenu (23 €) est le plus bas **encore en vente**, pas ce zéro.
- **561 Boston Bun au Stockfish** : le texte éditorial de jds parle du « 26 septembre 2025 »
  alors que son propre JSON-LD dit 2026-09-26. C'est une coquille de jds, la billetterie
  officielle du Stockfish confirme le 26/09/2026 à 20h.
