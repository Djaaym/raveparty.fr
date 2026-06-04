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
| Pages Carte / Événement / Organisateur / Compte | ⏳ à porter |
| Pages SEO programmatiques `/rave-party/{lieu}`, `/festival/{lieu}` | ⏳ à venir |
| Pages **artistes** (phase 2) | ⏳ |

> Le site **statique** à la racine du repo reste la version live ; ce dossier prépare la migration.
