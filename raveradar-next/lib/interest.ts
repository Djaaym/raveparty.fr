import type { Lang } from "./types";
import { isEmail, normalizeEmail } from "./alerts";

/**
 * « Ça m'intéresse » : le fanion posé sur un événement.
 *
 * **Module feuille**, comme `lib/display.ts` ou `lib/hotels.ts` : il ne tire ni le
 * catalogue ni le magasin, uniquement des types. C'est la condition pour que le bouton,
 * qui est monté sur **toutes** les cartes de toutes les grilles du site, puisse l'importer
 * sans faire entrer `lib/data.ts` dans le bundle du navigateur, la règle qui a déjà coûté
 * 218 Ko compressés sur chaque fiche le jour où `<InstagramFeed>` a tiré deux gabarits
 * d'URL de `lib/socials.ts`.
 *
 * Trois choses se décident ici, et rien d'autre :
 *
 * 1. **Qui** est intéressé. Le site n'oblige à rien : on peut poser un fanion sans
 *    compte et sans adresse. Il faut pourtant savoir compter, donc chaque navigateur
 *    porte un identifiant aléatoire (`visitorId`), exactement la forme que le suivi
 *    d'audience emploie déjà et que la CNIL exempte de consentement, aucun cookie,
 *    aucune IP conservée, rien qui remonte à une personne. Compter les requêtes plutôt
 *    que les visiteurs donnerait un chiffre que le premier rechargement de page fait
 *    doubler, c'est-à-dire un chiffre faux dans la seule direction qui nous arrange :
 *    c'est précisément la donnée inventée que la règle de contenu interdit, appliquée à
 *    une mesure au lieu d'une fiche.
 * 2. **Ce qu'on promet**. L'adresse mail est *facultative*. Sans elle le fanion compte et
 *    se souvient, avec elle il promet en plus un rappel. Un formulaire qui exigerait
 *    l'adresse pour un simple clic d'intérêt échangerait la mesure (que tout le monde
 *    peut donner) contre l'inscription (que peu donnent), et on n'aurait plus ni l'une ni
 *    l'autre.
 * 3. **Quand**. Sept jours avant le premier jour de l'événement : c'est la fenêtre où un
 *    rappel sert encore à quelque chose (billets, train, hôtel) et où le lien d'affiliation
 *    hôtel a un sens. La veille, tout est réservé ou rien ne l'est.
 */

/** Sept jours avant le premier jour. Voir l'en-tête : la fenêtre où un rappel sert encore. */
export const REMIND_DAYS = 7;

/**
 * Ce qu'un navigateur enregistre pour un événement.
 *
 * Il n'y a pas de clé « anonyme » séparée : un compte connecté est identifié par son
 * adresse, un visiteur par son identifiant de navigateur, et c'est la même ligne dans le
 * magasin. Quelqu'un qui pose le fanion sans compte puis se connecte laisse deux lignes,
 * donc deux intéressés pour une personne. Le cas existe, il est rare, et le corriger
 * demanderait de relier un identifiant anonyme à une adresse, c'est-à-dire exactement le
 * traçage que la forme actuelle évite. On préfère un chiffre légèrement haut à une donnée
 * personnelle de plus.
 */
export interface InterestRecord {
  /** Adresse du rappel, vide quand le visiteur n'en a pas donné. */
  email: string;
  /** Langue de la page où le fanion a été posé : le rappel part dans cette langue. */
  lang: Lang;
  /** ISO complet, pour que `/admin` sache dire depuis quand. */
  at: string;
  /**
   * ISO du jour où le rappel J-7 est parti. Sa présence est ce qui rend l'envoi
   * idempotent : le cron tourne tous les jours et une exécution relancée à la main ne
   * doit pas écrire deux fois à la même personne.
   */
  sent?: string;
}

/** Ce que la route reçoit sur le fil. */
export interface InterestInput {
  eventId: number;
  /** `true` pose le fanion, `false` le retire. */
  on: boolean;
  /** Identifiant de navigateur, ou vide quand une session de compte porte la requête. */
  visitor: string;
  /** Facultative : sans elle, on compte sans rien promettre. */
  email: string;
  lang: Lang;
}

/**
 * L'identifiant de navigateur : 16 à 64 caractères de `[a-z0-9]`, engendrés par
 * `crypto.randomUUID()` côté client.
 *
 * Il est **borné en forme, jamais cru sur parole**. C'est un point d'accès ouvert, par
 * nécessité (un visiteur anonyme n'a rien pour s'authentifier), donc la défense est la
 * même que pour `/api/track` : ne stocker que ce qu'on reconnaît, et tout borner. Un
 * identifiant libre laisserait écrire n'importe quelle chaîne dans un champ de hachage
 * Redis, et c'est nous qui paierions le stockage.
 */
export const VISITOR_RE = /^[a-z0-9]{16,64}$/;

/**
 * La clé de la personne dans le hachage de l'événement.
 *
 * Préfixée par sa nature : `m:` pour une adresse, `a:` pour un navigateur anonyme. Sans
 * ce préfixe, une adresse qui ressemblerait à un identifiant écraserait la ligne de
 * quelqu'un d'autre, et surtout on ne saurait plus lire le magasin.
 */
export const subjectKey = (input: { email: string; visitor: string }): string =>
  input.email ? `m:${input.email}` : `a:${input.visitor}`;

/** Lit la clé dans l'autre sens, pour `/admin` et pour le rappel. */
export const keyIsEmail = (key: string): boolean => key.startsWith("m:");

/**
 * Valide ce qui arrive sur le fil. `null` sur tout ce qui n'est pas utilisable, la
 * route répond alors 400 sans détailler : il n'y a rien à apprendre à un robot.
 *
 * Une adresse invalide n'est **pas** un refus : le fanion vaut par lui-même, et rejeter
 * le clic entier pour une faute de frappe dans un champ facultatif perdrait la mesure en
 * plus du rappel. On garde le clic, on jette l'adresse, et la réponse dit laquelle des
 * deux choses a été retenue.
 */
export function parseInterest(body: unknown): InterestInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const eventId = typeof b.eventId === "number" ? b.eventId : Number(b.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0 || eventId > 10_000_000) return null;

  const visitor = typeof b.visitor === "string" ? b.visitor.trim().toLowerCase() : "";
  if (visitor && !VISITOR_RE.test(visitor)) return null;

  const raw = typeof b.email === "string" ? normalizeEmail(b.email) : "";
  const email = raw && isEmail(raw) ? raw : "";

  /* Sans adresse et sans identifiant, il n'y a personne à compter : accepter la requête
     incrémenterait un compteur que rien ne permettrait de décrémenter au retrait. */
  if (!email && !visitor) return null;

  return { eventId, on: b.on !== false, visitor, email, lang: b.lang === "en" ? "en" : "fr" };
}

/**
 * Le jour visé par le rappel, calculé depuis un jour de référence.
 *
 * En UTC, comme `shiftDay()` dans `lib/hotels.ts` : un calcul de date en heure locale
 * fait glisser la fenêtre d'un jour deux fois par an, et un rappel qui part à J-6 ou à
 * J-8 est une erreur qu'on ne voit jamais passer.
 */
export function remindTarget(today: string, days = REMIND_DAYS): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
