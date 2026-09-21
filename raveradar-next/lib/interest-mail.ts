import type { Lang, RaveEvent } from "./types";
import { eventPath, ticketUrl } from "./data";
import { countryLabel, eventVenueL, lastDay } from "./display";
import { fmtDate, priceLabel } from "./format";
import { hotelStay } from "./hotels";
import { escapeMail, renderMail, type MailBlock } from "./mail-template";
import { SITE_URL } from "./site";

/**
 * Le rappel J-7 envoyé à qui a posé un fanion sur un événement.
 *
 * **Module serveur** : il tire le catalogue (`eventPath`, `ticketUrl`), donc aucun
 * composant client ne doit l'importer. Il n'est appelé que par la route de rappel.
 *
 * Ce que ce mail contient, et pourquoi exactement ça. Sept jours avant, la question du
 * lecteur n'est plus « est-ce que j'y vais » mais « qu'est-ce qu'il me reste à faire » :
 * le billet, et le lit. D'où trois blocs et pas un de plus, la fiche (date, salle,
 * ville, horaire, tarif), la billetterie, et la recherche d'hôtels **datée et centrée
 * sur la salle** que `hotelStay()` construit déjà pour la fiche. C'est la deuxième
 * source de revenus du site, et c'est le moment de l'année où elle vaut le plus : un
 * lecteur à J-7 n'a plus le temps d'hésiter sur l'hébergement.
 *
 * Trois règles du dépôt s'appliquent telles quelles, et ce n'est pas une formalité :
 *
 * - **Rien d'inventé.** Le mail ne dit que ce que la fiche porte. Pas de nom d'hôtel,
 *   pas de prix d'hôtel, pas de « il reste peu de places » : `lib/hotels.ts` explique
 *   déjà pourquoi on vend une recherche et jamais une liste, et un mail est le pire
 *   endroit où publier un chiffre périmé, il n'a pas de `revalidate`.
 * - **La mention d'affiliation est dans le corps du message**, pas en pied de page en
 *   petit. Même exigence que dans la carte de la fiche : le lecteur doit le savoir avant
 *   de cliquer.
 * - **Pas de tiret cadratin.** Un mail est du contenu publié comme le reste.
 *
 * Le lien porte `utm_source=rappel`, ce qui permet à `/suivi` de distinguer une visite
 * venue du rappel d'une visite organique. Sans ça la fonctionnalité n'aurait aucune
 * ligne à elle, exactement le défaut que `trackGoal()` corrige pour la newsletter.
 */

export interface ReminderMail {
  subject: string;
  text: string;
  html: string;
}

const T = {
  fr: {
    subj: (title: string) => `J-7 : ${title}`,
    kicker: "Dans une semaine",
    hello: "Tu avais marqué cet événement comme intéressant sur RaveRadar. Il a lieu dans une semaine.",
    when: "Quand",
    where: "Où",
    doors: "Ouverture",
    price: "À partir de",
    seeEvent: "Voir la fiche et le line-up",
    tickets: "Prendre mon billet",
    sleepTitle: "Où dormir",
    sleep: (near: string, nights: number, brand: string) =>
      `On a préparé une recherche ${brand} autour de ${near}, déjà aux dates de l'événement (${nights} nuit${nights > 1 ? "s" : ""}).`,
    sleepCta: "Voir les hébergements proches",
    aff: "Ce lien est un lien d'affiliation : réserver par là ne te coûte pas plus cher et finance le site.",
    outro: "Bonne soirée, et fais attention à toi.",
    unsub:
      "Tu reçois ce message parce que tu as posé un fanion sur cet événement. C'est le seul rappel qu'on envoie pour lui, il n'y a rien à désinscrire. Pour retirer le fanion, retourne sur la fiche et touche le drapeau.",
  },
  en: {
    subj: (title: string) => `One week to go: ${title}`,
    kicker: "One week to go",
    hello: "You flagged this event as interesting on RaveRadar. It happens in a week.",
    when: "When",
    where: "Where",
    doors: "Doors",
    price: "From",
    seeEvent: "See the page and line-up",
    tickets: "Get my ticket",
    sleepTitle: "Where to stay",
    sleep: (near: string, nights: number, brand: string) =>
      `We prepared a ${brand} search around ${near}, already set to the event dates (${nights} night${nights > 1 ? "s" : ""}).`,
    sleepCta: "See nearby stays",
    aff: "This is an affiliate link: booking through it costs you no more and funds the site.",
    outro: "Have a good one, and look after yourself.",
    unsub:
      "You are getting this because you flagged this event. It is the only reminder we send for it, there is nothing to unsubscribe from. To drop the flag, go back to the page and tap the pennant.",
  },
} as const;

/** Le lien de la fiche, absolu et marqué, dans la langue du fanion. */
function pageUrl(e: RaveEvent, lang: Lang): string {
  const prefix = lang === "en" ? "/en" : "";
  return `${SITE_URL}${prefix}${eventPath(e)}?utm_source=rappel&utm_medium=email&utm_campaign=j7`;
}

/**
 * Construit le message. `today` est un paramètre pour la même raison que partout
 * ailleurs dans le dépôt : l'appelant fixe son jour de référence une fois et tous ses
 * calculs s'accordent, ici la recherche d'hôtels comme la date affichée.
 *
 * La mise en page vient de `lib/mail-template.ts`, comme les messages du circuit
 * promoteur : ce mail avait son propre HTML, donc sa propre en-tête et son propre pied
 * de page, et un lecteur qui recevait un rappel puis une validation voyait deux
 * expéditeurs différents. La version texte sort de la même structure, elle ne peut plus
 * vieillir à part.
 */
export function reminderMail(e: RaveEvent, lang: Lang, today: string): ReminderMail {
  const t = T[lang];
  const multiDay = lastDay(e) !== e.date;
  const when = multiDay ? `${fmtDate(e.date, lang)} → ${fmtDate(lastDay(e), lang)}` : fmtDate(e.date, lang);
  const where = `${eventVenueL(e, lang)}, ${e.city}, ${countryLabel(e.country, lang)}`;
  const page = pageUrl(e, lang);
  const tickets = ticketUrl(e);
  const stay = hotelStay(e, lang, today);

  const blocks: MailBlock[] = [
    { kind: "text", text: escapeMail(t.hello), muted: true },
    {
      kind: "rows",
      rows: [
        { k: t.when, v: `${when}${multiDay ? "" : ` · ${e.time}`}` },
        { k: t.where, v: where },
        { k: t.price, v: priceLabel(e, lang) },
      ],
    },
    {
      kind: "actions",
      actions: [
        { href: page, label: t.seeEvent, tone: "primary" },
        ...(tickets ? ([{ href: tickets, label: t.tickets, tone: "ghost" }] as const) : []),
      ],
    },
    ...(stay
      ? ([
          {
            kind: "panel",
            title: t.sleepTitle,
            blocks: [
              { kind: "text", text: escapeMail(t.sleep(stay.near, stay.nights, stay.brand)), muted: true },
              { kind: "actions", actions: [{ href: stay.url, label: t.sleepCta, tone: "ghost" }] },
              // La mention d'affiliation reste dans le corps du message et non en pied de
              // page : le lecteur doit le savoir avant de cliquer, pas après. Et ici elle
              // garde sa phrase entière, contrairement à la carte de la fiche, un mail
              // n'a pas de page à côté de lui vers laquelle renvoyer.
              { kind: "note", text: t.aff },
            ],
          },
        ] as MailBlock[])
      : []),
    { kind: "text", text: escapeMail(t.outro), muted: true },
  ];

  const { html, text } = renderMail(
    {
      lang,
      kicker: t.kicker,
      title: e.title,
      preheader: `${when} · ${where}`,
      blocks,
      footnote: t.unsub,
    },
    SITE_URL,
  );

  return { subject: t.subj(e.title), text, html };
}
