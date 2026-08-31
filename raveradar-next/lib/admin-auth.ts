import { ownerGate } from "./owner-auth";

/**
 * Qui peut ouvrir `/admin`.
 *
 * `ADMIN_PASSWORD` d'abord, et **repli sur `TRACKING_PASSWORD`** : il y a une seule
 * personne derrière ces deux pages, et lui demander de configurer un second secret pour
 * la même main serait le meilleur moyen qu'elle en choisisse un faible. Poser
 * `ADMIN_PASSWORD` sépare les deux quand on veut confier l'audience sans confier la
 * suppression de comptes.
 *
 * Le cookie et le sel du secret sont propres à la console : même avec le même mot de
 * passe, un cookie `/suivi` n'ouvre pas `/admin`, et changer l'un ne déconnecte pas
 * l'autre.
 */
export const ADMIN = ownerGate({
  cookie: "rr_admin",
  passwordEnv: ["ADMIN_PASSWORD", "TRACKING_PASSWORD"],
  secretEnv: ["ADMIN_SECRET"],
  scope: "rr-admin",
  // Plus court que les 30 jours du suivi : cette porte-là supprime des comptes.
  sessionSeconds: 7 * 24 * 3600,
});

/* ---------------------------------------------------------------------------
   L'accès par compte
--------------------------------------------------------------------------- */

/**
 * Les adresses qui ouvrent la console avec leur propre compte promoteur.
 *
 * Le mot de passe suffisait, mais il oblige à en retenir un de plus et il ne dit pas
 * *qui* agit. Un propriétaire qui a déjà un compte sur le site doit pouvoir supprimer un
 * dépôt sans ressaisir un secret d'environnement.
 *
 * `ADMIN_EMAILS` accepte une liste séparée par des virgules ; par défaut, l'adresse du
 * propriétaire du site.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "djaym.info@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email: string): boolean => ADMIN_EMAILS.includes(email.trim().toLowerCase());

/** Les adresses déclarées, pour que la console puisse les afficher. */
export const adminEmails = (): string[] => [...ADMIN_EMAILS];
