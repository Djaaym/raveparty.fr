import type { Lang } from "./types";

/**
 * Le contenu des pages institutionnelles : à propos, contact, mentions légales,
 * confidentialité.
 *
 * Elles manquaient toutes les quatre, et c'est un défaut à trois étages. **Légal**
 * d'abord : un site français qui collecte des adresses e-mail doit publier ses mentions
 * légales (LCEN, article 6-III) et l'information des personnes que le RGPD impose
 * (articles 13 et 14), et aucune des deux n'existait. **Référencement** ensuite : un
 * annuaire dont l'éditeur n'est identifiable nulle part ne peut pas être traité comme
 * une source, c'est exactement ce que mesure l'E-E-A-T, et ce plafond-là ne se lève pas
 * en ajoutant des pages d'événements. **Commercial** enfin : sans page contact, ni un
 * promoteur ni une régie ne peut écrire, et l'adresse du propriétaire vit dans
 * `lib/subscribers.ts`, module serveur, précisément pour ne pas être ramassée par les
 * robots à spam.
 *
 * Module **feuille** : il ne tire ni le catalogue ni l'i18n, pour qu'un composant
 * client puisse l'importer sans embarquer `lib/data.ts` (voir l'en-tête de
 * `lib/display.ts`). Le contenu est bilingue par le même type `L` que les guides.
 *
 * Ce qui est écrit ici est **vérifiable ou vide**, jamais approximatif : les champs
 * qu'un particulier doit publier (nom, adresse de contact) viennent de variables
 * d'environnement, et quand elles ne sont pas posées la page le dit au lieu d'inventer
 * une raison sociale. C'est la règle de contenu du catalogue, appliquée à l'éditeur.
 */

export type L = { fr: string; en: string };
export const pickL = (v: L, lang: Lang) => (lang === "en" ? v.en : v.fr);

/** Un bloc de page institutionnelle : un titre, puis des paragraphes. */
export type LegalBlock = { h: L; p: L[] };

/**
 * L'éditeur du site. Les valeurs par défaut sont celles qu'on peut affirmer sans
 * risque ; `LEGAL_OWNER` et `LEGAL_ADDRESS` se posent en variables d'environnement le
 * jour où une structure est créée. `CONTACT_EMAIL` est **la seule adresse publiée**,
 * et elle l'est en clair : une adresse de contact qu'on masque n'est pas une adresse de
 * contact, et l'obligation légale porte sur le fait de pouvoir être joint.
 */
export const LEGAL_OWNER = process.env.LEGAL_OWNER ?? "";
export const LEGAL_ADDRESS = process.env.LEGAL_ADDRESS ?? "";
export const LEGAL_STATUS = process.env.LEGAL_STATUS ?? "";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "contact@raveparty.fr";
/** L'hébergeur est un fait, pas une préférence : c'est Vercel qui sert le site. */
export const HOST_NAME = "Vercel Inc.";
export const HOST_ADDRESS = "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis";

/* --------------------------------------------------------------------------
   À propos
-------------------------------------------------------------------------- */

export function aboutBlocks(stats: { events: number; countries: number; cities: number }): LegalBlock[] {
  const { events, countries, cities } = stats;
  return [
    {
      h: { fr: "Ce que fait RaveRadar", en: "What RaveRadar does" },
      p: [
        {
          fr: `RaveRadar référence les festivals et les soirées déclarées de musique électronique en Europe : ${events} dates, ${countries} pays, ${cities} villes. Une fiche par événement, avec la date, la salle, le line-up annoncé, le tarif d'entrée le plus bas et le lien vers la billetterie officielle.`,
          en: `RaveRadar lists Europe's declared electronic music festivals and club nights: ${events} dates, ${countries} countries, ${cities} cities. One page per event, with the date, the venue, the announced line-up, the lowest gate price and a link to the official ticket office.`,
        },
        {
          fr: "Autour du calendrier, le site publie une fiche par artiste, par salle, par ville et par genre, pour qu'on puisse partir d'un nom, d'un club ou d'un style plutôt que d'une date.",
          en: "Around the calendar, the site publishes a page per artist, venue, city and genre, so you can start from a name, a club or a style rather than from a date.",
        },
      ],
    },
    {
      h: { fr: "Comment la donnée est vérifiée", en: "How the data is checked" },
      p: [
        {
          fr: "Rien n'est inventé : une date, un line-up, une salle et un tarif viennent du site de l'organisateur, de sa billetterie ou d'un agenda qui fait autorité. Quand une information n'est pas publiée, la fiche le dit, « programmation à venir » plutôt qu'un line-up plausible, « tarif à venir » plutôt qu'un prix rond.",
          en: "Nothing is invented: a date, a line-up, a venue and a price come from the organiser's own site, its ticket office or an authoritative listing. When something has not been published, the page says so, \"line-up to be announced\" rather than a plausible bill, \"price to be confirmed\" rather than a round number.",
        },
        {
          fr: "Un tarif que nous n'avons pas pu confirmer s'affiche précédé d'un « ≈ ». Un montant est toujours dans la devise qu'on paie à l'entrée, jamais converti en euros à un taux du jour que personne n'a annoncé.",
          en: "A price we could not confirm is shown with a \"≈\". An amount is always in the currency you pay at the door, never converted to euros at a rate nobody quoted.",
        },
        {
          fr: "Les éditions passées restent en ligne, avec un bandeau qui le dit et un lien vers l'édition suivante : une archive de line-up a de la valeur, une date périmée présentée comme à venir n'en a aucune.",
          en: "Past editions stay online, flagged as finished and linked to the next edition: a line-up archive has value, an expired date presented as upcoming has none.",
        },
      ],
    },
    {
      h: { fr: "Comment le site gagne de l'argent", en: "How the site makes money" },
      p: [
        {
          fr: "Certains liens vers les billetteries sont des liens affiliés : si un billet est acheté après un clic depuis le site, nous touchons une commission, sans que le prix change pour l'acheteur. Ces liens portent l'attribut « sponsored » et le bloc hôtel affiche sa mention d'affiliation avant le clic, jamais en pied de page.",
          en: "Some ticket links are affiliate links: if a ticket is bought after a click from the site we earn a commission, at no extra cost to the buyer. Those links carry the \"sponsored\" attribute, and the hotel block shows its affiliate disclosure before the click, never buried in the footer.",
        },
        {
          fr: "Le référencement d'un événement est gratuit et ne s'achète pas. Aucun organisateur ne paie pour figurer au catalogue, ni pour y figurer plus haut.",
          en: "Listing an event is free and cannot be bought. No organiser pays to be in the catalogue, or to rank higher inside it.",
        },
      ],
    },
    {
      h: { fr: "Signaler une erreur", en: "Report a mistake" },
      p: [
        {
          fr: `Une date fausse, un line-up qui a changé, un événement annulé : écrivez à ${CONTACT_EMAIL} en indiquant la page concernée. Les corrections d'organisateurs passent en priorité, ce sont les mieux sourcées.`,
          en: `A wrong date, a changed line-up, a cancelled event: write to ${CONTACT_EMAIL} with the page concerned. Corrections from organisers come first, they are the best sourced.`,
        },
      ],
    },
  ];
}

/* --------------------------------------------------------------------------
   Mentions légales
-------------------------------------------------------------------------- */

export function legalBlocks(): LegalBlock[] {
  const owner = LEGAL_OWNER
    ? `${LEGAL_OWNER}${LEGAL_STATUS ? `, ${LEGAL_STATUS}` : ""}${LEGAL_ADDRESS ? `, ${LEGAL_ADDRESS}` : ""}.`
    : "";
  return [
    {
      h: { fr: "Éditeur du site", en: "Site publisher" },
      p: [
        owner
          ? { fr: owner, en: owner }
          : {
              fr: `Le site raveparty.fr est édité à titre individuel. L'éditeur est joignable à l'adresse ${CONTACT_EMAIL}, qui est le canal de contact officiel du site. Les coordonnées postales complètes sont communiquées sur demande écrite à cette adresse, ainsi qu'à toute autorité qui en fait la demande.`,
              en: `raveparty.fr is published by an individual. The publisher can be reached at ${CONTACT_EMAIL}, which is the site's official contact channel. Full postal details are provided on written request to that address, and to any authority that asks for them.`,
            },
        {
          fr: `Directeur de la publication : l'éditeur du site. Contact : ${CONTACT_EMAIL}.`,
          en: `Publication director: the site publisher. Contact: ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      h: { fr: "Hébergement", en: "Hosting" },
      p: [
        {
          fr: `Le site est hébergé par ${HOST_NAME}, ${HOST_ADDRESS}.`,
          en: `The site is hosted by ${HOST_NAME}, ${HOST_ADDRESS}.`,
        },
      ],
    },
    {
      h: { fr: "Propriété intellectuelle", en: "Intellectual property" },
      p: [
        {
          fr: "Les textes de présentation, la structure du site et le classement des données sont la propriété de l'éditeur. Les noms d'événements, de festivals, de salles, de labels et d'artistes appartiennent à leurs titulaires respectifs et sont cités à titre d'information, dans le cadre d'un annuaire.",
          en: "The editorial texts, the site structure and the arrangement of the data belong to the publisher. Event, festival, venue, label and artist names belong to their respective owners and are quoted for information, as part of a directory.",
        },
        {
          fr: "Les portraits d'artistes proviennent de Wikimedia Commons ou d'un dépôt fait par un ayant droit : l'auteur et la licence sont affichés sous chaque image, ce qui est la condition de leur réutilisation et non un ornement. Les affiches sont celles des organisateurs, ou des visuels d'illustration produits pour le site, annoncés comme tels par leur texte alternatif.",
          en: "Artist portraits come from Wikimedia Commons or from a rights holder's own upload: the author and the licence are shown under each image, which is the condition of reuse and not an ornament. Posters are the organisers' own, or illustration visuals produced for the site, announced as such in their alt text.",
        },
        {
          fr: "Une demande de retrait d'une image ou d'un contenu peut être adressée à l'adresse de contact ; elle est traitée sans délai.",
          en: "A takedown request for an image or a piece of content can be sent to the contact address; it is handled without delay.",
        },
      ],
    },
    {
      h: { fr: "Responsabilité", en: "Liability" },
      p: [
        {
          fr: "Les informations publiées sont vérifiées à la source au moment de leur saisie, mais un événement peut être reporté, déplacé ou annulé après coup. Avant de vous déplacer, la billetterie et le site de l'organisateur font foi. L'éditeur ne peut être tenu responsable d'un déplacement effectué sur la foi d'une information devenue inexacte.",
          en: "Published information is checked at source when entered, but an event may later be postponed, moved or cancelled. Before travelling, the ticket office and the organiser's own site prevail. The publisher cannot be held liable for a journey made on the strength of information that has since become inaccurate.",
        },
        {
          fr: "Le site renvoie vers des sites tiers (organisateurs, billetteries, réseaux sociaux) sur lesquels l'éditeur n'a aucun contrôle et dont il ne répond pas.",
          en: "The site links to third-party sites (organisers, ticket offices, social networks) over which the publisher has no control and for which it is not answerable.",
        },
      ],
    },
    {
      h: { fr: "Liens affiliés", en: "Affiliate links" },
      p: [
        {
          fr: "Certains liens vers les billetteries et l'hébergement sont rémunérés. Ils sont signalés par l'attribut « sponsored » et, pour le bloc hôtel, par une mention visible avant le clic. Le prix payé est le même qu'en passant directement par le vendeur.",
          en: "Some ticketing and accommodation links are paid. They carry the \"sponsored\" attribute and, for the hotel block, a disclosure visible before the click. The price paid is the same as going to the seller directly.",
        },
      ],
    },
  ];
}

/* --------------------------------------------------------------------------
   Confidentialité
-------------------------------------------------------------------------- */

export function privacyBlocks(): LegalBlock[] {
  return [
    {
      h: { fr: "Le principe", en: "The principle" },
      p: [
        {
          fr: "Ce site ne demande pas de compte pour être consulté, ne construit pas de profil publicitaire et ne revend aucune donnée. Ce qui suit décrit exactement ce qui est collecté, pourquoi, et combien de temps c'est gardé.",
          en: "This site does not require an account to be read, does not build an advertising profile and does not sell any data. What follows describes exactly what is collected, why, and for how long it is kept.",
        },
      ],
    },
    {
      h: { fr: "Mesure d'audience", en: "Audience measurement" },
      p: [
        {
          fr: "Le site utilise une mesure d'audience interne : pages vues, temps passé, défilement, clics sortants. Elle ne pose aucun cookie, ne conserve aucune adresse IP, et travaille sur un identifiant aléatoire rangé dans la mémoire de votre navigateur. C'est la forme que la CNIL exempte de consentement, et elle sert uniquement à savoir quelles pages sont utiles.",
          en: "The site runs its own audience measurement: page views, time on page, scrolling, outbound clicks. It sets no cookie, keeps no IP address, and works from a random identifier stored in your browser. This is the shape the French regulator exempts from consent, and it serves only to know which pages are useful.",
        },
        {
          fr: "Google Analytics et le tag d'affiliation Impact, eux, déposent des cookies. Ils ne sont chargés qu'après votre accord, donné depuis le bandeau affiché à votre première visite. Tant que vous n'avez pas accepté, aucun des deux n'est exécuté ; un refus est mémorisé six mois et peut être changé à tout moment depuis le lien en pied de page.",
          en: "Google Analytics and the Impact affiliate tag do set cookies. They are loaded only after you agree, from the banner shown on your first visit. Until you accept, neither runs; a refusal is remembered for six months and can be changed at any time from the footer link.",
        },
      ],
    },
    {
      h: { fr: "Alertes et lettre d'information", en: "Alerts and newsletter" },
      p: [
        {
          fr: "Si vous créez une alerte, votre adresse e-mail et l'objet de l'alerte (un artiste, une ville, un genre, un pays) sont enregistrés chez notre prestataire d'envoi, Brevo (Sendinblue SAS, France), qui héberge la liste de contacts et gère la preuve du consentement ainsi que le lien de désinscription.",
          en: "If you create an alert, your email address and what it watches (an artist, a city, a genre, a country) are stored with our sending provider, Brevo (Sendinblue SAS, France), which hosts the contact list and handles proof of consent and the unsubscribe link.",
        },
        {
          fr: "Cette adresse ne sert qu'à vous envoyer ce que vous avez demandé. Elle n'est ni revendue, ni transmise à un organisateur. Chaque message porte un lien de désinscription, et la désinscription efface le contact.",
          en: "That address is used only to send you what you asked for. It is neither sold nor passed to an organiser. Every message carries an unsubscribe link, and unsubscribing deletes the contact.",
        },
      ],
    },
    {
      h: { fr: "Comptes organisateurs", en: "Organiser accounts" },
      p: [
        {
          fr: "Un organisateur qui crée un compte fournit le nom de sa structure, une adresse e-mail, une ville et un pays, éventuellement un site et un identifiant légal. Ces données servent à vérifier qui dépose un événement, ce qui est la condition de confiance d'un annuaire, et sont conservées tant que le compte existe. Le mot de passe est stocké sous forme d'empreinte (scrypt), jamais en clair.",
          en: "An organiser who creates an account provides their organisation name, an email address, a city and a country, optionally a website and a registration number. This is used to verify who submits an event, which is what makes a directory trustworthy, and is kept for as long as the account exists. The password is stored as a hash (scrypt), never in clear text.",
        },
      ],
    },
    {
      h: { fr: "Ce qui reste dans votre navigateur", en: "What stays in your browser" },
      p: [
        {
          fr: "Vos favoris et la liste de vos alertes sont enregistrés dans la mémoire locale de votre navigateur. Ils ne partent sur aucun serveur, ne nous sont pas lisibles, et disparaissent si vous videz les données du site.",
          en: "Your favourites and your alert list are stored in your browser's local storage. They are sent to no server, are not readable by us, and disappear if you clear the site's data.",
        },
      ],
    },
    {
      h: { fr: "Durées de conservation", en: "Retention" },
      p: [
        {
          fr: "Mesure d'audience interne : treize mois au plus, effacement automatique. Adresse d'alerte : jusqu'à la désinscription. Compte organisateur : jusqu'à sa suppression. Dépôt d'événement : le temps de la vérification, puis conservé comme trace de la source d'une fiche publiée.",
          en: "First-party analytics: thirteen months at most, deleted automatically. Alert address: until you unsubscribe. Organiser account: until it is deleted. Event submission: for as long as verification takes, then kept as a record of a published page's source.",
        },
      ],
    },
    {
      h: { fr: "Vos droits", en: "Your rights" },
      p: [
        {
          fr: `Vous pouvez demander l'accès, la rectification, l'effacement ou la portabilité de vos données, et vous opposer à leur traitement, en écrivant à ${CONTACT_EMAIL}. La demande est traitée sous un mois. Vous pouvez également saisir la CNIL (cnil.fr) si la réponse ne vous convient pas.`,
          en: `You can request access to, correction of, deletion of or portability of your data, and object to its processing, by writing to ${CONTACT_EMAIL}. Requests are handled within a month. You can also complain to the French data protection authority (cnil.fr) if the answer does not satisfy you.`,
        },
      ],
    },
  ];
}

/* --------------------------------------------------------------------------
   Contact
-------------------------------------------------------------------------- */

export function contactBlocks(): LegalBlock[] {
  return [
    {
      h: { fr: "Corriger ou signaler une fiche", en: "Fix or report a listing" },
      p: [
        {
          fr: `Une date qui a changé, un line-up complété, un événement annulé, une image à retirer : écrivez à ${CONTACT_EMAIL} en indiquant l'adresse de la page. C'est le chemin le plus rapide, et une correction sourcée est appliquée le jour même.`,
          en: `A changed date, a completed line-up, a cancelled event, an image to take down: write to ${CONTACT_EMAIL} with the page address. It is the fastest route, and a sourced correction is applied the same day.`,
        },
      ],
    },
    {
      h: { fr: "Organisateurs et salles", en: "Organisers and venues" },
      p: [
        {
          fr: "Pour faire référencer vos dates, créez un compte organisateur : le dépôt est gratuit, les dates arrivent directement de leur source et sont relues avant publication. C'est aussi le seul moyen d'être prévenu quand une de vos fiches change.",
          en: "To get your dates listed, create an organiser account: submitting is free, dates come straight from their source and are checked before publication. It is also the only way to be told when one of your listings changes.",
        },
      ],
    },
    {
      h: { fr: "Presse et partenariats", en: "Press and partnerships" },
      p: [
        {
          fr: `Demandes presse, données du catalogue, partenariats billetterie : ${CONTACT_EMAIL}. Précisez l'objet dans le sujet du message, c'est ce qui décide du délai de réponse.`,
          en: `Press enquiries, catalogue data, ticketing partnerships: ${CONTACT_EMAIL}. Put the subject in the subject line, it is what decides how fast you get an answer.`,
        },
      ],
    },
  ];
}
