import type { RaveEvent } from "./types";
import { lastDay } from "./display";

/**
 * Le fichier iCalendar d'un événement.
 *
 * Une fiche ne proposait ni d'ajouter la date à un agenda ni de l'envoyer à
 * quelqu'un : sur un annuaire d'événementiel, où une sortie se décide à plusieurs et
 * se note des semaines à l'avance, ce sont les deux gestes qui suivent « j'ai trouvé
 * la soirée que je cherchais ».
 *
 * Le format est celui de la RFC 5545, écrit à la main : quinze lignes de texte ne
 * justifient pas une dépendance, et le peu qu'il faut savoir tient dans les
 * commentaires ci-dessous.
 *
 * Module **feuille** (il ne tire que le type et `lastDay`) pour rester utilisable
 * depuis une route d'API sans embarquer le catalogue.
 */

/**
 * Échappe une valeur de propriété.
 *
 * La virgule, le point-virgule et la barre oblique inverse sont des séparateurs dans
 * la grammaire iCalendar : un titre comme « Bugged Out: 2001&On… » passe, mais
 * « Techno, House & Co » couperait la propriété en deux valeurs et la plupart des
 * agendas afficheraient un titre tronqué, sans erreur.
 */
const esc = (v: string): string =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** `20260911T230000` — l'heure locale de l'événement, sans décalage. */
const stamp = (date: string, time: string): string =>
  `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

/** `20260912` — une date seule, pour un événement qui dure des jours entiers. */
const dateOnly = (date: string): string => date.replace(/-/g, "");

/** Le lendemain, en date seule : `DTEND` d'un événement en jours entiers est exclusif. */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Replie une ligne à 75 octets, comme l'exige la RFC.
 *
 * Ce n'est pas de la cosmétique : au-delà, certains clients (Outlook au premier chef)
 * tronquent la ligne au lieu de la lire, et une description un peu longue emporte avec
 * elle la propriété suivante. Le pliage se fait sur les **octets** et non sur les
 * caractères, un « é » en compte deux, et couper au milieu d'un caractère produit du
 * texte illisible.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    // 74 pour la première ligne, 73 pour les suivantes (l'espace de continuation compte).
    let end = Math.min(start + (out.length === 0 ? 74 : 73), bytes.length);
    // Ne pas couper au milieu d'une séquence UTF-8 : on recule tant qu'on est sur un
    // octet de continuation (10xxxxxx).
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
  }
  return out.join("\r\n ");
}

/**
 * Le corps du `.ics` d'un événement.
 *
 * `DTSTART` porte l'heure locale **sans fuseau déclaré** (« heure flottante ») : le
 * catalogue ne stocke pas de fuseau, seulement une heure locale de porte, et déclarer
 * un décalage qu'on ne connaît pas décalerait la soirée d'une ou deux heures sur
 * l'agenda du lecteur, ce qui est pire que pas de fuseau du tout. Une soirée annoncée
 * à 23 h se note à 23 h, ce qui est exactement ce qu'attend quelqu'un qui y va.
 *
 * Un festival de plusieurs jours devient un événement en **jours entiers** : personne
 * n'a besoin d'un rendez-vous de 72 heures dans son agenda, et l'heure de porte d'un
 * festival ne veut rien dire pour les jours suivants.
 */
export function eventIcs(e: RaveEvent, url: string, desc: string): string {
  const multi = Boolean(e.endDate && e.endDate !== e.date);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RaveRadar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Un identifiant stable : réimporter le même fichier met à jour l'entrée au lieu
    // d'en créer une seconde.
    `UID:rr-${e.id}@raveparty.fr`,
    // `DTSTAMP` est obligatoire. Il vaut la date de l'événement et non l'heure du
    // build : une valeur qui change à chaque déploiement ferait réécrire le fichier
    // sans que rien n'ait bougé, et les caches d'agenda s'en servent.
    `DTSTAMP:${stamp(e.date, "00:00")}Z`,
    multi
      ? `DTSTART;VALUE=DATE:${dateOnly(e.date)}`
      : `DTSTART:${stamp(e.date, e.time)}`,
    multi
      ? `DTEND;VALUE=DATE:${nextDay(lastDay(e))}`
      : // Sans `DTEND`, un agenda invente une durée. Six heures est la durée d'une
        // soirée de club, et c'est mieux qu'une heure (qui suggère un concert) ou que
        // rien (qui bloque la journée chez certains clients).
        `DTEND:${stamp(e.date, e.time).replace(/T(\d{2})/, (_, h) => `T${String((Number(h) + 6) % 24).padStart(2, "0")}`)}`,
    fold(`SUMMARY:${esc(e.title)}`),
    fold(`LOCATION:${esc(`${e.venue}, ${e.city}`)}`),
    fold(`DESCRIPTION:${esc(`${desc}\n\n${url}`)}`),
    fold(`URL:${esc(url)}`),
    `GEO:${e.lat};${e.lng}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // CRLF, exigé par la RFC : un fichier en LF seul est refusé par certains clients.
  return lines.join("\r\n") + "\r\n";
}
