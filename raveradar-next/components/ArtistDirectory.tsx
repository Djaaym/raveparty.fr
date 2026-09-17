"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

export interface DirectoryArtist {
  slug: string;
  name: string;
  /** Dates in the catalogue. A number, not a formatted string, see the note below. */
  n: number;
  /** Portrait filename under /artists/, when one exists under a licence that allows it. */
  photo?: string;
  /** Genres, as indices into the `genres` prop, see the note on the component. */
  g?: number[];
  /** Sous-genres, en indices dans la prop `subs`. Même raison que `g`. */
  sg?: number[];
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
 * - **Sections with a big letter, fermées par défaut.** The list was already
 *   alphabetical, but nothing said so on screen: without a break between "Amelie
 *   Lens" and "Boys Noize" the order is invisible, and a reader scrolling for "K"
 *   has no idea how far to go. Dépliées, en revanche, les 27 sections empilent
 *   6 750 vignettes et repoussent tout le bas de page hors de portée : chacune est
 *   donc un `<details>` replié, qu'on ouvre à la demande. **C'est un `<details>` et
 *   pas un rendu conditionnel** : le contenu reste dans le HTML rendu au serveur,
 *   donc le maillage qu'un crawler suit ne change pas d'un lien. Une recherche
 *   active rouvre d'office les sections qu'elle garde, sinon le filtre ne montrerait
 *   que des en-têtes.
 * - **The filter sits at the top, and it sticks.** It used to live below the
 *   "next dates" grid, four screens down, a search box you have to find by
 *   scrolling is a search box nobody uses. Sticky, it stays reachable from the
 *   middle of the Z's.
 * - **The portrait when we have one.** 59 artists carry a Wikimedia photo; the
 *   rest keep the initial-in-a-disc. The credit that legally travels with a CC BY
 *   photo is rendered by the page, under the list, see ArtistsHub.
 *
 * **Every link still ships in the server-rendered HTML.** The box only hides rows,
 * so the internal mesh a crawler follows is exactly what it was before, the same
 * reason the old component gave, and it still holds. Items carry a slug, a name
 * and a *count*: the href and the "3 dates" label are rebuilt here. On 1 860
 * artists, shipping a formatted label per row is pure duplication of one template.
 *
 * Same reasoning for the genres each row now shows: they arrive as **indices** into
 * a `genres` array sent once, not as strings repeated row after row. "Hard Techno"
 * spelled out on every tile that plays it would be a few kilobytes of the same two
 * words. And since the labels are here anyway, the filter matches them too, typing
 * "hardstyle" narrows the directory to the artists who play it, which is the second
 * thing anyone wants from a list of 1 860 names after looking for one they know.
 *
 * Les sous-genres suivent la même mécanique et pour la même raison : envoyés en indices
 * dans un second tableau, affichés à la suite des genres, cherchés par le même filtre.
 * C'est ce qui permet de taper « neurofunk », « tech house » ou « rawstyle », des mots
 * que les onze cases du site ne contiennent pas, et qui sont pourtant ce qu'on cherche
 * quand on connaît un peu le style.
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
  openLabel,
  closeLabel,
  genres,
  subs,
}: {
  items: DirectoryArtist[];
  /** Prefixed to every slug: `/artistes/`, `/en/artistes/`. */
  hrefBase: string;
  placeholder: string;
  /** "{n} sur {total}", only while a query is active. */
  countLabel: string;
  emptyLabel: string;
  clearLabel: string;
  /** Singular / plural for the per-artist date count, on each tile. */
  dateLabel: string;
  datesLabel: string;
  /** Singular / plural for the per-section head count, artists, not dates. */
  artistLabel: string;
  artistsLabel: string;
  jumpLabel: string;
  /** "Tout ouvrir" / "Tout fermer", the two states of the same button. */
  openLabel: string;
  closeLabel: string;
  /** Genre labels, indexed by `DirectoryArtist.g`. */
  genres: string[];
  /** Sub-genre labels, indexed by `DirectoryArtist.sg`. */
  subs: string[];
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
      const labels = [
        ...(a.g ?? []).map((i) => genres[i]),
        ...(a.sg ?? []).map((i) => subs[i]),
      ].filter(Boolean);
      m.get(l)!.push({ ...a, _n: norm(a.name), _g: labels.join(" · ") });
    }
    return [...m.entries()]
      .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
      .map(([letter, rows]) => ({ letter, rows }));
  }, [items, genres, subs]);

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

  /* Les lettres ouvertes à la main. Une recherche active passe devant : filtrer sur
     des sections fermées ne rendrait qu'une colonne d'en-têtes, c'est-à-dire un
     filtre qui n'affiche rien de ce qu'il a trouvé. */
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const isOpen = (letter: string) => needle !== "" || open.has(letter);
  const toggle = useCallback((letter: string, next?: boolean) => {
    setOpen((prev) => {
      const s2 = new Set(prev);
      if (next ?? !s2.has(letter)) s2.add(letter);
      else s2.delete(letter);
      return s2;
    });
  }, []);
  const allOpen = shown.length > 0 && shown.every((s) => open.has(s.letter));

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
              /* Un index qui saute à une section fermée n'amène le lecteur que sur
                 son en-tête : il l'ouvre donc au passage, c'est ce qu'on demande en
                 cliquant sur une lettre. */
              onClick={() => toggle(s.letter, true)}
            >
              {s.letter}
            </a>
          ))}
        </nav>
        {/* Pendant une recherche, tout est déjà ouvert : le bouton n'aurait rien à
            dire, et « Tout fermer » masquerait ce que le filtre vient de trouver. */}
        {needle === "" && (
          <div className="az-tools">
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map((s) => s.letter)))}
            >
              {allOpen ? closeLabel : openLabel}
            </button>
          </div>
        )}
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
          <details
            key={s.letter}
            id={anchorOf(s.letter)}
            className="az-section"
            open={isOpen(s.letter)}
            /* `onToggle` plutôt que `onClick` sur le résumé : c'est le seul événement
               que le clavier (Entrée, Espace) déclenche aussi. Sur une section forcée
               ouverte par le filtre, on n'enregistre rien, elle se refermera d'elle-même
               quand la recherche sera vidée. */
            onToggle={(e) => {
              if (needle === "") toggle(s.letter, (e.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className="az-head">
              {/* Le titre reste un titre : `<summary>` accepte un élément de
                  contenu d'en-tête, et la hiérarchie h1 → h2 → h3 de la page ne
                  doit pas se perdre parce que la section se replie. */}
              <h3 className="az-letter">{s.letter}</h3>
              <span className="az-meta">
                {s.rows.length} {s.rows.length > 1 ? artistsLabel : artistLabel}
              </span>
              <span className="az-caret" aria-hidden="true">
                ▶
              </span>
            </summary>
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
          </details>
        ))
      )}
    </div>
  );
}
