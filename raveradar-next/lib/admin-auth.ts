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
