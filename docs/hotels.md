# Affiliation hôtel - le bloc « où dormir »

Deuxième source de revenus du site, à côté de l'affiliation billetterie (Impact /
Ticketmaster). Chaque fiche d'événement **à venir** porte, sous la carte du lieu, un
bloc qui ouvre une recherche d'hôtels **sur la ville de l'événement, aux dates de
l'événement**, chez un partenaire qui nous verse une commission.

Rien ne s'affiche tant qu'aucun partenaire n'est configuré : c'est la même règle que
les alertes sans fournisseur. Un lien sortant vers un moteur de réservation qui ne
rapporte rien coûte du jus de lien pour zéro revenu.

---

## 1. Mise en route (15 minutes)

### a. Ouvrir un compte partenaire

**Booking.com ne se vend plus en direct.** Sa page de programme
(<https://www.booking.com/affiliate-program/v2/index.html>) ne propose plus de
formulaire à elle : elle dit « Inscrivez-vous via nos réseaux affiliés officiels »
puis « Sélectionnez votre région et complétez votre inscription **avec CJ** », et son
seul lien sortant est <https://www.cj.com/en-gb/publisher/partners/booking.com>. Il
n'y a donc pas d'`aid` à demander, c'est CJ qui l'injecte à la redirection.

1. Créer un compte éditeur sur **CJ Affiliate** (<https://www.cj.com>), puis
   candidater au programme Booking.com par le lien ci-dessus, en choisissant sa région
   de trafic principale. Commission annoncée par CJ : **4 %** sur un séjour effectué.
2. Une fois accepté, générer un **lien profond**, pas une bannière. Dans CJ Account
   Manager : onglet **Links → Link Tools**, le *Deep Link Generator* (aussi disponible
   en extension Chrome). On lui donne une URL de destination sur `booking.com`, il rend
   un lien de clic.
3. Relever la partie **avant le `?`**, de la forme
   `https://www.tkqlhce.com/click-{site}-{annonce}`. C'est elle qui va dans la
   variable ; le code ajoute la destination et le `sid`.

**Une bannière ne convient pas, et c'est le piège coûteux.** Un lien d'index
(`utm_medium=bannerindex`) accepte le `sid` mais **ignore `url=`** : le lecteur
atterrit sur la page d'accueil de Booking. Voir § 4 bis pour le relevé complet.

### b. Poser la variable

Dans Vercel → Settings → Environment Variables, puis redéployer :

```
HOTEL_CJ_CLICK=https://www.dpbolvw.net/click-101873318-15734352
```

C'est tout. `HOTEL_PARTNER` se déduit (`cj` dès qu'un lien de clic est présent) et
`HOTEL_BRAND` vaut « Booking.com ».

Pas de préfixe `NEXT_PUBLIC_` : le lien est construit dans un composant serveur, au
build. Ne jamais lire ces constantes depuis un composant client, elles y vaudraient la
chaîne vide.

`HOTEL_AID` reste accepté (mode `booking`, lien direct sans réseau) pour un `aid`
historique déjà obtenu, mais il ne s'en délivre plus.

### c. Vérifier

```
cd raveradar-next && HOTEL_CJ_CLICK=https://www.dpbolvw.net/click-101873318-15734352 npm run build
```

puis ouvrir n'importe quelle fiche à venir : le bloc « Se loger » apparaît sous la
carte du lieu, le lien porte `rel="sponsored nofollow noopener noreferrer"`, et son
`url=` encapsule une recherche qui contient `latitude=`, `longitude=`,
`order=distance_from_search`, `checkin=` et `checkout=`, avec `sid=rp-fr-ev{id}`.

**Puis cliquer pour de vrai** : c'est la seule façon de voir si le deep-link est bien
activé. L'URL finale doit être une `searchresults.html` datée, pas `booking.com/`.

---

## 2. Le mode `template`, pour tout autre réseau

On ne devine jamais le format d'URL d'un réseau qu'on n'a pas sous les yeux. Le
gabarit reçu du partenaire se colle tel quel, avec des marqueurs que le code
remplace (valeurs déjà encodées pour l'URL) :

```
HOTEL_PARTNER=template
HOTEL_BRAND=Stay22
HOTEL_URL_TEMPLATE=https://www.exemple.com/search?partner=42&city={city}&in={checkin}&out={checkout}&campaign={label}
```

| Marqueur     | Valeur                                          |
| ------------ | ----------------------------------------------- |
| `{city}`     | ville de l'événement                            |
| `{country}`  | pays, libellé brut du catalogue (anglais)       |
| `{checkin}`  | premier jour, `yyyy-mm-dd`                      |
| `{checkout}` | lendemain du dernier jour, `yyyy-mm-dd`         |
| `{nights}`   | nombre de nuits                                 |
| `{lat}`      | latitude de la salle                            |
| `{lng}`      | longitude de la salle                           |
| `{lang}`     | `fr` ou `en`                                    |
| `{label}`    | étiquette de reporting, `rp-{lang}-ev{id}`      |

Un marqueur inconnu est laissé tel quel plutôt que remplacé par du vide : une URL
visiblement cassée se remarque, une URL silencieusement amputée non.

---

## 3. Ce que le bloc fait, et ce qu'il ne fait **pas**

**Il ne liste aucun hôtel et n'en recommande aucun.** Publier « nos hôtels
recommandés » supposerait des noms, des prix et des distances qu'on n'a pas vérifiés,
exactement la donnée inventée que la règle de contenu interdit. Un prix d'hôtel bouge
de toute façon tous les jours : la recherche du partenaire est juste au moment du
clic, une liste figée serait fausse la semaine suivante. Le jour où on voudra
vraiment recommander, il faudra une source, comme pour tout le reste du catalogue.

**La recherche est centrée sur la salle, pas sur la ville.** Le lien passe
`latitude` / `longitude` (les coordonnées de la salle, que les 2 053 fiches portent
déjà) et `order=distance_from_search`, donc Booking ouvre sur le lieu de l'événement
et classe les hôtels par distance. `ss=« Ville, Pays »` reste, comme ancre que
l'autocomplétion résout à coup sûr et comme repli. Ça se voit dès que la salle n'est
pas au centre : le Klokgebouw est à 3 km du centre d'Eindhoven, un Festivalpark est à
la campagne, et quelqu'un qui sort d'un club à 6 h veut dormir à côté du club.

Vérifié : la redirection canonique de Booking jette `ss`, `checkin` et `order` mais
**garde** `latitude` et `longitude` (`searchresults.fr.html?latitude=…;longitude=…`),
ce sont bien des dimensions de recherche de premier ordre.

**Aucun filtre de rayon**, et c'est délibéré. `nflt=distance=3000` est reconnu, ce qui
est exactement le danger : un festival dans un champ n'a rien à 3 km, et une page de
résultats vide est pire qu'une liste trop large. Trier ne peut pas vider la page,
filtrer si.

**La carte annonce ce que le lien fait vraiment.** `hotelStay()` renvoie `near`, la
salle quand elle est citable, la ville sinon, et le bloc bascule entre les libellés
`hotel.*venue` et `hotel.*`. Quatre libellés ne sont pas citables, tous constatés dans
le catalogue : un ensemble de lieux (« Divers lieux, Rennes », `isMultiVenueLabel()`),
un nom recopié sur la ville (« Bordeaux, France »), un lieu qui n'en est pas un
(« TBA », « Secret Location Notts », dont on ne peut par définition pas être proche),
et une fiche Google Maps entière rendue par le champ libre de Shotgun (« Glass Club
Cannes, House music Bar à cocktails Festive & Club, Night Club, Boîte de Nuit, »,
89 caractères). Le **lien** reste centré sur les coordonnées dans les quatre cas :
c'est l'annonce qui s'ajuste, jamais la recherche.

Le découpage se relit sur la page construite, jamais dans le gabarit, et c'est ce qui
a rattrapé « Où dormir près de **109** » : couper systématiquement sur le tiret
détaché décapitait « 109 - l'Embarcadère », un nom entier, alors qu'il fallait bien
couper « Yaya Lille - Restaurant méditerranéen avec terrasse par Juan Arbelaez ». Rien
ne les distingue sinon la longueur, donc le tiret ne se coupe qu'en dernier recours.
Relevé sur les 2 053 fiches : 1 998 annoncées par leur salle, 55 repliées sur la
ville.

**Les dates viennent du catalogue.** Arrivée le premier jour, départ le lendemain du
dernier. Une soirée de club qui finit à l'aube, c'est bien une nuit d'hôtel ; un
festival de trois jours en réserve trois.

**Ça compte, et c'est délibéré côté Booking** : leur attribution est *à la session*,
sans cookie. Le lecteur doit pouvoir réserver dans la foulée du clic, donc le lien
arrive sur une recherche déjà datée et déjà localisée, pas sur la page d'accueil du
partenaire.

**Jamais sur une édition terminée.** Proposer un hôtel pour une nuit passée n'a aucun
sens, même règle que les blocs de mise en avant (`featured()`, `nextUp()`).

**Jamais dans le JSON-LD.** Le bloc est commercial, il ne décrit pas l'événement : il
n'a rien à faire dans les données structurées lues par Google.

---

## 4. Les trois points non négociables du lien

1. **`rel="sponsored"`.** C'est un lien rémunéré. Un lien rémunéré non déclaré est une
   infraction aux règles de Google sur les liens, ce qu'un site dont toute la valeur
   est le SEO ne peut pas se permettre. Même raison que `ticketRel()` dans
   `lib/data.ts`.
2. **La mention d'affiliation est visible**, dans le bloc, pas en pied de page. Le
   lecteur doit savoir **avant** de cliquer que la réservation nous rapporte, et que
   ça ne change pas son prix.
3. **`data-goal="hotel"`.** Le clic devient un objectif compté sur `/suivi`, à côté de
   « billetterie ». Sans ça, la deuxième source de revenus du site n'aurait aucune
   ligne à elle et se perdrait au milieu des clics sortants.

---

## 4 bis. Pourquoi un lien profond, et pas la bannière

Booking passe par CJ, mais tous les liens CJ ne se valent pas. Le premier lien essayé
ici était une bannière, et elle ne sait pas emmener le lecteur sur une recherche. Le
relevé, pour ne pas refaire le test :

| Essai sur le lien CJ                         | Résultat                                                  |
| -------------------------------------------- | --------------------------------------------------------- |
| `?sid=rp-fr-ev777`                            | ✅ arrive en `_clkid-rp-fr-ev777`, attribution intacte      |
| `&url=<recherche Booking encodée>`            | ❌ **ignoré**, on atterrit sur `booking.com/`               |
| `click-{site}-{ad}?url=…` (forme non encodée) | ✅ bonne attribution, ❌ destination toujours jetée          |

Le lien essayé était une **bannière** (`utm_medium=bannerindex`, `utm_campaign=es`) :
`url=` y est inerte, elle ne sait aller que sur la page d'accueil. Or c'est précisément
ce que ce bloc existe pour éviter, l'attribution Booking étant **à la session** : le
lecteur doit pouvoir réserver dans la foulée du clic, et une home vide lui demande de
refaire la recherche que la fiche connaissait déjà.

**Toutes les annonces d'un même annonceur ne se valent pas, et c'est là qu'était la
réponse.** Les bannières logo ignorent `url=` ; une annonce dont la fiche CJ montre un
champ **« URL de destination » modifiable** l'honore. Ce champ est le signe qui ne
trompe pas, et il se lit d'un coup d'œil sur la fiche : absent, l'annonce ne sait aller
qu'à un seul endroit. Mesuré côte à côte avec la même destination, l'annonce 14398623
(*logo BLUE*, une bannière, pas de champ) rend `booking.com/?` quand 17322580 rend
`booking.com/searchresults.html?`.

**Prendre un lien Evergreen.** C'est le lien de tracking générique de CJ, prévu pour le
deep-link : son image est un pixel 1x1 et non une création, donc il ne range pas les
revenus sous une bannière sans rapport. Celui en service est
`click-101873318-15734352` (*Evergreen Link for Booking.com ES*), vérifié de bout en
bout : la recherche passée en `url=` arrive intacte, avec `aid=818286` et
`label=affnetcj-15734352_pub-8058263_site-101873318_pname-Raveparty_clkid-{sid}_cjevent-…`.
N'importe quelle annonce à champ de destination fonctionnerait (l'annonce *Taxi
Homepage* 17322580 aussi, vérifiée), mais son numéro ressort en `utm_term` dans les
rapports CJ, donc autant qu'il désigne quelque chose de juste.

Pour en trouver une : **Campagnes → Liens et produits**, puis la case
**« Liens profonds uniquement »** dans la colonne de filtres à gauche. Les 89 créations
de l'annonceur se réduisent alors à celles qui acceptent une destination. On ne se sert
ni de l'image ni du champ « URL de destination » : seul compte l'identifiant de
l'annonce, que le code place dans `HOTEL_CJ_CLICK`.

Le *Deep Link Generator* (le bookmarklet, § 1a) répond, lui, « No active relationship
with this advertiser » tant qu'on n'est pas inscrit chez l'annonceur qui **détient le
domaine** `www.booking.com`, qui n'est pas forcément celui dont on utilise les liens.
Ce message ne dit donc pas que le deep-link est fermé, et ne pas le croire sur ce
point-là a coûté un aller-retour.

Trois détails à ne pas réapprendre.

**Les identifiants se lisent dans le `label` de l'URL finale** (`pub-…_site-…_pname-…`),
c'est la seule façon de vérifier qu'un lien construit à la main attribue au bon compte.
Le premier nombre de `click-{n}-{n}` est le **site** (ici 101873318, 9 chiffres), pas le
publisher (8058263, 7 chiffres) : les intervertir a donné `pub-4733886_site-8058263`,
c'est-à-dire un autre compte. La documentation qui parle d'un « PID à 7 chiffres »
décrit d'anciennes propriétés, elle ne vaut pas règle.

**`cjevent` est engendré au clic** par la chaîne de redirection. On ne peut donc pas
court-circuiter CJ en recopiant dans une URL construite à la main un `label` déjà vu :
il faut passer par le lien de clic, à chaque fois.

**La chaîne se lit au `curl -D -`**, pas au navigateur (qui n'a pas de réseau dans le
conteneur). Booking répond 301 puis 202 à un client automatisé, et sa redirection
canonique jette la plupart des paramètres : ce n'est pas un oracle de ce qu'il honore,
c'est une normalisation anti-robot.

## 5. Où c'est écrit

| Fichier                      | Rôle                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `lib/site.ts`                | `HOTEL_CJ_CLICK`, `HOTEL_AID`, `HOTEL_PARTNER`, `HOTEL_BRAND`, `HOTEL_URL_TEMPLATE` |
| `lib/hotels.ts`              | construction de l'URL (module feuille, sans le catalogue) |
| `components/HotelsCard.tsx`  | le bloc rendu sous la carte du lieu                       |
| `components/EventDetail.tsx` | le point de montage, sur les seules éditions à venir      |
| `lib/i18n.ts`                | les clés `hotel.*`, FR et EN                              |
| `app/globals.css`            | `.hotel-card` et suivantes                                |
| `scripts/check-hotels.mjs`   | `npm run check:hotels`, le garde-fou des coordonnées      |

---

## 6. Suites possibles

- **Reprendre les 12 coordonnées à une décimale** que `npm run check:hotels` signale :
  ~11 km, donc elles désignent l'agglomération et pas la salle, et le classement par
  distance ne veut alors rien dire. Aucune n'est dans les cent prochaines dates.
- **Les pages ville** (`/rave-party/{lieu}`) et **pays** peuvent porter le même bloc,
  sans dates cette fois (il faudrait alors prendre celles de la prochaine soirée
  listée, sinon la recherche s'ouvre sur aujourd'hui et ne sert à rien).
- **Le transport** (train, bus, vol) répond à la même intention et se brancherait de
  la même façon, mais avec un gabarit par pays, et c'est autrement plus casse-gueule
  qu'une nuit d'hôtel.
- **Négocier un taux** : Booking part à 4 % via un agrégateur et monte avec le volume.
  Ça ne se demande qu'avec des chiffres, donc après quelques mois de `/suivi`.
