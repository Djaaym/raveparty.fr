/**
 * Le vocabulaire des sous-genres proposé au dépôt d'un événement.
 *
 * Onze genres principaux ont une page (`GENRES`, `lib/display.ts`) et ce sont les seuls
 * qui peuvent devenir un lien. Un sous-genre, lui, décrit sans cliquer : lui donner une
 * page créerait des centaines d'URLs vides, exactement les pages satellites que le
 * projet évite partout ailleurs. C'est la règle déjà écrite pour `ARTIST_STYLES.s`, et
 * les libellés d'ici sont les siens, repris tels quels pour que le catalogue parle d'une
 * seule voix, « Tech House » et non « tech-house » ou « TechHouse ».
 *
 * La liste est **indexée par genre principal** parce qu'une liste unique de cent
 * libellés ne se parcourt pas : quand un promoteur coche « Drum & Bass », les huit
 * propositions qu'il voit sont celles de la drum & bass. Elle n'est pas fermée pour
 * autant, la saisie libre reste possible, un style neuf apparaît toujours avant qu'une
 * liste ne le connaisse.
 *
 * Module **feuille** : aucun import, le formulaire est un composant client.
 */

export const SUBGENRES: Record<string, string[]> = {
  Techno: ["Melodic Techno", "Minimal Techno", "Peak Time Techno", "Detroit Techno", "Dub Techno", "Deep Techno", "Acid Techno", "Industrial Techno", "Hypnotic Techno", "Electro"],
  "Hard Techno": ["Schranz", "Hardgroove", "Industrial Techno", "Hard Groove", "Acid Techno", "Hard Trance", "Bouncy Techno"],
  "Acid Techno": ["Acid House", "Hard Acid", "Industrial Techno", "Electro", "Rave"],
  Hardstyle: ["Rawstyle", "Euphoric Hardstyle", "Raw Hardstyle", "Hard Dance", "Jumpstyle", "Xtra Raw"],
  Hardcore: ["Gabber", "Uptempo", "Frenchcore", "Happy Hardcore", "Terror", "Industrial Hardcore", "Millennium Hardcore"],
  EDM: ["Big Room", "Electro House", "Future House", "Progressive House", "Bass House", "Hands Up", "Melbourne Bounce"],
  "Drum & Bass": ["Liquid Drum & Bass", "Neurofunk", "Jump Up", "Jungle", "Halftime", "Rollers", "Breakbeat"],
  House: ["Tech House", "Deep House", "Afro House", "Progressive House", "Melodic House", "Disco", "Nu-Disco", "French House", "Garage House", "UK Garage", "Acid House", "Bass House"],
  Trance: ["Progressive Trance", "Psy-Trance", "Hard Trance", "Tech Trance", "Uplifting Trance", "Goa Trance", "Acid Trance"],
  Psytrance: ["Goa Trance", "Full-On", "Forest", "Progressive Psy", "Hi-Tech", "Dark Psy", "Psy-Chill"],
  Warehouse: ["Industrial Techno", "Hard Techno", "Rave", "Breakbeat", "EBM", "Acid Techno", "Hardgroove"],
};

/** Tout le vocabulaire, dédupliqué : ce que propose l'autocomplétion quand la saisie ne
 *  correspond à rien de la liste du genre choisi. */
export const ALL_SUBGENRES: string[] = Array.from(new Set(Object.values(SUBGENRES).flat())).sort((a, b) =>
  a.localeCompare(b, "fr"),
);

/** Au plus cinq. Au-delà, l'étiquetage ne décrit plus rien : c'est la même raison qui
 *  fait que `rankGenres()` coupe sous 20 % du meilleur score. */
export const MAX_SUBGENRES = 5;
