import type { Lang, RaveEvent } from "./types";
import { DICT } from "./i18n";
/* `./display` et pas `./data` : ce module est importé par des composants client, et
   `lib/data.ts` embarque tout le catalogue avec lui. Voir l'en-tête de display.ts. */
import { countryLabel, eventVenueL } from "./display";

export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(DICT[lang].locale, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

/** "Mercredi 21 octobre" / "Wednesday 21 October", used by the day-by-day guides. */
export function fmtDayLong(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  const s = d.toLocaleDateString(DICT[lang].locale, { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Alt text for an event poster. Every visual on the site used to be a CSS background,
 * so none of them carried one, no accessible name, and nothing for image search to
 * index. Wording stays honest about the source: `PHOTOS` are real photographs of the
 * event or the room, everything else is an AI-generated key visual and says so.
 *
 * `isPhoto` arrive en paramètre au lieu d'être lu dans `PHOTOS` : cette map vit dans
 * `lib/data.ts`, et la lire ici ferait entrer le catalogue entier dans le bundle de
 * chaque composant client qui affiche une carte. Côté serveur, `isPhotoOf(e)` répond ;
 * côté client, le champ voyage sur le `CardEvent`.
 */
export function imageAlt(e: RaveEvent, lang: Lang, isPhoto: boolean): string {
  const where = `${eventVenueL(e, lang)}, ${e.city}, ${countryLabel(e.country, lang)}`;
  // Not fmtDate(): its uppercased "05 SEPT. 2026" reads as shouting inside a sentence,
  // and the spelled-out month is what image search actually matches on.
  const when = new Date(e.date + "T00:00:00").toLocaleDateString(DICT[lang].locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (isPhoto) {
    return lang === "fr"
      ? `Photo de ${e.title} (${where}, ${when}`
      : `Photo of ${e.title}) ${where}, ${when}`;
  }
  return lang === "fr"
    ? `Visuel d'illustration de ${e.title} (${where}, ${when}`
    : `Illustrative key visual for ${e.title}) ${where}, ${when}`;
}

export function priceLabel(e: RaveEvent, lang: Lang): string {
  if (e.priceNote === "unknown") return DICT[lang]["dyn.priceunknown"];
  if (e.price === 0) return DICT[lang]["dyn.free"];
  // e.currency is a symbol ("€"/"£"/"$"), not an ISO code, so Intl's style:"currency"
  // (which requires ISO codes like "EUR") can't place it for us, format the number in
  // decimal style and place the symbol by hand per locale: "41,80 €" in fr, "€41.80" in en.
  const hasCents = e.price % 1 !== 0;
  const amount = new Intl.NumberFormat(DICT[lang].locale, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(e.price);
  // Prague et Varsovie sont arrivées avec l'expansion à l'est, et elles ne
  // facturent pas en euros. Seules les trois devises que l'anglais écrit avant le
  // nombre sont préfixées : « Kč490 » ou « zł120 » n'est la convention de personne,
  // et aucune des deux langues ne les écrit ainsi.
  const prefixed = lang === "en" && ["€", "£", "$"].includes(e.currency);
  const formatted = prefixed ? `${e.currency}${amount}` : `${amount} ${e.currency}`;
  return `${e.priceNote === "estimated" ? "≈ " : ""}${formatted}`;
}
