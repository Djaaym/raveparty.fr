import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Une porte à mot de passe unique, pour les pages qui n'appartiennent qu'au propriétaire.
 *
 * `/suivi` en avait déjà une, écrite pour lui (`lib/track-auth.ts`) : un mot de passe
 * échangé contre un cookie signé, aucun état stocké, le cookie étant `expiration.signature`
 * et la signature un HMAC de l'expiration. Rien à retrouver côté serveur, donc rien qui
 * puisse être racé, et un cookie forgé échoue sur une comparaison plutôt que sur une
 * recherche.
 *
 * La console d'administration a besoin d'exactement la même chose. Plutôt qu'une seconde
 * copie du même HMAC (le défaut que `lib/kv.ts` vient de refermer sur le client Redis),
 * la mécanique vit ici et chaque page en prend une **instance** : son cookie, sa variable
 * de mot de passe, sa clé de signature. Deux instances ne se déverrouillent pas l'une
 * l'autre, un cookie `/suivi` n'ouvre pas `/admin`.
 *
 * Sans mot de passe configuré, `isConfigured()` est faux et la page refuse de s'ouvrir
 * plutôt que de retomber sur quelque chose de devinable. Ces pages affichent des
 * parcours de visite individuels et permettent de supprimer des comptes : ce ne sont pas
 * des pages à laisser entrouvertes « le temps de configurer ».
 */

export interface OwnerGate {
  /** Nom du cookie de session. Distinct par instance, sinon les portes se confondent. */
  cookie: string;
  sessionSeconds: number;
  isConfigured(): boolean;
  passwordOk(candidate: unknown): boolean;
  issueToken(now?: number): string;
  verifyToken(token: string | undefined, now?: number): boolean;
}

export interface GateOptions {
  cookie: string;
  /** Variables lues dans l'ordre : la première renseignée gagne. Le repli permet à la
   *  console d'accepter le mot de passe du suivi tant qu'on ne lui en donne pas un. */
  passwordEnv: string[];
  /** Clé de signature explicite. Par défaut elle est dérivée du mot de passe, donc en
   *  changer déconnecte partout, ce qui est le comportement attendu d'un changement de
   *  mot de passe. La poser découple les deux. */
  secretEnv?: string[];
  /** Sel du secret dérivé : il sépare deux instances qui partageraient le mot de passe. */
  scope: string;
  sessionSeconds?: number;
}

/** 30 jours : assez long pour ne pas être une corvée, assez court pour qu'un cookie volé
 *  finisse par ne plus rien ouvrir. */
const DEFAULT_SESSION = 30 * 24 * 3600;

const firstSet = (names: string[]): string | undefined => {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return undefined;
};

/** Compare sans laisser fuir la longueur du préfixe commun. Le condensé préalable évite
 *  l'exigence de longueur égale de `timingSafeEqual`, qui lèverait, et lèverait justement
 *  quand les longueurs diffèrent. */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function ownerGate(opts: GateOptions): OwnerGate {
  const sessionSeconds = opts.sessionSeconds ?? DEFAULT_SESSION;
  const password = () => firstSet(opts.passwordEnv);

  const secret = () =>
    firstSet(opts.secretEnv ?? []) ??
    createHash("sha256").update(`${opts.scope}:${password() ?? ""}`).digest("hex");

  const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

  const isConfigured = () => Boolean(password());

  return {
    cookie: opts.cookie,
    sessionSeconds,
    isConfigured,

    passwordOk(candidate: unknown): boolean {
      const expected = password();
      if (!expected || typeof candidate !== "string" || !candidate) return false;
      return safeEqual(candidate, expected);
    },

    issueToken(now = Date.now()): string {
      const exp = Math.floor(now / 1000) + sessionSeconds;
      return `${exp}.${sign(String(exp))}`;
    },

    verifyToken(token: string | undefined, now = Date.now()): boolean {
      if (!token || !isConfigured()) return false;
      const dot = token.indexOf(".");
      if (dot < 1) return false;
      const exp = Number(token.slice(0, dot));
      if (!Number.isFinite(exp) || exp * 1000 < now) return false;
      return safeEqual(token.slice(dot + 1), sign(String(exp)));
    },
  };
}
