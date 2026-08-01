/** Production base URL — change this to your real domain before deploying. */
export const SITE_URL = "https://raveparty.fr";

/**
 * Google Analytics 4 Measurement ID (looks like "G-XXXXXXXXXX").
 * Paste it here (or set NEXT_PUBLIC_GA_ID in Vercel env). Empty = GA disabled.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-M1CERK8ERF";

/**
 * Impact.com Universal Tracking Tag — programme d'affiliation Ticketmaster.
 * L'identifiant de compte fait partie de l'URL du tag (utt.impactcdn.com/{id}.js).
 * Vide = affiliation désactivée. Le tag doit rester présent dans le HTML de la
 * page d'accueil : c'est lui qu'Impact vient vérifier depuis « Ajouter un site Web ».
 */
export const IMPACT_UTT_ID =
  process.env.NEXT_PUBLIC_IMPACT_UTT_ID ?? "P-A7550075-4be3-413e-9b85-2f3a1ece72cd1";
