"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { countryLabel } from "@/lib/data";
import { getDict, langPrefix } from "@/lib/i18n";

/** Serialisable shape of an artist — the full ARTISTS objects carry event ids we don't
 *  need client-side, and the directory is 1 000+ entries. */
export interface ArtistRow {
  slug: string;
  name: string;
  n: number; // number of dates in the catalogue
  up: boolean; // has at least one upcoming date
  genres: string[];
  countries: string[];
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** First letter used for the A-Z jump — accents folded, anything else lands in "#". */
const initial = (name: string): string => {
  const c = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .charAt(0);
  return c >= "A" && c <= "Z" ? c : "#";
};

export default function ArtistsBrowser({
  lang,
  artists,
  genres,
  countries,
}: {
  lang: Lang;
  artists: ArtistRow[];
  genres: string[];
  countries: string[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("");
  const [letter, setLetter] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [sort, setSort] = useState<"az" | "dates">("az");

  const active = q !== "" || genre !== "" || country !== "" || letter !== "" || upcomingOnly;

  const shown = useMemo(() => {
    const needle = q
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
    const out = artists.filter((a) => {
      if (upcomingOnly && !a.up) return false;
      if (genre && !a.genres.includes(genre)) return false;
      if (country && !a.countries.includes(country)) return false;
      if (letter && initial(a.name) !== letter) return false;
      if (
        needle &&
        !a.name
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .includes(needle)
      )
        return false;
      return true;
    });
    // Only re-sort when asked: the server hands the list alphabetically already.
    return sort === "dates" ? [...out].sort((x, y) => y.n - x.n || x.name.localeCompare(y.name)) : out;
  }, [artists, q, genre, country, letter, upcomingOnly, sort]);

  const reset = () => {
    setQ("");
    setGenre("");
    setCountry("");
    setLetter("");
    setUpcomingOnly(false);
    setSort("az");
  };

  return (
    <>
      <div className="artist-filters">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("artists.filter.ph")}
          aria-label={t("explore.search")}
        />
        <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={t("explore.genre")}>
          <option value="">{t("artists.filter.allgenres")}</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label={t("explore.country")}
        >
          <option value="">{t("explore.country.all")}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {countryLabel(c, lang)}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as "az" | "dates")}
          aria-label={t("artists.filter.sort")}
        >
          <option value="az">{t("explore.sort.az")}</option>
          <option value="dates">{t("artists.filter.sort.dates")}</option>
        </select>
        <label className="filter-opt artist-filters-toggle">
          <input type="checkbox" checked={upcomingOnly} onChange={() => setUpcomingOnly((v) => !v)} />{" "}
          {t("artists.filter.upcoming")}
        </label>
      </div>

      <div className="artist-letters">
        <button className={letter === "" ? "on" : ""} onClick={() => setLetter("")}>
          {t("artists.filter.allletters")}
        </button>
        {LETTERS.map((l) => (
          <button key={l} className={letter === l ? "on" : ""} onClick={() => setLetter(letter === l ? "" : l)}>
            {l}
          </button>
        ))}
      </div>

      <p className="artist-count">
        {shown.length} {t(shown.length > 1 ? "artists.filter.found" : "artists.filter.found.one")}
        {active && (
          <button className="artist-reset" onClick={reset}>
            {t("explore.clear")}
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <p className="lead">{t("artists.filter.none")}</p>
      ) : (
        <div className="artist-grid">
          {shown.map((a) => (
            <Link key={a.slug} href={`${p}/artistes/${a.slug}`} className="artist-tile">
              <div className="av">{a.name.trim()[0]}</div>
              <div>
                <b>{a.name}</b>
                <span>
                  {a.n} {t(a.n > 1 ? "dyn.events" : "dyn.event")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
