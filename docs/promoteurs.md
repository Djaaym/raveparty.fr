# Comptes promoteurs & dépôt d'événement

> Comment un organisateur obtient un compte, comment il dépose une date, et ce que le
> propriétaire du site a à faire (deux clics dans un mail).

Jusqu'ici, « Connexion » ouvrait une page de compte factice (un nom, une ville et une
adresse écrits en dur dans le composant) et le formulaire de `/organizer` envoyait un mail
anonyme. Un annuaire dont toute la valeur tient à la vérification ne peut pas laisser
l'expéditeur d'une fiche indéterminé : cette page décrit ce qui remplace les deux.

## Ce que ça fait

1. Un organisateur crée un compte sur `/account` (ou directement depuis `/organizer`),
   avec un mot de passe et un profil complet, c'est ce profil qui sert à décider.
2. Le propriétaire reçoit un mail avec deux liens, **Approuver** et **Refuser**.
3. Une fois approuvé, l'organisateur dépose ses événements depuis `/organizer`. Chaque
   dépôt part par mail (affiche en pièce jointe) avec deux liens, **Valider** et
   **Écarter**.
4. Un dépôt validé **n'est pas publié pour autant** : il entre au catalogue par
   `.research/merge.py`, comme tout le reste. Le statut dit « vérifié et à saisir », c'est
   une file de travail, pas un CMS.

Le point 4 n'est pas une limite temporaire, c'est le sujet. La règle de contenu du projet
(rien d'inventé, dates, line-ups, lieux et prix vérifiés) ne s'assouplit pas parce que
l'information vient de l'organisateur : elle vient d'une meilleure source, ce qui rend la
relecture plus rapide, pas facultative.

## Mise en route

Deux variables suffisent à tout faire tourner : le magasin et une clé d'API mail. Les
autres ne servent qu'à préciser.

### 1. Le magasin (obligatoire)

Un compte est une valeur JSON lue par son adresse, et il y en aura des dizaines. C'est une
clé Redis, pas un schéma, et c'est le même magasin que le suivi d'audience : si `/suivi`
tourne déjà, il n'y a **rien à faire**, `KV_REST_API_URL` / `KV_REST_API_TOKEN` sont déjà
là et les comptes s'en servent.

Sinon, n'importe quel Redis parlant le protocole REST d'Upstash convient (Vercel Storage >
KV, ou l'intégration Upstash du marketplace, les deux gratuites au démarrage) :

```
ACCOUNTS_KV_REST_API_URL=https://….upstash.io
ACCOUNTS_KV_REST_API_TOKEN=…
```

**Sans magasin, `/api/promoteur/signup` répond 501** et le formulaire affiche « les comptes
ne sont pas encore ouverts ». C'est délibéré : un compte enregistré dans la mémoire d'une
lambda disparaît au premier redéploiement, et annoncer une inscription qui ne survivra pas
est pire que la refuser. Le repli mémoire reste ouvert en `next dev`, où il est exactement
ce qu'il faut.

### 2. Les alertes mail

C'est par là qu'arrivent les demandes de compte et les dépôts, avec les liens
**Approuver** / **Refuser** et l'affiche en pièce jointe. Trois transports possibles,
essayés dans cet ordre.

#### Recommandé : la boîte du domaine (Hostinger)

```
SMTP_HOST=smtp.hostinger.com     (ou smtp.titan.email selon l'offre, à vérifier dans hPanel)
SMTP_USER=noreply@raveparty.fr
SMTP_PASS=…
SMTP_PORT=465                    (facultatif : 465 par défaut, 587 pour STARTTLS)
```

L'expéditeur se déduit de `SMTP_USER`, il n'y a donc rien d'autre à poser. Les
enregistrements SPF et DKIM du domaine étant déjà en place chez l'hébergeur, un promoteur
reçoit sa validation depuis une adresse du site, et non depuis l'adresse de démarrage d'un
tiers.

**Une boîte dédiée, jamais la boîte personnelle.** Une clé d'API ne sait qu'envoyer ; le
mot de passe d'une boîte ouvre aussi sa lecture en IMAP. Mettre celui de sa boîte
principale dans les variables d'un déploiement, c'est y mettre l'accès complet à son
courrier alors que le site n'a besoin que d'expédier. Une boîte `noreply@` rend la fuite
sans intérêt, et la console le rappelle à l'écran.

**Les quotas d'un hébergeur ne sont pas ceux d'un service d'envoi** (quelques centaines de
messages par jour, parfois par heure). Sans importance ici ; le jour où une vraie
newsletter part à toute la liste, c'est Brevo qui la portera, pas cette boîte.

#### En repli : Resend

```
RESEND_API_KEY=re_…
```

Une seule ligne, pour se prévenir soi-même. Le destinataire vaut `djaym.info@gmail.com`
par défaut (`ALERTS_NOTIFY_TO` pour en changer) et l'expéditeur retombe sur
`onboarding@resend.dev`, l'adresse de démarrage de Resend, qui fonctionne **sans domaine
vérifié**. Sa limite est affichée dans la console : elle **n'écrit qu'à l'adresse du
compte Resend**, donc elle ne suffit pas pour écrire à un promoteur. Pour ça, un domaine
vérifié et `ALERTS_NOTIFY_FROM=alertes@raveparty.fr`.

Brevo marche aussi (`BREVO_API_KEY`), avec une différence : pas d'expéditeur de démarrage,
il exige un expéditeur vérifié dans le compte, donc `ALERTS_NOTIFY_FROM` y est obligatoire
dès le départ.

**Le bouton « Envoyer un test » de `/admin` est là pour finir la configuration** : il
envoie un vrai message et rend la réponse du fournisseur telle quelle. « API key is
invalid » et « domain is not verified » ne se corrigent pas pareil, et un simple « échec »
obligerait à aller lire les journaux de Vercel.

Sans transport, un compte se crée quand même mais **personne n'est prévenu** : la demande
attend, son détail (liens d'approbation compris) part dans le journal serveur, et la
console marque la ligne **« non notifié »**. C'est ce marqueur qui évite le pire des cas,
une demande arrivée un jour où le mail était cassé et qui attend indéfiniment sans que
rien ne le signale.

### 3. Le secret de signature (recommandé)

```
ACCOUNT_SECRET=une-chaîne-longue-et-unique
```

Sans lui, il est dérivé du jeton du magasin, ce qui marche et reste stable pour un
déploiement donné, avec une conséquence à connaître : **changer de magasin déconnecte tout
le monde** et invalide les liens d'approbation en attente. Le poser découple les deux.

## Le cycle de vie d'un compte

| Statut      | Peut se connecter | Peut déposer | Comment on y arrive                         |
| ----------- | ----------------- | ------------ | ------------------------------------------- |
| `pending`   | oui               | non          | à l'inscription                             |
| `approved`  | oui               | oui          | lien « Approuver » du mail                  |
| `rejected`  | non               | non          | lien « Refuser » du mail                    |
| `suspended` | non               | non          | à la main, en changeant `status` dans Redis |

Un compte en attente peut se connecter exprès : il voit son statut et complète son profil,
au lieu de recevoir « identifiants incorrects » sur un compte qui existe.

Garde-fous en place : cinq tentatives de connexion par minute et par adresse IP, quatre
inscriptions, douze dépôts par compte et par tranche de 24 heures. Tous best-effort et par
instance de lambda, comme le reste de `lib/ratelimit.ts`.

## La console, pour revenir sur une décision

Les liens du mail suffisent à trancher **au moment où la demande arrive**. Ce qu'ils ne
permettent pas, c'est de revenir : suspendre un compte qui dérape, supprimer un compte de
test, retirer un dépôt qui n'aurait pas dû passer. Sans ça, la seule façon de défaire
serait d'ouvrir Redis à la main.

**`/admin`** est cette porte de sortie. Même statut que `/suivi` : pas de nav, pas de
lien depuis le site, `noindex`, `Disallow` dans `robots.txt`, et un mot de passe sur ses
propres routes, pas seulement sur l'affichage.

**Deux portes, indépendantes.**

**Avec ton compte, c'est la voie normale.** Une session promoteur dont l'adresse figure
dans `ADMIN_EMAILS` (par défaut `djaym.info@gmail.com`) et **dont le compte est approuvé**
ouvre la console. On se connecte sur `/account` comme sur le reste du site, et un lien
« Administration » apparaît au-dessus des onglets. Rien à configurer.

Pourquoi « approuvé » et pas seulement « la bonne adresse » : rien ne vérifie qu'on
possède l'adresse saisie à l'inscription, il n'y a pas de confirmation par mail. Ouvrir la
console sur la seule foi d'une adresse la donnerait au premier qui s'inscrit avec la
tienne. Exiger un compte approuvé referme la porte sans machinerie nouvelle, le seul moyen
d'être approuvé étant un clic dans le mail de validation, qui part vers ta boîte. Une
fausse candidature s'y voit et ne s'approuve pas.

**Avec un mot de passe, en secours.**

```
ADMIN_PASSWORD=une-chaîne-longue-et-unique
```

**Sans elle, `TRACKING_PASSWORD` fait l'affaire** : il y a une seule personne derrière ces
deux pages, et lui demander de configurer un second secret pour la même main serait le
meilleur moyen qu'elle en choisisse un faible. Le cookie est propre à la console (7 jours,
contre 30 pour le suivi, cette porte-là supprimant des comptes) : même avec le même mot de
passe, un cookie `/suivi` n'ouvre pas `/admin`. Garde cette porte ouverte : perdre le mot
de passe de son compte ou casser le magasin fermerait sinon le seul chemin qui permet de
réparer.

Un troisième garde-fou vient avec l'accès par compte : **on ne peut ni se supprimer ni se
suspendre soi-même**. Entré avec son propre compte, c'est lui qui tient la porte, et sans
`ADMIN_PASSWORD` posé il n'y aurait plus aucun moyen de revenir. La console refuse, et
n'affiche pas les boutons sur sa propre ligne.

Ce qu'on y fait, sur un compte : le passer à `approved`, `pending`, `suspended`,
`rejected`, ou le supprimer. Sur un dépôt : le valider, le remettre en relecture,
l'écarter, ou le supprimer.

Deux choses à savoir avant de cliquer :

- **Supprimer un compte supprime ses dépôts avec lui.** En cascade, et pas « le compte
  seul » : un dépôt orphelin n'a plus de structure derrière lui, donc plus rien à
  vérifier ni personne à qui répondre, et il resterait dans la file sans que rien ne dise
  pourquoi. La confirmation annonce le nombre exact, « supprimer ce compte » et
  « supprimer ce compte et ses 4 dépôts » n'étant pas la même décision.
- **La console n'envoie aucun mail.** Les liens du mail sont la décision de première main,
  celle qu'on prend en découvrant la demande, et prévenir est alors le geste attendu. La
  console sert à reprendre et à faire le ménage : repasser un compte en attente pour
  vérifier une pièce ne mérite pas un mail, et supprimer un compte de test encore moins.

Un compte `suspended` ou `rejected` ne peut plus se connecter, et le statut est relu à
chaque requête : la suspension prend effet tout de suite, sans attendre l'expiration
d'un cookie.

## Les liens d'un clic, et pourquoi c'est un GET

`/api/promoteur/approve` change un état sur une requête GET, ce qu'on éviterait ailleurs.
C'est le but : la décision doit se prendre depuis un téléphone, en un clic, sans ouvrir de
session ni retrouver un mot de passe. Ce qui tient la porte est le HMAC, un jeton non
devinable **lié à la cible et à l'action**, donc le lien « approuver » d'un compte n'ouvre
rien d'autre, et un lien rejoué ne fait qu'annoncer l'état courant.

Corollaire : ces liens valent le secret qui les signe. Ne pas les transférer.

## Ce qui a été mis dans le formulaire, et pourquoi

- **Sous-genres multiples** (`lib/subgenres.ts`). Un genre principal ne décrit pas une
  affiche. Ils reprennent le vocabulaire d'`ARTIST_STYLES.s`, donc les mêmes libellés que
  le reste du site, et **ils n'auront pas de page** : les afficher en lien créerait des
  centaines d'URLs vides, exactement les pages satellites que le projet évite partout
  ailleurs. La liste proposée suit le genre choisi, puis s'ouvre à tout le vocabulaire, et
  la saisie libre reste possible, un style neuf apparaît toujours avant qu'une liste ne le
  connaisse.
- **Line-up avec autocomplétion sur le catalogue** (`/api/search?kind=artist`). Ce n'est
  pas un confort de frappe : « Amélie Lens » saisi à la main ne rejoint pas la fiche
  d'« Amelie Lens », il en crée une seconde. Proposer l'orthographe déjà en base est ce qui
  rattache un dépôt aux fiches artistes existantes. `kind=artist` parce qu'une ville
  proposée à cet endroit deviendrait une faute de frappe publiée sur une affiche.
- **Description avec mise en forme légère** (`lib/richtext.ts`). Quatre signes de Markdown,
  pas un éditeur riche : le catalogue stocke `desc` en texte, et une description qui
  arriverait en HTML serait une porte d'entrée sur une fiche. Le rendu échappe la saisie
  **avant** de reconnaître les motifs, donc aucune balise tapée ne ressort en balise, et
  c'est ce qui rend défendable le `dangerouslySetInnerHTML` de l'aperçu.
- **Quatre étapes qui valident au passage**, avec `parseSubmission()`, le module qu'utilise
  la route. On ne découvre pas à la dernière étape qu'une date est déjà passée, et une
  règle ne peut pas diverger entre le formulaire et le serveur.

Les règles refusées à la saisie sont celles du catalogue, pas des règles neuves : l'année
dans le titre (les éditions sont regroupées sous un même nom), `endDate` sur une soirée qui
finit à l'aube (`isPast()` la garderait « à venir » tout le dimanche), une date passée, un
tarif annoncé comme confirmé quand il ne l'est pas.

## L'affiche

Il n'y a nulle part où stocker une image (le site sert `public/` depuis le dépôt), donc
elle part **en pièce jointe** du mail au propriétaire, qui la range dans `public/posters/`
s'il retient l'événement. Au-delà de trois mégaoctets le fournisseur refuse le message
entier : le formulaire garde alors le nom du fichier et le dit. L'ancien formulaire ne
faisait que ça dans tous les cas, alors que « glisse ton artwork ici » promettait un envoi
qui n'avait pas lieu.

## Publier un dépôt : la chaîne complète

**Marquer « vérifié, à saisir » dans la console ne met rien en ligne.** Le catalogue est
un fichier TypeScript (`lib/data.ts`) à partir duquel Next.js génère les ~7 000 pages
statiques au déploiement : une fiche n'existe pour le site qu'une fois écrite dedans.

### Le bouton, sans rien installer

Dans `/admin`, onglet **Dépôts**, le bouton **« Exporter le lot »** produit le JSON prêt à
entrer au catalogue, coordonnées comprises, et **« Copier le JSON »** le met dans le
presse-papier. De là, deux façons de finir :

- **Le coller dans une session Claude Code** en demandant la mise en ligne. C'est le
  chemin le plus court, et celui qui complète aussi le département, la traduction et
  l'image.
- **Le coller dans `raveradar-next/.research/events-promoteurs.json`**, puis lancer
  `python3 .research/merge.py`, committer et pousser.

### La même chose en ligne de commande

```
cd raveradar-next
python3 .research/from-submissions.py --site https://www.raveparty.fr
python3 .research/merge.py --dry && python3 .research/merge.py
python3 .research/audit.py
git add -A && git commit && git push            # Vercel déploie, la page existe
```

Le script demande le mot de passe de la console (`ADMIN_PASSWORD`, à défaut
`TRACKING_PASSWORD`), qu'il prend aussi dans l'environnement. **Il ne convertit rien** :
la conversion vit dans `lib/catalog-export.ts` et n'existe qu'une fois, le script n'est
qu'un client du point d'accès. Deux conversions écrites séparément finiraient par
diverger, et aucune n'aurait raison sur l'autre.

### Ce qu'il complète, et ce qu'il refuse de deviner

**La salle est géocodée au moment où tu la vérifies.** Le formulaire ne demande pas de
coordonnées, un promoteur tape « Le Sucre, Lyon » ; sans `lat`/`lng`, l'événement n'a ni
point sur la carte ni distance pour « autour de moi ». Le clic sur « vérifié, à saisir »
interroge donc Nominatim (OpenStreetMap) sur la salle, puis l'adresse, puis la ville, et
enregistre le point sur le dépôt.

C'est fait **une salle à la fois, à la décision**, et pas sur un lot entier au moment de
l'export : Nominatim limite à une requête par seconde, et une fonction Vercel a quelques
secondes de budget. L'export rattrape au passage les quelques dépôts vérifiés avant que
ce chemin n'existe, trois par clic, et dit lesquels manquent encore.

Sans réponse, **aucun point n'est inventé** : la fiche est écartée de l'export et
signalée.

**Il ne remplit pas `region`.** Mesuré : Nominatim rend « Métropole de Lyon » là où le
catalogue dit « Rhône », et rien du tout pour Paris. Une valeur approximative serait pire
que l'absence, elle créerait une page de département qui n'existe pas. Les fiches
françaises sont listées en fin de rapport, à compléter à la main.

**Il ne traduit pas.** Sans description anglaise fournie, `descEn` reprend le texte
français, ce que la fiche affiche déjà de toute façon (`eventDesc()` retombe sur `desc`).
Le rapport les liste.

**Il aplatit la mise en forme.** `merge.py` écrit `desc` dans une chaîne TypeScript sur
une seule ligne et son `esc()` n'échappe que `\` et `"` : un retour à la ligne y casserait
le fichier, 7 000 pages plus loin, au build. Les lignes sont donc recollées en phrases,
avec un point ajouté quand il manque.

**Les sous-genres n'ont pas de champ au catalogue**, `merge.py` n'acceptant que les onze
genres de `GENRES`. Ils voyagent quand même dans le lot sous `_subgenres`, avec `_source`
(quel dépôt, quel compte), `_geocode` (la requête qui a répondu) et `_poster` : quatre
clés que `merge.py` ignore et qui servent à celui qui relit.

## Vie privée et sécurité

- Le mot de passe est stocké en **scrypt** (`node:crypto`, sans dépendance ajoutée), au
  format `scrypt$N$r$p$sel$empreinte` : les paramètres voyagent avec l'empreinte, donc les
  durcir plus tard ne casse pas les comptes existants.
- La session est un **cookie signé**, `HttpOnly`, `SameSite=Lax`, 30 jours, sans état
  stocké. Il porte un marqueur dérivé du mot de passe : en changer ferme toutes les autres
  sessions ouvertes.
- Un **second cookie**, `rr_pro_on`, lisible celui-là, ne porte qu'un drapeau. Il n'accorde
  rien et n'est jamais lu côté serveur : il évite à la nav d'appeler l'API sur chaque page
  du site pour savoir s'il faut écrire « Connexion » ou « Mon compte ».
- Le statut du compte est relu à chaque requête, donc **suspendre prend effet tout de
  suite**, sans attendre l'expiration d'un cookie.
- L'adresse du propriétaire vit dans `lib/subscribers.ts`, **module serveur uniquement**,
  et doit y rester : une adresse mail dans un bundle de navigateur se fait ramasser par
  les robots à spam dans la semaine.
- La route de connexion ne distingue pas « adresse inconnue » de « mot de passe faux » :
  les séparer ferait du formulaire un test d'existence d'adresse. Un compte refusé ou
  suspendu, lui, est bien distingué, mais **après** vérification du mot de passe.
- L'empreinte ne sort jamais de l'API : `publicAccount()` la retire de toute réponse.
