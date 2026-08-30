import type { Lang, RaveEvent } from "./types";
/* `./display` et pas `./data` : module feuille, il ne doit jamais tirer le catalogue.
   Voir l'en-tête de display.ts. */
import { lastDay } from "./display";
import { HOTEL_AID, HOTEL_BRAND, HOTEL_PARTNER, HOTEL_URL_TEMPLATE } from "./site";

/**
 * Affiliation hôtel : le lien « où dormir » posé sous chaque fiche événement.
 *
 * Ce que ce module fait, et surtout ce qu'il ne fait pas. Il ne connaît **aucun
 * hôtel** : il construit une recherche datée sur la ville de l'événement chez un
 * partenaire, avec l'identifiant d'affiliation. Publier une liste d'hôtels
 * « recommandés » supposerait des noms, des prix et des distances qu'on n'a pas
 * vérifiés, exactement la donnée inventée que la règle de contenu interdit, et un
 * prix d'hôtel bouge de toute façon tous les jours. La recherche du partenaire est
 * juste au moment du clic ; une liste figée serait fausse la semaine suivante.
 *
 * Les dates viennent du catalogue : arrivée le premier jour, départ le lendemain du
 * dernier. Une soirée de club qui finit à l'aube, c'est donc bien une nuit d'hôtel,
 * et un festival de trois jours en réserve trois.
 *
 * Sans identifiant configuré, `hotelStay()` renvoie `null` et la carte ne se rend
 * pas. C'est volontaire, et c'est la même règle que pour les alertes sans
 * fournisseur : un lien sortant vers un moteur de réservation qui ne rapporte rien
 * coûte du jus de lien pour zéro revenu, mieux vaut rien du tout.
 */
export interface HotelStay {
  /** URL de recherche chez le partenaire, déjà affiliée. */
  url: string;
  /** Arrivée, ISO yyyy-mm-dd (premier jour de l'événement). */
  checkin: string;
  /** Départ, ISO yyyy-mm-dd (lendemain du dernier jour). */
  checkout: string;
  /** Nombre de nuits, toujours >= 1. */
  nights: number;
  /** Nom affichable du partenaire ("Booking.com"), vide si non déclaré. */
  brand: string;
}

/** Décale une date ISO de `days` jours. En UTC, pour qu'un changement d'heure ne fasse pas glisser la nuit. */
function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Nombre de nuits entre deux dates ISO. */
function nightsBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400000));
}

/**
 * Étiquette de reporting envoyée au partenaire, une par page.
 *
 * Bornée à `[a-z0-9-]` : Booking rejette une étiquette qui sort de ce jeu, et une
 * étiquette rejetée fait retomber le clic sur le compte sans campagne, donc invisible
 * dans les rapports. La langue y est pour qu'on sache si /en convertit.
 */
function trackingLabel(e: RaveEvent, lang: Lang): string {
  return `rp-${lang}-ev${e.id}`;
}

/**
 * Recherche Booking.com datée sur la ville de l'événement.
 *
 * Paramètres volontairement limités à ceux qui sont stables et documentés
 * (`ss`, `checkin`, `checkout`, `group_adults`, `no_rooms`, `aid`, `label`, `lang`).
 * `ss` reçoit « Ville, Pays » avec les libellés bruts du catalogue (en anglais) :
 * c'est ce que l'autocomplétion de Booking résout le plus sûrement, quelle que soit
 * la langue de l'interface demandée juste après.
 */
function bookingUrl(e: RaveEvent, lang: Lang, checkin: string, checkout: string): string {
  const q = new URLSearchParams({
    aid: HOTEL_AID,
    label: trackingLabel(e, lang),
    ss: `${e.city}, ${e.country}`,
    checkin,
    checkout,
    group_adults: "2",
    group_children: "0",
    no_rooms: "1",
    lang: lang === "en" ? "en-gb" : "fr",
  });
  return `https://www.booking.com/searchresults.html?${q.toString()}`;
}

/**
 * Gabarit libre, pour tout réseau qui n'est pas Booking (Stay22, Travelpayouts,
 * Awin/Expedia, un lien encapsulé Impact...). On ne devine jamais le format d'URL
 * d'un réseau : il est collé tel quel dans `HOTEL_URL_TEMPLATE`, avec des marqueurs.
 */
function templateUrl(e: RaveEvent, lang: Lang, checkin: string, checkout: string, nights: number): string {
  const vals: Record<string, string> = {
    city: e.city,
    country: e.country,
    checkin,
    checkout,
    nights: String(nights),
    lat: String(e.lat),
    lng: String(e.lng),
    lang,
    label: trackingLabel(e, lang),
  };
  return HOTEL_URL_TEMPLATE.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in vals ? encodeURIComponent(vals[k]) : m,
  );
}

/** La recherche d'hôtels correspondant aux nuits de cet événement, ou `null` si aucun partenaire n'est configuré. */
export function hotelStay(e: RaveEvent, lang: Lang): HotelStay | null {
  const checkin = e.date;
  const checkout = shiftDay(lastDay(e), 1);
  const nights = nightsBetween(checkin, checkout);

  if (HOTEL_PARTNER === "booking" && HOTEL_AID) {
    return { url: bookingUrl(e, lang, checkin, checkout), checkin, checkout, nights, brand: HOTEL_BRAND };
  }
  if (HOTEL_PARTNER === "template" && HOTEL_URL_TEMPLATE) {
    return { url: templateUrl(e, lang, checkin, checkout, nights), checkin, checkout, nights, brand: HOTEL_BRAND };
  }
  return null;
}
