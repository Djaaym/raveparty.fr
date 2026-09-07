import type { RaveEvent } from "./types";
import { PLACES, eventsForPlace } from "./places";
import { upcoming } from "./data";
import type { Place } from "./places-list";

/**
 * Les pages géo qui n'ont rien à montrer, et ce qu'on en fait.
 *
 * Douze des 121 pages de `/rave-party/{lieu}` n'ont **aucune date à venir** : Lot,
 * Aude, Lozère, Hautes-Alpes, Drôme, Tarn, Aveyron… Ce sont, ironie du dossier, les
 * plus gros volumes de recherche du marché français (« rave party lot », 5 400 par
 * mois), mais ce volume est porté par des événements non déclarés, hors de la ligne
 * éditoriale du site. Les pages affichent donc « pas encore d'événement référencé ».
 *
 * Elles étaient malgré tout **au sitemap avec une priorité de 0,9** et liées depuis le
 * pied de page de chaque page du site. Deux dégâts distincts : Google y lit du contenu
 * mince répété d'un lieu à l'autre (le gabarit n'interpole que le nom), et tout le
 * maillage interne se déverse dans des pages sans issue.
 *
 * La règle appliquée ici : **une page géo entre au sitemap quand elle a de quoi être
 * une page**. En dessous, elle reste en ligne et garde son formulaire d'alerte (c'est
 * une captation légitime, et l'URL doit exister le jour où une date s'y tient), mais
 * elle passe en `noindex, follow` et sort du sitemap. `follow` et pas `nofollow` : ses
 * liens vers les villes voisines restent utiles, c'est la page elle-même qui n'a rien
 * à indexer.
 *
 * Le seuil est à **1** et non à zéro par choix : une page qui montre une soirée est
 * une réponse, une page qui n'en montre aucune est une promesse non tenue. Le calcul
 * se fait au build, donc une page se remet à s'indexer d'elle-même dès qu'un lot lui
 * apporte une date, sans rien à basculer à la main.
 */
export const THIN_MIN_EVENTS = 1;

/** Les slugs de lieu qui ont au moins une date à venir, donc quelque chose à indexer. */
export function livePlaceSlugs(today?: string): Set<string> {
  const out = new Set<string>();
  for (const p of PLACES) {
    if (upcoming(eventsForPlace(p), today).length >= THIN_MIN_EVENTS) out.add(p.slug);
  }
  return out;
}

/** Une page de lieu a-t-elle de quoi être indexée ? */
export function placeHasContent(place: Place | undefined, today?: string): boolean {
  if (!place) return false;
  return upcoming(eventsForPlace(place), today).length >= THIN_MIN_EVENTS;
}

/**
 * Le bloc `robots` d'une page de lieu vide.
 *
 * Rendu tel quel dans `generateMetadata`, il donne `<meta name="robots"
 * content="noindex, follow">`. Une page sans contenu ne se désindexe pas toute seule :
 * tant qu'elle est au sitemap et liée, Google la garde et la compte dans la qualité
 * moyenne du site.
 */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

/** Le sous-ensemble d'événements à venir d'un lieu, pour éviter un second calcul. */
export const placeUpcoming = (place: Place, today?: string): RaveEvent[] =>
  upcoming(eventsForPlace(place), today);
