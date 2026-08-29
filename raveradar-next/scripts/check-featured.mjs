#!/usr/bin/env node
/**
 * check:fresh, the highlight blocks must never show a finished event.
 *
 * The bug this guards against doesn't arrive in a diff. Nobody writes "put a past
 * event on the home page": someone writes `EVENTS.slice(0, 8)`, it looks right the
 * day it ships, and it rots on its own as the calendar moves under it. So the check
 * is on the *shape* of the code, not on today's output.
 *
 *   Part A, source guard. Every highlight goes through `featured()` / `nextUp()` /
 *            `liveEditions()` in lib/data.ts, which filter on the reference day.
 *            Reaching around them (slicing the raw catalogue, falling back to the
 *            archive when the live list is empty, reading `trending` by hand) fails.
 *   Part B, calendar report. No amount of filtering invents events: once the
 *            catalogue runs dry, correct code shows empty grids. Warn well before.
 *
 * Pure Node, no dependencies, no build needed: `npm run check:fresh`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SCANNED = ["components", "app", "lib"];
/** lib/data.ts *is* the implementation of the helpers, it is allowed to do all this. */
const EXEMPT = ["lib/data.ts", "scripts/check-featured.mjs"];

const RULES = [
  {
    // `EVENTS.slice(0, 8)`, the original sin: an ordering fixed at authoring time.
    re: /\b(EVENTS|FESTIVALS)\s*\.\s*slice\s*\(/g,
    msg: "slices the raw catalogue, use featured() / nextUp() / liveEditions(), which drop finished events",
  },
  {
    // `upcoming(FESTIVALS).length ? upcoming(FESTIVALS) : FESTIVALS`, the "never show
    // an empty block" reflex, which trades an empty block for a wrong one.
    re: /\?[^;\n]*:\s*(EVENTS|FESTIVALS)\b/g,
    msg: "falls back to the full catalogue when nothing is upcoming, leave the block empty instead",
  },
  {
    // `trending` is curation, not a date. Only featured() may read it, so that the flag
    // expires with the event instead of needing to be un-set by hand.
    re: /\.trending\b/g,
    msg: "reads the `trending` flag directly, featured() is what pairs it with the date filter",
  },
  {
    // `upcomingFirst()` leads with live dates but still carries the archive: fine for a
    // listing under its own heading, wrong the moment it is cut down to a highlight.
    re: /upcomingFirst\s*\([^)]*\)\s*\.\s*slice\s*\(/g,
    msg: "slices upcomingFirst(), that tail is the archive; use nextUp() for a highlight",
  },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
  });

const files = SCANNED.flatMap((d) => walk(join(ROOT, d)))
  .map((f) => relative(ROOT, f))
  .filter((f) => !EXEMPT.includes(f))
  .sort();

/* A listing the reader explicitly asked to see the archive of is not a highlight. Those
   exist (the "voir les éditions passées" toggle on /explore), so the escape hatch is a
   `fresh-ok:` comment on the line or just above it, with the reason spelled out, which
   is the whole point: an exception you have to justify in place is one you notice. */
const ALLOW = /fresh-ok:/;

const problems = [];
for (const file of files) {
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // a rule quoted in a comment isn't a call
    // Look back through the whole comment block above, not just one line: a reason worth
    // writing rarely fits on one, and a waiver that only works when terse invites terseness.
    let allowed = ALLOW.test(line);
    for (let j = i - 1; j >= 0 && !allowed && /^\s*(\/\/|\*|\/\*)/.test(lines[j]); j--) {
      allowed = ALLOW.test(lines[j]);
    }
    if (allowed) return;
    for (const { re, msg } of RULES) {
      re.lastIndex = 0;
      if (re.test(line)) problems.push({ file, line: i + 1, msg, src: line.trim() });
    }
  });
}

/* ---- Part B: is the calendar still stocked? ---------------------------------- */
const data = readFileSync(join(ROOT, "lib/data.ts"), "utf8");
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const events = [...data.matchAll(/\{\s*id:\s*\d+,[^\n]*?\bdate:\s*"(\d{4}-\d{2}-\d{2})"(?:[^\n]*?\bendDate:\s*"(\d{4}-\d{2}-\d{2})")?/g)].map(
  (m) => m[2] ?? m[1],
);
const live = events.filter((last) => last >= today);
const horizon = live.length ? live.slice().sort().pop() : null;
// The home grid asks for 8 and every hub for 4: below 8 the highlights start thinning.
const THIN = 8;

for (const { file, line, msg, src } of problems) {
  console.error(`✗ ${file}:${line}, ${msg}\n    ${src}`);
}

console.log(
  `\nCalendrier au ${today} : ${live.length} événement(s) à venir sur ${events.length}` +
    (horizon ? `, dernière date le ${horizon}.` : "."),
);
if (!live.length) {
  console.error("✗ Plus aucun événement à venir : tous les blocs de mise en avant seront vides.");
} else if (live.length < THIN) {
  console.warn(`⚠ Moins de ${THIN} dates à venir, les grilles de mise en avant vont se vider. Recharger le catalogue.`);
}

const failed = problems.length > 0 || live.length === 0;
console.log(failed ? "\ncheck:fresh, ÉCHEC" : `\ncheck:fresh, OK (${files.length} fichiers)`);
process.exit(failed ? 1 : 0);
