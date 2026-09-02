#!/usr/bin/env node
/**
 * Garde-fou : tout lien sortant doit porter `nofollow`.
 *
 * Le maillage interne du site sert les pages du site. Un annuaire qui laisse suivre
 * ses liens vers 900 billetteries, sites d'organisateurs et comptes Instagram dilue
 * son autorité au lieu de la concentrer, et se rend solidaire de domaines qu'il ne
 * contrôle pas. La règle est simple à écrire et facile à oublier : six ancres
 * sortantes du dépôt n'avaient pas `nofollow` (billetterie, hôtel, programme d'un
 * guide, attribution de la carte), toutes ajoutées à des moments différents.
 *
 * Le `rel` d'une ancre sortante se construit donc avec `outboundRel()`
 * (`lib/display.ts`), jamais à la main. Ce script refuse les deux façons de
 * contourner : un `rel=` littéral sur une ancre externe, et une ancre externe sans
 * `rel` du tout. Node pur, aucune dépendance, comme check-featured et check-titles.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXT = /\.(tsx?|mjs)$/;
const files = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(n)) files.push(p);
  }
};
for (const r of ROOTS) walk(r);

/* Une ancre sortante, c'est un href absolu (`href="https://…"`) ou une expression
   dont on sait qu'elle sort du site (`ticketUrl`, `stay.url`, un permalien
   Instagram). On ne teste que la première forme, littérale : les autres passent
   toutes par `outboundRel()` et le script vérifie ce qu'elles rendent. */
const ANCHOR = /<a\b[^>]*>/g;
const bad = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(ANCHOR)) {
    const tag = m[0];
    const external = /href=["'`]https?:\/\//.test(tag) || /href=\{[^}]*(ticketUrl|stay\.url|postUrl|embedUrl|\.url\b)/.test(tag);
    if (!external) continue;
    if (/rel=\{\s*(outboundRel|ticketRel)\b/.test(tag)) continue;
    if (/rel=["'][^"']*\bnofollow\b/.test(tag)) continue;
    const line = src.slice(0, m.index).split("\n").length;
    bad.push(`${f}:${line}  ${tag.replace(/\s+/g, " ").slice(0, 110)}`);
  }
}

/* Le `rel` littéral écrit dans une chaîne HTML (l'attribution de la carte, le rendu
   du Markdown réduit) échappe au motif d'ancre JSX : on le vérifie sur la chaîne. */
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/<a href=\\?["'][^"'\\]*https?:\/\/[^>]*>/g)) {
    if (/nofollow/.test(m[0])) continue;
    const line = src.slice(0, m.index).split("\n").length;
    bad.push(`${f}:${line}  ${m[0].replace(/\s+/g, " ").slice(0, 110)}`);
  }
}

if (bad.length) {
  console.error(`check:rel — ${bad.length} lien(s) sortant(s) sans nofollow :\n`);
  for (const b of [...new Set(bad)]) console.error("  " + b);
  console.error(`\nUtiliser rel={outboundRel()} (ou outboundRel(true) pour un lien rémunéré).`);
  process.exit(1);
}
console.log(`check:rel — OK (${files.length} fichiers)`);
