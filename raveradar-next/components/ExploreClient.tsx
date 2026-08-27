"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardEvent, Lang, RaveEvent } from "@/lib/types";
import { countryLabel, eventVenueL, isPast, lastDay } from "@/lib/display";
import { fmtDate, imageAlt, priceLabel } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import EventCard from "./EventCard";

const PAGE = 24;

function Row({ e, lang }: { e: CardEvent; lang: Lang }) {
  const href = `${langPrefix(lang)}${e.path}`;
  return (
    // A real anchor, not a router.push on a div: the list view has to survive a keyboard,
    // a middle click and a crawler just like the card grid does.
    <Link className="row-card" href={href}>
      {e.thumb ? (
        <img className="thumb" src={e.thumb} alt={imageAlt(e, lang, e.isPhoto)} width={560} height={700} loading="lazy" decoding="async" />
      ) : (
        <div className="thumb" style={{ backgroundImage: e.bg }} />
      )}
      <div>
        <div className="card-date">
          {fmtDate(e.date, lang)} · {e.time}
        </div>
        <h3>{e.title}</h3>
        <div className="card-loc">
          📍 {eventVenueL(e, lang)} — {e.city}, {countryLabel(e.country, lang)}
        </div>
        <div className="card-meta">
          {e.genres.map((g) => (
            <span className="gpill" key={g}>
              {g}
            </span>
          ))}
        </div>
      </div>
      <div className="row-right">
        <div className="card-price" style={{ position: "static" }}>
          {priceLabel(e, lang)}
        </div>
      </div>
    </Link>
  );
}

/**
 * Le catalogue et les listes de facettes arrivent en props.
 *
 * Ce composant importait `EVENTS` : le bundler embarquait alors tout `lib/data.ts` dans
 * le JavaScript de /explore — 218 Ko compressés, dont les descriptions françaises et
 * anglaises des 870 fiches, qu'aucun filtre ni aucune carte ne lit. `cardEvents(EVENTS,
 * true)` rend la même liste sans les descriptions ; le `true` garde `lineup`, que la
 * recherche plein texte parcourt.
 */
export default function ExploreClient({
  lang,
  today,
  catalogue,
  countries,
  allGenres,
  allTypes,
  initialGenre = "",
  initialCountry = "",
  initialQ = "",
  initialMonth = "",
}: {
  lang: Lang;
  /** Reference date (yyyy-mm-dd) computed on the server so SSR and hydration agree. */
  today: string;
  catalogue: CardEvent[];
  countries: { v: string; l: string }[];
  allGenres: string[];
  allTypes: string[];
  initialGenre?: string;
  initialCountry?: string;
  initialQ?: string;
  initialMonth?: string;
}) {
  const t = getDict(lang);
  const [q, setQ] = useState(initialQ);
  const [country, setCountry] = useState(initialCountry);
  const [months, setMonths] = useState<Set<string>>(new Set(initialMonth ? [initialMonth] : []));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [genres, setGenres] = useState<Set<string>>(new Set(initialGenre ? [initialGenre] : []));
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState(300);
  const [sort, setSort] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showPast, setShowPast] = useState(false);
  // Render in pages: the full catalogue is several hundred cards, each with a poster.
  const [shown, setShown] = useState(PAGE);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };

  /* Months and an explicit range are two ways to say the same thing, so they're
     mutually exclusive — combining them mostly produces empty result sets. */
  const pickMonth = (m: string) => {
    setFrom("");
    setTo("");
    toggle(months, setMonths, m);
  };
  const pickFrom = (v: string) => {
    setMonths(new Set());
    setFrom(v);
  };
  const pickTo = (v: string) => {
    setMonths(new Set());
    setTo(v);
  };

  /** Picking a date is an explicit request — don't silently hide past dates inside it. */
  const dated = months.size > 0 || Boolean(from) || Boolean(to);

  /** Everything currently in scope date-wise — drives both the results and the facet counts. */
  const pool = useMemo(
    // fresh-ok: /explore is a search, not a highlight — the archive only appears when the
    // reader ticks "éditions passées" or names a month, and both are explicit requests.
    () => (showPast || dated ? catalogue : catalogue.filter((e) => !isPast(e, today))),
    [catalogue, showPast, dated, today]
  );

  /** Every month an event touches, so a 31 Jul → 2 Aug festival answers to both. */
  const monthsOf = (e: RaveEvent): string[] => {
    const out: string[] = [];
    const end = lastDay(e);
    for (let y = +e.date.slice(0, 4), m = +e.date.slice(5, 7); ; m++) {
      if (m > 12) {
        m = 1;
        y++;
      }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push(key);
      if (key >= end.slice(0, 7)) break;
    }
    return out;
  };

  /** The months the catalogue actually has something in, with counts. */
  const monthOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of catalogue) for (const m of monthsOf(e)) counts.set(m, (counts.get(m) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([m]) => showPast || dated || m >= today.slice(0, 7))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [catalogue, showPast, dated, today]);

  const monthLabel = (m: string) =>
    new Date(m + "-01T00:00:00").toLocaleDateString(t("locale"), { month: "short", year: "numeric" });

  const list = useMemo(() => {
    let r = pool.filter((e) => {
      if (country && e.country !== country) return false;
      if (months.size && !monthsOf(e).some((m) => months.has(m))) return false;
      // Interval overlap, not just the start date: a multi-day festival counts as
      // being "in" the range if any of its days fall inside it.
      if (from && lastDay(e) < from) return false;
      if (to && e.date > to) return false;
      if (maxPrice < 300 && e.price > maxPrice) return false;
      if (types.size && !types.has(e.type)) return false;
      if (genres.size && !e.genres.some((g) => genres.has(g))) return false;
      if (q) {
        const hay = (e.title + e.city + e.country + e.venue + e.genres.join(" ") + e.lineup.join(" ")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "date") r = [...r].sort((a, b) => a.date.localeCompare(b.date));
    if (sort === "price") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-d") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "az") r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [pool, q, country, months, from, to, genres, types, maxPrice, sort]);

  // Collapse back to the first page whenever the result set changes underneath us.
  useEffect(() => setShown(PAGE), [list]);
  const visible = list.slice(0, shown);

  const clear = () => {
    setShown(PAGE);
    setQ("");
    setCountry("");
    setMonths(new Set());
    setFrom("");
    setTo("");
    setGenres(new Set());
    setTypes(new Set());
    setMaxPrice(300);
    setShowPast(false);
  };

  return (
    <div className="explore-layout" style={{ marginTop: 40 }}>
      <aside className="filters">
        <div className="filter-group">
          <h4 id="f-search">{t("explore.search")}</h4>
          {/* Le <h4> titre le groupe de filtres, il n'étiquette pas le contrôle :
              `aria-labelledby` fait les deux d'une pierre, sans doubler le texte. */}
          <input
            className="input"
            aria-labelledby="f-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("explore.search.ph")}
          />
        </div>
        <div className="filter-group">
          <h4 id="f-country">{t("explore.country")}</h4>
          <select className="input" aria-labelledby="f-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t("explore.country.all")}</option>
            {countries.map((c) => (
              <option key={c.v} value={c.v}>
                {c.l}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <h4>{t("explore.genre")}</h4>
          {allGenres.map((g) => {
            const n = pool.filter((e) => e.genres.includes(g)).length;
            return (
              <label className="filter-opt" key={g}>
                <input type="checkbox" checked={genres.has(g)} onChange={() => toggle(genres, setGenres, g)} /> {g}
                <span className="count">{n}</span>
              </label>
            );
          })}
        </div>
        <div className="filter-group">
          <h4>{t("explore.type")}</h4>
          {allTypes.map((ty) => {
            const n = pool.filter((e) => e.type === ty).length;
            return (
              <label className="filter-opt" key={ty}>
                <input type="checkbox" checked={types.has(ty)} onChange={() => toggle(types, setTypes, ty)} /> {ty}
                <span className="count">{n}</span>
              </label>
            );
          })}
        </div>
        <div className="filter-group">
          <h4 id="f-price">
            {t("explore.maxprice")} · {maxPrice === 300 ? "€300+" : "€" + maxPrice}
          </h4>
          <input
            className="range"
            aria-labelledby="f-price"
            type="range"
            min={0}
            max={300}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
          />
        </div>
        <div className="filter-group">
          <h4>{t("explore.when")}</h4>
          <div className="monthpicker">
            {monthOptions.map(([m, n]) => (
              <button
                key={m}
                type="button"
                className={months.has(m) ? "on" : ""}
                aria-pressed={months.has(m)}
                onClick={() => pickMonth(m)}
              >
                {monthLabel(m)} <span className="count">{n}</span>
              </button>
            ))}
          </div>

          <div className="daterange">
            <span className="or">{t("explore.orrange")}</span>
            <label>
              {t("explore.from")}
              <input className="input" type="date" value={from} max={to || undefined} onChange={(e) => pickFrom(e.target.value)} />
            </label>
            <label>
              {t("explore.to")}
              <input className="input" type="date" value={to} min={from || undefined} onChange={(e) => pickTo(e.target.value)} />
            </label>
          </div>

          <label className="filter-opt" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={showPast} onChange={() => setShowPast((v) => !v)} /> {t("explore.showpast")}
            <span className="count">{catalogue.length - catalogue.filter((e) => !isPast(e, today)).length}</span>
          </label>
        </div>
        <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} onClick={clear}>
          {t("explore.clear")}
        </button>
      </aside>

      <div>
        <div className="explore-toolbar">
          <span className="result-count">
            <b>{list.length}</b> {t("explore.found")}
          </span>
          <select
            className="input"
            style={{ width: "auto" }}
            /* Pas de <label> visible : la liste est déjà comprise par sa position dans
               la barre d'outils. Sans nom accessible, elle est annoncée « liste ». */
            aria-label={t("explore.sortlabel")}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">{t("explore.sort.date")}</option>
            <option value="price">{t("explore.sort.price")}</option>
            <option value="price-d">{t("explore.sort.priced")}</option>
            <option value="az">{t("explore.sort.az")}</option>
          </select>
          <div className="seg">
            <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>
              {t("explore.view.grid")}
            </button>
            <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
              {t("explore.view.list")}
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p style={{ color: "var(--grey)", padding: "40px 0" }}>{t("explore.empty")}</p>
        ) : view === "grid" ? (
          <div className="grid grid-3">
            {visible.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} today={today} />
            ))}
          </div>
        ) : (
          <div className="grid">
            {visible.map((e) => (
              <Row key={e.id} e={e} lang={lang} />
            ))}
          </div>
        )}

        {shown < list.length && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE)}>
              {t("explore.more")} ({list.length - shown})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
