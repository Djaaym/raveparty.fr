"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The collector, browser side.
 *
 * Sends five kinds of hit to `/api/track`: a page was shown, a page was left (with how
 * long it was open, how long it was actually looked at, how far it was scrolled), a link
 * out of the site was clicked, a link inside the site was clicked, and a declared goal
 * fired. Between them they answer the four questions the dashboard exists for — who
 * came, from where, what they did, and where they went.
 *
 * No cookie is set here and nothing leaves the browser except the fields listed above.
 * Two ids live in localStorage: a visitor id (random, meaningless off this domain) and a
 * session id that rotates after 30 minutes of inactivity. `localStorage.rr_optout = "1"`
 * turns the whole thing off for that browser — the dashboard sets it on itself so the
 * owner's own visits don't end up in their own numbers.
 *
 * Deliberately small: no dependency, no dynamic import, and every listener is passive or
 * capture-only. It runs on every page of the site, so its cost is the site's cost.
 */

const ENDPOINT = "/api/track";

/** Idle gap that starts a new session. 30 min is the industry convention, and matching
 *  it is what makes these numbers comparable to the GA4 property already on the site. */
const SESSION_GAP_MS = 30 * 60_000;

/** Batching delay. Long enough for a page's view + first clicks to travel together,
 *  short enough that a bounce still gets recorded before the tab goes. */
const FLUSH_MS = 1500;

type Kind = "view" | "end" | "out" | "in" | "goal";
type Hit = Record<string, unknown> & { k: Kind; p: string };

/* Module scope, not React state: these outlive re-renders and must survive the
   double-invoked effects of StrictMode without sending anything twice. */
let queue: Hit[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let current: { p: string; start: number; engFrom: number | null; eng: number; sent: number; sd: number } | null = null;
let lastView = { p: "", at: 0 };
let wired = false;

const now = () => Date.now();
const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function ls(): Storage | null {
  try {
    // Private browsing and locked-down profiles throw on access, not on write.
    const s = window.localStorage;
    s.getItem("rr_probe");
    return s;
  } catch {
    return null;
  }
}

/** Off for this browser? Checked on every hit, so flipping the flag takes effect at once. */
function optedOut(): boolean {
  const s = ls();
  if (s?.getItem("rr_optout") === "1") return true;
  if (process.env.NEXT_PUBLIC_TRACK_RESPECT_DNT === "1") {
    const dnt = navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
    if (dnt === "1" || dnt === "yes") return true;
  }
  return false;
}

/** Visitor id, and whether we had to invent it — that's what "nouveau visiteur" means. */
function visitor(): { vid: string; isNew: boolean } {
  const s = ls();
  if (!s) return { vid: "anon0000", isNew: false };
  const existing = s.getItem("rr_vid");
  if (existing) return { vid: existing, isNew: false };
  const vid = rid();
  s.setItem("rr_vid", vid);
  return { vid, isNew: true };
}

/** Session id, rotated on idle. `first` is true exactly once per session — that is the
 *  hit allowed to carry the referrer and the UTM tags. */
function session(): { sid: string; first: boolean } {
  const s = ls();
  if (!s) return { sid: "anon0000", first: false };
  const at = Number(s.getItem("rr_sat") ?? 0);
  let sid = s.getItem("rr_sid") ?? "";
  if (!sid || now() - at > SESSION_GAP_MS) {
    sid = rid();
    s.setItem("rr_sid", sid);
    s.setItem("rr_sfirst", "1");
  }
  s.setItem("rr_sat", String(now()));
  return { sid, first: s.getItem("rr_sfirst") === "1" };
}

function consumeFirst() {
  ls()?.setItem("rr_sfirst", "0");
}

function utmFromLocation(): Record<string, string> | undefined {
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const [param, key] of [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_term", "term"],
    ["utm_content", "content"],
    // Ad platforms tag their own way; treat the click id as a source when nothing else says.
    ["gclid", "source"],
    ["fbclid", "source"],
  ] as const) {
    const v = q.get(param);
    if (!v) continue;
    if (param === "gclid") out.source ||= "google-ads";
    else if (param === "fbclid") out.source ||= "facebook-ads";
    else out[key] ||= v.slice(0, 120);
  }
  return Object.keys(out).length ? out : undefined;
}

/* ---------------------------------------------------------------------------
   Sending
--------------------------------------------------------------------------- */

function flush(beacon = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length) return;
  const body = JSON.stringify({ hits: queue });
  queue = [];

  // text/plain keeps sendBeacon out of CORS preflight territory and the route parses
  // the body as text anyway, so both paths are identical server-side.
  if (beacon && typeof navigator.sendBeacon === "function") {
    try {
      if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
    } catch {
      /* fall through to fetch */
    }
  }
  // keepalive so a fetch started as the page goes away still completes.
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(
    () => undefined,
  );
}

function send(hit: Hit, urgent = false) {
  if (optedOut()) return;
  // The click listener is attached to the document once, for the life of the tab, so it
  // also fires on the dashboard itself. Without this the owner reading /suivi shows up
  // in /suivi as someone who clicks a great many internal links.
  if (location.pathname.startsWith("/suivi")) return;
  const { vid, isNew } = visitor();
  const { sid } = session();
  queue.push({ ...hit, sid, vid, ...(isNew ? { nv: 1 } : {}) } as Hit);
  if (urgent) flush(true);
  else if (!timer) timer = setTimeout(() => flush(false), FLUSH_MS);
}

/* ---------------------------------------------------------------------------
   Page lifecycle
--------------------------------------------------------------------------- */

function scrollDepth(): number {
  const doc = document.documentElement;
  const height = Math.max(doc.scrollHeight, document.body?.scrollHeight ?? 0);
  if (height <= window.innerHeight) return 100;
  return Math.max(0, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / height) * 100)));
}

function openPage(p: string) {
  // StrictMode mounts every effect twice in development, and a remount is not a visit.
  if (lastView.p === p && now() - lastView.at < 2000) return;
  lastView = { p, at: now() };

  const { first } = session();
  const hit: Hit = { k: "view", p, sw: window.innerWidth, bl: navigator.language };
  if (first) {
    // Only the session's opening hit carries acquisition — repeating it on every page
    // would make the last page of a visit look like a fresh arrival from Google.
    if (document.referrer) hit.ref = document.referrer;
    const utm = utmFromLocation();
    if (utm) hit.utm = utm;
    consumeFirst();
  }
  current = { p, start: now(), engFrom: document.visibilityState === "visible" ? now() : null, eng: 0, sent: 0, sd: 0 };
  send(hit);
}

/**
 * Reports the time accumulated since the last report. Called on hide, on unload and on
 * every route change, so a visit that ends by backgrounding the tab is still measured —
 * the server sums the deltas back into one figure per page.
 */
function reportPage(urgent: boolean) {
  if (!current) return;
  if (current.engFrom !== null) {
    current.eng += now() - current.engFrom;
    current.engFrom = document.visibilityState === "visible" ? now() : null;
  }
  const total = now() - current.start;
  const dur = total - current.sent;
  const eng = current.eng;
  current.sent = total;
  current.eng = 0;
  current.sd = Math.max(current.sd, scrollDepth());
  if (dur < 250 && eng < 250) return; // nothing happened since the last report
  send({ k: "end", p: current.p, dur, eng, sd: current.sd }, urgent);
}

/* ---------------------------------------------------------------------------
   Clicks
--------------------------------------------------------------------------- */

/** Where on the page the click happened. An explicit `data-track-zone` wins; otherwise
 *  the nearest landmark, which is enough to tell "clicked the nav" from "clicked a card". */
function zoneOf(el: Element): string | undefined {
  const declared = el.closest<HTMLElement>("[data-track-zone]")?.dataset.trackZone;
  if (declared) return declared.slice(0, 40);
  if (el.closest("nav, header")) return "nav";
  if (el.closest("footer")) return "footer";
  if (el.closest(".linkfarm, .linkcols")) return "maillage";
  if (el.closest(".card, .row-card")) return "carte";
  if (el.closest(".filters")) return "filtres";
  return undefined;
}

/**
 * A readable name for the thing that was clicked.
 *
 * Cards on this site are one big anchor wrapping the date, the title, the venue and the
 * price, so `textContent` yields "06 AOÛT 2026 → 09 AOÛT 2026UNTOLD📍 Cluj…" — technically
 * the link text, useless as a label. Prefer, in order: an explicit `aria-label`, the
 * heading inside the link (that *is* the anchor text as far as a reader is concerned),
 * then the flattened text, then an image's alt.
 */
function labelOf(a: HTMLElement): string | undefined {
  const heading = a.querySelector("h1, h2, h3, h4, .card-title");
  const text =
    a.getAttribute("aria-label") ||
    heading?.textContent?.replace(/\s+/g, " ").trim() ||
    a.textContent?.replace(/\s+/g, " ").trim() ||
    a.querySelector("img")?.getAttribute("alt") ||
    "";
  return text ? text.slice(0, 120) : undefined;
}

function onClick(e: Event) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const goalEl = target.closest<HTMLElement>("[data-goal]");
  if (goalEl?.dataset.goal) {
    send({ k: "goal", p: location.pathname, goal: goalEl.dataset.goal.slice(0, 60), txt: labelOf(goalEl) }, true);
  }

  const a = target.closest<HTMLAnchorElement>("a[href]");
  if (!a) return;
  const raw = a.getAttribute("href") ?? "";
  if (!raw || raw.startsWith("#")) return;

  // mailto:, tel: and the like never resolve to a host — they are still departures.
  if (/^(mailto|tel|sms):/i.test(raw)) {
    send({ k: "out", p: location.pathname, href: raw.slice(0, 200), txt: labelOf(a), zone: zoneOf(a) }, true);
    return;
  }

  let url: URL;
  try {
    url = new URL(raw, location.href);
  } catch {
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;

  if (url.host !== location.host) {
    // Urgent: the browser may be a few milliseconds from unloading this document.
    send({ k: "out", p: location.pathname, href: url.href.slice(0, 400), txt: labelOf(a), zone: zoneOf(a) }, true);
  } else {
    // Internal links are stored as a path: the full URL adds nothing and the query
    // string would splinter one link into a dozen rows.
    send({ k: "in", p: location.pathname, href: url.pathname.slice(0, 200), txt: labelOf(a), zone: zoneOf(a) });
  }
}

/* ---------------------------------------------------------------------------
   Component
--------------------------------------------------------------------------- */

export default function Tracker() {
  const pathname = usePathname();

  // Document-level listeners, attached once for the life of the tab. Kept out of the
  // per-route effect so a navigation never detaches a listener mid-click.
  useEffect(() => {
    if (wired) return;
    wired = true;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        reportPage(true);
      } else if (current) {
        current.engFrom = now();
      }
    };
    const onHide = () => {
      reportPage(true);
      flush(true);
    };
    const onScroll = () => {
      if (current) current.sd = Math.max(current.sd, scrollDepth());
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    // Middle-click and ctrl-click open a link without ever unloading this page — they
    // are still clicks, and on a ticket link they are the interesting ones.
    document.addEventListener("auxclick", onClick, true);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    // The dashboard reads the data; counting its own page loads would be the site
    // owner watching themselves.
    if (pathname.startsWith("/suivi")) return;
    if (optedOut()) return;

    reportPage(false);
    openPage(pathname);

    return () => {
      reportPage(false);
      flush(false);
    };
  }, [pathname]);

  return null;
}
