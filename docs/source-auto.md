# La source de données automatique

> Le catalogue était saisi à la main, lot par lot, et ne se rafraîchissait que si
> quelqu'un lançait un agent. Ce document décrit la première chaîne qui va chercher des
> dates toute seule, ce qu'elle refuse de faire, et pourquoi.

## Le problème qu'elle traite

Au 7 septembre 2026 le catalogue portait **481 dates à venir au Royaume-Uni contre 166 en
France**, alors que la France est le marché prioritaire. Ce n'est pas un accident : un
guichet britannique (Skiddle) avait été branché, et aucune source française. Le
déséquilibre ne se corrige pas en cherchant plus fort, il se corrige en branchant une
source.

Et sans automatisation, tout se périme : une date saisie une fois ne se re-vérifie jamais,
l'horizon se vide (129 dates seulement après le 31 décembre), et le commit du 28 août
« deux artistes décédés étaient annoncés sur des affiches à venir » est la signature de ce
défaut-là.

## Ce que la chaîne fait

    python3 .research/sources/jds.py     # collecte et met au format
    python3 .research/merge.py --dry     # puis sans --dry
    python3 .research/audit.py
    npm run build

`.github/workflows/catalogue.yml` enchaîne les quatre chaque lundi et **ouvre une pull
request**. Elle est déclenchable à la main depuis l'onglet Actions.

## Ce qu'elle ne fait pas, et c'est le sujet

**Elle ne publie rien.** Le catalogue est un fichier TypeScript relu à la main ; la règle
de contenu ne s'assouplit pas parce que la donnée arrive par une machine. Elle vient d'une
source *structurée*, ce qui rend la relecture plus rapide, pas facultative. La PR porte le
diff, le rapport de fusion, et la liste de ce que le collecteur a refusé de produire.

**Elle refuse trois choses, toujours pour la même raison : publier demanderait de deviner.**

1. **Un agenda « electro » n'est pas un agenda électro.** Celui de jds contient des
   « Candlelight : hommage à Hans Zimmer », des tributes Daft Punk joués par un orchestre,
   des ciné-concerts. Sur 349 fiches lues, **68 sont hors périmètre**. Les ingérer
   remplirait un annuaire de rave de concerts aux chandelles.
2. **Sans preuve de genre, pas de fiche.** `genres` est validé sur les onze clés de
   `GENRES` ; le déduire de « c'est dans la rubrique electro » serait l'invention que la
   règle de contenu interdit. La preuve est **forte ou rien** : un artiste que le projet a
   déjà attribué (`lib/artist-genres.ts`, 1 511 noms), ou un nom de style dans le titre.
3. **Sans horaire publié, pas de fiche.** `startDate` porte l'heure sur la plupart des
   dates. Quand il ne la porte pas, c'est en général un festival dont jds écrit noir sur
   blanc que « les horaires seront communiqués par l'organisateur ». La chercher dans le
   corps de la page ramène l'horaire d'un événement de la colonne latérale, vérifié.

Ce qui est refusé n'est pas perdu : `.research/sources/jds-a-relire.md` liste chaque
fiche, sa raison et son URL. Un festival écarté faute d'horaire se saisit à la main en
trois minutes, encore faut-il savoir qu'il existe. Un collecteur qui jette en silence est
un collecteur qu'on ne peut pas corriger.

## Quatre pièges payés à l'écriture

Ils sont dans le code avec leur cas nommé, les voici rassemblés.

**Le lien de billetterie de jds est le sien.** `offers[].url` est un lien Tradedoubler ou
Awin portant **leur** identifiant d'affilié. Le reprendre publierait leur lien sous notre
nom : le lecteur croit aller à la billetterie officielle et la commission part chez un
tiers. On extrait la destination réelle quand elle est lisible (`url(...)`), et
`AFFILIATE_REDIRECTORS` est une **liste de refus**, pas d'acceptation : un réseau qu'on ne
connaît pas encore doit être écarté par défaut. Le premier essai avait publié un
`awin1.com/pclick.php?…a=634278`.

**« house » est une sous-chaîne de « Warehouse ».** Les neuf dates du Warehouse de Nantes
sont sorties étiquetées House. Et « jungle » a classé en drum & bass **La Jungle**, duo de
noise-rock belge, sur son seul nom. C'est la règle « Ain est une sous-chaîne de Saintes »
d'`eventsForPlace()`, repayée deux fois : les mots-clés se cherchent en **mots entiers**,
les trop courants (« jungle », « garage », « minimal », « disco ») ont été retirés plutôt
que corrigés, et **le nom de la salle ne dit jamais le genre**, un club qui s'appelle
Warehouse ne dit rien de ce qu'on y joue ce soir.

**Le performer nommé dans le titre est la tête d'affiche, pas l'organisateur.** Un premier
filtre retirait du line-up tout artiste dont le nom apparaissait dans le titre. Il visait
« Les concerts Candlelight », qu'il n'attrapait pas (le test était dans l'autre sens), et
retirait exactement Bob Sinclar de « Bob Sinclar au Warehouse ». Sans line-up, plus
d'attribution de genre, donc plus de fiche : le rendement était tombé à 2 sur 349.

**La clé de dédup regroupe les éditions d'un festival, pas les dates d'une tournée.** Les
neuf dates de Fakear partagent un titre, donc huit seraient rejetées en doublon. Le
catalogue résout déjà ce cas en mettant la salle dans le titre (« NTO Live au Bikini ») :
`name_tour_dates()` applique la convention, et seulement aux titres qui se répètent, une
date unique gardant le nom sous lequel on la cherche.

## La description est la nôtre

Celle de jds est leur texte éditorial : le republier serait reprendre leur travail, et sa
voix n'est pas la nôtre. Le collecteur assemble une phrase de faits (salle, ville, dates,
tête d'affiche, tarif), comme `lib/pagecopy.ts` le fait pour les pages. C'est plat par
construction, et c'est assumé : la relecture qui précède la fusion est exactement
l'endroit où une description se réécrit, avec une source sous les yeux.

## Le département vient du code postal

`lib/geocode.ts` **refuse de deviner `region`** parce que Nominatim rend « Métropole de
Lyon » là où le catalogue dit « Rhône ». Les deux premiers chiffres d'un code postal, eux,
*sont* le numéro de département : c'est une correspondance, pas une déduction.
`.research/sources/departements.py` la porte, Corse et outre-mer compris.

## Skiddle, deuxième source

Le Royaume-Uni était figé : 421 de ses 529 dates venaient d'un export d'août 2026, alors
que les soirées de club se publient à quatre ou huit semaines. Skiddle est aussi le
deuxième réseau d'affiliation branché (`?sktag=15816`), donc une date retrouvée chez lui
est une date qui peut rapporter.

`.research/sources/skiddle.py` a **deux routes**, et les deux existent pour une raison.

**L'API** est la bonne route : filtres `country`, `eventcode`, `minDate`, pagination, et
`description=1` qui rend les genres et les artistes. Elle demande une **clé gratuite sur
inscription** (`skiddle.com/api/join.php`), qu'un script ne peut pas obtenir. Posez
`SKIDDLE_API_KEY` (variable d'environnement en local, secret GitHub pour le workflow) et
c'est elle qui sert. Sans clé, l'API répond `{"errorcode": 998, "errormessage": "A valid
API Key must be provided"}`, et le collecteur bascule.

**Les pages de salle** sont la route sans clé, et elle est éprouvée : le `robots.txt` de
Skiddle liste explicitement `ClaudeBot` avec un `Crawl-delay: 2`, respecté ici, et **une
page de salle porte le JSON-LD de toutes ses dates**, une quarantaine en une requête. On
ne parcourt pas les 14 536 pages du sitemap : seulement les 64 salles que le catalogue
programme déjà, ce qui est le besoin et ce qui borne le crawl.

Les deux routes se rejoignent sur une forme intermédiaire commune, si bien que le
classement, la mise au format et le rapport sont partagés : la route API n'ajoute que sa
façon d'aller chercher.

### Trois pièges propres à Skiddle

**Sa `endDate` est une heure de fermeture, pas un dernier jour.** Une soirée du 18
septembre 22 h à 3 h du matin y finit « le 19 ». Reprise telle quelle, `isPast()`
garderait la soirée du samedi « à venir » tout le dimanche, exactement ce que les trois
portes de mise en avant existent pour empêcher. Un vrai multi-jours se reconnaît à un
écart d'au moins deux jours.

**Le tarif est le plus bas encore en vente.** Les offres sont des paliers successifs
(« First Release », « TIER 1 ») avec chacun son `availability` : retenir le plus bas sans
regarder publierait un palier `SoldOut` que personne ne peut plus payer, l'erreur payée
sur Index: HorsegiirL. Et quand **plus rien** n'est en vente, la fiche garde sa place,
c'est un événement réel, mais perd son lien billetterie : « un lien qui promet la soirée
et ne vend rien vaut moins que pas de lien du tout ».

**Une résidence hebdomadaire ne se distingue pas par sa salle.** Le suffixe de salle
sépare les dates d'une tournée, qui change de lieu ; les quatre « Insomnia London » du
Phonox gardent le même titre, donc la même clé, donc trois seraient rejetées en doublon
et la quatrième prise au hasard. C'est le cas des Klubnacht berlinoises décrit dans
`CLAUDE.md` : quelle date est distinctive ne se décide pas à la machine, donc elles
sortent du lot et vont à la relecture, entières.

### Un mot que `merge.py` attend

`merge.py` pose `priceNote: "unknown"` quand la note de la fiche contient « non
communiqué ». Le premier essai écrivait « plus aucun billet en vente », qui ne déclenchait
rien : les 18 soirées épuisées seraient sorties à `price: 0` **sans** `priceNote`,
c'est-à-dire affichées « GRATUIT ». Les deux libellés portent donc ce motif, et ce n'est
pas une coïncidence à défaire.

## Ticketmaster, troisième source, et la seule qui exige une clé

`.research/ticketmaster.md` situait le gisement en Italie, en Allemagne et à Manchester,
et concluait déjà : « pour un relevé exhaustif il faut l'API Discovery, pas du scraping ».
C'est exact, et il n'y a **aucun contournement**.

**Vérifié à nouveau** : `ticketmaster.fr`, `.de`, `.co.uk` et `.it` répondent tous 403
depuis un serveur, y compris leur `robots.txt`. Live Nation, du même groupe, répond bien
200, mais ne rend côté serveur que le titre, la date et la salle : ni coordonnées, ni
tarif, ni line-up. Une fiche sans coordonnées n'entre pas au catalogue, c'est la règle de
contenu, donc cette route ne produirait presque rien. C'est l'API ou rien.

La clé est gratuite sur `developer.ticketmaster.com` (Discovery API v2). Posez
`TICKETMASTER_API_KEY` en variable d'environnement ou en secret GitHub. Sans elle, le
collecteur l'écrit en toutes lettres et **sort sans rien produire** : le workflow ne doit
pas échouer parce qu'une source facultative n'est pas configurée, et un lot vide écrit en
silence laisserait croire que Ticketmaster n'a rien à offrir.

### Ce que cette source apporte que les autres n'ont pas

Sa réponse porte **le classement de la billetterie elle-même** :
`classifications[].segment` (« Music »), `genre` (« Dance/Electronic ») et `subGenre`
(« Techno », « House », « Hardstyle »). C'est une attribution faite par celui qui vend le
billet, donc une preuve autrement plus solide qu'un mot-clé pêché dans un texte, et elle
sert de filtre de périmètre en même temps : un genre « Rock » ne franchit pas la porte.

L'ordre reste celui du projet : l'artiste attribué d'abord (plus fin, « Dance » couvre
tout), le classement Ticketmaster ensuite, le titre en dernier. Et **un sous-genre qui ne
correspond à aucune de nos onze cases n'est pas traduit au plausible** : « Downtempo »,
« Electronica » et « Ambient » ne sont aucune d'elles, la fiche retombe alors sur
l'artiste et, à défaut, part en relecture.

Elle apporte aussi le tarif (`priceRanges[].min`), les coordonnées exactes de la salle,
le code postal (donc le département français), le line-up (`_embedded.attractions`) et le
statut : une date `cancelled` ou `postponed` est refusée, ce qu'aucune des deux autres
sources ne dit aussi clairement.

Le lien de billetterie **ne porte aucun tag** : `ticketmaster.*` et `livenation.*` sont
dans `AFFILIATE_HOSTS`, le tag Impact les réécrit et `rel="sponsored"` se déduit du
domaine. Contrairement à Skiddle, il n'y a rien à coller dans l'URL.

### Quelle clé, et où la poser

Le portail Ticketmaster rend **deux** identifiants, et un seul sert ici.

| | |
|---|---|
| **Consumer Key** | C'est la clé d'API. L'authentification Discovery tient en un seul paramètre de requête, `apikey=…`, sans signature. |
| Consumer Secret | Ne sert **pas** à Discovery. Il n'intervient que dans les échanges OAuth2 des API Commerce et Partner, que ce collecteur n'appelle pas. Il n'a donc rien à faire dans une variable d'environnement du projet. |

Elle se pose en **secret GitHub**, et là seulement : le collecteur tourne dans l'action
hebdomadaire, jamais sur le site. Vercel n'en a aucun usage, le site n'appelle pas
Ticketmaster au rendu.

    Dépôt → Settings → Secrets and variables → Actions → New repository secret
    Name  : TICKETMASTER_API_KEY
    Secret: le Consumer Key

Pour vérifier avant d'attendre lundi :

    TICKETMASTER_API_KEY=… python3 .research/sources/ticketmaster.py --check

Il fait une requête minimale et **distingue les deux refus**, parce qu'ils ne se
corrigent pas pareil : `FailedToResolveAPIKey` veut dire qu'aucune clé n'est arrivée
(variable mal nommée, secret absent), `InvalidApiKey` qu'une clé est arrivée mais n'est
pas la bonne, le cas typique étant le Consumer Secret collé à la place du Consumer Key.
Un simple « échec » aurait obligé à chercher dans les journaux.

### Comment il a été vérifié sans clé

Le mode `--fixture` rejoue la mise au format sur une réponse enregistrée, sans réseau.
`tm-fixture.json` est construite **strictement sur le schéma documenté** et porte huit
cas, dont sept limites : une date annulée, un horaire non fixé, une salle sans
coordonnées, un concert classé Rock, un « Candlelight : hommage à Daft Punk », un
sous-genre hors de nos onze cases, et un festival multi-jours. Les huit se comportent
comme prévu, deux passent et six vont en relecture.

Ce que cela prouve et ce que cela ne prouve pas : le mapping, les refus et les priorités
de genre sont testés ; la forme réelle des réponses de Ticketmaster ne l'est pas, faute
de clé. La surface non vérifiée se réduit à un appel HTTP dont l'URL est documentée, et
le collecteur signale toute anomalie (`fault.faultstring`) au lieu de l'avaler.

## Résultat de la première collecte

**jds.fr** : 349 fiches lues, 86 mises au format, **31 nouvelles dates** fusionnées (les
55 autres étaient déjà au catalogue, ce qui est le signe que la dédup fait son travail).
La France passe de 166 à 195 dates à venir, et quatre départements se sont ouverts
(Haut-Rhin, Yonne, Charente-Maritime, Hautes-Pyrénées).

**Skiddle**, route sans clé : 64 pages de salle lues, 1 095 dates vues, 109 mises au
format, **62 fusionnées**. 91 des 109 portent un lien affilié taggé, les 18 autres étant
épuisées. Le catalogue passe de 1 320 à 1 382 événements.

## Deux sources qu'on ne branchera pas : DICE et Resident Advisor

Les deux nous **interdisent nommément**, et ce n'est pas une supposition tirée d'un code
de statut. Leur `robots.txt` porte :

    User-agent: ClaudeBot
    Disallow: /

DICE ajoute, en tête de fichier, que ces restrictions sont des « **express reservations of
rights under Article 4 of the European Union Directive 2019/790** », c'est-à-dire une
réserve de droits au titre de la fouille de textes et de données, et pose un
`Content-Signal: ai-train=no`. Ses pages répondent par ailleurs 403.

Il n'y a donc que deux façons de les collecter, et aucune n'est acceptable : ignorer un
`Disallow` qui nous nomme, ou se présenter sous un autre user-agent pour passer le
pare-feu. La comparaison avec Skiddle est éclairante : là-bas le `robots.txt` **autorise**
explicitement ClaudeBot avec un `Crawl-delay: 2`, et c'est précisément ce qui rend la
collecte défendable. La même technique ne devient pas acceptable parce qu'elle marche.

**Ce qui reste possible avec DICE**, et qui ne dépend pas de nous : leur API partenaire.
Elle s'ouvre par une relation commerciale (promoteur ou distributeur), pas par une
inscription en ligne. Le jour où ces accès existent, le collecteur s'écrit comme celui de
Ticketmaster, la machinerie est déjà là.

**Ce que ça ne change pas** : les liens `dice.fm` déjà au catalogue restent en place.
Renvoyer un lecteur vers une billetterie n'est pas la parcourir, et c'est même ce que
DICE attend d'un annuaire.

**L'alternative immédiate est Shotgun**, qui autorise tout le monde (`User-Agent: * /
Allow: /`), sert du contenu réel à ClaudeBot, et couvre le marché français, celui-là même
où le catalogue est le plus mince. Vérifié joignable ; son sitemap a répondu 429 au
premier essai, donc il faudra le lire lentement.

## Brancher une autre source

Le format d'échange est celui de `.research/events-*.json`, décrit par `REQUIRED` dans
`merge.py`. Un nouveau collecteur écrit ce JSON et n'a rien d'autre à savoir : la dédup,
la normalisation de devise, l'audit et le build sont communs.

Ce qui est commun à toutes les sources vit dans `.research/sources/common.py` : le
vocabulaire éditorial (`OFF_TOPIC`, `GENRE_HINTS`), l'attribution de genre par artiste, la
mise au format, la convention des tournées et le rapport de relecture. Un nouveau
collecteur n'écrit que sa façon d'aller chercher. Deux logiques de classement écrites
séparément divergeraient à la première correction, ce que `lib/catalog-export.ts` a déjà
fermé pour la conversion des dépôts de promoteurs.

Les sources déjà repérées et ce qu'elles valent depuis le conteneur sont dans `CLAUDE.md`
(section « Sources exploitables »). Les prochaines les plus utiles : **CTS Eventim**, qui
tient le marché DACH là où Ticketmaster est faible, et **DICE**, qui est en clair et
couvre les clubs britanniques que Skiddle ne vend pas.

### Les trois clés, en un coup d'œil

| Source | Clé | Sans elle |
|---|---|---|
| jds.fr | aucune | rien à faire, elle tourne |
| Skiddle | `SKIDDLE_API_KEY`, facultative | route des pages de salle, mêmes dates |
| Ticketmaster | `TICKETMASTER_API_KEY`, **obligatoire** | la source est sautée, et le dit |
