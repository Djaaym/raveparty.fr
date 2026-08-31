import type { EventSubmission, PromoterAccount } from "./accounts";
import { kvCreds, kvPipeline, type KvCreds } from "./kv";

/**
 * Où vivent les comptes promoteurs et leurs dépôts.
 *
 * Même magasin et même raisonnement que `lib/track-store.ts` : le site n'a pas de base
 * de données, et ce n'est pas cette fonctionnalité qui doit en introduire une. Un compte
 * se lit par son adresse, s'écrit en entier, et il y en aura des dizaines, pas des
 * millions. C'est une clé Redis, pas un schéma.
 *
 *   rr:pro:u:{email}     le compte, JSON
 *   rr:pro:all           la liste des adresses, dans l'ordre d'inscription
 *   rr:pro:s:{id}        un dépôt d'événement, JSON
 *   rr:pro:so:{email}    les dépôts d'un compte, du plus ancien au plus récent
 *   rr:pro:sall          tous les dépôts, pour la relecture du propriétaire
 *
 * **Aucun TTL, contrairement aux hits.** Un compte n'est pas une donnée de mesure : il
 * doit être là dans un an. C'est aussi pourquoi le repli en mémoire est traité tout
 * autrement, là-bas il dégrade un tableau de bord, ici il rendrait un mot de passe et un
 * dossier de validation dans la nature au premier redéploiement. `isConfigured()` dit
 * s'il y a un vrai magasin, et les routes répondent 501 quand il n'y en a pas, plutôt
 * que d'annoncer un compte créé que personne ne retrouvera. Le repli mémoire ne sert
 * qu'à `next dev`.
 *
 * Variables, dans l'ordre de préférence :
 *   ACCOUNTS_KV_REST_API_URL + ACCOUNTS_KV_REST_API_TOKEN   (explicite, gagne)
 *   KV_REST_API_URL          + KV_REST_API_TOKEN            (ce que Vercel injecte)
 *   UPSTASH_REDIS_REST_URL   + UPSTASH_REDIS_REST_TOKEN     (ce qu'Upstash injecte)
 */

const U = "rr:pro:u:";
const ALL = "rr:pro:all";
const S = "rr:pro:s:";
const SO = "rr:pro:so:";
const SALL = "rr:pro:sall";

const creds = (): KvCreds | null => kvCreds("ACCOUNTS_KV_REST_API");

export const isConfigured = (): boolean => Boolean(creds());

/** Le repli mémoire est réservé au développement : en production, un compte qui ne
 *  survit pas au prochain démarrage de lambda est pire que pas de compte du tout. */
export const memoryOnlyAllowed = (): boolean => process.env.NODE_ENV !== "production";

/* ---------------------------------------------------------------------------
   Repli mémoire (développement)
--------------------------------------------------------------------------- */

/* Sur `globalThis`, pour la même raison que le secret de session : `next dev` compile un
   graphe de modules par route, donc deux `new Map()` distinctes, et un compte créé par
   `/signup` restait introuvable depuis `/me`. En production ce repli est refusé, mais
   c'est en développement qu'il doit marcher. */
const G = globalThis as { __rrAccounts?: Map<string, string>; __rrAccountLists?: Map<string, string[]> };
const MEM = (G.__rrAccounts ??= new Map<string, string>());
const MEM_LISTS = (G.__rrAccountLists ??= new Map<string, string[]>());

/* ---------------------------------------------------------------------------
   Primitives
--------------------------------------------------------------------------- */

async function get<T>(key: string): Promise<T | null> {
  const c = creds();
  if (!c) {
    const raw = MEM.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const [reply] = await kvPipeline([["GET", key]], c);
  if (reply?.error) throw new Error(reply.error);
  const raw = reply?.result;
  return typeof raw === "string" && raw ? (JSON.parse(raw) as T) : null;
}

async function set(key: string, value: unknown, pushTo?: [string, string]): Promise<void> {
  const payload = JSON.stringify(value);
  const c = creds();
  if (!c) {
    MEM.set(key, payload);
    if (pushTo) {
      const list = MEM_LISTS.get(pushTo[0]) ?? [];
      if (!list.includes(pushTo[1])) list.push(pushTo[1]);
      MEM_LISTS.set(pushTo[0], list);
    }
    return;
  }
  const cmds: (string | number)[][] = [["SET", key, payload]];
  // L'index est une liste et non un ensemble : l'ordre d'inscription est l'ordre dans
  // lequel le propriétaire veut relire, et RPUSH n'est appelé qu'à la création.
  if (pushTo) cmds.push(["RPUSH", pushTo[0], pushTo[1]]);
  const replies = await kvPipeline(cmds, c);
  const failed = replies.find((r) => r.error);
  if (failed) throw new Error(failed.error);
}

/**
 * Supprime des clés, et retire au passage des valeurs des listes d'index.
 *
 * Les deux vont ensemble, toujours : un id resté dans `rr:pro:sall` alors que sa valeur
 * a disparu est exactement le défaut des maps indexées par id de `lib/data.ts`, où
 * `IMAGES`, `PHOTOS` et `TICKETS` gardaient des entrées pointant sur des événements
 * supprimés, et où `patch_data_ts()` finissait par planter dessus. Ici la conséquence
 * est plus douce (une ligne manquante à la relecture) mais la règle est la même : on
 * élague l'index en même temps que la valeur.
 */
async function drop(keys: string[], fromLists: [string, string][] = []): Promise<void> {
  const c = creds();
  if (!c) {
    for (const k of keys) MEM.delete(k);
    for (const [list, value] of fromLists) {
      const rows = MEM_LISTS.get(list);
      if (rows) MEM_LISTS.set(list, rows.filter((v) => v !== value));
    }
    return;
  }
  const cmds: (string | number)[][] = [];
  if (keys.length) cmds.push(["DEL", ...keys]);
  // LREM avec un compte de 0 retire *toutes* les occurrences : un id poussé deux fois
  // par une reprise ne doit pas survivre à sa propre suppression.
  for (const [list, value] of fromLists) cmds.push(["LREM", list, 0, value]);
  if (!cmds.length) return;
  const replies = await kvPipeline(cmds, c);
  const failed = replies.find((r) => r.error);
  if (failed) throw new Error(failed.error);
}

async function listRange(key: string, start: number, stop: number): Promise<string[]> {
  const c = creds();
  if (!c) {
    const list = MEM_LISTS.get(key) ?? [];
    const from = start < 0 ? Math.max(0, list.length + start) : start;
    const to = stop < 0 ? list.length + stop : stop;
    return list.slice(from, to + 1);
  }
  const [reply] = await kvPipeline([["LRANGE", key, start, stop]], c);
  if (reply?.error) throw new Error(reply.error);
  return Array.isArray(reply?.result) ? (reply.result as string[]) : [];
}

async function getMany<T>(keys: string[]): Promise<T[]> {
  if (!keys.length) return [];
  const c = creds();
  if (!c) return keys.map((k) => MEM.get(k)).filter(Boolean).map((raw) => JSON.parse(raw as string) as T);
  const out: T[] = [];
  // Par paquets : un pipeline de quarante clés passe, un de mille alourdit le corps REST.
  for (let i = 0; i < keys.length; i += 40) {
    const replies = await kvPipeline(keys.slice(i, i + 40).map((k) => ["GET", k]), c);
    for (const r of replies) {
      if (typeof r.result === "string" && r.result) {
        try {
          out.push(JSON.parse(r.result) as T);
        } catch {
          /* Une ligne illisible ne fait pas perdre la liste entière. */
        }
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Comptes
--------------------------------------------------------------------------- */

export const getAccount = (email: string): Promise<PromoterAccount | null> => get<PromoterAccount>(U + email);

/** Crée le compte, sauf si l'adresse est déjà prise. Le contrôle et l'écriture ne sont
 *  pas atomiques : deux inscriptions simultanées sur la même adresse sont possibles en
 *  théorie, la seconde écrase la première. Le coût réel est nul (le propriétaire valide
 *  à la main derrière) et l'alternative, un verrou, coûterait plus cher que le défaut. */
export async function createAccount(account: PromoterAccount): Promise<boolean> {
  if (await getAccount(account.email)) return false;
  await set(U + account.email, account, [ALL, account.email]);
  return true;
}

export const saveAccount = (account: PromoterAccount): Promise<void> => set(U + account.email, account);

/** Tous les comptes, les derniers inscrits d'abord. Sert la relecture du propriétaire. */
export async function listAccounts(limit = 200): Promise<PromoterAccount[]> {
  const emails = await listRange(ALL, -limit, -1);
  const accounts = await getMany<PromoterAccount>(emails.map((e) => U + e));
  return accounts.reverse();
}

/* ---------------------------------------------------------------------------
   Dépôts
--------------------------------------------------------------------------- */

export const getSubmission = (id: string): Promise<EventSubmission | null> => get<EventSubmission>(S + id);

export const saveSubmission = (s: EventSubmission): Promise<void> => set(S + s.id, s);

export async function createSubmission(s: EventSubmission): Promise<void> {
  await set(S + s.id, s, [SO + s.owner, s.id]);
  const c = creds();
  if (!c) {
    const list = MEM_LISTS.get(SALL) ?? [];
    list.push(s.id);
    MEM_LISTS.set(SALL, list);
    return;
  }
  await kvPipeline([["RPUSH", SALL, s.id]], c);
}

/** Les dépôts d'un compte, du plus récent au plus ancien. */
export async function listSubmissions(email: string, limit = 100): Promise<EventSubmission[]> {
  const ids = await listRange(SO + email, -limit, -1);
  const rows = await getMany<EventSubmission>(ids.map((id) => S + id));
  return rows.reverse();
}

/** Combien de dépôts un compte a faits sur la fenêtre glissante, le garde-fou contre un
 *  compte approuvé qui déverserait son agenda entier en une nuit. */
export async function countRecentSubmissions(email: string, sinceIso: string): Promise<number> {
  const rows = await listSubmissions(email, 60);
  return rows.filter((r) => r.createdAt >= sinceIso).length;
}

/** Tous les dépôts, les plus récents d'abord. Sert la relecture du propriétaire, qui
 *  doit voir ce qui arrive quel que soit le compte d'où ça vient. */
export async function listAllSubmissions(limit = 200): Promise<EventSubmission[]> {
  const ids = await listRange(SALL, -limit, -1);
  const rows = await getMany<EventSubmission>(ids.map((id) => S + id));
  return rows.reverse();
}

/** Supprime un dépôt, et son id dans les deux index qui le citent. */
export async function deleteSubmission(id: string): Promise<boolean> {
  const sub = await getSubmission(id);
  if (!sub) return false;
  await drop([S + id], [[SO + sub.owner, id], [SALL, id]]);
  return true;
}

/**
 * Supprime un compte **et tout ce qu'il a déposé**.
 *
 * En cascade, et non « le compte seul » : un dépôt orphelin n'a plus de structure
 * derrière lui, donc plus rien à vérifier ni personne à qui répondre, et il resterait
 * dans la file de relecture sans que rien ne dise pourquoi il est là. Supprimer un
 * compte est de toute façon la mesure la plus lourde de la console, elle doit être
 * complète plutôt qu'à moitié faite.
 *
 * Rend le nombre de dépôts partis avec, pour que la console puisse le dire avant et
 * après : « supprimer ce compte et ses 4 dépôts » n'est pas la même décision que
 * « supprimer ce compte ».
 */
export async function deleteAccount(email: string): Promise<{ ok: boolean; submissions: number }> {
  const account = await getAccount(email);
  if (!account) return { ok: false, submissions: 0 };

  const ids = await listRange(SO + email, 0, -1);
  await drop(
    [U + email, SO + email, ...ids.map((id) => S + id)],
    [[ALL, email], ...ids.map((id): [string, string] => [SALL, id])],
  );
  return { ok: true, submissions: ids.length };
}

/** État du magasin, affiché tel quel dans les pages qui en dépendent. */
export async function ping(): Promise<{ ok: boolean; detail: string }> {
  const c = creds();
  if (!c) return { ok: false, detail: "mémoire du processus (non persistant)" };
  try {
    const [reply] = await kvPipeline([["PING"]], c);
    if (reply?.error) return { ok: false, detail: reply.error };
    return { ok: true, detail: String(reply?.result ?? "PONG") };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message.slice(0, 160) : "réseau" };
  }
}
