import type { Lang, RaveEvent } from "./types";

/* ---------------------------------------------------------------------------
   Festival guides, long-form editorial for the handful of events that deserve
   more than a description and a line-up.

   An `EventDetail` page is built for a single date at a single venue. That model
   breaks for city-wide, week-long programmes (ADE, and later Sónar, Tomorrowland,
   Nuits sonores…), where the reader's real questions are "what actually happens
   on which day", "is there one ticket or many" and "which night do I pick".
   A guide answers those, in both languages, from verified sources only.

   Guides are keyed by (festival title, year) rather than by id, so a new edition
   gets its own guide instead of silently inheriting last year's programme.
--------------------------------------------------------------------------- */

/** A bilingual string, same convention as `desc` / `descEn` on RaveEvent. */
export interface L {
  fr: string;
  en: string;
}
export const pick = (v: L, lang: Lang): string => (lang === "en" ? v.en : v.fr);

export interface GuideStat {
  value: L; // digit grouping differs per locale ("1 200" vs "1,200")
  label: L;
}
/** A block of prose under its own H3. */
export interface GuideBlock {
  title: L;
  body: L;
}
/** One strand of the programme (ADE Pro, ADE Lab…), a named sub-programme. */
export interface GuideStrand {
  name: string;
  when: L;
  body: L;
}
/** One day of the week, with the events from our own calendar that land on it. */
export interface GuideDay {
  date: string; // ISO yyyy-mm-dd
  title: L;
  body: L;
  eventIds: number[];
}
export interface GuidePass {
  name: L;
  price: L;
  body: L;
}
/** `slug` links to /lieux/{slug}, leave it out when the venue has no page yet. */
export interface GuideVenue {
  name: string;
  slug?: string;
  body: L;
}

export interface FestivalGuide {
  festival: string; // must match RaveEvent.title exactly
  year: number;
  metaTitle: L; // " | RaveRadar" is appended by the route
  metaDesc: L;
  /** The one thing a reader must understand before anything else. */
  hook: L;
  intro: L[];
  stats: GuideStat[];
  blocks: GuideBlock[];
  strands: GuideStrand[];
  days: GuideDay[];
  passes: GuidePass[];
  passNote: L;
  venues: GuideVenue[];
  venueNote: L;
  practical: GuideBlock[];
  faq: { q: L; a: L }[];
  officialUrl: string;
  /** Deep link into the official programme, pre-filtered on the edition's dates. */
  programUrl: string;
  /** Events of ours that are part of the programme, rendered as cards, and as
   *  schema.org `subEvent` / `superEvent` on both sides. */
  subEventIds: number[];
}

/* ---------------------------------------------------------------------------
   Amsterdam Dance Event 2026, 21→25 October, the 30th anniversary.
   Sources: amsterdam-dance-event.nl (programme, ADE Pro, tickets), the ADE 2025
   wrap-up press release for the figures, DJ Mag / Billboard for Jean-Michel
   Jarre as guest of honour. Per-night details come from our own verified
   entries for the week (ids 58, 128, 130, 131, 132).
--------------------------------------------------------------------------- */
const ADE_2026: FestivalGuide = {
  festival: "Amsterdam Dance Event (ADE)",
  year: 2026,
  metaTitle: {
    fr: "Amsterdam Dance Event 2026 (ADE) : dates, programme, billets & line-up",
    en: "Amsterdam Dance Event 2026 (ADE): dates, programme, tickets & line-up",
  },
  metaDesc: {
    fr: "ADE 2026, du 21 au 25 octobre à Amsterdam : 1 200+ événements dans 300+ lieux. Programme jour par jour, prix des billets, pass ADE Pro et line-up.",
    en: "ADE 2026 runs 21–25 October in Amsterdam: 1,200+ events across 300+ venues. Day-by-day programme, ticket prices, the ADE Pro Pass and who plays.",
  },
  hook: {
    fr: "L'ADE n'est pas une soirée, ni même un festival au sens habituel : c'est une ville entière transformée en dancefloor pendant cinq jours. Plus de 1 200 événements dans plus de 300 lieux, chacun avec son propre organisateur et sa propre billetterie. Il n'existe aucun bracelet unique qui ouvre tout, on construit son ADE soirée par soirée.",
    en: "ADE isn't one party, and it isn't a festival in the usual sense either: it's an entire city turned into a dancefloor for five days. More than 1,200 events across 300+ venues, each with its own promoter and its own ticket. There is no single wristband that opens everything, you build your ADE night by night.",
  },
  intro: [
    {
      fr: "Chaque mois d'octobre, Amsterdam devient la capitale mondiale de la musique électronique. L'Amsterdam Dance Event, ADE pour tout le monde, occupe la ville du mercredi 21 au dimanche 25 octobre 2026. Clubs, entrepôts, salles de concert, églises, musées, péniches et rooftops font tourner en parallèle un festival de nuit, une conférence professionnelle le jour et un programme arts & culture.",
      en: "Every October, Amsterdam becomes the world capital of electronic music. Amsterdam Dance Event, ADE to everyone, takes over the city from Wednesday 21 to Sunday 25 October 2026. Clubs, warehouses, concert halls, churches, museums, boats and rooftops run a night-time festival, a daytime industry conference and an arts & culture programme in parallel.",
    },
    {
      fr: "En 2026, l'ADE fête ses 30 ans. Né en 1996 comme une petite conférence pour la filière néerlandaise, il rassemblait en 2025 près de 600 000 visiteurs et environ 3 500 artistes : la plus forte concentration de musique électronique au monde sur cinq jours.",
      en: "In 2026, ADE turns 30. Launched in 1996 as a small conference for the Dutch industry, its 2025 edition drew close to 600,000 visitors and around 3,500 artists, the densest concentration of electronic music anywhere on earth over five days.",
    },
    {
      fr: "Le point d'orgue de l'édition anniversaire est déjà connu : Jean-Michel Jarre, invité d'honneur, ouvre l'ADE 2026 à l'AFAS Live le 21 octobre avec un show exclusif présenté par MOJO et Insomniac, l'année des 50 ans d'« Oxygène ». Il donnera également une keynote à l'ADE Pro.",
      en: "The anniversary edition's centrepiece is already set: Jean-Michel Jarre, guest of honour, opens ADE 2026 at AFAS Live on 21 October with an exclusive show presented by MOJO and Insomniac, in the year 'Oxygène' turns 50. He also gives a keynote interview at ADE Pro.",
    },
  ],
  stats: [
    { value: { fr: "5", en: "5" }, label: { fr: "jours & nuits", en: "days & nights" } },
    { value: { fr: "1 200+", en: "1,200+" }, label: { fr: "événements au programme", en: "events on the programme" } },
    { value: { fr: "300+", en: "300+" }, label: { fr: "clubs, salles & lieux", en: "clubs, venues & spaces" } },
    { value: { fr: "3 500", en: "3,500" }, label: { fr: "artistes attendus", en: "artists expected" } },
    { value: { fr: "600 000", en: "600,000" }, label: { fr: "visiteurs en 2025", en: "visitors in 2025" } },
    { value: { fr: "11 000+", en: "11,000+" }, label: { fr: "professionnels à l'ADE Pro", en: "industry pros at ADE Pro" } },
  ],
  blocks: [
    {
      title: { fr: "Deux ADE en un seul", en: "Two ADEs in one" },
      body: {
        fr: "La nuit, c'est l'ADE Festival : les 1 200+ soirées ouvertes au public, d'un club de 200 places à l'AFAS Live et ses 6 000 spectateurs. Le jour, c'est l'ADE Pro : la conférence de l'industrie, installée à Felix Meritis, avec ses satellites ADE Lab, ADE Green, ADE Startups et ADE Arts & Culture. Les deux tournent en même temps, et beaucoup de visiteurs ne voient jamais la moitié qui ne les concerne pas.",
        en: "By night it's ADE Festival: the 1,200+ public parties, from a 200-capacity basement to AFAS Live and its 6,000 seats. By day it's ADE Pro: the industry conference, based at Felix Meritis, with its ADE Lab, ADE Green, ADE Startups and ADE Arts & Culture satellites. Both run at once, and plenty of visitors never see the half that isn't for them.",
      },
    },
    {
      title: { fr: "Pourquoi il n'y a pas de billet unique", en: "Why there's no single ticket" },
      body: {
        fr: "L'ADE ne vend pas d'entrée générale : c'est une plateforme, pas un promoteur. Chaque soirée est produite et vendue par son propre organisateur, Awakenings, Verknipt, Dockyard, Loveland, DGTL, Elrow, Drumcode, des labels, des clubs. Concrètement : on ouvre le programme officiel, on choisit ses soirées, on achète chaque billet séparément. Le seul pass transversal est l'ADE Pro Pass, pensé pour les professionnels.",
        en: "ADE doesn't sell a general admission ticket: it's a platform, not a promoter. Every party is produced and sold by its own organiser, Awakenings, Verknipt, Dockyard, Loveland, DGTL, Elrow, Drumcode, labels, clubs. In practice: open the official programme, pick your nights, buy each ticket separately. The only cross-cutting pass is the ADE Pro Pass, built for the industry.",
      },
    },
    {
      title: { fr: "Comment construire son planning", en: "How to plan your week" },
      body: {
        fr: "Trois règles. Un : les têtes d'affiche partent en quelques heures, les grosses soirées du samedi sont souvent complètes avant octobre. Deux : compter les trajets. Le Havenpark et le NDSM sont au nord de l'IJ (ferry gratuit derrière Centraal), l'AFAS Live est au sud-est en métro : deux événements éloignés le même soir, c'est une heure perdue. Trois : garder de la place pour l'imprévu, l'essentiel de l'ADE se joue dans les annonces de dernière minute et les after.",
        en: "Three rules. One: headliners sell out in hours, the big Saturday parties are often gone before October. Two: budget for travel. Havenpark and NDSM sit north of the IJ (free ferry behind Centraal), AFAS Live is south-east by metro; two far-apart events on one night costs you an hour. Three: leave room for the unplanned, a lot of ADE happens in last-minute announcements and afters.",
      },
    },
  ],
  strands: [
    {
      name: "ADE Festival",
      when: { fr: "21 → 25 octobre, surtout le soir", en: "21 → 25 October, mostly after dark" },
      body: {
        fr: "Le programme public : plus de 1 200 événements dans plus de 300 lieux, tous genres électroniques confondus, techno, house, drum & bass, hardstyle, trance, ambient, afro house.",
        en: "The public programme: 1,200+ events across 300+ venues, covering every electronic genre, techno, house, drum & bass, hardstyle, trance, ambient, afro house.",
      },
    },
    {
      name: "ADE Pro",
      when: { fr: "21 → 24 octobre, Felix Meritis", en: "21 → 24 October, Felix Meritis" },
      body: {
        fr: "La conférence historique de l'ADE : plus de 11 000 professionnels, keynotes, panels, matchmaking et Business Hubs. Jean-Michel Jarre y donne une keynote pour les 30 ans.",
        en: "ADE's founding conference: 11,000+ professionals, keynotes, panels, matchmaking and Business Hubs. Jean-Michel Jarre gives a keynote for the 30th anniversary.",
      },
    },
    {
      name: "ADE Lab",
      when: { fr: "Pendant la conférence", en: "Alongside the conference" },
      body: {
        fr: "Le volet artistes en développement : ateliers, masterclasses production, demo pitches devant des A&R, concours de démos et essais de matériel.",
        en: "The emerging-artist strand: workshops, production masterclasses, demo pitches in front of A&Rs, a demo contest and hands-on time with the latest gear.",
      },
    },
    {
      name: "ADE Green",
      when: { fr: "Pendant la conférence", en: "Alongside the conference" },
      body: {
        fr: "Le programme durabilité : empreinte des tournées et des festivals, mobilité du public, énergie, restauration.",
        en: "The sustainability programme: touring and festival footprints, audience mobility, energy and catering.",
      },
    },
    {
      name: "ADE Startups",
      when: { fr: "Pendant la conférence", en: "Alongside the conference" },
      body: {
        fr: "Le rendez-vous music-tech : pitchs de jeunes pousses, investisseurs, outils de création et de distribution.",
        en: "The music-tech track: startup pitches, investors, creation and distribution tooling.",
      },
    },
    {
      name: "ADE Arts & Culture",
      when: { fr: "21 → 25 octobre, dans toute la ville", en: "21 → 25 October, across the city" },
      body: {
        fr: "Expositions, installations audiovisuelles, projections, performances et conférences dans les musées et lieux culturels d'Amsterdam. Souvent gratuit ou à petit prix, et le meilleur moyen d'occuper une journée avant la nuit.",
        en: "Exhibitions, audiovisual installations, screenings, performances and talks in Amsterdam's museums and cultural venues. Often free or cheap, and the best way to fill a day before the night starts.",
      },
    },
    {
      name: "ADE Friends",
      when: { fr: "Toute la semaine", en: "All week" },
      body: {
        fr: "Le programme des partenaires : sessions ouvertes, showcases de labels et rendez-vous satellites greffés sur la semaine ADE.",
        en: "The partner programme: open sessions, label showcases and satellite events grafted onto the ADE week.",
      },
    },
  ],
  days: [
    {
      date: "2026-10-21",
      title: { fr: "Ouverture", en: "Opening night" },
      body: {
        fr: "Jean-Michel Jarre ouvre l'ADE 2026 à l'AFAS Live, show exclusif présenté par MOJO et Insomniac. Dans la journée, l'ADE Pro ouvre ses portes à Felix Meritis. Côté clubs, Awakenings lance sa résidence de cinq jours au SugarFactory et Loveland démarre sur ses deux sites.",
        en: "Jean-Michel Jarre opens ADE 2026 at AFAS Live, an exclusive show presented by MOJO and Insomniac. During the day, ADE Pro opens at Felix Meritis. On the club side, Awakenings starts its five-day residency at SugarFactory and Loveland opens across its two sites.",
      },
      eventIds: [58],
    },
    {
      date: "2026-10-22",
      title: { fr: "La nuit s'installe", en: "The week finds its rhythm" },
      body: {
        fr: "Premier gros temps fort techno : Drumcode prend le SugarFactory avec Adam Beyer, Enrico Sangiuliano, Ilario Alicante et Kevin de Vries. L'ADE Pro enchaîne sa deuxième journée de panels et de rendez-vous.",
        en: "The first big techno moment: Drumcode takes over SugarFactory with Adam Beyer, Enrico Sangiuliano, Ilario Alicante and Kevin de Vries. ADE Pro runs its second day of panels and meetings.",
      },
      eventIds: [128],
    },
    {
      date: "2026-10-23",
      title: { fr: "Le pic des clubs", en: "Peak club night" },
      body: {
        fr: "Le vendredi est le soir où la quasi-totalité des lieux tournent en même temps : c'est statistiquement la nuit la plus dense de la semaine, et celle où l'on arbitre le plus. Awakenings enchaîne ses Friday Sessions au SugarFactory.",
        en: "Friday is the night when nearly every venue in town is running at once, statistically the densest night of the week, and the one where you have to make the hardest choices. Awakenings continues with its Friday Sessions at SugarFactory.",
      },
      eventIds: [],
    },
    {
      date: "2026-10-24",
      title: { fr: "Le jour le plus chargé", en: "The busiest day" },
      body: {
        fr: "Le samedi est le jour des grands formats, et ils commencent en début d'après-midi. Dockyard Festival ADE ouvre à 13h au Havenpark (quatre scènes, plus de 27 artistes, dont Dax J et Oscar Mulero), Verknipt investit l'AFAS Live de 13h à 22h, et Boris Brejcha emmène FCKNG SERIOUS au Theater Amsterdam avec Loveland de 15h30 à 21h30. De quoi enchaîner un day event et une nuit.",
        en: "Saturday is when the big formats land, and they start in the early afternoon. Dockyard Festival ADE opens at 1pm at Havenpark (four stages, 27+ artists including Dax J and Oscar Mulero), Verknipt takes AFAS Live from 1pm to 10pm, and Boris Brejcha brings FCKNG SERIOUS to Theater Amsterdam with Loveland from 3.30pm to 9.30pm. Enough to chain a day event into a night out.",
      },
      eventIds: [131, 130, 132],
    },
    {
      date: "2026-10-25",
      title: { fr: "Clôture", en: "Closing day" },
      body: {
        fr: "Le dimanche est un vrai jour de programme, pas une fin de fête : Verknipt rejoue à l'AFAS Live de 14h à minuit, Awakenings clôture ses cinq jours au SugarFactory et Loveland referme ses deux sites. Prévoir un vol ou un train de fin de soirée, pas de milieu d'après-midi.",
        en: "Sunday is a full programme day, not an afterthought: Verknipt plays AFAS Live again from 2pm to midnight, Awakenings closes out its five days at SugarFactory and Loveland shuts down both sites. Book a late flight or train, not a mid-afternoon one.",
      },
      eventIds: [130],
    },
  ],
  passes: [
    {
      name: { fr: "Billet à la soirée", en: "Single-event ticket" },
      price: { fr: "≈ 25 – 45 €", en: "≈ €25 – 45" },
      body: {
        fr: "Le format le plus courant : une nuit, un club, un billet vendu par l'organisateur via la fiche du programme officiel.",
        en: "The standard format: one night, one club, one ticket sold by the promoter from its official programme listing.",
      },
    },
    {
      name: { fr: "Billet day event / grand format", en: "Day event / large format" },
      price: { fr: "≈ 55 – 70 €", en: "≈ €55 – 70" },
      body: {
        fr: "Les gros rendez-vous du week-end (Dockyard, Verknipt, Loveland, Awakenings) vendus à la journée ou à la soirée.",
        en: "The big weekend fixtures (Dockyard, Verknipt, Loveland, Awakenings) sold per day or per night.",
      },
    },
    {
      name: { fr: "ADE Pro Pass", en: "ADE Pro Pass" },
      price: { fr: "675 €", en: "€675" },
      body: {
        fr: "Cinq jours, toutes les tracks de la conférence (ADE Pro, ADE Green, ADE Culture Hub), un accès au programme festival et au programme arts & culture, les soirées networking et les Business Hubs, l'accès à l'année à la base ADE Pro, les transports GVB pendant cinq jours, le sac anniversaire et plus de 30 sessions en replay.",
        en: "Five days, every conference track (ADE Pro, ADE Green, ADE Culture Hub), access to the festival programme and the arts & culture programme, networking events and Business Hubs, year-round access to the ADE Pro database, five days of GVB public transport, the anniversary bag and 30+ sessions on demand.",
      },
    },
    {
      name: { fr: "ADE Lab Pass", en: "ADE Lab Pass" },
      price: { fr: "Tarif à venir", en: "Price TBA" },
      body: {
        fr: "Le pass ateliers, masterclasses et demo pitches, mis en vente plus près de l'événement.",
        en: "The workshops, masterclasses and demo-pitch pass, going on sale closer to the event.",
      },
    },
  ],
  passNote: {
    fr: "Les fourchettes par soirée sont indicatives : chaque organisateur fixe son prix et pratique souvent trois paliers (early bird, régulier, dernière minute). Le tarif officiel de l'ADE Pro Pass est celui publié par l'ADE ; vérifie toujours sur la billetterie officielle avant d'acheter.",
    en: "Per-night ranges are indicative: each promoter sets its own price, usually across three tiers (early bird, regular, last minute). The ADE Pro Pass price is the one published by ADE; always check the official ticket shop before buying.",
  },
  venues: [
    {
      name: "AFAS Live",
      slug: "afas-live",
      body: {
        fr: "6 000 places à Amsterdam-Zuidoost, à côté de la Johan Cruijff ArenA. Concert d'ouverture de Jean-Michel Jarre le 21, puis le double week-end Verknipt les 24 et 25.",
        en: "6,000 capacity in Amsterdam Zuidoost, next to the Johan Cruijff ArenA. Jean-Michel Jarre's opening concert on the 21st, then Verknipt's double weekend on the 24th and 25th.",
      },
    },
    {
      name: "SugarFactory",
      slug: "sugarfactory",
      body: {
        fr: "Le QG d'Awakenings pendant l'ADE, sur le Lijnbaansgracht : huit soirées enchaînées du 21 au 25 octobre, de l'Opening Night au closing Prophecy.",
        en: "Awakenings' ADE headquarters on Lijnbaansgracht: eight back-to-back parties from 21 to 25 October, from Opening Night to the Prophecy closing.",
      },
    },
    {
      name: "Havenpark",
      slug: "havenpark",
      body: {
        fr: "Site portuaire d'Amsterdam-Noord, hôte du Dockyard Festival ADE : quatre scènes en extérieur le samedi, de 13h à 23h.",
        en: "A dockland site in Amsterdam Noord, home to Dockyard Festival ADE: four outdoor stages on the Saturday, 1pm to 11pm.",
      },
    },
    {
      name: "Theater Amsterdam",
      slug: "theater-amsterdam",
      body: {
        fr: "Salle de spectacle reconvertie en club le temps de l'ADE, l'un des deux sites de Loveland, avec Boris Brejcha et FCKNG SERIOUS le samedi.",
        en: "A theatre turned club for ADE week, one of Loveland's two sites, hosting Boris Brejcha and FCKNG SERIOUS on the Saturday.",
      },
    },
    {
      name: "Felix Meritis",
      body: {
        fr: "La maison historique de l'ADE Pro, sur le Keizersgracht : c'est là que se tiennent les keynotes, les panels et le matchmaking, du 21 au 24 octobre.",
        en: "ADE Pro's historic home on Keizersgracht: keynotes, panels and matchmaking happen here from 21 to 24 October.",
      },
    },
  ],
  venueNote: {
    fr: "Au-delà de ces adresses, la semaine ADE s'appuie sur les habitués de la nuit amstellodamoise, Paradiso, Melkweg, De Marktkantine, Shelter, RADION, Thuishaven, Warehouse Elementenstraat, NDSM, et sur des dizaines de lieux ouverts pour l'occasion. La liste définitive est publiée au fil des annonces dans le programme officiel.",
    en: "Beyond these, ADE week leans on the regulars of Amsterdam nightlife, Paradiso, Melkweg, De Marktkantine, Shelter, RADION, Thuishaven, Warehouse Elementenstraat, NDSM, plus dozens of spaces opened just for the week. The final list is published announcement by announcement in the official programme.",
  },
  practical: [
    {
      title: { fr: "Se déplacer", en: "Getting around" },
      body: {
        fr: "Métro, tram et bus GVB couvrent la ville, avec un service de nuit. Les ferries derrière Centraal Station vers Amsterdam-Noord sont gratuits et tournent 24h/24, c'est la façon d'aller au NDSM et vers le Havenpark. Le vélo reste le moyen le plus rapide au centre, mais pas à 5h du matin après une nuit debout.",
        en: "GVB metro, tram and bus cover the city, with a night service. The ferries behind Centraal Station to Amsterdam Noord are free and run 24/7, that's how you reach NDSM and Havenpark. Cycling is still the fastest way around the centre, though not at 5am after an all-nighter.",
      },
    },
    {
      title: { fr: "Se loger", en: "Where to stay" },
      body: {
        fr: "La semaine de l'ADE est l'un des pics hôteliers de l'année à Amsterdam : les prix doublent facilement et les auberges affichent complet. Réserver deux à trois mois à l'avance, ou viser Haarlem, Zaandam et Amstelveen, à 15-20 minutes de train.",
        en: "ADE week is one of Amsterdam's peak hotel weeks: prices easily double and hostels sell out. Book two to three months ahead, or look at Haarlem, Zaandam and Amstelveen, 15–20 minutes away by train.",
      },
    },
    {
      title: { fr: "Entrée & âge", en: "Entry & age" },
      body: {
        fr: "La grande majorité des soirées sont 18+ et la pièce d'identité est contrôlée à l'entrée. Beaucoup de lieux sont cashless (carte ou jetons). Les vestiaires sont payants, comptez 3 à 5 €.",
        en: "The vast majority of parties are 18+ and ID is checked at the door. Many venues are cashless (card or tokens). Cloakrooms are paid, budget €3 to €5.",
      },
    },
    {
      title: { fr: "Venir de France", en: "Getting there from abroad" },
      body: {
        fr: "Paris–Amsterdam en train direct en 3h20, arrivée à Centraal Station en plein centre. Schiphol est à 15 minutes de train du centre, avec des liaisons depuis toutes les grandes villes européennes. Le train de retour du dimanche soir est le plus recherché de la semaine : le réserver en même temps que les billets de soirée.",
        en: "Paris–Amsterdam is 3h20 by direct train into Centraal Station, right in the centre. Schiphol is 15 minutes from the centre by train, with connections from every major European city. Sunday evening return trains are the most sought-after of the week, book them at the same time as your party tickets.",
      },
    },
  ],
  faq: [
    {
      q: { fr: "L'Amsterdam Dance Event, c'est quoi exactement ?", en: "What exactly is Amsterdam Dance Event?" },
      a: {
        fr: "C'est à la fois le plus grand festival de club au monde et la principale conférence de l'industrie électronique. Pendant cinq jours, plus de 1 200 événements se tiennent dans plus de 300 lieux d'Amsterdam : soirées ouvertes au public la nuit, panels et rendez-vous professionnels le jour, expositions et installations en parallèle.",
        en: "It's simultaneously the world's biggest club festival and the electronic industry's leading conference. Over five days, 1,200+ events run across 300+ Amsterdam venues: public parties by night, panels and industry meetings by day, exhibitions and installations alongside.",
      },
    },
    {
      q: { fr: "Quelles sont les dates de l'ADE 2026 ?", en: "What are the ADE 2026 dates?" },
      a: {
        fr: "Du mercredi 21 au dimanche 25 octobre 2026, à Amsterdam. C'est l'édition des 30 ans de l'ADE, créé en 1996. La conférence ADE Pro se tient du 21 au 24 octobre à Felix Meritis, le programme festival court jusqu'au dimanche soir.",
        en: "Wednesday 21 to Sunday 25 October 2026, in Amsterdam. It's the edition marking 30 years of ADE, founded in 1996. The ADE Pro conference runs 21 to 24 October at Felix Meritis; the festival programme runs through to Sunday night.",
      },
    },
    {
      q: { fr: "L'ADE est-il un seul festival sur un seul site ?", en: "Is ADE a single festival on a single site?" },
      a: {
        fr: "Non, et c'est la confusion la plus fréquente. Il n'y a ni plaine de festival, ni camping, ni bracelet unique. L'ADE est un programme réparti dans toute la ville, où chaque événement est produit et vendu par un organisateur différent. On choisit ses soirées dans le programme officiel et on achète chaque billet séparément.",
        en: "No, and that's the single most common misunderstanding. There's no festival field, no campsite, no all-access wristband. ADE is a programme spread across the whole city, where each event is produced and sold by a different organiser. You pick your nights from the official programme and buy each ticket separately.",
      },
    },
    {
      q: { fr: "Combien coûte une semaine à l'ADE ?", en: "How much does an ADE week cost?" },
      a: {
        fr: "Compter environ 25 à 45 € pour une soirée en club et 55 à 70 € pour un grand format du week-end (Dockyard, Verknipt, Loveland, Awakenings). Une partie du programme arts & culture et des sessions ADE Friends est gratuite. Le poste le plus lourd reste le logement : la semaine de l'ADE est l'un des pics hôteliers de l'année.",
        en: "Budget roughly €25–45 for a club night and €55–70 for one of the big weekend formats (Dockyard, Verknipt, Loveland, Awakenings). Part of the arts & culture programme and the ADE Friends sessions are free. The heaviest cost is accommodation: ADE week is one of the city's peak hotel weeks.",
      },
    },
    {
      q: { fr: "Existe-t-il un pass qui donne accès à tout ?", en: "Is there a pass that gets you into everything?" },
      a: {
        fr: "Pas pour le grand public. Le seul pass transversal est l'ADE Pro Pass à 675 €, destiné aux professionnels : il couvre les cinq jours de conférence, le networking, les Business Hubs, et donne aussi un accès au programme festival et au programme arts & culture. Un ADE Lab Pass est mis en vente plus près de l'événement.",
        en: "Not for the general public. The only cross-cutting pass is the €675 ADE Pro Pass, aimed at the industry: it covers five days of conference, networking and Business Hubs, and also grants access to the festival and arts & culture programmes. An ADE Lab Pass goes on sale closer to the event.",
      },
    },
    {
      q: { fr: "Quel jour choisir si je ne viens qu'une fois ?", en: "Which day should I pick if I can only come once?" },
      a: {
        fr: "Le samedi 24 octobre concentre les plus gros formats (Dockyard Festival au Havenpark, Verknipt à l'AFAS Live, Loveland au Theater Amsterdam) et permet d'enchaîner un day event l'après-midi et une nuit en club. Le vendredi 23 offre le plus grand nombre de soirées simultanées, donc le plus de choix. Le mercredi 21 est le jour de l'ouverture officielle.",
        en: "Saturday 24 October packs in the biggest formats (Dockyard Festival at Havenpark, Verknipt at AFAS Live, Loveland at Theater Amsterdam) and lets you chain an afternoon day event into a club night. Friday 23 has the largest number of parties running at once, so the widest choice. Wednesday 21 is official opening night.",
      },
    },
    {
      q: { fr: "Faut-il réserver ses billets à l'avance ?", en: "Do I need to book tickets in advance?" },
      a: {
        fr: "Oui pour les grosses soirées : les têtes d'affiche du week-end partent souvent avant octobre, et les organisateurs vendent en paliers (early bird, régulier, dernière minute). En revanche, une bonne partie des clubs plus petits garde des places jusqu'au jour même, et les annonces continuent de tomber jusqu'à la dernière semaine.",
        en: "Yes for the big nights: weekend headliners often sell out before October, and promoters release tickets in tiers (early bird, regular, last minute). That said, plenty of smaller clubs hold tickets back until the day itself, and new announcements keep landing right up to the final week.",
      },
    },
    {
      q: { fr: "Qui joue à l'ADE 2026 ?", en: "Who's playing ADE 2026?" },
      a: {
        fr: "Jean-Michel Jarre ouvre l'édition à l'AFAS Live le 21 octobre. Côté clubs, les line-ups déjà confirmés incluent Adam Beyer, Enrico Sangiuliano, Ilario Alicante, Kevin de Vries et Victor Ruiz chez Awakenings, Dax J, Oscar Mulero, Jennifer Cardini et Space 92 au Dockyard, et Boris Brejcha avec FCKNG SERIOUS chez Loveland. Le reste des 3 500 artistes est annoncé progressivement jusqu'en octobre.",
        en: "Jean-Michel Jarre opens the edition at AFAS Live on 21 October. On the club side, confirmed line-ups already include Adam Beyer, Enrico Sangiuliano, Ilario Alicante, Kevin de Vries and Victor Ruiz for Awakenings, Dax J, Oscar Mulero, Jennifer Cardini and Space 92 at Dockyard, and Boris Brejcha with FCKNG SERIOUS for Loveland. The rest of the 3,500 artists is announced progressively through to October.",
      },
    },
  ],
  officialUrl: "https://www.amsterdam-dance-event.nl/en/",
  programUrl:
    "https://www.amsterdam-dance-event.nl/en/program/filter/?section=events&type=8262%2C8263&from=2026-10-21&to=2026-10-25",
  subEventIds: [58, 128, 131, 130, 132],
};

export const GUIDES: FestivalGuide[] = [ADE_2026];

/** The guide for this exact edition, if we've written one. */
export const guideFor = (e: RaveEvent): FestivalGuide | undefined =>
  GUIDES.find((g) => g.festival === e.title && g.year === Number(e.date.slice(0, 4)));

/** The umbrella programme this event belongs to, the reverse of `subEventIds`. */
export const guideParentOf = (e: RaveEvent): FestivalGuide | undefined =>
  GUIDES.find((g) => g.subEventIds.includes(e.id));
