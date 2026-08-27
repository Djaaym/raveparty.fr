import type { GenreColor, Lang, RaveEvent } from "./types";

/**
 * Ce qu'on affiche d'un événement — sans le calendrier.
 *
 * Module feuille : il n'importe que des types. C'est tout son intérêt.
 *
 * `lib/data.ts` porte les 870 événements du catalogue, leurs descriptions françaises
 * *et* anglaises, et les maps d'affiches, de photos et de billetterie : ~830 Ko de
 * source, 218 Ko une fois compressés. Webpack n'élimine pas les exports inutilisés
 * d'un module de cette taille — mesuré, pas supposé : importer `isPast` depuis un
 * composant client suffisait à embarquer tout le fichier. La page d'accueil, /explore,
 * /map et /account payaient donc le catalogue entier en JavaScript pour afficher des
 * cartes.
 *
 * Tout ce qui est ici est **pur et petit** : des couleurs de genre, des libellés de
 * pays, quelques comparaisons de dates. Rien ne dépend de `EVENTS`, et rien ne doit
 * jamais en dépendre — c'est la seule règle de ce fichier. Ce qui a besoin du
 * calendrier (`eventPath`, `upcoming`, `nextEdition`…) reste dans `lib/data.ts`, qui
 * ré-exporte tout ce module pour que les appelants serveur ne changent pas d'import.
 */

export const GENRES: Record<string, GenreColor> = {
  Techno: { c1: "#2F7BFF", c2: "#8B5CFF" },
  "Hard Techno": { c1: "#FF2D9B", c2: "#FF6A3D" },
  "Acid Techno": { c1: "#C6FF3D", c2: "#19E7FF" },
  Hardstyle: { c1: "#FF2D9B", c2: "#FFC23D" },
  Hardcore: { c1: "#FF3D3D", c2: "#8B5CFF" },
  EDM: { c1: "#19E7FF", c2: "#2F7BFF" },
  "Drum & Bass": { c1: "#8B5CFF", c2: "#19E7FF" },
  House: { c1: "#FF6A3D", c2: "#FF2D9B" },
  Trance: { c1: "#19E7FF", c2: "#8B5CFF" },
  Psytrance: { c1: "#C6FF3D", c2: "#8B5CFF" },
  Warehouse: { c1: "#6E7081", c2: "#2F7BFF" },
};

export const poster = (g: string): string => {
  const k = GENRES[g] ?? GENRES.Techno;
  return `linear-gradient(150deg, ${k.c1} 0%, ${k.c2} 55%, #0A0B11 110%)`;
};

export const ALL_GENRES = Object.keys(GENRES);
export const genreSlug = (g: string): string =>
  g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const genreFromSlug = (s: string): string | undefined =>
  ALL_GENRES.find((g) => genreSlug(g) === s);

export const slugify = (s: string): string =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const TYPES: RaveEvent["type"][] = ["Festival", "Club", "Warehouse"];

export const COUNTRY_FR: Record<string, string> = {
  Netherlands: "Pays-Bas", Germany: "Allemagne", France: "France", UK: "Royaume-Uni",
  Portugal: "Portugal", Belgium: "Belgique", Spain: "Espagne", Austria: "Autriche", Romania: "Roumanie",
  Italy: "Italie", Croatia: "Croatie", "Czech Republic": "République tchèque", Hungary: "Hongrie",
  Poland: "Pologne", Malta: "Malte", Serbia: "Serbie", Albania: "Albanie", Mexico: "Mexique",
  Switzerland: "Suisse", Denmark: "Danemark", Sweden: "Suède", Ireland: "Irlande", Greece: "Grèce",
  Bulgaria: "Bulgarie", Slovenia: "Slovénie", Luxembourg: "Luxembourg", Estonia: "Estonie",
  Norway: "Norvège", Finland: "Finlande", Iceland: "Islande", Latvia: "Lettonie", Lithuania: "Lituanie",
  Slovakia: "Slovaquie", "Bosnia and Herzegovina": "Bosnie-Herzégovine", Montenegro: "Monténégro",
  "North Macedonia": "Macédoine du Nord", Cyprus: "Chypre", Georgia: "Géorgie",
};
export const COUNTRY_FLAG: Record<string, string> = {
  Netherlands: "🇳🇱", Germany: "🇩🇪", France: "🇫🇷", UK: "🇬🇧", Portugal: "🇵🇹",
  Belgium: "🇧🇪", Spain: "🇪🇸", Austria: "🇦🇹", Romania: "🇷🇴", Italy: "🇮🇹",
  Croatia: "🇭🇷", "Czech Republic": "🇨🇿", Hungary: "🇭🇺", Poland: "🇵🇱", Malta: "🇲🇹",
  Serbia: "🇷🇸", Albania: "🇦🇱", Mexico: "🇲🇽", Switzerland: "🇨🇭", Denmark: "🇩🇰",
  Sweden: "🇸🇪", Ireland: "🇮🇪", Greece: "🇬🇷", Bulgaria: "🇧🇬", Slovenia: "🇸🇮",
  Luxembourg: "🇱🇺", Estonia: "🇪🇪", Norway: "🇳🇴", Finland: "🇫🇮", Iceland: "🇮🇸",
  Latvia: "🇱🇻", Lithuania: "🇱🇹", Slovakia: "🇸🇰", "Bosnia and Herzegovina": "🇧🇦",
  Montenegro: "🇲🇪", "North Macedonia": "🇲🇰", Cyprus: "🇨🇾", Georgia: "🇬🇪",
};

/* localized accessors */
export const countryLabel = (c: string, lang: Lang) =>
  lang === "fr" ? COUNTRY_FR[c] ?? c : c;

/** Same for the venue: proper nouns need no translation, descriptive labels do
 *  ("300+ lieux dans Amsterdam" must not survive onto /en). */
export const venueLabelL = (name: string, nameEn: string | undefined, lang: Lang) =>
  lang === "en" ? nameEn ?? name : name;
export const eventVenueL = (e: RaveEvent, lang: Lang) => venueLabelL(e.venue, e.venueEn, lang);

/** Today as `yyyy-mm-dd` in Europe/Paris — the site's reference timezone. */
export const todayISO = (): string => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
/** Last day of an event (multi-day festivals stay live until their final day). */
export const lastDay = (e: RaveEvent): string => e.endDate ?? e.date;
/** True once the event's final day is behind us. */
export const isPast = (e: RaveEvent, ref = todayISO()): boolean => lastDay(e) < ref;
/** True while the event is running right now. */
export const isLive = (e: RaveEvent, ref = todayISO()): boolean => e.date <= ref && lastDay(e) >= ref;
