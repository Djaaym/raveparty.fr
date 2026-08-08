"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface FilterItem {
  /** Appended to `hrefBase` to build the link, and the React key. */
  slug: string;
  /** The bare name — what the box matches on and what the row displays. */
  term: string;
  /** Second line, tiles only ("3 événements"). */
  hint?: string;
}

export interface FilterGroup {
  title: string;
  items: FilterItem[];
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * A search box over a list of internal links.
 *
 * Both directories it serves — 90 places, 1 185 artists — were walls of pills a
 * reader had to scan by eye; the artists hub even opened with a "headliners"
 * block that was just the same names a second time. The filter is client-side on
 * purpose: **every link stays in the server-rendered HTML** (the input only hides
 * rows), so the internal mesh a crawler follows is exactly what it was before.
 *
 * Items carry a slug and a name, nothing else: the href and any pill decoration
 * are rebuilt here from `hrefBase`/`labelPrefix`. On 1 185 artists, shipping a
 * per-item href and label would have doubled the flight payload for no gain.
 */
export default function SearchableLinks({
  groups,
  hrefBase,
  labelPrefix = "",
  variant = "pill",
  placeholder,
  emptyLabel,
  countLabel,
  clearLabel,
}: {
  groups: FilterGroup[];
  /** Prefixed to every slug: `/rave-party/`, `/en/artistes/`… */
  hrefBase: string;
  /** Prepended to the displayed name only — never to what the box matches. */
  labelPrefix?: string;
  variant?: "pill" | "tile";
  placeholder: string;
  /** "Aucun résultat pour « {q} »." */
  emptyLabel: string;
  /** "{n} sur {total}" — only rendered while a query is active. */
  countLabel: string;
  clearLabel: string;
}) {
  const [q, setQ] = useState("");
  const needle = norm(q.trim());

  const shown = useMemo(
    () =>
      needle
        ? groups.map((g) => ({ ...g, items: g.items.filter((i) => norm(i.term).includes(needle)) }))
        : groups,
    [groups, needle],
  );

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const count = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="filterbox">
      <div className="filterbox-bar">
        <span className="filterbox-icon" aria-hidden="true">
          🔎
        </span>
        <input
          className="input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {q !== "" && (
          <button type="button" className="filterbox-clear" onClick={() => setQ("")}>
            {clearLabel}
          </button>
        )}
      </div>
      {needle !== "" && (
        <p className="result-count" style={{ marginTop: 10 }}>
          {countLabel.replace("{n}", String(count)).replace("{total}", String(total))}
        </p>
      )}

      {count === 0 ? (
        <p className="lead" style={{ marginTop: 18, fontSize: ".95rem" }}>
          {emptyLabel.replace("{q}", q.trim())}
        </p>
      ) : (
        shown.map((g) =>
          g.items.length === 0 ? null : (
            <div key={g.title}>
              <h2 className="h-md" style={{ margin: "34px 0 16px" }}>
                {g.title}
              </h2>
              {variant === "tile" ? (
                <div className="artist-grid">
                  {g.items.map((i) => (
                    <Link key={i.slug} href={`${hrefBase}${i.slug}`} className="artist-tile">
                      <div className="av">{i.term.trim()[0]}</div>
                      <div>
                        <b>{i.term}</b>
                        {i.hint && <span>{i.hint}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="linkfarm">
                  {g.items.map((i) => (
                    <Link key={i.slug} href={`${hrefBase}${i.slug}`}>
                      {labelPrefix}
                      {i.term}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ),
        )
      )}
    </div>
  );
}
