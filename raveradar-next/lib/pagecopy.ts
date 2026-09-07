import type { Lang, RaveEvent } from "./types";
import type { Artist } from "./artists";
import type { Venue } from "./venues";
import { countryLabel, eventVenueL, isPast, lastDay, slugify, upcoming } from "./data";
import { priceLabel } from "./format";
import { genreProfile, pickL } from "./genres";
import { guideFor } from "./guides";
import { isMultiVenueLabel } from "./venues";
import { DICT } from "./i18n";

/**
 * Le texte que les pages profondes n'avaient pas.
 *
 * Les pages qui portent le référencement du site (une fiche festival, une fiche
 * artiste, une fiche de salle, une page pays) affichaient une phrase d'introduction
 * engendrée puis, tout de suite, des grilles de cartes. Une grille se lit très bien,
 * mais elle ne répond à aucune des questions qu'on tape avant d'arriver : « où se
 * trouve tel festival », « quel est le programme de telle salle », « quand joue tel
 * artiste », « combien coûtent les billets ». Les relevés de positions le montrent en
 * clair, ces formulations existent (« wo ist das nibirii festival », « ritter butzke
 * programm », « amelie lens agenda », « parookaville tickets 2026») et nos pages se
 * classaient dessus sans jamais y répondre en toutes lettres.
 *
 * Deux règles président à tout ce module, et elles sont la raison de sa forme :
 *
 * 1. **Rien n'est écrit à la main pour une page en particulier.** Chaque phrase est
 *    engendrée depuis le catalogue, comme la FAQ de `/genres/{style}`. Une page ne
 *    peut donc pas se périmer sans qu'on s'en aperçoive : la donnée change, le texte
 *    suit. Écrire quatre cents paragraphes à la main reviendrait à publier quatre
 *    cents affirmations qu'on ne re-vérifierait jamais, ce que la règle de contenu
 *    du projet interdit.
 * 2. **On ne comble pas un trou avec une phrase creuse.** Sans line-up, on dit que le
 *    line-up n'est pas publié ; sans tarif confirmé, on dit que le tarif est indicatif.
 *    Une réponse vide vaut mieux qu'une réponse fausse, et la question est simplement
 *    retirée de la FAQ quand la donnée n'existe pas.
 *
 * Module serveur : il tire `lib/data.ts`, donc aucun composant client ne doit
 * l'importer (cf. la règle du bundle de 218 Ko).
 */

/** Une question et sa réponse, la forme qu'attend `faqJsonLd()`. */
export type QA = [string, string];

const s = (n: number) => (n > 1 ? "s" : "");
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/**
 * « la seule date » / « les 3 dates ».
 *
 * `les ${n} date${s(n)}` donne « les 1 date » au singulier, faute que seul le rendu
 * montre, et qui suffit à signaler un texte fabriqué. Le singulier prend sa propre
 * tournure plutôt qu'un article pluriel devant un nombre.
 */
const countPhrase = (n: number, lang: Lang): string =>
  lang === "fr"
    ? n === 1
      ? "la seule date"
      : `les ${n} dates`
    : n === 1
      ? "the single date"
      : `the ${n} dates`;

/** « a, b et c » / « a, b and c ». Un « , » final se lit comme une liste tronquée. */
function join(xs: string[], lang: Lang): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} ${lang === "fr" ? "et" : "and"} ${xs[xs.length - 1]}`;
}

/**
 * « aux Pays-Bas », pas « en Pays-Bas ».
 *
 * Le catalogue stocke un nom de pays, et une phrase engendrée a besoin de l'article
 * contracté qui va avec. Le français n'en a pas de règle sûre (le Danemark ne finit
 * pas par un e et reste masculin, Malte n'a pas d'article du tout), donc c'est une
 * table, tenue sur les clés de `COUNTRY_FR`, avec « en » pour défaut : c'est la forme
 * qui va aux pays féminins, l'immense majorité de la liste, et un pays qui manque se
 * lit mal une fois plutôt que de faire planter la page. L'anglais n'a que le cas de
 * l'article défini (« in the Netherlands »), d'où la seconde liste.
 *
 * Ce n'est pas de la cosmétique : « festival techno aux Pays-Bas » est la requête,
 * « en Pays-Bas » n'est tapé par personne et signale un texte engendré à la va-vite.
 */
const FR_AU = new Set(["Royaume-Uni", "Danemark", "Portugal", "Luxembourg", "Mexique", "Monténégro"]);
const FR_AUX = new Set(["Pays-Bas", "États-Unis"]);
const FR_A = new Set(["Malte", "Chypre", "Monaco", "Andorre"]);
const EN_THE = new Set(["Netherlands", "UK", "Czech Republic", "United States"]);

/** « en France » / « aux Pays-Bas » / « in the Netherlands ». */
export function inCountry(name: string, lang: Lang): string {
  const label = countryLabel(name, lang);
  if (lang === "en") return `in ${EN_THE.has(name) ? "the " : ""}${label}`;
  if (FR_AUX.has(label)) return `aux ${label}`;
  if (FR_AU.has(label)) return `au ${label}`;
  if (FR_A.has(label)) return `à ${label}`;
  return `en ${label}`;
}

/** Le nom seul, mais précédé de son article anglais quand il en prend un. */
export const theCountry = (name: string, lang: Lang): string =>
  lang === "en" && EN_THE.has(name) ? `the ${countryLabel(name, lang)}` : countryLabel(name, lang);

const day = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(DICT[lang].locale, { day: "numeric", month: "long" });

/** « mercredi 10 », le premier jour d'un festival dont le mois est porté par le second. */
const weekDay = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(DICT[lang].locale, { weekday: "long", day: "numeric" });

/** « mercredi 10 juin », quand les deux jours ne tombent pas dans le même mois. */
const shortDay = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(DICT[lang].locale, { weekday: "long", day: "numeric", month: "long" });

/**
 * « samedi 12 septembre 2026 », le format qu'on lit dans une phrase (fmtDate() crie).
 *
 * en-GB place une virgule après le jour de semaine (« Sunday, 13 June 2027 ») là où
 * le format court n'en met pas : dans « from Thursday 10 to Sunday, 13 June » elle
 * tombe au milieu d'un intervalle. On la retire, les deux bouts s'écrivent pareil.
 */
const fullDay = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`)
    .toLocaleDateString(DICT[lang].locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .replace(/^(\S+), /, "$1 ");

const monthYear = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(DICT[lang].locale, { month: "long", year: "numeric" });

const days = (e: RaveEvent) =>
  Math.round((Date.parse(lastDay(e)) - Date.parse(e.date)) / 86400000) + 1;

/**
 * « le samedi 12 septembre 2026 » / « du mercredi 10 au dimanche 13 juin 2027 ».
 *
 * Le mois n'est écrit qu'une fois quand les deux jours tombent dedans : « du 10 juin
 * au 13 juin 2027 » se lit comme deux dates sans rapport.
 */
function whenPhrase(e: RaveEvent, lang: Lang): string {
  const end = lastDay(e);
  if (end === e.date) return lang === "fr" ? `le ${fullDay(e.date, lang)}` : `on ${fullDay(e.date, lang)}`;
  const sameMonth = e.date.slice(0, 7) === end.slice(0, 7);
  const from = sameMonth ? weekDay(e.date, lang) : shortDay(e.date, lang);
  return lang === "fr" ? `du ${from} au ${fullDay(end, lang)}` : `from ${from} to ${fullDay(end, lang)}`;
}

/**
 * « Le Bikini, Toulouse, France », la localisation complète en une incise.
 *
 * Un programme éclaté dans toute une ville n'a pas de salle : son `venue` est une
 * périphrase (« Divers lieux / various venues », « Dix lieux à Sheffield et
 * Rotherham »), et l'écrire là où on attend un nom de salle produit exactement le
 * `/lieux/300-lieux-dans-amsterdam` que le projet refuse, sous forme de phrase. On
 * tombe alors sur la ville, qui est l'information vraie. Même test que `VENUES`.
 */
const umbrella = (e: RaveEvent): boolean => Boolean(guideFor(e)) || isMultiVenueLabel(e.venue);

function wherePhrase(e: RaveEvent, lang: Lang): string {
  const region = e.region && slugify(e.region) !== slugify(e.city) ? ` (${e.region})` : "";
  const place = `${e.city}${region}, ${countryLabel(e.country, lang)}`;
  return umbrella(e) ? place : `${eventVenueL(e, lang)}, ${place}`;
}

/**
 * Le tarif, dit honnêtement.
 *
 * `priceLabel()` rend le montant, il ne dit pas ce qu'il vaut : un « ≈ 45 € » sans
 * explication se lit comme un prix ferme. Les trois cas du catalogue (confirmé,
 * indicatif, non publié) ont donc chacun leur phrase, et l'entrée libre n'est jamais
 * annoncée par défaut.
 */
function pricePhrase(e: RaveEvent, lang: Lang): string {
  const label = priceLabel(e, lang);
  if (e.priceNote === "unknown") {
    return lang === "fr"
      ? "L'organisateur n'a pas encore publié de tarif. La fiche est mise à jour dès l'ouverture de la billetterie."
      : "The promoter has not published a price yet. This page is updated as soon as tickets go on sale.";
  }
  if (e.price === 0) {
    return lang === "fr"
      ? "L'entrée est libre : aucun billet n'est vendu pour cette date."
      : "Entry is free: no ticket is sold for this date.";
  }
  if (e.priceNote === "estimated") {
    return lang === "fr"
      ? `Comptez autour de ${label} pour le tarif d'entrée le plus bas. Ce montant est indicatif tant que la billetterie officielle ne l'a pas confirmé, vérifiez-le avant d'acheter.`
      : `Expect around ${label} for the cheapest entry ticket. That figure is indicative until the official ticket shop confirms it, so check before buying.`;
  }
  return lang === "fr"
    ? `Le tarif d'entrée le plus bas relevé est de ${label}. Les paliers suivants et les pass plusieurs jours sont vendus plus cher, et une place peut être épuisée avant les autres.`
    : `The cheapest entry ticket we recorded is ${label}. Later tiers and multi-day passes cost more, and a tier can sell out before the others.`;
}

/* ------------------------------------------------------------------ événement */

export interface EventCopy {
  /** Deux ou trois phrases de contexte, sous la description de l'organisateur. */
  context: string;
  faq: QA[];
}

/**
 * Le contexte et la FAQ d'une fiche événement.
 *
 * Le paragraphe de contexte ne répète pas la description : celle-ci dit ce qu'est
 * l'événement, celui-là dit où il se place, combien de noms sont annoncés et ce qui
 * se passe autour, la seule chose que le lecteur ne peut pas déduire de la fiche
 * seule. Les événements portant un guide (ADE et consorts) sont exclus : ils ont
 * déjà leur intro longue et leur FAQ écrites à la main.
 */
export function eventCopy(e: RaveEvent, lang: Lang, opts: { next?: RaveEvent; today?: string } = {}): EventCopy {
  const done = isPast(e, opts.today);
  const n = days(e);
  const head = e.lineup[0]?.trim();
  const names = e.lineup.slice(0, 8).map((a) => a.trim());
  const rest = e.lineup.length - names.length;
  const genres = join(e.genres, lang);
  const where = inCountry(e.country, lang);
  const prof = genreProfile(e.genres[0]);

  /* Les autres dates du même genre et du même pays : c'est ce qui situe une soirée
     dans une saison, et c'est vrai par construction puisque ça sort du calendrier. */
  const near = upcoming(undefined, opts.today).filter(
    (x) => x.id !== e.id && x.country === e.country && x.genres.some((g) => e.genres.includes(g)),
  ).length;

  const lineupFr = head
    ? `${e.lineup.length} nom${s(e.lineup.length)} ${e.lineup.length > 1 ? "sont annoncés" : "est annoncé"} au line-up, en tête ${head}.`
    : "Le line-up n'est pas encore publié : nous le complétons dès que l'organisateur l'annonce.";
  const lineupEn = head
    ? `${e.lineup.length} name${s(e.lineup.length)} ${e.lineup.length > 1 ? "are" : "is"} on the bill, led by ${head}.`
    : "The line-up has not been published yet: we add it as soon as the promoter announces it.";

  const context =
    lang === "fr"
      ? [
          `${e.title} ${done ? "s'est tenu" : "se tient"} ${whenPhrase(e, lang)} à ${wherePhrase(e, lang)}${
            n > 1 ? `, soit ${n} jours de programmation` : ""
          }.`,
          lineupFr,
          near > 0
            ? `C'est l'une des ${near + 1} dates ${genres} référencées ${where} sur les mois à venir.`
            : `C'est pour l'instant la seule date ${genres} que nous référençons ${where}.`,
        ].join(" ")
      : [
          `${e.title} ${done ? "took place" : "takes place"} ${whenPhrase(e, lang)} at ${wherePhrase(e, lang)}${
            n > 1 ? `, across ${n} days` : ""
          }.`,
          lineupEn,
          near > 0
            ? `It is one of ${near + 1} ${genres} dates we list ${where} over the coming months.`
            : `It is currently the only ${genres} date we list ${where}.`,
        ].join(" ");

  const faq: QA[] = [];

  faq.push(
    lang === "fr"
      ? [
          `Quand a lieu ${e.title} ?`,
          `${cap(whenPhrase(e, lang))}${n > 1 ? `, sur ${n} jours` : ""}, à ${umbrella(e) ? e.city : eventVenueL(e, lang)}. ${
            done
              ? `Cette édition est terminée.${opts.next ? ` La suivante est annoncée ${whenPhrase(opts.next, lang)}.` : " Aucune date suivante n'est annoncée pour l'instant."}`
              : `L'ouverture des portes est annoncée à ${e.time}, l'horaire de fin dépend de la programmation du soir.`
          }`,
        ]
      : [
          `When is ${e.title}?`,
          `${cap(whenPhrase(e, lang))}${n > 1 ? `, over ${n} days` : ""}, at ${umbrella(e) ? e.city : eventVenueL(e, lang)}. ${
            done
              ? `This edition is over.${opts.next ? ` The next one is announced ${whenPhrase(opts.next, lang)}.` : " No follow-up date is announced yet."}`
              : `Doors are announced for ${e.time}; the closing time depends on the night's programme.`
          }`,
        ],
  );

  faq.push(
    lang === "fr"
      ? [
          `Où se déroule ${e.title} ?`,
          `À ${wherePhrase(e, lang)}. La fiche affiche la carte du lieu et, juste en dessous, une recherche d'hébergement aux dates de l'événement.`,
        ]
      : [
          `Where is ${e.title} held?`,
          `At ${wherePhrase(e, lang)}. This page shows the venue on a map and, just below it, a place-to-stay search matched to the event dates.`,
        ],
  );

  faq.push(
    lang === "fr"
      ? [
          `Qui joue à ${e.title} ?`,
          head
            ? `${join(names, lang)}${rest > 0 ? `, plus ${rest} autre${s(rest)} nom${s(rest)}` : ""}. Chaque nom renvoie vers sa fiche artiste, avec son agenda complet.`
            : `La programmation n'est pas encore annoncée. Les affiches tombent en général deux à quatre mois avant la date, et cette page est mise à jour à ce moment-là.`,
        ]
      : [
          `Who is playing at ${e.title}?`,
          head
            ? `${join(names, lang)}${rest > 0 ? `, plus ${rest} more name${s(rest)}` : ""}. Every name links to its artist page and full calendar.`
            : `The line-up has not been announced yet. Bills usually land two to four months before the date, and this page is updated then.`,
        ],
  );

  faq.push(
    lang === "fr"
      ? [`Combien coûtent les billets pour ${e.title} ?`, `${pricePhrase(e, lang)} Le bouton de billetterie de cette page renvoie vers le guichet officiel de l'organisateur, jamais vers de la revente.`]
      : [`How much are tickets for ${e.title}?`, `${pricePhrase(e, lang)} The ticket button on this page points at the promoter's official shop, never at resale.`],
  );

  if (prof) {
    faq.push(
      lang === "fr"
        ? [
            `${e.title}, c'est quel style de musique ?`,
            `${cap(genres)}. ${pickL(prof.tell, lang)} Le tempo tourne le plus souvent autour de ${prof.bpm} BPM sur ce style.`,
          ]
        : [
            `What kind of music is played at ${e.title}?`,
            `${cap(genres)}. ${pickL(prof.tell, lang)} That style usually sits around ${prof.bpm} BPM.`,
          ],
    );
  }

  return { context, faq };
}

/* --------------------------------------------------------------------- artiste */

export interface ArtistCopy {
  context: string;
  faq: QA[];
}

/**
 * Le contexte et la FAQ d'une fiche artiste.
 *
 * L'introduction existante annonce un nombre de dates ; elle ne dit pas laquelle est
 * la prochaine, ni où, ce qui est pourtant la requête qu'on tape (« amelie lens
 * agenda », « angerfist tour », « paranoid london upcoming events »). Les genres
 * viennent d'`artistGenres()`, jamais de l'union brute : voir la règle du dépôt.
 */
export function artistCopy(
  a: Artist,
  lang: Lang,
  ctx: { live: RaveEvent[]; done: RaveEvent[]; genres: string[]; subs: string[]; origin?: string },
): ArtistCopy {
  const { live, done, genres, subs, origin } = ctx;
  const next = live[0];
  const cities = [...new Set(live.map((e) => e.city))].slice(0, 6);
  const countries = [...new Set(live.map((e) => e.country))].map((c) => countryLabel(c, lang));
  const venues = [...new Set(live.filter((e) => !umbrella(e)).map((e) => eventVenueL(e, lang)))].slice(0, 5);
  const styles = [...genres, ...subs];
  const prof = genreProfile(genres[0]);

  const nextFr = next
    ? `Sa prochaine date référencée est ${next.title}, ${whenPhrase(next, lang)} à ${wherePhrase(next, lang)}.`
    : `Aucune date à venir n'est référencée pour l'instant. Les bookings se confirment le plus souvent deux à quatre mois avant la soirée.`;
  const nextEn = next
    ? `Their next listed date is ${next.title}, ${whenPhrase(next, lang)} at ${wherePhrase(next, lang)}.`
    : `No upcoming date is listed right now. Bookings are usually confirmed two to four months before the night.`;

  const context =
    lang === "fr"
      ? [
          nextFr,
          live.length > 1 ? `L'agenda complet couvre ${live.length} dates${cities.length ? `, à ${join(cities, lang)}` : ""}.` : "",
          done.length > 0
            ? `${done.length} apparition${s(done.length)} passée${s(done.length)} rest${done.length > 1 ? "ent" : "e"} consultable${s(done.length)} plus bas, avec le line-up de chaque soirée.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          nextEn,
          live.length > 1 ? `The full calendar covers ${live.length} dates${cities.length ? `, in ${join(cities, lang)}` : ""}.` : "",
          done.length > 0
            ? `${done.length} past appearance${s(done.length)} stay${done.length > 1 ? "" : "s"} browsable below, each with the line-up of the night.`
            : "",
        ]
          .filter(Boolean)
          .join(" ");

  const faq: QA[] = [];

  faq.push(
    lang === "fr"
      ? [
          `Quand joue ${a.name} pour la prochaine fois ?`,
          next
            ? `${cap(whenPhrase(next, lang))}, pour ${next.title} à ${wherePhrase(next, lang)}.${live.length > 1 ? ` ${live.length - 1} autre${s(live.length - 1)} date${s(live.length - 1)} suivent, listées sur cette page.` : ""}`
            : `Aucune date à venir n'est référencée. Une alerte sur cette page vous prévient dès qu'une nouvelle soirée est publiée.`,
        ]
      : [
          `When is ${a.name} playing next?`,
          next
            ? `${cap(whenPhrase(next, lang))}, for ${next.title} at ${wherePhrase(next, lang)}.${live.length > 1 ? ` ${live.length - 1} further date${s(live.length - 1)} follow, all listed on this page.` : ""}`
            : `No upcoming date is listed. Set an alert on this page and we will tell you as soon as a new one is published.`,
        ],
  );

  if (live.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Où voir ${a.name} en ce moment ?`,
            `${countries.length ? `${join(countries, lang)}` : ""}${cities.length ? `, à ${join(cities, lang)}` : ""}${venues.length ? `. Salles concernées : ${join(venues, lang)}.` : "."} Chaque fiche donne l'horaire, le tarif et la billetterie officielle.`,
          ]
        : [
            `Where can I see ${a.name} right now?`,
            `${countries.length ? `${join(countries, lang)}` : ""}${cities.length ? `, in ${join(cities, lang)}` : ""}${venues.length ? `. Rooms involved: ${join(venues, lang)}.` : "."} Each listing gives the running time, the price and the official ticket shop.`,
          ],
    );
  }

  if (styles.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quel style joue ${a.name} ?`,
            `${join(styles, lang)}.${prof ? ` ${pickL(prof.tell, lang)} Le tempo tourne le plus souvent autour de ${prof.bpm} BPM.` : ""} Les styles affichés sont ceux que l'artiste défend, pas l'étiquetage complet des affiches où il apparaît.`,
          ]
        : [
            `What style does ${a.name} play?`,
            `${join(styles, lang)}.${prof ? ` ${pickL(prof.tell, lang)} The tempo usually sits around ${prof.bpm} BPM.` : ""} The styles shown are the ones the artist actually carries, not the full tagging of every bill they appear on.`,
          ],
    );
  }

  /* Seulement quand la bio sourcée le dit. Déduire une origine du calendrier serait
     une affirmation inventée sur une personne réelle, exactement ce que le projet
     refuse ailleurs (cf. `ARTIST_STYLES` et la règle du portrait). */
  if (origin) {
    faq.push(
      lang === "fr"
        ? [`D'où vient ${a.name} ?`, `${origin}. Cette information vient des sources citées sous la biographie, en haut de page.`]
        : [`Where is ${a.name} from?`, `${origin}. That comes from the sources cited under the biography at the top of this page.`],
    );
  }

  return { context, faq };
}

/* ------------------------------------------------------------------------ lieu */

export interface VenueCopy {
  context: string;
  faq: QA[];
}

/**
 * Le contexte et la FAQ d'une fiche de salle.
 *
 * Les requêtes relevées sur ces pages sont presque toutes des demandes de programme
 * (« ritter butzke programm », « maassilo agenda », « programme transbordeur ») :
 * la page doit donc dire en toutes lettres ce qui est à l'affiche et quand, pas
 * seulement l'afficher en grille.
 *
 * Aucune adresse postale n'est écrite : le catalogue stocke des coordonnées, pas une
 * rue. On donne la ville, le pays et le département, et la carte fait le reste.
 */
export function venueCopy(
  v: Venue,
  lang: Lang,
  ctx: { name: string; live: RaveEvent[]; done: RaveEvent[]; genres: string[]; regulars: string[]; kind?: RaveEvent["type"] },
): VenueCopy {
  const { name, live, done, genres, regulars, kind } = ctx;
  const next = live[0];
  const country = countryLabel(v.country, lang);
  const kindFr = kind === "Club" ? "un club" : kind === "Warehouse" ? "un entrepôt" : kind === "Festival" ? "un site de festival" : "une salle";
  const kindEn = kind === "Club" ? "a club" : kind === "Warehouse" ? "a warehouse" : kind === "Festival" ? "a festival site" : "a venue";
  const region = v.region && slugify(v.region) !== slugify(v.city) ? ` (${v.region})` : "";
  /* Le reliquat est un élément de la liste, pas une queue ajoutée après coup :
     « A, B, C et D, et 2 autres » porte deux « et » et se lit comme une faute. */
  const shown = live.slice(0, 4).map((e) => `${e.title} (${day(e.date, lang)})`);
  const more = live.length - shown.length;
  const upcomingTitles =
    more > 0
      ? [...shown, lang === "fr" ? `${more} autre${s(more)} date${s(more)}` : `${more} more date${s(more)}`]
      : shown;

  const context =
    lang === "fr"
      ? [
          `${name} est ${kindFr} à ${v.city}${region}, ${country}.`,
          live.length
            ? `${live.length} date${s(live.length)} à venir y ${live.length > 1 ? "sont référencées" : "est référencée"}, la prochaine ${whenPhrase(next, lang)}.`
            : `Aucune date à venir n'y est référencée pour l'instant.`,
          genres.length ? `La programmation penche vers ${join(genres, lang)}.` : "",
          regulars.length ? `Les noms qui y reviennent le plus souvent : ${join(regulars, lang)}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          `${name} is ${kindEn} in ${v.city}${region}, ${country}.`,
          live.length
            ? `${live.length} upcoming date${s(live.length)} ${live.length > 1 ? "are" : "is"} listed here, the next one ${whenPhrase(next, lang)}.`
            : `No upcoming date is listed here right now.`,
          genres.length ? `The programming leans towards ${join(genres, lang)}.` : "",
          regulars.length ? `The names that come back most often: ${join(regulars, lang)}.` : "",
        ]
          .filter(Boolean)
          .join(" ");

  const faq: QA[] = [];

  faq.push(
    lang === "fr"
      ? [
          `Quel est le programme de ${name} ?`,
          live.length
            ? `${live.length} date${s(live.length)} à venir : ${join(upcomingTitles, lang)}. L'agenda complet, avec les horaires et la billetterie, est plus haut sur cette page.`
            : `Aucune date à venir n'est publiée pour cette salle. Les éditions passées restent en ligne, avec le line-up de chaque soirée.`,
        ]
      : [
          `What's on at ${name}?`,
          live.length
            ? `${live.length} upcoming date${s(live.length)}: ${join(upcomingTitles, lang)}. The full agenda, with running times and ticketing, is higher up this page.`
            : `No upcoming date is published for this room. Past nights stay online, each with its line-up.`,
        ],
  );

  faq.push(
    lang === "fr"
      ? [
          `Où se trouve ${name} ?`,
          `À ${v.city}${region}, ${country}. Chaque fiche d'événement de cette salle affiche sa position sur la carte, et l'adresse exacte figure sur le billet de l'organisateur.`,
        ]
      : [
          `Where is ${name}?`,
          `In ${v.city}${region}, ${country}. Every event page for this room shows its position on a map, and the exact address is on the promoter's ticket.`,
        ],
  );

  if (regulars.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quels artistes jouent à ${name} ?`,
            `Les habitués relevés sur les affiches sont ${join(regulars, lang)}. La liste complète des artistes passés et à venir est plus bas, chacun avec sa propre fiche.`,
          ]
        : [
            `Which artists play at ${name}?`,
            `The regulars we count across its bills are ${join(regulars, lang)}. The full list of past and upcoming artists is further down, each with their own page.`,
          ],
    );
  }

  if (genres.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quels styles joue-t-on à ${name} ?`,
            `${join(genres, lang)}, d'après ${countPhrase(live.length + done.length, lang)} que nous référençons dans cette salle. Le classement est pondéré : une soirée mono-genre pèse plus qu'un festival étiqueté sur huit styles.`,
          ]
        : [
            `What styles are played at ${name}?`,
            `${join(genres, lang)}, based on ${countPhrase(live.length + done.length, lang)} we list for this room. The ranking is weighted: a single-genre night counts for more than a festival tagged across eight styles.`,
          ],
    );
  }

  return { context, faq };
}

/* ------------------------------------------------------------------------ pays */

export interface CountryCopy {
  context: string;
  faq: QA[];
}

/**
 * Le contexte et les questions supplémentaires d'une page pays.
 *
 * La page portait déjà une FAQ ; ce qui lui manquait, c'est la saison (quand se
 * concentrent les dates), les salles qui tournent, et la part des festivals. Tout se
 * calcule sur le calendrier du pays, donc rien à re-vérifier.
 */
export function countryCopy(
  lang: Lang,
  ctx: { name: string; label: string; live: RaveEvent[]; past: RaveEvent[]; cities: string[]; genres: string[] },
): CountryCopy {
  const { name, label, live, past, cities, genres } = ctx;
  /* `name` est la clé du catalogue (« Netherlands »), `label` l'affichage : la
     préposition se calcule sur la clé, cf. `inCountry()`. */
  const where = inCountry(name, lang);
  const fests = live.filter((e) => e.type === "Festival").length;
  const clubs = live.length - fests;

  /* Le mois le plus chargé, et les trois mois qui portent la saison. Un classement
     sur les dates à venir seulement : une saison calculée sur l'archive décrirait
     l'an dernier. */
  const months = new Map<string, number>();
  for (const e of live) months.set(e.date.slice(0, 7), (months.get(e.date.slice(0, 7)) ?? 0) + 1);
  const top = [...months.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
  const season = top.map(([m, n]) => `${monthYear(`${m}-01`, lang)} (${n})`);

  const venues = [...new Set(live.filter((e) => !umbrella(e)).map((e) => eventVenueL(e, lang)))].slice(0, 5);
  const next = live[0];

  const context =
    lang === "fr"
      ? [
          live.length
            ? `Nous référençons ${live.length} date${s(live.length)} à venir ${where}, dont ${fests} festival${s(fests)} et ${clubs} soirée${s(clubs)} en club ou en entrepôt.`
            : `Aucune date à venir n'est référencée ${where} pour le moment.`,
          next ? `La prochaine est ${next.title}, ${whenPhrase(next, lang)} à ${wherePhrase(next, lang)}.` : "",
          season.length ? `Les mois les plus chargés sont ${join(season, lang)}.` : "",
          past.length ? `${past.length} édition${s(past.length)} passée${s(past.length)} rest${past.length > 1 ? "ent" : "e"} en ligne, avec le line-up et le tarif tels qu'ils avaient été annoncés.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          live.length
            ? `We list ${live.length} upcoming date${s(live.length)} ${where}, of which ${fests} festival${s(fests)} and ${clubs} club or warehouse night${s(clubs)}.`
            : `No upcoming date is listed ${where} right now.`,
          next ? `The next one is ${next.title}, ${whenPhrase(next, lang)} at ${wherePhrase(next, lang)}.` : "",
          season.length ? `The busiest months are ${join(season, lang)}.` : "",
          past.length ? `${past.length} past edition${s(past.length)} stay${past.length > 1 ? "" : "s"} online, with the line-up and price exactly as they were announced.` : "",
        ]
          .filter(Boolean)
          .join(" ");

  const faq: QA[] = [];

  if (season.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quand a lieu la saison des festivals ${where} ?`,
            `Sur les dates que nous référençons, la charge se concentre sur ${join(season, lang)}. Le chiffre entre parenthèses est le nombre d'événements annoncés ce mois-là, il monte au fil des annonces.`,
          ]
        : [
            `When is festival season ${where}?`,
            `Across the dates we list, activity concentrates on ${join(season, lang)}. The figure in brackets is the number of events announced that month, and it grows as bills are published.`,
          ],
    );
  }

  if (genres.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quels styles domine-t-on ${where} ?`,
            `${join(genres.slice(0, 6), lang)} sur les dates à venir. Chaque style a sa page, avec sa fiche, son tempo et les villes où il se joue le plus.`,
          ]
        : [
            `Which styles dominate ${where}?`,
            `${join(genres.slice(0, 6), lang)} across the upcoming dates. Each style has its own page, with a profile, a tempo and the cities where it plays most.`,
          ],
    );
  }

  if (venues.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Dans quelles salles sortir ${where} ?`,
            `Les lieux qui portent les prochaines dates sont ${join(venues, lang)}${cities.length ? `, à ${join(cities.slice(0, 5), lang)}` : ""}. Chaque salle a sa page avec son agenda complet et ses habitués.`,
          ]
        : [
            `Which venues should I go to ${where}?`,
            `The rooms carrying the next dates are ${join(venues, lang)}${cities.length ? `, in ${join(cities.slice(0, 5), lang)}` : ""}. Each venue has its own page with the full agenda and its regulars.`,
          ],
    );
  }

  return { context, faq };
}

/* ------------------------------------------------------- lieu (ville, département) */

export interface PlaceCopy {
  context: string;
  faq: QA[];
}

/**
 * Le contexte et la FAQ d'une page de lieu (`/rave-party/{lieu}` et `/festival/{lieu}`).
 *
 * Ce sont les 242 pages qui portent la stratégie « rave party {lieu} » du projet, et
 * c'étaient les seules qui n'avaient **aucun texte propre** : une phrase d'intro et
 * quatre questions de FAQ qui n'interpolaient que le nom du lieu, identiques d'un lieu
 * à l'autre. Deux cent quarante-deux pages qui se ressemblent mot pour mot, c'est le
 * contenu mince que Google range, et c'est aussi une page qui ne répond à rien : « y
 * a-t-il une soirée ce week-end » recevait « consulte la liste ci-dessus ».
 *
 * Tout sort du calendrier, comme partout ailleurs dans ce module : les salles, les
 * styles, les tarifs et les dates sont ceux du lieu, donc ils changent avec lui.
 *
 * **Trois cas, pas un.** Un lieu sans aucune date ne reçoit pas une phrase creuse mais
 * la vérité, y compris la raison éditoriale (le site référence les événements
 * déclarés) : ces pages-là sont en `noindex` (voir `lib/thin-pages.ts`), et le lecteur
 * qui y arrive quand même mérite mieux qu'un « consulte la liste » devant une liste
 * vide. Une ville et un département n'ont pas non plus la même promesse, d'où
 * `kind` : « à Lyon » et « dans la Drôme » ne se disent pas pareil, et une page de
 * département couvre plusieurs communes, ce qu'elle doit dire.
 */
export function placeCopy(
  lang: Lang,
  ctx: {
    label: string;
    kind: "ville" | "departement" | "region";
    live: RaveEvent[];
    past: RaveEvent[];
    genres: string[];
    /** Le sous-ensemble des dates à venir dans les quatorze jours, pour « ce week-end ». */
    soon: RaveEvent[];
    /**
     * Ce que la page couvre : tout le calendrier du lieu (`/rave-party/{lieu}`) ou ses
     * seuls festivals (`/festival/{lieu}`). Les deux pages posent les mêmes questions,
     * mais pas sur le même ensemble : sur une page festival, « quels festivals ici »
     * est la page elle-même, et « une soirée ce week-end » n'est pas la question.
     */
    scope?: "all" | "festival";
  },
): PlaceCopy {
  const { label, kind, live, past, genres, soon, scope = "all" } = ctx;
  const onlyFests = scope === "festival";
  const at = lang === "fr" ? (kind === "ville" ? `à ${label}` : atPlace(label, kind)) : `in ${label}`;
  const around =
    lang === "fr"
      ? kind === "ville"
        ? `à ${label} et aux alentours`
        : atPlace(label, kind)
      : kind === "ville"
        ? `in and around ${label}`
        : `across ${label}`;

  const fests = live.filter((e) => e.type === "Festival");
  const clubs = live.filter((e) => e.type !== "Festival");
  const next = live[0];
  /* Les salles, jamais un libellé qui décrit un ensemble de lieux : « Divers lieux,
     Rennes » n'est pas une salle, et l'écrire dans une phrase est le même défaut que
     de lui créer une page (cf. `isMultiVenueLabel`). */
  const venues = [...new Set(live.filter((e) => !umbrella(e)).map((e) => eventVenueL(e, lang)))].slice(0, 5);
  const cities =
    kind === "ville" ? [] : [...new Set(live.map((e) => e.city))].slice(0, 6);

  /* La fourchette réelle, calculée sur les seuls tarifs confirmés : reprendre un prix
     estimé reviendrait à annoncer comme un fait ce que la fiche affiche avec un « ≈ ». */
  const priced = live.filter((e) => !e.priceNote && e.price > 0);
  const low = priced.length ? priced.reduce((m, e) => (e.price < m.price ? e : m)) : undefined;
  const high = priced.length ? priced.reduce((m, e) => (e.price > m.price ? e : m)) : undefined;
  const free = live.filter((e) => e.price === 0 && !e.priceNote).length;

  const context =
    lang === "fr"
      ? [
          live.length
            ? onlyFests
              ? `Nous référençons ${live.length} festival${s(live.length)} de musique électronique à venir ${around}.`
              : `Nous référençons ${live.length} date${s(live.length)} à venir ${around}, ${fests.length} festival${s(fests.length)} et ${clubs.length} soirée${s(clubs.length)} en club ou en entrepôt.`
            : onlyFests
              ? `Aucun festival de musique électronique n'est annoncé ${around} pour le moment. RaveRadar recense les événements déclarés par leurs organisateurs, avec une billetterie ou une adresse vérifiable.`
              : `Aucune soirée ni festival déclaré n'est référencé ${around} pour le moment. RaveRadar recense les événements annoncés publiquement par leurs organisateurs, avec une billetterie ou une adresse vérifiable.`,
          /* « 2 festivals… La prochaine est » : l'accord suit ce dont la page parle,
             et une page festival ne parle pas de « dates ». */
          next
            ? `${onlyFests ? "Le prochain" : "La prochaine"} est ${next.title}, ${whenPhrase(next, lang)} à ${wherePhrase(next, lang)}.`
            : "",
          cities.length > 1 ? `Les communes concernées : ${join(cities, lang)}.` : "",
          venues.length ? `Les salles qui programment le plus : ${join(venues, lang)}.` : "",
          /* Au présent seulement s'il y a quelque chose à venir : « la programmation
             penche vers la hard techno » sous « aucune date référencée » était une
             contradiction dans le même paragraphe, les genres venant aussi de
             l'archive. Sans date à venir, la phrase passe au passé, ce qui est ce
             qu'elle décrit réellement. */
          genres.length
            ? live.length
              ? `La programmation penche vers ${join(genres, lang)}.`
              : `Les éditions déjà passées relevaient surtout de ${join(genres, lang)}.`
            : "",
          past.length
            ? `${past.length} édition${s(past.length)} passée${s(past.length)} rest${past.length > 1 ? "ent" : "e"} en ligne, avec le line-up tel qu'il avait été annoncé.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          live.length
            ? onlyFests
              ? `We list ${live.length} upcoming electronic music festival${s(live.length)} ${around}.`
              : `We list ${live.length} upcoming date${s(live.length)} ${around}, ${fests.length} festival${s(fests.length)} and ${clubs.length} club or warehouse night${s(clubs.length)}.`
            : onlyFests
              ? `No electronic music festival is announced ${around} right now. RaveRadar covers events declared by their organisers, with a ticket office or a checkable address.`
              : `No declared party or festival is listed ${around} right now. RaveRadar covers events announced publicly by their organisers, with a ticket office or a checkable address.`,
          next ? `The next one is ${next.title}, ${whenPhrase(next, lang)} at ${wherePhrase(next, lang)}.` : "",
          cities.length > 1 ? `Towns covered: ${join(cities, lang)}.` : "",
          venues.length ? `The venues that programme the most: ${join(venues, lang)}.` : "",
          genres.length
            ? live.length
              ? `The programming leans towards ${join(genres, lang)}.`
              : `Past editions leaned mostly towards ${join(genres, lang)}.`
            : "",
          past.length
            ? `${past.length} past edition${s(past.length)} stay${past.length > 1 ? "" : "s"} online, with the line-up exactly as it was announced.`
            : "",
        ]
          .filter(Boolean)
          .join(" ");

  const faq: QA[] = [];

  /* « Y a-t-il quelque chose ce week-end » est la requête la plus fréquente sur ces
     pages, et elle recevait « consulte la liste ci-dessus ». Elle reçoit maintenant un
     nombre et des noms, ou un « non » franc, ce qui est aussi une réponse. */
  if (!onlyFests)
  faq.push(
    lang === "fr"
      ? [
          `Y a-t-il une rave party ou une soirée techno ${at} ces jours-ci ?`,
          soon.length
            ? `Oui, ${soon.length} date${s(soon.length)} dans les quinze prochains jours : ${join(soon.slice(0, 4).map((e) => `${e.title} (${day(e.date, lang)})`), lang)}. Chaque fiche donne l'horaire, le line-up et le lien vers la billetterie officielle.`
            : live.length
              ? `Rien dans les quinze prochains jours. La prochaine date ${around} est ${next.title}, ${whenPhrase(next, lang)}.`
              : `Aucune date n'est annoncée ${around} pour l'instant. Une alerte sur ce lieu te préviendra dès qu'un organisateur en publie une.`,
        ]
      : [
          `Is there a rave or a techno night ${at} soon?`,
          soon.length
            ? `Yes, ${soon.length} date${s(soon.length)} in the next fortnight: ${join(soon.slice(0, 4).map((e) => `${e.title} (${day(e.date, lang)})`), lang)}. Each page gives the running time, the line-up and a link to the official ticket office.`
            : live.length
              ? `Nothing in the next fortnight. The next date ${around} is ${next.title}, ${whenPhrase(next, lang)}.`
              : `No date is announced ${around} yet. An alert on this place will tell you as soon as an organiser publishes one.`,
        ],
  );

  if (venues.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            `Quelles salles programment de l'électro ${at} ?`,
            `${join(venues, lang)}. Chacune a sa page avec son agenda complet, ses habitués et les styles qu'on y entend.`,
          ]
        : [
            `Which venues programme electronic music ${at}?`,
            `${join(venues, lang)}. Each has its own page with a full agenda, its regulars and the styles you hear there.`,
          ],
    );
  }

  if (fests.length > 0) {
    const names = fests.slice(0, 4).map((e) => `${e.title} (${monthYear(e.date, lang)})`);
    faq.push(
      lang === "fr"
        ? [
            `Quels festivals de musique électronique ${at} ?`,
            `${fests.length} festival${s(fests.length)} à venir : ${join(names, lang)}${fests.length > 4 ? `, et ${fests.length - 4} autre${s(fests.length - 4)}` : ""}. Dates, line-ups et billetterie sur chaque fiche.`,
          ]
        : [
            `Which electronic music festivals are ${at}?`,
            `${fests.length} upcoming festival${s(fests.length)}: ${join(names, lang)}${fests.length > 4 ? `, and ${fests.length - 4} more` : ""}. Dates, line-ups and ticketing on each page.`,
          ],
    );
  }

  /* La saison, calculée sur les dates réelles du lieu et non sur la généralité « de mai
     à septembre » qui s'affichait partout : elle est à peu près vraie pour un festival
     en plein air du nord de l'Europe, et fausse pour une ville dont les festivals sont
     en salle l'hiver. Une phrase engendrée qui affirme quelque chose de non vérifié est
     exactement ce que la règle de contenu interdit, qu'elle parle d'un tarif ou d'un
     calendrier. */
  if (live.length >= 2) {
    const byMonth = new Map<string, number>();
    for (const e of live) byMonth.set(e.date.slice(0, 7), (byMonth.get(e.date.slice(0, 7)) ?? 0) + 1);
    const top = [...byMonth.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
    const season = top.map(([m, n]) => `${monthYear(`${m}-01`, lang)} (${n})`);
    faq.push(
      lang === "fr"
        ? [
            onlyFests ? `Quand ont lieu les festivals ${at} ?` : `Quand sortir ${at} ?`,
            `Sur les dates que nous référençons, la charge se concentre sur ${join(season, lang)}. Le chiffre entre parenthèses est le nombre d'événements annoncés ce mois-là, et il monte au fil des annonces.`,
          ]
        : [
            onlyFests ? `When are the festivals ${at}?` : `When is there most on ${at}?`,
            `Across the dates we list, activity concentrates on ${join(season, lang)}. The figure in brackets is the number of events announced that month, and it grows as bills are published.`,
          ],
    );
  }

  /* Le tarif est celui du catalogue, pas une fourchette de bon sens : l'ancienne
     réponse annonçait « 40-90 € pour un festival » sur toutes les pages, y compris
     celles où rien ne coûtait ça, et y compris hors zone euro. */
  if (low && high) {
    faq.push(
      lang === "fr"
        ? [
            `Combien coûte une soirée ou un festival ${at} ?`,
            low.id === high.id
              ? `Le seul tarif confirmé ${around} est ${priceLabel(low, lang)} (${low.title}).${free ? ` ${free} date${s(free)} ${free > 1 ? "sont" : "est"} à entrée libre.` : ""}`
              : `Les tarifs confirmés vont de ${priceLabel(low, lang)} (${low.title}) à ${priceLabel(high, lang)} (${high.title}).${free ? ` ${free} date${s(free)} ${free > 1 ? "sont" : "est"} à entrée libre.` : ""} Un montant précédé de « ≈ » est une estimation que nous n'avons pas pu confirmer auprès de la billetterie.`,
          ]
        : [
            `How much does a night or a festival ${at} cost?`,
            low.id === high.id
              ? `The only confirmed price ${around} is ${priceLabel(low, lang)} (${low.title}).${free ? ` ${free} date${s(free)} ${free > 1 ? "are" : "is"} free entry.` : ""}`
              : `Confirmed prices run from ${priceLabel(low, lang)} (${low.title}) to ${priceLabel(high, lang)} (${high.title}).${free ? ` ${free} date${s(free)} ${free > 1 ? "are" : "is"} free entry.` : ""} An amount shown with a "≈" is an estimate we could not confirm with the ticket office.`,
          ],
    );
  }

  if (genres.length > 0) {
    faq.push(
      lang === "fr"
        ? [
            live.length ? `Quels styles entend-on ${at} ?` : `Quels styles entendait-on ${at} ?`,
            `${join(genres, lang)}, d'après ${countPhrase(live.length + past.length, lang)} que nous référençons ${around}. Le classement est pondéré : une soirée mono-genre pèse plus qu'un festival étiqueté sur huit styles.`,
          ]
        : [
            live.length ? `Which styles do you hear ${at}?` : `Which styles were heard ${at}?`,
            `${join(genres, lang)}, based on ${countPhrase(live.length + past.length, lang)} we list ${around}. The ranking is weighted: a single-genre night counts for more than a festival tagged across eight styles.`,
          ],
    );
  }

  /* La question n'a de sens que sur une page qui n'a rien à montrer : ailleurs, la
     réponse est la grille au-dessus. Elle dit la ligne éditoriale plutôt que de
     laisser croire à un oubli. */
  if (live.length === 0) {
    faq.push(
      lang === "fr"
        ? [
            `Pourquoi aucune date ${at} ?`,
            `Nous ne référençons que les événements déclarés : un festival ou une soirée annoncés par leur organisateur, avec une billetterie ou une adresse vérifiable. Les rassemblements non déclarés sortent de ce cadre, nous ne pouvons ni les vérifier ni les publier. Dès qu'une date déclarée est annoncée ${around}, elle apparaît ici.`,
          ]
        : [
            `Why is there no date ${at}?`,
            `We only list declared events: a festival or a club night announced by its organiser, with a ticket office or a checkable address. Undeclared gatherings fall outside that, we can neither verify nor publish them. As soon as a declared date is announced ${around}, it appears here.`,
          ],
    );
  }

  return { context, faq };
}

/**
 * « dans la Drôme », « dans le Rhône », « dans les Hauts-de-Seine ».
 *
 * Même nature que `inCountry()` et même raison : un texte engendré qui écrit « dans
 * Drôme » signale la machine, et ces pages existent pour se classer sur des tournures
 * que les gens tapent. Le genre d'un département français ne se déduit pas de sa
 * terminaison (le Rhône, la Loire, les Landes), donc c'est une table, avec « le »
 * comme défaut, et une liste courte pour le féminin et le pluriel, tenue sur les
 * libellés de `PLACES`.
 */
function inPlace(label: string, kind: "departement" | "region" = "departement"): string {
  const plural = PLURAL_PLACES.has(label);
  const elided = ELIDED_PLACES.has(label) || /^[AEIOUYÀÂÉÈÊËÎÏÔÖÙÛÜ]/i.test(label);
  /* Une **région** ne prend pas l'article d'un département : on dit « en Bretagne »,
     « en Normandie », « en Occitanie », jamais « dans la Bretagne ». Seul le pluriel
     garde « dans les » (« dans les Hauts-de-France »). L'appelant écrit « dans » devant
     le retour, d'où le retrait ici quand la forme se suffit. */
  if (kind === "region" && !plural) return `EN:en ${label}`;
  /* L'ordre compte : « Alpes-Maritimes » et « Yvelines » commencent par une voyelle et
     sont pluriels, c'est le pluriel qui gagne (« les Alpes-Maritimes »). */
  if (plural) return `les ${label}`;
  if (FEM_PLACES.has(label)) return `la ${label}`;
  if (elided) return `l'${label}`;
  return `le ${label}`;
}

/**
 * « dans le Rhône », « en Bretagne » : la préposition et l'article d'un coup.
 *
 * `inPlace()` rend la forme avec son article, mais une région féminine se dit « en
 * Bretagne » et non « dans la Bretagne » : la préposition change avec elle. Le marqueur
 * `EN:` est la façon la plus courte de faire remonter ce cas sans rendre un objet.
 */
function atPlace(label: string, kind: "departement" | "region"): string {
  const v = inPlace(label, kind);
  return v.startsWith("EN:") ? v.slice(3) : `dans ${v}`;
}

const FEM_PLACES = new Set([
  "Drôme", "Loire", "Loire-Atlantique", "Haute-Savoie", "Haute-Vienne", "Haute-Garonne",
  "Charente", "Charente-Maritime", "Gironde", "Marne", "Meurthe-et-Moselle", "Meuse",
  "Moselle", "Sarthe", "Savoie", "Seine-et-Marne", "Seine-Maritime", "Seine-Saint-Denis",
  "Somme", "Vendée", "Vienne", "Lozère", "Dordogne", "Côte-d'Or", "Corrèze", "Creuse",
  "Manche", "Mayenne", "Nièvre", "Sarthe", "Vienne",
  "Bretagne", "Corse", "Normandie", "Nouvelle-Aquitaine", "Occitanie",
]);

const PLURAL_PLACES = new Set([
  "Alpes-Maritimes", "Bouches-du-Rhône", "Côtes-d'Armor", "Deux-Sèvres", "Hautes-Alpes",
  "Hautes-Pyrénées", "Hauts-de-Seine", "Landes", "Pyrénées-Atlantiques",
  "Pyrénées-Orientales", "Vosges", "Yvelines", "Ardennes", "Alpes-de-Haute-Provence",
  "Hauts-de-France", "Pays de la Loire",
]);

/**
 * Les libellés à h muet, que la règle de la voyelle ne voit pas.
 *
 * « dans l'Hérault », et non « dans le Hérault ». Une liste explicite plutôt qu'un
 * test sur la lettre : le h aspiré existe (« le Havre ») et se tromperait dans l'autre
 * sens.
 */
const ELIDED_PLACES = new Set(["Hérault", "Hérault (34)"]);
