import type { Device, Hit, Medium, Utm } from "./track";
import { DIRECT, dayKey, hostOf, langOfPath, pathGroup } from "./track";

/**
 * Turns raw hits into something you can read.
 *
 * Two stages, kept apart on purpose:
 *   1. `sessionize()` — reassembles visits. A hit only knows about itself; a *visit* is
 *      what answers "did they stay, what did they read, where did they go".
 *   2. `buildReport()` — counts. Every filter narrows the set of *sessions*, then the
 *      counts are recomputed over what's left. So filtering on Instagram doesn't just
 *      grey out rows: every panel on the page becomes "…for visits that came from
 *      Instagram", which is the only reading of a filter that doesn't mislead.
 *
 * Pure module — no I/O, no env, no React. The dashboard imports the types from here.
 */

/* ---------------------------------------------------------------------------
   Sessions
--------------------------------------------------------------------------- */

export type Step = {
  /** Page path. */
  p: string;
  /** When it opened (ms epoch). */
  at: number;
  /** How long the tab held it. */
  dur: number;
  /** How long it was actually in front of the visitor (tab visible). */
  eng: number;
  /** Deepest scroll, 0–100. */
  sd: number;
  /** Whether the `end` beacon ever arrived; `false` means dur/eng are unknown, not zero. */
  closed: boolean;
};

export type Click = {
  k: "out" | "in" | "goal";
  at: number;
  /** Page the click happened on. */
  from: string;
  href?: string;
  txt?: string;
  zone?: string;
  goal?: string;
};

export type Session = {
  id: string;
  vid: string;
  start: number;
  end: number;
  /** Wall-clock span of the visit. */
  durationMs: number;
  /** Sum of the per-page engaged time — always ≤ durationMs, and 0 if no `end` arrived. */
  engagedMs: number;
  views: number;
  entry: string;
  exit: string;
  /** True when the visit is one page, no click, under 10 s of attention. */
  bounce: boolean;
  src: string;
  med: Medium;
  ref?: string;
  utm?: Utm;
  cc?: string;
  city?: string;
  reg?: string;
  dev?: Device;
  br?: string;
  os?: string;
  sw?: number;
  bl?: string;
  lang: "fr" | "en";
  isNew: boolean;
  outbound: number;
  internal: number;
  goals: string[];
  /** The link they left on, when the visit ended with an outbound click — the answer to
   *  "et après, ils vont où ?" that an exit page alone can't give. */
  exitTo?: string;
  steps: Step[];
  clicks: Click[];
};

const BOUNCE_ENGAGED_MS = 10_000;

/** Reassembles visits from a flat, unordered pile of hits. */
export function sessionize(hits: Hit[]): Session[] {
  const bySession = new Map<string, Hit[]>();
  for (const h of hits) {
    const list = bySession.get(h.sid);
    if (list) list.push(h);
    else bySession.set(h.sid, [h]);
  }

  const out: Session[] = [];
  for (const [id, raw] of bySession) {
    const list = raw.slice().sort((a, b) => a.t - b.t);
    const first = list[0];

    const s: Session = {
      id,
      vid: first.vid,
      start: first.t,
      end: list[list.length - 1].t,
      durationMs: 0,
      engagedMs: 0,
      views: 0,
      entry: "",
      exit: "",
      bounce: false,
      src: DIRECT,
      med: "direct",
      lang: "fr",
      isNew: false,
      outbound: 0,
      internal: 0,
      goals: [],
      steps: [],
      clicks: [],
    };

    for (const h of list) {
      // Acquisition and environment are asserted on the session's first view and would
      // be absent from later hits; first non-empty value wins so a filter works on any row.
      if (h.src && s.src === DIRECT) s.src = h.src;
      if (h.med && s.med === "direct") s.med = h.med;
      s.ref ??= h.ref;
      s.utm ??= h.utm;
      s.cc ??= h.cc;
      s.city ??= h.city;
      s.reg ??= h.reg;
      s.dev ??= h.dev;
      s.br ??= h.br;
      s.os ??= h.os;
      s.sw ??= h.sw;
      s.bl ??= h.bl;
      if (h.nv) s.isNew = true;

      if (h.k === "view") {
        s.views++;
        s.steps.push({ p: h.p, at: h.t, dur: 0, eng: 0, sd: 0, closed: false });
      } else if (h.k === "end") {
        // The tracker reports *deltas*: it sends one `end` every time the tab is hidden
        // and one more when the page is finally left, so a visitor who switches away and
        // comes back produces several. Accumulate them onto the same step instead of
        // pairing one-to-one — otherwise the second half of a visit is silently lost, and
        // that is precisely the visitor who read the whole page.
        let step: Step | undefined;
        for (let i = s.steps.length - 1; i >= 0; i--) {
          if (s.steps[i].p === h.p) {
            step = s.steps[i];
            break;
          }
        }
        // An `end` with no matching view means the view hit never made it (dropped
        // beacon, blocked request). Nothing to attach it to, and inventing a step would
        // be inventing a pageview.
        if (step) {
          step.dur += h.dur ?? 0;
          step.eng += h.eng ?? 0;
          step.sd = Math.max(step.sd, h.sd ?? 0);
          step.closed = true;
        }
      } else {
        s.clicks.push({ k: h.k, at: h.t, from: h.p, href: h.href, txt: h.txt, zone: h.zone, goal: h.goal });
        if (h.k === "out") s.outbound++;
        else if (h.k === "in") s.internal++;
        else if (h.goal) s.goals.push(h.goal);
      }
    }

    s.entry = s.steps[0]?.p ?? first.p;
    s.exit = s.steps[s.steps.length - 1]?.p ?? s.entry;
    s.lang = langOfPath(s.entry);
    s.engagedMs = s.steps.reduce((n, st) => n + st.eng, 0);
    s.durationMs = Math.max(s.end - s.start, s.steps.reduce((n, st) => n + st.dur, 0));

    // Where they went: an outbound click counts as the exit when nothing of ours was
    // opened after it. A ticket link clicked mid-visit and returned from is followed by
    // another view; a departure is not.
    //
    // Not a time window — that was the first attempt and it was wrong: the `end` beacon
    // for the page they left routinely lands a second or two after the click, so
    // "within 2 s of the session end" silently missed most real departures.
    const lastOut = [...s.clicks].reverse().find((c) => c.k === "out");
    const lastViewAt = s.steps.length ? s.steps[s.steps.length - 1].at : -Infinity;
    if (lastOut && lastOut.at >= lastViewAt) s.exitTo = lastOut.href;

    s.bounce = s.views <= 1 && s.outbound === 0 && s.internal === 0 && s.engagedMs < BOUNCE_ENGAGED_MS;
    out.push(s);
  }

  return out.sort((a, b) => b.start - a.start);
}

/* ---------------------------------------------------------------------------
   Filters
--------------------------------------------------------------------------- */

export type Filters = {
  page?: string;
  pageGroup?: string;
  entry?: string;
  exit?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  utmSource?: string;
  country?: string;
  city?: string;
  region?: string;
  device?: string;
  browser?: string;
  os?: string;
  lang?: string;
  visitor?: string;
  session?: string;
  outHost?: string;
  goal?: string;
  /** "new" = first ever visit, "returning" = has been here before. */
  visitorType?: string;
  /** "bounce" = left immediately, "engaged" = did not. */
  quality?: string;
  /** Free text, matched against paths, link targets and link labels. */
  q?: string;
};

/** Every filter key the API accepts — one list, so the route, the dashboard chips and
 *  the URL round-trip can't drift apart. */
export const FILTER_KEYS: (keyof Filters)[] = [
  "page",
  "pageGroup",
  "entry",
  "exit",
  "source",
  "medium",
  "campaign",
  "utmSource",
  "country",
  "city",
  "region",
  "device",
  "browser",
  "os",
  "lang",
  "visitor",
  "session",
  "outHost",
  "goal",
  "visitorType",
  "quality",
  "q",
];

const eq = (a: string | undefined, b: string) => (a ?? "").toLowerCase() === b.toLowerCase();

function matchesText(s: Session, needle: string): boolean {
  const n = needle.toLowerCase();
  if (s.steps.some((st) => st.p.toLowerCase().includes(n))) return true;
  if (s.clicks.some((c) => (c.href ?? "").toLowerCase().includes(n) || (c.txt ?? "").toLowerCase().includes(n)))
    return true;
  return [s.src, s.city, s.cc, s.br, s.os, s.utm?.campaign].some((v) => (v ?? "").toLowerCase().includes(n));
}

/**
 * Narrows the session set. A page filter means "visits that *included* this page" —
 * not "the pageviews of this page" — because the questions worth asking about a page
 * (where did those readers come from, what else did they open, did they buy a ticket)
 * are all properties of the visit, not of the single view.
 */
export function applyFilters(sessions: Session[], f: Filters): Session[] {
  return sessions.filter((s) => {
    if (f.page && !s.steps.some((st) => st.p === f.page)) return false;
    if (f.pageGroup && !s.steps.some((st) => pathGroup(st.p) === f.pageGroup)) return false;
    if (f.entry && s.entry !== f.entry) return false;
    if (f.exit && s.exit !== f.exit) return false;
    if (f.source && !eq(s.src, f.source)) return false;
    if (f.medium && !eq(s.med, f.medium)) return false;
    if (f.campaign && !eq(s.utm?.campaign, f.campaign)) return false;
    if (f.utmSource && !eq(s.utm?.source, f.utmSource)) return false;
    if (f.country && !eq(s.cc, f.country)) return false;
    if (f.city && !eq(s.city, f.city)) return false;
    if (f.region && !eq(s.reg, f.region)) return false;
    if (f.device && !eq(s.dev, f.device)) return false;
    if (f.browser && !eq(s.br, f.browser)) return false;
    if (f.os && !eq(s.os, f.os)) return false;
    if (f.lang && s.lang !== f.lang) return false;
    if (f.visitor && s.vid !== f.visitor) return false;
    if (f.session && s.id !== f.session) return false;
    if (f.outHost && !s.clicks.some((c) => c.k === "out" && c.href && hostOf(c.href) === f.outHost)) return false;
    if (f.goal && !s.goals.includes(f.goal)) return false;
    if (f.visitorType === "new" && !s.isNew) return false;
    if (f.visitorType === "returning" && s.isNew) return false;
    if (f.quality === "bounce" && !s.bounce) return false;
    if (f.quality === "engaged" && s.bounce) return false;
    if (f.q && !matchesText(s, f.q)) return false;
    return true;
  });
}

/* ---------------------------------------------------------------------------
   Aggregation
--------------------------------------------------------------------------- */

export type Row = {
  key: string;
  /** Primary count — pageviews for pages, sessions for everything else. */
  count: number;
  /** Distinct visitors behind that count. */
  uniq: number;
  /** Panel-specific secondary number (average engaged seconds, bounce rate…). */
  extra?: number;
  /** Free-form second label, e.g. the full URL behind a host. */
  note?: string;
};

/** Counter that keeps both a total and the distinct visitors behind it. */
class Tally {
  private m = new Map<string, { count: number; uniq: Set<string>; extra: number; extraN: number; note?: string }>();

  add(key: string | undefined, vid: string, opts?: { extra?: number; note?: string; by?: number }) {
    if (!key) return;
    let e = this.m.get(key);
    if (!e) this.m.set(key, (e = { count: 0, uniq: new Set(), extra: 0, extraN: 0 }));
    e.count += opts?.by ?? 1;
    e.uniq.add(vid);
    if (opts?.extra !== undefined) {
      e.extra += opts.extra;
      e.extraN++;
    }
    if (opts?.note && !e.note) e.note = opts.note;
  }

  rows(limit = 60): Row[] {
    return [...this.m.entries()]
      .map(([key, e]) => ({
        key,
        count: e.count,
        uniq: e.uniq.size,
        ...(e.extraN ? { extra: Math.round((e.extra / e.extraN) * 10) / 10 } : {}),
        ...(e.note ? { note: e.note } : {}),
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
      .slice(0, limit);
  }
}

export type Kpis = {
  views: number;
  sessions: number;
  visitors: number;
  newVisitors: number;
  /** Average wall-clock length of a visit, seconds. */
  avgSessionSec: number;
  /** Average time a page was actually looked at, seconds. */
  avgPageEngagedSec: number;
  bounceRate: number;
  viewsPerSession: number;
  outbound: number;
  internal: number;
  goals: number;
  /** Share of visits that clicked at least one outbound link — the closest thing this
   *  site has to a conversion until ticketing reports back. */
  outboundRate: number;
  avgScroll: number;
};

export type Report = {
  range: { from: string; to: string };
  granularity: "hour" | "day";
  kpis: Kpis;
  /** Same shape for both granularities: `key` is an ISO day or an ISO hour. */
  series: { key: string; views: number; sessions: number; visitors: number }[];
  byHour: { key: string; count: number }[];
  byWeekday: { key: string; count: number }[];
  panels: Record<string, Row[]>;
  sessions: SessionRow[];
  live: { visitors: number; sessions: number; pages: Row[] };
  /** Totals before filtering, so the header can say "412 visites sur 1 200". */
  totals: { sessions: number; views: number };
};

/** A session flattened for the wire — the dashboard renders this directly. */
export type SessionRow = Omit<Session, "steps" | "clicks"> & {
  steps: Step[];
  clicks: Click[];
};

const sec = (ms: number) => Math.round(ms / 1000);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/**
 * `sessions` must already be filtered; `all` is the unfiltered set, used only for the
 * "x sur y" totals and for the live counter (which should not disappear because a
 * filter excludes the person currently browsing).
 */
export function buildReport(
  sessions: Session[],
  all: Session[],
  opts: { from: string; to: string; now: number; sessionLimit?: number },
): Report {
  const { from, to, now } = opts;

  /* ---- KPIs ---- */
  const visitors = new Set<string>();
  const newVisitors = new Set<string>();
  let views = 0;
  let bounces = 0;
  let sessionMs = 0;
  let outbound = 0;
  let internal = 0;
  let goals = 0;
  let withOutbound = 0;
  let engagedMs = 0;
  let closedSteps = 0;
  let scrollSum = 0;

  for (const s of sessions) {
    visitors.add(s.vid);
    if (s.isNew) newVisitors.add(s.vid);
    views += s.views;
    if (s.bounce) bounces++;
    sessionMs += s.durationMs;
    outbound += s.outbound;
    internal += s.internal;
    goals += s.goals.length;
    if (s.outbound > 0) withOutbound++;
    for (const st of s.steps) {
      if (!st.closed) continue;
      closedSteps++;
      engagedMs += st.eng;
      scrollSum += st.sd;
    }
  }

  const kpis: Kpis = {
    views,
    sessions: sessions.length,
    visitors: visitors.size,
    newVisitors: newVisitors.size,
    avgSessionSec: sessions.length ? sec(sessionMs / sessions.length) : 0,
    avgPageEngagedSec: closedSteps ? sec(engagedMs / closedSteps) : 0,
    bounceRate: pct(bounces, sessions.length),
    viewsPerSession: sessions.length ? Math.round((views / sessions.length) * 100) / 100 : 0,
    outbound,
    internal,
    goals,
    outboundRate: pct(withOutbound, sessions.length),
    avgScroll: closedSteps ? Math.round(scrollSum / closedSteps) : 0,
  };

  /* ---- Time series ---- */
  // Under ~3 days a daily bar chart is three bars; past that, hourly is 2 000 columns.
  const spanDays = Math.max(1, Math.round((Date.parse(to + "T23:59:59Z") - Date.parse(from + "T00:00:00Z")) / 86400_000));
  const granularity: "hour" | "day" = spanDays <= 2 ? "hour" : "day";
  const bucketOf = (ms: number) => (granularity === "hour" ? new Date(ms).toISOString().slice(0, 13) : dayKey(ms));

  const buckets = new Map<string, { views: number; sessions: Set<string>; visitors: Set<string> }>();
  const touch = (key: string) => {
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { views: 0, sessions: new Set(), visitors: new Set() }));
    return b;
  };
  // Pre-seed every bucket in range so a quiet Tuesday is a zero, not a gap the chart
  // silently closes up.
  const startMs = Date.parse(from + "T00:00:00Z");
  const endMs = Date.parse(to + "T23:59:59Z");
  const stepMs = granularity === "hour" ? 3600_000 : 86400_000;
  for (let ms = startMs; ms <= endMs && buckets.size < 2000; ms += stepMs) touch(bucketOf(ms));

  const hourTally = new Map<number, number>();
  const weekdayTally = new Map<number, number>();

  for (const s of sessions) {
    touch(bucketOf(s.start)).sessions.add(s.id);
    for (const st of s.steps) {
      const b = touch(bucketOf(st.at));
      b.views++;
      b.visitors.add(s.vid);
      const d = new Date(st.at);
      hourTally.set(d.getUTCHours(), (hourTally.get(d.getUTCHours()) ?? 0) + 1);
      weekdayTally.set(d.getUTCDay(), (weekdayTally.get(d.getUTCDay()) ?? 0) + 1);
    }
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({ key, views: b.views, sessions: b.sessions.size, visitors: b.visitors.size }));

  const byHour = Array.from({ length: 24 }, (_, h) => ({
    key: String(h).padStart(2, "0") + "h",
    count: hourTally.get(h) ?? 0,
  }));
  const byWeekday = Array.from({ length: 7 }, (_, d) => ({
    key: WEEKDAYS[(d + 1) % 7],
    count: weekdayTally.get((d + 1) % 7) ?? 0,
  }));

  /* ---- Breakdowns ---- */
  const pages = new Tally();
  const pageGroups = new Tally();
  const entries = new Tally();
  const exits = new Tally();
  const sources = new Tally();
  const referrers = new Tally();
  const mediums = new Tally();
  const campaigns = new Tally();
  const utmSources = new Tally();
  const countries = new Tally();
  const cities = new Tally();
  const regions = new Tally();
  const devices = new Tally();
  const browsers = new Tally();
  const systems = new Tally();
  const langs = new Tally();
  const screens = new Tally();
  const browserLangs = new Tally();
  const outHosts = new Tally();
  const outLinks = new Tally();
  const inLinks = new Tally();
  const zones = new Tally();
  const goalRows = new Tally();
  const exitTargets = new Tally();

  const screenBucket = (w?: number) =>
    w === undefined ? undefined : w < 480 ? "< 480 px" : w < 768 ? "480–767 px" : w < 1024 ? "768–1023 px" : w < 1440 ? "1024–1439 px" : "≥ 1440 px";

  for (const s of sessions) {
    for (const st of s.steps) {
      pages.add(st.p, s.vid, st.closed ? { extra: sec(st.eng) } : undefined);
      pageGroups.add(pathGroup(st.p), s.vid, st.closed ? { extra: sec(st.eng) } : undefined);
    }
    entries.add(s.entry, s.vid, { extra: s.bounce ? 100 : 0 });
    exits.add(s.exit, s.vid);
    sources.add(s.src, s.vid, { extra: s.bounce ? 100 : 0 });
    if (s.ref) referrers.add(s.ref.slice(0, 160), s.vid);
    mediums.add(s.med, s.vid);
    campaigns.add(s.utm?.campaign, s.vid);
    utmSources.add(s.utm?.source, s.vid);
    countries.add(s.cc, s.vid);
    cities.add(s.city, s.vid);
    regions.add(s.reg, s.vid);
    devices.add(s.dev, s.vid);
    browsers.add(s.br, s.vid);
    systems.add(s.os, s.vid);
    langs.add(s.lang, s.vid);
    screens.add(screenBucket(s.sw), s.vid);
    browserLangs.add(s.bl, s.vid);
    if (s.exitTo) exitTargets.add(hostOf(s.exitTo), s.vid, { note: s.exitTo });
    for (const c of s.clicks) {
      if (c.k === "out" && c.href) {
        outHosts.add(hostOf(c.href), s.vid);
        outLinks.add(c.href.slice(0, 160), s.vid, { note: c.txt });
      } else if (c.k === "in" && c.href) {
        inLinks.add(c.href.slice(0, 160), s.vid, { note: c.txt });
        zones.add(c.zone, s.vid);
      } else if (c.k === "goal" && c.goal) {
        goalRows.add(c.goal, s.vid, { note: c.from });
      }
    }
  }

  /* ---- Live ---- */
  const liveSessions = all.filter((s) => now - s.end < 5 * 60_000);
  const livePages = new Tally();
  for (const s of liveSessions) livePages.add(s.exit, s.vid);

  return {
    range: { from, to },
    granularity,
    kpis,
    series,
    byHour,
    byWeekday,
    panels: {
      pages: pages.rows(),
      pageGroups: pageGroups.rows(),
      entries: entries.rows(),
      exits: exits.rows(),
      sources: sources.rows(),
      referrers: referrers.rows(),
      mediums: mediums.rows(),
      campaigns: campaigns.rows(),
      utmSources: utmSources.rows(),
      countries: countries.rows(),
      cities: cities.rows(),
      regions: regions.rows(),
      devices: devices.rows(),
      browsers: browsers.rows(),
      systems: systems.rows(),
      langs: langs.rows(),
      screens: screens.rows(),
      browserLangs: browserLangs.rows(),
      outHosts: outHosts.rows(),
      outLinks: outLinks.rows(),
      inLinks: inLinks.rows(),
      zones: zones.rows(),
      goals: goalRows.rows(),
      exitTargets: exitTargets.rows(),
    },
    // Newest first, capped: the explorer is for reading individual visits, and nobody
    // reads the 900th. Every count above is computed on the full filtered set.
    sessions: sessions.slice(0, opts.sessionLimit ?? 300).map((s) => ({ ...s, steps: s.steps.slice(0, 120), clicks: s.clicks.slice(0, 120) })),
    live: { visitors: new Set(liveSessions.map((s) => s.vid)).size, sessions: liveSessions.length, pages: livePages.rows(12) },
    totals: { sessions: all.length, views: all.reduce((n, s) => n + s.views, 0) },
  };
}
