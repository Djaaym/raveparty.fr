import { revalidateTag, unstable_cache } from "next/cache";
import type { EventEdit } from "./event-edits";
import { kvCreds, kvPipeline, type KvCreds } from "./kv";

/**
 * Où vivent les corrections de fiches.
 *
 * Une **seule clé Redis**, un hachage dont le champ est l'id de l'événement :
 *
 *   rr:edits   { "512": {…}, "1043": {…} }
 *
 * Un hachage et pas une clé par fiche, parce que la lecture est le cas fréquent et
 * qu'elle veut *tout* : chaque page événement rendue demande « y a-t-il une correction
 * pour moi ». Un `HGETALL` répond en une commande, et Upstash facture à la commande.
 * L'écriture, elle, est rarissime, un `HSET` sur un champ suffit.
 *
 * Aucun TTL : une correction doit survivre jusqu'à sa saisie dans `lib/data.ts`, et
 * personne ne la ressaisira si elle disparaît toute seule.
 *
 * ## La mise en cache est ce qui rend ça possible en génération statique
 *
 * Le site construit ~1 600 fiches d'un coup, et chacune passe ici. Sans cache ce serait
 * 1 600 allers-retours par build. `unstable_cache` les réduit à un, marqué du tag
 * `EDITS_TAG` : la route d'écriture invalide le tag, donc la lecture suivante repart du
 * magasin, sur toutes les instances à la fois. Le `revalidate` de cinq minutes n'est
 * qu'une ceinture, au cas où une invalidation se perdrait.
 *
 * ## Une panne de Redis ne doit jamais casser une fiche
 *
 * `allEdits()` **avale ses erreurs** et rend un catalogue non corrigé. Une correction
 * perdue est un désagrément ; une page événement en 500 parce qu'un magasin annexe ne
 * répond pas serait un défaut bien pire, sur les pages qui portent tout le SEO du site.
 *
 * Variables, dans l'ordre : `EDITS_KV_REST_API_*`, puis les paires partagées du projet
 * (`KV_REST_API_*`, `UPSTASH_REDIS_REST_*`). En pratique c'est le même magasin que les
 * comptes promoteurs, il n'y a aucune raison d'en ouvrir un second.
 */

const KEY = "rr:edits";

export const EDITS_TAG = "rr-event-edits";

const creds = (): KvCreds | null => kvCreds("EDITS_KV_REST_API", "ACCOUNTS_KV_REST_API");

export const isConfigured = (): boolean => Boolean(creds());

/* Repli mémoire, réservé à `next dev` : sur `globalThis` pour la même raison que les
   comptes, `next dev` compilant un graphe de modules par route. En production sans
   magasin, la route d'écriture répond 501 plutôt que d'annoncer une correction que
   personne ne retrouvera au prochain démarrage de lambda. */
const G = globalThis as { __rrEdits?: Map<number, EventEdit> };
const MEM = (G.__rrEdits ??= new Map<number, EventEdit>());

export const memoryOnlyAllowed = (): boolean => process.env.NODE_ENV !== "production";

/** Upstash rend un hachage tantôt en objet, tantôt en tableau plat `[champ, valeur, …]`
 *  selon la version du service. Les deux formes sont lues ici plutôt que supposées. */
function toRecord(result: unknown): Record<string, string> {
  if (Array.isArray(result)) {
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < result.length; i += 2) out[String(result[i])] = String(result[i + 1]);
    return out;
  }
  if (result && typeof result === "object") return result as Record<string, string>;
  return {};
}

async function readAll(): Promise<Record<number, EventEdit>> {
  const c = creds();
  if (!c) return Object.fromEntries(MEM);
  const [reply] = await kvPipeline([["HGETALL", KEY]], c);
  if (reply?.error) throw new Error(reply.error);
  const out: Record<number, EventEdit> = {};
  for (const [field, raw] of Object.entries(toRecord(reply?.result))) {
    try {
      const edit = JSON.parse(raw) as EventEdit;
      out[Number(field)] = edit;
    } catch {
      /* Une ligne illisible ne fait pas perdre les autres. */
    }
  }
  return out;
}

const cachedReadAll = unstable_cache(readAll, ["rr-event-edits-all"], { tags: [EDITS_TAG], revalidate: 300 });

/**
 * Toutes les corrections, pour le rendu.
 *
 * Sans magasin configuré, aucun appel réseau n'est fait : une construction en
 * intégration continue, sans variable d'environnement, produit exactement le catalogue,
 * ce qui est le comportement attendu.
 */
export async function allEdits(): Promise<Record<number, EventEdit>> {
  if (!creds()) return Object.fromEntries(MEM);
  try {
    return await cachedReadAll();
  } catch (err) {
    console.error("[edits] lecture impossible:", err instanceof Error ? err.message : err);
    return {};
  }
}

/** La correction d'un événement, ou rien. */
export async function editFor(id: number): Promise<EventEdit | null> {
  return (await allEdits())[id] ?? null;
}

/** Écrit, puis invalide le cache de lecture. Les deux vont ensemble : sans
 *  l'invalidation, la fiche continuerait de servir la version d'avant jusqu'à cinq
 *  minutes, et on croirait avoir perdu sa saisie. */
export async function saveEdit(edit: EventEdit): Promise<void> {
  const c = creds();
  if (!c) {
    MEM.set(edit.id, edit);
  } else {
    const [reply] = await kvPipeline([["HSET", KEY, String(edit.id), JSON.stringify(edit)]], c);
    if (reply?.error) throw new Error(reply.error);
  }
  revalidateTag(EDITS_TAG);
}

/** Retire la correction : la fiche revient à ce que dit `lib/data.ts`. C'est le geste
 *  qu'on fait une fois la correction saisie au catalogue, et c'est aussi l'annulation. */
export async function deleteEdit(id: number): Promise<boolean> {
  const c = creds();
  if (!c) {
    const had = MEM.delete(id);
    revalidateTag(EDITS_TAG);
    return had;
  }
  const [reply] = await kvPipeline([["HDEL", KEY, String(id)]], c);
  if (reply?.error) throw new Error(reply.error);
  revalidateTag(EDITS_TAG);
  return Number(reply?.result ?? 0) > 0;
}

/** La file, la plus récente d'abord. Lue sans cache : `/admin` doit voir l'état vrai du
 *  magasin, pas une photo de cinq minutes. */
export async function listEdits(): Promise<EventEdit[]> {
  const rows = Object.values(creds() ? await readAll() : Object.fromEntries(MEM));
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
