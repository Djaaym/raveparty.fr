import type { RaveEvent } from "./types";

/**
 * Une correction de fiche, saisie depuis le site.
 *
 * ## Pourquoi une couche par-dessus le catalogue plutôt qu'une écriture dedans
 *
 * `lib/data.ts` est un fichier TypeScript lu à la compilation : les 7 000 pages du site
 * en sortent une fois, à la construction. Rien, en production, ne peut le modifier, le
 * disque d'une fonction Vercel étant en lecture seule, et c'est très bien ainsi, c'est
 * ce qui rend le catalogue relisible en diff et regénérable à l'identique.
 *
 * Une faute de frappe dans une description, un artiste ajouté à l'affiche la veille, un
 * tarif enfin confirmé : ces trois-là n'ont pas besoin d'un commit, d'une revue et d'un
 * déploiement de plusieurs minutes. D'où cette **surcouche** : un petit objet par
 * événement, rangé dans le même Redis que les comptes promoteurs, appliqué sur la fiche
 * au rendu. La fiche est la page qui compte, celle qu'un lecteur ouvre pour décider.
 *
 * ## Ce que la surcouche ne fait pas, et pourquoi c'est assumé
 *
 * Elle ne touche **que la fiche de l'événement**. Les index dérivés du catalogue à la
 * compilation (les fiches artistes construites depuis les line-ups, l'index de
 * recherche, les cartes des grilles, le JSON-LD des listings) continuent d'afficher ce
 * qui a été construit. Les recalculer voudrait dire rendre dynamiquement les 7 000
 * pages, ce qui coûterait exactement la génération statique qui fait la valeur SEO du
 * site.
 *
 * La correction est donc **une avance sur le catalogue, pas un remplacement** : elle est
 * visible tout de suite là où on la lit, et `/admin` la garde en file pour qu'elle soit
 * saisie dans `lib/data.ts` au prochain lot. C'est la même frontière que les dépôts de
 * promoteurs (`docs/promoteurs.md`), pour la même raison.
 *
 * Module **feuille** : rien d'autre que des types. L'éditeur est un composant client, et
 * la règle du dépôt est qu'un composant client ne tire jamais `lib/data.ts`.
 */

/** Ce que `priceNote` vaut dans une correction. `confirmed` est un troisième état, et
 *  pas une absence : « ce tarif est désormais confirmé » doit pouvoir *retirer* le
 *  `priceNote: "estimated"` du catalogue, ce qu'un champ omis ne saurait pas dire. */
export type PriceConfidence = "confirmed" | "estimated" | "unknown";

export interface EventEdit {
  /** L'id de l'événement dans `lib/data.ts`. C'est la clé, comme pour `IMAGES`. */
  id: number;
  /** Le titre au moment de la saisie, pour que `/admin` puisse nommer la ligne sans
   *  charger le catalogue, et pour repérer une correction devenue orpheline. */
  title: string;
  desc?: string;
  /** Vide = pas de version anglaise, la fiche `/en` retombe alors sur `desc`. */
  descEn?: string;
  lineup?: string[];
  price?: number;
  currency?: string;
  priceNote?: PriceConfidence;
  updatedAt: string;
  /** Qui a corrigé : l'adresse du compte, ou « mot de passe » pour l'accès de secours. */
  by: string;
}

/**
 * Les devises du catalogue.
 *
 * On stocke le symbole local et **on ne convertit pas** (règle du projet) : le montant
 * affiché doit être celui qu'on paie à l'entrée. La liste est celle qui existe
 * réellement dans `lib/data.ts`, dans l'ordre des volumes. Elle est ici plutôt que
 * dérivée du catalogue parce que ce module est une feuille, et que l'éditeur, côté
 * client, en fait son menu déroulant.
 */
export const CURRENCIES = ["€", "£", "$", "kr", "Kč", "zł", "CHF", "Ft", "RSD"] as const;

export const MAX_DESC = 4000;
export const MIN_DESC = 40;
export const MAX_LINEUP = 90;
export const MAX_NAME = 80;

export type EditInput = {
  desc?: unknown;
  descEn?: unknown;
  lineup?: unknown;
  price?: unknown;
  currency?: unknown;
  priceNote?: unknown;
};

export type EditErrors = Record<string, string>;

const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "";

/**
 * Valide une saisie et rend la correction à stocker.
 *
 * Appelée par la route **et** par l'éditeur, comme `parseSubmission()` : deux
 * validations écrites séparément finissent toujours par diverger, et c'est celle du
 * serveur qui fait foi, donc le message affiché sous un champ doit être exactement celui
 * qui décidera de l'enregistrement.
 *
 * Un champ absent de la saisie n'est pas corrigé, et un champ qui rend la valeur du
 * catalogue n'est pas stocké : la correction ne porte que ce qui change vraiment, ce qui
 * la garde lisible dans `/admin` et évite de figer une valeur qu'on n'a jamais voulu
 * toucher.
 */
export function parseEdit(
  input: EditInput,
  base: RaveEvent,
  by: string,
  now = new Date().toISOString(),
): { edit: EventEdit } | { errors: EditErrors } {
  const errors: EditErrors = {};
  const edit: EventEdit = { id: base.id, title: base.title, updatedAt: now, by };

  if (input.desc !== undefined) {
    const desc = text(input.desc, MAX_DESC);
    if (desc.length < MIN_DESC) errors.desc = `Au moins ${MIN_DESC} caractères.`;
    else if (desc !== base.desc) edit.desc = desc;
  }

  if (input.descEn !== undefined) {
    const en = text(input.descEn, MAX_DESC);
    // Vide est une valeur : « supprime la traduction ». Une description anglaise laissée
    // en place sous une description française réécrite affirme deux choses différentes
    // du même événement, et c'est la version anglaise qui serait fausse.
    if (en && en.length < MIN_DESC) errors.descEn = `Au moins ${MIN_DESC} caractères, ou rien du tout.`;
    else if (en !== (base.descEn ?? "")) edit.descEn = en;
  }

  if (input.lineup !== undefined) {
    if (!Array.isArray(input.lineup)) errors.lineup = "Liste attendue.";
    else {
      const seen = new Set<string>();
      const names: string[] = [];
      for (const raw of input.lineup) {
        const name = text(raw, MAX_NAME).replace(/\s+/g, " ");
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        names.push(name);
        if (names.length >= MAX_LINEUP) break;
      }
      /* Comparé élément par élément, et pas sur une concaténation : deux noms collés
         par un séparateur qui existe dans un nom rendraient « A B » et [« A », « B »]
         identiques, donc une correction perdue sans un mot. */
      const same = names.length === base.lineup.length && names.every((n, i) => n === base.lineup[i].trim());
      if (!same) edit.lineup = names;
    }
  }

  if (input.price !== undefined) {
    const n = typeof input.price === "number" ? input.price : Number(String(input.price).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100000) errors.price = "Montant invalide.";
    else {
      const price = Math.round(n * 100) / 100;
      if (price !== base.price) edit.price = price;
    }
  }

  if (input.currency !== undefined) {
    const c = text(input.currency, 4);
    if (!(CURRENCIES as readonly string[]).includes(c)) errors.currency = "Devise inconnue.";
    else if (c !== base.currency) edit.currency = c;
  }

  if (input.priceNote !== undefined) {
    const note = text(input.priceNote, 12) as PriceConfidence;
    if (!["confirmed", "estimated", "unknown"].includes(note)) errors.priceNote = "Valeur inconnue.";
    else if (note !== (base.priceNote ?? "confirmed")) edit.priceNote = note;
  }

  if (Object.keys(errors).length) return { errors };
  return { edit };
}

/** La correction porte-t-elle quoi que ce soit ? Sans ce contrôle, enregistrer une fiche
 *  sans rien y changer créerait une ligne vide dans la file de `/admin`. */
export const isEmptyEdit = (e: EventEdit): boolean =>
  e.desc === undefined && e.descEn === undefined && e.lineup === undefined &&
  e.price === undefined && e.currency === undefined && e.priceNote === undefined;

/**
 * L'événement tel que la fiche doit l'afficher.
 *
 * Pur, et volontairement bête : chaque champ présent dans la correction remplace celui
 * du catalogue, les autres passent tels quels. `priceNote: "confirmed"` est le seul cas
 * qui *retire* quelque chose, c'est la raison d'être du troisième état.
 */
export function applyEdit(e: RaveEvent, edit?: EventEdit | null): RaveEvent {
  if (!edit) return e;
  const out: RaveEvent = { ...e };
  if (edit.desc !== undefined) out.desc = edit.desc;
  if (edit.descEn !== undefined) out.descEn = edit.descEn || undefined;
  if (edit.lineup !== undefined) out.lineup = edit.lineup;
  if (edit.price !== undefined) out.price = edit.price;
  if (edit.currency !== undefined) out.currency = edit.currency;
  if (edit.priceNote !== undefined) out.priceNote = edit.priceNote === "confirmed" ? undefined : edit.priceNote;
  return out;
}

/** Les champs touchés, en clair. `/admin` en fait le résumé d'une ligne. */
export function editedFields(e: EventEdit): string[] {
  const out: string[] = [];
  if (e.desc !== undefined) out.push("description");
  if (e.descEn !== undefined) out.push("description EN");
  if (e.lineup !== undefined) out.push("line-up");
  if (e.price !== undefined || e.currency !== undefined || e.priceNote !== undefined) out.push("tarif");
  return out;
}

/**
 * La correction, sous la forme qu'on colle dans `lib/data.ts`.
 *
 * C'est le pont, et il s'arrête volontairement là où commence le jugement : le catalogue
 * reste un fichier relu à la main, comme pour les dépôts de promoteurs. Ce que la console
 * évite, c'est de retaper une description de dix lignes ou une affiche de vingt noms.
 *
 * **La mise en forme est aplatie, et ce n'est pas cosmétique** : `merge.py` écrit `desc`
 * sur une seule ligne, et un retour à la ligne dans une chaîne de `data.ts` casse le
 * build 7 000 pages plus loin. L'échappement est le même que celui d'`esc()` dans
 * `merge.py`, la barre oblique et le guillemet, rien d'autre.
 */
export function editPatch(e: EventEdit): string {
  const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n+/g, " ");
  const bits: string[] = [];
  if (e.price !== undefined) bits.push(`price: ${e.price}`);
  if (e.currency !== undefined) bits.push(`currency: "${esc(e.currency)}"`);
  if (e.priceNote !== undefined) {
    bits.push(e.priceNote === "confirmed" ? "/* retirer priceNote */" : `priceNote: "${e.priceNote}"`);
  }
  if (e.lineup !== undefined) bits.push(`lineup: [${e.lineup.map((n) => `"${esc(n)}"`).join(", ")}]`);
  if (e.desc !== undefined) bits.push(`desc: "${esc(e.desc)}"`);
  if (e.descEn !== undefined) {
    bits.push(e.descEn ? `descEn: "${esc(e.descEn)}"` : "/* retirer descEn */");
  }
  return bits.join(", ");
}
