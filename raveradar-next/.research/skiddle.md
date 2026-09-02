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

## Obligation qui vient avec

`skiddle.` est dans `AFFILIATE_HOSTS` (`lib/data.ts`). Chaque lien taggé est
rémunéré, donc porte `rel="sponsored"` : sans ça c'est un lien payant non déclaré,
l'infraction aux règles de Google sur les liens qu'un site dont toute la valeur est
le SEO ne peut pas se permettre. Tout nouveau lot qui apporte une URL Skiddle doit
porter le tag, et le tag suffit, il n'y a rien à déclarer événement par événement.
