import { ownerGate } from "./owner-auth";

/**
 * Qui peut lire le tableau de bord d'audience.
 *
 * Un mot de passe, tenu dans `TRACKING_PASSWORD`, échangé contre un cookie signé. Pas de
 * table d'utilisateurs, pas de fournisseur, pas d'aller-retour OAuth : il y a exactement
 * une personne qui doit voir cette page, et tout ce qui serait plus élaboré ferait plus
 * de surface pour le même résultat.
 *
 * La mécanique elle-même (cookie sans état, HMAC de l'expiration, comparaison à temps
 * constant) vit dans `lib/owner-auth.ts` : la console d'administration a besoin de la
 * même, et deux copies du même HMAC font deux corrections à faire le jour où l'une se
 * trompe. Ce module n'en garde que le paramétrage, et ses exports d'origine, pour que
 * `/suivi` et ses routes n'aient rien à changer.
 *
 * Sans `TRACKING_PASSWORD`, le tableau de bord refuse de s'ouvrir plutôt que de retomber
 * sur quelque chose de devinable : une page d'analytics laissée entrouverte montre des
 * parcours de visite individuels.
 *
 * `TRACKING_SECRET` découple la clé de signature du mot de passe. Par défaut elle en est
 * dérivée, avec la conséquence délibérée qu'un changement de mot de passe invalide tous
 * les cookies émis, ce qu'on attend d'un changement de mot de passe.
 */
const GATE = ownerGate({
  cookie: "rr_track",
  passwordEnv: ["TRACKING_PASSWORD"],
  secretEnv: ["TRACKING_SECRET"],
  scope: "rr-track",
});

export const COOKIE = GATE.cookie;

/** 30 jours. Assez long pour ne pas être une corvée, assez court pour qu'un cookie volé
 *  finisse par expirer. */
export const SESSION_SECONDS = GATE.sessionSeconds;

export const isConfigured = GATE.isConfigured;
export const passwordOk = GATE.passwordOk;
export const issueToken = GATE.issueToken;
export const verifyToken = GATE.verifyToken;
