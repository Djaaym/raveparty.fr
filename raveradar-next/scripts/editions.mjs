/**
 * Réécrit la map `EDITIONS` de `lib/editions.ts` depuis le catalogue.
 *
 * Le slug nu d'un festival appartient à l'édition qu'on veut faire lire et se déplace
 * donc d'une édition à l'autre. Le middleware a besoin de savoir, à la requête, quelle
 * forme suffixée est en train de doubler un slug nu, pour la rediriger en 301 au lieu
 * de la laisser tomber en 404. Il ne peut pas lire `lib/data.ts` (runtime edge, 868
 * événements dans un bundle exécuté à chaque requête), d'où cette table réduite.
 *
 * Node pur, sans dépendance, même contrat que check-featured.mjs et check-titles.mjs.
 * `lib/data.ts` est lu au motif, pas compilé : les événements y tiennent sur une ligne
 * chacun, et on n'en extrait que le titre, le type et les deux dates.
 *
 *     node scripts/editions.mjs [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = `${ROOT}lib/data.ts`;
const OUT = `${ROOT}lib/editions.ts`;
const DRY = process.argv.includes("--dry");

/* Copie conforme de `slugify()` (lib/display.ts) : un slug calculé autrement ici
   produirait des redirections vers des pages qui n'existent pas. */
const TRANSLIT = {
  "ø": "o", "Ø": "o", "đ": "d", "Đ": "d", "ð": "d", "Ð": "d", "ł": "l", "Ł": "l",
  "ß": "ss", "æ": "ae", "Æ": "ae", "œ": "oe", "Œ": "oe", "þ": "th", "Þ": "th",
  "ŧ": "t", "Ŧ": "t", "ı": "i", "ĸ": "k", "ŋ": "n", "Ŋ": "n", "ħ": "h", "Ħ": "h",
};
const slugify = (s) =>
  s
    .replace(/[øØđĐðÐłŁßæÆœŒþÞŧŦıĸŋŊħĦ]/g, (c) => TRANSLIT[c] ?? c)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const src = readFileSync(DATA, "utf8");
const start = src.indexOf("export const EVENTS");
const end = src.indexOf("\n];", start);
if (start < 0 || end < 0) throw new Error("EVENTS introuvable dans lib/data.ts");

const events = [];
for (const line of src.slice(start, end).split("\n")) {
  const l = line.trim();
  if (!l.startsWith("{ id:")) continue;
  // `esc()` de merge.py n'échappe que `\` et `"`, le motif de titre en tient compte.
  const title = /title: "((?:[^"\\]|\\.)*)"/.exec(l);
  const type = /type: "([^"]+)"/.exec(l);
  const date = /[,{] date: "(\d{4}-\d{2}-\d{2})"/.exec(l);
  const endDate = /endDate: "(\d{4}-\d{2}-\d{2})"/.exec(l);
  if (!title || !type || !date) throw new Error(`Événement illisible :\n    ${l.slice(0, 120)}`);
  events.push({
    title: title[1].replace(/\\(["\\])/g, "$1"),
    base: type[1] === "Festival" ? "festival" : "event",
    date: date[1],
    end: endDate ? endDate[1] : date[1],
  });
}

const byTitle = new Map();
for (const e of events) {
  if (!byTitle.has(e.title)) byTitle.set(e.title, []);
  byTitle.get(e.title).push(e);
}

const map = new Map();
for (const [title, list] of byTitle) {
  if (list.length < 2) continue; // Un titre à une seule édition n'a jamais de slug suffixé.
  const eds = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const years = eds.map((e) => e.date.slice(0, 4));
  if (new Set(years).size !== years.length) {
    // Deux éditions la même année portent déjà le même slug dans `eventSlug()` : c'est une
    // collision à corriger au catalogue (la convention est de mettre la salle dans le titre),
    // pas quelque chose qu'une redirection peut rattraper.
    console.warn(`⚠ « ${title} » a deux éditions la même année (${years.join(", ")}), slugs en collision.`);
  }
  map.set(slugify(title), eds.map((e) => ({ y: e.date.slice(0, 4), end: e.end, base: e.base })));
}

const body = [...map.keys()].sort().map((slug) => {
  const eds = map.get(slug).map((e) => `{ y: "${e.y}", end: "${e.end}", base: "${e.base}" }`);
  return `  ${/^[a-z][a-z0-9]*$/.test(slug) ? slug : `"${slug}"`}: [${eds.join(", ")}],`;
});
const block = `export const EDITIONS: Record<string, EditionRef[]> = {\n${body.join("\n")}\n};`;

const out = readFileSync(OUT, "utf8");
const S = "/* EDITIONS:start */\n";
const E = "\n/* EDITIONS:end */";
const a = out.indexOf(S);
const b = out.indexOf(E, a);
if (a < 0 || b < 0) throw new Error("Marqueurs EDITIONS:start/end introuvables dans lib/editions.ts");
const next = out.slice(0, a + S.length) + block + out.slice(b);

console.log(`editions — ${map.size} festival(s) à plusieurs éditions, ${events.length} événements lus.`);
if (DRY) {
  console.log(block);
} else if (next !== out) {
  writeFileSync(OUT, next);
  console.log("lib/editions.ts mis à jour.");
} else {
  console.log("lib/editions.ts déjà à jour.");
}
