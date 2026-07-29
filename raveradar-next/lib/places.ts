import type { RaveEvent } from "./types";
import { EVENTS, slugify, upcomingFirst } from "./data";

export type PlaceKind = "ville" | "departement" | "region";

export interface Place {
  slug: string; // URL slug → /rave-party/{slug}
  label: string; // display name
  kind: PlaceKind;
  vol: number; // approx monthly search volume for "rave party {label}"
  /** city names (in our event data) considered part of this place */
  match?: string[];
}

/* Prioritised from the SEMrush keyword export (see /docs/seo-keywords.md). */
export const PLACES: Place[] = [
  { slug: "lyon", label: "Lyon", kind: "ville", vol: 1000, match: ["Lyon"] },
  { slug: "paris", label: "Paris", kind: "ville", vol: 390, match: ["Paris", "Torcy"] },
  { slug: "rennes", label: "Rennes", kind: "ville", vol: 3600, match: ["Rennes"] },
  { slug: "bordeaux", label: "Bordeaux", kind: "ville", vol: 720, match: ["Bordeaux"] },
  { slug: "nantes", label: "Nantes", kind: "ville", vol: 320, match: ["Nantes"] },
  { slug: "marseille", label: "Marseille", kind: "ville", vol: 260, match: ["Marseille"] },
  { slug: "toulouse", label: "Toulouse", kind: "ville", vol: 210, match: ["Toulouse"] },
  { slug: "montpellier", label: "Montpellier", kind: "ville", vol: 260, match: ["Montpellier"] },
  { slug: "brest", label: "Brest", kind: "ville", vol: 210, match: ["Brest"] },
  { slug: "lille", label: "Lille", kind: "ville", vol: 320, match: ["Lille"] },
  { slug: "strasbourg", label: "Strasbourg", kind: "ville", vol: 210, match: ["Strasbourg"] },
  { slug: "nice", label: "Nice", kind: "ville", vol: 210, match: ["Nice"] },
  { slug: "grenoble", label: "Grenoble", kind: "ville", vol: 260, match: ["Grenoble"] },
  // Major European cities (target NL/DE/UK volumes; populated by our events)
  { slug: "amsterdam", label: "Amsterdam", kind: "ville", vol: 1900, match: ["Amsterdam"] },
  { slug: "rotterdam", label: "Rotterdam", kind: "ville", vol: 8100, match: ["Rotterdam"] },
  { slug: "berlin", label: "Berlin", kind: "ville", vol: 2400, match: ["Berlin"] },
  { slug: "london", label: "London", kind: "ville", vol: 1300, match: ["London"] },
  { slug: "manchester", label: "Manchester", kind: "ville", vol: 720, match: ["Manchester"] },
  { slug: "barcelona", label: "Barcelona", kind: "ville", vol: 880, match: ["Barcelona"] },
  { slug: "drome", label: "Drôme", kind: "departement", vol: 1000 },
  { slug: "lozere", label: "Lozère", kind: "departement", vol: 4400 },
  { slug: "aude", label: "Aude", kind: "departement", vol: 4400 },
  { slug: "lot", label: "Lot", kind: "departement", vol: 5400 },
  { slug: "isere", label: "Isère", kind: "departement", vol: 1000 },
  { slug: "ain", label: "Ain", kind: "departement", vol: 1000 },
  { slug: "herault", label: "Hérault", kind: "departement", vol: 880 },
  { slug: "hautes-alpes", label: "Hautes-Alpes", kind: "departement", vol: 1000 },
  { slug: "tarn", label: "Tarn", kind: "departement", vol: 480 },
  { slug: "aveyron", label: "Aveyron", kind: "departement", vol: 320 },
  { slug: "bretagne", label: "Bretagne", kind: "region", vol: 720 },
  { slug: "loire-atlantique", label: "Loire-Atlantique", kind: "departement", vol: 390 },
  // Departments the calendar now actually covers — each one has at least one dated event.
  { slug: "vaucluse", label: "Vaucluse", kind: "departement", vol: 260 },
  { slug: "bouches-du-rhone", label: "Bouches-du-Rhône", kind: "departement", vol: 320 },
  { slug: "alpes-maritimes", label: "Alpes-Maritimes", kind: "departement", vol: 260 },
  { slug: "gironde", label: "Gironde", kind: "departement", vol: 320 },
  { slug: "nord", label: "Nord", kind: "departement", vol: 390 },
  { slug: "ille-et-vilaine", label: "Ille-et-Vilaine", kind: "departement", vol: 260 },
  { slug: "seine-et-marne", label: "Seine-et-Marne", kind: "departement", vol: 260 },
  { slug: "seine-saint-denis", label: "Seine-Saint-Denis", kind: "departement", vol: 210 },
  { slug: "yvelines", label: "Yvelines", kind: "departement", vol: 210 },
  { slug: "haute-savoie", label: "Haute-Savoie", kind: "departement", vol: 260 },
  { slug: "allier", label: "Allier", kind: "departement", vol: 210 },
  { slug: "ardeche", label: "Ardèche", kind: "departement", vol: 260 },
  { slug: "calvados", label: "Calvados", kind: "departement", vol: 210 },
  { slug: "orne", label: "Orne", kind: "departement", vol: 320 },
  { slug: "rhone", label: "Rhône", kind: "departement", vol: 320 },
];

export const placeBySlug = (slug: string): Place | undefined => PLACES.find((p) => p.slug === slug);

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
