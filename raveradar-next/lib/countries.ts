import type { Lang, RaveEvent } from "./types";
import { COUNTRY_FR, EVENTS, slugify, upcomingFirst } from "./data";

/** A country that actually has at least one event listed. */
export interface Country {
  slug: string; // URL slug → /pays/{slug}
  name: string; // canonical English name, as stored on the event
  eventIds: number[];
}

/* The country index is derived from the calendar, so a country page only exists
   once we have something to put on it — no empty shells in the sitemap. */
function build(): Country[] {
  const m = new Map<string, Country>();
  for (const e of EVENTS) {
    // Slug from the French label so the FR site gets /pays/pays-bas, not /pays/netherlands.
    const slug = slugify(COUNTRY_FR[e.country] ?? e.country);
    let c = m.get(slug);
    if (!c) {
      c = { slug, name: e.country, eventIds: [] };
      m.set(slug, c);
    }
    c.eventIds.push(e.id);
  }
  return [...m.values()].sort((a, b) => b.eventIds.length - a.eventIds.length);
}

export const COUNTRIES_INDEX: Country[] = build();
export const countryBySlug = (s: string): Country | undefined => COUNTRIES_INDEX.find((c) => c.slug === s);
export const eventsForCountry = (name: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => e.country === name));

/** Display label for a country in the active language. */
export const countryName = (name: string, lang: Lang): string => (lang === "fr" ? COUNTRY_FR[name] ?? name : name);
