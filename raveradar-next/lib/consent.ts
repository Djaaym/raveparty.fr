/**
 * Le consentement aux traceurs, et rien d'autre.
 *
 * Trois traceurs tournaient sur chaque page sans que personne n'ait rien accepté :
 * Google Analytics, le tag d'affiliation Impact (qui appelle `trackImpression()` dès
 * l'affichage) et le collecteur maison. Les deux premiers déposent des cookies, donc
 * relèvent de l'article 82 de la loi Informatique et Libertés : le consentement est
 * préalable, et son absence est exactement la configuration que la CNIL sanctionne.
 *
 * Le collecteur maison, lui, **n'est pas concerné et ne doit pas l'être** : pas de
 * cookie, pas d'IP conservée, identifiant aléatoire en mémoire de navigateur, finalité
 * limitée à la mesure d'audience du site. C'est la forme exemptée, et la conditionner
 * au consentement reviendrait à ne plus mesurer que les visiteurs qui acceptent GA,
 * c'est-à-dire à perdre la seule mesure honnête qu'on ait. Voir `docs/suivi.md`.
 *
 * Module **feuille**, importé par un composant client : il ne connaît ni le catalogue
 * ni l'i18n. Il ne décide pas non plus de ce qui se charge, il ne fait que dire l'état.
 */

/** La valeur stockée. `null` = personne n'a encore répondu, donc rien ne se charge. */
export type Consent = "granted" | "denied";

/**
 * `localStorage` et pas un cookie, volontairement : un cookie de consentement voyage
 * dans chaque requête, y compris celles des pages statiques servies par le CDN, et un
 * en-tête qui varie casse la mise en cache de tout le site. Le choix n'a besoin d'être
 * lu que par le navigateur qui l'a fait.
 */
export const CONSENT_KEY = "rr_consent";
/** Six mois, la durée que la CNIL retient pour ne pas redemander sans arrêt après un refus. */
export const CONSENT_MAX_AGE_DAYS = 182;
/** Émis quand le choix change, pour que la bannière et les scripts se recalent sans rechargement. */
export const CONSENT_EVENT = "rr-consent";

type Stored = { v: Consent; t: number };

/** Le choix en cours, ou `null` s'il n'y en a pas (jamais répondu, ou réponse périmée). */
export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (s.v !== "granted" && s.v !== "denied") return null;
    // Un choix expiré vaut « pas de choix » : on redemande, on ne suppose rien.
    if (Date.now() - s.t > CONSENT_MAX_AGE_DAYS * 86400_000) return null;
    return s.v;
  } catch {
    // Navigation privée, stockage bloqué : on considère qu'il n'y a pas de consentement,
    // ce qui est le seul repli sûr, l'inverse chargerait les traceurs sur un doute.
    return null;
  }
}

export function writeConsent(v: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v, t: Date.now() } satisfies Stored));
  } catch {
    /* Rien à faire : le choix vaudra pour cette page, et sera redemandé ensuite. */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

/** Efface le choix pour rouvrir la bannière (lien « gérer les cookies » du pied de page). */
export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* voir ci-dessus */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
