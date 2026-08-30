"use client";
import { useId, useRef, useState } from "react";
import { renderRich, richLength } from "@/lib/richtext";

/**
 * Le champ de description, avec sa mise en forme légère.
 *
 * Un promoteur décrit sa soirée en dix lignes : il lui faut mettre un mot en avant,
 * lister les scènes, renvoyer vers une page. Un simple `<textarea>` rendait tout ça en
 * un bloc, et un vrai éditeur riche rendrait du HTML, que le catalogue ne stocke pas et
 * qu'une fiche ne doit pas afficher. Le compromis est le Markdown réduit de
 * `lib/richtext.ts` : quatre signes, posés par la barre d'outils, lisibles tels quels.
 *
 * L'aperçu se rend depuis `renderRich()`, qui échappe **avant** de reconnaître les
 * motifs : ce qui sort n'a jamais été du HTML d'entrée, c'est ce qui rend le
 * `dangerouslySetInnerHTML` d'ici défendable.
 *
 * Le compteur compte les signes **utiles** (`richLength`) : un « **gras** » ne doit pas
 * coûter quatre caractères à quelqu'un qui essaie d'atteindre un minimum.
 */

export interface RichEditorProps {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  error?: string;
  /** Libellés de la barre d'outils et de l'aperçu, la page étant bilingue. */
  t: { bold: string; italic: string; list: string; link: string; preview: string; write: string; chars: string };
}

export default function RichEditor({
  id, label, hint, value, onChange, placeholder, min = 120, max = 4000, error, t,
}: RichEditorProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const area = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const used = richLength(value);

  /**
   * Enveloppe la sélection, ou insère le motif et place le curseur au bon endroit.
   * Sans ce second cas, cliquer « Gras » sans rien sélectionner écrit `****` et laisse
   * le curseur après, donc on tape à côté de sa propre mise en forme.
   */
  const wrap = (before: string, after = before, fallback = "") => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const selected = value.slice(a, b) || fallback;
    const next = value.slice(0, a) + before + selected + after + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + before.length, a + before.length + selected.length);
    });
  };

  /** Préfixe chaque ligne sélectionnée, ou la ligne courante. Une liste se pose sur
   *  plusieurs lignes d'un coup, pas ligne à ligne. */
  const prefixLines = (mark: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const end = value.indexOf("\n", b) === -1 ? value.length : value.indexOf("\n", b);
    const block = value.slice(start, end) || "";
    const next =
      value.slice(0, start) +
      block
        .split("\n")
        .map((line) => (line.startsWith(mark) ? line : mark + line))
        .join("\n") +
      value.slice(end);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div className="field full richfield">
      <label htmlFor={fieldId}>
        {label}
        <span className={`richfield-count ${used < min ? "low" : ""}`}>
          {t.chars.replace("{n}", String(used)).replace("{min}", String(min))}
        </span>
      </label>
      {hint && <p className="field-hint">{hint}</p>}

      <div className="richfield-bar">
        <div className="richfield-tools">
          <button type="button" onClick={() => wrap("**", "**", "texte")} title={t.bold}>
            <b>B</b>
          </button>
          <button type="button" onClick={() => wrap("*", "*", "texte")} title={t.italic}>
            <i>I</i>
          </button>
          <button type="button" onClick={() => prefixLines("- ")} title={t.list}>
            ☰
          </button>
          <button type="button" onClick={() => wrap("[", "](https://)", "lien")} title={t.link}>
            🔗
          </button>
        </div>
        <div className="richfield-tabs">
          <button type="button" className={tab === "write" ? "on" : ""} onClick={() => setTab("write")}>
            {t.write}
          </button>
          <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>
            {t.preview}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          id={fieldId}
          ref={area}
          className={`input richfield-area ${error ? "bad" : ""}`}
          value={value}
          maxLength={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className="richfield-preview richtext"
          /* Sûr par construction : `renderRich()` échappe la saisie avant d'y reconnaître
             ses quatre motifs, donc aucune balise tapée ici ne ressort en balise. */
          dangerouslySetInnerHTML={{ __html: renderRich(value) || `<p class="muted">${escapeText(placeholder ?? "")}</p>` }}
        />
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

const escapeText = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
