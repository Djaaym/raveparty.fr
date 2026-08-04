import type { Lang } from "./types";

/**
 * What a visitor can be alerted about. Each kind maps to a page that already exists,
 * because an alert is only ever offered from the thing it watches — an artist alert
 * from `/artistes/{slug}`, a city alert from `/rave-party/{slug}`.
 */
export type AlertKind = "artist" | "city" | "genre" | "country" | "newsletter";

export const ALERT_KINDS: AlertKind[] = ["artist", "city", "genre", "country", "newsletter"];

export interface AlertInput {
  email: string;
  kind: AlertKind;
  /** Slug of the watched thing — empty for the plain newsletter. */
  value: string;
  /** Human label as shown on the page ("Charlotte de Witte", "Paris"). */
  label: string;
  lang: Lang;
}

/** A stored subscription, as the browser remembers it. */
export interface StoredAlert {
  kind: AlertKind;
  value: string;
  label: string;
  /** ISO date, so `/account` can say when it was created without a server round-trip. */
  at: string;
}

export const alertKey = (kind: AlertKind, value: string) => `${kind}:${value}`;

/**
 * Deliberately permissive: this guards the API against junk and typos, not against a
 * determined attacker — the provider does the real address validation, and anything
 * stricter starts rejecting valid addresses (apostrophes, new TLDs, plus-addressing).
 */
export function isEmail(raw: string): boolean {
  const v = raw.trim();
  if (v.length < 6 || v.length > 254) return false;
  if (/\s/.test(v)) return false;
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1) return false;
  const domain = v.slice(at + 1);
  return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".") && !domain.includes("..");
}

export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

/** Parses and validates whatever arrived on the wire. Returns null on anything unusable. */
export function parseAlert(body: unknown): AlertInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? normalizeEmail(b.email) : "";
  if (!isEmail(email)) return null;

  const kind = b.kind as AlertKind;
  if (!ALERT_KINDS.includes(kind)) return null;

  const value = typeof b.value === "string" ? b.value.trim().slice(0, 120) : "";
  // Every kind but the newsletter watches something specific; without it we'd store a
  // subscription nobody could ever match an event against.
  if (kind !== "newsletter" && !value) return null;

  const label = typeof b.label === "string" && b.label.trim() ? b.label.trim().slice(0, 160) : value;
  const lang: Lang = b.lang === "en" ? "en" : "fr";
  return { email, kind, value, label, lang };
}

/** One line the owner (and the provider's back office) can read at a glance. */
export function alertSummary(a: AlertInput): string {
  switch (a.kind) {
    case "artist":
      return `Artiste — ${a.label}`;
    case "city":
      return `Ville — ${a.label}`;
    case "genre":
      return `Genre — ${a.label}`;
    case "country":
      return `Pays — ${a.label}`;
    default:
      return "Newsletter";
  }
}
