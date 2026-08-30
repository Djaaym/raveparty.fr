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

Trois choses à poser dans Vercel, dont une seule est vraiment nouvelle.

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

### 2. Le mail sortant (obligatoire en pratique)

Déjà nécessaire pour le formulaire organisateur, mêmes variables :

```
ALERTS_NOTIFY_TO=djaym.info@gmail.com
ALERTS_NOTIFY_FROM=alertes@raveparty.fr
```

Sans transport, un compte se crée quand même mais **personne n'est prévenu** : la demande
attend, et son détail (liens d'approbation compris) part dans le journal serveur. Les
pages de décision le disent au lieu d'annoncer un mail qui n'est pas parti.

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
- La route de connexion ne distingue pas « adresse inconnue » de « mot de passe faux » :
  les séparer ferait du formulaire un test d'existence d'adresse. Un compte refusé ou
  suspendu, lui, est bien distingué, mais **après** vérification du mot de passe.
- L'empreinte ne sort jamais de l'API : `publicAccount()` la retire de toute réponse.
