import type { EventSubmission } from "./accounts";
import { plainRich } from "./richtext";

/**
 * Un dépôt vérifié, au format que `.research/merge.py` sait lire.
 *
 * **C'est l'unique implémentation de cette conversion.** Elle vivait d'abord en Python
 * dans `.research/from-submissions.py` ; ce script n'est plus qu'un client de ce
 * module, parce que deux conversions écrites séparément finissent toujours par diverger,
 * et qu'aucune des deux n'aurait raison sur l'autre.
 *
 * Ce que la conversion fait, et ce qu'elle refuse de faire :
 *
 * - **Elle aplatit la mise en forme.** `merge.py` écrit `desc` dans une chaîne
 *   TypeScript sur une seule ligne et son `esc()` n'échappe que `\` et `"` : un retour à
 *   la ligne y casserait `lib/data.ts` au build, 7 000 pages plus loin. Les lignes sont
 *   recollées en phrases, avec un point ajouté quand il manque, plutôt que concaténées
 *   bout à bout où deux éléments de liste se liraient comme une phrase bancale.
 * - **Elle ne traduit pas.** Sans description anglaise, `descEn` reprend le français, ce
 *   que la fiche affiche déjà (`eventDesc()` retombe sur `desc`). Le rapport le signale.
 * - **Elle ne devine pas `region`.** Nominatim rend « Métropole de Lyon » là où le
 *   catalogue dit « Rhône », et rien du tout pour Paris : une valeur approximative
 *   créerait une page de département qui n'existe pas. Les fiches françaises sont
 *   listées à part, à compléter à la main.
 * - **Elle ne garde qu'un genre principal**, `merge.py` n'acceptant que les onze clés de
 *   `GENRES`. Les sous-genres voyagent sous `_subgenres`, avec `_source`, `_geocode` et
 *   `_poster` : quatre clés que `merge.py` ignore et qui servent à celui qui relit.
 */

export interface CatalogRow {
  title: string;
  type: string;
  genres: string[];
  city: string;
  country: string;
  lat: number;
  lng: number;
  date: string;
  endDate?: string;
  time: string;
  price: number;
  currency: string;
  venue: string;
  trending: boolean;
  lineup: string[];
  desc: string;
  descEn: string;
  /** Lu par `merge.py` pour en déduire `priceNote`. */
  note?: string;
  ticketUrl?: string;
  _subgenres?: string[];
  _source: string;
  _geocode?: string;
  _poster?: string;
}

export interface ExportReport {
  rows: CatalogRow[];
  /** Dépôts écartés faute de coordonnées, avec leur titre. */
  missingCoords: string[];
  /** Fiches françaises dont le département reste à saisir. */
  needsRegion: string[];
  /** Fiches dont la version anglaise reprend le français. */
  needsEnglish: string[];
}

/**
 * Le texte que stocke le catalogue, à partir du Markdown réduit du formulaire.
 * Les lignes deviennent des phrases : voir l'en-tête du module pour le pourquoi.
 */
export function flatten(markdown: string): string {
  const parts: string[] = [];
  for (const raw of plainRich(markdown).split("\n")) {
    const line = raw.replace(/^[\s•]+/, "").replace(/\s+/g, " ").trim();
    if (!line) continue;
    if (parts.length && !".!?:;,".includes(parts[parts.length - 1].slice(-1))) parts[parts.length - 1] += ".";
    parts.push(line);
  }
  if (parts.length && !".!?".includes(parts[parts.length - 1].slice(-1))) parts[parts.length - 1] += ".";
  return parts.join(" ");
}

/** Le prix numérique, et la note que `merge.py` lit pour en déduire `priceNote`. */
export function priceOf(s: EventSubmission): { price: number; note: string } {
  const raw = (s.price ?? "").replace(",", ".").trim();
  if (!raw || s.priceNote === "unknown") return { price: 0, note: "tarif non communiqué par l'organisateur" };
  const value = Number(raw);
  if (!Number.isFinite(value)) return { price: 0, note: "tarif non communiqué par l'organisateur" };
  if (s.priceNote === "estimated") return { price: value, note: "tarif indicatif, à confirmer sur la billetterie" };
  return { price: value, note: "" };
}

/** Convertit un dépôt. Rend `null` quand il n'a pas de coordonnées : on ne publie pas un
 *  point inventé, et `merge.py` refuserait la fiche de toute façon. */
export function toCatalogRow(s: EventSubmission): CatalogRow | null {
  if (typeof s.lat !== "number" || typeof s.lng !== "number") return null;

  const { price, note } = priceOf(s);
  const desc = flatten(s.desc);
  const row: CatalogRow = {
    title: s.title,
    type: s.type,
    genres: [s.genre],
    city: s.city,
    country: s.country,
    lat: s.lat,
    lng: s.lng,
    date: s.date,
    time: s.time || "23:00",
    price,
    currency: s.currency || "€",
    venue: s.venue,
    trending: false,
    lineup: s.lineup ?? [],
    desc,
    descEn: flatten(s.descEn) || desc,
    _source: `dépôt ${s.id.slice(0, 8)} par ${s.owner}`,
  };
  if (s.endDate && s.endDate !== s.date) row.endDate = s.endDate;
  if (note) row.note = note;
  if (s.ticketUrl) row.ticketUrl = s.ticketUrl;
  if (s.subgenres?.length) row._subgenres = s.subgenres;
  if (s.geocodeQuery) row._geocode = s.geocodeQuery;
  if (s.posterUrl || s.posterFile) row._poster = s.posterUrl || s.posterFile;
  return row;
}

/** Le lot entier, plus ce qui reste à faire à la main. */
export function buildExport(subs: EventSubmission[]): ExportReport {
  const rows: CatalogRow[] = [];
  const missingCoords: string[] = [];
  const needsRegion: string[] = [];
  const needsEnglish: string[] = [];

  for (const s of [...subs].sort((a, b) => a.date.localeCompare(b.date))) {
    const row = toCatalogRow(s);
    if (!row) {
      missingCoords.push(s.title);
      continue;
    }
    rows.push(row);
    if (row.country === "France") needsRegion.push(row.title);
    if (!flatten(s.descEn)) needsEnglish.push(row.title);
  }
  return { rows, missingCoords, needsRegion, needsEnglish };
}
