import type { Lang } from "./types";

/**
 * L'état des filtres de `/explore`, dans un sens et dans l'autre.
 *
 * La page **lisait** l'URL (`?genre=&country=&q=&month=`) mais ne l'écrivait jamais :
 * affiner un filtre ne changeait pas l'adresse, donc rien n'était partageable, rien
 * n'était en favori, et un rechargement rendait la page nue. Sur un site dont toute la
 * valeur est le référencement, c'est aussi une combinaison de filtres qu'on ne peut
 * jamais lier depuis ailleurs.
 *
 * Un seul module pour la lecture et l'écriture, plutôt qu'un analyseur côté serveur et
 * un formateur côté client : deux écrits séparément divergent, et c'est ici que ça se
 * verrait le plus vite, une URL partagée qui ne rend pas ce qu'elle promettait.
 *
 * Module **feuille** : il ne connaît ni le catalogue ni les composants, seulement la
 * forme de l'état. C'est ce qui permet à la route serveur et au composant client de
 * l'utiliser tous les deux.
 */

export interface ExploreState {
  q: string;
  country: string;
  months: string[];
  from: string;
  to: string;
  genres: string[];
  types: string[];
  /** 300 = pas de plafond, la borne haute du curseur. */
  maxPrice: number;
  sort: "date" | "price" | "price-d" | "az";
  showPast: boolean;
}

export const EMPTY: ExploreState = {
  q: "", country: "", months: [], from: "", to: "",
  genres: [], types: [], maxPrice: 300, sort: "date", showPast: false,
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";
/** Une facette multiple s'écrit `a,b,c` : plus court qu'un paramètre répété, et lisible. */
const many = (v: string | string[] | undefined): string[] =>
  one(v).split(",").map((x) => x.trim()).filter(Boolean);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const SORTS = new Set(["date", "price", "price-d", "az"]);

/**
 * L'état porté par une URL.
 *
 * Tout est borné et validé : ces valeurs viennent de l'extérieur et servent à filtrer
 * un catalogue rendu côté serveur. Une date bancale ou un tri inconnu retombe sur le
 * défaut plutôt que de rendre une page vide sans dire pourquoi.
 *
 * `q` est coupé à 80 caractères, la même borne que `/api/search` : au-delà ce n'est
 * plus une recherche.
 */
export function readExplore(sp: SP): ExploreState {
  const price = Number(one(sp.price));
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 80),
    country: one(sp.country),
    months: many(sp.month).filter((m) => ISO_MONTH.test(m)),
    from: ISO_DAY.test(one(sp.from)) ? one(sp.from) : "",
    to: ISO_DAY.test(one(sp.to)) ? one(sp.to) : "",
    genres: many(sp.genre),
    types: many(sp.type),
    maxPrice: Number.isFinite(price) && price > 0 && price < 300 ? Math.round(price) : 300,
    sort: SORTS.has(sort) ? (sort as ExploreState["sort"]) : "date",
    showPast: one(sp.past) === "1",
  };
}

/**
 * La chaîne de requête d'un état, ou la chaîne vide s'il n'y a rien à dire.
 *
 * Seul ce qui s'écarte du défaut est écrit : une URL qui porterait
 * `?price=300&sort=date&past=0` sur un état vierge serait illisible et, surtout,
 * ferait de `/explore` et `/explore?...` deux adresses pour la même page.
 *
 * L'ordre des clés est fixe et les listes sont triées : sans ça, cocher « Techno » puis
 * « House » et l'inverse donneraient deux URLs différentes pour le même résultat.
 */
export function writeExplore(s: ExploreState): string {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.country) p.set("country", s.country);
  if (s.genres.length) p.set("genre", [...s.genres].sort().join(","));
  if (s.types.length) p.set("type", [...s.types].sort().join(","));
  if (s.months.length) p.set("month", [...s.months].sort().join(","));
  if (s.from) p.set("from", s.from);
  if (s.to) p.set("to", s.to);
  if (s.maxPrice < 300) p.set("price", String(s.maxPrice));
  if (s.sort !== "date") p.set("sort", s.sort);
  if (s.showPast) p.set("past", "1");
  const q = p.toString();
  return q ? `?${q}` : "";
}

/**
 * Le titre et la description d'une recherche filtrée.
 *
 * La page annonçait « Explorer les événements électro en Europe » quels que soient les
 * filtres : une adresse partagée sur `?country=Germany&genre=Hard Techno` promettait
 * l'Europe entière, et son aperçu de partage ne disait rien de ce qu'elle montre. Le
 * titre suit maintenant ce que la page affiche vraiment.
 *
 * Les libellés sont passés par l'appelant : ce module reste feuille, il ne sait pas
 * traduire un nom de pays.
 */
export function exploreTitle(s: ExploreState, lang: Lang, countryLabel: string): string {
  const bits: string[] = [];
  if (s.genres.length) bits.push(s.genres.join(" · "));
  if (s.q.trim()) bits.push(`« ${s.q.trim()} »`);
  if (countryLabel) bits.push(lang === "fr" ? `en ${countryLabel}` : `in ${countryLabel}`);
  if (!bits.length) return "";
  return bits.join(" ");
}
