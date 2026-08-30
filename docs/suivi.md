# Suivi d'audience privé - `/suivi`

Tableau de bord maison, accessible au seul propriétaire du site, qui répond à quatre
questions que Google Analytics ne sait pas rendre lisibles :

1. **Combien de clics je reçois, et d'où viennent-ils ?**
2. **Est-ce qu'ils repartent tout de suite ?**
3. **Combien de temps restent-ils, sur quelle page ?**
4. **Sur quoi cliquent-ils, chez moi, et vers l'extérieur ?**

GA4 reste branché (`lib/site.ts`, `G-M1CERK8ERF`). Les deux ne se gênent pas : GA
**compte**, celui-ci **raconte**. GA agrège, échantillonne, masque les petits nombres et
enterre le parcours individuel ; ici les hits bruts sont conservés, donc une visite peut
être rejouée page par page.

---

## 1. Mise en route (10 minutes)

### a. Le mot de passe - obligatoire

```
TRACKING_PASSWORD=un-mot-de-passe-long-et-unique
```

Dans Vercel → Settings → Environment Variables, puis redéployer.

Sans lui, `/suivi` affiche « Suivi non configuré » et `/api/track/stats` répond `501`.
C'est volontaire : la page montre des parcours de visite individuels, ce n'est pas une
page à laisser entrouverte « le temps de configurer ».

Facultatif : `TRACKING_SECRET` découple la clé de signature du cookie du mot de passe.
Par défaut elle en est dérivée, donc **changer le mot de passe déconnecte partout**, ce
qui est le comportement attendu d'un changement de mot de passe.

### b. Le stockage - sans lui, rien n'est conservé

Un hit est append-only, lu par plage de dates, sans valeur après quelques mois : c'est
une **liste Redis**, pas un schéma, d'où le refus d'introduire une vraie base ici.

Le plus simple sur Vercel : **Storage → Create Database → KV**. Vercel injecte alors
`KV_REST_API_URL` et `KV_REST_API_TOKEN` tout seul, il n'y a rien à écrire. L'intégration
Upstash du marketplace fait pareil. Les deux ont une offre gratuite qui couvre largement
le trafic actuel.

N'importe quel Redis parlant le protocole REST Upstash convient. Le code teste trois
paires, dans cet ordre :

| Variables | D'où elles viennent |
|---|---|
| `TRACK_KV_REST_API_URL` + `TRACK_KV_REST_API_TOKEN` | posées à la main, prioritaires |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Upstash direct |

**Sans aucune des trois**, le stockage retombe sur la mémoire du processus. Utile en
`next dev`, inutile en production : chaque lambda a la sienne et elles disparaissent. Le
tableau de bord affiche alors un bandeau qui le dit, il ne présente jamais un tiers du
trafic comme le tout.

### c. Réglages facultatifs

| Variable | Défaut | Effet |
|---|---|---|
| `TRACK_RETENTION_DAYS` | `90` | TTL Redis. La politique de conservation s'applique toute seule, sans cron à écrire. |
| `TRACK_MAX_PER_DAY` | `200000` | Plafond par journée (`LTRIM`), garde-fou contre une boucle ou un bot. |
| `TRACK_MAX_READ` | `300000` | Plafond d'évènements chargés par rapport. |
| `NEXT_PUBLIC_TRACK_RESPECT_DNT` | absent | À `1`, respecte l'en-tête *Do Not Track* (coûte ~5 % du trafic). |

---

## 2. Ce qui est mesuré

`components/Tracker.tsx` est monté dans les deux layouts racines et envoie cinq types de
hit à `/api/track` :

| Hit | Quand | Ce qu'il porte |
|---|---|---|
| `view` | page affichée (navigations SPA comprises) | chemin, largeur d'écran, langue du navigateur ; **sur le premier hit de la visite seulement** : référent + tags UTM |
| `end` | page quittée, onglet masqué, changement de route | temps d'ouverture, **temps réellement à l'écran**, profondeur de scroll |
| `out` | clic vers l'extérieur | URL cible, libellé du lien, zone de la page |
| `in` | clic sur un lien interne | chemin cible, libellé, zone |
| `goal` | clic sur un élément portant `data-goal` | nom de l'objectif |

Le navigateur n'affirme que ce que lui seul peut savoir. **Tout ce qui se déduit de la
requête est rempli côté serveur**, l'horloge, le pays, la ville, l'appareil, le
navigateur, le système, la classification du référent, parce qu'un pays fourni par le
client est un pays falsifiable.

### Points de mesure fins

- **`end` envoie des deltas, pas des totaux.** Un `end` part à chaque fois que l'onglet
  passe en arrière-plan, et un dernier au départ réel. `sessionize()` les additionne sur
  la même étape. Sans ça, le visiteur qui lit vraiment la page, celui qui change
  d'onglet et revient, perdrait la moitié de son temps de lecture.
- **Le temps « à l'écran » ≠ le temps d'ouverture.** L'accumulation s'arrête quand
  `document.visibilityState` passe à `hidden`. Un onglet oublié tout un week-end ne
  gonfle pas la moyenne (et 6 h est de toute façon le plafond dur côté validation).
- **`durée inconnue`** sur une étape signifie que le signal de fin n'est jamais arrivé
  (onglet tué brutalement, requête bloquée). C'est affiché comme tel, jamais comme zéro.
- **Le middle-clic et le ctrl-clic sont écoutés** (`auxclick`) : ils n'unload jamais la
  page, et sur un lien de billetterie ce sont justement les clics intéressants.
- **Les bots sont écartés à l'ingestion** sur l'User-Agent. La plupart n'exécutent pas de
  JS et n'arrivent jamais jusqu'ici, mais un Chrome headless passerait pour un visiteur
  très assidu de Virginie. (Conséquence à connaître : un test Playwright avec l'UA par
  défaut, qui contient « HeadlessChrome », se fait écarter, à raison. Poser un UA
  réaliste pour tester la chaîne complète.)
- **Un `utm_source=instagram` et un référent instagram.com atterrissent sur la même
  ligne.** `canonicalSource()` remet les noms connus sous leur orthographe canonique, y
  compris les raccourcis courants (`ig`, `fb`, `yt`). Sans ça, taguer un lien scinde
  précisément le trafic qu'on taguait pour le mesurer.
- **Le libellé d'un clic interne est le titre, pas la carte entière.** Une carte
  d'événement est une seule ancre qui enveloppe la date, le titre, le lieu et le prix :
  `textContent` donnait « 06 AOÛT 2026 → 09 AOÛT 2026UNTOLD📍 Cluj… ». `labelOf()` prend
  d'abord l'`aria-label`, puis le titre interne.

### Vie privée

Aucun cookie de mesure. **Aucune adresse IP conservée**, elle sert de clé de
rate-limiting et est jetée. Aucun identifiant inter-sites. Deux identifiants aléatoires
dans le `localStorage` du visiteur : un id visiteur, et un id de session qui tourne après
30 min d'inactivité. Expiration automatique après `TRACK_RETENTION_DAYS`.

C'est la forme que la CNIL exempte de consentement pour la mesure d'audience, **le
garder ainsi si on étend la fonctionnalité**.

`localStorage.rr_optout = "1"` coupe la collecte pour ce navigateur. Le tableau de bord
le pose automatiquement à la connexion (le propriétaire ne se compte pas lui-même) et
propose la case « M'exclure » pour revenir en arrière.

---

## 3. Lire le tableau de bord

### Le modèle d'interaction tient en une phrase

**Cliquer sur n'importe quelle ligne de n'importe quel panneau filtre dessus.** Instagram
→ toute la page devient « le trafic Instagram » ; puis Mobile → « Instagram sur
téléphone » ; puis une page → « ce que ces lecteurs-là y ont fait ». Les pastilles en
haut disent ce qu'on regarde, et chacune s'enlève d'un clic.

Un filtre **restreint l'ensemble des visites**, puis tous les compteurs sont recalculés
dessus. Filtrer sur une page veut donc dire « les visites qui **ont inclus** cette page »,
pas « les vues de cette page ». C'est la seule lecture qui ne trompe pas : les
questions qui valent le coup sur une page (d'où venaient ces lecteurs, quoi d'autre
ont-ils ouvert, ont-ils cliqué sur un billet) sont des propriétés de la **visite**.

Toute la vue est dans l'URL, plage de dates et filtres compris. Une vue se met donc en
favori.

### Les indicateurs

| KPI | Définition exacte |
|---|---|
| **Visites** | Sessions. Nouvelle session après 30 min d'inactivité (convention du secteur, donc comparable à GA4). |
| **Pages vues** | Hits `view`, navigations SPA comprises. |
| **Nouveaux visiteurs** | Visiteurs dont c'est la toute première venue (aucun id stocké avant). |
| **Durée d'une visite** | Du premier au dernier signe de vie. |
| **Temps lu par page** | Moyenne du temps **réellement à l'écran** par page. |
| **Taux de rebond** | 1 page, 0 clic, < 10 s d'attention. Plus sévère que « 1 page » seul. |
| **Défilement moyen** | Profondeur maximale atteinte, en %. |
| **Clics sortants** | Et `% des visites` = la part de visites qui ont cliqué vers l'extérieur au moins une fois, la métrique la plus proche d'une conversion tant que la billetterie ne renvoie rien. |

### « Est-ce qu'ils partent ? » - trois réponses distinctes

- **Pages de sortie** : la dernière page vue de la visite.
- **Ils sont partis vers…** : la visite s'est terminée **sur un clic sortant**, et on sait
  donc où. La règle exacte : le clic sortant compte comme la sortie si **plus rien de chez
  nous n'a été ouvert après lui**. Un lien de billetterie cliqué au milieu d'une visite
  puis suivi d'une autre page de RaveRadar n'est pas une sortie.
  *(Première version : « dans les 2 s de la fin de la visite ». C'était faux, le signal
  de fin de la page quittée arrive couramment une ou deux secondes après le clic, donc
  la fenêtre ratait la plupart des vrais départs.)*
- **Visites, une par une** : le parcours complet, horodaté, avec le temps et le scroll de
  chaque page et les clics faits sur chacune. C'est là qu'on voit qu'un lecteur a passé
  4 minutes sur une fiche puis cliqué le lien billetterie.

### Objectifs

Poser `data-goal="nom"` sur n'importe quel élément suffit à en faire un objectif compté.
Déjà en place : `data-goal="billetterie"` sur le bouton billet de `EventDetail`. Le clic
est déjà enregistré comme sortant ; l'objectif lui donne sa propre ligne au lieu de le
noyer parmi tous les liens Instagram du site.

---

## 4. Où vit le code

| Fichier | Rôle |
|---|---|
| `lib/track.ts` | Types, validation, classification (référent → source/canal, UA → appareil). **Pur.** |
| `lib/track-store.ts` | Stockage : une clé Redis par journée UTC, TTL = rétention. Repli mémoire. |
| `lib/track-report.ts` | `sessionize()` reconstruit les visites, `applyFilters()` restreint, `buildReport()` compte. **Pur.** |
| `lib/track-auth.ts` | Mot de passe → cookie signé (HMAC de l'expiration). Aucun état stocké. |
| `components/Tracker.tsx` | Le collecteur, côté navigateur. Monté dans les deux layouts. |
| `components/TrackingDashboard.tsx` | Le tableau de bord. |
| `app/api/track/route.ts` | Ingestion. **Répond toujours 204**, quoi qu'il arrive. |
| `app/api/track/stats/route.ts` | Le rapport (GET) ; santé du stockage et effacement (POST). |
| `app/api/track/auth/route.ts` | Connexion / déconnexion. |
| `app/(fr)/suivi/page.tsx` | La page. `noindex`, hors sitemap, sans lien entrant. |

### Choix de conception à ne pas défaire

- **`/api/track` répond 204 quoi qu'il arrive.** Un traceur qui remonte des erreurs est un
  traceur qui casse des pages : un 500 dans la console de chaque visiteur, une ligne rouge
  dans l'onglet réseau, une tempête de retry. Si le stockage est mort, le hit est perdu et
  le log serveur le dit ; le lecteur ne voit rien.
- **L'endpoint d'ingestion est ouvert par nécessité**, un beacon ne peut pas
  s'authentifier. Les défenses sont la **forme** (`parseHit` ne stocke rien qu'il ne
  reconnaisse, tout est borné), le **volume** (60 req/min par IP, 30 hits par requête) et
  le fait que **rien n'est jamais renvoyé**.
- **Un lot = un `RPUSH`.** Upstash facture à la commande et le traceur envoie plusieurs
  hits par page ; le batching est la différence entre rester dans l'offre gratuite et non.
- **Trois refus empilés sur `/suivi`** : `robots` sur la page + `Disallow` dans
  `app/robots.ts` (politesse, un crawler peut les ignorer) et le mot de passe sur
  `/api/track/stats` (la vraie serrure, sans cookie valide, `401`, et la page ne rend
  qu'un formulaire au-dessus d'une coquille vide).
- **`/suivi` n'est lié depuis nulle part** et n'entre pas au sitemap (qui est une liste
  écrite à la main, rien à faire pour l'en exclure, mais ne pas l'y ajouter).
- **La page ne se compte pas elle-même** : le `Tracker` ignore tout chemin commençant par
  `/suivi`.

---

## 5. Vérifier que ça tourne

```bash
# Le collecteur répond et dit quel stockage il a trouvé
curl -s https://www.raveparty.fr/api/track | jq

# {"collecting":true,"store":"redis","persistent":true,"retentionDays":90}
# store:"memory" → les variables KV ne sont pas visibles par la fonction.
```

Puis, connecté sur `/suivi`, `POST /api/track/stats` avec `{"action":"counts"}` renvoie le
nombre de hits par journée et un `PING` du Redis, c'est la façon la moins chère de
distinguer une semaine calme d'un collecteur qui a cessé d'écrire.

Le bandeau jaune en haut du tableau de bord signale le stockage non persistant. Le pied
de page rappelle en permanence combien d'évènements ont été lus, quel stockage, et quelle
durée de conservation.

## 6. Ce qui manque encore

- **Pas de géolocalisation hors Vercel.** Les panneaux Pays/Villes/Régions se remplissent
  avec les en-têtes `x-vercel-ip-*`. En local ils sont vides, et ils le disent.
- **Les heures sont en UTC** dans les panneaux « heure de la journée » et « jour de la
  semaine » (l'étiquette le précise). En heure française l'été, décaler de 2 h.
- **Pas de comparaison à la période précédente.** Un « +18 % vs 7 jours avant » demanderait
  un second chargement de plage ; ça se pose sur `buildReport()` sans rien changer d'autre.
- **Pas d'export CSV.** Le JSON de `/api/track/stats` est déjà complet et filtrable par
  l'URL, donc `curl | jq` fait le travail en attendant.
