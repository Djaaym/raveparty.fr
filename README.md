# RaveRadar

> Annuaire des festivals et des soirées déclarées de musique électronique en Europe.
> 1 289 dates, 38 pays, ~13 500 URLs, FR par défaut et EN sous `/en`.
> En ligne sur **[raveparty.fr](https://www.raveparty.fr)**.

## Où est le code

Tout le site vit dans **`raveradar-next/`** : une application Next.js 14 (App Router),
TypeScript et Tailwind, déployée sur Vercel avec `raveradar-next` en racine de projet.

Le dépôt a longtemps porté à sa racine un **site statique antérieur** (HTML/CSS/JS sans
build) qui doublait les mêmes URLs. Il n'était plus déployé nulle part depuis la mise en
ligne de l'application Next, mais il continuait d'être modifié : deux systèmes de design
à faire évoluer ensemble, et un doute permanent sur ce qui était réellement servi. Il a
été supprimé ; son histoire reste dans git si un jour quelque chose doit y être repêché.

## Démarrer

```bash
cd raveradar-next
npm ci
npm run dev          # http://localhost:3000
npm run build        # ~13 500 pages statiques, comptez plusieurs minutes
```

## Vérifications

Elles tournent à chaque poussée (`.github/workflows/ci.yml`) et se lancent aussi à la
main. Chacune tient une règle que le projet a payée une fois :

| Commande | Ce qu'elle refuse |
|---|---|
| `npx tsc --noEmit` | Le typage, qui ne tournait qu'au travers du build |
| `npm run check:fresh` | Une édition terminée mise en avant, un repli sur l'archive |
| `npm run check:titles` | Un cadratin dans un titre de page |
| `npm run check:rel` | Un lien sortant sans `nofollow`, un lien rémunéré non déclaré |
| `python3 .research/audit.py` | L'intégrité du catalogue (ids, genres, pays, devises, coordonnées) |
| `npm run build` | Le reste, notamment un `lib/data.ts` cassé par un script d'ingestion |

## Documentation

- **`CLAUDE.md`** : la mémoire du projet. Conventions, pièges déjà payés, et la raison
  de chaque décision. À lire avant de toucher à quoi que ce soit.
- **`docs/audit-2026-09.md`** : l'audit du site, ce qui a été corrigé depuis, et ce qui
  reste.
- **`docs/seo-keywords.md`** : volumes de recherche et stratégie de contenu.
- **`docs/suivi.md`**, **`docs/promoteurs.md`**, **`docs/edition.md`**, **`docs/hotels.md`** :
  le tableau de bord d'audience, les comptes promoteurs, l'édition rapide d'une fiche,
  l'affiliation hôtel.

## Règle de contenu

Aucune donnée inventée. Une date, un line-up, une salle et un tarif viennent du site de
l'organisateur, de sa billetterie ou d'un agenda qui fait autorité. Line-up non annoncé
→ `lineup: []`. Tarif non confirmé → `priceNote`. Coordonnées introuvables → l'événement
n'entre pas au catalogue.
