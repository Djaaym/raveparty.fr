import { EVENTS, slugify } from "./data";

export interface Show {
  slug: string; // {artist}-{venue}-{YYYYMMDD}
  artistName: string;
  artistSlug: string;
  eventId: number;
  venue: string;
  venueSlug: string;
  city: string;
  country: string;
  date: string;
}

/* One "show" per artist appearance (artist × venue × date) — the JamBase model. */
function build(): Show[] {
  const shows: Show[] = [];
  const seen = new Set<string>();
  for (const e of EVENTS) {
    const venueSlug = slugify(e.venue);
    const d = e.date.replace(/-/g, "");
    for (const raw of e.lineup) {
      const artistName = raw.trim();
      const artistSlug = slugify(artistName);
      if (!artistSlug || !venueSlug) continue;
      const slug = `${artistSlug}-${venueSlug}-${d}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      shows.push({ slug, artistName, artistSlug, eventId: e.id, venue: e.venue, venueSlug, city: e.city, country: e.country, date: e.date });
    }
  }
  return shows;
}

export const SHOWS: Show[] = build();
export const showBySlug = (s: string): Show | undefined => SHOWS.find((x) => x.slug === s);
export const showsForArtist = (artistSlug: string): Show[] =>
  SHOWS.filter((x) => x.artistSlug === artistSlug).sort((a, b) => a.date.localeCompare(b.date));
export const showsForVenue = (venueSlug: string): Show[] =>
  SHOWS.filter((x) => x.venueSlug === venueSlug).sort((a, b) => a.date.localeCompare(b.date));
