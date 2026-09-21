import type { EventSubmission, PromoterAccount } from "./accounts";
import { escapeMail, renderMail, type MailBlock, type MailDoc, type RenderedMail } from "./mail-template";
import { plainRich } from "./richtext";
import { SITE_URL } from "./site";

/**
 * Les quatre messages du circuit promoteur : la demande de compte et le dépôt
 * d'événement qui partent au propriétaire, la validation et le refus qui reviennent au
 * promoteur.
 *
 * Ils vivaient en lignes de texte construites dans les routes, chacune avec ses propres
 * tirets d'alignement et sa propre formule de politesse. Deux problèmes, et le second
 * est le vrai : un promoteur recevait sa validation sous la forme d'un message sans en
 * tête ni couleur, alors que c'est le premier contact d'un annuaire dont toute la valeur
 * est la confiance qu'on lui fait ; et la même information s'écrivait à quatre endroits,
 * donc elle divergeait. Les routes décrivent maintenant *ce qu'elles disent*, le gabarit
 * décide *à quoi ça ressemble*.
 *
 * **Module serveur**, comme `lib/subscribers.ts` : il porte des adresses et des liens
 * signés, aucun composant client ne doit l'importer.
 *
 * Deux règles du dépôt s'appliquent telles quelles. Pas de tiret cadratin, un mail est
 * du contenu publié comme le reste. Et rien d'inventé : un message de refus ne promet
 * pas un réexamen qu'on ne ferait pas, il dit ce qui manque et comment répondre.
 */

const isFr = (lang: string | undefined): boolean => lang !== "en";

/** Une date ISO rendue lisible, jour de la semaine compris. Midi UTC, et pas minuit :
 *  sur un fuseau à l'ouest de Greenwich, minuit bascule la veille et le rapport
 *  annoncerait le mauvais jour, ce qui est exactement ce qu'on vient vérifier. */
function humanDate(iso: string, fr = true): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(fr ? "fr-FR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** La même date, suivie de sa forme ISO. Réservée au message de relecture : c'est celle
 *  qu'on recopiera dans `lib/data.ts`, donc l'avoir sous les yeux évite un aller-retour.
 *  Un promoteur, lui, n'a rien à faire d'un `2027-06-19`. */
const reviewDate = (iso: string): string => `${humanDate(iso)} (${iso})`;

/** « non renseigné » plutôt qu'une ligne absente : dans un dossier qu'on relit pour
 *  décider, savoir qu'un champ est vide fait partie de l'information. */
const orNone = (v: string, fr: boolean): string => v || (fr ? "non renseigné" : "not provided");

const send = (subject: string, doc: MailDoc): RenderedMail & { subject: string } => ({
  subject,
  ...renderMail(doc, SITE_URL),
});

/* ---------------------------------------------------------------------------
   Vers le propriétaire
--------------------------------------------------------------------------- */

/** Les deux liens signés d'une décision, dans l'ordre où on les lit. */
export interface DecisionLinks {
  yes: string;
  no: string;
}

export function signupRequestMail(a: PromoterAccount, links: DecisionLinks) {
  const blocks: MailBlock[] = [
    { kind: "text", text: "Une structure demande un compte promoteur. Le dossier est en attente de ta décision.", muted: true },
    {
      kind: "rows",
      rows: [
        { k: "Structure", v: `${a.name} (${a.kind})` },
        { k: "Contact", v: a.contact },
        { k: "E-mail", v: a.email, href: `mailto:${a.email}` },
        { k: "Téléphone", v: orNone(a.phone, true) },
        { k: "Basé à", v: `${a.city}, ${a.country}` },
        { k: "Site", v: orNone(a.website, true), ...(a.website ? { href: a.website } : {}) },
        { k: "Instagram", v: a.instagram ? `@${a.instagram}` : "non renseigné", ...(a.instagram ? { href: `https://instagram.com/${a.instagram}` } : {}) },
        { k: "SoundCloud", v: a.soundcloud ? `@${a.soundcloud}` : "non renseigné" },
        { k: "Identifiant", v: orNone(a.legalId, true) },
      ],
    },
    { kind: "quote", title: "Présentation", text: a.about },
    {
      kind: "panel",
      title: "Ta décision",
      blocks: [
        {
          kind: "actions",
          actions: [
            { href: links.yes, label: "Approuver le compte", tone: "ok" },
            { href: links.no, label: "Refuser", tone: "danger" },
          ],
        },
        {
          kind: "note",
          text: "Un compte approuvé peut déposer des événements, il ne publie rien : chaque dépôt est relu avant d'entrer au catalogue.",
        },
      ],
    },
    {
      kind: "note",
      text: "Ces deux liens valent le secret qui les signe, et chacun ne vaut que pour ce compte et cette action. Ne les transfère pas.",
    },
  ];

  return send(`RaveRadar, demande de compte : ${a.name}`, {
    kicker: "Demande de compte",
    title: a.name,
    preheader: `${a.contact} pour ${a.name}, ${a.city}. Approuver ou refuser en un clic.`,
    blocks,
    footnote: "Message automatique du formulaire d'inscription promoteur.",
  });
}

export function submissionRequestMail(
  s: EventSubmission,
  promoter: string,
  attachment: string | null,
  links: DecisionLinks,
) {
  const price = s.price
    ? `${s.price} ${s.currency}${s.priceNote === "estimated" ? " (estimé, à confirmer)" : ""}`
    : "non communiqué";
  // La date porte son **jour de la semaine**, et ce n'est pas de la décoration : le
  // message demande deux lignes plus bas de vérifier ce jour avant la saisie, parce que
  // c'est lui qui a tranché les Verknipt NYE et la date de City Splash. Un ISO seul
  // oblige à ouvrir un calendrier pour faire cette vérification.
  const when = `${reviewDate(s.date)}${s.endDate ? ` → ${reviewDate(s.endDate)}` : ""}, ${s.time}${s.endTime ? ` → ${s.endTime}` : ""}`;

  const blocks: MailBlock[] = [
    { kind: "text", text: `Dépôt de <b>${escapeMail(promoter)}</b>.`, muted: true },
    {
      kind: "rows",
      rows: [
        { k: "Type", v: s.type },
        { k: "Genre", v: `${s.genre}${s.subgenres.length ? ` (${s.subgenres.join(", ")})` : ""}` },
        { k: "Date", v: when },
        { k: "Lieu", v: `${s.venue}, ${s.city}, ${s.country}` },
        { k: "Adresse", v: orNone(s.address, true) },
        { k: "Tarif", v: price },
        { k: "Billetterie", v: s.ticketUrl || "aucune", ...(s.ticketUrl ? { href: s.ticketUrl } : {}) },
        {
          k: "Affiche",
          v: attachment ? `en pièce jointe (${attachment})` : s.posterUrl || s.posterFile || "aucune",
          ...(!attachment && s.posterUrl ? { href: s.posterUrl } : {}),
        },
        { k: "Line-up", v: s.lineup.join(", ") || "à venir" },
        { k: "Déposant", v: s.owner, href: `mailto:${s.owner}` },
        { k: "Contact fiche", v: s.contactEmail, href: `mailto:${s.contactEmail}` },
      ],
    },
    { kind: "quote", title: "Description (FR)", text: plainRich(s.desc) },
    ...(s.descEn ? ([{ kind: "quote", title: "Description (EN)", text: plainRich(s.descEn) }] as MailBlock[]) : []),
    {
      kind: "panel",
      title: "Ta décision",
      blocks: [
        {
          kind: "note",
          text: "À vérifier avant saisie : page officielle, billetterie, et le jour de la semaine de la date.",
        },
        {
          kind: "actions",
          actions: [
            { href: links.yes, label: "Valider le dépôt", tone: "ok" },
            { href: links.no, label: "Écarter", tone: "danger" },
          ],
        },
        {
          kind: "note",
          text: "Valider ne met rien en ligne : le catalogue est un fichier relu à la main, le dépôt passe en « vérifié, à saisir » et attend l'export.",
        },
      ],
    },
    { kind: "note", text: "Ces deux liens valent le secret qui les signe. Ne les transfère pas." },
  ];

  return send(`RaveRadar, dépôt : ${s.title} (${s.city})`, {
    kicker: "Dépôt d'événement",
    title: s.title,
    preheader: `${s.venue}, ${s.city}, le ${s.date}. Déposé par ${promoter}.`,
    blocks,
    footnote: "Message automatique du formulaire de dépôt, réservé aux comptes approuvés.",
  });
}

/* ---------------------------------------------------------------------------
   Vers le promoteur
--------------------------------------------------------------------------- */

export function accountDecisionMail(a: PromoterAccount, action: "approve" | "reject") {
  const fr = isFr(a.lang);
  const organizer = `${SITE_URL}${fr ? "" : "/en"}/organizer`;

  if (action === "approve") {
    return send(
      fr ? "Ton compte promoteur RaveRadar est validé" : "Your RaveRadar promoter account is approved",
      {
        lang: fr ? "fr" : "en",
        kicker: fr ? "Compte validé" : "Account approved",
        title: fr ? `Bienvenue, ${a.name}` : `Welcome, ${a.name}`,
        preheader: fr
          ? "Tu peux déposer tes dates dès maintenant."
          : "You can submit your dates right away.",
        blocks: [
          {
            kind: "text",
            text: fr
              ? `Bonjour ${escapeMail(a.contact)}, le compte de <b>${escapeMail(a.name)}</b> est validé. Tes dates peuvent entrer au catalogue.`
              : `Hi ${escapeMail(a.contact)}, <b>${escapeMail(a.name)}</b> is approved. Your dates can now enter the catalogue.`,
          },
          {
            kind: "actions",
            actions: [{ href: organizer, label: fr ? "Déposer un événement" : "Submit an event", tone: "primary" }],
          },
          {
            kind: "panel",
            title: fr ? "Comment ça se passe ensuite" : "What happens next",
            blocks: [
              {
                kind: "text",
                text: fr
                  ? "Chaque dépôt est relu avant publication : date, line-up, lieu et tarif sont vérifiés. C'est la règle du catalogue et elle vaut pour tout le monde, un compte validé accélère la relecture, il ne la remplace pas."
                  : "Every submission is reviewed before publication: date, line-up, venue and price are checked. That rule applies to everyone. An approved account speeds the review up, it does not replace it.",
                muted: true,
              },
              {
                kind: "text",
                text: fr
                  ? "Une date qui change ou un line-up qui se complète ? Réponds à ce message, on corrige la fiche."
                  : "A date that moves or a line-up that fills in? Reply to this message and we will fix the page.",
                muted: true,
              },
            ],
          },
        ],
        footnote: fr
          ? "Tu reçois ce message parce qu'une demande de compte promoteur a été déposée avec cette adresse."
          : "You are getting this because a promoter account was requested with this address.",
      },
    );
  }

  return send(
    fr ? "Ta demande de compte promoteur RaveRadar" : "Your RaveRadar promoter account request",
    {
      lang: fr ? "fr" : "en",
      kicker: fr ? "Demande non retenue" : "Request not approved",
      title: a.name,
      preheader: fr ? "Ce n'est pas définitif, voici ce qui aide." : "Not final, here is what helps.",
      blocks: [
        {
          kind: "text",
          text: fr
            ? `Bonjour ${escapeMail(a.contact)}, on ne peut pas valider le compte de ${escapeMail(a.name)} pour le moment.`
            : `Hi ${escapeMail(a.contact)}, we can't approve ${escapeMail(a.name)} at the moment.`,
        },
        {
          kind: "text",
          text: fr
            ? "Ce qui permet de trancher, c'est une trace vérifiable de vos événements : une page officielle, une billetterie, un compte Instagram actif, ou un identifiant d'entreprise. Réponds à ce message avec un lien et on reprend le dossier."
            : "What settles it is a verifiable trace of your events: an official page, a ticketing link, an active Instagram account, or a company registration number. Reply to this message with a link and we will pick the file up again.",
          muted: true,
        },
      ],
      footnote: fr
        ? "Tu reçois ce message parce qu'une demande de compte promoteur a été déposée avec cette adresse."
        : "You are getting this because a promoter account was requested with this address.",
    },
  );
}

export function submissionDecisionMail(s: EventSubmission, action: "publish" | "reject") {
  const fr = isFr(s.lang);
  const find = `${SITE_URL}${fr ? "" : "/en"}/explore?q=${encodeURIComponent(s.title)}`;

  if (action === "publish") {
    return send(fr ? `RaveRadar, ${s.title} est vérifié` : `RaveRadar, ${s.title} is verified`, {
      lang: fr ? "fr" : "en",
      kicker: fr ? "Dépôt vérifié" : "Submission verified",
      title: s.title,
      preheader: fr ? "La fiche entre au catalogue." : "The page is entering the catalogue.",
      blocks: [
        {
          kind: "text",
          text: fr
            ? `Bonne nouvelle : « <b>${escapeMail(s.title)}</b> » est vérifié et entre au catalogue.`
            : `Good news: "<b>${escapeMail(s.title)}</b>" is verified and entering the catalogue.`,
        },
        {
          kind: "rows",
          rows: [
            { k: "Date", v: `${humanDate(s.date, fr)}${s.endDate ? ` → ${humanDate(s.endDate, fr)}` : ""}` },
            { k: fr ? "Lieu" : "Venue", v: `${s.venue}, ${s.city}` },
          ],
        },
        {
          kind: "actions",
          actions: [{ href: find, label: fr ? "Voir la fiche" : "See the page", tone: "primary" }],
        },
        {
          kind: "note",
          text: fr
            ? "La mise en ligne peut prendre quelques heures, le temps que la fiche soit saisie et le site régénéré. Un détail à corriger ? Réponds à ce message."
            : "It can take a few hours to appear, the time for the page to be written in and the site rebuilt. Something to fix? Just reply.",
        },
      ],
      footnote: fr
        ? "Tu reçois ce message parce que cet événement a été déposé depuis ton compte promoteur."
        : "You are getting this because this event was submitted from your promoter account.",
    });
  }

  return send(`RaveRadar, ${s.title}`, {
    lang: fr ? "fr" : "en",
    kicker: fr ? "Dépôt en attente" : "Submission on hold",
    title: s.title,
    preheader: fr ? "Il manque une source vérifiable." : "A verifiable source is missing.",
    blocks: [
      {
        kind: "text",
        text: fr
          ? `« <b>${escapeMail(s.title)}</b> » n'a pas pu être publié en l'état.`
          : `"<b>${escapeMail(s.title)}</b>" couldn't be published as is.`,
      },
      {
        kind: "text",
        text: fr
          ? "Il manque le plus souvent une source vérifiable (page officielle, billetterie) ou une information confirmée : le catalogue n'invente aucune donnée, donc une date ou un tarif non sourcé attend. Réponds à ce message avec le lien et on reprend le dossier."
          : "Usually a verifiable source (official page, ticketing) or a confirmed detail is missing: the catalogue invents no data, so an unsourced date or price waits. Reply with the link and we will pick it up again.",
        muted: true,
      },
    ],
    footnote: fr
      ? "Tu reçois ce message parce que cet événement a été déposé depuis ton compte promoteur."
      : "You are getting this because this event was submitted from your promoter account.",
  });
}
