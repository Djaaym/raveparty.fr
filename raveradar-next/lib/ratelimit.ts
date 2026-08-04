/**
 * Best-effort throttle for the write endpoints.
 *
 * In-memory, so on Vercel it is per warm lambda instance rather than global — which is
 * fine for what it defends against: a bored visitor holding down Enter, or a script
 * hammering one route. Anything more determined needs a shared store, and that's a
 * decision to make with a real abuse problem in hand rather than in advance.
 */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

/** Keeps the map from growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (HITS.size < 500) return;
  for (const [k, times] of HITS) {
    const live = times.filter((t) => now - t < WINDOW_MS);
    if (live.length) HITS.set(k, live);
    else HITS.delete(k);
  }
}

export function tooManyRequests(key: string): boolean {
  const now = Date.now();
  sweep(now);
  const times = (HITS.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  times.push(now);
  HITS.set(key, times);
  return times.length > MAX_PER_WINDOW;
}

/** Vercel puts the real client address first in x-forwarded-for. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
