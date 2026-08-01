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
- **URLs de show retirées** : renommer un `venue` ou corriger un line-up **casse les `/show/{artiste}-{lieu}-{date}` déjà indexés** (ex. `venue: "Amsterdam (ADE)"` → `"SugarFactory"` a tué 9 URLs). `artistFromDeadShowSlug()` (`lib/shows.ts`) récupère l'artiste dans le slug et `ShowPage` renvoie un **301 vers `/artistes/{slug}`** au lieu d'un 404. Ne jamais réinventer un événement pour « réparer » une URL morte.
- **Lieux** : `lib/places.ts`. `eventsForPlace()` compare des **slugs entiers** (« Ain » est une sous-chaîne de « Saintes »). Ne jamais lier vers `/rave-party/{ville}` sans vérifier que le slug existe dans `PLACES` — même règle pour `VENUES` et `ARTISTS`.
- **Images** : posters IA dans `lib/data.ts` (map `IMAGES`, fallback dégradé via `cardBg`). Billetterie : map `TICKETS` + `ticketUrl()` (fallback RA pour payant, `null` = entrée libre).
- **SEO** : `lib/seo.ts` — `pageMeta()` (title/description/canonique/hreflang/OG), `alternates()`, et les JSON-LD `eventJsonLd` / `artistJsonLd` / `venueJsonLd` / `breadcrumbJsonLd` / `itemListJsonLd` / `faqJsonLd` / `siteJsonLd`, rendus par `<JsonLd>`. **Toute nouvelle route doit exporter `alternates`** et afficher un `<Breadcrumbs>`.
- **Maillage interne** : classes `.linkfarm` (pilules) et `.linkcols` (colonnes) dans `globals.css`. Chaque page profonde relie lieu ↔ genre ↔ artiste ↔ salle ↔ pays ↔ show. ~1 750 liens internes uniques, 0 lien mort (à re-vérifier après tout ajout).
- **Guides festival** : `lib/guides.ts` + `components/FestivalGuide.tsx`. Pour les événements qui sont en réalité **tout un programme sur plusieurs jours et plusieurs lieux** (ADE 2026, à venir : Sónar, Nuits sonores…), la fiche standard ne suffit pas. Un guide est indexé par **(titre exact, année)** — pas par id, pour qu'une nouvelle édition n'hérite pas du programme de la précédente — et contient : `hook` (la phrase « ce n'est pas une soirée »), `intro[]`, `stats`, `blocks`, `strands`, `days` (jour par jour), `passes`, `venues`, `practical`, `faq`, `subEventIds`. Tout est bilingue via le type `L { fr, en }` et l'accesseur `pick()`. `EventDetail` s'adapte tout seul : bandeau d'avertissement, intro longue à la place de `desc`, galerie de dégradés masquée, guide pleine largeur, `faqJsonLd`, `subEvent`/`superEvent` schema.org, et titre/description SEO propres via `metaTitle`/`metaDesc`. Les événements listés dans `subEventIds` affichent en retour un bandeau « fait partie du programme ».
- **Programme ombrelle ≠ salle** : un événement porteur d'un guide est **exclu de `VENUES` et de `SHOWS`** (son champ `venue` est un libellé, pas une adresse — sinon on crée `/lieux/300-lieux-dans-amsterdam` et des pages `/show/` fantômes). Corollaire : `venueEn?` sur `RaveEvent` + `venueLabelL()` / `eventVenueL()` dans `lib/data.ts`, pour qu'un libellé français ne fuite pas sur `/en`.
- **Build** : `cd raveradar-next && npm run build` (doit rester vert ; ~7 000 pages statiques actuellement — comptez plusieurs minutes).
- **Pages** : `/`, `/explore`, `/genres` + `/genres/{g}`, `/villes` + `/rave-party/{lieu}`, `/pays` + `/pays/{pays}`, `/rave-party/ce-week-end`, `/rave-party/autour-de-moi`, `/festival/{slug}` (festival nommé OU lieu), `/artistes` + `/artistes/{slug}`, `/lieux` + `/lieux/{slug}`, `/show/{artiste-lieu-date}`, `/map`, `/organizer`, `/account`. Menu : Explorer · Genres · Villes · Pays · Artistes · Carte.
- **Pays** : `lib/countries.ts` dérive l'index des pays du calendrier — un pays sans événement n'a pas de page, donc pas de coquille vide au sitemap. Slug construit sur le libellé FR (`/pays/pays-bas`). Tout nouveau pays doit entrer dans `COUNTRY_FR` **et** `COUNTRY_FLAG`.

## Règle de contenu
Aucune donnée inventée : dates, line-ups, lieux et prix doivent être vérifiés (site officiel, RA, Songkick, presse). Line-up non annoncé → `lineup: []` (« Programmation à venir »). Prix non confirmé → `priceNote`. Coordonnées introuvables → on n'ajoute pas l'événement.

**Le titre porte le festival, pas l'édition.** « Ultra Europe », jamais « Ultra Europe 2027 » : `nextEdition()` et le slug canonique regroupent les éditions par titre exact, et le gabarit de `<title>` ajoute déjà l'année.

## Ajouter des événements en masse
1. Un agent de recherche par région écrit un JSON dans **`raveradar-next/.research/`** (versionné : le répertoire temporaire de session a déjà été purgé en cours de route, emportant 120 événements). Lui demander d'**écrire dès les 5 premiers puis toutes les ~5 fiches**, jamais une seule écriture finale.
2. `python3 .research/merge.py --dry` puis sans `--dry`. Le script déduplique sur (titre normalisé, année), valide schéma et genres, rejette les dates passées, et normalise titre/ville/devise **avant** la clé de dédup.
3. Lancer l'audit d'intégrité (ids, slugs, genres, drapeaux, coordonnées, devise, `descEn`) — c'est lui qui a rattrapé 60 fiches en `currency: "EUR"` qui se seraient affichées « EUR55 ».
4. Ajouter les nouvelles villes à `PLACES` et vérifier `COUNTRY_FR`/`COUNTRY_FLAG`.
5. Recrawler les liens internes : aucun 404 toléré.
6. Penser à remonter le cutoff de date dans `merge.py` (`"already over"`) à la date du jour.

**Sources exploitables depuis le conteneur.** Le proxy sortant se fait bloquer (403/429) par
Resident Advisor, Shotgun, agendaculturel.fr et infoconcert ; Chromium/Playwright n'a aucun accès
réseau, donc les sites de clubs rendus en JS (Rex Club, Stereolux…) sont hors de portée. Ce qui
marche : **`jds.fr`** (agenda `/agenda/electro-335_B`, paginé, fiches `…_A` avec date, salle, ville,
horaire **et tarif** — la meilleure source FR), les sites officiels de festivals, `touslesfestivals.com`,
`songkick.com`, `skiddle.com`. Hors France, les **agendas de salles** sont server-rendered et donnent
tout d'un coup : `thewarehouseproject.com/calendar/` (dates + horaires exacts), `drumshedslondon.com/whats-on/`
et `thuishaven.nl` (line-up, horaires, prix). Quand une source ne donne pas l'année (Drumsheds affiche
« SAT 19 SEP »), la **déduire en vérifiant le jour de semaine** plutôt que la supposer. Conséquence : en août, les dates FR de janvier-mars suivant sont
majoritairement non annoncées — ne pas les inventer, la fenêtre réellement exploitable est J+1 à J+6 mois.

**Ne pas croire un agent sur parole.** Vérifier les affirmations à faible source avant publication : une « correction » proposée sur Rampage 2027 (5-6 mars) était fausse, le site officiel confirme 5-7 mars.

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
4. ✅ Expansion paneuropéenne : 38 pays, ~320 dates à venir sur 12 mois. Baltes couverts **festivals uniquement** — les sites des clubs de Riga, Tallinn et Vilnius renvoient 403 côté serveur.
5. Brancher une vraie source de données / le formulaire organisateur en base — **c'est le vrai prochain chantier** : le calendrier est aujourd'hui saisi à la main et devra être rafraîchi. Pistes : API Resident Advisor, Songkick, Bandsintown, ou scraping des billetteries.
6. Départements à fort volume encore vides, faute d'événement légal vérifiable : **Lot (5,4k), Aude (4,4k), Lozère (4,4k), Tarn, Aveyron, Hautes-Alpes**. Leurs pages existent mais affichent « pas encore d'événement ». L'**Ain** est sorti de cette liste (Crazy New Year, réveillon techno à Bourg-en-Bresse). Villes listées encore vides : **Nice, Grenoble**.
7. Compléter les affiches IA : ~300 événements à venir tombent encore sur le dégradé de genre (2 crédits Higgsfield par image).
8. Prix : une bonne moitié du catalogue porte `priceNote: "estimated"`. Les confirmer sur les billetteries officielles au fil de l'eau.
