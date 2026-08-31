# Corriger une fiche depuis la fiche

> Le bouton **« Modifier la fiche »**, en bas à droite d'une page événement, ouvre un
> panneau qui corrige **la description, le line-up et le tarif** sans passer par GitHub.
> La correction est visible tout de suite. Elle n'est pas le catalogue pour autant, et ce
> document explique où passe exactement la frontière.

## Mise en route

Rien à configurer si `/admin` fonctionne déjà.

1. **La porte est celle de `/admin`** (`lib/admin-access.ts`), inchangée. Deux chemins :
   un compte promoteur **approuvé** dont l'adresse est dans `ADMIN_EMAILS`, ou le mot de
   passe `ADMIN_PASSWORD` (à défaut `TRACKING_PASSWORD`).
2. **Le magasin est celui des comptes** : `ACCOUNTS_KV_REST_API_*`, ou ce que Vercel
   injecte (`KV_REST_API_*`). Sans lui, l'API répond 501 et le panneau l'annonce avant
   qu'on écrive dix lignes, plutôt que d'annoncer un enregistrement que personne ne
   retrouvera au prochain démarrage de lambda.
3. **Se connecter une fois.** Le bouton n'apparaît qu'ensuite : il est conditionné à un
   cookie lisible, `rr_admin_on`, posé à la connexion (par `/account` comme par le
   formulaire de `/admin`). Une session ouverte avant que ce cookie n'existe le récupère
   au premier passage sur `/account`.

Puis : ouvrir n'importe quelle page `/event/…` ou `/festival/…`, cliquer sur le bouton,
corriger, enregistrer. La fiche se met à jour dans la seconde, dans les deux langues.

## Ce qui se met à jour, et ce qui attend

**La fiche de l'événement**, tout de suite, FR et EN : la description, le line-up, le
tarif, la meta description, l'image de partage, le JSON-LD.

**Rien d'autre.** Les cartes des grilles, les fiches artistes, l'index de recherche, la
carte, les pages ville et genre sont construites à la compilation, à partir de
`lib/data.ts`. Les recalculer voudrait dire rendre dynamiquement les 8 800 pages du site,
c'est-à-dire renoncer à la génération statique qui fait toute sa valeur SEO. Une
correction est donc **une avance sur le catalogue, pas un remplacement** : elle tient
jusqu'à ce que la même valeur soit saisie dans `lib/data.ts`, et l'onglet **« Fiches
corrigées »** de `/admin` tient cette file, avec le patch prêt à coller.

Deux conséquences visibles, toutes deux traitées plutôt que subies :

- **Un artiste ajouté n'a pas encore de page.** Son nom s'affiche dans le line-up sans
  lien (`hasArtistPage()` dans `lib/artists.ts`), et le JSON-LD l'annonce en `performer`
  sans `url`. Un lien vers une page qui n'existe pas est un 404 offert à Google, une
  affirmation sans lien est simplement vraie.
- **Un tarif corrigé reste l'ancien sur les cartes** des autres pages jusqu'au
  déploiement suivant. C'est le seul écart réellement visible ; il se referme en
  reportant le patch.

## Le cycle complet

1. Corriger depuis la fiche. C'est enregistré dans Redis, sous une seule clé
   (`rr:edits`, un champ par événement).
2. La route revalide les deux chemins de la fiche (`revalidatePath`), donc la page
   statique est régénérée à la demande suivante au lieu d'attendre le `revalidate = 3600`
   des layouts.
3. Au prochain lot de catalogue, ouvrir `/admin` → **Fiches corrigées** → *Voir le patch
   à coller*, et reporter les champs dans la ligne `id: …` de `lib/data.ts`. Le patch est
   déjà aplati sur une ligne et échappé comme l'écrit `merge.py`, un retour à la ligne
   dans une chaîne de `data.ts` cassant le build 8 800 pages plus loin.
4. **Retirer la correction** une fois reportée, sinon la surcouche continue d'écraser le
   catalogue avec la même valeur, et la file finit par ne plus rien signifier.

Le bouton **« Revenir au catalogue »**, dans le panneau, fait la même chose depuis la
fiche : c'est aussi l'annulation quand on s'est trompé.

## Ce que la saisie refuse, et pourquoi

Ce sont les règles du catalogue, pas des règles neuves.

| Champ | Règle |
|---|---|
| Description FR | 40 signes minimum. Markdown réduit (gras, italique, liste, lien), rendu par `lib/richtext.ts`, jamais du HTML. |
| Description EN | Vide est une valeur : elle **supprime** la traduction et `/en` retombe sur le français. Une version anglaise laissée sous un texte français réécrit affirmerait autre chose que lui. |
| Line-up | 90 noms au plus, doublons retirés sans distinction de casse. **L'ordre compte** : le premier nom est la tête d'affiche, d'où les flèches. |
| Tarif | Le plus bas réellement vendu, pas le pass complet. |
| Devise | Le symbole local, **sans conversion** : le montant affiché doit être celui qu'on paie à l'entrée. |
| Fiabilité | *Confirmé* / *Estimé* (« ≈ 45 € ») / *Non publié* (« Tarif à venir », jamais « gratuit »). |

La date, la salle, la ville et les coordonnées ne sont pas modifiables : elles nourrissent
les pages ville, lieu, pays et la carte, toutes construites au déploiement. Les changer
ici ne corrigerait qu'un endroit sur six, et le slug d'une fiche dépend de son titre
(voir `lib/renamed.ts`). Ça passe par `lib/data.ts`.

La validation vit dans `parseEdit()` (`lib/event-edits.ts`) et sert **le panneau et la
route** : deux validations écrites séparément divergent toujours, et c'est celle du
serveur qui décide.

## Choix de conception à ne pas défaire

- **Le cookie `rr_admin_on` n'accorde rien.** Il évite un aller-retour réseau sur les
  milliers de fiches qui portent le SEO du site, exactement comme `rr_pro_on` pour la nav.
  Qui le pose à la main dans son navigateur voit un bouton, et rien de plus :
  `/api/event-edit` revérifie `adminAccess()` sur ses trois verbes.
- **Le panneau arrive par `next/dynamic`, au clic.** Il tire `RichEditor`, `TagPicker` et
  le dictionnaire d'i18n. Importé directement, chaque lecteur de chaque fiche les
  télécharge ; c'est la règle « un composant client ne tire jamais `lib/data.ts` »,
  appliquée un cran plus bas. Coût mesuré du déclencheur seul : **+1 Ko** sur le premier
  chargement d'une fiche.
- **La lecture est mise en cache par tag** (`unstable_cache`, `EDITS_TAG`). Le site
  construit 1 600 fiches d'un coup : sans cache ce serait 1 600 allers-retours Redis par
  build, avec, un seul. L'écriture invalide le tag, donc la fiche suivante repart du
  magasin, sur toutes les instances à la fois.
- **Une panne du magasin ne casse jamais une fiche.** `allEdits()` avale ses erreurs et
  rend le catalogue non corrigé. Une correction perdue est un désagrément, une page
  événement en 500 parce qu'un magasin annexe ne répond pas serait bien pire.
- **Le catalogue reste un fichier relu à la main.** La correction rapide ne l'ouvre pas :
  elle raccourcit le chemin entre voir une erreur et la corriger, pas celui entre une
  information et sa vérification. La règle de contenu du projet ne bouge pas d'un pouce,
  rien d'inventé, dates, line-ups, lieux et prix se vérifient.
