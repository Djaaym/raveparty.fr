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

/* Index par slug, monté une fois. `artistBySlug()` est appelé au moins une fois par
   fiche, et un `.find()` parcourt les 6 035 artistes à chaque appel : sur les 12 360
   fiches du build, c'est 37 millions de comparaisons pour retrouver une entrée dont
   la clé est déjà l'identifiant. */
const BY_SLUG = new Map(ARTISTS.map((a) => [a.slug, a]));
export const artistBySlug = (slug: string): Artist | undefined => BY_SLUG.get(slug);

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

/**
 * Index slug -> dates, monté une fois, sur la règle exacte du filtre qu'il remplace.
 *
 * `eventsForArtist()` rebalayait les 2 053 événements et re-normalisait les 8 948 noms
 * de line-up **à chaque appel**, soit une centaine de millions d'appels à `slugify()`
 * sur les 12 360 fiches artistes que le build rend. C'est le même travail que
 * `buildArtists()` vient de faire, avec la même normalisation, jeté puis refait.
 *
 * Le `Set` par événement dédoublonne les line-ups où deux graphies d'un même nom se
 * suivent (« KRUELTY » et « Kruelty ») : `some()` ne rendait la date qu'une fois, une
 * liste construite par ajouts la rendrait deux.
 */
const EVENTS_BY_ARTIST = (() => {
  const m = new Map<string, RaveEvent[]>();
  for (const e of EVENTS) {
    const seen = new Set<string>();
    for (const raw of e.lineup) {
      const s = slugify(raw.trim());
      if (!s || seen.has(s)) continue;
      seen.add(s);
      const l = m.get(s);
      if (l) l.push(e);
      else m.set(s, [e]);
    }
  }
  return m;
})();

export const eventsForArtist = (slug: string): RaveEvent[] =>
  upcomingFirst(EVENTS_BY_ARTIST.get(slug) ?? []);

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
  const mine = artistGenres(a);
  if (!mine.length) return [];
  const set = new Set(mine);
  /* Un compartiment par nombre de genres partagés, plutôt qu'un tri général.
     Le score est borné par le nombre de genres de l'artiste (onze au plus, la
     taille de `GENRES`), alors que la liste à trier, elle, compte des milliers
     de noms : ordonner tout le catalogue pour n'en garder douze coûtait, sur les
     12 360 fiches du build, des centaines de millions de comparaisons et autant
     d'objets intermédiaires alloués puis jetés.
     L'ordre rendu ne change pas : les compartiments sont parcourus du score le
     plus élevé au plus faible, et chacun est classé sur le volume de dates,
     exactement les deux critères du tri d'origine. */
  const buckets: Artist[][] = Array.from({ length: mine.length + 1 }, () => []);
  for (const x of ARTISTS) {
    if (x.slug === a.slug) continue;
    // On parcourt `set`, pas les genres de x : le compte est ainsi borné par le
    // nombre de compartiments, qu'une éventuelle répétition côté x ferait sinon
    // déborder. Le résultat est le même, c'est la taille de l'intersection.
    const gx = artistGenres(x);
    let shared = 0;
    for (const g of set) if (gx.includes(g)) shared++;
    if (shared) buckets[shared].push(x);
  }
  const out: Artist[] = [];
  for (let s = buckets.length - 1; s > 0 && out.length < limit; s--) {
    const b = buckets[s];
    if (!b.length) continue;
    // `sort` est stable depuis ES2019, donc à score et volume égaux l'ordre reste
    // celui d'`ARTISTS`, comme avec le tri unique qu'on remplace.
    b.sort((p, q) => q.eventIds.length - p.eventIds.length);
    for (const x of b) {
      if (out.length >= limit) break;
      out.push(x);
    }
  }
  return out;
};
