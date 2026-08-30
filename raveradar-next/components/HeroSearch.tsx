"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang, SuggestKind, Suggestion } from "@/lib/types";

import { getDict, langPrefix } from "@/lib/i18n";

/** L'icône qui identifie chaque type de résultat. */
const KIND_ICON: Record<SuggestKind, string> = {
  artist: "🎧",
  festival: "🎪",
  event: "🔊",
  city: "📍",
  venue: "🏛",
  /* 🎵 et pas 🎚 (curseur de mixage) : ce dernier n'existe pas dans toutes les
     polices d'emoji et tombe en carré vide, vérifié au navigateur. */
  genre: "🎵",
  country: "🌍",
};

/**
 * Découpe le libellé sur la partie saisie, pour la mettre en évidence.
 *
 * La comparaison se fait sur la forme réduite (sans accents, minuscules) mais le
 * découpage sur la chaîne d'origine : `NFD` peut rendre deux points de code là où le
 * nom n'en a qu'un, donc chercher l'indice dans la version réduite décalerait la
 * surbrillance d'un caractère sur « Créteil » ou « Étienne de Crécy ». On réduit donc
 * caractère par caractère et on garde la correspondance des indices.
 */
function splitMatch(name: string, q: string): [string, string, string] {
  if (!q) return [name, "", ""];
  const folded = [...name].map((c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const flat = folded.join("");
  // Un caractère peut se réduire à plusieurs (rare) : on retrouve l'indice d'origine
  // en cumulant les longueurs plutôt qu'en supposant 1 pour 1.
  const at = flat.indexOf(q);
  if (at < 0) return [name, "", ""];
  const chars = [...name];
  let seen = 0;
  let start = 0;
  while (start < chars.length && seen + folded[start].length <= at) {
    seen += folded[start].length;
    start++;
  }
  let end = start;
  let taken = 0;
  while (end < chars.length && taken < q.length) {
    taken += folded[end].length;
    end++;
  }
  return [chars.slice(0, start).join(""), chars.slice(start, end).join(""), chars.slice(end).join("")];
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * La barre de recherche de la page d'accueil.
 *
 * Elle ne demande plus une ville : le premier champ accepte **n'importe quoi** du
 * catalogue (un artiste, un festival, une soirée, une ville, un club, un genre, un
 * pays) et propose la page correspondante avant même la validation. Un lecteur qui
 * tape « Amelie Lens » n'a plus rien à savoir de notre arborescence.
 *
 * Rien du catalogue n'entre ici : les suggestions viennent de `/api/search`, et les
 * deux listes de facettes arrivent en props, calculées côté serveur. Voir le
 * commentaire de `lib/search-index.ts` pour la raison (218 Ko de JS, sinon).
 */
export default function HeroSearch({
  lang,
  countryOptions,
  genreOptions,
  examples,
}: {
  lang: Lang;
  countryOptions: { v: string; l: string }[];
  genreOptions: string[];
  /** Les exemples qui défilent dans le champ, tirés du catalogue par le serveur. */
  examples: string[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const router = useRouter();

  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [month, setMonth] = useState("");
  const [genre, setGenre] = useState("");

  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /* Une saisie déjà vue ne repart pas au réseau : en tapant « berghain » on repasse par
     « berg », « bergh », « bergha »… et l'effacement d'une lettre rejoue la précédente. */
  const cache = useRef(new Map<string, Suggestion[]>());

  /* Le placeholder défile sur des exemples réels du catalogue. C'est ce qui dit « tape
     ce que tu veux » sans avoir à l'écrire : une étiquette « Ville » promettait
     l'inverse, et une phrase d'aide sous le champ ne se lit pas. */
  const [ex, setEx] = useState(0);
  useEffect(() => {
    if (examples.length < 2 || q || focus) return;
    const id = setInterval(() => setEx((i) => (i + 1) % examples.length), 2600);
    return () => clearInterval(id);
  }, [examples.length, q, focus]);
  const placeholder = examples.length ? `${t("omni.ph")} ${examples[ex % examples.length]}…` : t("omni.ph");

  /* Une requête par frappe serait un appel toutes les 40 ms sur une saisie normale.
     La temporisation ne coupe pas le ressenti (140 ms est sous le seuil de perception)
     et l'`AbortController` empêche une réponse en retard d'écraser une plus récente. */
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setBusy(false);
      return;
    }
    const key = fold(term);
    const hit = cache.current.get(key);
    if (hit) {
      setItems(hit);
      setBusy(false);
      return;
    }
    setBusy(true);
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctl.signal });
        const data = (await r.json()) as { items: Suggestion[] };
        cache.current.set(key, data.items);
        setItems(data.items);
      } catch {
        /* Réseau coupé ou requête annulée : le formulaire reste utilisable tel quel,
           il pousse vers /explore, qui filtre le catalogue entier côté client. */
      } finally {
        setBusy(false);
      }
    }, 140);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, lang]);

  useEffect(() => setActive(-1), [items]);

  /* Clic à l'extérieur : le menu se referme. Sans ça il reste ouvert derrière le
     contenu de la page, et il est en position absolue, donc il recouvre les cartes. */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  /* Le hero occupe tout l'écran : le menu s'ouvre alors entièrement sous la ligne de
     flottaison et le lecteur ne voit jamais ses propres suggestions. On remonte de
     juste ce qu'il faut, jamais plus, et jamais si tout tient déjà. */
  useEffect(() => {
    if (!open || !items.length) return;
    const el = panelRef.current;
    if (!el) return;
    const gap = el.getBoundingClientRect().bottom + 20 - window.innerHeight;
    if (gap > 0) window.scrollBy({ top: gap, behavior: "smooth" });
  }, [open, items]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(`${p}${href}`);
    },
    [p, router]
  );

  /** La recherche large : ce que le formulaire fait quand aucune suggestion n'est prise. */
  const submit = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (country) sp.set("country", country);
    if (month) sp.set("month", month);
    if (genre) sp.set("genre", genre);
    setOpen(false);
    router.push(`${p}/explore${sp.toString() ? `?${sp}` : ""}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => order[(order.indexOf(i) + 1) % order.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const at = order.indexOf(active);
      setActive(order[(at <= 0 ? order.length : at) - 1]);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(items[active].h);
    }
  };

  /* Les suggestions arrivent déjà classées par pertinence. On les regroupe pour l'œil,
     et l'ordre des groupes suit celui de leur meilleur élément : un ordre de catégories
     fixe mettait « Festivals » avant « Villes » sur une saisie où la ville est le
     meilleur résultat, et la première ligne du menu (celle que ↓ puis ↵ prend) n'était
     alors plus la meilleure. */
  const groups = useMemo(() => {
    const by = new Map<SuggestKind, { it: Suggestion; i: number }[]>();
    items.forEach((it, i) => {
      const arr = by.get(it.k) ?? [];
      arr.push({ it, i });
      by.set(it.k, arr);
    });
    return [...by.entries()].sort((a, b) => a[1][0].i - b[1][0].i);
  }, [items]);

  /* Les indices dans l'ordre où le menu les rend : le regroupement déplace les lignes,
     et une flèche qui suivrait l'ordre du tableau sauterait d'un groupe à l'autre. */
  const order = useMemo(() => groups.flatMap(([, rows]) => rows.map((r) => r.i)), [groups]);

  const folded = fold(q);
  const showPanel = open && q.trim().length >= 2;
  const filters = [country, month, genre].filter(Boolean).length;

  return (
    <div
      className={`omni rise-in${focus ? " is-focus" : ""}`}
      ref={boxRef}
      style={{ "--d": ".22s" } as React.CSSProperties}
    >
      <form className="omni-bar" onSubmit={submit} role="search">
        <span className="omni-glass" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          className="omni-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocus(true);
            setOpen(true);
          }}
          onBlur={() => setFocus(false)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={t("omni.label")}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="omni-list"
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `omni-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        {q && (
          <button type="button" className="omni-clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label={t("omni.clear")}>
            ✕
          </button>
        )}
        <button type="submit" className="omni-go">
          <span>{t("search.go")}</span>
        </button>
      </form>

      {showPanel && (
        <div className="omni-panel" ref={panelRef} id="omni-list" role="listbox" aria-label={t("omni.results")}>
          {items.length === 0 ? (
            <div className="omni-empty">{busy ? t("omni.loading") : t("omni.none")}</div>
          ) : (
            groups.map(([kind, rows]) => (
              <div className="omni-group" key={kind}>
                <div className="omni-group-label">{t(`omni.kind.${kind}`)}</div>
                {rows.map(({ it, i }) => {
                  const [a, b, c] = splitMatch(it.n, folded);
                  return (
                    <button
                      type="button"
                      key={it.h}
                      id={`omni-opt-${i}`}
                      role="option"
                      aria-selected={active === i}
                      className={`omni-item${active === i ? " on" : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(it.h)}
                    >
                      <span className={`omni-ico k-${it.k}`} aria-hidden="true">
                        {KIND_ICON[it.k]}
                      </span>
                      <span className="omni-name">
                        {a}
                        <mark>{b}</mark>
                        {c}
                      </span>
                      {/* Une édition terminée reste trouvable, elle le dit : la faire
                          passer pour une date à venir serait le défaut que les trois
                          portes de mise en avant existent pour empêcher. */}
                      {it.past && <span className="omni-past">{t("omni.past")}</span>}
                      {it.m && <span className="omni-meta">{it.m}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
          <button type="button" className="omni-all" onClick={() => submit()}>
            {t("omni.all").replace("{q}", q.trim())}
            <span className="omni-kbd">↵</span>
          </button>
        </div>
      )}

      <div className="omni-filters">
        <label className={`omni-pill${country ? " on" : ""}`}>
          <span className="omni-pill-k">{t("search.country")}</span>
          <span className="omni-pill-v">{country ? countryOptions.find((c) => c.v === country)?.l : t("search.country.any")}</span>
          <span className="omni-caret" aria-hidden="true">
            ▾
          </span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t("search.country")}>
            <option value="">{t("search.country.any")}</option>
            {countryOptions.map((c) => (
              <option key={c.v} value={c.v}>
                {c.l}
              </option>
            ))}
          </select>
        </label>

        <label className={`omni-pill${month ? " on" : ""}`}>
          <span className="omni-pill-k">{t("search.month")}</span>
          <span className="omni-pill-v">{month ? monthLabel(month, t("locale")) : t("search.month.any")}</span>
          <span className="omni-caret" aria-hidden="true">
            ▾
          </span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label={t("search.month")} />
        </label>

        <label className={`omni-pill${genre ? " on" : ""}`}>
          <span className="omni-pill-k">{t("search.genre")}</span>
          <span className="omni-pill-v">{genre || t("search.genre.any")}</span>
          <span className="omni-caret" aria-hidden="true">
            ▾
          </span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label={t("search.genre")}>
            <option value="">{t("search.genre.any")}</option>
            {genreOptions.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>

        {filters > 0 && (
          <button
            type="button"
            className="omni-reset"
            onClick={() => {
              setCountry("");
              setMonth("");
              setGenre("");
            }}
          >
            {t("omni.reset")}
          </button>
        )}
      </div>
    </div>
  );
}

/** « 2026-09 » → « sept. 2026 », dans la langue de la page. */
function monthLabel(m: string, locale: string): string {
  return new Date(`${m}-01T00:00:00`).toLocaleDateString(locale, { month: "short", year: "numeric" });
}
