# 🔊 RaveRadar — *The TripAdvisor of rave*

> Discover Europe's best electronic music events — techno, hardstyle, DnB, psytrance, free parties & warehouse raves, all in one immersive place.

A complete, production-quality concept + working website for an underground electronic-music event directory. Built in **vanilla HTML / CSS / JS** (zero build step) so it runs by just opening `index.html`.

---

## 🚀 Run it

No tooling required — it's static.

```bash
# Option 1: just open the file
open index.html

# Option 2: serve locally (recommended, so the map + ?id= links work cleanly)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> The only external dependencies are **Google Fonts** (Syne / Inter / Space Mono) and **Leaflet** (interactive map) via CDN. Everything else — including all imagery — is generated procedurally, so the site looks complete with no asset pipeline.

---

## 🗂 Pages

| File | Page | Highlights |
|------|------|------------|
| `index.html` | **Home** | Spectacular hero, instant search (city/country/date/genre), trending feed, genre tiles, stats, premium plans, newsletter |
| `explore.html` | **Explore** | Full directory + advanced filters (country, genre, type, price, sort) and grid/list views |
| `map.html` | **Map** | Interactive dark map of Europe (Leaflet) with genre filtering and a synced side list |
| `event.html` | **Event detail** | Poster hero, description, line-up, gallery, mini-map, sticky ticket box, related events (`event.html?id=N`) |
| `organizer.html` | **Organizer studio** | Multi-step publish form, line-up manager, media upload, ticketing, **live card preview** |
| `account.html` | **User space** | Favourites, custom alerts, history, settings (tabs) |

---

## 🎨 Art direction

**Vibe:** liberty · energy · night · underground · mystery · community · adrenaline · discovery.
**References:** Resident Advisor, Boiler Room, HÖR Berlin, Verknipt, Awakenings, Possession, Intercell.
Warehouses, neon, lasers, strobes, festival smoke, clandestine raves — deliberately **anti-corporate, anti-SaaS, anti-pastel**.

### Exact palette
| Token | Hex | Use |
|-------|-----|-----|
| Deep black | `#050608` | Base background |
| Anthracite | `#12131B` / `#181A24` | Cards / surfaces |
| Electric blue | `#2F7BFF` | Primary accent |
| Neon violet | `#8B5CFF` | Glows, gradients |
| Neon magenta | `#FF2D9B` | CTAs, highlights |
| Laser cyan | `#19E7FF` | Eyebrows, meta |
| Acid green | `#C6FF3D` | Free-party / live signals |
| Off-white | `#F3F3F8` | Text |

Signature gradient: `blue → violet → magenta`.

### Typography
- **Syne** (800) — display / headlines (editorial, underground).
- **Inter** — body copy.
- **Space Mono** — labels, metadata, the "machine/flyer" detail.

### Signature FX
Ambient drifting neon blobs · film-grain overlay · animated hero grid + laser sweep · glassmorphism search bar · neon-glow hover lift on cards · genre-colour-coded posters · scroll-reveal · running marquee · toast notifications.

---

## 🧩 Architecture

```
index.html · explore.html · map.html · event.html · organizer.html · account.html
assets/
 ├─ css/style.css   → full design system (tokens, components, responsive)
 └─ js/
     ├─ data.js     → 16 sample events across 12 genres + helpers (self-contained)
     └─ app.js      → routing-by-data-page, card rendering, filters, search,
                      favourites (localStorage), map, tabs, organizer, toasts
```

- **State** lives client-side; **favourites persist** in `localStorage` (`raveradar:favs`).
- Each page sets `<body data-page="…">`; `app.js` boots the matching module.
- Cards/rows share one template, used across home, explore, event-related and favourites.

---

## 🛣 User journey & FOMO design

`Land on hero → feel the energy → search or tap a genre → scan trending → open an event → see the line-up & price → save ♥ or get tickets → set an alert so you never miss the next one.`

FOMO levers: a **live counter** in the hero, "Trending this week 🔥", soonest-first sorting, **free-party "location revealed 24h before"**, alerts, and sold-out-style urgency.

Inspiration blend: **Spotify** (genre discovery), **Resident Advisor** (depth), **Boiler Room** (culture), **Airbnb Experiences** (cards + map + booking flow).

---

## 💎 Premium features & monetisation
- **Radar+ (€6/mo)** — artist/city alerts, ticket pre-sale access, ad-free, exclusive free-party drops, group itineraries.
- **Promoter (€39/mo)** — unlimited listings, featured placement, audience analytics, ticket integration, verified badge.
- Other rails: ticketing affiliate commissions, sponsored/boosted events, festival brand takeovers, data insights for promoters.

---

## 🏗 Recommended production stack (with rationale)

This demo is intentionally framework-free for instant review. For a real launch:

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router) + TypeScript** | SEO for event pages (critical for discovery), SSR/ISR, image optimisation |
| Styling | **Tailwind + Framer Motion** | Keeps this exact design system; fluid micro-interactions |
| Map | **MapLibre GL + custom dark style** | GPU vector tiles, clustering at scale |
| Backend / DB | **Supabase (Postgres + PostGIS + Auth)** | Geo queries for "near me", realtime, row-level security |
| Search | **Typesense / Algolia** | Instant typo-tolerant filtering across thousands of events |
| Media | **Cloudinary / Mux** | Posters + Boiler-Room-style video |
| Payments | **Stripe** | Subscriptions + ticketing affiliate payouts |
| Hosting | **Vercel + edge cache** | Global low latency for a pan-European audience |

---

*© 2026 RaveRadar — keep it underground.*
