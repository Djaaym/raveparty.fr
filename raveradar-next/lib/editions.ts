/**
 * Les éditions d'un festival récurrent, réduites à ce qu'il faut pour rattraper une URL.
 *
 * Le slug nu (`/festival/sonar`) appartient à l'édition qu'on veut faire lire, la
 * prochaine s'il en reste une, la plus récente sinon ; les autres portent leur année
 * (`/festival/sonar-2025`). Voir `eventSlug()` dans `lib/data.ts`. **Le slug nu se
 * déplace donc d'une édition à l'autre**, et c'est là qu'une URL se perd : le jour où
 * l'édition 2026 se termine, `/festival/sonar-2027`, déjà indexée depuis qu'on a saisi
 * la date, devient le slug nu et l'ancienne forme tombe en 404. Une URL gagnée ne
 * retombe jamais en 404, même règle que `lib/renamed.ts` et que les anciennes `/show/`.
 *
 * **Module feuille, généré, et sans dépendance, exprès** : il est importé par
 * `middleware.ts`, qui tourne sur le runtime edge, donc à chaque requête. Y tirer
 * `lib/data.ts` embarquerait les 868 événements dans ce bundle. Le bloc de données est
 * réécrit entre ses marqueurs par `node scripts/editions.mjs` (branché sur `prebuild`),
 * ne pas l'éditer à la main.
 *
 * **La résolution se fait à la requête, pas à la génération**, et c'est la raison d'être
 * de la forme ci-dessous. Une simple table « ancien slug → nouveau », figée au build,
 * serait fausse dès la bascule suivante : elle redirigerait vers le slug nu une page
 * d'archive parfaitement légitime, en 301, donc durablement. En gardant la date de fin
 * de chaque édition, le middleware refait le calcul d'`eventSlug()` avec le jour courant
 * et reste juste entre deux déploiements.
 */

export type EditionRef = {
  /** Année de l'édition, celle que porte le slug suffixé. */
  y: string;
  /** Dernier jour (`endDate ?? date`) : c'est lui qui décide si l'édition est passée. */
  end: string;
  /** L'arborescence où vit cette édition, un festival et une soirée ne cohabitent pas. */
  base: "event" | "festival";
};

/**
 * Chemin de redirection si `slug` est la forme suffixée de l'édition qui porte
 * actuellement le slug nu, `null` sinon (une vraie page d'archive, ou un slug inconnu).
 *
 * `today` est passé par l'appelant plutôt que lu ici : le middleware n'a pas de raison
 * de recalculer une date par requête, et un test doit pouvoir se placer un autre jour.
 */
export function editionRedirect(base: string, slug: string, today: string): string | null {
  const m = /^(.+)-(\d{4})$/.exec(slug);
  if (!m) return null;
  const eds = EDITIONS[m[1]];
  if (!eds) return null;
  // Même règle que `canonicalEditionId()` : la première édition pas encore terminée,
  // à défaut la dernière. `end >= today` est la négation exacte d'`isPast()`.
  const canon = eds.find((e) => e.end >= today) ?? eds[eds.length - 1];
  if (canon.y !== m[2] || canon.base !== base) return null;
  return `/${canon.base}/${m[1]}`;
}

/** Slug nu → ses éditions, par ordre de date. Seuls les titres qui en ont plusieurs. */
/* EDITIONS:start */
export const EDITIONS: Record<string, EditionRef[]> = {
  "awakenings-upclose": [{ y: "2026", end: "2026-05-16", base: "festival" }, { y: "2027", end: "2027-05-16", base: "festival" }],
  "dgtl-amsterdam": [{ y: "2026", end: "2026-04-03", base: "festival" }, { y: "2027", end: "2027-03-28", base: "festival" }],
  "dour-festival": [{ y: "2026", end: "2026-07-15", base: "festival" }, { y: "2027", end: "2027-07-11", base: "festival" }],
  "glitch-festival": [{ y: "2026", end: "2026-08-16", base: "festival" }, { y: "2027", end: "2027-08-14", base: "festival" }],
  "insane-festival": [{ y: "2026", end: "2026-05-14", base: "festival" }, { y: "2027", end: "2027-05-08", base: "festival" }],
  "kappa-futurfestival": [{ y: "2026", end: "2026-07-03", base: "festival" }, { y: "2027", end: "2027-07-04", base: "festival" }],
  "keeno-live-ft-vibre-strings": [{ y: "2026", end: "2026-11-28", base: "event" }, { y: "2027", end: "2027-04-10", base: "event" }],
  "monegros-desert-festival": [{ y: "2026", end: "2026-07-25", base: "festival" }, { y: "2027", end: "2027-07-31", base: "festival" }],
  "nature-one": [{ y: "2026", end: "2026-08-02", base: "festival" }, { y: "2027", end: "2027-08-01", base: "festival" }],
  "neopop-festival": [{ y: "2026", end: "2026-08-08", base: "festival" }, { y: "2027", end: "2027-08-05", base: "festival" }],
  "nuits-sonores": [{ y: "2026", end: "2026-05-13", base: "festival" }, { y: "2027", end: "2027-05-09", base: "festival" }],
  parookaville: [{ y: "2026", end: "2026-07-17", base: "festival" }, { y: "2027", end: "2027-07-18", base: "festival" }],
  sonar: [{ y: "2026", end: "2026-06-18", base: "festival" }, { y: "2027", end: "2027-06-19", base: "festival" }],
  "sunrise-festival": [{ y: "2026", end: "2026-08-02", base: "festival" }, { y: "2027", end: "2027-06-27", base: "festival" }],
  "the-history-of-jungle": [{ y: "2026", end: "2026-09-19", base: "event" }, { y: "2027", end: "2027-03-13", base: "event" }],
  "time-warp": [{ y: "2026", end: "2026-03-21", base: "festival" }, { y: "2027", end: "2027-04-03", base: "festival" }],
  "ultra-europe": [{ y: "2026", end: "2026-07-10", base: "festival" }, { y: "2027", end: "2027-07-11", base: "festival" }],
  untold: [{ y: "2026", end: "2026-08-09", base: "festival" }, { y: "2027", end: "2027-08-08", base: "festival" }],
};
/* EDITIONS:end */
