# RaveRadar — mémoire projet (CLAUDE.md)

> Annuaire des événements de musique électronique en Europe — « le TripAdvisor de la rave ».
> Objectif : devenir **la plaque tournante** du secteur (rave party / festivals / techno) via un **SEO programmatique** massif. Marché prioritaire : **France** (FR par défaut), puis NL / DE / ES / UK.

## ⭐️ Préférences permanentes (NE PAS OUBLIER)
- **Images Higgsfield de festivals** : quand on génère une image pour **un festival précis**, **TOUJOURS inclure le NOM du festival dans le prompt** (ex. « Tomorrowland mainstage… », « Awakenings techno festival… ») pour obtenir un rendu **+- réaliste / reconnaissable**. Garder aussi : `no text, no watermark, no logo`, ratio 4:5 pour les affiches, modèle `nano_banana_pro`.
- Les affiches/posters générées sont servies depuis le **CDN Higgsfield** (le proxy du conteneur bloque le téléchargement local).

## Architecture du repo
- **`raveradar-next/`** = l'app **Next.js 14 (App Router) + TS + Tailwind + Framer Motion**. **C'EST LA VERSION LIVE** (déployée sur Vercel, Root Directory = `raveradar-next`, domaine `raveparty.fr` via DNS Hostinger : A `@` 76.76.21.21, CNAME `www` cname.vercel-dns.com).
- **Racine du repo** = ancien site **statique** (HTML/CSS/JS) — legacy, gardé en cohérence mais non prioritaire.
- Branche de travail/prod : `claude/gifted-carson-HQLiX`.

## Conventions (app Next)
- **Données** : `lib/data.ts` — `EVENTS: RaveEvent[]`. Champs clés : `genres[]` (clés de `GENRES`), `city`, `country`, `region?` (département/région FR → peuple `/rave-party/{dept}`), `lineup[]`, `desc` (FR pour les events FR).
- **i18n** : `lib/i18n.ts`, FR par défaut (`/`), EN sous `/en`. Liens préfixés via `langPrefix()`.
- **Slugs** : `slugify()` ; artistes dérivés des line-ups (`lib/artists.ts`) ; lieux dans `lib/places.ts`.
- **Images** : posters IA dans `lib/data.ts` (map `IMAGES`, fallback dégradé via `cardBg`). Billetterie : map `TICKETS` + `ticketUrl()` (fallback RA pour payant, `null` = entrée libre).
- **SEO** : `app/sitemap.ts` + `app/robots.ts` ; `generateStaticParams` sur toutes les routes dynamiques. Base = `lib/site.ts` (`https://raveparty.fr`).
- **Build** : `cd raveradar-next && npm run build` (doit rester vert ; ~455 pages statiques actuellement).
- **Pages** : `/`, `/explore`, `/genres` + `/genres/{g}`, `/villes` + `/rave-party/{lieu}`, `/festival/{slug}` (festival nommé OU lieu), `/artistes` + `/artistes/{slug}`, `/map`, `/organizer`, `/account`. Menu : Explorer · Genres · Villes · Artistes · Carte.

## Mémoire SEO / mots-clés
Voir **`docs/seo-keywords.md`** : volumes FR (« rave party » 40,5k, « festival » 5,4M) + longue traîne géo + expansion NL/DE/ES/UK (Rotterdam, Rave the Planet, etc.).

## Inspirations / références
- **Direction artistique** : Resident Advisor, Boiler Room, HÖR Berlin, Verknipt, Awakenings, Possession, Intercell.
- **Modèle produit/SEO — JamBase** (https://www.jambase.com) : ex. page « show » `/show/anyma-parc-du-cinquantenaire-20260606`.
  À s'inspirer / roadmap :
  - **Pages « show » = artiste + lieu + date** (slug `{artiste}-{lieu}-{date}`) → multiplie les pages SEO longue traîne (« anyma paris 2026 »).
  - **Pages lieux/venues** (`/lieux/{venue}`) avec l'agenda du lieu.
  - **Setlists**, « **fans y vont / RSVP** », « **préviens-moi quand {artiste} joue près de moi** » (alertes), bloc « fans regardent aussi ».

## Roadmap (prochaines étapes possibles)
1. Bios + photos d'artistes (Higgsfield, avec nom de l'artiste/festival dans le prompt).
2. Pages **« show » (artiste×lieu×date)** + pages **venues** (façon JamBase).
3. Page **`/rave-party/autour-de-moi`** (géoloc) + **« ce week-end »**.
4. Expansion : Rotterdam (NL), Rave the Planet (DE), villes UK, page éducative ES.
5. Brancher une vraie source de données / le formulaire organisateur en base.
