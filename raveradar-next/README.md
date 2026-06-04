# RaveRadar — Next.js (production stack) — WIP

Migration de la stack de production : **Next.js 14 (App Router) + TypeScript**, **Tailwind CSS + Framer Motion**, en conservant **exactement** le design system du site statique.

## Pourquoi cette stack
- **Next.js App Router + TS** → SEO des pages événements/villes (critique pour la découverte), SSR/ISR, optimisation d'images. Indispensable pour le **SEO programmatique** (`/rave-party/{ville}`, `/festival/{ville}` — voir `../docs/seo-keywords.md`).
- **Tailwind + Framer Motion** → garde le design system existant (porté dans `app/globals.css`) tout en ajoutant des micro-interactions fluides.

## Démarrer
```bash
cd raveradar-next
npm install
npm run dev   # http://localhost:3000  (FR)  ·  /en  (EN)
```

## i18n
- Français par défaut (`/`), anglais sous `/en` — comme le site statique.
- Dictionnaire typé : `lib/i18n.ts`. Liens préfixés via `langPrefix()`.

## État d'avancement
| Élément | Statut |
|---|---|
| Config (Next, TS, Tailwind, PostCSS) | ✅ |
| Design system porté (`globals.css`) + tokens Tailwind | ✅ |
| Données + i18n typés (`lib/`) | ✅ |
| Composants : Nav, Footer, Hero, EventCard, Reveal, CountryBrowser, CtaForm | ✅ |
| Page **Accueil** (FR + EN) | ✅ |
| Page **Explorer** (filtres client, FR + EN) | ✅ |
| Menu SEO/UX : Explorer · Genres · Villes · Carte | ✅ |
| **Vrais visuels** (affiches IA sur les cartes) | ✅ |
| Hub **Genres** + pages `/genres/{genre}` (SSG, FR + EN) | ✅ |
| Hub **Villes** + pages **SEO** `/rave-party/{lieu}` (SSG, FR + EN) | ✅ |
| Pages **Carte** (Leaflet), **Événement**, **Organisateur**, **Compte** (FR + EN) | ✅ |
| Pages **`/festival/{slug}`** — festivals nommés (détail) **+** par lieu (SSG, FR + EN) | ✅ |
| Pages **artistes** `/artistes/{slug}` + hub (SSG, FR + EN) + maillage line-up ↔ artiste | ✅ |
| `sitemap.xml` + `robots.txt` | ✅ |

## Pages SEO générées (au build)
- `/rave-party/{lieu}` — 19 villes/départements prérendus (lyon, paris, rennes, bordeaux, drôme, lozère, aude, lot, isère, ain, hérault, hautes-alpes, tarn, aveyron, bretagne…), FR + EN → **38 pages**.
- `/genres/{genre}` — 12 genres prérendus, FR + EN → **24 pages**.
- `/festival/{slug}` — résolveur combiné : **festivals nommés** (page détail riche, ex. `/festival/awakenings-festival`) **+ festivals par lieu** (`/festival/lyon`), FR + EN → **52 pages**.
- `/artistes/{slug}` — une page par artiste (déduit des line-ups), FR + EN. Maillage interne fort : chaque nom du line-up sur une page événement pointe vers la page artiste, et chaque page artiste liste ses festivals + des artistes similaires.
- Carte interactive (Leaflet, tuiles sombres CARTO), page événement (line-up, galerie, mini-carte, billetterie), studio organisateur (aperçu live), espace compte (favoris en `localStorage`, alertes, historique).
- **285 pages statiques** générées au total (FR + EN).
- Chaque page lieu : H1 « Rave party {Lieu} », intro éditoriale optimisée, événements locaux (ou alerte si aucun), events à proximité, **FAQ** (capte « People also ask »), `generateMetadata` (title/description). Liste des cibles dans `lib/places.ts`.

> Le site **statique** à la racine du repo reste la version live ; ce dossier prépare la migration.
