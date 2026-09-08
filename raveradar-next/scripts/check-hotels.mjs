/**
 * Refuse un catalogue dont les coordonnées ne peuvent pas porter le lien hôtel.
 *
 * Depuis que la recherche Booking est centrée sur `lat`/`lng` (voir `lib/hotels.ts`),
 * une coordonnée fausse ne se voit plus nulle part sur le site : la fiche affiche la
 * bonne ville, la carte du lieu est trop zoomée pour qu'un décalage de pays saute aux
 * yeux, et le lien part quand même. Le lecteur, lui, se voit proposer des hôtels à
 * 400 km. C'est le défaut le plus cher du bloc, et le seul que rien n'attrapait.
 *
 * Trois tests, tous sur des faits vérifiables :
 *
 * 1. **Le point est dans son pays.** Boîtes englobantes nationales, volontairement
 *    larges (la Corse pour la France, les Açores pour le Portugal, les Canaries pour
 *    l'Espagne) : le but est d'attraper un lat/lng inversé ou un signe perdu, pas de
 *    valider une adresse. Un pays absent de la table est une **erreur**, pas un
 *    laissez-passer, exactement la règle de `COUNTRY_FR` / `COUNTRY_FLAG` : c'est ce
 *    test qui rattrape un synonyme de pays arrivé par un lot de recherche.
 * 2. **La précision suffit.** Une coordonnée à une décimale, c'est 11 km : elle
 *    désigne l'agglomération, pas la salle, donc elle ne peut pas classer des hôtels
 *    par distance. Deux décimales (~1 km) est le minimum utile. C'est un
 *    **avertissement**, pas une erreur, et la nuance est voulue : une coordonnée
 *    grossière donne un lien moins bon, une coordonnée hors de son pays donne un lien
 *    faux. Bloquer le build sur la première reviendrait à demander de géocoder douze
 *    fiches anciennes avant de pouvoir corriger autre chose, et un garde-fou qu'on
 *    contourne ne garde plus rien.
 * 3. **`endDate` ne précède pas `date`.** Le séjour se calcule dessus, une date de
 *    fin antérieure rendrait une nuit négative ramenée à 1, donc un séjour faux et
 *    silencieux.
 *
 * Node pur, sans dépendance, même contrat que check-featured.mjs et check-rel.mjs :
 * `lib/data.ts` est lu au motif, pas compilé.
 *
 *     node scripts/check-hotels.mjs
 */
import { readFileSync } from "node:fs";

const DATA = new URL("../lib/data.ts", import.meta.url).pathname;

/* Boîtes englobantes nationales [latMin, latMax, lngMin, lngMax]. Larges exprès :
   elles servent à repérer une coordonnée qui a changé de pays, pas à géocoder. */
const BOX = {
  Albania: [39.6, 42.7, 19.2, 21.1], Austria: [46.3, 49.1, 9.5, 17.2],
  Belgium: [49.4, 51.6, 2.5, 6.5], "Bosnia and Herzegovina": [42.5, 45.3, 15.7, 19.7],
  Bulgaria: [41.2, 44.3, 22.3, 28.7], Croatia: [42.3, 46.6, 13.4, 19.5],
  Cyprus: [34.5, 35.8, 32.2, 34.7], "Czech Republic": [48.5, 51.1, 12.0, 18.9],
  Denmark: [54.5, 57.8, 8.0, 15.2], Estonia: [57.5, 59.8, 21.7, 28.3],
  Finland: [59.7, 70.2, 19.0, 31.7], France: [41.3, 51.2, -5.2, 9.7],
  Georgia: [41.0, 43.6, 39.9, 46.8], Germany: [47.2, 55.1, 5.8, 15.1],
  Greece: [34.7, 41.8, 19.3, 29.7], Hungary: [45.7, 48.6, 16.1, 22.9],
  Iceland: [63.2, 66.6, -24.6, -13.4], Ireland: [51.4, 55.5, -10.7, -5.9],
  Italy: [35.4, 47.1, 6.6, 18.6], Latvia: [55.6, 58.1, 20.9, 28.3],
  Lithuania: [53.8, 56.5, 20.9, 26.9], Luxembourg: [49.4, 50.2, 5.7, 6.6],
  Malta: [35.7, 36.1, 14.1, 14.6], Mexico: [14.5, 32.8, -118.5, -86.7],
  Montenegro: [41.8, 43.6, 18.4, 20.4], Netherlands: [50.7, 53.6, 3.3, 7.3],
  "North Macedonia": [40.8, 42.4, 20.4, 23.1], Norway: [57.9, 71.3, 4.0, 31.2],
  Poland: [49.0, 54.9, 14.1, 24.2], Portugal: [32.4, 42.2, -31.3, -6.1],
  Romania: [43.6, 48.3, 20.2, 29.8], Serbia: [42.2, 46.2, 18.8, 23.1],
  Slovakia: [47.7, 49.7, 16.8, 22.6], Slovenia: [45.4, 46.9, 13.3, 16.7],
  Spain: [27.5, 43.9, -18.3, 4.4], Sweden: [55.2, 69.1, 10.9, 24.2],
  Switzerland: [45.8, 47.9, 5.9, 10.6], UK: [49.8, 61.0, -8.7, 2.1],
};

/** Décimales significatives d'un nombre écrit dans la source. */
const decimals = (raw) => (raw.split(".")[1] ?? "").replace(/0+$/, "").length;

const src = readFileSync(DATA, "utf8");
const body = src.slice(src.indexOf("export const EVENTS"));
const lines = body.slice(0, body.indexOf("\n];")).split("\n").filter((l) => l.trimStart().startsWith("{ id:"));

const str = (l, k) => (l.match(new RegExp(`\\b${k}: "((?:[^"\\\\]|\\\\.)*)"`)) ?? [])[1];
const raw = (l, k) => (l.match(new RegExp(`\\b${k}: (-?[0-9.]+)`)) ?? [])[1];

const errors = [];
const warnings = [];
for (const l of lines) {
  const id = raw(l, "id");
  const country = str(l, "country");
  const city = str(l, "city") ?? "?";
  const where = `event ${id} (${city}, ${country})`;
  const latR = raw(l, "lat");
  const lngR = raw(l, "lng");

  if (!latR || !lngR) { errors.push(`${where} : pas de coordonnées, le lien hôtel n'a rien à centrer`); continue; }
  const lat = Number(latR), lng = Number(lngR);

  const box = BOX[country];
  if (!box) {
    errors.push(`${where} : pays absent de BOX (scripts/check-hotels.mjs). Nouveau pays, ou synonyme d'un pays existant ? Vérifier aussi COUNTRY_FR / COUNTRY_FLAG.`);
  } else if (lat < box[0] || lat > box[1] || lng < box[2] || lng > box[3]) {
    errors.push(`${where} : ${lat},${lng} est hors de ${country} [${box[0]}..${box[1]}, ${box[2]}..${box[3]}]. lat/lng inversés, ou un signe perdu ?`);
  }

  if (Math.min(decimals(latR), decimals(lngR)) < 2) {
    warnings.push(`${where} : ${lat},${lng} n'a qu'une décimale (~11 km). C'est l'agglomération, pas la salle : la recherche ne peut pas classer par distance.`);
  }

  const date = str(l, "date"), end = str(l, "endDate");
  if (end && end < date) errors.push(`${where} : endDate ${end} précède date ${date}, le séjour serait faux`);
}

if (warnings.length) {
  console.warn(`check:hotels - ${warnings.length} coordonnée(s) trop grossière(s) pour un classement par distance :\n`);
  for (const w of warnings) console.warn(`  ${w}`);
  console.warn("");
}
if (errors.length) {
  console.error(`check:hotels - ${errors.length} problème(s) bloquant(s) :\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check:hotels - ${lines.length} événements, ${warnings.length} avertissement(s), aucune coordonnée hors de son pays.`);
