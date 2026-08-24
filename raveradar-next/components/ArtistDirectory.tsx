"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface DirectoryArtist {
  slug: string;
  name: string;
  /** Dates in the catalogue. A number, not a formatted string — see the note below. */
  n: number;
  /** Portrait filename under /artists/, when one exists under a licence that allows it. */
  photo?: string;
  /** Genres, as indices into the `genres` prop — see the note on the component. */
  g?: number[];
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Section a name files under. Anything that is not a latin letter goes to "#". */
const initialOf = (name: string): string => {
  const c = norm(name).trim()[0] ?? "#";
  return c >= "a" && c <= "z" ? c.toUpperCase() : "#";
};

const anchorOf = (letter: string) => `az-${letter === "#" ? "num" : letter.toLowerCase()}`;

/**
 * The A→Z artist directory.
 *
 * It replaces a single flat wall of 1 860 tiles that a reader could only scan by
 * eye. Three things changed and each earns its place:
 *
 * - **Sections with a big letter.** The list was already alphabetical, but nothing
 *   said so on screen: without a break between "Amelie Lens" and "Boys Noize" the
 *   order is invisible, and a reader scrolling for "K" has no idea how far to go.
 * - **The filter sits at the top, and it sticks.** It used to live below the
 *   "next dates" grid, four screens down — a search box you have to find by
 *   scrolling is a search box nobody uses. Sticky, it stays reachable from the
 *   middle of the Z's.
 * - **The portrait when we have one.** 59 artists carry a Wikimedia photo; the
 *   rest keep the initial-in-a-disc. The credit that legally travels with a CC BY
 *   photo is rendered by the page, under the list — see ArtistsHub.
 *
 * **Every link still ships in the server-rendered HTML.** The box only hides rows,
 * so the internal mesh a crawler follows is exactly what it was before — the same
 * reason the old component gave, and it still holds. Items carry a slug, a name
 * and a *count*: the href and the "3 dates" label are rebuilt here. On 1 860
 * artists, shipping a formatted label per row is pure duplication of one template.
 *
 * Same reasoning for the genres each row now shows: they arrive as **indices** into
 * a `genres` array sent once, not as strings repeated row after row. "Hard Techno"
 * spelled out on every tile that plays it would be a few kilobytes of the same two
 * words. And since the labels are here anyway, the filter matches them too — typing
 * "hardstyle" narrows the directory to the artists who play it, which is the second
 * thing anyone wants from a list of 1 860 names after looking for one they know.
 */
export default function ArtistDirectory({
  items,
  hrefBase,
  placeholder,
  countLabel,
  emptyLabel,
  clearLabel,
  dateLabel,
  datesLabel,
  artistLabel,
  artistsLabel,
  jumpLabel,
  genres,
}: {
  items: DirectoryArtist[];
  /** Prefixed to every slug: `/artistes/`, `/en/artistes/`. */
  hrefBase: string;
  placeholder: string;
  /** "{n} sur {total}" — only while a query is active. */
  countLabel: string;
  emptyLabel: string;
  clearLabel: string;
  /** Singular / plural for the per-artist date count, on each tile. */
  dateLabel: string;
  datesLabel: string;
  /** Singular / plural for the per-section head count — artists, not dates. */
  artistLabel: string;
  artistsLabel: string;
  jumpLabel: string;
  /** Genre labels, indexed by `DirectoryArtist.g`. */
  genres: string[];
}) {
  const [q, setQ] = useState("");
  const needle = norm(q.trim());

  /* Normalising 1 860 names on every keystroke is wasteful and the list never
     changes: fold the sections once, then filter over the pre-normalised copy. */
  const sections = useMemo(() => {
    const m = new Map<string, (DirectoryArtist & { _n: string; _g: string })[]>();
    for (const a of items) {
      const l = initialOf(a.name);
      if (!m.has(l)) m.set(l, []);
      const labels = (a.g ?? []).map((i) => genres[i]).filter(Boolean);
      m.get(l)!.push({ ...a, _n: norm(a.name), _g: labels.join(" · ") });
    }
    return [...m.entries()]
      .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
      .map(([letter, rows]) => ({ letter, rows }));
  }, [items, genres]);

  const shown = useMemo(
    () =>
      needle
        ? sections
            .map((s) => ({ ...s, rows: s.rows.filter((a) => a._n.includes(needle) || norm(a._g).includes(needle)) }))
            .filter((s) => s.rows.length > 0)
        : sections,
    [sections, needle],
  );

  const total = items.length;
  const count = shown.reduce((n, s) => n + s.rows.length, 0);
  const live = new Set(shown.map((s) => s.letter));

  return (
    <div className="az">
      <div className="az-bar">
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
        <nav className="az-jump" aria-label={jumpLabel}>
          {sections.map((s) => (
            <a
              key={s.letter}
              href={`#${anchorOf(s.letter)}`}
              className={live.has(s.letter) ? undefined : "is-off"}
              aria-disabled={live.has(s.letter) ? undefined : true}
            >
              {s.letter}
            </a>
          ))}
        </nav>
      </div>

      <p className="result-count az-count">
        {needle === ""
          ? countLabel.replace("{n}", String(total)).replace("{total}", String(total))
          : countLabel.replace("{n}", String(count)).replace("{total}", String(total))}
      </p>

      {count === 0 ? (
        <p className="lead" style={{ marginTop: 18, fontSize: ".95rem" }}>
          {emptyLabel.replace("{q}", q.trim())}
        </p>
      ) : (
        shown.map((s) => (
          <section key={s.letter} id={anchorOf(s.letter)} className="az-section">
            <h2 className="az-head">
              <span className="az-letter" aria-hidden="true">
                {s.letter}
              </span>
              <span className="az-meta">
                {s.rows.length} {s.rows.length > 1 ? artistsLabel : artistLabel}
              </span>
            </h2>
            <div className="artist-grid">
              {s.rows.map((a) => (
                <Link key={a.slug} href={`${hrefBase}${a.slug}`} className="artist-tile">
                  {a.photo ? (
                    /* alt="" on purpose: the tile spells the name out right next to
                       the portrait, so a described avatar would make a screen reader
                       announce it twice. The indexable copy of this same file is the
                       one on the artist's own page, with a real alt and its credit. */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      className="av av-photo"
                      src={`/artists/${a.photo}`}
                      alt=""
                      width={42}
                      height={42}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="av" aria-hidden="true">
                      {a.name.trim()[0]}
                    </span>
                  )}
                  <span className="artist-tile-txt">
                    <b>{a.name}</b>
                    <span>
                      {a.n} {a.n > 1 ? datesLabel : dateLabel}
                      {a._g && <em>{a._g}</em>}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
