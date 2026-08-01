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

function build(): Venue[] {
  const m = new Map<string, Venue>();
  for (const e of EVENTS) {
    // City-wide programmes (ADE & co.) have no single venue — their `venue` field
    // is a label, not an address, and would open a thin page of its own.
    if (guideFor(e)) continue;
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
