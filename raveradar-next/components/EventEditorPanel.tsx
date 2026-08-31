"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, MAX_LINEUP, MIN_DESC, type EventEdit, type PriceConfidence } from "@/lib/event-edits";
import type { Lang, RaveEvent } from "@/lib/types";
import { priceLabel } from "@/lib/format";
import RichEditor from "./RichEditor";
import TagPicker from "./TagPicker";
import type { EventEditorProps } from "./EventEditor";

/**
 * Le panneau d'édition d'une fiche.
 *
 * Chargé par `next/dynamic` au premier clic, jamais avant : il tire `RichEditor`,
 * `TagPicker` et, par `lib/format.ts`, le dictionnaire d'i18n. Sur les milliers de
 * fiches qui portent le SEO du site, ce sont autant d'octets qu'un lecteur n'a aucune
 * raison de télécharger. Voir l'en-tête d'`EventEditor.tsx`.
 *
 * ## Ce que l'écran promet, et ce qu'il ne promet pas
 *
 * La correction s'applique à la fiche, tout de suite. Elle **ne redescend pas** dans les
 * index construits à la compilation (cartes des grilles, fiches artistes, recherche) :
 * ceux-là suivront à la prochaine mise en ligne du catalogue. Le panneau le dit en tête,
 * plutôt que de laisser découvrir l'écart sur une carte de la page d'accueil.
 *
 * La validation vient de `parseEdit()`, côté serveur, et les messages affichés sous les
 * champs sont exactement les siens : c'est celle du serveur qui décide de
 * l'enregistrement, en écrire une seconde ici les ferait diverger.
 */

const RICH_T = {
  bold: "Gras", italic: "Italique", list: "Liste", link: "Lien",
  /* `{n}` et `{min}` sont substitués par `RichEditor` : sans eux le compteur
     n'affiche que le mot « signes », ce qui ne compte rien. */
  preview: "Aperçu", write: "Écrire", chars: "{n} signes (minimum {min})",
};

const NOTES: [PriceConfidence, string, string][] = [
  ["confirmed", "Confirmé", "Le tarif est celui de la billetterie."],
  ["estimated", "Estimé", "Affiché « ≈ 45 € » : on ne l'a pas vu annoncé tel quel."],
  ["unknown", "Non publié", "Affiché « Tarif à venir », jamais « gratuit »."],
];

export interface PanelProps {
  p: EventEditorProps;
  edit: EventEdit | null;
  persistent: boolean;
  onClose: () => void;
  onChanged: (edit: EventEdit | null) => void;
}

export default function EventEditorPanel({ p, edit, persistent, onClose, onChanged }: PanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "save" | "reset">("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* L'état part de ce que la fiche affiche : le panneau étant démonté à la fermeture,
     il repart de zéro à chaque ouverture, donc d'un rendu serveur à jour. */
  const [desc, setDesc] = useState(p.desc);
  const [descEn, setDescEn] = useState(p.descEn);
  const [tab, setTab] = useState<Lang>(p.lang);
  const [lineup, setLineup] = useState<string[]>(p.lineup);
  const [price, setPrice] = useState(String(p.price));
  const [currency, setCurrency] = useState(p.currency);
  const [priceNote, setPriceNote] = useState<PriceConfidence>(p.priceNote);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const searchArtists = async (q: string): Promise<string[]> => {
    try {
      const res = await fetch(`/api/search?kind=artist&lang=${p.lang}&q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { items?: { n: string }[] };
      return (data.items ?? []).map((i) => i.n);
    } catch {
      return [];
    }
  };

  async function save() {
    setBusy("save");
    setErrors({});
    setNote("");
    try {
      const res = await fetch("/api/event-edit", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: p.id, desc, descEn, lineup,
          price: Number(price.replace(",", ".")), currency, priceNote,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        fields?: Record<string, string>; error?: string; edit?: EventEdit | null;
      };
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setNote(data.fields ? "Corrige les champs signalés." : messageFor(data.error));
        return;
      }
      onChanged(data.edit ?? null);
      setNote("Enregistré. La fiche se met à jour…");
      /* La page est statique et la route vient de la revalider : `refresh()` va
         rechercher le rendu serveur. Sans lui on resterait devant la version d'avant et
         on croirait que rien n'a été pris. */
      router.refresh();
      setTimeout(onClose, 900);
    } catch {
      setNote("Réseau indisponible, rien n'a été enregistré.");
    } finally {
      setBusy("");
    }
  }

  async function reset() {
    setBusy("reset");
    setNote("");
    try {
      const res = await fetch(`/api/event-edit?id=${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        setNote("Suppression impossible.");
        return;
      }
      onChanged(null);
      setNote("Fiche revenue au catalogue.");
      router.refresh();
      setTimeout(onClose, 900);
    } catch {
      setNote("Réseau indisponible.");
    } finally {
      setBusy("");
    }
  }

  /* `priceLabel()` ne lit que ces trois champs : l'aperçu montre la ligne exacte que la
     billetterie affichera, seule façon de voir qu'un `priceNote` mal réglé transforme un
     tarif à venir en « gratuit ». */
  const preview = priceLabel(
    {
      price: Number(price.replace(",", ".")) || 0,
      currency,
      priceNote: priceNote === "confirmed" ? undefined : priceNote,
    } as RaveEvent,
    p.lang,
  );

  return (
    <div className="edit-shell" role="dialog" aria-modal="true" aria-label={`Modifier ${p.title}`}>
      <button type="button" className="edit-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="edit-panel">
        <header className="edit-head">
          <div>
            <span className="eyebrow">Édition rapide</span>
            <h2 className="h-md">{p.title}</h2>
          </div>
          <button type="button" className="edit-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <p className="edit-warn">
          La correction s&apos;applique <b>à cette fiche</b>, tout de suite. Les cartes des
          grilles, les fiches artistes et la recherche sont construites au déploiement :
          elles suivront à la prochaine mise en ligne du catalogue.
          {!persistent && (
            <>
              {" "}
              <b>Aucun magasin n&apos;est configuré</b> : la correction ne survivra pas au
              redémarrage.
            </>
          )}
        </p>

        {p.guided && (
          <p className="edit-pending">
            Cette fiche affiche un <b>guide festival</b> : le texte long vient de{" "}
            <code>lib/guides.ts</code> et remplace la description à l&apos;écran. Le line-up et
            le tarif, eux, s&apos;affichent normalement.
          </p>
        )}

        {edit && (
          <p className="edit-pending">
            Correction en attente de saisie au catalogue, du{" "}
            {new Date(edit.updatedAt).toLocaleString("fr-FR")} par {edit.by}.
          </p>
        )}

        <div className="edit-body">
          <div className="edit-tabs" role="tablist" aria-label="Langue de la description">
            {(["fr", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={tab === l}
                className={tab === l ? "on" : ""}
                onClick={() => setTab(l)}
              >
                {l === "fr" ? "Description (FR)" : "Description (EN)"}
              </button>
            ))}
          </div>

          {tab === "fr" ? (
            <RichEditor
              label="Description française"
              hint="La source de vérité du catalogue. Rien d'inventé : dates, line-up, lieu et prix se vérifient."
              value={desc}
              onChange={setDesc}
              min={MIN_DESC}
              error={errors.desc}
              t={RICH_T}
            />
          ) : (
            <RichEditor
              label="Description anglaise"
              hint="Reprise sur /en. Laissée vide, la fiche anglaise affiche le texte français, ce qui vaut mieux qu'une traduction devenue fausse."
              value={descEn}
              onChange={setDescEn}
              min={0}
              error={errors.descEn}
              t={RICH_T}
            />
          )}

          <TagPicker
            label="Line-up"
            hint="Le premier nom est la tête d'affiche. Choisis dans les propositions quand le nom existe : « Amélie Lens » saisi à la main ne rejoint pas la fiche d'« Amelie Lens », il en crée une seconde."
            placeholder="Ajouter un artiste…"
            values={lineup}
            onChange={setLineup}
            remote={searchArtists}
            max={MAX_LINEUP}
            ordered
            firstLabel="tête d'affiche"
            addLabel="Ajouter"
            emptyLabel="Aucun nom : la fiche affichera « Programmation à venir »."
          />
          {errors.lineup && <p className="field-error">{errors.lineup}</p>}

          <div className="edit-price">
            <div className="field">
              <label htmlFor="edit-price">Tarif d&apos;entrée</label>
              <input
                id="edit-price"
                className="input"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="edit-currency">Devise</label>
              <select id="edit-currency" className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(errors.price || errors.currency) && <p className="field-error">{errors.price ?? errors.currency}</p>}
          <p className="field-hint">
            On garde la devise locale, sans conversion : le montant affiché doit être celui
            qu&apos;on paie à l&apos;entrée, et c&apos;est le plus bas réellement vendu, pas le pass
            complet.
          </p>

          <fieldset className="edit-notes">
            <legend className="field-label">Fiabilité du tarif</legend>
            {NOTES.map(([value, label, help]) => (
              <label key={value} className={priceNote === value ? "on" : undefined}>
                <input
                  type="radio"
                  name="priceNote"
                  value={value}
                  checked={priceNote === value}
                  onChange={() => setPriceNote(value)}
                />
                <span>
                  <b>{label}</b>
                  <em>{help}</em>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="edit-preview">
            Sur la fiche : <b>{preview}</b>
          </p>
        </div>

        <footer className="edit-foot">
          {note && <p className="edit-note">{note}</p>}
          <div className="edit-actions">
            {edit && (
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy !== ""} onClick={reset}>
                {busy === "reset" ? "…" : "Revenir au catalogue"}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy !== ""} onClick={save}>
              {busy === "save" ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Le refus du serveur, dit en clair. « Ça n'a pas marché » obligerait à ouvrir la
 *  console du navigateur pour distinguer une session expirée d'un magasin absent. */
function messageFor(error?: string): string {
  if (error === "not_configured") return "Aucun magasin configuré : la correction n'a nulle part où être écrite.";
  if (error === "unauthorized") return "Session expirée. Reconnecte-toi sur /account.";
  if (error === "store") return "Le magasin n'a pas répondu, rien n'a été enregistré.";
  if (error === "rate_limited") return "Trop d'enregistrements d'affilée, réessaie dans une minute.";
  return "Enregistrement refusé.";
}
