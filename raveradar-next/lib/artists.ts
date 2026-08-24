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

/* Index par id, monté une fois : artistGenres() est appelé pour les 1 860 artistes
   au build, et reconstruire la table à chaque appel coûterait 1,6 million de lectures. */
const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

/**
 * Les genres de l'artiste, classés par un score pondéré.
 *
 * `Artist.genres` est une *union* : un festival étiqueté sur huit styles étiquette du
 * même coup les cinquante noms de son affiche sur les huit. Le jeu brut affirme donc
 * qu'I Hate Models joue de la psytrance, ce qui est faux — et l'afficher tel quel
 * serait exactement le genre de donnée inventée que la règle de contenu interdit.
 *
 * Compter les occurrences ne suffit pas : les gros festivals sont nombreux *et*
 * multi-genres, donc « House » et « EDM » remontaient sur des artistes techno par le
 * seul volume. Chaque date vaut donc 1 point à répartir entre ses genres : une soirée
 * de club étiquetée « Hard Techno » seule donne 1 à Hard Techno, un festival à huit
 * styles donne 0,125 à chacun. Le signal fort est celui de l'affiche mono-genre, ce
 * qui est exactement la réalité — c'est là que l'artiste est booké *pour* ce style.
 *
 * Et on coupe sous 20 % du meilleur score : mieux vaut deux genres justes que cinq
 * dont trois sont du bruit d'étiquetage.
 */
export function artistGenres(a: Artist): string[] {
  const score = new Map<string, number>();
  for (const id of a.eventIds) {
    const g = BY_ID.get(id)?.genres ?? [];
    if (!g.length) continue;
    for (const name of g) score.set(name, (score.get(name) ?? 0) + 1 / g.length);
  }
  const ranked = [...score.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  const floor = (ranked[0]?.[1] ?? 0) * 0.2;
  return ranked.filter(([, v]) => v >= floor).map(([g]) => g);
}

export const artistBySlug = (slug: string): Artist | undefined => ARTISTS.find((a) => a.slug === slug);

export const eventsForArtist = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => e.lineup.some((n) => slugify(n.trim()) === slug)));

/** Other artists that share at least one genre (for the internal-linking "discover" block). */
export const relatedArtists = (a: Artist, limit = 6): Artist[] =>
  ARTISTS.filter((x) => x.slug !== a.slug && x.genres.some((g) => a.genres.includes(g)))
    .sort((x, y) => y.eventIds.length - x.eventIds.length)
    .slice(0, limit);
