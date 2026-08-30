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
  date: string; // ISO yyyy-mm-dd, first day
  endDate?: string; // ISO yyyy-mm-dd, last day (multi-day festivals); defaults to `date`
  time: string;
  price: number;
  /** How much to trust `price`: absent = confirmed, "estimated" = indicative,
   *  "unknown" = not published (never render it as free). */
  priceNote?: "estimated" | "unknown";
  currency: string;
  venue: string; // French venue label (source of truth, the /lieux slug is built from it)
  venueEn?: string; // English venue label; only needed when `venue` isn't a proper noun
  trending: boolean;
  lineup: string[];
  desc: string; // French description (site is FR-first)
  descEn?: string; // English description; falls back to `desc` when absent
  region?: string; // French department / region (for /rave-party/{dept} pages)
}

/**
 * Un événement dont l'URL est déjà résolue.
 *
 * `eventPath()` doit consulter tout le catalogue, c'est lui qui sait si une édition
 * est la canonique (slug nu) ou une autre (slug suffixé de l'année). Tant que
 * `<EventCard>` l'appelait lui-même, la moindre carte rendue dans un composant client
 * traînait `lib/data.ts` entier dans le bundle : 218 Ko compressés sur la page
 * d'accueil, /explore, /map et /account. Le chemin est donc résolu côté serveur, une
 * fois, et voyage avec l'événement.
 */
export interface CardEvent extends RaveEvent {
  /** `eventPath(e)`. */
  path: string;
  /** `imageThumb(e)`, le crop 4:5 d'une carte, ou `null` si aucun fichier. */
  thumb: string | null;
  /** `cardBg(e)`, le repli en dégradé de genre quand il n'y a pas de fichier. */
  bg: string;
  /** Vraie photo (`PHOTOS`) plutôt que visuel généré : ça change le texte de l'`alt`. */
  isPhoto: boolean;
}

export interface GenreColor {
  c1: string;
  c2: string;
}

/**
 * Une suggestion de la barre de recherche.
 *
 * Le type vit ici, pas dans `lib/search-index.ts`, parce que `<HeroSearch>` est un
 * composant client : un `import type` est bien effacé à la compilation, mais la règle
 * du projet est qu'un module client ne cite jamais `lib/data.ts`, et l'index en dérive.
 * Un type dans le module feuille ferme la porte au lieu de compter sur l'effacement.
 */
export type SuggestKind = "artist" | "city" | "festival" | "event" | "venue" | "genre" | "country";

export interface Suggestion {
  /** Le type, qui décide de l'icône et du groupe dans le menu. */
  k: SuggestKind;
  /** Le libellé affiché. */
  n: string;
  /** Le chemin de la page, **sans** préfixe de langue (le client ajoute `/en`). */
  h: string;
  /** La ligne de contexte, à droite de la suggestion (ville, pays, nombre de dates). */
  m?: string;
  /** Vrai quand la date proposée est déjà passée : la suggestion le dit au lieu de mentir. */
  past?: boolean;
}
