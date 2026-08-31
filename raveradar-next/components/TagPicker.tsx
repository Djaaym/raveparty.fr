"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Un champ qui compose une liste de valeurs, avec suggestions au fil de la frappe.
 *
 * Deux usages dans le dépôt d'événement, et c'est pour ça qu'il est générique : les
 * sous-genres (liste connue, tenue dans `lib/subgenres.ts`) et le line-up (1 887 noms
 * qui vivent côté serveur, donc interrogés par `/api/search?kind=artist`).
 *
 * Ce que les suggestions changent vraiment sur le line-up : un artiste saisi « Amélie
 * Lens » au lieu d'« Amelie Lens » ne rejoint pas la fiche existante, il en crée une
 * seconde. Proposer le nom tel que le catalogue l'écrit fait donc du champ un outil
 * d'alignement, pas seulement un confort de frappe, et c'est aussi la seule façon de
 * rattacher un dépôt aux pages artiste déjà en ligne.
 *
 * Le menu est piloté au clavier (↑ ↓ ↵ ⎋) parce qu'on remplit une affiche de vingt noms
 * à la suite, et que reprendre la souris entre chaque nom est le moment où on abandonne.
 */

export interface TagPickerProps {
  id?: string;
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  /** Liste locale, filtrée dans le composant. Exclusif avec `remote`. */
  options?: string[];
  /** Recherche distante : rend les propositions pour une saisie. */
  remote?: (q: string) => Promise<string[]>;
  max?: number;
  /** Le texte du bouton d'ajout, affiché à côté du champ. */
  addLabel: string;
  /** Ce qu'on annonce quand le plafond est atteint. */
  fullLabel?: string;
  emptyLabel?: string;
  /**
   * L'ordre des valeurs porte-t-il un sens ?
   *
   * Sur les sous-genres, non : c'est un ensemble. Sur un line-up, si, et il en porte un
   * qui se voit sur la fiche, `lineup[0]` étant la tête d'affiche, rendue en grand sur
   * toute la largeur. Sans moyen de déplacer un nom, corriger une affiche voudrait dire
   * tout retirer et tout ressaisir dans le bon ordre.
   */
  ordered?: boolean;
  /** Le libellé de la première étiquette quand `ordered` est posé (« tête d'affiche »). */
  firstLabel?: string;
}

export default function TagPicker({
  id, label, hint, placeholder, values, onChange, options, remote,
  max = 12, addLabel, fullLabel, emptyLabel, ordered, firstLabel,
}: TagPickerProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const full = values.length >= max;

  const localMatches = useMemo(() => {
    if (!options) return [];
    const f = fold(q);
    const pool = options.filter((o) => !values.includes(o));
    if (!f) return pool.slice(0, 8);
    return pool
      .map((o) => ({ o, r: rank(fold(o), f) }))
      .filter((x) => x.r > 0)
      .sort((a, b) => b.r - a.r || a.o.localeCompare(b.o))
      .slice(0, 8)
      .map((x) => x.o);
  }, [options, q, values]);

  useEffect(() => {
    if (!remote) {
      setItems(localMatches);
      return;
    }
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    // Une frappe rapide ne doit pas déclencher un appel par lettre, et une réponse
    // en retard ne doit pas écraser une plus récente : le drapeau `stale` s'en charge.
    let stale = false;
    const timer = setTimeout(() => {
      void remote(term).then((r) => {
        if (!stale) setItems(r.filter((x) => !values.includes(x)).slice(0, 8));
      });
    }, 160);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q, remote, values, localMatches]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const add = (raw: string) => {
    const v = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!v || full || values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setQ("");
      return;
    }
    onChange([...values, v]);
    setQ("");
    setCursor(-1);
    setOpen(false);
  };

  /** Déplace une valeur d'un cran. Aux bords, on ne fait rien plutôt que de boucler :
   *  une tête d'affiche qui repartirait en fin de liste sur un clic de trop serait la
   *  pire façon de perdre l'ordre qu'on est en train de régler. */
  const move = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setCursor((c) => {
        const n = e.key === "ArrowDown" ? c + 1 : c - 1;
        return n < -1 ? items.length - 1 : n >= items.length ? -1 : n;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      add(cursor >= 0 && items[cursor] ? items[cursor] : q);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
      return;
    }
    // Retour arrière sur un champ vide : on retire la dernière étiquette, le geste
    // attendu de tous les champs à étiquettes.
    if (e.key === "Backspace" && !q && values.length) onChange(values.slice(0, -1));
  };

  return (
    <div className="field full tagfield" ref={box}>
      <label htmlFor={inputId}>
        {label}
        <span className="tagfield-count">
          {values.length}/{max}
        </span>
      </label>
      {hint && <p className="field-hint">{hint}</p>}

      <div className="tagfield-bar">
        <input
          id={inputId}
          className="input"
          value={q}
          disabled={full}
          placeholder={full ? (fullLabel ?? placeholder) : placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={`${inputId}-menu`}
          aria-autocomplete="list"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setCursor(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        <button type="button" className="btn btn-ghost" disabled={full || !q.trim()} onClick={() => add(q)}>
          {addLabel}
        </button>

        {open && items.length > 0 && (
          <ul className="tagfield-menu" id={`${inputId}-menu`} role="listbox">
            {items.map((item, i) => (
              <li key={item} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  className={i === cursor ? "on" : ""}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => add(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {values.length > 0 ? (
        <ul className={`tagfield-list${ordered ? " ordered" : ""}`}>
          {values.map((v, i) => (
            <li key={v} className={ordered && i === 0 ? "first" : undefined}>
              {ordered && (
                <>
                  <button
                    type="button"
                    className="tagfield-move"
                    aria-label={`Avancer ${v}`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="tagfield-move"
                    aria-label={`Reculer ${v}`}
                    disabled={i === values.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                </>
              )}
              <span>{v}</span>
              {ordered && i === 0 && firstLabel && <em className="tagfield-first">{firstLabel}</em>}
              <button type="button" aria-label={`Retirer ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        emptyLabel && <p className="field-hint tagfield-empty">{emptyLabel}</p>
      )}
    </div>
  );
}

/** Même réduction que partout ailleurs sur le site : « creteil » doit trouver « Créteil ». */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Nom entier, puis début de mot, puis n'importe où, comme `score()` dans l'index. */
function rank(hay: string, q: string): number {
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  if (hay.includes(" " + q) || hay.includes("-" + q)) return 60;
  return hay.includes(q) ? 30 : 0;
}
