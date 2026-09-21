# Le fanion « ça m'intéresse » et le rappel J-7

> Un clic sur un drapeau, sur n'importe quelle carte d'événement du site. Il se
> souvient, il se compte, et il propose un rappel une semaine avant avec la fiche, la
> billetterie et une recherche d'hôtels déjà datée autour de la salle.

Trois choses que le site ne savait pas faire, et qu'il fallait faire ensemble.

Le cœur des cartes ne parlait qu'au navigateur : il rangeait la date dans un tableau de
`localStorage` que personne, nous compris, ne lisait jamais. Le site pouvait donc dire
combien de gens avaient **vu** un événement (`/suivi`) et pas un seul ne disait combien
en **voulaient**. C'est pourtant la seule mesure qui serve à décider : quoi mettre en
avant, quelle billetterie confirmer en priorité, quelle date mérite un visuel soigné.

Et il manquait la contrepartie. Quelqu'un qui marque une date six mois à l'avance ne
reviendra pas la chercher tout seul la semaine d'avant : le fanion promet donc un rappel,
et ce rappel arrive au moment exact où l'affiliation hôtel vaut le plus.

## Ce qui se passe à un clic

1. **Localement, tout de suite.** L'état est écrit en `localStorage` et le bouton change
   avant toute requête. Un bouton qui attendrait le réseau donnerait l'impression de ne
   pas marcher sur une connexion de festival.
2. **Au serveur, sans bloquer.** `POST /api/interest` écrit une ligne dans le hachage de
   l'événement. Rien dans l'affichage n'attend cette réponse ; elle sert à corriger le
   compteur si besoin.
3. **Le rappel, seulement si une adresse est connue.** Un compte connecté n'a rien à
   saisir. Un visiteur anonyme voit un petit panneau, **une seule fois** tant qu'aucune
   adresse n'est connue de ce navigateur, et le fanion est déjà posé quand il s'ouvre :
   le fermer ne le retire pas.

### Pourquoi l'adresse n'est pas exigée

C'est le choix central de la fonctionnalité. Exiger l'adresse pour un clic d'intérêt
échangerait la **mesure**, que tout le monde donne, contre l'**inscription**, que peu
donnent, et on n'aurait plus ni l'une ni l'autre. Un fanion sans adresse vaut par
lui-même : il compte, et c'est déjà ce qu'on cherchait.

## Comment on compte sans pister personne

Chaque navigateur porte un identifiant aléatoire en `localStorage`
(`raveradar:vid`), la forme que `components/Tracker.tsx` emploie déjà et que la CNIL
exempte de consentement : pas un cookie, pas d'adresse IP conservée, rien qui remonte à
une personne. Compter les requêtes au lieu des visiteurs donnerait un chiffre que le
premier rechargement de page fait doubler, c'est-à-dire un chiffre faux dans la seule
direction qui nous arrange, et c'est la donnée inventée que la règle de contenu interdit,
appliquée à une mesure au lieu d'une fiche.

Une personne qui pose le fanion sans compte puis se connecte laisse deux lignes, donc
deux intéressés pour une personne. Le cas existe, il est rare, et le corriger demanderait
de relier un identifiant anonyme à une adresse : c'est exactement le traçage que la forme
actuelle évite. On préfère un chiffre légèrement haut à une donnée personnelle de plus.

## Le magasin

Deux structures dans Redis (`lib/interest-store.ts`), et la seconde n'est pas une
commodité.

- `rr:int:{id}`, un **hachage par événement**, une ligne par personne. La clé est
  `m:{adresse}` ou `a:{identifiant}`, préfixée par sa nature : sans le préfixe, on ne
  saurait plus lire le magasin. C'est lui qui dédoublonne, et c'est lui que le rappel
  lit.
- `rr:int:n`, un **hachage global** id → compte. Redondant, et c'est le but : `/admin`
  classe 2 300 événements, un `HLEN` par événement coûterait 2 300 allers-retours, un
  `HGETALL` en coûte un. **Il est réécrit depuis le `HLEN` vrai à chaque écriture, jamais
  incrémenté** : un compteur qu'on incrémente dérive au premier échec partiel, et un
  compteur faux sur une page publique est pire que pas de compteur.

**Pas de TTL.** Il serait tentant de faire expirer les lignes après la date, mais ce
qu'on cherche à savoir, c'est justement à quel point l'événement était recherché :
effacer la mesure le lendemain reviendrait à jeter la seule donnée que la fonctionnalité
produit. L'élagage d'un id que le catalogue ne porte plus est un geste d'entretien,
depuis `/admin`, comme pour les maps `IMAGES` / `PHOTOS` / `TICKETS`.

## Où le chiffre s'affiche

**Partout où il y a un fanion**, donc sur chaque carte de chaque grille comme sur la
fiche : la home, `/explore`, `/map`, les pages ville, genre, lieu, artiste, pays et
organisateur.

**Une seule lecture par page, et aucune requête navigateur.** La table est lue **au rendu
du layout racine** (`countsForPages()`) et distribuée par contexte React
(`components/InterestCounts.tsx`). La lecture est mise en cache par tag (`countsAll()`),
donc un build de vingt et un mille pages fait **un seul** aller-retour Redis, exactement
le motif d'`allEdits()`.

C'est ce qui rend l'affichage possible partout. Un appel par carte aurait fait des
dizaines de requêtes sur la page d'accueil ; passer le chiffre en prop aurait voulu dire
le faire traverser `cardEvent()` et une vingtaine de pages, et n'aurait de toute façon
pas marché pour `/explore` et `/map`, qui rendent leurs cartes côté client.

**Le fournisseur est un vrai composant, jamais `Ctx.Provider` ré-exporté.** Un layout est
un composant serveur : ce qu'il importe d'un module `"use client"` traverse la frontière
sous forme de référence client, et un objet `Context.Provider` n'en est pas une. React
reçoit alors une promesse au lieu d'un composant et l'hydratation meurt sur « Element type
is invalid », **après** avoir rendu un HTML parfaitement correct. La page arrive complète
puis se vide : `curl` la voit juste, et seul un navigateur poussé jusqu'à l'hydratation
l'attrape. Défaut payé ici.

**Un compteur à zéro n'affiche rien**, pas un « 0 ». Une pastille à zéro sur toutes les
cartes d'une grille n'informe personne, elle annonce juste que personne ne veut y aller :
c'est la pilule de ville qui promet une date inexistante, prise par l'autre bout.
Corollaire à connaître : **au premier déploiement, aucun chiffre n'apparaît**, et c'est
normal, la table est vide tant que personne n'a cliqué.

**La table est bornée** (`CAP`, 1 500 lignes). Elle voyage dans la charge utile de chaque
page et ne porte que les événements ayant au moins un fanion, donc elle est vide au départ
et grandit avec l'usage réel. Sans borne, le jour où tout le catalogue serait marqué, on
ajouterait une vingtaine de kilo-octets à la page dont le LCP compte le plus. Les plus
petits compteurs sont coupés en premier, ce sont ceux qui apportent le moins.

**Le cache n'est pas invalidé à chaque clic**, contrairement à une correction de fiche.
Invalider ferait régénérer une page statique pour faire passer un nombre de 11 à 12. Les
cinq minutes de `revalidate` suffisent, et la fenêtre réelle est de toute façon celle du
`revalidate = 3600` des layouts. Le compteur de la carte qu'on vient de cliquer, lui,
bouge tout de suite : la route renvoie le compte exact avec sa réponse.

## Le rappel J-7

`app/api/interest/remind/route.ts`, appelé une fois par jour par la tâche déclarée dans
`vercel.json` (9 h UTC).

- **La fenêtre est un jour exact**, `aujourd'hui + 7`, et pas « à moins de sept jours ».
  Le cron passe tous les matins : une condition « à moins de » renverrait le message
  chaque jour jusqu'à l'événement.
- **Le drapeau `sent` ferme la porte restante**, celle d'une exécution relancée à la main
  ou d'un cron déclenché deux fois. Les deux gardes sont nécessaires : la fenêtre évite
  l'envoi répété, le drapeau évite l'envoi double.
- **Le jour de référence est fixé une fois** et passé à tout ce qui en dépend, jusqu'à
  `hotelStay()` qui date la recherche d'hôtels. Même raison que les trois portes de mise
  en avant de `lib/data.ts` : deux appels à `todayISO()` dans la même exécution peuvent
  tomber de part et d'autre de minuit.
- **Le premier jour, pas le dernier.** Le rappel prépare une arrivée. Un festival de huit
  jours n'a pas à être annoncé sept jours avant sa clôture, il serait déjà en cours.
- **Une ligne qui échoue n'arrête pas les autres** et n'est pas marquée envoyée, donc la
  prochaine exécution la reprend tant que la fenêtre du jour tient.

### Ce que le mail contient

La fiche (date, salle, ville, horaire, tarif), la billetterie, et la recherche d'hôtels
datée et centrée sur la salle que `hotelStay()` construit déjà pour la page. Rien
d'autre : à J-7 la question du lecteur n'est plus « est-ce que j'y vais » mais « qu'est-ce
qu'il me reste à faire », c'est-à-dire le billet et le lit.

Trois règles du dépôt s'y appliquent telles quelles :

- **Rien d'inventé.** Pas de nom d'hôtel, pas de prix d'hôtel, pas de « il reste peu de
  places ». Un mail est le pire endroit où publier un chiffre périmé, il n'a pas de
  `revalidate`.
- **La mention d'affiliation est dans le corps du message**, pas en pied de page en
  petit. Le lecteur doit le savoir avant de cliquer, même exigence que dans la carte de
  la fiche.
- **Pas de tiret cadratin.** C'est du contenu publié comme le reste.

Le lien porte `utm_source=rappel`, sinon la fonctionnalité n'aurait aucune ligne à elle
sur `/suivi` : c'est le défaut que `trackGoal()` corrige déjà pour la newsletter.

Les trois transports du site (SMTP, Resend, Brevo) acceptent une partie HTML ; elle part
**en plus** du texte et jamais à sa place. Un message qui n'a qu'une partie HTML se note
mal chez les filtres, et la version texte est ce que lisent les clients en mode texte et
les lecteurs d'écran.

La mise en page ne vit pas ici : le rappel décrit ses blocs et `lib/mail-template.ts` en
rend les deux versions, comme les messages du circuit promoteur (**`docs/mails.md`**). Il
avait son propre HTML au départ, donc sa propre en-tête et son propre pied de page : un
lecteur qui recevait un rappel puis une validation voyait deux expéditeurs différents.
`npm run mail:preview j7` le rend sur un vrai événement du catalogue, sans rien envoyer.

## Mise en route

| Variable | Rôle | Sans elle |
| --- | --- | --- |
| `INTEREST_KV_REST_API_URL` / `_TOKEN` | le magasin. Retombe sur `KV_REST_API_*` / `UPSTASH_REDIS_REST_*`, un seul Redis suffit pour tout le site | `/api/interest` répond 501 en production, le fanion reste local |
| `CRON_SECRET` | la porte du rappel. Vercel la pose en `Authorization: Bearer` sur les tâches de `vercel.json` | **la route reste fermée (501)** |
| un transport mail | `SMTP_*`, `RESEND_API_KEY` ou `BREVO_API_KEY`, déjà en place pour les comptes promoteurs | le rappel répond 501 |

Vérifier sans rien envoyer :

```bash
curl -s "https://www.raveparty.fr/api/interest/remind?dry=1&key=$CRON_SECRET" | jq
```

Il rend le jour visé, le nombre d'événements dans la fenêtre et ce qui partirait, sans
écrire ni expédier. Le secret est exigé pour ça aussi : la liste des adresses intéressées
n'est pas publique.

## Choix à ne pas défaire

- **Le fanion ne demande jamais l'adresse avant de compter.** Voir plus haut : on
  perdrait les deux.
- **Le panneau ne se rouvre pas** une fois une adresse connue de ce navigateur. Un
  formulaire qui revient à chaque clic est un formulaire qu'on apprend à fermer sans
  lire.
- **Le compteur ne se lit qu'au rendu, jamais par une requête du navigateur.** Une grille
  en rend jusqu'à vingt-quatre.
- **Le compteur global se réécrit, il ne s'incrémente pas.**
- **Zéro ne s'affiche pas.**
- **La route de rappel reste fermée sans `CRON_SECRET`.** Pas de repli permissif : il
  s'oublierait.
