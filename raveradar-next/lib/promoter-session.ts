import type { PromoterAccount } from "./accounts";
import { getAccount } from "./accounts-store";
import { SESSION_COOKIE, readSession, sessionMatches } from "./promoter-auth";

/**
 * Le compte derrière une requête, ou rien.
 *
 * Le cookie est lu depuis l'en-tête plutôt que par `next/headers` : les routes qui s'en
 * servent sont déjà dynamiques, et une fonction qui prend une `Request` se teste sans
 * monter un contexte Next.
 *
 * Trois refus, et ils ne disent pas la même chose : signature invalide ou expirée
 * (`readSession`), mot de passe changé depuis (`sessionMatches`), compte disparu. Tous
 * rendent null, l'appelant répond 401 sans détailler lequel.
 */

/** Lit un cookie dans l'en-tête brut, sans dépendance. */
export function cookieValue(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export async function currentAccount(req: Request): Promise<PromoterAccount | null> {
  const session = readSession(cookieValue(req, SESSION_COOKIE));
  if (!session) return null;
  const account = await getAccount(session.email).catch(() => null);
  if (!account) return null;
  if (!sessionMatches(session.tag, account.password)) return null;
  return account;
}

/**
 * Le témoin que la nav lit.
 *
 * Le cookie de session est `HttpOnly`, donc le JavaScript de la page ne peut pas savoir
 * si quelqu'un est connecté sans demander au serveur. Or la nav est rendue sur **toutes**
 * les pages du site, y compris celle dont le LCP compte le plus : un appel à
 * `/api/promoteur/me` par chargement, pour 99 % de visiteurs anonymes, coûte une requête
 * à chaque page pour ne rien apprendre.
 *
 * D'où ce second cookie, lisible celui-là, qui ne porte **qu'un drapeau**. Il n'accorde
 * rien, ne prouve rien et n'est jamais lu côté serveur : il dit seulement à la nav
 * d'écrire « Mon compte » plutôt que « Connexion ». Il porte la même durée que la
 * session, donc les deux expirent ensemble.
 */
export const FLAG_COOKIE = "rr_pro_on";

/**
 * Le second témoin, celui qui décide d'afficher le bouton « Modifier » d'une fiche.
 *
 * Même nature et mêmes limites que le précédent : lisible, sans autorité, jamais lu
 * côté serveur. Il existe pour la même raison, en plus aiguë : une fiche événement est
 * une page statique, et il y en a des milliers. Y appeler `/api/promoteur/me` au
 * chargement ferait payer un aller-retour à chaque lecteur de chaque fiche pour
 * n'apprendre, dans l'immense majorité des cas, que personne n'est connecté.
 *
 * Qui pose ce cookie à la main dans son navigateur voit le bouton, et rien de plus :
 * `/api/event-edit` revérifie `adminAccess()` sur chacun de ses trois verbes.
 */
export const ADMIN_FLAG_COOKIE = "rr_admin_on";

function cookie(name: string, value: string, maxAge: number, httpOnly: boolean): string {
  const bits = [`${name}=${value}`, "Path=/", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (httpOnly) bits.push("HttpOnly");
  // `Secure` en production seulement : en `next dev` la page est servie en http, et un
  // cookie Secure y serait posé puis jamais renvoyé, donc une session qui ne s'ouvre pas.
  if (process.env.NODE_ENV === "production") bits.push("Secure");
  return bits.join("; ");
}

/** L'en-tête `Set-Cookie` de la session seule. `HttpOnly` et `SameSite=Lax` : le cookie
 *  ne doit jamais être lisible en JavaScript, et aucune requête ne le porte depuis un
 *  autre site sauf une navigation de premier niveau. */
export const sessionCookie = (token: string, maxAge: number): string =>
  cookie(SESSION_COOKIE, token, maxAge, true);

/** Les deux en-têtes à poser ensemble : la session et son témoin. */
export const sessionCookies = (token: string, maxAge: number, admin = false): string[] => [
  sessionCookie(token, maxAge),
  cookie(FLAG_COOKIE, "1", maxAge, false),
  // Posé *ou effacé* à chaque ouverture de session, jamais laissé tel quel : un compte
  // qui perd son statut d'administrateur ne doit pas garder le témoin d'avant, et une
  // session ouverte sur un autre compte dans le même navigateur non plus.
  admin ? cookie(ADMIN_FLAG_COOKIE, "1", maxAge, false) : cookie(ADMIN_FLAG_COOKIE, "", 0, false),
];

export const clearCookies = (): string[] => [
  cookie(SESSION_COOKIE, "", 0, true),
  cookie(FLAG_COOKIE, "", 0, false),
  cookie(ADMIN_FLAG_COOKIE, "", 0, false),
];

/** Le témoin d'administration seul, quand il n'y a pas de session à réémettre : c'est le
 *  cas du `GET /api/promoteur/me`, qui rattrape ainsi les sessions ouvertes avant que ce
 *  cookie n'existe, et celui de la porte à mot de passe de `/admin`, qui n'ouvre aucune
 *  session promoteur. */
export const adminFlagCookie = (on: boolean, maxAge: number): string =>
  on ? cookie(ADMIN_FLAG_COOKIE, "1", maxAge, false) : cookie(ADMIN_FLAG_COOKIE, "", 0, false);

/**
 * Une réponse JSON qui pose plusieurs cookies. `NextResponse.json({headers})` écrase
 * `set-cookie` d'une valeur à l'autre, il faut `append` pour en poser deux.
 */
export function withCookies(res: Response, cookies: string[]): Response {
  for (const c of cookies) res.headers.append("set-cookie", c);
  return res;
}
