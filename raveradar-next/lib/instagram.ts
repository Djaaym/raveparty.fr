/**
 * Les deux URL du lecteur Instagram, et rien d'autre, volontairement.
 *
 * Ce module existe pour ce qu'il **n'importe pas**. `<InstagramFeed>` est un composant
 * client, et il tirait ces deux fonctions de `lib/socials.ts`, qui importe `slugify`
 * de `lib/data.ts`. Une ligne d'import, et le bundler embarquait tout le catalogue,
 * les 870 événements avec leurs descriptions FR *et* EN, plus les maps d'images, de
 * photos et de billetterie, dans le JavaScript de **chaque fiche événement, festival,
 * artiste et lieu** : 218 Ko compressés, sur environ 3 000 pages, pour deux gabarits
 * d'URL que le navigateur aurait pu écrire lui-même.
 *
 * D'où la règle : ce fichier ne doit jamais importer quoi que ce soit. `lib/socials.ts`
 * les ré-exporte, donc rien d'autre ne change côté serveur.
 */

/** Le lecteur officiel d'un post, avec sa légende, ce que charge l'iframe au clic. */
export const embedUrl = (code: string): string =>
  `https://www.instagram.com/p/${code}/embed/captioned/`;

/** Le permalien public du post, la cible de l'ancre rendue avant tout clic. */
export const postUrl = (code: string): string => `https://www.instagram.com/p/${code}/`;
