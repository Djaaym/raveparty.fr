import type { RaveEvent } from "./types";
import { EVENTS } from "./data";

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
];

export const placeBySlug = (slug: string): Place | undefined => PLACES.find((p) => p.slug === slug);

/** Events located in a given place (matched by city name or French region/department). */
export function eventsForPlace(p: Place): RaveEvent[] {
  const names = (p.match ?? [p.label]).map((s) => s.toLowerCase());
  return EVENTS.filter((e) => {
    const hay = [e.city, e.region ?? ""].map((s) => s.toLowerCase());
    return names.some((n) => hay.some((h) => h.includes(n)));
  }).sort((a, b) => a.date.localeCompare(b.date));
}
