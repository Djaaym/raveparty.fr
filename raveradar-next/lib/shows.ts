import { EVENTS, slugify, todayISO } from "./data";
import { guideFor } from "./guides";

export interface Show {
  slug: string; // {artist}-{venue}-{YYYYMMDD}
  artistName: string;
  artistSlug: string;
  eventId: number;
  venue: string;
  venueEn?: string;
  venueSlug: string;
  city: string;
  country: string;
  date: string;
  endDate: string; // last day of the parent event (== date for one-nighters)
}

/* One "show" per artist appearance (artist × venue × date) — the JamBase model. */
function build(): Show[] {
  const shows: Show[] = [];
  const seen = new Set<string>();
  for (const e of EVENTS) {
    // A week-long, city-wide programme isn't an artist × venue × date booking —
    // its own sub-events carry the real shows.
    if (guideFor(e)) continue;
    const venueSlug = slugify(e.venue);
    const d = e.date.replace(/-/g, "");
    for (const raw of e.lineup) {
      const artistName = raw.trim();
      const artistSlug = slugify(artistName);
      if (!artistSlug || !venueSlug) continue;
      const slug = `${artistSlug}-${venueSlug}-${d}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      shows.push({
        slug,
        artistName,
        artistSlug,
        eventId: e.id,
        venue: e.venue,
        venueEn: e.venueEn,
        venueSlug,
        city: e.city,
        country: e.country,
        date: e.date,
        endDate: e.endDate ?? e.date,
      });
    }
  }
  return shows;
}

export const SHOWS: Show[] = build();
export const showBySlug = (s: string): Show | undefined => SHOWS.find((x) => x.slug === s);

const ARTIST_SLUGS: string[] = [...new Set(SHOWS.map((x) => x.artistSlug))].sort(
  (a, b) => b.length - a.length,
);

/**
 * A show URL that no longer resolves — the venue was renamed or the line-up
 * corrected after Google had indexed the page. The slug still carries the
 * artist ({artist}-{venue}-{YYYYMMDD}), so recover it and let the route send a
 * 301 to that artist rather than serving a 404 to traffic we already earned.
 */
export function artistFromDeadShowSlug(slug: string): string | null {
  const head = /^(.+)-\d{8}$/.exec(slug)?.[1] ?? slug;
  // Longest match first: "amelie-lens" must win over a hypothetical "amelie".
  return ARTIST_SLUGS.find((a) => head === a || head.startsWith(`${a}-`)) ?? null;
}

/** Upcoming shows first (soonest → latest), then past ones (most recent → oldest). */
function byUpcomingFirst(list: Show[]): Show[] {
  const ref = todayISO();
  const soon = list.filter((s) => s.endDate >= ref).sort((a, b) => a.date.localeCompare(b.date));
  const done = list.filter((s) => s.endDate < ref).sort((a, b) => b.date.localeCompare(a.date));
  return [...soon, ...done];
}

export const showsForArtist = (artistSlug: string): Show[] =>
  byUpcomingFirst(SHOWS.filter((x) => x.artistSlug === artistSlug));
export const showsForVenue = (venueSlug: string): Show[] =>
  byUpcomingFirst(SHOWS.filter((x) => x.venueSlug === venueSlug));
