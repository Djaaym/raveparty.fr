import type { Metadata } from "next";
import type { Lang, RaveEvent } from "./types";
import { SITE_URL } from "./site";
import { countryLabel, eventDescL, eventPath, eventVenueL, imageUrl, isPast, lastDay, slugify, ticketUrl } from "./data";

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

/** Title + description + canonical/hreflang + Open Graph in one call. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  lang: Lang;
  image?: string | null;
}): Metadata {
  const { title, description, path, lang, image } = opts;
  const url = `${SITE_URL}${lang === "en" ? "/en" : ""}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: alternates(path, lang),
    openGraph: {
      title,
      description,
      url,
      siteName: "RaveRadar",
      locale: lang === "en" ? "en_GB" : "fr_FR",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/* ---------------------------------------------------------------------------
   JSON-LD
--------------------------------------------------------------------------- */

const abs = (lang: Lang, path: string) => `${SITE_URL}${lang === "en" ? "/en" : ""}${path}`;

/** A nested event reference — enough for `subEvent` / `superEvent` without repeating a full node. */
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

/** schema.org MusicEvent — what makes an event eligible for Google's event rich results.
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
          performer: e.lineup.map((a) => ({
            "@type": "MusicGroup",
            name: a.trim(),
            url: abs(lang, `/artistes/${slugify(a.trim())}`),
          })),
        }
      : {}),
    organizer: { "@type": "Organization", name: "RaveRadar", url: SITE_URL },
    offers: {
      "@type": "Offer",
      // An unconfirmed gate price is left out rather than published as fact.
      ...(e.priceNote === "unknown" ? {} : { price: e.price }),
      priceCurrency: e.currency === "£" ? "GBP" : e.currency === "$" ? "USD" : "EUR",
      availability: isPast(e) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: tickets ?? abs(lang, eventPath(e)),
      validFrom: `${e.date}T00:00:00`,
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

/** An ordered list of events — helps hub pages (city, genre, venue) get parsed as listings. */
export function itemListJsonLd(events: RaveEvent[], lang: Lang, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.title,
      url: abs(lang, eventPath(e)),
    })),
  };
}

/** FAQPage from [question, answer] pairs — targets the "People also ask" block. */
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
      description:
        lang === "en"
          ? "Directory of electronic music events across Europe: festivals, clubs, warehouses and free parties."
          : "L'annuaire des événements de musique électronique en Europe : festivals, clubs, warehouses et free parties.",
    },
  ];
}

/** An artist as a schema.org MusicGroup, with the dates they're booked for. */
export function artistJsonLd(name: string, slug: string, events: RaveEvent[], lang: Lang, sameAs: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name,
    url: abs(lang, `/artistes/${slug}`),
    ...(sameAs.length ? { sameAs } : {}),
    genre: [...new Set(events.flatMap((e) => e.genres))],
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
