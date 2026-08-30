import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Ce qui prouve qu'un promoteur est bien lui.
 *
 * Le site n'a pas de base de données et n'en introduit pas une pour ça : un compte est
 * une valeur JSON dans le même Redis que le suivi d'audience. Ce module ne s'occupe donc
 * que de cryptographie, l'empreinte du mot de passe, le cookie de session, et les jetons
 * à usage unique des liens que le propriétaire reçoit par mail.
 *
 * Il tourne **sur le runtime Node**, pas sur l'edge : `node:crypto` et scrypt en
 * dépendent. Les routes qui l'importent sont toutes en `dynamic = "force-dynamic"` et
 * aucun composant client ne le touche.
 *
 * ## Le mot de passe
 *
 * scrypt, celui de la bibliothèque standard, sans dépendance ajoutée. Le format stocké
 * est `scrypt$N$r$p$sel$empreinte`, tout en base64url : les paramètres voyagent avec
 * l'empreinte, donc les durcir plus tard ne casse pas les comptes existants, une
 * ancienne empreinte reste vérifiable avec les siens.
 *
 * ## La session
 *
 * Même principe que `lib/track-auth.ts`, un cookie signé et rien de stocké :
 * `email.expiration.marqueur.signature`, la signature étant un HMAC des trois premiers
 * champs. Rien à retrouver côté serveur, donc rien à faire expirer à la main, et un
 * cookie forgé échoue sur une comparaison, pas sur une recherche qu'on pourrait courser.
 *
 * Le `marqueur` est un condensé court de l'empreinte du mot de passe : changer de mot de
 * passe invalide donc toutes les sessions ouvertes, ce qui est précisément ce qu'on
 * attend d'un changement de mot de passe. Le statut du compte, lui, est relu à chaque
 * requête depuis le magasin, donc suspendre un compte prend effet tout de suite.
 */

export const SESSION_COOKIE = "rr_pro";

/** 30 jours, comme le tableau de bord : assez long pour ne pas être une corvée, assez
 *  court pour qu'un cookie volé finisse par ne plus rien ouvrir. */
export const SESSION_SECONDS = 30 * 24 * 3600;

/* ---------------------------------------------------------------------------
   Le secret de signature
--------------------------------------------------------------------------- */

/**
 * Dernier recours : un secret tiré au démarrage du processus. Les sessions ne survivent
 * alors pas à un redémarrage, ce qui est acceptable en développement et signalé par
 * `secretIsEphemeral()` partout ailleurs.
 *
 * Il est posé sur `globalThis` et non dans une constante de module, parce que `next dev`
 * compile **un graphe de modules par route** : deux routes qui importent ce fichier en
 * obtiennent deux instances, donc deux secrets, et le cookie émis par `/signup` échouait
 * à la vérification de `/me`. Le symptôme est trompeur, tout est correct des deux côtés,
 * la signature ne peut simplement pas se recouper. En production le secret est dérivé de
 * l'environnement, le cas ne se pose pas.
 */
const GLOBAL = globalThis as { __rrAccountSecret?: string };
const EPHEMERAL = (GLOBAL.__rrAccountSecret ??= randomBytes(32).toString("hex"));

function secretSource(): { value: string; ephemeral: boolean } {
  const own = process.env.ACCOUNT_SECRET;
  if (own) return { value: own, ephemeral: false };
  // Le jeton du magasin est stable pour un déploiement donné et n'est jamais exposé au
  // navigateur : il fait un secret dérivé acceptable tant qu'ACCOUNT_SECRET n'est pas posé.
  const kv = process.env.ACCOUNTS_KV_REST_API_TOKEN ?? process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kv) return { value: createHash("sha256").update("rr-accounts:" + kv).digest("hex"), ephemeral: false };
  return { value: EPHEMERAL, ephemeral: true };
}

export const secretIsEphemeral = (): boolean => secretSource().ephemeral;

const secret = (): string => secretSource().value;

const sign = (payload: string): string => createHmac("sha256", secret()).update(payload).digest("base64url");

/** Compare sans laisser fuir la longueur du préfixe commun. Le condensé préalable évite
 *  l'exigence de longueur égale de `timingSafeEqual`, qui lèverait, et lèverait justement
 *  quand les longueurs diffèrent. */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

/* ---------------------------------------------------------------------------
   Mot de passe
--------------------------------------------------------------------------- */

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  try {
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(keyB64, "base64url");
    const key = scryptSync(plain.normalize("NFKC"), salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** Le marqueur porté par le cookie : il change avec le mot de passe, donc un changement
 *  de mot de passe ferme les sessions ouvertes ailleurs. */
const passwordTag = (hash: string): string => createHash("sha256").update(hash).digest("base64url").slice(0, 12);

/* ---------------------------------------------------------------------------
   Session
--------------------------------------------------------------------------- */

export function issueSession(email: string, passwordHash: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  const tag = passwordTag(passwordHash);
  const payload = `${Buffer.from(email).toString("base64url")}.${exp}.${tag}`;
  return `${payload}.${sign(payload)}`;
}

/** L'adresse portée par un cookie valide, ou null. Ne dit rien du compte lui-même :
 *  le statut se relit dans le magasin, sinon suspendre un compte n'aurait aucun effet
 *  avant l'expiration du cookie. */
export function readSession(token: string | undefined, now = Date.now()): { email: string; tag: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [emailB64, expRaw, tag, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < now) return null;
  if (!safeEqual(sig, sign(`${emailB64}.${expRaw}.${tag}`))) return null;
  try {
    const email = Buffer.from(emailB64, "base64url").toString("utf8");
    return email ? { email, tag } : null;
  } catch {
    return null;
  }
}

/** Le cookie porte-t-il encore le bon mot de passe ? Appelé une fois le compte chargé. */
export const sessionMatches = (tag: string, passwordHash: string): boolean => tag === passwordTag(passwordHash);

/* ---------------------------------------------------------------------------
   Liens d'action du propriétaire
--------------------------------------------------------------------------- */

/**
 * Le jeton d'un lien « approuver » / « refuser » reçu par mail.
 *
 * C'est un GET qui change un état, ce qu'on éviterait sur un formulaire ; ici c'est le
 * point : le propriétaire doit pouvoir trancher depuis son téléphone, en un clic, sans
 * ouvrir de session. Ce qui protège le lien, c'est le HMAC, un jeton non deviné et lié à
 * la cible *et* à l'action, donc le lien « approuver » d'un compte n'ouvre rien d'autre.
 */
export const actionToken = (subject: string, action: string): string => sign(`action:${subject}:${action}`);

export const actionTokenOk = (subject: string, action: string, token: string | null): boolean =>
  Boolean(token) && safeEqual(token as string, actionToken(subject, action));

/** L'identifiant d'un dépôt. `randomUUID` plutôt qu'un compteur : deux lambdas peuvent
 *  enregistrer en même temps, et une clé qui se devine se parcourt. */
export const newId = (): string => randomUUID();
