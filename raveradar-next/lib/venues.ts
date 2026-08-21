import type { RaveEvent } from "./types";
import { EVENTS, slugify, upcomingFirst } from "./data";
import { guideFor } from "./guides";

export interface Venue {
  slug: string;
  name: string;
  nameEn?: string;
  city: string;
  country: string;
  region?: string;
  eventIds: number[];
}

/**
 * Un `venue` qui décrit un ensemble de lieux n'est pas une salle.
 *
 * L'exclusion des programmes-ombrelles ne tenait qu'au fait qu'ils portent un guide
 * (`guideFor`), or un festival éclaté dans toute une ville n'en a pas forcément un :
 * dix-sept libellés — « Divers lieux, Rennes », « Salles multiples, Skopje »,
 * « 40 lieux dans toute la ville » — avaient donc leur page `/lieux/{slug}`, nommée
 * d'après une périphrase et vide de tout ce qu'une fiche de salle promet (une
 * adresse, un agenda, des habitués). C'est le `/lieux/300-lieux-dans-amsterdam` que
 * la règle du projet interdit, arrivé par une autre porte.
 *
 * Le test porte sur des mots entiers : « Zénith Paris - La Villette » et « Fort de
 * Tourneville » sont de vraies salles, et une correspondance sur « ville » les
 * emporterait. Vérifié sur les 515 salles du catalogue : aucun faux positif.
 */
export const isMultiVenueLabel = (venue: string): boolean =>
  /\b(lieux|salles multiples|various venues|multiple venues|venues across|multiple locations)\b/i.test(venue);

function build(): Venue[] {
  const m = new Map<string, Venue>();
  for (const e of EVENTS) {
    // City-wide programmes (ADE & co.) have no single venue — their `venue` field
    // is a label, not an address, and would open a thin page of its own.
    if (guideFor(e) || isMultiVenueLabel(e.venue)) continue;
    const slug = slugify(e.venue);
    if (!slug) continue;
    let v = m.get(slug);
    if (!v) {
      v = { slug, name: e.venue, nameEn: e.venueEn, city: e.city, country: e.country, region: e.region, eventIds: [] };
      m.set(slug, v);
    }
    v.eventIds.push(e.id);
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const VENUES: Venue[] = build();
export const venueBySlug = (s: string): Venue | undefined => VENUES.find((v) => v.slug === s);
export const eventsForVenue = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => slugify(e.venue) === slug));
