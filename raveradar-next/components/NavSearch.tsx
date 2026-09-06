"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang, SuggestKind, Suggestion } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";
import { useSuggest } from "./useSuggest";

/**
 * La recherche de la barre de navigation.
 *
 * `HeroSearch` est le meilleur composant du site (sept types d'entités, clavier
 * complet, cache) et il n'était monté **que sur la page d'accueil**. Or le trafic d'un
 * site de référencement atterrit sur les fiches profondes : la quasi-totalité des
 * lecteurs ne le voyait jamais, et celui qui voulait chercher autre chose depuis une
 * fiche devait remonter à l'accueil. Une loupe dans la nav le rend disponible sur les
 * 13 000 pages.
 *
 * Version compacte, pas une copie : pas de facettes (pays, mois, genre), qui se
 * choisissent en début de parcours, pas de placeholder qui défile. Ce qui compte ici
 * est d'aller à une page nommée. La logique de requête est partagée avec le hero via
 * `useSuggest()`, pour qu'il n'y ait qu'un comportement à corriger.
 *
 * Le panneau est monté à la demande : tant que la loupe n'est pas cliquée, aucun état,
 * aucun écouteur, aucun appel. C'est ce qui rend acceptable de le poser sur toutes les
 * pages, y compris celle dont le LCP compte le plus.
 */
const KIND_ICON: Record<SuggestKind, string> = {
  artist: "🎧", festival: "🎪", event: "🔊", city: "📍", venue: "🏛", genre: "🎵", country: "🌍",
};

export default function NavSearch({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, busy } = useSuggest(open ? q : "", lang);

  useEffect(() => setActive(-1), [items]);

  /* Ouverture : le focus va dans le champ, sinon il faut un second clic pour taper.
     Fermeture à Échap depuis n'importe où dans le panneau, c'est ce qu'on essaie en
     premier pour sortir d'une surcouche. */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Le panneau recouvre la page : sans ce verrou, la page défile derrière lui quand on
     fait défiler la liste des résultats sur mobile. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(`${p}${href}`);
    },
    [p, router],
  );

  /* Même regroupement que le hero : l'ordre des groupes suit celui de leur meilleur
     élément, pour que la première ligne du menu soit toujours le meilleur résultat. */
  const groups = useMemo(() => {
    const by = new Map<SuggestKind, { it: Suggestion; i: number }[]>();
    items.forEach((it, i) => {
      const arr = by.get(it.k) ?? [];
      arr.push({ it, i });
      by.set(it.k, arr);
    });
    return [...by.entries()].sort((a, b) => a[1][0].i - b[1][0].i);
  }, [items]);
  const order = useMemo(() => groups.flatMap(([, rows]) => rows.map((r) => r.i)), [groups]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!items.length) return;
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    setOpen(false);
    router.push(`${p}/explore${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  };

  return (
    <>
      <button
        type="button"
        className="nav-search-btn"
        onClick={() => setOpen(true)}
        aria-label={t("omni.label")}
        aria-expanded={open}
      >
        ⌕
      </button>

      {open && (
        <div className="navsearch" role="dialog" aria-modal="true" aria-label={t("omni.label")}>
          {/* Le fond ferme au clic, comportement attendu d'une surcouche. `aria-hidden`
              parce qu'il ne porte aucune information : la sortie clavier est Échap. */}
          <div className="navsearch-veil" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="navsearch-box">
            <form className="navsearch-bar" onSubmit={submit} role="search">
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder={t("omni.ph")}
                aria-label={t("omni.label")}
                role="combobox"
                aria-expanded={items.length > 0}
                aria-controls="navsearch-list"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? `navsearch-opt-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label={t("omni.close")}>
                ✕
              </button>
            </form>

            {q.trim().length >= 2 && (
              <div className="navsearch-list" id="navsearch-list" role="listbox">
                {items.length === 0 ? (
                  <div className="navsearch-empty">{busy ? t("omni.loading") : t("omni.none")}</div>
                ) : (
                  groups.map(([kind, rows]) => (
                    <div key={kind}>
                      <div className="navsearch-group">{t(`omni.kind.${kind}`)}</div>
                      {rows.map(({ it, i }) => (
                        <button
                          type="button"
                          key={it.h}
                          id={`navsearch-opt-${i}`}
                          role="option"
                          aria-selected={i === active}
                          className={`navsearch-row${i === active ? " on" : ""}`}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(it.h)}
                        >
                          <span aria-hidden="true">{KIND_ICON[it.k]}</span>
                          <span className="navsearch-name">{it.n}</span>
                          {it.m && <span className="navsearch-hint">{it.m}</span>}
                          {it.past && <span className="navsearch-past">{t("omni.past")}</span>}
                        </button>
                      ))}
                    </div>
                  ))
                )}
                {/* La sortie large quand aucune suggestion ne convient. Le libellé porte
                    déjà le terme, via le gabarit `{q}` du dictionnaire. */}
                <button
                  type="button"
                  className="navsearch-all"
                  onClick={() => {
                    const term = q.trim();
                    setOpen(false);
                    router.push(`${p}/explore${term ? `?q=${encodeURIComponent(term)}` : ""}`);
                  }}
                >
                  {t("omni.all").replace("{q}", q.trim())}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
