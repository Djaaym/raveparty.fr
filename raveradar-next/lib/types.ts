export type Lang = "fr" | "en";

export type EventType = "Festival" | "Club" | "Warehouse";

export interface RaveEvent {
  id: number;
  title: string;
  type: EventType;
  genres: string[];
  city: string;
  country: string;
  lat: number;
  lng: number;
  date: string; // ISO yyyy-mm-dd — first day
  endDate?: string; // ISO yyyy-mm-dd — last day (multi-day festivals); defaults to `date`
  time: string;
  price: number;
  /** How much to trust `price`: absent = confirmed, "estimated" = indicative,
   *  "unknown" = not published (never render it as free). */
  priceNote?: "estimated" | "unknown";
  currency: string;
  venue: string;
  trending: boolean;
  lineup: string[];
  desc: string; // French description (site is FR-first)
  descEn?: string; // English description; falls back to `desc` when absent
  region?: string; // French department / region (for /rave-party/{dept} pages)
}

export interface GenreColor {
  c1: string;
  c2: string;
}
