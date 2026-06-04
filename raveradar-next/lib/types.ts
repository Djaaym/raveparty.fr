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
  date: string; // ISO yyyy-mm-dd
  time: string;
  price: number;
  currency: string;
  venue: string;
  trending: boolean;
  lineup: string[];
  desc: string; // English base
}

export interface GenreColor {
  c1: string;
  c2: string;
}
