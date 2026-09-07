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

## Shotgun, quatrième source, et le rééquilibrage français

Shotgun est le guichet de la scène électro française. Là où jds.fr donne l'agenda des
salles déclarées et Ticketmaster les grosses jauges, Shotgun porte la soirée de club
vendue à cent personnes, celle qui n'existe nulle part ailleurs sous forme structurée.
Sur Paris seule, son agenda annonce plus de deux mille dates sur soixante-huit jours,
quand le catalogue européen entier en compte mille quatre cents. C'est la source qui
répond au déséquilibre que Skiddle avait creusé.

    python3 .research/sources/shotgun.py                 # tout, avec cache
    python3 .research/sources/shotgun.py --city paris    # une ville
    python3 .research/sources/shotgun.py --no-cache      # ce que fait le workflow

**Aucune clé.** Le `robots.txt` de `shotgun.live` tient en trois lignes,
`User-Agent: * / Allow: /` plus un sitemap : aucun agent nommé, aucune zone fermée, et
surtout **aucune réserve de droits**, ni article 4 de la directive 2019/790, ni en-tête
`Content-Signal`. C'est exactement ce qui manque à DICE et à Resident Advisor (voir plus
bas), et c'est ce qui rend cette collecte défendable là où la leur ne l'est pas. On s'y
annonce quand même en `ClaudeBot/1.0` avec une temporisation : une source qu'on ne
bouscule pas est une source qui reste ouverte.

### Deux temps, et c'est ce qui la rend supportable

1. **La page de ville**, une requête par ville. `?page=N` y est **cumulatif** et non
   paginant : `?page=40` rend les quarante premières pages d'un coup, donc l'agenda
   entier d'une ville tient dans un seul appel. Chaque carte porte déjà le titre, la
   salle, le jour, l'heure locale, le prix d'appel **et les étiquettes de genre de
   Shotgun**, ce qui suffit à décider sans ouvrir une seule fiche.
2. **La fiche**, une requête par événement retenu, uniquement pour ce que la carte n'a
   pas : les coordonnées (sans elles on n'ajoute pas l'événement), l'adresse complète, le
   line-up et l'heure de fin. Son `application/ld+json` est un `MusicEvent` complet.

Les 80 villes de `CITIES` sont des **clés de découverte, rien de plus** : la ville et le
pays publiés viennent de l'adresse de la fiche. C'est pourquoi la liste peut contenir des
libellés qui sont des régions (« aix-marseille », « cote-d-azur », « pau-tarbes ») sans
qu'aucun n'atteigne jamais le catalogue. Les Açores, Madère et les Canaries en sont
volontairement absentes : le fuseau est déduit du **pays**, et il n'y est pas celui du
continent (voir le piège du fuseau juste en dessous).

### Les étiquettes de genre font le filtre et l'attribution

Comme les `classifications[]` de Ticketmaster, ce sont celles de la billetterie
elle-même, donc une preuve autrement plus solide qu'un mot-clé pêché dans un texte. Le
vocabulaire a été relevé sur l'agenda parisien complet, **131 libellés distincts**, et il
rend trois réponses et non deux :

- « Techno », « Tech House », « Hard Groove » **attribuent** un de nos onze genres ;
- « Electro », « Dubstep », « UK Garage », « Industrial », « Ambient » **prouvent le
  périmètre sans attribuer**, parce qu'aucun n'est une de nos onze cases et que leur en
  coller une serait l'invention que la règle de contenu interdit ; l'attribution repart
  alors sur l'artiste, puis sur le titre ;
- « Salsa », « Reggaeton », « Bouyon » sont une preuve **contraire**, et c'est la plus
  utile des trois puisqu'elle écarte sans avoir à ouvrir la fiche.

L'ordre reste celui du projet, l'artiste d'abord. Il fallait pour ça appeler
`genres_for()` avec le **titre vide** : sinon un mot-clé attrapé dans un nom de soirée
passait devant le classement de la plateforme, qui est une attribution faite par celui
qui vend le billet.

### Cinq pièges propres à Shotgun

**Le JSON-LD est en UTC, le catalogue stocke l'heure locale.** Une soirée parisienne
annoncée `2026-09-07T21:59:00.000Z` commence à 23 h 59, pas à 21 h 59, et l'écart tombe à
une heure l'hiver, ce qui est pire : un décalage constant se repère, un décalage qui
change de valeur deux fois par an passe pour une donnée juste. On convertit par
`zoneinfo`, d'après le pays de l'adresse.

**`endDate` est l'heure de fermeture, jamais la fin d'un festival.** C'est le défaut déjà
payé sur Skiddle, ici sous une autre forme : le champ existe et il est faux. Une soirée de
club qui ferme à 4 h porte un `endDate` au lendemain, et `isPast()` la garderait « à
venir » toute la journée du dimanche. La règle qui tranche les deux cas d'un coup est la
**journée qui commence à 10 h** : le dernier jour est celui de la fin, ramené au jour
précédent si elle tombe à 10 h ou avant. Deux réglages ont été payés pour arriver là.
Minuit ne marche pas, c'est le défaut d'origine. Six heures non plus : la fermeture la
plus courante de tout l'agenda est **exactement** 6 h, une borne exclusive la renvoyait au
mauvais jour, et le Rex Club ferme à 7 h, ce qui suffisait à faire d'une soirée du
mercredi un festival de deux jours. À 10 h, plus rien ne se discute : entre 6 h et 10 h,
rien ne *commence*, donc tout ce qui finit là est la queue de la nuit précédente.

**Un tarif d'appel n'est pas forcément une entrée, mais une liste d'exclusion brutale est
pire.** Les offres portent des vestiaires, des navettes, des places de parking, des
billets « -12 ans » à 0 € et des paliers déjà épuisés. On ne retient donc que ce qui est
en vente, non nul, et qui est bien une entrée. Le premier essai excluait tout libellé
contenant « drink » : les deux fiches de contrôle sont ressorties à **zéro euro** alors que
leur carte annonçait 10 €, parce que « Entrée avant minuit + 1 drink » est le tarif normal
de la moitié des clubs parisiens. D'où deux listes et non une : un supplément **cité à
côté d'une entrée** ne change pas la nature de l'offre, ce qui la change c'est de ne pas
être une entrée du tout (un vestiaire) ou de ne pas être *cette* entrée-là (un tarif
enfant).

**Un titre peut n'avoir aucune lettre, et c'est le build qui l'a dit.** « 𝓞𝓝𝓓𝓔𝓢 » est
écrit en caractères mathématiques Unicode : `slugify()` n'en garde rien, la fiche se rend
alors sur `/event` au lieu de `/event/{slug}`, et `next build` échoue **après avoir
généré dix-neuf mille pages**. Ni `merge.py`, ni `audit.py`, ni les quatre garde-fous ne
voyaient ça, ce qui est exactement la leçon déjà écrite pour l'artiste « Daniel[i] » :
seul `npm run build` attrape certaines choses, et il fait partie de la fusion, pas de
l'après. Trois corrections plutôt qu'une : `tidy_title()` normalise en **NFKC**, la
normalisation de compatibilité prévue pour ça, qui rend « ONDES » ; le collecteur écarte
quand même un titre dont il ne reste rien, un titre fait d'émojis étant encore possible ;
et `audit.py` porte désormais le test, parce que le rattraper là coûte une seconde quand
le laisser aller au build en coûte dix minutes.

**Le champ « salle » est libre, et l'organisateur y met parfois son adresse.**
« 10 Rue de Lappe, 75011 Paris, France » y arrive tel quel, et le publier ouvre
`/lieux/10-rue-de-lappe-75011-paris-france` : le `/lieux/300-lieux-dans-amsterdam` que la
règle interdit, par une porte de plus. `is_address()` teste trois signatures, le libellé
**est** l'adresse, il contient le code postal, ou il commence par un numéro de voie suivi
d'un mot de voirie. Le numéro seul ne suffit pas, « Studio 56 » et « Level 3 » sont de
vraies salles.

### Deux corrections qui profitent aux quatre sources

Elles vivent dans `common.py`, parce qu'elles ne sont propres à personne.

**La date collée en fin de titre.** « Acid Oslo X I Am Ebi Snake 07/09/26 »,
« Let's MIX ! 07.09 », « Caipiri Open Air | 8 Septembre @Casatroca » : c'est une habitude
d'organisateur, la date est déjà un champ, et collée au titre elle repart dans le slug et
dans le `<title>`, où deux dates de la même soirée feraient deux marques au lieu d'une.
`tidy_title()` retire la date en chiffres, la date en toutes lettres, la salle rappelée
avec une arobase, et **l'année d'édition** (« Le titre porte le festival, pas l'édition »,
CLAUDE.md). La fenêtre de l'année est bornée à 20xx pour ne pas amputer « Hangar 1988 ».

**Le montant dans la description était écrit à la machine.** « Entrée à partir de 7.99 € »
est un point décimal dans une phrase française, et « 9.9 € » perd le centime que le tarif
annonce. Le repère est `priceLabel()` (`lib/format.ts`), le seul endroit qui décide déjà
de cette écriture : deux décimales dès qu'il y en a, virgule en français, et seules
`€ £ $` se préfixent, en anglais seulement. Le défaut existait sur les trois collecteurs
précédents, il ne se voyait pas parce que jds et Ticketmaster rendent surtout des entiers.

### Les plafonds sont écrits dans le rapport, jamais avalés

L'agenda parisien de Shotgun est plus gros que le catalogue entier : `--per-city`
(60 par défaut) est ce qui garde une exécution hebdomadaire sous une demi-heure. Il coupe
la longue traîne des soirées de semaine, pas la page qui capitalise, puisque les
**festivals passent devant** (ils sont identifiables sur la carte, leur lien est en
`/festivals/` et non `/events/`) et que le reste est pris par ordre de date. Ce que le
plafond écarte part dans `shotgun-a-relire.md` avec son URL, comme tout le reste : une
troncature silencieuse laisserait croire qu'une ville n'a rien à offrir. `--pages`
(profondeur de l'agenda) et `--months` (horizon, 8 par défaut) se règlent de la même
façon.

### Le lien de billetterie est un lien nu

`shotgun.live` n'est dans aucun réseau d'affiliation branché ici : pas de tag à coller
dans l'URL comme sur Skiddle, pas de domaine dans `AFFILIATE_HOSTS` comme Ticketmaster.
`outboundRel()` lui posera `nofollow` et rien d'autre, ce qui est exact : un lien qui ne
rapporte rien ne se déclare pas sponsorisé.

## Résultat de la première collecte

**jds.fr** : 349 fiches lues, 86 mises au format, **31 nouvelles dates** fusionnées (les
55 autres étaient déjà au catalogue, ce qui est le signe que la dédup fait son travail).
La France passe de 166 à 195 dates à venir, et quatre départements se sont ouverts
(Haut-Rhin, Yonne, Charente-Maritime, Hautes-Pyrénées).

**Skiddle**, route sans clé : 64 pages de salle lues, 1 095 dates vues, 109 mises au
format, **62 fusionnées**. 91 des 109 portent un lien affilié taggé, les 18 autres étant
épuisées. Le catalogue passe de 1 320 à 1 382 événements.

**Shotgun** : 80 pages de ville lues, environ dix mille cartes vues, 1 263 fiches
ouvertes, 694 mises au format, **671 fusionnées**. C'est de loin la plus grosse des
quatre, et elle fait exactement ce qu'on lui demandait : le catalogue passe de 1 382 à
**2 053 événements**, la France de 195 à **697 dates à venir**, et onze départements
s'ouvrent (Maine-et-Loire, Pas-de-Calais, Côtes-d'Armor, Indre-et-Loire, Seine-Maritime,
Somme, Vienne, Cher, Landes, Ariège, Territoire de Belfort). Le Portugal arrive avec 108
dates, marché où Shotgun est aussi installé qu'en France.

2 698 fiches partent à la relecture, dont l'immense majorité pour une raison qui n'est pas
un défaut : le plafond par ville, ou un classement de la billetterie qui dit « Salsa ».

Une exécution complète prend une trentaine de minutes, l'essentiel en lecture de fiches
(1 263 requêtes à environ une par seconde). Les 80 pages de ville, elles, se lisent en
quatre minutes.

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

**L'alternative a été branchée, c'est Shotgun** (section plus haut) : il autorise tout le
monde (`User-Agent: * / Allow: /`), sans réserve de droits, sert du contenu réel à
ClaudeBot, et couvre le marché français, celui-là même où le catalogue était le plus
mince. La comparaison des deux `robots.txt` est tout le sujet : la même technique de
lecture est défendable chez l'un et ne l'est pas chez l'autre.

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
(section « Sources exploitables »). La prochaine la plus utile est **CTS Eventim**, qui
tient le marché DACH là où Ticketmaster est faible. DICE couvrirait les clubs britanniques
que Skiddle ne vend pas, mais son `robots.txt` nous ferme la porte et il n'y a pas à
discuter.

### Les clés, en un coup d'œil

| Source | Clé | Sans elle |
|---|---|---|
| jds.fr | aucune | rien à faire, elle tourne |
| Shotgun | aucune | rien à faire, elle tourne |
| Skiddle | `SKIDDLE_API_KEY`, facultative | route des pages de salle, mêmes dates |
| Ticketmaster | `TICKETMASTER_API_KEY`, **obligatoire** | la source est sautée, et le dit |
