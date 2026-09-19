import type { Lang, RaveEvent } from "./types";
import { eventPath, ticketUrl } from "./data";
import { countryLabel, eventVenueL, lastDay } from "./display";
import { fmtDate, priceLabel } from "./format";
import { hotelStay } from "./hotels";
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

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Le lien de la fiche, absolu et marqué, dans la langue du fanion. */
function pageUrl(e: RaveEvent, lang: Lang): string {
  const prefix = lang === "en" ? "/en" : "";
  return `${SITE_URL}${prefix}${eventPath(e)}?utm_source=rappel&utm_medium=email&utm_campaign=j7`;
}

/**
 * Construit le message. `today` est un paramètre pour la même raison que partout
 * ailleurs dans le dépôt : l'appelant fixe son jour de référence une fois et tous ses
 * calculs s'accordent, ici la recherche d'hôtels comme la date affichée.
 */
export function reminderMail(e: RaveEvent, lang: Lang, today: string): ReminderMail {
  const t = T[lang];
  const multiDay = lastDay(e) !== e.date;
  const when = multiDay ? `${fmtDate(e.date, lang)} → ${fmtDate(lastDay(e), lang)}` : fmtDate(e.date, lang);
  const where = `${eventVenueL(e, lang)}, ${e.city}, ${countryLabel(e.country, lang)}`;
  const page = pageUrl(e, lang);
  const tickets = ticketUrl(e);
  const stay = hotelStay(e, lang, today);

  /* Le deux-points prend une espace avant en français et rien en anglais. Écrire
     « When : Saturday » dans la version anglaise est la même faute que la virgule après
     le jour de semaine en en-GB, déjà payée dans `lib/pagecopy.ts` : elle ne se voit que
     sur le texte rendu, jamais dans le gabarit. */
  const c = lang === "fr" ? " : " : ": ";

  const lines = [
    t.hello,
    "",
    `${t.when}${c}${when}${multiDay ? "" : ` · ${e.time}`}`,
    `${t.where}${c}${where}`,
    `${t.price}${c}${priceLabel(e, lang)}`,
    "",
    `${t.seeEvent}${c}${page}`,
  ];
  if (tickets) lines.push(`${t.tickets}${c}${tickets}`);
  if (stay) {
    lines.push("", `${t.sleepTitle}${c}${t.sleep(stay.near, stay.nights, stay.brand)}`, stay.url, t.aff);
  }
  lines.push("", t.outro, "", t.unsub);

  /* Le HTML reste volontairement rudimentaire : tableaux implicites, styles en ligne,
     aucune image de fond. Un client mail n'est pas un navigateur, et une mise en page
     ambitieuse s'y casse sans qu'on le voie jamais. La version texte porte la même
     information, ce n'est pas un repli dégradé. */
  const btn = (href: string, label: string, bg: string) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 22px;border-radius:99px;background:${bg};color:#fff;text-decoration:none;font-weight:700;font-family:Helvetica,Arial,sans-serif;font-size:15px">${esc(label)}</a>`;

  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;background:#050608;color:#e8e8ef;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
<div style="max-width:560px;margin:0 auto">
<p style="font-family:'Courier New',monospace;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:#31d0e0;margin:0 0 6px">RaveRadar</p>
<h1 style="font-size:24px;line-height:1.15;margin:0 0 14px;color:#fff">${esc(e.title)}</h1>
<p style="color:#a5a5b8;margin:0 0 20px">${esc(t.hello)}</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 22px">
<tr><td style="padding:8px 0;border-bottom:1px solid #22232c;color:#a5a5b8">${esc(t.when)}</td><td style="padding:8px 0;border-bottom:1px solid #22232c;text-align:right;color:#fff"><b>${esc(when)}${multiDay ? "" : ` · ${esc(e.time)}`}</b></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #22232c;color:#a5a5b8">${esc(t.where)}</td><td style="padding:8px 0;border-bottom:1px solid #22232c;text-align:right;color:#fff"><b>${esc(where)}</b></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #22232c;color:#a5a5b8">${esc(t.price)}</td><td style="padding:8px 0;border-bottom:1px solid #22232c;text-align:right;color:#fff"><b>${esc(priceLabel(e, lang))}</b></td></tr>
</table>
<p style="margin:0 0 12px">${btn(page, t.seeEvent, "#e6208c")}</p>
${tickets ? `<p style="margin:0 0 22px">${btn(tickets, t.tickets, "#1c1d26")}</p>` : ""}
${
  stay
    ? `<div style="border:1px solid #22232c;border-radius:16px;padding:18px;margin:0 0 22px">
<p style="margin:0 0 8px;color:#fff;font-weight:700">${esc(t.sleepTitle)}</p>
<p style="margin:0 0 14px;color:#a5a5b8">${esc(t.sleep(stay.near, stay.nights, stay.brand))}</p>
<p style="margin:0 0 10px">${btn(stay.url, t.sleepCta, "#1c1d26")}</p>
<p style="margin:0;color:#75758a;font-size:12px">${esc(t.aff)}</p>
</div>`
    : ""
}
<p style="color:#a5a5b8;margin:0 0 20px">${esc(t.outro)}</p>
<p style="color:#75758a;font-size:12px;margin:0">${esc(t.unsub)}</p>
</div></body></html>`;

  return { subject: t.subj(e.title), text: lines.join("\n"), html };
}
