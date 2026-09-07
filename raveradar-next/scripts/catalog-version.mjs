/**
 * Écrit dans `lib/catalog-version.ts` la date du dernier changement du catalogue.
 *
 * Elle sert au `lastmod` du sitemap. Celui-ci valait `new Date()` pour ses 13 554
 * URLs, réécrit à chaque déploiement : un `lastmod` que tout porte et qui bouge à
 * chaque build ne distingue plus rien, Google le traite comme du bruit, et on perd le
 * seul moyen de dire « ces quarante fiches ont bougé, les treize mille autres non ».
 *
 * La date vient de **git**, pas de l'horloge : c'est la date du dernier commit qui a
 * touché `lib/data.ts`, donc la dernière fois que le catalogue a vraiment changé. Un
 * redéploiement qui ne touche pas aux données ne la fait plus bouger.
 *
 * Le fichier est **généré et versionné**, comme `lib/editions.ts`. C'est ce qui le rend
 * juste sur Vercel, dont le build n'a pas le dépôt git : le script n'écrit que s'il
 * obtient une vraie date, sinon il laisse en place la valeur commitée. Écraser une date
 * exacte par la date du build reproduirait exactement le défaut qu'on corrige.
 *
 *     node scripts/catalog-version.mjs [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = `${ROOT}lib/catalog-version.ts`;
const DRY = process.argv.includes("--dry");

/** La date du dernier commit touchant le catalogue, ou `null` si git ne répond pas. */
function gitDate() {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", "lib/data.ts"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    // Un dépôt sans historique (archive, clone superficiel sur la mauvaise branche)
    // rend une chaîne vide : c'est une absence de réponse, pas une date.
    return /^\d{4}-\d{2}-\d{2}T/.test(out) ? out : null;
  } catch {
    return null;
  }
}

const date = gitDate();
if (!date) {
  console.log("catalog-version : git muet, la valeur commitée est conservée.");
  process.exit(0);
}

const body = `// Généré par \`node scripts/catalog-version.mjs\` (branché sur \`prebuild\`). Ne pas éditer.
//
// La date du dernier commit touchant \`lib/data.ts\`, c'est-à-dire la dernière fois que
// le catalogue a changé. Le sitemap s'en sert pour son \`lastmod\` : voir l'en-tête de
// \`app/sitemap.ts\` pour la raison, et le script pour pourquoi ce fichier est versionné.
export const CATALOG_UPDATED = "${date}";
`;

const before = (() => {
  try {
    return readFileSync(OUT, "utf8");
  } catch {
    return "";
  }
})();

if (before === body) {
  console.log(`catalog-version : inchangé (${date}).`);
} else if (DRY) {
  console.log(`catalog-version : écrirait ${date}.`);
} else {
  writeFileSync(OUT, body);
  console.log(`catalog-version : ${date}.`);
}
