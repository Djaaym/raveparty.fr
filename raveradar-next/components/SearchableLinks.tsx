"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

export interface FilterItem {
  /** Appended to `hrefBase` to build the link, and the React key. */
  slug: string;
  /** The bare name, what the box matches on and what the row displays. */
  term: string;
  /** Combien de dates à venir. Un nombre, pas un libellé : « 12 événements » répété
   *  sur 138 lignes est le même kilo-octet envoyé cent fois, la décoration se
   *  reconstruit ici. Absent ou zéro, la ligne passe en `soonLabel`. */
  n?: number;
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
 *
 * **Les groupes sont repliés par défaut**, même raison et même mécanique que les
 * sections A→Z de `ArtistDirectory` : 162 pilules déroulées sous le champ de
 * recherche repoussent tout le reste de la page hors de portée. C'est un
 * `<details>` et pas un rendu conditionnel, donc les liens restent dans le HTML
 * rendu au serveur et le maillage ne bouge pas. Une recherche active rouvre les
 * groupes qu'elle garde, sinon le filtre n'afficherait que des en-têtes.
 */
export default function SearchableLinks({
  groups,
  hrefBase,
  labelPrefix = "",
  placeholder,
  emptyLabel,
  countLabel,
  clearLabel,
  soonLabel,
  groupLabel,
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
  /** Ce qu'affiche une ligne sans date à venir (« bientôt »). Optionnel, et c'est
   *  ce qui rend la mention opt-in : un appelant qui n'envoie aucun `n` ne doit pas
   *  voir toutes ses lignes annoncer qu'elles sont vides. */
  soonLabel?: string;
  /** Singulier / pluriel du compte affiché sur l'en-tête d'un groupe replié. */
  groupLabel?: [string, string];
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

  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const isOpen = (title: string) => needle !== "" || open.has(title);
  const toggle = useCallback((title: string, next: boolean) => {
    setOpen((prev) => {
      const s2 = new Set(prev);
      if (next) s2.add(title);
      else s2.delete(title);
      return s2;
    });
  }, []);

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
            <details
              key={g.title}
              className="az-section"
              open={isOpen(g.title)}
              onToggle={(e) => {
                if (needle === "") toggle(g.title, (e.currentTarget as HTMLDetailsElement).open);
              }}
            >
              <summary className="az-head">
                <h2 className="h-md" style={{ margin: 0, minWidth: 0 }}>
                  {g.title}
                </h2>
                <span className="az-meta">
                  {g.items.length}
                  {groupLabel ? ` ${g.items.length > 1 ? groupLabel[1] : groupLabel[0]}` : ""}
                </span>
                <span className="az-caret" aria-hidden="true">
                  ▶
                </span>
              </summary>
              <div className="linkfarm" style={{ padding: "18px 0 24px" }}>
                {g.items.map((i) => (
                  <Link
                    key={i.slug}
                    href={`${hrefBase}${i.slug}`}
                    className={soonLabel && !i.n ? "is-quiet" : undefined}
                  >
                    {labelPrefix}
                    {i.term}
                    {/* L'espace est explicite : la marge CSS ne sépare que les pixels,
                        le texte d'ancre resterait « Rave party Rigasoon ». */}
                    {i.n ? <> <b>{i.n}</b></> : soonLabel ? <> <i>{soonLabel}</i></> : null}
                  </Link>
                ))}
              </div>
            </details>
          ),
        )
      )}
    </div>
  );
}
