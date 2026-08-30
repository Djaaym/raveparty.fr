/**
 * Audience measurement, the shared vocabulary.
 *
 * Everything here is pure: types, validation, and the classification that turns a raw
 * referrer or user-agent string into something countable. No I/O, no storage, no React,
 * so the ingest route, the report builder and the dashboard all read the same
 * definitions instead of each inventing its own idea of what a "source" is.
 *
 * Why a first-party collector at all, when GA4 is already on the site: GA4 answers
 * "how many", not "who did what". It samples, it thresholds small numbers away, it hides
 * the individual journey behind its own idea of a session, and a third of visitors block
 * it outright. This one stores the raw hits, so the dashboard can replay a single visit
 * page by page, which is exactly what the site owner asked for.
 *
 * Privacy stance, deliberately: no cookie, no IP stored (the address is used for the
 * rate-limit key and thrown away), no cross-site identifier, hits expire after
 * TRACK_RETENTION_DAYS. The visitor id lives in the visitor's own localStorage and means
 * nothing outside this domain. That is the shape the CNIL exempts from consent for
 * audience measurement, keep it that way if you extend this.
 */

/* ---------------------------------------------------------------------------
   Hits
--------------------------------------------------------------------------- */

/**
 * What a hit records.
 * - `view` (a page was displayed (one per navigation, SPA transitions included).
 * - `end` ) that page was left: how long it was open, how long it was actually looked
 *            at, how far it was scrolled. Sent on unload and on route change.
 * - `out`  (a click on a link leaving the site (ticketing, Instagram, official site).
 * - `in`  ) a click on an internal link, so the dashboard can show what gets clicked
 *            rather than only what gets reached.
 * - `goal`, an explicit conversion declared with `data-goal` on any element.
 */
export type HitKind = "view" | "end" | "out" | "in" | "goal";

export type Device = "mobile" | "tablet" | "desktop";

/** How a visit was acquired. `paid` only appears when a utm_medium says so. */
export type Medium = "direct" | "organic" | "social" | "referral" | "email" | "paid" | "internal";

export type Utm = { source?: string; medium?: string; campaign?: string; term?: string; content?: string };

/** A hit as stored. Field names stay short because every one of these is JSON in Redis. */
export type Hit = {
  /** Server clock, ms. Never the client's, a wrong device clock would scramble the timeline. */
  t: number;
  k: HitKind;
  /** Session id, rotates after 30 min idle. */
  sid: string;
  /** Visitor id, persistent in the visitor's localStorage. */
  vid: string;
  /** Path only, no query string, no hash. */
  p: string;
  /** Site language the page was served in. */
  lang?: "fr" | "en";

  /* Acquisition, carried on the first hit of a session, then repeated onto every hit
     of that session by the report builder so any filter works on any row. */
  ref?: string;
  src?: string;
  med?: Medium;
  utm?: Utm;

  /* Context, from request headers and the client environment. */
  cc?: string;
  city?: string;
  reg?: string;
  dev?: Device;
  br?: string;
  os?: string;
  /** Viewport width in CSS pixels, bucketed by the dashboard. */
  sw?: number;
  /** Browser UI language, e.g. "fr-FR", tells you who you could be serving. */
  bl?: string;
  /** 1 when this visitor had no stored id before this session. */
  nv?: 1;

  /* `end` only */
  dur?: number;
  eng?: number;
  sd?: number;

  /* `out` / `in` / `goal` only */
  href?: string;
  txt?: string;
  zone?: string;
  goal?: string;
};

/** The subset a browser is allowed to assert. Everything else is filled in server-side. */
export type RawHit = Partial<Hit>;

/* ---------------------------------------------------------------------------
   Referrer classification
--------------------------------------------------------------------------- */

/** Host fragment → display name. Matched on the registrable-ish tail, so `www.` and
 *  country domains (`google.fr`, `google.co.uk`) all collapse onto one row. */
const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\./, "Bing"],
  [/(^|\.)duckduckgo\./, "DuckDuckGo"],
  [/(^|\.)(yahoo|search\.yahoo)\./, "Yahoo"],
  [/(^|\.)ecosia\./, "Ecosia"],
  [/(^|\.)qwant\./, "Qwant"],
  [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)baidu\./, "Baidu"],
  [/(^|\.)search\.brave\./, "Brave Search"],
  [/(^|\.)startpage\./, "Startpage"],
  [/(^|\.)lilo\./, "Lilo"],
  [/(^|\.)perplexity\./, "Perplexity"],
  [/(^|\.)chatgpt\./, "ChatGPT"],
  [/(^|\.)openai\./, "ChatGPT"],
  [/(^|\.)claude\./, "Claude"],
  [/(^|\.)gemini\.google\./, "Gemini"],
];

const SOCIAL: [RegExp, string][] = [
  [/(^|\.)instagram\./, "Instagram"],
  [/(^|\.)(facebook|fb)\./, "Facebook"],
  [/(^|\.)l\.facebook\./, "Facebook"],
  [/(^|\.)tiktok\./, "TikTok"],
  [/(^|\.)(twitter|x)\.com$/, "X (Twitter)"],
  [/(^|\.)t\.co$/, "X (Twitter)"],
  [/(^|\.)reddit\./, "Reddit"],
  [/(^|\.)youtube\./, "YouTube"],
  [/(^|\.)youtu\.be$/, "YouTube"],
  [/(^|\.)snapchat\./, "Snapchat"],
  [/(^|\.)linkedin\./, "LinkedIn"],
  [/(^|\.)lnkd\.in$/, "LinkedIn"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)(telegram|t\.me)/, "Telegram"],
  [/(^|\.)whatsapp\./, "WhatsApp"],
  [/(^|\.)discord\./, "Discord"],
  [/(^|\.)tumblr\./, "Tumblr"],
  [/(^|\.)threads\./, "Threads"],
  [/(^|\.)bsky\./, "Bluesky"],
  [/(^|\.)mastodon\./, "Mastodon"],
];

const MAIL: RegExp[] = [/(^|\.)mail\.google\./, /(^|\.)outlook\./, /(^|\.)mail\.yahoo\./, /(^|\.)webmail\./];

/** Label used everywhere a source is missing, one spelling, so it groups. */
export const DIRECT = "(direct)";

/**
 * Turns a referrer URL into `{ src, med }`.
 *
 * `selfHost` matters: a referrer pointing at our own domain is an internal navigation
 * that escaped the SPA router (a full reload), not an acquisition, counting it as a
 * "referral from raveparty.fr" is the classic way to make your own site your top source.
 */
export function classifyReferrer(ref: string | undefined, selfHost: string): { src: string; med: Medium } {
  if (!ref) return { src: DIRECT, med: "direct" };
  let host: string;
  try {
    host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { src: DIRECT, med: "direct" };
  }
  if (!host) return { src: DIRECT, med: "direct" };

  const self = selfHost.toLowerCase().replace(/^www\./, "");
  if (host === self) return { src: "(interne)", med: "internal" };

  for (const [re, name] of SEARCH) if (re.test(host)) return { src: name, med: "organic" };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { src: name, med: "social" };
  for (const re of MAIL) if (re.test(host)) return { src: host, med: "email" };
  return { src: host, med: "referral" };
}

/**
 * Known source names, keyed lowercase. A `utm_source=instagram` and a referrer from
 * instagram.com are the same source, and letting them sit on two rows ("instagram" and
 * "Instagram") splits exactly the traffic you tagged in order to measure it.
 */
const CANONICAL = new Map<string, string>([...SEARCH, ...SOCIAL].map(([, name]) => [name.toLowerCase(), name]));

/** Also catches the shorthands people actually type into a utm_source. */
const ALIASES = new Map<string, string>([
  ["ig", "Instagram"],
  ["insta", "Instagram"],
  ["fb", "Facebook"],
  ["twitter", "X (Twitter)"],
  ["x", "X (Twitter)"],
  ["yt", "YouTube"],
  ["li", "LinkedIn"],
  ["newsletter", "Newsletter"],
]);

function canonicalSource(name: string): string {
  const key = name.toLowerCase().trim();
  return CANONICAL.get(key) ?? ALIASES.get(key) ?? name;
}

/** UTM tags win over the referrer, that is the whole point of tagging a link. */
export function applyUtm(base: { src: string; med: Medium }, utm: Utm | undefined): { src: string; med: Medium } {
  if (!utm) return base;
  const med = utm.medium?.toLowerCase();
  const mapped: Medium | undefined =
    med === "cpc" || med === "ppc" || med === "paid" || med === "cpm" || med === "display"
      ? "paid"
      : med === "email" || med === "newsletter"
        ? "email"
        : med === "social" || med === "social-post"
          ? "social"
          : med === "organic"
            ? "organic"
            : med === "referral"
              ? "referral"
              : undefined;
  return {
    src: utm.source ? canonicalSource(utm.source) : base.src,
    med: mapped ?? (utm.source ? "referral" : base.med),
  };
}

/* ---------------------------------------------------------------------------
   User agent
--------------------------------------------------------------------------- */

/**
 * Crawlers, uptime probes and scrapers. They mostly do not run JavaScript, so few of
 * them ever reach the collector, but the ones that do (headless Chrome, preview
 * fetchers) would otherwise show up as a very engaged desktop visitor from Virginia.
 */
const BOT =
  /bot\b|bots\b|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|chrome-lighthouse|python-requests|curl\/|wget|axios|node-fetch|okhttp|go-http|java\/|libwww|scrapy|monitor|pingdom|uptimerobot|statuscake|gtmetrix|semrush|ahrefs|mj12|dotbot|petal|bytespider|dataprovider|serpstat|screaming frog|phantomjs|puppeteer|playwright|preview|embed|whatsapp|telegrambot|discordbot|slackbot|vercel-screenshot/i;

export function isBot(ua: string): boolean {
  return !ua || BOT.test(ua);
}

/** Ordered longest-lie-first: Edge claims to be Chrome, Chrome claims to be Safari. */
const BROWSERS: [RegExp, string][] = [
  [/edg(a|ios)?\//i, "Edge"],
  [/opr\/|opera/i, "Opera"],
  [/samsungbrowser/i, "Samsung Internet"],
  [/yabrowser/i, "Yandex Browser"],
  [/ucbrowser/i, "UC Browser"],
  [/firefox\/|fxios/i, "Firefox"],
  [/duckduckgo/i, "DuckDuckGo"],
  [/brave/i, "Brave"],
  [/chrome\/|crios/i, "Chrome"],
  [/safari\//i, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/windows nt/i, "Windows"],
  [/iphone|ipad|ipod|ios /i, "iOS"],
  [/mac os x|macintosh/i, "macOS"],
  [/android/i, "Android"],
  [/cros/i, "ChromeOS"],
  [/linux/i, "Linux"],
];

export function parseUa(ua: string): { dev: Device; br: string; os: string } {
  const br = BROWSERS.find(([re]) => re.test(ua))?.[1] ?? "Autre";
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1] ?? "Autre";
  const tablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua);
  const mobile = /mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua);
  return { dev: tablet ? "tablet" : mobile ? "mobile" : "desktop", br, os };
}

/* ---------------------------------------------------------------------------
   Paths
--------------------------------------------------------------------------- */

/** Query string and hash are noise in a page report, and the query can carry UTM tags
 *  we already parsed out, so a path is stored bare, lowercased host-side trailing slash
 *  removed so `/villes` and `/villes/` are one page and not two. */
export function normalizePath(raw: string | undefined): string {
  if (!raw) return "/";
  let p = raw.split("#")[0].split("?")[0].trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p.slice(0, 300) || "/";
}

/**
 * Collapses a path onto the template that produced it, `/festival/dour-festival` and
 * `/festival/awakenings` both become `/festival/*`. ~7 000 pages make a "top pages" list
 * useless for the question "which *kind* of page works", which this answers.
 */
export function pathGroup(p: string): string {
  const clean = p.replace(/^\/en(?=\/|$)/, "") || "/";
  const seg = clean.split("/").filter(Boolean);
  if (!seg.length) return "/";
  const nested = ["festival", "artistes", "lieux", "show", "genres", "pays", "rave-party", "event"];
  if (seg.length >= 2 && nested.includes(seg[0])) return `/${seg[0]}/*`;
  return `/${seg.join("/")}`;
}

/** `/en/artistes/x` → "en". The site serves two trees; a report that mixes them is lying. */
export function langOfPath(p: string): "fr" | "en" {
  return /^\/en(\/|$)/.test(p) ? "en" : "fr";
}

/* ---------------------------------------------------------------------------
   Validation
--------------------------------------------------------------------------- */

const ID = /^[a-z0-9]{6,40}$/i;
const KINDS: HitKind[] = ["view", "end", "out", "in", "goal"];

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
};

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
};

function parseUtm(v: unknown): Utm | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const utm: Utm = {};
  for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
    const s = str(o[k], 120);
    if (s) utm[k] = s.toLowerCase();
  }
  return Object.keys(utm).length ? utm : undefined;
}

/**
 * Accepts one hit off the wire. Anything unrecognised is dropped rather than stored:
 * this endpoint is open to the internet by necessity (a beacon cannot authenticate),
 * so the only defence against someone stuffing the dataset with junk is to store
 * nothing but a known shape, clamped to known bounds.
 */
export function parseHit(v: unknown): RawHit | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;

  const k = str(o.k, 8) as HitKind | undefined;
  if (!k || !KINDS.includes(k)) return null;

  const sid = str(o.sid, 40);
  const vid = str(o.vid, 40);
  if (!sid || !vid || !ID.test(sid) || !ID.test(vid)) return null;

  const hit: RawHit = { k, sid, vid, p: normalizePath(str(o.p, 300)) };

  const ref = str(o.ref, 500);
  if (ref && /^https?:\/\//i.test(ref)) hit.ref = ref;

  const utm = parseUtm(o.utm);
  if (utm) hit.utm = utm;

  const sw = num(o.sw, 100, 10000);
  if (sw) hit.sw = sw;

  const bl = str(o.bl, 20);
  if (bl) hit.bl = bl;

  if (o.nv === 1 || o.nv === true) hit.nv = 1;

  if (k === "end") {
    // 6 h is well past any real reading session; past that it's a tab left open over a
    // weekend, and averaging it in would move every duration on the dashboard.
    hit.dur = num(o.dur, 0, 6 * 3600_000) ?? 0;
    hit.eng = Math.min(num(o.eng, 0, 6 * 3600_000) ?? 0, hit.dur);
    hit.sd = num(o.sd, 0, 100) ?? 0;
  }

  if (k === "out" || k === "in" || k === "goal") {
    const href = str(o.href, 500);
    if (href) hit.href = href;
    const txt = str(o.txt, 120);
    if (txt) hit.txt = txt.replace(/\s+/g, " ");
    const zone = str(o.zone, 40);
    if (zone) hit.zone = zone;
    const goal = str(o.goal, 60);
    if (goal) hit.goal = goal;
    if (k !== "goal" && !hit.href) return null;
    if (k === "goal" && !hit.goal) return null;
  }

  return hit;
}

/* ---------------------------------------------------------------------------
   Small shared formatters (dashboard + report)
--------------------------------------------------------------------------- */

/** yyyy-mm-dd in UTC, the key a day bucket is stored under. */
export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Every yyyy-mm-dd from `from` to `to` inclusive. Bounded by `max` so a hand-typed
 *  range can't ask the store for ten thousand keys. */
export function daysBetween(from: string, to: string, max = 400): string[] {
  const out: string[] = [];
  const end = Date.parse(to + "T00:00:00Z");
  let cur = Date.parse(from + "T00:00:00Z");
  if (!Number.isFinite(cur) || !Number.isFinite(end)) return out;
  while (cur <= end && out.length < max) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += 86400_000;
  }
  return out;
}

/** Host of a link, for grouping outbound clicks by destination. */
export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    // `mailto:` and `tel:` parse fine but carry no hostname; fall back to the scheme so
    // they still get a row instead of being dropped by the empty-key guard.
    return u.hostname.replace(/^www\./, "") || u.protocol.replace(":", "");
  } catch {
    return url.slice(0, 60);
  }
}
