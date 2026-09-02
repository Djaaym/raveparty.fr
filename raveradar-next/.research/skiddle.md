# Skiddle - relevé d'affiliation

Campagne du 2 septembre 2026. Skiddle a un programme d'affiliation dont le tag se
pose **en clair dans l'URL** (`?sktag=15816`), sans encapsulation ni script : un lien
taggé est rendu côté serveur et fonctionne sans JavaScript, contrairement au tag
Impact de `components/ImpactAffiliate.tsx`, qui ne réécrit qu'une fois la page
chargée.

**101 dates du catalogue** portent désormais un lien Skiddle taggé : 64 fiches
d'événement (dont les 16 liens Skiddle déjà présents, qui n'avaient pas le tag) et
37 pages de festival. Répartition : 67 UK, 7 Pays-Bas, 7 Allemagne, et le reste
dispersé sur 13 autres pays.

## Ce que la collecte a appris

**Skiddle n'est pas qu'un guichet britannique, mais presque.** Ses 29 667 dates
d'événement sont massivement UK ; hors Royaume-Uni et Irlande, son catalogue de
soirées se résume à des bars de vacances (Ibiza, Tenerife, Malte, Albufeira), rien
qui recoupe le nôtre. En revanche ses **380 pages de festival** couvrent toute
l'Europe, y compris des marques que le catalogue porte déjà : Voodoo Village,
Draaimolen, Sónar, Time Warp, Parookaville, DGTL, Awakenings, UNTOLD, Roskilde,
Pohoda. C'est là qu'est le gisement hors UK.

**Le vrai gain est sur les salles qui n'avaient qu'un lien d'agenda.** Le catalogue
renvoyait 22 dates du Warehouse Project sur `thewarehouseproject.com/calendar/`,
12 dates de Drumsheds sur `drumshedslondon.com/whats-on/`, 11 dates de SWG3 sur
`swg3.tv/events` et 7 dates Teletech sur `teletech.events/events` : autant de
listings où le lecteur doit retrouver sa date à la main, et zéro retour. Ces liens
pointent maintenant sur la fiche de la date exacte.

## Comment lire Skiddle depuis le conteneur

- **`curl` avec un user-agent de navigateur reçoit un 202 vide** (WAF). Le
  user-agent **`ClaudeBot/1.0` passe**, et c'est légitime : le `robots.txt` du site
  liste explicitement ClaudeBot avec un `Crawl-delay: 2`, respecté ici. Googlebot,
  lui, est refusé. Les pages `/festivals/` et `/whats-on/` ne sont pas en
  `Disallow`.
- **Le sitemap n'est pas sur le domaine** (`skiddle.com/sitemap.xml` rend la page
  d'accueil) : `robots.txt` le pointe sur
  `d1plawd8huk6hh.cloudfront.net/sitemaps/sitemap.xml`, servi par le CDN, donc sans
  WAF et sans user-agent particulier. 30 fichiers d'événements, un de festivals, un
  de salles.
- **L'API `api.skiddle.com` répond 403 sans clé**, et la recherche du site
  (`/search/?keyword=`) est derrière le WAF. Tout passe donc par le sitemap.
- **Une page de salle porte le JSON-LD de toutes ses dates** (nom, URL, date de
  début, tarifs) : une requête donne l'agenda complet du lieu, c'est de loin le
  point d'entrée le plus rentable. Une page de festival porte un `MusicEvent` avec
  `startDate`, `endDate`, `addressLocality` et `addressCountry`.

## La règle de correspondance

Une paire n'est retenue que si **la date, la ville et le pays** concordent, jamais
sur le nom seul. Le nom sert à départager, pas à décider. Ce garde-fou a écarté :

- **Six collisions de nom entre pays** : le Warehouse de Nantes contre The Warehouse
  de Leeds (4 dates), le Roxy de Prague contre celui de Londres (2 dates). Les noms
  de salle génériques sont le piège classique, déjà payé sur `VENUE_SOCIALS`.
- **Une collision de date au même endroit** : « DJ Jean at Cyprus Avenue » (Cork,
  14/11) tombait sur *Fist Of Pure Emotion*, une soirée rock des années 80 dans la
  même salle le même soir. Même date, même lieu, même pays, et pourtant faux : c'est
  la lecture de la fiche qui a tranché.
- **Deux festivals britanniques qui se chevauchent** : Gottwood (10-13/06/2027,
  Anglesey) contre Download et Goodlife, mêmes jours, même pays.

## Ce qui a été laissé de côté, et pourquoi

- **WHP Eric Prydz (17/10)** et **WHP Alisha (23/10)** : Skiddle ne vend pour ces
  deux soirées que le billet « Concourse Only », c'est-à-dire une salle annexe du
  Depot Mayfield, pas l'événement. Un lien qui promet la soirée et vend autre chose
  vaut moins que pas de lien du tout ; les deux gardent
  `thewarehouseproject.com`.
- **Les sous-événements de l'ADE** (Awakenings ADE, Verknipt ADE, Thuishaven,
  Shelter, elrow…) tombent tous dans la fenêtre 21-25/10 à Amsterdam, donc sur la
  page-ombrelle `amsterdam-dance-event`. Seule la fiche ADE elle-même (id 127) la
  reçoit : envoyer quinze soirées distinctes sur la même page de festival serait la
  version billetterie du `/lieux/300-lieux-dans-amsterdam` que le projet refuse
  ailleurs.
- **Les salles irlandaises et nord-irlandaises du catalogue** (Index, Racket Space,
  Wigwam, Vicar Street, 3Arena, The Telegraph Building) ne sont pas sur Skiddle :
  seul Cyprus Avenue à Cork y figure.

**Les 101 URLs ont été vérifiées une à une après écriture** (code HTTP, avec le tag) :
100 en 200, une en **301**. Homobloc n'a plus de fiche d'événement chez Skiddle, la
sienne redirige sur `/festivals/Homobloc/` : le lien stocké est la destination, pas
la redirection. Un lien de billetterie qui rebondit n'est pas cassé, mais il perd le
paramètre sur certains guichets, et c'est justement le paramètre qui nous paie.

## Un lien de billetterie doit permettre d'acheter, et ça se vérifie

Un bouton « Billetterie » qui arrive sur une page où il n'y a rien à acheter est pire
qu'un lien vers le site de l'organisateur : le lecteur a cliqué pour rien, et nous
n'y gagnons pas un centime. Les 101 liens ont donc été repassés sur la seule preuve
lisible côté serveur, le tableau `offers` du JSON-LD. **47 ont survécu.**

- **Les 37 pages `/festivals/` sont des pages line-up, pas des caisses.** Aucune ne
  porte d'offre, toutes annoncent `priceRange: "Tickets available from £0.00"`, et
  leur HTML serveur ne contient ni prix, ni état de vente, ni lien vers une fiche de
  vente. Le module de billetterie, s'il existe, est monté en JavaScript. Recherche
  faite dans le sitemap des 29 667 événements : **aucun de ces 37 festivals n'a de
  fiche de vente Skiddle** (les seuls rapprochements sont des homonymes, « Mods
  Mayday » pour Mayday, « Hideout Unlimited Brunch » pour Hideout). Tous rendus à
  leur billetterie d'origine.
- **9 fiches d'événement sont épuisées** (toutes leurs offres en `SoldOut`) et
  **8 n'ont aucune offre** : Skiddle les référence sans les vendre, le cas typique
  d'une soirée du Warehouse Project dont la vente est ailleurs. Rendues aussi.
- **Le signal se lit à deux endroits et ils s'accordent** : la fiche et la page de
  salle qui la liste donnent le même `offers`. Ce n'est donc pas un défaut de rendu,
  c'est l'état réel de la vente.
- **Une exception assumée, l'id 796** (Tiësto au Blackstone Street Warehouse) :
  épuisé chez Skiddle, mais c'est Skiddle que le catalogue donnait déjà comme
  billetterie avant cette campagne. Le rendre à son « lien d'origine » l'aurait
  renvoyé sur la même page sans le tag, donc au même endroit pour zéro revenu. Il
  garde le lien taggé.
- **Cette vérification a une date de péremption.** Une soirée épuisée peut être
  remise en vente, une vente peut ouvrir plus tard : ces 54 liens méritent d'être
  repassés au prochain lot, pas d'être considérés comme tranchés pour toujours.

## Le lot inverse : ce que Skiddle a et que nous n'avions pas

Second temps de la campagne, 421 dates britanniques ajoutées au catalogue (868 -> 1 289),
toutes avec un billet réellement en vente et le lien taggé. La chaîne, dans l'ordre :

1. **Sélection hors ligne**, sur les 29 667 URLs du sitemap. Trois signaux : le titre
   contient un artiste déjà au catalogue (1 993 noms utilisables, 365 URLs), un mot-clé
   électro franc (521), ou la fiche est à une salle qu'on référence déjà (517). Total
   1 312 pages, contre seize heures de crawl pour tout lire.
2. **Récolte** : une requête par fiche, `Crawl-delay: 2` respecté, JSON-LD complet
   (date, salle, ville, **coordonnées**, line-up, offres) plus le tableau `genres`,
   qui n'est pas dans le JSON-LD mais dans l'état de page.
3. **Conversion** puis `merge.py` comme n'importe quel lot de recherche.

Ce que le tri a écarté, et c'est l'essentiel du travail : 225 fiches sans genre
électro, 195 sans rien en vente, 195 hors périmètre, 113 sans affiche ni tarif
significatif, 36 formats de soirée qui ne relèvent pas d'un annuaire (freshers,
school disco, bottomless brunch, quiz), 26 doublons internes, 23 fiches hors UK dont
Skiddle rend le **pays** en guise de ville.

### Les pièges payés sur ce lot

- **Le genre principal est le premier de la liste, et lui seul décide.** « And Also
  The Trees », groupe post-punk, portait `Minimal` en quatrième étiquette et entrait
  en Techno : sur une affiche indie, « Minimal » veut dire minimal wave. `Minimal`,
  `Dance` et `Electro` ne comptent donc que **à côté** d'un genre franc, et un premier
  genre hors périmètre suffit à écarter la fiche.
- **Un billet à 0 n'est pas une entrée libre.** Vingt-deux fiches avaient une offre à
  0,00 £ en vente : guest list, liste d'attente, gratuité avant minuit. Au catalogue,
  `price: 0` sans `priceNote` affirme « GRATUIT ». On prend donc le plus bas tarif
  **non nul**, et à défaut on écrit la note qui fait poser `priceNote: "unknown"`,
  sauf quand la fiche dit « free » en toutes lettres.
- **Aucune `endDate` dans ce lot, volontairement.** La date de fin d'une fiche Skiddle
  est l'heure de fermeture. Un « All Day Rave » de midi à midi mesure exactement 24 h
  et passait pour un festival de deux jours, donc restait « à venir » tout le lendemain.
- **La ville départage les salles, sinon on renomme un club d'après un autre.**
  L'unification des orthographes rapprochait « The Warehouse » de Leeds du
  « Warehouse » de Nantes, parce qu'elle ne regardait que le nom. Elle est désormais
  indexée sur (ville, nom sans article). À l'inverse, retirer la ville collée au nom
  fusionnait « The Tunnel Club Nottingham » avec celui de Birmingham : quand un nom
  se retrouve dans deux villes, on rend son nom d'origine à chacun, et on ne colle la
  ville que sur de vrais homonymes (les deux « The Warehouse », Leeds et Villa Park).
- **La description se construit avec la salle en sujet.** « au {salle} » donne « au
  The Clock Factory » dès qu'un nom anglais porte son article, et un tiers des salles
  britanniques commencent par « The ». D'où « {salle} accueille une nuit … ».
- **Le titre ne porte jamais d'année** : cinq fiches en portaient une, elles sont
  restées dehors plutôt que d'être renommées.

### Ce que ça change au catalogue

Le Royaume-Uni passe de 108 à 529 dates et devient le premier pays devant la France
(192). C'est la conséquence directe de la source : Skiddle est un guichet
britannique, ses fiches d'événement le sont à 99 %. Le rééquilibrage viendra d'une
source française, pas de celle-ci. Douze villes britanniques entrent dans `PLACES`
(Nottingham, Southampton, Bournemouth, Derby, Leicester, Coventry, Plymouth,
Aberdeen, Milton Keynes, Preston, Northampton, Peterborough), Gateshead est rattaché
à Newcastle.

## L'affiche de l'organisateur, elle, est servie par Skiddle

Une fiche Skiddle porte le presskit du promoteur, et à trois tailles qu'il faut
connaître : le JSON-LD ne donne que le `_400.jpg` (22 Ko), la page contient aussi un
`_1024.jpg` carré, et surtout un **`_eflyer.jpg`**, l'affiche d'origine, mesurée
jusqu'à 2000x2400. Les largeurs intermédiaires (`_800`, `_1000`, `_1200`) répondent
**403** : ce sont trois variantes fixes, pas un redimensionneur.

**418 des 421 nouvelles fiches** en ont une, dont 282 en `_eflyer`. Le format tombe
juste : une affiche est portrait, c'est exactement le crop 4:5 que `imageThumb()`
demande, là où une photo paysage se fait couper. Passées par
`.research/photos/ingest.py` comme n'importe quel lot, avec `kind: "event"` et le nom
du promoteur en crédit (l'`organizer` du JSON-LD), donc affiché sous l'image.

Résultat sur tout le catalogue : **1 010 photos + 274 affiches IA sur 1 289
événements**, il ne reste que **5 fiches sans visuel**. Un seul rejet, un aplat de
logo écarté par le contrôle de platitude du script, qui a fait exactement son travail.

**Ce que ça pèse** : 415 fichiers, donc 830 avec les vignettes, 97 Mo. La qualité est
déjà celle du script (JPEG 82, WebP 72) ; une affiche est un visuel dense, elle
compresse mal, et 190 Ko pour 1 200 px est le prix normal.

**Limite connue, l'`alt` ne distingue pas encore l'affiche de la photo.**
`imageAlt()` n'a que deux états, « Photo de … » pour `PHOTOS` et « Visuel
d'illustration de … » pour les affiches IA. Une affiche de promoteur tombe dans le
premier et se fait donc annoncer comme une photo. Le distinguer demanderait un
module feuille de plus (sur le modèle de `lib/venue-photos.ts`) et un champ de plus
dans `CardEvent`, ce qui touche la charge utile des composants client : à faire
sciemment, pas en passant.

## Obligation qui vient avec

`skiddle.` est dans `AFFILIATE_HOSTS` (`lib/data.ts`). Chaque lien taggé est
rémunéré, donc porte `rel="sponsored"` : sans ça c'est un lien payant non déclaré,
l'infraction aux règles de Google sur les liens qu'un site dont toute la valeur est
le SEO ne peut pas se permettre. Tout nouveau lot qui apporte une URL Skiddle doit
porter le tag, et le tag suffit, il n'y a rien à déclarer événement par événement.
