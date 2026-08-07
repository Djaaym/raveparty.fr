import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/**
 * Who may read the dashboard.
 *
 * One password, held in `TRACKING_PASSWORD`, exchanged for a signed cookie. No user
 * table, no provider, no OAuth round-trip — there is exactly one person who should see
 * this page, and everything more elaborate would be more surface for the same result.
 *
 * The cookie carries no session state: it is `expiry.signature`, and the signature is an
 * HMAC of the expiry under a server secret. Nothing to store, nothing to look up, and a
 * forged cookie fails on arithmetic rather than on a lookup that could be raced.
 *
 * With `TRACKING_PASSWORD` unset the dashboard refuses to open at all rather than
 * defaulting to something guessable — an analytics page left open shows visitor
 * journeys, and that is not a page to leave ajar while you "set it up later".
 */

export const COOKIE = "rr_track";

/** 30 days. Long enough not to be a chore, short enough that a stolen cookie expires. */
export const SESSION_SECONDS = 30 * 24 * 3600;

export function isConfigured(): boolean {
  return Boolean(process.env.TRACKING_PASSWORD);
}

/**
 * Signing key. Defaults to a hash of the password so a single variable is enough to
 * stand the whole thing up — with the deliberate consequence that changing the password
 * invalidates every issued cookie, which is what you want from a password change anyway.
 * Set `TRACKING_SECRET` to decouple the two.
 */
function secret(): string {
  const s = process.env.TRACKING_SECRET;
  if (s) return s;
  return createHash("sha256").update("rr-track:" + (process.env.TRACKING_PASSWORD ?? "")).digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Compares two strings without leaking their common prefix through timing. Hashing
 *  first sidesteps `timingSafeEqual`'s own length requirement, which would otherwise
 *  throw — and reveal the expected length by throwing. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordOk(candidate: unknown): boolean {
  const expected = process.env.TRACKING_PASSWORD;
  if (!expected || typeof candidate !== "string" || !candidate) return false;
  return safeEqual(candidate, expected);
}

export function issueToken(now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !isConfigured()) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  return safeEqual(token.slice(dot + 1), sign(String(exp)));
}
