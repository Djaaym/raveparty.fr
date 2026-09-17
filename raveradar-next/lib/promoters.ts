import type { RaveEvent } from "./types";
import { EVENTS, PHOTOS, imageUrl, rankGenres, slugify, upcoming, upcomingFirst } from "./data";

/**
 * Les organisateurs : la marque derrière une soirée.
 *
 * Le catalogue savait dire *où* (`/lieux/{slug}`), *qui joue* (`/artistes/{slug}`) et
 * *quoi* (`/genres/{slug}`), jamais *qui programme*. C'est pourtant une intention de
 * recherche à part entière (« teletech manchester », « awakenings agenda », « hangar
 * festival »), et la seule qui relie des dates que rien d'autre ne rassemble : une
 * marque de club qui sort de ses murs, un collectif qui tourne de ville en ville, un
 * promoteur de festival qui tient trois éditions dans trois pays.
 *
 * ## Une salle n'est pas un organisateur, et la frontière décide de l'existence de la page
 *
 * Publier `/organisateurs/fuse` à côté de `/lieux/fuse` mettrait deux pages du site en
 * concurrence sur la même requête, avec le même agenda dessous : exactement ce que le
 * dépôt refuse ailleurs (le pays écrit de deux façons, la ville en deux orthographes,
 * les pages `/show/` retirées pour quasi-doublon). D'où la règle de `build()` : une
 * marque n'a de page que si sa programmation **déborde d'un seul lieu**, c'est-à-dire
 * au moins deux salles ou au moins deux villes. En dessous, la fiche de salle répond
 * déjà et mieux, puisqu'elle porte l'adresse et la carte.
 *
 * ## La correspondance se fait sur des mots entiers, jamais sur une sous-chaîne
 *
 * C'est la règle d'`eventsForPlace()` (« Ain » est une sous-chaîne de « Saintes »),
 * repayée ici sur des noms courts : « Fuse » est dans « Fusebox », « Index » dans
 * « Indexation ». Le titre est découpé en mots par `slugify()`, et un libellé de
 * `match` doit s'y retrouver comme **suite de mots consécutifs**.
 *
 * `venues` est la seconde porte, pour les marques dont le titre ne porte pas le nom
 * (une nuit au Fuse s'appelle rarement « Fuse »). Elle ne se pose que sur une salle
 * dont **toute** la programmation est celle de la marque, sinon on revendique les
 * soirées d'un promoteur invité, ce qui est pire que ne rien revendiquer.
 *
 * Le contenu de `PROMOTERS` est écrit par `python3 .research/promoters/ingest.py`
 * entre les marqueurs `PROMOTERS:start/end`. Ne pas éditer la map à la main.
 */
export type PromoterKind = "collectif" | "organisateur" | "club" | "label";

export interface Promoter {
  slug: string;
  name: string;
  kind: PromoterKind;
  /** Ville d'attache, telle que la source officielle la donne. */
  city: string;
  /** Clé de pays du catalogue (`UK`, jamais `United Kingdom`). */
  country: string;
  /** Année de création, seulement quand une source la donne. */
  since?: number;
  /** Présentation en français, source de vérité. */
  desc: string;
  /** Présentation anglaise ; à défaut, `/en` retombe sur le français. */
  descEn?: string;
  site?: string;
  instagram?: string;
  /** Les libellés qui identifient la marque dans le titre d'un événement. */
  match: string[];
  /** Les salles dont toute la programmation est celle de la marque. */
  venues?: string[];
  /**
   * Les pays où la marque programme, quand son nom est un mot courant.
   *
   * « Circus » attrapait « David Guetta presents Galactic Circus » à Ibiza : le mot
   * est dans le titre, la soirée n'a rien à voir. Restreindre aux pays où la marque
   * tourne referme la porte sans toucher aux marques qui voyagent vraiment, Teletech
   * jouant bien en Finlande et en Suisse.
   */
  countries?: string[];
  /**
   * Les titres à écarter malgré une correspondance.
   *
   * Dernier recours pour un homonyme isolé qu'aucun pays ne sépare : une soirée
   * *invitant* la marque n'est pas une soirée *de* la marque, et se l'attribuer
   * revendique le travail d'un autre promoteur.
   */
  exclude?: string[];
}

/* PROMOTERS:start */
const RAW: Promoter[] = [];
/* PROMOTERS:end */

const words = (s: string): string[] => slugify(s).split("-").filter(Boolean);

/** `needle` apparaît-il comme suite de mots consécutifs dans `hay` ? */
function runOf(hay: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > hay.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/* Un seul passage sur le catalogue, et les libellés de `match` découpés une seule
   fois : la table est lue par toutes les fiches au build, la reconstruire à chaque
   appel coûterait des millions de comparaisons pour la même réponse. */
const INDEX = (() => {
  const needles = RAW.map((p) => ({
    p,
    match: p.match.map(words),
    venues: new Set((p.venues ?? []).map(slugify)),
    countries: p.countries ? new Set(p.countries) : null,
    exclude: (p.exclude ?? []).map(words),
  }));
  const byPromoter = new Map<string, RaveEvent[]>();
  const byEvent = new Map<number, Promoter[]>();
  for (const e of EVENTS) {
    const title = words(e.title);
    const venue = slugify(e.venue);
    for (const n of needles) {
      if (n.countries && !n.countries.has(e.country)) continue;
      const hit = n.match.some((m) => runOf(title, m)) || n.venues.has(venue);
      if (!hit) continue;
      if (n.exclude.some((m) => runOf(title, m))) continue;
      const at = byPromoter.get(n.p.slug);
      if (at) at.push(e);
      else byPromoter.set(n.p.slug, [e]);
      const ev = byEvent.get(e.id);
      if (ev) ev.push(n.p);
      else byEvent.set(e.id, [n.p]);
    }
  }
  return { byPromoter, byEvent };
})();

/** Combien de salles, de villes et de titres distincts la marque touche. */
const spread = (events: RaveEvent[]) => ({
  venues: new Set(events.map((e) => slugify(e.venue))).size,
  cities: new Set(events.map((e) => slugify(e.city))).size,
  /* Le titre porte le festival et pas l'édition (règle de contenu du projet), donc
     deux éditions de Sónar comptent pour un seul titre : c'est exactement ce qu'il
     faut compter ici, un organisateur qui ne tient qu'un festival est déjà décrit
     par `/festival/{slug}`. */
  titles: new Set(events.map((e) => slugify(e.title))).size,
});

/**
 * Une marque a une page quand son programme déborde d'une seule page existante.
 *
 * Deux dates au minimum, et deux conditions cumulées :
 *
 * - **au moins deux salles ou deux villes**, sinon `/lieux/{slug}` décrit déjà la
 *   même chose, avec l'adresse et la carte en plus ;
 * - **au moins deux titres distincts**, sinon c'est `/festival/{slug}` qui décrit
 *   déjà la même chose. Un organisateur qui ne tient qu'un festival n'ajoute rien,
 *   il double la fiche du festival sur sa propre requête.
 *
 * Le calcul se fait au build, donc une marque entre d'elle-même le jour où un lot
 * lui apporte une date ailleurs, sans rien à basculer à la main.
 */
export function isPageworthy(events: RaveEvent[]): boolean {
  if (events.length < 2) return false;
  const s = spread(events);
  return (s.venues >= 2 || s.cities >= 2) && s.titles >= 2;
}

function build(): Promoter[] {
  return RAW.filter((p) => isPageworthy(INDEX.byPromoter.get(p.slug) ?? [])).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export const PROMOTERS: Promoter[] = build();

const BY_SLUG = new Map(PROMOTERS.map((p) => [p.slug, p]));
export const promoterBySlug = (s: string): Promoter | undefined => BY_SLUG.get(s);

/** Les dates de la marque, à venir d'abord. */
export const eventsForPromoter = (slug: string): RaveEvent[] =>
  upcomingFirst(INDEX.byPromoter.get(slug) ?? []);

/**
 * Les marques qui programment cet événement.
 *
 * Filtré sur `PROMOTERS` et pas sur `RAW` : une marque écartée par `build()` n'a pas
 * de page, et poser son nom en lien donnerait un 404 sur une fiche indexée. Même
 * règle que `hasArtistPage()` pour un nom ajouté à un line-up.
 */
export const promotersForEvent = (e: RaveEvent): Promoter[] =>
  (INDEX.byEvent.get(e.id) ?? []).filter((p) => BY_SLUG.has(p.slug));

/** Ce que la marque programme, pondéré, voir `rankGenres()` (lib/data.ts). */
export const promoterGenres = (slug: string): string[] => rankGenres(INDEX.byPromoter.get(slug) ?? []);

/** Les villes où la marque pose ses dates, la plus servie d'abord. */
export function promoterCities(slug: string): { city: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const e of INDEX.byPromoter.get(slug) ?? []) tally.set(e.city, (tally.get(e.city) ?? 0) + 1);
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([city, count]) => ({ city, count }));
}

/** Les salles où la marque programme, la plus servie d'abord. */
export function promoterVenues(slug: string): { name: string; slug: string; count: number }[] {
  const tally = new Map<string, { name: string; count: number }>();
  for (const e of INDEX.byPromoter.get(slug) ?? []) {
    const k = slugify(e.venue);
    if (!k) continue;
    const at = tally.get(k);
    if (at) at.count++;
    else tally.set(k, { name: e.venue, count: 1 });
  }
  return [...tally.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }));
}

/**
 * Les habitués de la marque : les noms qui reviennent le plus sur ses affiches.
 *
 * Même seuil et même raison que `venueRegulars()` : sur deux dates, tout le monde
 * serait « régulier », donc un nom vu une seule fois ne compte pas. Rendu vide plutôt
 * que faux.
 */
export function promoterRegulars(slug: string, n: number, min = 2): { name: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const e of INDEX.byPromoter.get(slug) ?? []) {
    for (const raw of e.lineup) {
      const name = raw.trim();
      if (name) tally.set(name, (tally.get(name) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .filter(([, c]) => c >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/** Le nombre de dates à venir, pour un compteur de pilule qui ne promet rien de faux. */
export const promoterUpcoming = (slug: string, today?: string): RaveEvent[] =>
  upcoming(INDEX.byPromoter.get(slug) ?? [], today);

/**
 * L'image de partage d'une fiche d'organisateur.
 *
 * Contrairement à une fiche de salle, l'affiche d'une soirée est ici **le sujet** :
 * c'est l'artwork de la marque, pas l'annonce d'un événement étranger à la page. On
 * prend donc la première date qui porte une vraie photo ou une affiche, à venir de
 * préférence, et rien plutôt qu'un dégradé sans information.
 */
export function promoterOgImage(slug: string): string | null {
  for (const e of eventsForPromoter(slug)) {
    if (PHOTOS[e.id]) return imageUrl(e);
  }
  return null;
}
