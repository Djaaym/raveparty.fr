/**
 * La mise en forme légère d'une description d'événement.
 *
 * Un promoteur qui décrit sa soirée a besoin de trois choses, mettre un mot en avant,
 * lister les scènes, renvoyer vers une page. Pas d'un éditeur de texte : le catalogue
 * stocke `desc` en texte, et une description qui arriverait en HTML serait une porte
 * d'entrée pour tout ce qu'on ne veut pas rendre sur une fiche.
 *
 * Le format retenu est donc un Markdown réduit à quatre signes, écrit dans le champ et
 * posé par la barre d'outils :
 *
 *   **gras**            *italique*
 *   - un élément de liste          (une ligne par élément)
 *   [libellé](https://…)           (http/https seulement)
 *
 * Le rendu est fait ici, et **l'échappement vient avant tout le reste** : le texte est
 * neutralisé caractère par caractère, puis les quatre motifs sont reconnus dans le
 * résultat déjà échappé. Dans ce sens-là, aucune balise saisie ne peut survivre, et il
 * n'y a pas de liste noire à tenir à jour. C'est aussi ce qui autorise le
 * `dangerouslySetInnerHTML` de l'aperçu : ce qui en sort n'a jamais été du HTML d'entrée.
 *
 * Module **feuille** : rien d'importé, donc l'éditeur client peut s'en servir sans
 * tirer quoi que ce soit du catalogue.
 */

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Le lien n'est rendu que si son URL est bien http(s). Sinon il redevient son libellé,
 *  ce qui garde le texte lisible au lieu de le faire disparaître. */
function inline(escaped: string): string {
  return escaped
    .replace(/\[([^\]\n]{1,120})\]\((https?:\/\/[^\s)]{1,300})\)/g, (_m, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="nofollow noopener noreferrer">${label}</a>`)
    .replace(/\[([^\]\n]{1,120})\]\([^\s)]*\)/g, "$1")
    .replace(/\*\*([^*\n]{1,200})\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]{1,200})\*(?!\*)/g, "$1<em>$2</em>");
}

/** Le HTML de l'aperçu. Paragraphes séparés par une ligne vide, listes par des `- `. */
export function renderRich(raw: string): string {
  const lines = escapeHtml(raw.replace(/\r\n/g, "\n")).split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushList();
      flushPara();
      continue;
    }
    const item = t.match(/^[-*&#x2022;]\s+(.*)$/);
    if (item) {
      flushPara();
      list.push(item[1]);
    } else {
      flushList();
      para.push(t);
    }
  }
  flushList();
  flushPara();
  return out.join("");
}

/** La même chose en texte nu, pour le mail du propriétaire et pour compter les signes :
 *  un « **gras** » ne doit pas coûter quatre caractères au lecteur qui écrit. */
export function plainRich(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]\n]{1,120})\]\((https?:\/\/[^\s)]{1,300})\)/g, "$1 ($2)")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/^[ \t]*[-*][ \t]+/gm, "• ");
}

/** Le nombre de signes réellement écrits, hors marques de mise en forme. */
export const richLength = (raw: string): number => plainRich(raw).trim().length;
