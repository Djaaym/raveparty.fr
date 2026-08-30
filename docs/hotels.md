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

## 5. Où c'est écrit

| Fichier                      | Rôle                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `lib/site.ts`                | les quatre variables d'environnement                      |
| `lib/hotels.ts`              | construction de l'URL (module feuille, sans le catalogue) |
| `components/HotelsCard.tsx`  | le bloc rendu sous la carte du lieu                       |
| `components/EventDetail.tsx` | le point de montage, sur les seules éditions à venir      |
| `lib/i18n.ts`                | les clés `hotel.*`, FR et EN                              |
| `app/globals.css`            | `.hotel-card` et suivantes                                |

---

## 6. Suites possibles

- **Les pages ville** (`/rave-party/{lieu}`) et **pays** peuvent porter le même bloc,
  sans dates cette fois (il faudrait alors prendre celles de la prochaine soirée
  listée, sinon la recherche s'ouvre sur aujourd'hui et ne sert à rien).
- **Le transport** (train, bus, vol) répond à la même intention et se brancherait de
  la même façon, mais avec un gabarit par pays, et c'est autrement plus casse-gueule
  qu'une nuit d'hôtel.
- **Négocier un taux** : Booking part à 4 % via un agrégateur et monte avec le volume.
  Ça ne se demande qu'avec des chiffres, donc après quelques mois de `/suivi`.
