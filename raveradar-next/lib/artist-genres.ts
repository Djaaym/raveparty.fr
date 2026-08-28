/**
 * Le style de chaque artiste — attribué, pas déduit.
 *
 * Module **feuille** : il n'importe rien, pas même un type de `lib/data.ts`. C'est
 * délibéré, pour la raison documentée sur `lib/display.ts` — un composant client qui
 * toucherait `lib/data.ts` embarquerait les 870 événements du catalogue.
 *
 * ## Pourquoi une map plutôt qu'un calcul
 *
 * Le site savait déjà classer un artiste : `rankGenres()` pondère les genres des
 * soirées où il joue. C'est une déduction, et elle a une limite qu'aucun réglage ne
 * corrige — un festival étiqueté sur huit styles étiquette du même coup les cinquante
 * noms de son affiche. Le jeu brut affirmait ainsi qu'I Hate Models joue de la
 * psytrance. La pondération réduit le bruit, elle ne crée pas l'information manquante :
 * le calendrier ne sait pas ce que joue un artiste, il sait où il joue.
 *
 * `ARTIST_STYLES` porte l'information elle-même, récoltée par
 * `.research/artists/harvest.py` (Wikidata P136, tags MusicBrainz, tags last.fm) et par
 * les lots de recherche `genres-*.json`, puis fusionnée par `.research/artists/genres.py`.
 * `src` dit d'où vient l'attribution, ce qui permet de la reprendre : une entrée
 * `"last.fm"` est un vote de communauté, une entrée `"research"` a été lue quelque part.
 *
 * **Un artiste absent de la map n'est pas une erreur** : aucune source ne le décrivait,
 * `artistGenres()` retombe alors sur `rankGenres()` et sa page ne change pas. Un trou
 * est honnête ; une étiquette plausible ne l'est pas. Ne jamais compléter cette map à la
 * main — elle est réécrite entre les marqueurs STYLES:start / STYLES:end.
 *
 * ## Principal et sous-genre
 *
 * `m` ne contient que des clés de `GENRES` (lib/display.ts) : ce sont les onze cases du
 * site, celles qui ont une page derrière, donc les seules qui peuvent devenir un lien.
 * `s` porte ce que onze cases ne savent pas dire — « Industrial Techno », « Rawstyle »,
 * « Neurofunk », « Tech House ». Ces libellés n'ont **pas** de page : les afficher en
 * lien créerait des centaines d'URLs vides, exactement les pages satellites que le
 * projet évite partout ailleurs. Ils s'affichent, ils ne cliquent pas.
 */

export interface ArtistStyle {
  /** Genres principaux — clés de `GENRES`, le plus représentatif d'abord. 1 à 3. */
  m: string[];
  /** Sous-genres, en libellé d'affichage. Aucune page derrière : jamais un lien. */
  s: string[];
  /** Provenance de l'attribution : "research", ou la liste des sources automatiques. */
  src: string;
}

/* STYLES:start — généré par .research/artists/genres.py, ne pas éditer à la main */
export const ARTIST_STYLES: Record<string, ArtistStyle> = {
};
/* STYLES:end */

export const styleFor = (slug: string): ArtistStyle | undefined => ARTIST_STYLES[slug];
