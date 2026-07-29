import type { RaveEvent } from "./types";
import { EVENTS, slugify, upcomingFirst } from "./data";

export interface Artist {
  slug: string;
  name: string;
  eventIds: number[];
  genres: string[];
  countries: string[];
}

/* Build the artist index from every event line-up (the artist ↔ festival mesh). */
function buildArtists(): Artist[] {
  const map = new Map<string, Artist & { _g: Set<string>; _c: Set<string> }>();
  for (const e of EVENTS) {
    for (const raw of e.lineup) {
      const name = raw.trim();
      const slug = slugify(name);
      if (!slug) continue;
      let a = map.get(slug);
      if (!a) {
        a = { slug, name, eventIds: [], genres: [], countries: [], _g: new Set(), _c: new Set() };
        map.set(slug, a);
      }
      a.eventIds.push(e.id);
      e.genres.forEach((g) => a!._g.add(g));
      a._c.add(e.country);
    }
  }
  return [...map.values()]
    .map((a) => ({ slug: a.slug, name: a.name, eventIds: a.eventIds, genres: [...a._g], countries: [...a._c] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const ARTISTS: Artist[] = buildArtists();

export const artistBySlug = (slug: string): Artist | undefined => ARTISTS.find((a) => a.slug === slug);

export const eventsForArtist = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => e.lineup.some((n) => slugify(n.trim()) === slug)));

/** Other artists that share at least one genre (for the internal-linking "discover" block). */
export const relatedArtists = (a: Artist, limit = 6): Artist[] =>
  ARTISTS.filter((x) => x.slug !== a.slug && x.genres.some((g) => a.genres.includes(g)))
    .sort((x, y) => y.eventIds.length - x.eventIds.length)
    .slice(0, limit);
