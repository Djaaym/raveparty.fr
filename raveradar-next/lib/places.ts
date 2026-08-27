import type { RaveEvent } from "./types";
import { EVENTS, slugify, upcoming, upcomingFirst } from "./data";
import type { Place } from "./places-list";
import { PLACES } from "./places-list";
export * from "./places-list";


/** Events located in a given place (matched by city name or French region/department).
 *  Matching is on whole slugs, not substrings — "Ain" is a substring of "Saintes",
 *  and "Nord" of plenty of city names. */
export function eventsForPlace(p: Place): RaveEvent[] {
  const names = (p.match ?? [p.label]).map(slugify);
  return upcomingFirst(
    EVENTS.filter((e) => {
      const hay = [slugify(e.city), slugify(e.region ?? "")];
      return names.some((n) => hay.includes(n));
    }),
  );
}

/** Rank places by how many of `events` they hold, busiest first.
 *
 *  The count is what makes a place link honest: a pill that promises a town and lands
 *  on "pas encore d'événement" is worth less than no link at all. Overlapping places
 *  are collapsed — "Rhône" holds exactly the dates "Lyon" just showed, so listing both
 *  says the same thing twice.
 *
 *  `country` is the majority country of the place's own dates in `events`, not a field
 *  on Place: it exists so a caller can lead with France (the priority market) instead
 *  of handing a French reader Amsterdam, Manchester and Cologne — which is what a plain
 *  count ranking does, the calendar being what it is. */
export function rankPlaces(events: RaveEvent[], n: number): { place: Place; count: number; country: string }[] {
  const ranked = PLACES.map((place) => {
    const names = (place.match ?? [place.label]).map(slugify);
    const held = events.filter((e) => names.some((x) => [slugify(e.city), slugify(e.region ?? "")].includes(x)));
    const tally = new Map<string, number>();
    held.forEach((e) => tally.set(e.country, (tally.get(e.country) ?? 0) + 1));
    const country = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    return { place, held, country };
  })
    .filter((x) => x.held.length > 0)
    .sort((a, b) => b.held.length - a.held.length || b.place.vol - a.place.vol);

  const seen = new Set<number>();
  const out: { place: Place; count: number; country: string }[] = [];
  for (const { place, held, country } of ranked) {
    if (out.length >= n) break;
    if (held.every((e) => seen.has(e.id))) continue; // fully covered by a place already listed
    held.forEach((e) => seen.add(e.id));
    out.push({ place, count: held.length, country });
  }
  return out;
}

/** The shortlist the home page shows instead of dumping all 90 places in columns.
 *  The exhaustive list has not moved — it lives on /villes, filterable, one click away. */
export const topPlaces = (n: number, today?: string) => rankPlaces(upcoming(EVENTS, today), n);
