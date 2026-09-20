import { unstable_cache } from "next/cache";
import type { InterestRecord } from "./interest";
import { keyIsEmail, subjectKey } from "./interest";
import { kvCreds, kvPipeline, type KvCreds } from "./kv";

/**
 * Le magasin des fanions « ça m'intéresse ».
 *
 * Deux structures, et la seconde n'est pas une commodité :
 *
 * - `rr:int:{id}`, un **hachage par événement**, une ligne par personne
 *   (`subjectKey()` → `InterestRecord`). C'est lui qui dédoublonne (reposer le fanion
 *   réécrit la même ligne) et c'est lui que le rappel J-7 lit. `HLEN` donne le compte
 *   exact, donc le compte ne peut pas dériver de la réalité.
 * - `rr:int:n`, un **hachage global** id → compte. Redondant, et c'est le but : `/admin`
 *   classe les 2 300 événements du catalogue par intérêt, et le faire avec un `HLEN` par
 *   événement coûterait 2 300 allers-retours. Un `HGETALL` en coûte un. Il est réécrit
 *   depuis le `HLEN` vrai à chaque écriture, jamais incrémenté à l'aveugle : un compteur
 *   qu'on incrémente dérive au premier échec partiel, et un compteur faux sur une page
 *   publique est pire que pas de compteur, c'est la règle de la pilule de ville qui
 *   promet une date qui n'existe pas.
 *
 * **Pas de TTL sur les hachages d'événement.** Il serait tentant de les faire expirer
 * après la date, mais ce qu'on cherche à savoir, c'est justement « à quel point cet
 * événement était recherché » : effacer la mesure le lendemain reviendrait à jeter la
 * seule donnée que la fonctionnalité produit. L'élagage d'un événement disparu du
 * catalogue est un geste d'entretien, pas une politique de rétention, et il se fait
 * depuis `/admin` comme pour les maps indexées par id.
 */

const H = "rr:int:";
const COUNTS = "rr:int:n";
/* L'index inverse, adresse -> ids. Il n'existe que pour les comptes : c'est lui qui fait
   qu'un fanion posé sur un téléphone se retrouve dans « Mes favoris » sur un ordinateur,
   ce que `localStorage` ne peut pas faire par construction. Un visiteur anonyme n'en a
   pas, et n'en aurait aucun usage, sa seule identité est le navigateur qui porte déjà la
   liste. En tenir un pour lui reviendrait à constituer un historique par identifiant,
   c'est-à-dire le traçage que la forme anonyme évite. */
const OWNED = "rr:int:u:";

/** Le tag du cache de lecture. Voir `countsAll()` pour pourquoi il n'est pas invalidé à chaque clic. */
export const INTEREST_TAG = "rr-interest";

/* Même ordre de préférence que les autres magasins : une variable propre à la
   fonctionnalité d'abord, puis celle des comptes, puis ce que Vercel injecte. */
const creds = (): KvCreds | null => kvCreds("INTEREST_KV_REST_API", "ACCOUNTS_KV_REST_API");

export const isConfigured = (): boolean => Boolean(creds());

/* Repli mémoire réservé à `next dev`, posé sur `globalThis` : `next dev` compile un
   graphe de modules par route, donc deux `new Map()` distinctes, et un fanion posé
   depuis une fiche resterait introuvable depuis `/admin`. En production sans magasin la
   route d'écriture répond 501 plutôt que d'annoncer un rappel que personne n'enverra. */
const G = globalThis as {
  __rrInterest?: Map<number, Map<string, InterestRecord>>;
  __rrInterestOwned?: Map<string, Set<number>>;
};
const MEM = (G.__rrInterest ??= new Map<number, Map<string, InterestRecord>>());
const MEMOWNED = (G.__rrInterestOwned ??= new Map<string, Set<number>>());

export const memoryOnlyAllowed = (): boolean => process.env.NODE_ENV !== "production";

/** Upstash rend un hachage tantôt en objet, tantôt en tableau plat. Les deux formes sont
 *  lues plutôt que supposées, comme dans `lib/event-edits-store.ts`. */
function toRecord(result: unknown): Record<string, string> {
  if (Array.isArray(result)) {
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < result.length; i += 2) out[String(result[i])] = String(result[i + 1]);
    return out;
  }
  if (result && typeof result === "object") return result as Record<string, string>;
  return {};
}

const memFor = (id: number): Map<string, InterestRecord> => {
  const cur = MEM.get(id);
  if (cur) return cur;
  const next = new Map<string, InterestRecord>();
  MEM.set(id, next);
  return next;
};

/**
 * Pose ou retire un fanion, puis réaligne le compteur global sur le compte vrai.
 *
 * Rend le nouveau compte de l'événement, que la route renvoie au navigateur : le bouton
 * affiche alors le chiffre exact juste après le clic, sans second aller-retour.
 *
 * **L'écriture garde ce qu'elle ne remplace pas.** Quelqu'un qui a déjà donné son
 * adresse et qui repose le fanion depuis un autre onglet, sans la ressaisir, ne doit pas
 * la perdre : `previous` est relu et fusionné. C'est la même règle que `--merge` plutôt
 * que `--force` dans les chaînes de rafraîchissement, un lot complète une fiche bien plus
 * souvent qu'il ne la corrige.
 */
export async function setInterest(
  id: number,
  who: { email: string; visitor: string },
  on: boolean,
  record: Omit<InterestRecord, "sent">,
): Promise<number> {
  const key = subjectKey(who);
  const c = creds();

  /**
   * **Un retrait efface les deux clés possibles, une pose n'en écrit qu'une.**
   *
   * Le cas se produit tout seul : on marque une date sans rien donner (clé `a:{vid}`),
   * on laisse son adresse plus tard sur une autre date, et le jour où on retire le
   * premier fanion la requête porte maintenant une adresse, donc la clé `m:{adresse}`,
   * qui n'existe pas. Le `HDEL` ne trouve rien, la ligne anonyme reste, et le compteur
   * garde un intéressé qui ne l'est plus. Un compteur faux sur une page publique est
   * précisément ce que le module refuse ailleurs en réécrivant `rr:int:n` depuis le
   * `HLEN` vrai : il n'y aurait aucun sens à le laisser mentir par cette porte.
   *
   * Dans l'autre sens on n'écrit qu'une clé, la meilleure connue : dupliquer la ligne
   * compterait la même personne deux fois.
   */
  const gone = on ? [] : [...new Set([key, `a:${who.visitor}`])].filter((k) => k !== "a:");

  if (!c) {
    const h = memFor(id);
    if (on) h.set(key, { ...h.get(key), ...record });
    else for (const k of gone) h.delete(k);
    if (who.email) {
      const owned = MEMOWNED.get(who.email) ?? new Set<number>();
      if (on) owned.add(id);
      else owned.delete(id);
      MEMOWNED.set(who.email, owned);
    }
    return h.size;
  }

  if (on) {
    const [prev] = await kvPipeline([["HGET", H + id, key]], c);
    let merged: InterestRecord = { ...record };
    if (typeof prev?.result === "string") {
      try {
        merged = { ...(JSON.parse(prev.result) as InterestRecord), ...record };
      } catch {
        /* Une ligne illisible se remplace, elle ne fait pas échouer le clic. */
      }
    }
    const [write] = await kvPipeline([["HSET", H + id, key, JSON.stringify(merged)]], c);
    if (write?.error) throw new Error(write.error);
  } else {
    const [write] = await kvPipeline([["HDEL", H + id, ...gone]], c);
    if (write?.error) throw new Error(write.error);
  }

  /* Le compteur global est réécrit depuis le `HLEN` vrai, jamais incrémenté : voir
     l'en-tête du module. L'index inverse suit dans le même lot, un aller-retour. */
  const [len] = await kvPipeline([["HLEN", H + id]], c);
  const n = Number(len?.result ?? 0);
  const after: (string | number)[][] = [
    n > 0 ? ["HSET", COUNTS, String(id), String(n)] : ["HDEL", COUNTS, String(id)],
  ];
  if (who.email) after.push([on ? "SADD" : "SREM", OWNED + who.email, String(id)]);
  await kvPipeline(after, c);
  return n;
}

/** Ce qu'un navigateur ou un compte a posé sur un événement, ou rien. */
export async function interestOf(id: number, who: { email: string; visitor: string }): Promise<InterestRecord | null> {
  const c = creds();
  if (!c) return memFor(id).get(subjectKey(who)) ?? null;
  const [reply] = await kvPipeline([["HGET", H + id, subjectKey(who)]], c);
  if (typeof reply?.result !== "string") return null;
  try {
    return JSON.parse(reply.result) as InterestRecord;
  } catch {
    return null;
  }
}

/** Toutes les lignes d'un événement. Lue sans cache : c'est le rappel et `/admin` qui
 *  s'en servent, et tous deux doivent voir l'état vrai du magasin. */
export async function interestedIn(id: number): Promise<Record<string, InterestRecord>> {
  const c = creds();
  if (!c) return Object.fromEntries(memFor(id));
  const [reply] = await kvPipeline([["HGETALL", H + id]], c);
  if (reply?.error) throw new Error(reply.error);
  const out: Record<string, InterestRecord> = {};
  for (const [field, raw] of Object.entries(toRecord(reply?.result))) {
    try {
      out[field] = JSON.parse(raw) as InterestRecord;
    } catch {
      /* Une ligne illisible ne fait pas perdre les autres. */
    }
  }
  return out;
}

/** Les adresses à prévenir pour un événement, dans l'ordre du magasin. */
export async function remindList(id: number): Promise<{ key: string; rec: InterestRecord }[]> {
  const all = await interestedIn(id);
  return Object.entries(all)
    .filter(([key, rec]) => keyIsEmail(key) && rec.email)
    .map(([key, rec]) => ({ key, rec }));
}

/** Marque une ligne comme prévenue. C'est ce qui rend le cron idempotent. */
export async function markReminded(id: number, key: string, rec: InterestRecord, day: string): Promise<void> {
  const next: InterestRecord = { ...rec, sent: day };
  const c = creds();
  if (!c) {
    memFor(id).set(key, next);
    return;
  }
  const [reply] = await kvPipeline([["HSET", H + id, key, JSON.stringify(next)]], c);
  if (reply?.error) throw new Error(reply.error);
}

async function readCounts(): Promise<Record<number, number>> {
  const c = creds();
  if (!c) {
    const out: Record<number, number> = {};
    for (const [id, h] of MEM) if (h.size) out[id] = h.size;
    return out;
  }
  const [reply] = await kvPipeline([["HGETALL", COUNTS]], c);
  if (reply?.error) throw new Error(reply.error);
  const out: Record<number, number> = {};
  for (const [field, raw] of Object.entries(toRecord(reply?.result))) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) out[Number(field)] = n;
  }
  return out;
}

/**
 * Tous les compteurs, mis en cache.
 *
 * C'est la lecture que font les fiches événement au rendu. Le build en génère plus de
 * mille d'affilée : sans ce cache, mille allers-retours Redis, avec, un seul. C'est
 * exactement le motif d'`allEdits()`, et pour la même raison.
 *
 * **Le tag n'est volontairement pas invalidé à chaque clic.** Une correction de fiche
 * doit apparaître tout de suite, donc `saveEdit()` invalide et revalide le chemin ; un
 * compteur, non. Invalider ici ferait régénérer une page statique à chaque fanion posé,
 * c'est-à-dire payer un rendu complet pour faire passer un nombre de 11 à 12. Les cinq
 * minutes de `revalidate` suffisent, et la fenêtre réelle est de toute façon celle du
 * `revalidate = 3600` des layouts. Le tag reste exporté pour le jour où `/admin` voudra
 * forcer un rafraîchissement.
 */
const cachedCounts = unstable_cache(readCounts, ["rr-interest-counts"], {
  tags: [INTEREST_TAG],
  revalidate: 300,
});

export async function countsAll(): Promise<Record<number, number>> {
  if (!creds()) {
    const out: Record<number, number> = {};
    for (const [id, h] of MEM) if (h.size) out[id] = h.size;
    return out;
  }
  try {
    return await cachedCounts();
  } catch (err) {
    /* Même règle qu'`allEdits()` : un magasin annexe qui ne répond pas ne doit pas rendre
       une fiche en 500. Sans compteur, la fiche n'affiche simplement pas le chiffre. */
    console.error("[interest] lecture impossible:", err instanceof Error ? err.message : err);
    return {};
  }
}

/**
 * Le plafond de lignes servies aux pages. Voir l'en-tête de `components/InterestCounts.tsx` :
 * la table voyage dans la charge utile de chaque page, et sans borne elle grandirait avec
 * le catalogue entier. Les plus petits compteurs partent en premier, ce sont ceux qui
 * apportent le moins comme preuve sociale.
 */
const CAP = 1500;

/**
 * Les compteurs tels que le layout les passe au contexte : les mêmes, bornés et triés.
 *
 * Le tri décroissant n'est pas cosmétique, c'est lui qui décide **qui** survit au plafond.
 */
export async function countsForPages(): Promise<Record<number, number>> {
  const all = await countsAll();
  const rows = Object.entries(all);
  if (rows.length <= CAP) return all;
  return Object.fromEntries(rows.sort((a, b) => b[1] - a[1]).slice(0, CAP));
}

/**
 * Les événements qu'un compte a marqués, à travers tous ses appareils.
 *
 * Lu sans cache : c'est `/account` qui s'en sert, une page qui n'est demandée que par son
 * propriétaire, et lui montrer une liste de cinq minutes d'âge juste après un clic serait
 * le faire douter de son propre geste.
 */
export async function ownedBy(email: string): Promise<number[]> {
  if (!email) return [];
  const c = creds();
  if (!c) return [...(MEMOWNED.get(email) ?? [])];
  const [reply] = await kvPipeline([["SMEMBERS", OWNED + email]], c);
  if (reply?.error) throw new Error(reply.error);
  const raw = Array.isArray(reply?.result) ? reply.result : [];
  return raw.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
}

/** Retire toutes les lignes d'un événement. Entretien depuis `/admin`, pour un id que le
 *  catalogue ne porte plus : c'est la règle d'élagage des maps indexées par id. */
export async function dropInterest(id: number): Promise<void> {
  const c = creds();
  if (!c) {
    MEM.delete(id);
    return;
  }
  await kvPipeline(
    [
      ["DEL", H + id],
      ["HDEL", COUNTS, String(id)],
    ],
    c,
  );
}
