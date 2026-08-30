/**
 * Aucun cadratin dans un titre de page.
 *
 * « RaveRadar — Rave parties… » est correct en typographie française, mais un titre de
 * recherche n'est pas un paragraphe : Google le tronque à la largeur, et le cadratin y
 * prend la place de trois signes pour séparer ce qu'un trait d'union sépare aussi bien.
 * La règle est donc `-` partout, FR et EN.
 *
 * `seoTitle()` (lib/seo.ts) normalise ce qui passe par `pageMeta()` — donc les titres
 * construits depuis le catalogue, où le cadratin est légitime côté données (« BLITZ
 * Closing Weekend — That's All Folks » est le vrai nom de la soirée). Ce script couvre
 * l'autre moitié : les titres écrits en dur dans les quarante fichiers de route, que
 * rien n'oblige à traverser `pageMeta()`.
 *
 * Node pur, sans dépendance — même contrat que check-featured.mjs.
 *
 *     node scripts/check-titles.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DASHES = /[‒-―]/; // ‒ – — ―
const ROOT = new URL("..", import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") || p.endsWith(".ts") ? [p] : [];
  });
}

const bad = [];
for (const file of walk(join(ROOT, "app"))) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      // Un `title:` de Metadata, pas un attribut `title=` de JSX ni une clé de données.
      if (/(^|[\s{])title: /.test(line) && DASHES.test(line)) {
        bad.push(`${file.replace(ROOT, "")}:${i + 1}\n    ${line.trim()}`);
      }
    });
}

if (bad.length) {
  console.error(`\ncheck:titles — ${bad.length} titre(s) de page avec un cadratin ou un tiret demi-cadratin.`);
  console.error("Le séparateur d'un meta title est le trait d'union « - ».\n");
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}
console.log("check:titles — OK (aucun cadratin dans un titre de page)");
