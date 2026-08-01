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
