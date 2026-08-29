import type { RaveEvent } from "./types";
import { EVENTS, rankGenres, slugify, upcomingFirst } from "./data";
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
 * dix-sept libellés, « Divers lieux, Rennes », « Salles multiples, Skopje »,
 * « 40 lieux dans toute la ville », avaient donc leur page `/lieux/{slug}`, nommée
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
    // City-wide programmes (ADE & co.) have no single venue, their `venue` field
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

/* Index par id, monté une fois : les helpers ci-dessous tournent sur les 515 salles
   au build, et reconstruire la table à chaque appel coûterait des centaines de
   milliers de lectures pour rien. */
const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

const eventsOf = (v: Venue): RaveEvent[] =>
  v.eventIds.map((id) => BY_ID.get(id)).filter((e): e is RaveEvent => Boolean(e));

/** Ce que la salle programme, pondéré, voir `rankGenres` (lib/data.ts) pour le calcul. */
export const venueGenres = (v: Venue): string[] => rankGenres(eventsOf(v));

/**
 * Les habitués : les noms qui reviennent le plus souvent sur les affiches du lieu.
 *
 * C'est ce qui décrit vraiment un club, mieux que sa ville et son compte de dates.
 * Un nom vu une seule fois n'est pas un habitué, d'où `min` : sur une salle qui n'a
 * que deux dates au catalogue, tout le monde serait « régulier », ce qui ne veut plus
 * rien dire. Rendu vide plutôt que faux.
 */
export function venueRegulars(v: Venue, n: number, min = 2): { name: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const e of eventsOf(v)) for (const raw of e.lineup) {
    const name = raw.trim();
    if (name) tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  return [...tally.entries()]
    .filter(([, c]) => c >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/** Le type dominant des dates du lieu : Club, Warehouse ou Festival. */
export function venueKind(v: Venue): RaveEvent["type"] | undefined {
  const tally = new Map<RaveEvent["type"], number>();
  for (const e of eventsOf(v)) tally.set(e.type, (tally.get(e.type) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
