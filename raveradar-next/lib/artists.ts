import type { RaveEvent } from "./types";
import { EVENTS, rankGenres, slugify, upcomingFirst } from "./data";

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

/* Index par id, monté une fois : artistGenres() est appelé pour les 1 860 artistes
   au build, et reconstruire la table à chaque appel coûterait 1,6 million de lectures. */
const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

/**
 * Les genres de l'artiste, classés par le score pondéré de `rankGenres()`.
 *
 * `Artist.genres` est une *union* et ne doit jamais être affichée telle quelle : un
 * festival étiqueté sur huit styles étiquette du même coup les cinquante noms de son
 * affiche. Le détail du calcul, et pourquoi un simple comptage ne suffit pas, sont
 * documentés sur `rankGenres` dans lib/data.ts.
 */
export function artistGenres(a: Artist): string[] {
  return rankGenres(a.eventIds.map((id) => BY_ID.get(id)).filter((e): e is RaveEvent => Boolean(e)));
}

export const artistBySlug = (slug: string): Artist | undefined => ARTISTS.find((a) => a.slug === slug);

export const eventsForArtist = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => e.lineup.some((n) => slugify(n.trim()) === slug)));

/** Other artists that share at least one genre (for the internal-linking "discover" block). */
export const relatedArtists = (a: Artist, limit = 6): Artist[] =>
  ARTISTS.filter((x) => x.slug !== a.slug && x.genres.some((g) => a.genres.includes(g)))
    .sort((x, y) => y.eventIds.length - x.eventIds.length)
    .slice(0, limit);
