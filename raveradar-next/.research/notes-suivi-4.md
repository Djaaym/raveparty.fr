# Lot « suivi 4 » - éditions Sud de l'Europe et été 2027

Relevé du 22 septembre 2026. Sept fiches, toutes à venir.

**Aucune affiche n'est annoncée pour aucune des sept fiches.** `lineups-suivi-4.json`
est donc un tableau vide, et c'est la bonne réponse : les sept éditions sont à huit mois
ou plus, et les pages line-up encore en ligne sont toutes celles de l'édition précédente.
Le gisement du lot est le tarif, six fiches sur sept ont une billetterie ouverte
aujourd'hui.

---

## 396 - Boom Festival (18-25 juillet 2027, Boomland, Idanha-a-Nova)

- **Line-up : rien.** Vérifié sur `boomfestival.org` (pas de section artistes pour 2027) ;
  le festival se présente lui-même comme « not a headliner-centered festival ».
- **Tarif : rien n'est en vente aujourd'hui.** La page officielle
  <https://www.boomfestival.org/tickets/tickets-info> annonce l'ouverture des ventes
  **ambassadeurs et Friendly Price le 6 octobre 2026** et des **ventes en ligne le
  13 octobre 2026 à 9 h** (heure du Portugal continental). Rien n'est donc achetable le
  22 septembre 2026.
- **Le 335 € écrit dans le lot est une dérivation, à relire avant d'ingérer.** Boom ne
  publie **aucun prix total**, seulement une moyenne par jour : « €41.88 a day for Regular
  Price tickets (Second Phase) », « €34.38 per day » en Friendly Price. Le diviseur est
  **8 jours** et il se vérifie sur l'édition précédente : Boom 2025 annonçait 36,25 € par
  jour, et sa page de revente
  (<https://www.boomfestival.org/tickets/ticket-resale>) cite un prix d'origine de
  **290 €**, soit exactement 36,25 x 8. Donc 41,88 x 8 = **335,04 €** pour la
  **seconde phase** 2027.
- **Conséquence : 335 € est un plafond, pas le tarif d'entrée.** La **première phase**
  sera moins chère et son montant n'est pas publié. Trois options défendables, au choix du
  relecteur : écrire 335 en `estimated` (ce que fait le lot, c'est le seul chiffre
  rattachable à une source officielle), laisser le 300 € `estimated` du catalogue, ou
  passer en `price: 0, priceNote: "unknown"` jusqu'au 13 octobre. **À repasser après le
  13 octobre 2026**, la première phase sera alors un vrai tarif lu sur une billetterie.
- Non tranché : le catalogue dit « 16e édition », Wikipédia compte 2025 comme la 17e.
  Aucune page de `boomfestival.org` ne numérote l'édition 2027. Le seul chiffre affiché
  par le festival est « 1997-2027 », les trente ans, que la fiche porte déjà.
- Description écrite à partir de <https://www.boomfestival.org/programme> (aires Dance
  Temple, Alchemy Circle, Sacred Fire, Liminal Village) et de
  <https://www.boomfestival.org/vision/2027-theme> (thème 2027 « Psychedelic
  Renaissance »). Dates confirmées par le JSON-LD de la page d'accueil,
  `2027-07-18` → `2027-07-25`.

## 878 - Glitch Festival (11-14 août 2027, Gianpula Village, Rabat, Malte)

- **Line-up : rien.** Skiddle rend `lineUpYears: []` et le site officiel n'annonce aucun
  nom (<https://www.skiddle.com/festivals/glitch-festival/>).
- **Dates confirmées** : le `<title>` officiel dit « 11-14 August », Skiddle dit
  « Wednesday 11th - Saturday 14th August », et le 11 août 2027 est bien un mercredi.
  Attention, le JSON-LD du site porte encore une vieille description « 12-16 August », qui
  date de 2024 : ne pas la suivre.
- **Tarif : billetterie ouverte, mais le montant n'est lisible nulle part côté serveur.**
  Le bandeau du site dit « 2027 PRE-SALE TICKETS SOLD OUT IN RECORD TIME. TIER 1 TICKETS
  ARE NOW ON SALE! ». La boutique est une iframe **Paylogic**
  (`shop.glitchfestival.com/946425f4d3de42ca9d242992915c6345`), application Angular dont
  l'API (`shopping-api.paylogic.com`) répond **401 sans jeton OAuth** : storefront, events
  et products, tous fermés. Aucun prix dans le HTML servi.
- **Deux chiffres se contredisent, d'où le `estimated` :**
  - <https://gianpulavillage.com/upcoming_events/glitch-festival-2027/>, la page de la
    salle, dit **« Tickets from €150 »** juste à côté d'un texte écrit pour 2027
    (« Early-bird tickets for Glitch Festival 2027, happening between 11-14 August, are
    now on sale »). C'est ce chiffre que retient le lot.
  - La meta description de <https://www.glitchfestival.com/tickets/> dit « Tickets from
    €45 ». Son JSON-LD la date de **2023** (`datePublished 2023-09-27`), elle a toutes les
    chances d'être un reliquat d'une grille de billets à la journée. **Ne pas la prendre
    pour le tarif 2027.**
  - **À re-vérifier dans un navigateur** (l'iframe Paylogic s'affiche très bien), c'est la
    seule façon de lire le vrai prix Tier 1.
- `ticketUrl` laissé sur la page officielle, qui porte l'iframe.
- Description : FAQ officielle (<https://www.glitchfestival.com/faqs/>) pour le format
  (Gianpula Village, ouverture dans les fossés de La Valette, after-hours en club, boat
  parties au départ de Sliema) et l'âge minimum de 17 ans, confirmé par Skiddle
  (`minAge: 17`). **La FAQ décrit l'édition 2026**, le format 2027 n'est pas publié : la
  description reste donc au présent d'habitude et ne promet pas un programme 2027.

## 384 - Sunny Side Festival (13-17 mai 2027, Ta' Qali Craft Village, Attard, Malte)

- **Line-up : rien.** `performer: []` sur la fiche Shotgun, et le site officiel annonce
  une liste d'attente.
- **Tarif : 89 € confirmé, réellement en vente.** JSON-LD de
  <https://shotgun.live/en/festivals/sunny-side-festival-malta-27> :
  « General Entry Weekend Pass | Loyalty Ticket », **89 EUR**, `availability: InStock`,
  `validFrom 2026-05-21`. Le VIP est à 125 €. Le catalogue avait donc déjà le bon chiffre,
  l'entrée du lot ne fait que **retirer le doute** en le rattachant à une source.
- **Dates confirmées** par le même JSON-LD : `2027-05-13T15:00` → `2027-05-17T18:00`,
  soit du jeudi au lundi, et Shotgun décrit « A 5 day festival ».
- **Le site officiel `ssfestivalmalta.com` est inaccessible depuis le conteneur** : pare-feu
  Sucuri, réponse 202 avec redirection vers `/.well-known/sgcaptcha/`, quel que soit
  l'user-agent, et WebFetch rend une page vide. Rien n'a donc pu être lu à la source.
- Description : origine du festival prise sur
  <https://www.attackmagazine.com/news/a-new-festival-sunny-side-is-coming-to-malta-this-may/>
  (première édition en mai 2024, organisée par les promoteurs maltais **Sunny Side Up**,
  à l'Uno Malta et à Tortuga Beach) ; le format 5 jours et les genres (house, techno,
  electro, breakbeat) viennent de la fiche Shotgun, qui est le `source` retenu.
- **Astuce réseau à garder** : `shotgun.live` répond **403 en curl avec un user-agent de
  navigateur et 429 en WebFetch**, mais **passe en curl avec `-A 'ClaudeBot/1.0'`**, comme
  Skiddle. C'est ce qui a débloqué cette fiche et servi de contre-épreuve sur Insane.

## 261 - Electric Castle (14-18 juillet 2027, Chateau Banffy, Bontida)

- **Line-up : rien pour 2027.** L'API officielle du festival
  (`api2.electriccastle.ro/api/rest/egrpeJG5xhCfv3rmRD8r/json.php?type=lineup`) rend 207
  artistes, mais c'est **l'affiche 2026** (The Cure, Twenty One Pilots, Teddy Swims).
  L'édition 2026 s'est tenue du 16 au 19 juillet 2026, elle est passée.
- **Tarif : 320 €, lu sur la boutique, `priceNote: null`.** L'API produits du festival
  (`productsv2?category_id=22`, la catégorie `TICKETS_NEXT` de l'application, sku `ec13-`
  donc 13e édition) donne pour l'édition 2027 : **General Access Pass 320 €**
  (`is_salable: 1`, `is_soldout: 0`), Youth 25 Pass 129 €, VIP Pass 499 €, Camping Pass
  69 €. La page publique est <https://electriccastle.ro/tickets-2027>.
- **Le Super Early Bird à 139 € est mort.** Il a existé
  (<https://cluju.ro/electric-castle-startul-editiei-2027-cat-costa-biletele/>, 139 € GA et
  109 € Youth25, « durée limitée »), il n'est plus dans la boutique. Le sku en vente
  s'appelle `ec13-ga-phase-final`. Ne pas republier le 139.
- **Le Youth 25 Pass à 129 € n'est pas retenu comme tarif d'entrée** : il est réservé aux
  personnes qui auront 25 ans au plus le dernier jour du festival. Même règle que le tarif
  enfant écarté par le collecteur Shotgun, ce n'est pas *cette* entrée-là.
- **Devise : euro, pas leu.** La boutique d'Electric Castle affiche « EUR » et l'article
  roumain parle d'euros. Rien à convertir.
- **Réserve sérieuse sur les dates de la fiche.** Electric Castle **n'a pas annoncé les
  dates exactes de 2027** : le site officiel porte encore le JSON-LD de 2026
  (`2026-07-16` → `2026-07-19`) et son `<title>` indexé par Google dit seulement
  « July 2027, Banffy Castle ». Or le catalogue annonce **14-18 juillet 2027, soit cinq
  jours**, alors que les pass 2027 de la boutique sont libellés **« 4 days »**
  (`pass_type_text`) et que 2026 comme 2025 tenaient sur quatre jours du mercredi ou jeudi
  au dimanche. **À re-vérifier avant de laisser la fiche promettre un cinquième jour.**
- 8 % de frais de réservation s'ajoutent au prix affiché (`has_booking_fee: 1`), non
  répercutés dans le lot, le catalogue stocke partout le prix hors frais de billetterie.
- Description : <https://www.monitorulcj.ro/electric-castle/139150-...> pour les 262 000
  participants et les 200 et quelques concerts de 2026 ; le camping et ses cabanes sont
  dans la boutique officielle (Camping Pass, Wooden Cabin, Blue Chalet…).

## 155 - Nameless Festival (4-6 juin 2027, Area Bione, Lecco)

- **Line-up : rien.** Aucun nom sur <https://www.namelessfestival.it/festival-2027>.
- **Dates confirmées par le site officiel** : « 4-5-6 Giugno 2027, Lecco, LC », et le
  4 juin 2027 est bien un vendredi.
- **Tarif : 119 € confirmé.** La page officielle affiche « General Admission, Super Early
  Birds, 3 Days Festival Pass, €119 » avec un compte à rebours de fin de palier, à côté du
  VIP à 329 € et du Forever Pass (hiver + été) « Starting at €178 ». Le catalogue avait
  déjà 119 sans note, l'entrée du lot le rattache à une source et fournit le lien.
- La billetterie passe par `nameless.ciaotickets.com` (application JS, illisible en curl) ;
  le `ticketUrl` retenu est la page officielle, qui affiche les tarifs et porte le bouton
  d'achat.
- Description : même page, plus la page d'accueil qui annonce **Nameless Winter les 13 et
  14 février 2027 à Barzio**, l'autre moitié du Forever Pass.

## 849 - Neopop Festival (5 août 2027, Forte de Santiago da Barra, Viana do Castelo)

- **Line-up : rien.** La fiche Xceed de l'édition 2027 porte littéralement
  « NEOPOP Festival 2027 + info soon! ». L'affiche visible sur
  `antipopmusicfestival.com` est celle de **2026** (Ben Klock b2b Rødhåd, Nina Kraviz,
  Indira Paganotto…), jouée les 6, 7 et 8 août 2026, donc passée.
- **Tarif : 95 €, lu sur une page qui vend vraiment, `priceNote: null`.** JSON-LD de
  <https://xceed.me/en/porto/event/neopop-festival-2027--241210> : offre « Festival Pass |
  Early Bird », **95 EUR**, `availability: InStock`, `validFrom 2026-08-11`. Le Festival
  Pass PLUS est à 200 €. La fiche n'avait **aucun lien de billetterie**, il est fourni.
  Le même lien est celui que pose le site officiel
  (`antipopmusicfestival.com/tickets/#/es/event/neopop-festival-2027/241210`).
- **Correction de date à faire, elle ne passe pas par ce lot.** La fiche n'a qu'une date de
  début, `2027-08-05`, sans `endDate`, alors que le festival dure **trois jours** :
  - meta description de `neopopfestival.com` (qui redirige sur `antipopmusicfestival.com`,
    `dateModified 2026-08-18`) : « NEOPOP Festival 2027. Fonte de Santiago da Barra.
    5,6,7 August 2027. »
  - API Xceed (`events.xceed.me/v1/events/241210`) : début `2027-08-05 18:00`, fin
    `2027-08-08 09:00`, c'est-à-dire la fermeture au petit matin du dimanche.
  - Le billet vendu est un « Festival Pass » donnant « General access to the Festival
    during the 3 days ».
  → `endDate: "2027-08-07"`. Sans elle, la fiche tombera en « édition terminée » le 6 août
  2027 alors que le festival tournera encore.
- Description : <https://antipopmusicfestival.com/>, page officielle de l'édition des vingt
  ans, rebaptisée ANTIPOP, qui donne les trois scènes de 2026 (Heineken Neo Stage, Neopop
  Anti Stage, Back Stage).

## 151 - Insane Festival (6-8 mai 2027, Plan d'Eau d'Apt)

- **Line-up : rien pour 2027, et le piège est en place.** `insanefestival.com/line-up/`
  affiche une affiche complète de plus de cent noms (Billx, Angerfist, Reinier Zonneveld,
  Petit Biscuit…) **sous les en-têtes « JEU 14 MAI / VEN 15 MAI / SAM 16 MAI »** : ce sont
  les dates de **2026** (le 14 mai 2026 était le jeudi de l'Ascension). La page ne porte pas
  son année. Ne pas la greffer sur la fiche 2027.
- **Dates confirmées** : la boutique officielle s'appelle « INSANE FESTIVAL 2027 - 11TH
  ÉDITION » et la fiche Shotgun donne `2027-05-06T08:00` → `2027-05-09T02:00`, soit du
  jeudi 6 au samedi 8 mai, jeudi de l'Ascension 2027.
- **Tarif : 46,19 €, et le 86,99 € du catalogue était un pass 2 jours.** Relevé complet sur
  <https://www.billetweb.fr/shop.php?event=insane-festival-2027-11th-dition> :
  - PASS JEUDI / VENDREDI / SAMEDI, palier **SUPER EARLY : 46,19 €** (disponibles)
  - mêmes journées en EARLY 51,29 €, en NORMAL 56,39 €
  - 2 jours sans bivouac SUPER EARLY 86,99 €, 3 jours sans bivouac SUPER EARLY 122,69 €
  - 3 jours + bivouac EARLY 132,89 €, NORMAL 143,09 €
  - PASS CONFIANCE 3J + bivouac à 102,29 € : **épuisé**, à ne pas retenir.
  Le tarif d'entrée le plus bas réellement vendu est donc le pass d'une journée à
  **46,19 €**, frais billetweb compris.
- **Contre-épreuve Shotgun** : mêmes paliers, « SUPER EARLY JEUDI » à **47,25 €**
  (`InStock`), légèrement plus cher que chez l'organisateur. Le lot garde le prix billetweb,
  qui est la billetterie officielle et la moins chère.
- Non tranché : **l'âge minimum**. La billetterie 2027 écrit « Billets interdits aux
  mineur·es » sur chaque tarif, donc 18 ans ; un résultat de recherche secondaire
  (agendaculturel / routedesfestivals) annonce « à partir de 16 ans accompagné d'un
  adulte ». La description suit la billetterie, qui est la source de première main et la
  plus récente.
- `insane-festival.com` ne résout pas depuis le conteneur ; le domaine vivant est
  `insanefestival.com`.

---

## Sources qui ont marché depuis le conteneur, pour la prochaine fois

- **`shotgun.live` avec `curl -A 'ClaudeBot/1.0'`** : passe, et rend un JSON-LD `MusicEvent`
  complet avec le tableau `offers` (nom du tarif, prix, devise, `availability`). 403 avec un
  user-agent de navigateur, 429 en WebFetch. C'est exactement le régime de Skiddle décrit
  dans `.research/skiddle.md`.
- **API produits d'Electric Castle** : `https://api2.electriccastle.ro/api/rest/productsv2?category_id=22`
  (22 = édition à venir, 21 = édition en cours). Rend prix, `is_salable` et `is_soldout`.
  `?type=lineup` sur le même hôte rend l'affiche publiée.
- **API Xceed** : `https://events.xceed.me/v1/events/{id}` rend l'événement (dates réelles en
  timestamps), et la page publique `xceed.me/en/{ville}/event/{slug}--{id}` porte le JSON-LD
  avec les offres et leur prix. L'identifiant se lit dans le lien de la boutique du site du
  festival.
- **billetweb en curl** : la page `shop.php?event=...` rend tous les paliers en clair, avec
  les épuisés.
- **Bloqués** : `ssfestivalmalta.com` (Sucuri), `ticketswap.com` (403), `dice.fm` et son API
  (Cloudflare), `musicfestivalwizard.com` (403), `frontstagefestivals.com` (DNS),
  `insane-festival.com` (DNS), l'API Paylogic de Glitch (401, OAuth).
