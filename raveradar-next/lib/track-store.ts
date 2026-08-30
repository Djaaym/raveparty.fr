import type { Hit } from "./track";
import { dayKey, daysBetween } from "./track";
import { kvCreds, kvPipeline, type KvCreds, type KvReply } from "./kv";

/**
 * Where hits are kept.
 *
 * The site still has no database, and this is not the feature that should introduce one:
 * an analytics hit is append-only, read in date ranges, and worthless after a few months.
 * That is a Redis list, not a schema. So the store is one key per UTC day,
 * `rr:hits:2026-08-07`, holding raw JSON hits, with a TTL that does the data-retention
 * policy for us instead of a cron nobody will write.
 *
 * Any Redis speaking the Upstash REST protocol works, which covers the two one-click
 * options on Vercel (Vercel KV and the Upstash marketplace integration) and a self-hosted
 * Upstash account. Set either pair:
 *   TRACK_KV_REST_API_URL  + TRACK_KV_REST_API_TOKEN   (explicit, wins)
 *   KV_REST_API_URL        + KV_REST_API_TOKEN         (what Vercel injects)
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN  (what Upstash injects)
 *
 * With none of them set the store falls back to process memory. That is genuinely useful
 * in `next dev` and genuinely useless in production, on Vercel each lambda has its own
 * memory and they come and go, so `storeInfo().persistent` is false and the dashboard
 * says so at the top of the page rather than presenting a third of the traffic as the
 * whole picture.
 */

const PREFIX = "rr:hits:";

/** Data retention. 90 days by default: long enough to compare to last quarter, short
 *  enough that we are not sitting on a year of behavioural data we never look at. */
const RETENTION_DAYS = Math.min(400, Math.max(1, Number(process.env.TRACK_RETENTION_DAYS ?? 90)));

/** Hard cap per day, so a bot storm or a loop in the tracker cannot fill the plan. */
const MAX_PER_DAY = Math.max(1000, Number(process.env.TRACK_MAX_PER_DAY ?? 200_000));

/** Cap on what a single report may load, so a 90-day range cannot OOM the function. */
const MAX_READ = Math.max(1000, Number(process.env.TRACK_MAX_READ ?? 300_000));

type Creds = KvCreds;

/** Le client REST lui-même vit dans `lib/kv.ts` : les comptes promoteurs parlent le
 *  même dialecte, et deux copies du même client font deux corrections à faire. */
const creds = (): Creds | null => kvCreds("TRACK_KV_REST_API");

export type StoreInfo = { name: "redis" | "memory"; persistent: boolean; retentionDays: number };

export function storeInfo(): StoreInfo {
  return { name: creds() ? "redis" : "memory", persistent: Boolean(creds()), retentionDays: RETENTION_DAYS };
}

/* ---------------------------------------------------------------------------
   Redis over REST
--------------------------------------------------------------------------- */

type PipeReply = KvReply;

const pipeline = (commands: (string | number)[][], c: Creds) => kvPipeline(commands, c);

/* ---------------------------------------------------------------------------
   Memory fallback
--------------------------------------------------------------------------- */

const MEM = new Map<string, string[]>();

function memWrite(day: string, rows: string[]) {
  const list = MEM.get(day) ?? [];
  list.push(...rows);
  // Same trim as Redis, and the same reason: an unbounded array in a long-lived dev
  // server eventually costs more than the feature is worth.
  MEM.set(day, list.length > MAX_PER_DAY ? list.slice(-MAX_PER_DAY) : list);
  for (const k of MEM.keys()) {
    if (k < dayKey(Date.now() - RETENTION_DAYS * 86400_000)) MEM.delete(k);
  }
}

/* ---------------------------------------------------------------------------
   Public API
--------------------------------------------------------------------------- */

/**
 * Appends a batch. One RPUSH for the whole batch on purpose: the free Upstash tier bills
 * commands, and the tracker sends several hits per page (view, clicks, end), so batching
 * is the difference between staying inside the free plan and not.
 *
 * Returns false instead of throwing, a failed write must never turn into a visible
 * error on a visitor's page, and the caller answers 204 either way.
 */
export async function pushHits(hits: Hit[]): Promise<boolean> {
  if (!hits.length) return true;

  const byDay = new Map<string, string[]>();
  for (const h of hits) {
    const day = dayKey(h.t);
    const rows = byDay.get(day) ?? [];
    rows.push(JSON.stringify(h));
    byDay.set(day, rows);
  }

  const c = creds();
  if (!c) {
    for (const [day, rows] of byDay) memWrite(day, rows);
    return true;
  }

  const cmds: (string | number)[][] = [];
  for (const [day, rows] of byDay) {
    const key = PREFIX + day;
    cmds.push(["RPUSH", key, ...rows]);
    // Reset on every write rather than only on creation: a day key written at 00:05 and
    // again at 23:55 should expire 90 days after the last hit, not after the first.
    cmds.push(["EXPIRE", key, RETENTION_DAYS * 86400]);
    cmds.push(["LTRIM", key, -MAX_PER_DAY, -1]);
  }

  try {
    const replies = await pipeline(cmds, c);
    const failed = replies.find((r) => r.error);
    if (failed) {
      console.error("[track] redis refused a write:", failed.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[track] write failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Reads every hit in `[from, to]` (inclusive, yyyy-mm-dd, UTC), oldest first. */
export async function readHits(from: string, to: string): Promise<Hit[]> {
  const days = daysBetween(from, to);
  if (!days.length) return [];

  const c = creds();
  let raw: string[][] = [];

  if (!c) {
    raw = days.map((d) => MEM.get(d) ?? []);
  } else {
    try {
      // Chunked: a 90-key pipeline is fine, a 400-key one starts to strain the REST body.
      for (let i = 0; i < days.length; i += 40) {
        const slice = days.slice(i, i + 40);
        const replies = await pipeline(
          slice.map((d) => ["LRANGE", PREFIX + d, 0, -1]),
          c,
        );
        raw.push(...replies.map((r) => (Array.isArray(r.result) ? (r.result as string[]) : [])));
      }
    } catch (err) {
      console.error("[track] read failed:", err instanceof Error ? err.message : err);
      throw err;
    }
  }

  const out: Hit[] = [];
  for (const rows of raw) {
    for (const row of rows) {
      if (out.length >= MAX_READ) return out;
      try {
        out.push(JSON.parse(row) as Hit);
      } catch {
        /* A single unreadable row is not a reason to lose the report. */
      }
    }
  }
  return out;
}

/** How many hits each day holds, without reading them, the cheap way to tell a quiet
 *  week from a collector that stopped writing. Exposed through
 *  `POST /api/track/stats {action:"counts"}`. */
export async function hitCounts(from: string, to: string): Promise<Record<string, number>> {
  const days = daysBetween(from, to);
  const out: Record<string, number> = {};
  const c = creds();
  if (!c) {
    for (const d of days) out[d] = MEM.get(d)?.length ?? 0;
    return out;
  }
  try {
    for (let i = 0; i < days.length; i += 40) {
      const slice = days.slice(i, i + 40);
      const replies = await pipeline(
        slice.map((d) => ["LLEN", PREFIX + d]),
        c,
      );
      slice.forEach((d, j) => (out[d] = Number(replies[j]?.result ?? 0)));
    }
  } catch {
    for (const d of days) out[d] = 0;
  }
  return out;
}

/** Deletes whole days. The only destructive operation, and it is behind the dashboard's
 *  auth, GDPR asks that erasure be possible, not that it be easy for strangers. */
export async function deleteDays(days: string[]): Promise<number> {
  if (!days.length) return 0;
  const c = creds();
  if (!c) {
    let n = 0;
    for (const d of days) if (MEM.delete(d)) n++;
    return n;
  }
  const replies = await pipeline([["DEL", ...days.map((d) => PREFIX + d)]], c);
  return Number(replies[0]?.result ?? 0);
}

/** Round-trip check used by the dashboard's status line: does the configured store
 *  actually answer from inside the deployed function? */
export async function pingStore(): Promise<{ ok: boolean; detail: string }> {
  const c = creds();
  if (!c) return { ok: true, detail: "mémoire du processus (non persistant)" };
  try {
    const replies = await pipeline([["PING"]], c);
    if (replies[0]?.error) return { ok: false, detail: replies[0].error };
    return { ok: true, detail: String(replies[0]?.result ?? "PONG") };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message.slice(0, 160) : "réseau" };
  }
}
