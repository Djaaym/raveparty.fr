/**
 * Le client Redis, mutualisé.
 *
 * Le suivi d'audience (`lib/track-store.ts`) parlait déjà l'API REST d'Upstash, et les
 * comptes promoteurs ont besoin exactement du même dialecte : un `/pipeline`, un jeton
 * en `Authorization`, des réponses `{result}` ou `{error}`. Le dupliquer aurait donné
 * deux clients à corriger le jour où l'un des deux se trompe, donc il vit ici.
 *
 * **Ce module ne décide de rien d'autre.** Il ne connaît ni les clés, ni les TTL, ni la
 * politique de rétention : ce sont des choix de domaine, ils restent chez l'appelant.
 *
 * N'importe quel Redis parlant le protocole REST Upstash convient, ce qui couvre les
 * deux options en un clic sur Vercel (Vercel KV, l'intégration Upstash du marketplace)
 * et un compte Upstash autonome. Chaque appelant donne l'ordre de préférence de ses
 * variables : le suivi cherche `TRACK_KV_*` d'abord, les comptes `ACCOUNTS_KV_*`, et
 * les deux retombent sur ce que Vercel injecte.
 */

export type KvCreds = { url: string; token: string };

/** Les paires que Vercel et Upstash injectent tout seuls, le repli commun. */
const SHARED: [string, string][] = [
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
];

/**
 * Les identifiants du premier couple renseigné, en commençant par les préfixes propres
 * à l'appelant. `kvCreds("TRACK_KV_REST_API")` regarde donc
 * `TRACK_KV_REST_API_URL` / `TRACK_KV_REST_API_TOKEN`, puis les paires partagées.
 */
export function kvCreds(...prefixes: string[]): KvCreds | null {
  const pairs: [string, string][] = [...prefixes.map((p): [string, string] => [`${p}_URL`, `${p}_TOKEN`]), ...SHARED];
  for (const [u, t] of pairs) {
    const url = process.env[u];
    const token = process.env[t];
    if (url && token) return { url: url.replace(/\/+$/, ""), token };
  }
  return null;
}

export type KvReply = { result?: unknown; error?: string };

/** Exécute un lot de commandes. Lève sur une erreur réseau ou un statut non 2xx ; une
 *  commande refusée par Redis, elle, revient dans `error` de sa propre réponse. */
export async function kvPipeline(commands: (string | number)[][], c: KvCreds): Promise<KvReply[]> {
  const res = await fetch(`${c.url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis http ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`);
  const body = (await res.json()) as KvReply[] | KvReply;
  return Array.isArray(body) ? body : [body];
}

/** Une seule commande, quand un lot n'apporte rien. */
export async function kvCommand(command: (string | number)[], c: KvCreds): Promise<KvReply> {
  const [reply] = await kvPipeline([command], c);
  return reply ?? {};
}
