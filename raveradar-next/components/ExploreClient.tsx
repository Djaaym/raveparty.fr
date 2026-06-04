"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang, RaveEvent } from "@/lib/types";
import { EVENTS, COUNTRIES, ALL_GENRES, TYPES, countryLabel, cardBg } from "@/lib/data";
import { fmtDate, priceLabel } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import EventCard from "./EventCard";

function Row({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const router = useRouter();
  const href = `${langPrefix(lang)}/event?id=${e.id}`;
  return (
    <article className="row-card" onClick={() => router.push(href)}>
      <div className="thumb" style={{ backgroundImage: cardBg(e) }} />
      <div>
        <div className="card-date">
          {fmtDate(e.date, lang)} · {e.time}
        </div>
        <h3>{e.title}</h3>
        <div className="card-loc">
          📍 {e.venue} — {e.city}, {countryLabel(e.country, lang)}
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
    </article>
  );
}

export default function ExploreClient({
  lang,
  initialGenre = "",
  initialCountry = "",
  initialQ = "",
  initialMonth = "",
}: {
  lang: Lang;
  initialGenre?: string;
  initialCountry?: string;
  initialQ?: string;
  initialMonth?: string;
}) {
  const t = getDict(lang);
  const [q, setQ] = useState(initialQ);
  const [country, setCountry] = useState(initialCountry);
  const [month] = useState(initialMonth);
  const [genres, setGenres] = useState<Set<string>>(new Set(initialGenre ? [initialGenre] : []));
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState(300);
  const [sort, setSort] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };

  const list = useMemo(() => {
    let r = EVENTS.filter((e) => {
      if (country && e.country !== country) return false;
      if (month && !e.date.startsWith(month)) return false;
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
  }, [q, country, month, genres, types, maxPrice, sort]);

  const clear = () => {
    setQ("");
    setCountry("");
    setGenres(new Set());
    setTypes(new Set());
    setMaxPrice(300);
  };

  return (
    <div className="explore-layout" style={{ marginTop: 40 }}>
      <aside className="filters">
        <div className="filter-group">
          <h4>{t("explore.search")}</h4>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("explore.search.ph")} />
        </div>
        <div className="filter-group">
          <h4>{t("explore.country")}</h4>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t("explore.country.all")}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {countryLabel(c, lang)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <h4>{t("explore.genre")}</h4>
          {ALL_GENRES.map((g) => {
            const n = EVENTS.filter((e) => e.genres.includes(g)).length;
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
          {TYPES.map((ty) => {
            const n = EVENTS.filter((e) => e.type === ty).length;
            return (
              <label className="filter-opt" key={ty}>
                <input type="checkbox" checked={types.has(ty)} onChange={() => toggle(types, setTypes, ty)} /> {ty}
                <span className="count">{n}</span>
              </label>
            );
          })}
        </div>
        <div className="filter-group">
          <h4>
            {t("explore.maxprice")} · {maxPrice === 300 ? "€300+" : "€" + maxPrice}
          </h4>
          <input
            className="range"
            type="range"
            min={0}
            max={300}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
          />
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
          <select className="input" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
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
            {list.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="grid">
            {list.map((e) => (
              <Row key={e.id} e={e} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
