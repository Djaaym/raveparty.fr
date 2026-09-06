import type { Metadata } from "next";
import type { Lang, RaveEvent } from "./types";
import { OG_DEFAULT, SITE_URL } from "./site";
import { countryLabel, eventDescL, eventPath, eventVenueL, imageUrl, isPast, lastDay, slugify, ticketUrl } from "./data";
import { hasArtistPage } from "./artists";

/* ---------------------------------------------------------------------------
   Canonical URLs + hreflang.
   Every page exists twice (FR at `/…`, EN at `/en/…`). Search engines need the
   canonical of the variant they're on plus the alternates, otherwise the two
   trees compete with each other.
--------------------------------------------------------------------------- */

/** `path` is the language-agnostic path, e.g. "/festival/dour-festival" or "" for home. */
export function alternates(path: string, lang: Lang): Metadata["alternates"] {
  const clean = path === "/" ? "" : path;
  return {
    canonical: `${SITE_URL}${lang === "en" ? "/en" : ""}${clean}` || SITE_URL,
    languages: {
      "fr-FR": `${SITE_URL}${clean}` || SITE_URL,
      "en-GB": `${SITE_URL}/en${clean}`,
      "x-default": `${SITE_URL}${clean}` || SITE_URL,
    },
  };
}

/**
 * Le couple canonique + hreflang quand les deux langues n'ont **pas le même chemin**.
 *
 * `alternates()` suppose une URL identique à un préfixe près, ce qui est vrai des
 * pages tirées du catalogue (`/festival/{slug}` est le même slug partout). Ça devient
 * faux dès qu'une page a un titre traduit : `/a-propos` et `/en/about` sont la même
 * page, et se déclarer l'un l'autre est précisément ce à quoi sert `hreflang`. Sans
 * cette variante, la page anglaise annoncerait une alternative française qui n'existe
 * pas, ce qui invalide la paire entière aux yeux de Google.
 *
 * Les deux chemins sont donnés en entier, préfixe `/en` compris pour l'anglais.
 */
export function alternatesPair(frPath: string, enPath: string, lang: Lang): Metadata["alternates"] {
  const fr = `${SITE_URL}${frPath}`;
  const en = `${SITE_URL}${enPath}`;
  return {
    canonical: lang === "en" ? en : fr,
    languages: { "fr-FR": fr, "en-GB": en, "x-default": fr },
  };
}

/** Title + description + canonical/hreflang + Open Graph in one call. */
/**
 * Le titre tel qu'il part dans la SERP et l'onglet — tirets normalisés.
 *
 * Le cadratin (« RaveRadar — Rave parties… ») est correct en typographie française,
 * mais c'est un titre de recherche qu'on écrit ici, pas un paragraphe : Google le
 * tronque à la largeur, pas au caractère, et le cadratin y prend la place de trois
 * signes pour séparer ce qu'un trait d'union sépare aussi bien. On l'écrit donc `-`
 * partout, en français comme en anglais.
 *
 * Normaliser ici plutôt qu'à chaque appel, c'est la seule version qui tienne : les
 * titres sont écrits dans une quarantaine de fichiers de route, et la moitié
 * interpolent du catalogue (`e.title`, `v.name`) où le cadratin est légitime — « BLITZ
 * Closing Weekend — That's All Folks » est le vrai nom de la soirée, il ne se corrige
 * pas dans `lib/data.ts` sans casser son slug et sa clé de dédup. Il se corrige au
 * moment où il devient un titre de page, et nulle part ailleurs.
 *
 * Seul le titre est concerné : une description est une phrase, le cadratin y garde son
 * usage. `scripts/check-titles.mjs` tient la règle côté build.
 */
export const seoTitle = (t: string): string => t.replace(/[\u2012-\u2015]/g, "-").replace(/\s{2,}/g, " ").trim();

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  lang: Lang;
  image?: string | null;
  /** Pour une page dont les deux langues n'ont pas le même chemin (voir `alternatesPair`). */
  alternates?: Metadata["alternates"];
}): Metadata {
  const { description, path, lang, image, alternates: alt } = opts;
  const title = seoTitle(opts.title);
  const url = `${SITE_URL}${lang === "en" ? "/en" : ""}${path === "/" ? "" : path}`;
  /* Une page sans visuel propre reçoit celui du site plutôt que rien : sans image, le
     partage sort en carte étroite et sans vignette, ce qui est le format qu'on ignore
     dans un fil de discussion. Voir `OG_DEFAULT`. */
  const img = image ?? OG_DEFAULT;
  return {
    title,
    description,
    alternates: alt ?? alternates(path, lang),
    openGraph: {
      title,
      description,
      url,
      siteName: "RaveRadar",
      locale: lang === "en" ? "en_GB" : "fr_FR",
      type: "website",
      images: [{ url: img }],
    },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

/**
 * La meta description d'une fiche, annoncée « Édition terminée » quand elle l'est.
 *
 * La page porte le bandeau depuis toujours, la SERP non : le snippet d'une archive
 * ressemblait trait pour trait à celui de l'édition en cours, avec le même titre à
 * l'année près, et se faisait donc cliquer à sa place. Le dire coûte dix-huit
 * caractères et évite d'envoyer un lecteur sur une date passée, ce qui est le pire
 * défaut possible pour un annuaire.
 *
 * La coupe à 160 se fait **après** le préfixe : c'est la longueur totale que Google
 * tronque, la calculer sur le texte seul rendrait une description plus longue que
 * prévu. `text` permet à une fiche qui écrit sa propre description (un guide de
 * festival) de garder la sienne sans perdre la mention.
 */
export function eventMetaDesc(e: RaveEvent, lang: Lang, text?: string): string {
  const body = text ?? eventDescL(e, lang);
  const prefix = isPast(e) ? (lang === "fr" ? "Édition terminée. " : "Past edition. ") : "";
  return `${prefix}${body}`.slice(0, 160);
}

/* ---------------------------------------------------------------------------
   JSON-LD
--------------------------------------------------------------------------- */

/**
 * Le code ISO de la devise d'un montant, pour `offers.priceCurrency`.
 *
 * Le calcul tenait en une ligne (`£` → GBP, `$` → USD, tout le reste → EUR), ce qui
 * était juste tant que le catalogue ne connaissait que trois devises. Depuis
 * l'ouverture de Prague, Varsovie, Oslo, Lausanne, Budapest et Belgrade, **65 fiches**
 * portaient un prix en CHF, Kč, kr, zł, Ft, RSD ou lei, et toutes déclaraient à Google
 * un montant en euros : « 490 Kč » (environ 20 €) partait dans les données structurées
 * comme « 490 EUR ». Ce n'est pas une approximation, c'est un prix faux publié dans le
 * champ que lisent les résultats enrichis.
 *
 * La règle du projet est de stocker le symbole qu'on paie à l'entrée et de ne jamais
 * convertir (voir l'en-tête de `priceLabel()`). Le JSON-LD, lui, exige un code ISO
 * 4217 : c'est une traduction du symbole, pas une conversion du montant.
 *
 * `kr` est rendu **NOK** parce que les seules dates du catalogue qui l'emploient sont
 * norvégiennes ; le jour où une date suédoise ou danoise arrive, ce raccourci devient
 * faux et la couronne devra être distinguée à la saisie, pas ici.
 */
const ISO_CURRENCY: Record<string, string> = {
  "€": "EUR", "£": "GBP", "$": "USD", "CHF": "CHF", "Kč": "CZK",
  "zł": "PLN", "kr": "NOK", "Ft": "HUF", "RSD": "RSD", "lei": "RON",
};

const abs = (lang: Lang, path: string) => `${SITE_URL}${lang === "en" ? "/en" : ""}${path}`;

/** A nested event reference, enough for `subEvent` / `superEvent` without repeating a full node. */
const eventRef = (e: RaveEvent, lang: Lang) => ({
  "@type": "MusicEvent",
  name: e.title,
  startDate: `${e.date}T${e.time}:00`,
  endDate: `${lastDay(e)}T23:59:00`,
  url: abs(lang, eventPath(e)),
  location: {
    "@type": "Place",
    name: eventVenueL(e, lang),
    address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: e.country },
  },
});

/** schema.org MusicEvent, what makes an event eligible for Google's event rich results.
 *  `subEvents` / `superEvent` tie a week-long programme to the parties inside it: the
 *  umbrella is typed as a Festival, each night points back at it. */
export function eventJsonLd(
  e: RaveEvent,
  lang: Lang,
  opts: { subEvents?: RaveEvent[]; superEvent?: RaveEvent; sameAs?: string[] } = {},
) {
  const img = imageUrl(e);
  const tickets = ticketUrl(e);
  const { subEvents, superEvent, sameAs } = opts;
  return {
    "@context": "https://schema.org",
    "@type": subEvents?.length ? ["MusicEvent", "Festival"] : "MusicEvent",
    name: e.title,
    description: eventDescL(e, lang),
    startDate: `${e.date}T${e.time}:00`,
    endDate: `${lastDay(e)}T23:59:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: abs(lang, eventPath(e)),
    ...(img ? { image: [img] } : {}),
    // Les profils officiels du festival, jamais ceux de la salle qui l'accueille :
    // `sameAs` déclare que c'est la *même entité*, pas qu'elles se côtoient.
    ...(sameAs?.length ? { sameAs } : {}),
    ...(subEvents?.length ? { subEvent: subEvents.map((x) => eventRef(x, lang)) } : {}),
    ...(superEvent ? { superEvent: eventRef(superEvent, lang) } : {}),
    location: {
      "@type": "Place",
      name: eventVenueL(e, lang),
      address: {
        "@type": "PostalAddress",
        addressLocality: e.city,
        ...(e.region ? { addressRegion: e.region } : {}),
        addressCountry: e.country,
      },
      geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng },
    },
    ...(e.lineup.length
      ? {
          /* `url` seulement quand la fiche existe. Un nom ajouté par une correction en
             direct (`lib/event-edits.ts`) n'entre dans `ARTISTS` qu'au prochain
             déploiement : déclarer son URL à Google avant qu'elle ne réponde reviendrait
             à mettre un 404 dans les données structurées de la page. Le `performer` reste
             annoncé, avec son nom, ce qui est simplement vrai. */
          performer: e.lineup.map((a) => {
            const slug = slugify(a.trim());
            return {
              "@type": "MusicGroup",
              name: a.trim(),
              ...(hasArtistPage(slug) ? { url: abs(lang, `/artistes/${slug}`) } : {}),
            };
          }),
        }
      : {}),
    /* Pas de champ `organizer`. Il annonçait « RaveRadar » sur les 1 289 fiches, ce qui
       déclarait à Google que nous organisons chacun de ces événements : nous en tenons
       l'annuaire, ce n'est pas la même affirmation, et c'est celle qui est fausse. Le
       vrai organisateur n'est pas une donnée du catalogue (`RaveEvent` ne porte pas le
       champ), et un champ absent est exact là où un champ faux ne l'est pas. Le jour où
       un dépôt de promoteur apporte le nom de la structure, il se déclare ici. */
    offers: {
      "@type": "Offer",
      // An unconfirmed gate price is left out rather than published as fact.
      ...(e.priceNote === "unknown" ? {} : { price: e.price }),
      priceCurrency: ISO_CURRENCY[e.currency] ?? "EUR",
      availability: isPast(e) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: tickets ?? abs(lang, eventPath(e)),
      validFrom: `${e.date}T00:00:00`,
      /* La date au-delà de laquelle l'offre ne vaut plus, c'est la fin de l'événement :
         sans elle, une offre reste « valide » indéfiniment dans les données structurées,
         y compris sur une archive de 2026. */
      validThrough: `${lastDay(e)}T23:59:00`,
    },
    isAccessibleForFree: e.price === 0 && !e.priceNote,
  };
}

/** Breadcrumbs: pass [label, path] pairs; "Accueil" / "Home" is prepended for you. */
export function breadcrumbJsonLd(trail: [string, string][], lang: Lang) {
  const all: [string, string][] = [[lang === "en" ? "Home" : "Accueil", "/"], ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: abs(lang, path === "/" ? "" : path),
    })),
  };
}

/** An ordered list of events, helps hub pages (city, genre, venue) get parsed as listings. */
/** An ItemList of events is carousel-eligible, so it is a highlight in Google's eyes:
 *  finished editions are filtered out here rather than at each call site, because the
 *  page below may legitimately list its archive while the carousel must not. Returns
 *  `null` when nothing is left, `<JsonLd>` skips it, so no empty ItemList is emitted. */
export function itemListJsonLd(events: RaveEvent[], lang: Lang, name: string, ref?: string) {
  const live = events.filter((e) => !isPast(e, ref));
  if (!live.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: live.length,
    itemListElement: live.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.title,
      url: abs(lang, eventPath(e)),
    })),
  };
}

/** FAQPage from [question, answer] pairs, targets the "People also ask" block. */
export function faqJsonLd(qa: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** Site-level identity + the search box sitelink. Rendered once, on the home page. */
export function siteJsonLd(lang: Lang) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "RaveRadar",
      url: SITE_URL,
      inLanguage: lang === "en" ? "en-GB" : "fr-FR",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/explore?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "RaveRadar",
      url: SITE_URL,
      /* Le logo de l'organisation, en absolu : c'est le champ que Google lit pour la
         vignette de marque, et il est indépendant de la favicon (celle-ci décide de
         l'icône du résultat de recherche, celui-là du panneau de connaissance). Une
         URL relative n'y serait pas résolue — même règle que `imageUrl()`. */
      logo: `${SITE_URL}/icon-512.png`,
      description:
        lang === "en"
          ? "Directory of electronic music events across Europe: festivals, clubs and warehouses."
          : "L'annuaire des événements de musique électronique en Europe : festivals, clubs et warehouses.",
    },
  ];
}

/** An artist as a schema.org MusicGroup, with the dates they're booked for. */
/**
 * `genre` est passé par l'appelant, et ce n'est pas un détail : il valait
 * `events.flatMap(e => e.genres)`, c'est-à-dire l'union des styles de toutes les
 * affiches où l'artiste apparaît. Déclarer à Google qu'un producteur de techno
 * industrielle fait de la psytrance parce qu'il a joué un festival multi-genres est
 * une affirmation sur une personne réelle, pas une approximation d'affichage. La page
 * envoie donc `artistGenres()` + `artistSubGenres()`, l'attribution, pas la déduction.
 */
export function artistJsonLd(
  name: string,
  slug: string,
  events: RaveEvent[],
  lang: Lang,
  sameAs: string[] = [],
  genre: string[] = [],
) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name,
    url: abs(lang, `/artistes/${slug}`),
    ...(sameAs.length ? { sameAs } : {}),
    ...(genre.length ? { genre } : {}),
    event: events.map((e) => ({
      "@type": "MusicEvent",
      name: e.title,
      startDate: `${e.date}T${e.time}:00`,
      url: abs(lang, eventPath(e)),
      location: {
        "@type": "Place",
        name: eventVenueL(e, lang),
        address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: e.country },
      },
    })),
  };
}

/** A venue as a schema.org MusicVenue. */
export function venueJsonLd(
  venue: { name: string; slug: string; city: string; country: string },
  events: RaveEvent[],
  lang: Lang,
  sameAs: string[] = [],
) {
  const first = events[0];
  return {
    "@context": "https://schema.org",
    "@type": "MusicVenue",
    name: venue.name,
    url: abs(lang, `/lieux/${venue.slug}`),
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: venue.city,
      addressCountry: venue.country,
    },
    ...(first ? { geo: { "@type": "GeoCoordinates", latitude: first.lat, longitude: first.lng } } : {}),
    event: events.map((e) => ({
      "@type": "MusicEvent",
      name: e.title,
      startDate: `${e.date}T${e.time}:00`,
      url: abs(lang, eventPath(e)),
    })),
  };
}

/** Convenience for building the "X à Y" label used in breadcrumbs and headings. */
export const countryName = (c: string, lang: Lang) => countryLabel(c, lang);
