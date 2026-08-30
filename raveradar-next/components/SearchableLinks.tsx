"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface FilterItem {
  /** Appended to `hrefBase` to build the link, and the React key. */
  slug: string;
  /** The bare name, what the box matches on and what the row displays. */
  term: string;
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
 * The places directory was a wall of 90 pills a reader had to scan by eye. The
 * filter is client-side on purpose: **every link stays in the server-rendered
 * HTML** (the input only hides rows), so the internal mesh a crawler follows is
 * exactly what it was before.
 *
 * Items carry a slug and a name, nothing else: the href and the pill decoration
 * are rebuilt here from `hrefBase`/`labelPrefix` rather than shipped per row.
 *
 * The artists hub used to share this component through a `variant="tile"` branch;
 * it now has its own, `ArtistDirectory`, which adds A→Z sections and portraits,
 * so what is left here is the pill list, and only that.
 */
export default function SearchableLinks({
  groups,
  hrefBase,
  labelPrefix = "",
  placeholder,
  emptyLabel,
  countLabel,
  clearLabel,
}: {
  groups: FilterGroup[];
  /** Prefixed to every slug: `/rave-party/`, `/en/artistes/`… */
  hrefBase: string;
  /** Prepended to the displayed name only, never to what the box matches. */
  labelPrefix?: string;
  placeholder: string;
  /** "Aucun résultat pour « {q} »." */
  emptyLabel: string;
  /** "{n} sur {total}", only rendered while a query is active. */
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
              <div className="linkfarm">
                {g.items.map((i) => (
                  <Link key={i.slug} href={`${hrefBase}${i.slug}`}>
                    {labelPrefix}
                    {i.term}
                  </Link>
                ))}
              </div>
            </div>
          ),
        )
      )}
    </div>
  );
}
