import type { EventSubmission, FieldErrors } from "./accounts";
import { isEmail, normalizeEmail, normalizeUrl, str } from "./accounts";
import { ALL_GENRES, TYPES } from "./display";
import { MAX_SUBGENRES } from "./subgenres";
import { richLength } from "./richtext";
import type { Lang } from "./types";

/**
 * Ce qu'on accepte d'un dépôt d'événement.
 *
 * Le même module sert au formulaire (composant client) et à la route qui enregistre :
 * une validation écrite deux fois finit toujours par diverger, et c'est celle du serveur
 * qui fait foi. Il n'importe que des modules feuilles, `lib/display.ts` compris, donc
 * aucun octet du catalogue ne part dans le bundle de /organizer.
 *
 * Les règles reprennent celles du catalogue plutôt que d'en inventer :
 *
 * - **`endDate` est réservé aux vraies dates multi-jours.** Une soirée de club qui finit
 *   à l'aube n'en est pas une : `isPast()` lit `endDate`, donc la poser sur un samedi
 *   soir garderait la fiche « à venir » tout le dimanche. On refuse donc une date de fin
 *   égale au lendemain quand aucune heure de fin ne dit qu'il s'agit d'un festival.
 * - **Le titre porte le festival, pas l'édition** : « Ultra Europe », jamais
 *   « Ultra Europe 2027 », l'année étant déjà ajoutée par le gabarit de `<title>`.
 * - **Un tarif non confirmé n'est pas gratuit** : `priceNote` distingue « ≈ 45 € » de
 *   « Tarif à venir », et `price: 0` sans note veut vraiment dire entrée libre.
 */

const MIN_DESC = 120;
const MAX_LINEUP = 60;

/** Les devises que le catalogue stocke, en symbole local : on n'a jamais converti, le
 *  montant affiché doit être celui qu'on paie à l'entrée. */
export const CURRENCIES = ["€", "£", "$", "CHF", "Kč", "zł", "kr", "RSD", "HUF", "RON", "BGN"];

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isTime = (v: string) => /^\d{2}:\d{2}$/.test(v);
const dayAfter = (d: string) => new Date(Date.parse(d) + 86400_000).toISOString().slice(0, 10);

/**
 * Valide un dépôt. `today` est passé plutôt que lu : la route et le formulaire n'ont pas
 * la même horloge, et une fonction pure se teste.
 */
export function parseSubmission(
  body: unknown,
  today: string,
): { fields: Omit<EventSubmission, "id" | "owner" | "status" | "createdAt"> } | { errors: FieldErrors } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const title = str(b.title, 160);
  if (title.length < 3) errors.title = "required";
  // Le titre regroupe les éditions : « Sónar 2026 » et « Sónar » feraient deux pages.
  else if (/\s(19|20)\d{2}$/.test(title)) errors.title = "year";

  const type = TYPES.includes(str(b.type, 40) as (typeof TYPES)[number]) ? str(b.type, 40) : "";
  if (!type) errors.type = "required";

  const genre = str(b.genre, 40);
  if (!ALL_GENRES.includes(genre)) errors.genre = "required";

  const subgenres = Array.isArray(b.subgenres)
    ? Array.from(new Set(b.subgenres.map((x) => str(x, 40)).filter(Boolean))).slice(0, MAX_SUBGENRES)
    : [];

  const city = str(b.city, 80);
  if (!city) errors.city = "required";
  const country = str(b.country, 80);
  if (!country) errors.country = "required";
  const venue = str(b.venue, 160);
  if (!venue) errors.venue = "required";

  const date = str(b.date, 10);
  if (!isDate(date)) errors.date = "date";
  // Une date déjà passée ne rentre pas au catalogue, `merge.py` la rejette de toute façon.
  else if (date < today) errors.date = "past";

  const endDate = str(b.endDate, 10);
  const endTime = str(b.endTime, 5);
  if (endDate) {
    if (!isDate(endDate)) errors.endDate = "date";
    else if (endDate < date) errors.endDate = "order";
    else if (endDate === dayAfter(date) && type !== "Festival") errors.endDate = "overnight";
  }

  const time = str(b.time, 5);
  if (time && !isTime(time)) errors.time = "time";
  if (endTime && !isTime(endTime)) errors.endTime = "time";

  const lineup = Array.isArray(b.lineup)
    ? Array.from(new Set(b.lineup.map((x) => str(x, 80)).filter(Boolean))).slice(0, MAX_LINEUP)
    : [];

  const desc = typeof b.desc === "string" ? b.desc.slice(0, 6000) : "";
  if (richLength(desc) < MIN_DESC) errors.desc = "short";
  const descEn = typeof b.descEn === "string" ? b.descEn.slice(0, 6000) : "";

  // Le prix est laissé en chaîne : « 39 » et « » ne veulent pas dire la même chose, et
  // un 0 par défaut publierait « GRATUIT » sur un événement dont on ignore le tarif.
  const price = str(b.price, 12).replace(",", ".");
  if (price && !/^\d{1,5}(\.\d{1,2})?$/.test(price)) errors.price = "price";
  const currency = CURRENCIES.includes(str(b.currency, 6)) ? str(b.currency, 6) : "€";
  const rawNote = str(b.priceNote, 12);
  const priceNote: "" | "estimated" | "unknown" =
    rawNote === "estimated" || rawNote === "unknown" ? rawNote : price ? "" : "unknown";

  const ticketUrl = normalizeUrl(str(b.ticketUrl, 400));
  if (ticketUrl === null) errors.ticketUrl = "url";
  const posterUrl = normalizeUrl(str(b.posterUrl, 400));
  if (posterUrl === null) errors.posterUrl = "url";

  const contactEmail = normalizeEmail(str(b.contactEmail, 254));
  if (contactEmail && !isEmail(contactEmail)) errors.contactEmail = "email";

  if (Object.keys(errors).length) return { errors };

  const lang: Lang = b.lang === "en" ? "en" : "fr";
  return {
    fields: {
      title, type, genre, subgenres, city, country, venue,
      address: str(b.address, 200),
      date, endDate, time, endTime, lineup, desc, descEn,
      price, currency, priceNote,
      ticketUrl: ticketUrl ?? "",
      posterUrl: posterUrl ?? "",
      posterFile: str(b.posterFile, 200),
      contactEmail, lang,
    },
  };
}
