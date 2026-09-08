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

Le programme par défaut est **Booking.com**, parce que c'est le seul qui couvre
correctement les 38 pays du catalogue, Balkans et pays baltes compris.

1. Inscription sur <https://www.booking.com/affiliate-program/v2/index.html>
   (gratuit, validation manuelle, prévoir quelques jours).
2. Relever l'**AID**, l'identifiant numérique du compte, présent dans tous les liens
   qu'ils fournissent (`aid=1234567`).

Alternative si Booking traîne à valider : passer par un agrégateur
(**Travelpayouts**, qui redistribue le programme Booking, ou **Stay22**, conçu pour
les sites d'événements). Ils fournissent un gabarit d'URL, voir le mode `template`
plus bas.

### b. Poser la variable

Dans Vercel → Settings → Environment Variables, puis redéployer :

```
HOTEL_AID=1234567
```

C'est tout. `HOTEL_PARTNER` se déduit (`booking` dès qu'un AID est présent) et
`HOTEL_BRAND` vaut « Booking.com ».

Pas de préfixe `NEXT_PUBLIC_` : le lien est construit dans un composant serveur, au
build. Ne jamais lire ces constantes depuis un composant client, elles y vaudraient
la chaîne vide.

### c. Vérifier

```
cd raveradar-next && HOTEL_AID=1234567 npm run build
```

puis ouvrir n'importe quelle fiche à venir : le bloc « Se loger » apparaît sous la
carte du lieu, le lien porte `rel="sponsored noopener noreferrer"` et l'URL contient
`aid=`, `checkin=`, `checkout=` et `label=rp-fr-ev{id}`.

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

## 4 bis. Booking direct, et pourquoi pas un lien CJ

Booking.com se revend aussi par des réseaux (CJ Affiliate, Awin…). Un lien CJ a été
testé ici, et il ne convient pas. Le relevé, pour ne pas refaire le test :

| Essai sur le lien CJ                         | Résultat                                                  |
| -------------------------------------------- | --------------------------------------------------------- |
| `?sid=rp-fr-ev777`                            | ✅ arrive en `_clkid-rp-fr-ev777`, attribution intacte      |
| `&url=<recherche Booking encodée>`            | ❌ **ignoré**, on atterrit sur `booking.com/`               |
| `click-{site}-{ad}?url=…` (forme non encodée) | ✅ bonne attribution, ❌ destination toujours jetée          |

Le lien fourni était un lien **bannière** (`utm_medium=bannerindex`) : le deep-link
n'est pas activé dessus, donc il ne sait aller que sur la page d'accueil. Or c'est
précisément ce que ce bloc existe pour éviter : Booking attribue **à la session**, le
lecteur doit pouvoir réserver dans la foulée du clic, et une home vide lui demande de
refaire la recherche que la fiche connaissait déjà. Un compte Booking direct donne un
simple `aid=` et laisse construire n'importe quelle URL de recherche, ce qui est la
seule forme qui serve à quelque chose ici.

Deux détails à ne pas réapprendre. Les identifiants CJ d'un lien encodé se lisent dans
le `label` de l'URL finale (`pub-…_site-…_pname-…`) : le premier nombre de
`click-{n}-{n}` est le **site**, pas le publisher, et se tromper d'ordre attribue les
clics à un autre compte (constaté : `pub-4733886_site-8058263` au lieu de
`pub-8058263_site-101873318_pname-Raveparty`). Et la redirection de Booking répond 301
puis 202 depuis le conteneur : la chaîne se lit au `curl -D -`, pas au navigateur, qui
n'a pas de réseau ici.

## 5. Où c'est écrit

| Fichier                      | Rôle                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `lib/site.ts`                | les quatre variables d'environnement                      |
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
