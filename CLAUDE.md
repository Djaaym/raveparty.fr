# RaveRadar — mémoire projet (CLAUDE.md)

> Annuaire des événements de musique électronique en Europe — « le TripAdvisor de la rave ».
> Objectif : devenir **la plaque tournante** du secteur (rave party / festivals / techno) via un **SEO programmatique** massif. Marché prioritaire : **France** (FR par défaut), puis NL / DE / ES / UK.

## ⭐️ Préférences permanentes (NE PAS OUBLIER)
- **Images Higgsfield de festivals** : quand on génère une image pour **un festival précis**, **TOUJOURS inclure le NOM du festival dans le prompt** (ex. « Tomorrowland mainstage… », « Awakenings techno festival… ») pour obtenir un rendu **+- réaliste / reconnaissable**. Garder aussi : `no text, no watermark, no logo`, ratio 4:5 pour les affiches, modèle `nano_banana_pro`.
- Les affiches/posters générées sont servies depuis le **CDN Higgsfield** (le proxy du conteneur bloque le téléchargement local).

## Architecture du repo
- **`raveradar-next/`** = l'app **Next.js 14 (App Router) + TS + Tailwind + Framer Motion**. **C'EST LA VERSION LIVE** (déployée sur Vercel, Root Directory = `raveradar-next`, domaine `raveparty.fr` via DNS Hostinger : A `@` 76.76.21.21, CNAME `www` cname.vercel-dns.com).
- **Racine du repo** = ancien site **statique** (HTML/CSS/JS) — legacy, gardé en cohérence mais non prioritaire.
- Branche de travail/prod : `claude/site-review-update-1g8ind`.

## Conventions (app Next)
- **Données** : `lib/data.ts` — `EVENTS: RaveEvent[]`. Champs clés : `genres[]` (clés de `GENRES`), `city`, `country`, `region?` (département/région FR → peuple `/rave-party/{dept}`), `lineup[]`, `desc` (**toujours en FR**, source de vérité) et `descEn` (repris sur `/en`).
- **Dates** : `date` = premier jour, `endDate?` = dernier jour. Un festival multi-jours reste « à venir » jusqu'à son dernier jour.
- **Prix** : `priceNote?: "estimated" | "unknown"`. Un tarif non confirmé s'affiche « ≈ 45 € », un tarif non publié « Tarif à venir » — jamais « GRATUIT ». `price: 0` sans `priceNote` = vraiment gratuit.
- **Passé vs à venir** : `isPast()` / `isLive()` / `upcoming()` / `upcomingFirst()` / `nextEdition()` dans `lib/data.ts`. **Tout listing doit passer par là** — sinon le site réaffiche des éditions terminées. Les fiches passées restent en ligne (valeur SEO) avec bandeau « édition terminée » + lien vers l'édition suivante.
- **Fraîcheur** : les deux layouts racines exportent `revalidate = 86400`. « Aujourd'hui » est figé au build, d'où le rafraîchissement quotidien.
- **i18n** : `lib/i18n.ts` (format compact, une ligne par groupe de clés — **ne pas passer Prettier dessus**), FR par défaut (`/`), EN sous `/en`. Liens préfixés via `langPrefix()`. Toute nouvelle clé va dans `fr` **et** `en`.
- **Arborescence** : `app/(fr)/` et `app/(en)/en/` sont deux groupes de routes avec **un layout racine chacun**, uniquement pour servir le bon `<html lang>`. Les URL ne changent pas.
- **Slugs** : `slugify()` ; `eventSlug()` est **par édition** — le slug nu (`/festival/sonar`) pointe sur l'édition à venir, les autres sont suffixées (`/festival/sonar-2026`). Toujours construire les liens avec `eventPath()`, jamais `slugify(e.title)`.
- **Lieux** : `lib/places.ts`. `eventsForPlace()` compare des **slugs entiers** (« Ain » est une sous-chaîne de « Saintes »). Ne jamais lier vers `/rave-party/{ville}` sans vérifier que le slug existe dans `PLACES` — même règle pour `VENUES` et `ARTISTS`.
- **Images** : posters IA dans `lib/data.ts` (map `IMAGES`, fallback dégradé via `cardBg`). Billetterie : map `TICKETS` + `ticketUrl()` (fallback RA pour payant, `null` = entrée libre).
- **SEO** : `lib/seo.ts` — `pageMeta()` (title/description/canonique/hreflang/OG), `alternates()`, et les JSON-LD `eventJsonLd` / `artistJsonLd` / `venueJsonLd` / `breadcrumbJsonLd` / `itemListJsonLd` / `faqJsonLd` / `siteJsonLd`, rendus par `<JsonLd>`. **Toute nouvelle route doit exporter `alternates`** et afficher un `<Breadcrumbs>`.
- **Maillage interne** : classes `.linkfarm` (pilules) et `.linkcols` (colonnes) dans `globals.css`. Chaque page profonde relie lieu ↔ genre ↔ artiste ↔ salle ↔ show. ~790 liens internes uniques, 0 lien mort (à re-vérifier après tout ajout).
- **Build** : `cd raveradar-next && npm run build` (doit rester vert ; ~2 600 pages statiques actuellement).
- **Pages** : `/`, `/explore`, `/genres` + `/genres/{g}`, `/villes` + `/rave-party/{lieu}`, `/rave-party/ce-week-end`, `/rave-party/autour-de-moi`, `/festival/{slug}` (festival nommé OU lieu), `/artistes` + `/artistes/{slug}`, `/lieux` + `/lieux/{slug}`, `/show/{artiste-lieu-date}`, `/map`, `/organizer`, `/account`. Menu : Explorer · Genres · Villes · Artistes · Carte.

## Règle de contenu
Aucune donnée inventée : dates, line-ups, lieux et prix doivent être vérifiés (site officiel, RA, Songkick, presse). Line-up non annoncé → `lineup: []` (« Programmation à venir »). Prix non confirmé → `priceNote`.

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
2. ✅ Pages **« show » (artiste×lieu×date)** + pages **venues** (façon JamBase).
3. ✅ Page **`/rave-party/autour-de-moi`** (géoloc) + **« ce week-end »**.
4. Expansion : ✅ Rotterdam (NL), ✅ Rave the Planet (DE), ✅ villes UK ; reste la page éducative ES.
5. Brancher une vraie source de données / le formulaire organisateur en base — **c'est le vrai prochain chantier** : le calendrier est aujourd'hui saisi à la main et devra être rafraîchi. Pistes : API Resident Advisor, Songkick, Bandsintown, ou scraping des billetteries.
6. Départements à fort volume encore vides, faute d'événement légal vérifiable : **Lot (5,4k), Aude (4,4k), Lozère (4,4k), Tarn, Aveyron, Hautes-Alpes, Ain**. Leurs pages existent mais affichent « pas encore d'événement ».
7. Compléter les posters IA manquants et les `descEn` des futurs ajouts.
