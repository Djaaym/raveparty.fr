import type { RaveEvent } from "./types";
import { EVENTS, rankGenres, slugify, upcomingFirst } from "./data";
import { ARTIST_STYLES, isOutOfScope } from "./artist-genres";

export interface Artist {
  slug: string;
  name: string;
  eventIds: number[];
  /**
   * L'union brute des genres de ses soirées, **à ne jamais afficher**. C'est un
   * matériau de calcul, gardé pour les filtres internes. Ce qu'on montre, c'est
   * `artistGenres()` ; l'union affirmait qu'I Hate Models joue de la psytrance.
   */
  genres: string[];
  countries: string[];
}

/**
 * Le nom affiché, quand le catalogue en écrit plusieurs.
 *
 * Trente-six artistes apparaissent sous deux orthographes dans les line-ups,
 * « Étienne de Crécy » et « Etienne de Crécy », « KRUELTY » et « Kruelty ». Le slug
 * les réunit (c'est voulu : une page par artiste), mais le nom retenu était celui de
 * la *première* date rencontrée, c'est-à-dire un hasard de l'ordre du fichier.
 *
 * Deux règles, dans cet ordre : **l'accent gagne** (le perdre est une faute de
 * saisie, jamais un choix typographique) puis **la graphie la plus fréquente**. Les
 * capitales, elles, sont souvent le vrai nom de scène (KETTAMA, NASTIA) : on ne les
 * corrige pas.
 */
function pickName(counts: Map<string, number>): string {
  const forms = [...counts.entries()];
  const accented = forms.filter(([n]) => /[^\u0000-\u007f]/.test(n));
  const pool = accented.length ? accented : forms;
  return pool.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

/* Build the artist index from every event line-up (the artist ↔ festival mesh). */
function buildArtists(): Artist[] {
  const map = new Map<string, Artist & { _g: Set<string>; _c: Set<string>; _n: Map<string, number> }>();
  for (const e of EVENTS) {
    for (const raw of e.lineup) {
      const name = raw.trim();
      const slug = slugify(name);
      if (!slug) continue;
      let a = map.get(slug);
      if (!a) {
        a = { slug, name, eventIds: [], genres: [], countries: [], _g: new Set(), _c: new Set(), _n: new Map() };
        map.set(slug, a);
      }
      a.eventIds.push(e.id);
      a._n.set(name, (a._n.get(name) ?? 0) + 1);
      e.genres.forEach((g) => a!._g.add(g));
      a._c.add(e.country);
    }
  }
  return [...map.values()]
    .map((a) => ({ slug: a.slug, name: pickName(a._n), eventIds: a.eventIds, genres: [...a._g], countries: [...a._c] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const ARTISTS: Artist[] = buildArtists();

/* Index par id, monté une fois : artistGenres() est appelé pour les 1 860 artistes
   au build, et reconstruire la table à chaque appel coûterait 1,6 million de lectures. */
const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

/**
 * Les genres de l'artiste, l'attribution quand on l'a, la déduction sinon.
 *
 * `ARTIST_STYLES` (lib/artist-genres.ts) porte ce que l'artiste joue **d'après une
 * source** : Wikidata, MusicBrainz, les tags last.fm, ou un lot de recherche. C'est
 * une information que le calendrier ne contient pas (il sait où quelqu'un joue, pas
 * ce qu'il joue) donc elle prime dès qu'elle existe.
 *
 * Le repli reste `rankGenres()`, qui pondère les genres des soirées de l'artiste. Il
 * ne disparaît pas : il couvre les milliers de noms qu'aucune base publique ne décrit, et il vaut
 * toujours mieux que l'union brute de `Artist.genres`, un festival étiqueté sur huit
 * styles étiquette du même coup les cinquante noms de son affiche, si bien que le jeu
 * brut affirmait qu'I Hate Models joue de la psytrance. Le détail du calcul est
 * documenté sur `rankGenres` dans lib/data.ts.
 */
const GENRE_CACHE = new Map<string, string[]>();
export function artistGenres(a: Artist): string[] {
  // Mémoïsé : `relatedArtists()` interroge les 1 887 artistes pour *chacune* des
  // 1 887 fiches, et le repli `rankGenres()` relit le line-up à chaque appel, soit
  // trois millions de recalculs au build sans ce cache.
  const hit = GENRE_CACHE.get(a.slug);
  if (hit) return hit;
  const known = ARTIST_STYLES[a.slug];
  // « Aucun de nos genres ne le décrit » n'est pas « on ne sait pas » : c'est une
  // réponse, et elle interdit le repli. Sans ça, Sting jouerait de la techno.
  const out = isOutOfScope(a.slug)
    ? []
    : known?.m.length
      ? known.m
      : rankGenres(a.eventIds.map((id) => BY_ID.get(id)).filter((e): e is RaveEvent => Boolean(e)));
  GENRE_CACHE.set(a.slug, out);
  return out;
}

/**
 * Les sous-genres attribués : « Industrial Techno », « Rawstyle », « Neurofunk »…
 *
 * Ce que les onze cases du site ne savent pas dire. Vide par défaut, et **jamais
 * déduit** : un sous-genre ne se devine pas d'un line-up. Ces libellés n'ont pas de
 * page, les rendre cliquables créerait des centaines d'URLs vides, ce que le projet
 * refuse partout ailleurs.
 */
export function artistSubGenres(a: Artist): string[] {
  return ARTIST_STYLES[a.slug]?.s ?? [];
}

/** D'où vient l'attribution, quand il y en a une (pour l'audit, pas pour l'affichage). */
export const artistStyleSource = (slug: string): string | undefined => ARTIST_STYLES[slug]?.src;

export const artistBySlug = (slug: string): Artist | undefined => ARTISTS.find((a) => a.slug === slug);

/**
 * Cet artiste a-t-il une page ?
 *
 * `ARTISTS` est **dérivé des line-ups du catalogue à la compilation** : tant qu'une
 * affiche ne bouge qu'à travers `lib/data.ts`, tout nom d'un line-up a sa fiche, et la
 * question ne se pose pas. Elle se pose depuis qu'une fiche peut recevoir une correction
 * en direct (`lib/event-edits.ts`) : un nom ajouté ce matin n'entrera dans l'index
 * qu'au prochain déploiement, et le lier tout de suite donnerait un 404 sur une page
 * indexée. Le line-up rend alors le nom sans lien, ce qui est simplement vrai.
 *
 * Un `Set` plutôt qu'un `find` : une affiche de festival compte jusqu'à 54 noms, et la
 * question est posée pour chacun sur chacune des fiches.
 */
const ARTIST_SLUGS = new Set(ARTISTS.map((a) => a.slug));
export const hasArtistPage = (slug: string): boolean => ARTIST_SLUGS.has(slug);

export const eventsForArtist = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS.filter((e) => e.lineup.some((n) => slugify(n.trim()) === slug)));

/**
 * Les artistes proches, pour le bloc « À découvrir aussi ».
 *
 * Comparait `Artist.genres`, l'union brute, donc deux artistes qui n'ont en commun
 * que d'avoir joué au même festival multi-genres se retrouvaient « proches ». Sur un
 * catalogue où un seul festival étiqueté sur huit styles touche cinquante noms, ça
 * revenait à relier tout le monde à tout le monde. On compare maintenant les genres
 * retenus, et on classe sur le nombre de genres partagés avant le volume de dates.
 */
export const relatedArtists = (a: Artist, limit = 6): Artist[] => {
  const mine = new Set(artistGenres(a));
  return ARTISTS.filter((x) => x.slug !== a.slug)
    .map((x) => ({ x, shared: artistGenres(x).filter((g) => mine.has(g)).length }))
    .filter((r) => r.shared > 0)
    .sort((r, s) => s.shared - r.shared || s.x.eventIds.length - r.x.eventIds.length)
    .slice(0, limit)
    .map((r) => r.x);
};
