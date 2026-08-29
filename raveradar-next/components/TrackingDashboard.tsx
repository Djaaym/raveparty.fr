"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FILTER_KEYS, type Filters, type Report, type Row, type SessionRow } from "@/lib/track-report";

/** What `/api/track/stats` actually returns: the report plus the context the header
 *  needs to be honest about where the numbers came from. */
type Stats = Report & {
  filters: Filters;
  store: { name: string; persistent: boolean; retentionDays: number };
  hits: number;
};

/**
 * The private audience dashboard (`/suivi`).
 *
 * Everything is driven by one call to `/api/track/stats`: the server reads the range
 * once, rebuilds the visits, and returns every panel already counted. So changing a
 * filter is one request and the whole page (KPIs, chart, all twenty breakdowns, the
 * visit list) moves together. There is no state on this page that the URL doesn't
 * carry, which is what makes a view shareable with your future self.
 *
 * Clicking any row in any panel filters on it. That is the entire interaction model:
 * "Instagram" → the page becomes Instagram's traffic; then "mobile" → Instagram on a
 * phone; then a page → what those readers did on it. The chips at the top say what
 * you're looking at and each one comes off with a click.
 */

/* ---------------------------------------------------------------------------
   Formatting
--------------------------------------------------------------------------- */

const nf = new Intl.NumberFormat("fr-FR");
const n = (v: number) => nf.format(Math.round(v));

function dur(seconds: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s ? `${m} min ${String(s).padStart(2, "0")}` : `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/** ISO-3166 alpha-2 → the flag emoji, by offsetting into the regional-indicator block.
 *  Works for every country without shipping a table of 250 of them. */
function flag(cc?: string): string {
  if (!cc || cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return "🌍";
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
}

const REGION_NAMES = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;

function countryName(cc: string): string {
  try {
    return REGION_NAMES?.of(cc) ?? cc;
  } catch {
    return cc;
  }
}

const dayOf = (ms: number) => new Date(ms).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function since(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (k: number) => iso(new Date(Date.now() - k * 86400_000));

/* ---------------------------------------------------------------------------
   Panels
--------------------------------------------------------------------------- */

type PanelDef = {
  id: string;
  title: string;
  /** The filter a row click applies. Omitted where a row isn't a filterable dimension. */
  filter?: keyof Filters;
  /** Header above the main number. */
  metric: string;
  /** Header above `uniq`, when it is worth showing. */
  uniqLabel?: string;
  /** Header above `extra`, when the panel fills it. */
  extraLabel?: string;
  extraSuffix?: string;
  /** How to render the key. */
  render?: (row: Row) => string;
  empty: string;
};

const PANELS: Record<string, PanelDef> = {
  pages: { id: "pages", title: "Pages vues", filter: "page", metric: "Vues", uniqLabel: "Visiteurs", extraLabel: "Temps lu", extraSuffix: "s", empty: "Aucune page vue sur la période." },
  pageGroups: { id: "pageGroups", title: "Types de page", filter: "pageGroup", metric: "Vues", uniqLabel: "Visiteurs", extraLabel: "Temps lu", extraSuffix: "s", empty: "Rien à regrouper." },
  entries: { id: "entries", title: "Pages d'entrée", filter: "entry", metric: "Visites", uniqLabel: "Visiteurs", extraLabel: "Rebond", extraSuffix: "%", empty: "Aucune entrée." },
  exits: { id: "exits", title: "Pages de sortie", filter: "exit", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune sortie." },
  sources: { id: "sources", title: "Sources", filter: "source", metric: "Visites", uniqLabel: "Visiteurs", extraLabel: "Rebond", extraSuffix: "%", empty: "Aucune visite." },
  mediums: { id: "mediums", title: "Canaux", filter: "medium", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  referrers: { id: "referrers", title: "Pages référentes (URL complète)", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucun référent, que du trafic direct." },
  campaigns: { id: "campaigns", title: "Campagnes (utm_campaign)", filter: "campaign", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucun lien taggé n'a été utilisé." },
  utmSources: { id: "utmSources", title: "Sources taggées (utm_source)", filter: "utmSource", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucun lien taggé n'a été utilisé." },
  countries: { id: "countries", title: "Pays", filter: "country", metric: "Visites", uniqLabel: "Visiteurs", render: (r) => `${flag(r.key)}  ${countryName(r.key)}`, empty: "Pas de géolocalisation (hors Vercel, l'en-tête n'existe pas)." },
  cities: { id: "cities", title: "Villes", filter: "city", metric: "Visites", uniqLabel: "Visiteurs", empty: "Pas de géolocalisation." },
  regions: { id: "regions", title: "Régions", filter: "region", metric: "Visites", uniqLabel: "Visiteurs", empty: "Pas de géolocalisation." },
  devices: { id: "devices", title: "Appareils", filter: "device", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  browsers: { id: "browsers", title: "Navigateurs", filter: "browser", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  systems: { id: "systems", title: "Systèmes", filter: "os", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  screens: { id: "screens", title: "Largeur d'écran", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  langs: { id: "langs", title: "Version du site", filter: "lang", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  browserLangs: { id: "browserLangs", title: "Langue du navigateur", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite." },
  outHosts: { id: "outHosts", title: "Destinations sortantes", filter: "outHost", metric: "Clics", uniqLabel: "Visiteurs", empty: "Personne n'a cliqué vers l'extérieur." },
  outLinks: { id: "outLinks", title: "Liens sortants cliqués", metric: "Clics", uniqLabel: "Visiteurs", empty: "Personne n'a cliqué vers l'extérieur." },
  exitTargets: { id: "exitTargets", title: "Ils sont partis vers…", metric: "Visites", uniqLabel: "Visiteurs", empty: "Aucune visite ne s'est terminée sur un clic sortant." },
  inLinks: { id: "inLinks", title: "Liens internes cliqués", filter: "page", metric: "Clics", uniqLabel: "Visiteurs", empty: "Aucun clic interne enregistré." },
  zones: { id: "zones", title: "Zone du clic interne", metric: "Clics", uniqLabel: "Visiteurs", empty: "Aucun clic interne enregistré." },
  goals: { id: "goals", title: "Objectifs", filter: "goal", metric: "Clics", uniqLabel: "Visiteurs", empty: "Aucun objectif déclaré (attribut data-goal)." },
};

const GROUPS: { id: string; label: string; panels: string[] }[] = [
  { id: "pages", label: "Pages", panels: ["pages", "pageGroups", "entries", "exits"] },
  { id: "sources", label: "Provenance", panels: ["sources", "mediums", "referrers", "campaigns", "utmSources"] },
  { id: "geo", label: "Géographie", panels: ["countries", "cities", "regions"] },
  { id: "tech", label: "Appareils", panels: ["devices", "browsers", "systems", "screens", "langs", "browserLangs"] },
  { id: "clicks", label: "Clics & sorties", panels: ["outHosts", "outLinks", "exitTargets", "inLinks", "zones", "goals"] },
];

/** Human label for a filter chip. */
const FILTER_LABELS: Record<string, string> = {
  page: "Page",
  pageGroup: "Type de page",
  entry: "Entrée",
  exit: "Sortie",
  source: "Source",
  medium: "Canal",
  campaign: "Campagne",
  utmSource: "utm_source",
  country: "Pays",
  city: "Ville",
  region: "Région",
  device: "Appareil",
  browser: "Navigateur",
  os: "Système",
  lang: "Version",
  visitor: "Visiteur",
  session: "Visite",
  outHost: "Destination",
  goal: "Objectif",
  visitorType: "Type de visiteur",
  quality: "Qualité",
  q: "Recherche",
};

/* ---------------------------------------------------------------------------
   Small pieces
--------------------------------------------------------------------------- */

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="trk-kpi">
      <div className="trk-kpi-label">{label}</div>
      <div className="trk-kpi-value">{value}</div>
      {hint ? <div className="trk-kpi-hint">{hint}</div> : null}
    </div>
  );
}

/** A bar chart made of divs. Responsive without any viewBox arithmetic, and every bar
 *  keeps a real title attribute so the numbers are readable without a tooltip library. */
function Bars({
  data,
  labelOf,
  onPick,
}: {
  data: { key: string; count: number; sub?: number; title: string }[];
  labelOf?: (key: string, i: number) => string | null;
  onPick?: (key: string) => void;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="trk-bars">
      {data.map((d, i) => {
        const label = labelOf?.(d.key, i);
        return (
          <div
            key={d.key + i}
            className={`trk-bar${onPick ? " is-pick" : ""}`}
            title={d.title}
            onClick={onPick ? () => onPick(d.key) : undefined}
          >
            <div className="trk-bar-stack">
              <div className="trk-bar-fill" style={{ height: `${(d.count / max) * 100}%` }} />
              {d.sub !== undefined ? <div className="trk-bar-sub" style={{ height: `${(d.sub / max) * 100}%` }} /> : null}
            </div>
            {label ? <span className="trk-bar-label">{label}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ def, rows, onPick }: { def: PanelDef; rows: Row[]; onPick: (k: keyof Filters, v: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const shown = expanded ? rows : rows.slice(0, 8);

  return (
    <section className="trk-panel">
      <header className="trk-panel-head">
        <h3>{def.title}</h3>
        <div className="trk-panel-cols">
          {def.extraLabel ? <span className="trk-col-extra">{def.extraLabel}</span> : null}
          {def.uniqLabel ? <span className="trk-col-uniq">{def.uniqLabel}</span> : null}
          <span className="trk-col-count">{def.metric}</span>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="trk-empty">{def.empty}</p>
      ) : (
        <ul className="trk-rows">
          {shown.map((r) => {
            const clickable = Boolean(def.filter);
            const body = (
              <>
                <span className="trk-row-bar" style={{ width: `${(r.count / max) * 100}%` }} aria-hidden />
                <span className="trk-row-key">
                  {def.render ? def.render(r) : r.key}
                  {r.note ? <em className="trk-row-note">{r.note}</em> : null}
                </span>
                {def.extraLabel ? <span className="trk-col-extra">{r.extra !== undefined ? `${r.extra}${def.extraSuffix ?? ""}` : "-"}</span> : null}
                {def.uniqLabel ? <span className="trk-col-uniq">{n(r.uniq)}</span> : null}
                <span className="trk-col-count">{n(r.count)}</span>
              </>
            );
            return (
              <li key={r.key}>
                {clickable ? (
                  <button type="button" className="trk-row is-pick" onClick={() => onPick(def.filter!, r.key)} title={`Filtrer sur ${r.key}`}>
                    {body}
                  </button>
                ) : (
                  <div className="trk-row" title={r.key}>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {rows.length > 8 ? (
        <button type="button" className="trk-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Réduire" : `Voir les ${rows.length} lignes`}
        </button>
      ) : null}
    </section>
  );
}

/** One visit, page by page, with what was clicked on each. */
function Visit({ s, onPick }: { s: SessionRow; onPick: (k: keyof Filters, v: string) => void }) {
  const [open, setOpen] = useState(false);
  const clicksOn = (path: string, after: number, before: number) =>
    s.clicks.filter((c) => c.from === path && c.at >= after - 1000 && c.at <= before + 1000);

  return (
    <li className={`trk-visit${open ? " is-open" : ""}`}>
      <button type="button" className="trk-visit-head" onClick={() => setOpen((v) => !v)}>
        <span className="trk-visit-when">
          <strong>{dayOf(s.start)}</strong>
          <em>{since(s.end)}</em>
        </span>
        <span className="trk-visit-who">
          {flag(s.cc)} {s.city ?? (s.cc ? countryName(s.cc) : "-")}
          <em>
            {s.dev ?? "?"} · {s.br ?? "?"} · {s.lang.toUpperCase()}
          </em>
        </span>
        <span className="trk-visit-src">
          {s.src}
          <em>{s.med}</em>
        </span>
        <span className="trk-visit-num">
          {n(s.views)} page{s.views > 1 ? "s" : ""}
          <em>{dur(Math.round(s.durationMs / 1000))}</em>
        </span>
        <span className="trk-visit-tags">
          {s.isNew ? <i className="trk-tag is-new">nouveau</i> : <i className="trk-tag">connu</i>}
          {s.bounce ? <i className="trk-tag is-bounce">rebond</i> : null}
          {s.outbound > 0 ? <i className="trk-tag is-out">{s.outbound} sortie{s.outbound > 1 ? "s" : ""}</i> : null}
          {s.goals.length ? <i className="trk-tag is-goal">{s.goals.length} objectif{s.goals.length > 1 ? "s" : ""}</i> : null}
        </span>
        <span className="trk-visit-chev" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div className="trk-visit-body">
          <div className="trk-visit-meta">
            <button type="button" onClick={() => onPick("visitor", s.vid)}>Voir tout ce visiteur</button>
            <span>
              Système : <b>{s.os ?? "?"}</b>
            </span>
            <span>
              Écran : <b>{s.sw ? `${s.sw} px` : "?"}</b>
            </span>
            <span>
              Langue navigateur : <b>{s.bl ?? "?"}</b>
            </span>
            {s.utm?.campaign ? (
              <span>
                Campagne : <b>{s.utm.campaign}</b>
              </span>
            ) : null}
            {s.ref ? (
              <span className="trk-visit-ref">
                Référent : <b>{s.ref}</b>
              </span>
            ) : null}
          </div>

          <ol className="trk-journey">
            {s.steps.map((st, i) => {
              const next = s.steps[i + 1]?.at ?? s.end;
              const clicks = clicksOn(st.p, st.at, next);
              return (
                <li key={i}>
                  <div className="trk-journey-time">{new Date(st.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                  <div className="trk-journey-main">
                    <a href={st.p} target="_blank" rel="noopener noreferrer" className="trk-journey-path">
                      {st.p}
                    </a>
                    <div className="trk-journey-stats">
                      {st.closed ? (
                        <>
                          <span title="Temps passé sur la page">⏱ {dur(Math.round(st.dur / 1000))}</span>
                          <span title="Temps réellement à l'écran">👁 {dur(Math.round(st.eng / 1000))}</span>
                          <span title="Profondeur de défilement">↕ {st.sd}%</span>
                        </>
                      ) : (
                        <span className="trk-unknown" title="Le signal de fin n'est jamais arrivé (onglet fermé brutalement, requête bloquée)">durée inconnue</span>
                      )}
                    </div>
                    {clicks.length ? (
                      <ul className="trk-journey-clicks">
                        {clicks.map((c, j) => (
                          <li key={j} className={`trk-click is-${c.k}`}>
                            {c.k === "out" ? "↗" : c.k === "in" ? "→" : "★"}{" "}
                            {c.k === "goal" ? <b>{c.goal}</b> : <span className="trk-click-href">{c.href}</span>}
                            {c.txt ? <em>« {c.txt} »</em> : null}
                            {c.zone ? <i className="trk-tag">{c.zone}</i> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="trk-visit-end">
            {s.exitTo ? (
              <>
                Sortie du site vers <a href={s.exitTo} target="_blank" rel="noopener noreferrer">{s.exitTo}</a>
              </>
            ) : (
              <>
                Dernière page vue : <b>{s.exit}</b>, puis plus rien (onglet fermé, ou parti sans cliquer de lien).
              </>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

/* ---------------------------------------------------------------------------
   Dashboard
--------------------------------------------------------------------------- */

const PRESETS: { id: string; label: string; from: () => string; to: () => string }[] = [
  { id: "today", label: "Aujourd'hui", from: () => daysAgo(0), to: () => daysAgo(0) },
  { id: "yesterday", label: "Hier", from: () => daysAgo(1), to: () => daysAgo(1) },
  { id: "7d", label: "7 jours", from: () => daysAgo(6), to: () => daysAgo(0) },
  { id: "30d", label: "30 jours", from: () => daysAgo(29), to: () => daysAgo(0) },
  { id: "90d", label: "90 jours", from: () => daysAgo(89), to: () => daysAgo(0) },
];

export default function TrackingDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("pages");

  const [report, setReport] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(false);
  const [excluded, setExcluded] = useState(false);

  /* ---- URL round-trip: the filters are the page's address ---- */
  const hydrated = useRef(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next: Filters = {};
    for (const k of FILTER_KEYS) {
      const v = q.get(k);
      if (v) next[k] = v;
    }
    setFilters(next);
    setSearch(next.q ?? "");
    if (q.get("from")) setFrom(q.get("from")!);
    if (q.get("to")) setTo(q.get("to")!);
    try {
      // Throws outright in a locked-down profile, and losing the whole hydration effect
      // over a checkbox would leave the page with no filters and no dates.
      setExcluded(window.localStorage.getItem("rr_optout") === "1");
    } catch {
      /* storage unavailable */
    }
    hydrated.current = true;
  }, []);

  const query = useMemo(() => {
    const q = new URLSearchParams({ from, to });
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return q;
  }, [from, to, filters]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${query.toString()}`);
  }, [query]);

  /* ---- Auth ---- */
  useEffect(() => {
    fetch("/api/track/auth")
      .then((r) => r.json())
      .then((d: { configured: boolean; authed: boolean }) => {
        setConfigured(d.configured);
        setAuthed(d.authed);
      })
      .catch(() => setAuthed(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/track/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
      // Stop counting the owner the moment they prove they're the owner. Silent on
      // purpose: it is the behaviour anyone would expect, and the toggle below undoes it.
      try {
        window.localStorage.setItem("rr_optout", "1");
        setExcluded(true);
      } catch {
        /* storage unavailable, the exclusion is a nicety, not a requirement */
      }
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setLoginError(
        body.error === "rate_limited"
          ? "Trop d'essais. Attends une minute."
          : body.error === "not_configured"
            ? "TRACKING_PASSWORD n'est pas défini côté serveur."
            : "Mot de passe incorrect.",
      );
    }
  };

  const logout = async () => {
    await fetch("/api/track/auth", { method: "DELETE" });
    setAuthed(false);
    setReport(null);
  };

  /* ---- Data ---- */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/track/stats?${query.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(
          body.error === "not_configured"
            ? (body.hint as string)
            : body.error === "store_unreachable"
              ? `Le stockage ne répond pas : ${body.detail}`
              : "Lecture impossible.",
        );
        return;
      }
      setReport(body as Stats);
    } catch {
      setError("Requête impossible, vérifie la connexion.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (authed && hydrated.current) void load();
  }, [authed, load]);

  useEffect(() => {
    if (!auto || !authed) return;
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [auto, authed, load]);

  /* ---- Filter helpers ---- */
  const pick = (k: keyof Filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const drop = (k: keyof Filters) => {
    if (k === "q") setSearch("");
    setFilters((f) => {
      const next = { ...f };
      delete next[k];
      return next;
    });
  };
  const clearAll = () => {
    setFilters({});
    setSearch("");
  };

  const activePreset = PRESETS.find((p) => p.from() === from && p.to() === to)?.id;

  /* ---- Gates ---- */
  if (authed === null) return <div className="trk-gate">Chargement…</div>;

  if (!configured) {
    return (
      <div className="trk-gate">
        <h1 className="h-md">Suivi non configuré</h1>
        <p>
          Définis <code>TRACKING_PASSWORD</code> dans les variables d'environnement Vercel, puis redéploie. Sans mot de
          passe, cette page reste fermée, elle affiche le parcours individuel des visiteurs, ce n'est pas une page à
          laisser entrouverte.
        </p>
      </div>
    );
  }

  if (!authed) {
    return (
      <form className="trk-gate" onSubmit={login}>
        <h1 className="h-md">Suivi d'audience</h1>
        <p>Page privée.</p>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          autoComplete="current-password"
        />
        <button className="btn btn-primary" type="submit">
          Entrer
        </button>
        {loginError ? <p className="trk-error">{loginError}</p> : null}
      </form>
    );
  }

  const k = report?.kpis;

  return (
    <div className="trk">
      {/* ---------------- Header ---------------- */}
      <header className="trk-head">
        <div>
          <h1 className="h-md">Suivi d'audience</h1>
          <p className="trk-sub">
            {report ? (
              <>
                {n(report.totals.sessions)} visite{report.totals.sessions > 1 ? "s" : ""} sur la période
                {Object.keys(filters).length ? ` · ${n(k!.sessions)} après filtres` : ""}
                {report.live.visitors > 0 ? (
                  <>
                    {" · "}
                    <b className="trk-live">● {n(report.live.visitors)} en ligne</b>
                  </>
                ) : null}
              </>
            ) : (
              "…"
            )}
          </p>
        </div>
        <div className="trk-head-actions">
          <label className="trk-toggle">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Auto 30 s
          </label>
          <label className="trk-toggle" title="Écrit rr_optout dans le localStorage de CE navigateur.">
            <input
              type="checkbox"
              checked={excluded}
              onChange={(e) => {
                try {
                  if (e.target.checked) window.localStorage.setItem("rr_optout", "1");
                  else window.localStorage.removeItem("rr_optout");
                  setExcluded(e.target.checked);
                } catch {
                  /* ignore */
                }
              }}
            />
            M'exclure
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sortir
          </button>
        </div>
      </header>

      {report && !report.store.persistent ? (
        <p className="trk-warn">
          <b>Stockage non persistant.</b> Aucune base n'est configurée : les hits vivent dans la mémoire de la fonction
          et disparaissent à chaque redémarrage. Renseigne <code>KV_REST_API_URL</code> et{" "}
          <code>KV_REST_API_TOKEN</code> (Vercel KV / Upstash) pour conserver l'historique.
        </p>
      ) : null}
      {error ? <p className="trk-error">{error}</p> : null}

      {/* ---------------- Range + search ---------------- */}
      <div className="trk-controls">
        <div className="trk-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip${activePreset === p.id ? " on" : ""}`}
              onClick={() => {
                setFrom(p.from());
                setTo(p.to());
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="trk-dates">
          <input className="input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <span>→</span>
          <input className="input" type="date" value={to} min={from} max={daysAgo(0)} onChange={(e) => setTo(e.target.value)} />
        </div>
        <form
          className="trk-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) pick("q", search.trim());
            else drop("q");
          }}
        >
          <input
            className="input"
            type="search"
            value={search}
            placeholder="Chercher une page, un lien, une ville…"
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm" type="submit">
            Filtrer
          </button>
        </form>
      </div>

      {/* ---------------- Active filters ---------------- */}
      {Object.keys(filters).length ? (
        <div className="trk-chips">
          {Object.entries(filters).map(([key, value]) => (
            <button key={key} type="button" className="trk-chip" onClick={() => drop(key as keyof Filters)}>
              <b>{FILTER_LABELS[key] ?? key}</b> {value} <span aria-hidden>✕</span>
            </button>
          ))}
          <button type="button" className="trk-chip is-clear" onClick={clearAll}>
            Tout effacer
          </button>
        </div>
      ) : null}

      {/* ---------------- Quick segments ---------------- */}
      <div className="trk-segments">
        {[
          { k: "visitorType" as const, v: "new", label: "Nouveaux" },
          { k: "visitorType" as const, v: "returning", label: "Déjà venus" },
          { k: "quality" as const, v: "engaged", label: "Restés" },
          { k: "quality" as const, v: "bounce", label: "Partis aussitôt" },
          { k: "device" as const, v: "mobile", label: "Mobile" },
          { k: "device" as const, v: "desktop", label: "Ordinateur" },
          { k: "lang" as const, v: "fr", label: "Site FR" },
          { k: "lang" as const, v: "en", label: "Site EN" },
        ].map((s) => (
          <button
            key={s.k + s.v}
            type="button"
            className={`chip${filters[s.k] === s.v ? " on" : ""}`}
            onClick={() => (filters[s.k] === s.v ? drop(s.k) : pick(s.k, s.v))}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!report ? (
        <p className="trk-empty">Chargement des données…</p>
      ) : (
        <>
          {/* ---------------- KPIs ---------------- */}
          <div className="trk-kpis">
            <Kpi label="Visites" value={n(k!.sessions)} hint={`${n(k!.visitors)} visiteurs`} />
            <Kpi label="Pages vues" value={n(k!.views)} hint={`${k!.viewsPerSession} par visite`} />
            <Kpi label="Nouveaux visiteurs" value={n(k!.newVisitors)} hint={k!.visitors ? `${Math.round((k!.newVisitors / k!.visitors) * 100)} % du total` : undefined} />
            <Kpi label="Durée d'une visite" value={dur(k!.avgSessionSec)} hint="moyenne, début → dernier signe de vie" />
            <Kpi label="Temps lu par page" value={dur(k!.avgPageEngagedSec)} hint="onglet réellement à l'écran" />
            <Kpi label="Taux de rebond" value={`${k!.bounceRate} %`} hint="1 page, 0 clic, < 10 s" />
            <Kpi label="Défilement moyen" value={`${k!.avgScroll} %`} hint="profondeur atteinte" />
            <Kpi label="Clics sortants" value={n(k!.outbound)} hint={`${k!.outboundRate} % des visites`} />
            <Kpi label="Clics internes" value={n(k!.internal)} hint="liens suivis dans le site" />
            {k!.goals > 0 ? <Kpi label="Objectifs" value={n(k!.goals)} /> : null}
          </div>

          {/* ---------------- Time series ---------------- */}
          <section className="trk-block">
            <header className="trk-block-head">
              <h2>Trafic {report.granularity === "hour" ? "heure par heure" : "jour par jour"}</h2>
              <span className="trk-legend">
                <i className="trk-swatch is-views" /> pages vues <i className="trk-swatch is-sessions" /> visites
              </span>
            </header>
            <Bars
              data={report.series.map((p) => ({
                key: p.key,
                count: p.views,
                sub: p.sessions,
                title: `${p.key}, ${n(p.views)} pages vues, ${n(p.sessions)} visites, ${n(p.visitors)} visiteurs`,
              }))}
              labelOf={(key, i) => {
                const step = Math.ceil(report.series.length / 12);
                if (i % step !== 0) return null;
                return report.granularity === "hour" ? key.slice(11) + "h" : key.slice(8) + "/" + key.slice(5, 7);
              }}
            />
          </section>

          {/* ---------------- Rhythms ---------------- */}
          <div className="trk-duo">
            <section className="trk-block">
              <header className="trk-block-head">
                <h2>Heure de la journée</h2>
                <span className="trk-legend">UTC</span>
              </header>
              <Bars data={report.byHour.map((h) => ({ key: h.key, count: h.count, title: `${h.key}, ${n(h.count)} pages vues` }))} labelOf={(key, i) => (i % 3 === 0 ? key.slice(0, 2) : null)} />
            </section>
            <section className="trk-block">
              <header className="trk-block-head">
                <h2>Jour de la semaine</h2>
              </header>
              <Bars data={report.byWeekday.map((d) => ({ key: d.key, count: d.count, title: `${d.key}, ${n(d.count)} pages vues` }))} labelOf={(key) => key.slice(0, 3)} />
            </section>
          </div>

          {/* ---------------- Breakdowns ---------------- */}
          <div className="trk-tabs">
            {GROUPS.map((g) => (
              <button key={g.id} type="button" className={`chip${group === g.id ? " on" : ""}`} onClick={() => setGroup(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          <div className="trk-panels">
            {GROUPS.find((g) => g.id === group)!.panels.map((id) => (
              <Panel key={id} def={PANELS[id]} rows={report.panels[id] ?? []} onPick={pick} />
            ))}
          </div>

          {/* ---------------- Visits ---------------- */}
          <section className="trk-block">
            <header className="trk-block-head">
              <h2>Visites, une par une</h2>
              <span className="trk-legend">
                {n(report.sessions.length)} affichée{report.sessions.length > 1 ? "s" : ""} sur {n(k!.sessions)} · les plus récentes d'abord
              </span>
            </header>
            {report.sessions.length === 0 ? (
              <p className="trk-empty">Aucune visite ne correspond.</p>
            ) : (
              <ul className="trk-visits">
                {report.sessions.map((s) => (
                  <Visit key={s.id} s={s} onPick={pick} />
                ))}
              </ul>
            )}
          </section>

          <footer className="trk-foot">
            {n(report.hits)} évènements lus · stockage {report.store.name} · conservation {report.store.retentionDays} jours ·
            journées et heures en UTC · aucun cookie, aucune adresse IP conservée.
          </footer>
        </>
      )}
    </div>
  );
}
