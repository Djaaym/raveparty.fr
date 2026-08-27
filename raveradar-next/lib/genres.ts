import type { Lang } from "./types";
import type { L } from "./guides";

/* Ce que /genres racontait jusqu'ici tenait en une ligne par style ("Le battement 4/4
   de Berlin et au-delà") : joli sur une vignette carrée, mais qui ne répond à aucune
   des questions que se pose vraiment quelqu'un devant la grille — à quelle vitesse ça
   joue, d'où ça vient, et surtout en quoi la hard techno n'est pas la techno.
   `GENRE_DESC_FR` / `GENRE_DESC_EN` restent la punchline (carte d'événement, tuile de
   la home) ; ce fichier porte la fiche.

   Même règle de contenu que le catalogue : rien d'inventé. Ce sont des faits d'histoire
   de la musique, vérifiables (villes, décennies, machines, noms de disques fondateurs),
   pas des impressions. Les fourchettes de BPM sont celles couramment admises et
   annoncées comme telles — un tempo est un usage, pas une norme.

   `tell` est le seul champ un peu inhabituel : c'est le signe qui ne trompe pas, ce
   qu'on entend et qui permet de reconnaître le style en trente secondes sur un dancefloor.
   C'est ce qui manquait le plus à la page : une définition qui serve à quelque chose.

   `hook`, `long` et `marks` sont venus après, pour la page du genre elle-même. Le hub
   /genres présente onze styles côte à côte : trois phrases par carte, c'est la bonne
   longueur pour comparer. La page d'un seul style, elle, est l'endroit où quelqu'un
   arrive en cherchant « c'est quoi la hard techno » — trois phrases y sont un résumé,
   pas une réponse. D'où l'accroche en tête (`hook`), les deux paragraphes qui disent
   comment ça se joue et où ça se joue aujourd'hui (`long`), et la fiche signalétique
   (`marks`) : machine, ville, format — les trois faits qu'on retient d'un style. */

export interface GenreProfile {
  /** Fourchette de tempo couramment pratiquée, en BPM. */
  bpm: string;
  /** Lieu et décennie de naissance — l'ancrage le plus court possible. */
  origin: L;
  /** Deux ou trois phrases : d'où ça vient, ce qui le caractérise, où ça se joue aujourd'hui. */
  text: L;
  /** Le signe qui ne trompe pas, en une ligne. */
  tell: L;
  /** L'accroche de la page du genre : une phrase qui donne le ton, sous le titre. */
  hook: L;
  /** Deux paragraphes réservés à la page du style : comment ça se joue, où ça se joue. */
  long: L[];
  /** La fiche signalétique : trois faits (machine, ville, format) qu'on retient d'un style. */
  marks: { k: L; v: L }[];
}

export const GENRE_PROFILES: Record<string, GenreProfile> = {
  Techno: {
    bpm: "125–150",
    origin: { fr: "Detroit, milieu des années 1980", en: "Detroit, mid-1980s" },
    hook: {
      fr: "Un kick, une pièce noire, et huit heures devant soi.",
      en: "One kick, a dark room, and eight hours ahead of you.",
    },
    text: {
      fr: "Née à Detroit sous l'impulsion de Juan Atkins, Derrick May et Kevin Saunderson — les « Belleville Three » — d'une rencontre entre funk américain et synthétiseurs européens. L'Europe s'en empare à la chute du Mur : Berlin en fait sa musique de réunification, et les clubs y jouent encore aujourd'hui des nuits entières sans interruption. Un kick 4/4 régulier, peu ou pas de voix, la tension construite par des couches qui s'ajoutent et se retirent plutôt que par un refrain.",
      en: "Born in Detroit through Juan Atkins, Derrick May and Kevin Saunderson — the Belleville Three — where American funk met European synthesizers. Europe took it up as the Wall came down: Berlin made it the sound of reunification, and its clubs still run unbroken nights on it. A steady 4/4 kick, little or no vocal, tension built by layers added and pulled away rather than by a chorus.",
    },
    long: [
      {
        fr: "Une soirée techno ne fonctionne pas comme un concert : il n'y a ni chanson à reconnaître ni moment prévu pour applaudir. Le DJ enchaîne les disques sans coupure et la tension se construit sur la durée — c'est pour ça que les clubs qui la programment ouvrent souvent jusqu'au lendemain, et que la scène compte en heures de set plutôt qu'en titres joués.",
        en: "A techno night doesn't work like a gig: there is no song to recognise and no scheduled moment to applaud. The DJ runs records together without a break and the tension is built over hours — which is why the clubs that programme it often stay open into the next day, and why the scene counts set hours rather than tracks played.",
      },
      {
        fr: "Deux formats coexistent en Europe. Le club d'abord : Berlin en a fait une institution avec ses Klubnacht qui courent du samedi soir au lundi matin, mais Amsterdam, Londres, Paris, Prague et Tbilissi tiennent les leurs. Le plein air ensuite, d'avril à septembre — des plaines néerlandaises aux friches industrielles italiennes, la techno remplit aujourd'hui des festivals de plusieurs dizaines de milliers de personnes.",
        en: "Two formats coexist in Europe. The club first: Berlin turned it into an institution with Klubnächte running from Saturday night to Monday morning, but Amsterdam, London, Paris, Prague and Tbilisi hold their own. Then the open air, April to September — from Dutch fields to Italian industrial wasteland, techno now fills festivals of several tens of thousands.",
      },
    ],
    marks: [
      { k: { fr: "Machines", en: "Machines" }, v: { fr: "Roland TR-909, TR-808, TB-303", en: "Roland TR-909, TR-808, TB-303" } },
      { k: { fr: "Villes", en: "Cities" }, v: { fr: "Detroit, puis Berlin", en: "Detroit, then Berlin" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Club toute la nuit, open air l'été", en: "All-night club, open air in summer" } },
    ],
    tell: {
      fr: "Un kick qui ne s'arrête jamais et pas un seul refrain.",
      en: "A kick that never stops and not a single chorus.",
    },
  },
  "Hard Techno": {
    bpm: "145–170",
    origin: { fr: "Allemagne et Pays-Bas, années 2000", en: "Germany and the Netherlands, 2000s" },
    hook: {
      fr: "150 BPM, un kick qui sature, et une salle qui ne redescend pas.",
      en: "150 BPM, a kick pushed into clipping, and a room that never comes down.",
    },
    text: {
      fr: "La techno poussée jusqu'à la saturation : kick distordu, tempo qui monte à 150 et au-delà, et cette « hard groove » aux percussions tribales qui a ramené une génération entière en club depuis 2020. Elle doit beaucoup au schranz allemand des années 2000, mais s'en distingue par ses breaks mélodiques et ses emprunts assumés à la trance. C'est aujourd'hui le style qui remplit le plus vite les salles européennes.",
      en: "Techno pushed to saturation: distorted kick, tempo climbing past 150, and the tribal-percussion \"hard groove\" that has pulled a whole generation back into clubs since 2020. It owes plenty to German schranz of the 2000s but parts ways with it through melodic breaks and unabashed borrowings from trance. Right now it is the style filling European rooms fastest.",
    },
    long: [
      {
        fr: "C'est le style qui a le plus changé la physionomie des soirées européennes depuis 2020 : plus rapide, plus lisible et plus frontal que la techno de club dont il est issu. La montée mélodique y remplace le long plateau hypnotique, et le public vient chercher exactement ça — une intensité annoncée, pas de la patience.",
        en: "No style has reshaped European nights more since 2020: faster, more legible and more frontal than the club techno it came from. The melodic build replaces the long hypnotic plateau, and the crowd comes for exactly that — announced intensity rather than patience.",
      },
      {
        fr: "Son terrain naturel, ce sont les Pays-Bas, la Belgique et l'Allemagne, où des marques entières lui sont consacrées et remplissent halls d'exposition et friches portuaires. La France a suivi : Paris, Lyon, Marseille et Nantes programment aujourd'hui de la hard techno en warehouse comme ailleurs on programme de la house.",
        en: "Its natural ground is the Netherlands, Belgium and Germany, where entire promoters are devoted to it and fill exhibition halls and dockside wasteland. France followed: Paris, Lyon, Marseille and Nantes now book hard techno in warehouses the way other cities book house.",
      },
    ],
    marks: [
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Kick distordu + break mélodique", en: "Distorted kick + melodic break" } },
      { k: { fr: "Racines", en: "Roots" }, v: { fr: "Schranz allemand, trance", en: "German schranz, trance" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Warehouse, hall d'expo, festival", en: "Warehouse, exhibition hall, festival" } },
    ],
    tell: {
      fr: "Le kick sature, puis tout s'arrête net pour une montée mélodique.",
      en: "The kick clips, then everything cuts out for a melodic build.",
    },
  },
  "Acid Techno": {
    bpm: "130–150",
    origin: { fr: "Chicago 1987, puis Londres années 1990", en: "Chicago 1987, then 1990s London" },
    hook: {
      fr: "Une machine détournée en 1987, et cette basse n'a jamais cessé de se tordre.",
      en: "One machine used wrong in 1987, and that bassline has been twisting ever since.",
    },
    text: {
      fr: "Tout vient d'une seule machine détournée : la Roland TB-303, une boîte à basse pour guitaristes solitaires, dont le filtre poussé à fond produit ce miaulement liquide qu'on appelle l'acid. Phuture en pose l'acte fondateur avec « Acid Tracks » en 1987 à Chicago. Le son traverse ensuite l'Atlantique et devient l'emblème des raves et des squats londoniens des années 90.",
      en: "It all comes from one machine used wrong: the Roland TB-303, a bassline box built for guitarists playing alone, whose filter cranked wide open gives that liquid squelch called acid. Phuture laid the cornerstone with \"Acid Tracks\" in Chicago in 1987. The sound then crossed the Atlantic and became the emblem of 1990s London raves and squat parties.",
    },
    long: [
      {
        fr: "La TB-303 s'est si mal vendue que Roland l'a retirée de son catalogue au bout de deux ans : ce sont des producteurs de Chicago qui l'ont ramassée d'occasion et ont poussé ses boutons jusqu'à ce qu'elle ne sonne plus comme une basse. Le résultat est immédiatement reconnaissable, et c'est sa force : trois notes suffisent pour savoir ce qu'on écoute.",
        en: "The TB-303 sold so badly that Roland dropped it within two years: Chicago producers picked them up second-hand and turned the knobs until it stopped sounding like a bassline. The result is instantly recognisable, and that is its strength: three notes and you know what you are listening to.",
      },
      {
        fr: "L'acid a ensuite été le drapeau des raves britanniques de la fin des années 80 et des squats londoniens des années 90 — d'où son association durable au smiley et à la culture rave. Aujourd'hui il revient surtout par la techno : peu de soirées sont annoncées « acid » de bout en bout, beaucoup lui réservent une heure de set.",
        en: "Acid then became the flag of late-1980s British raves and 1990s London squat parties — hence its lasting link to the smiley and rave culture. Today it mostly returns through techno: few nights are billed as acid from end to end, many keep an hour of the set for it.",
      },
    ],
    marks: [
      { k: { fr: "Machine", en: "Machine" }, v: { fr: "Roland TB-303", en: "Roland TB-303" } },
      { k: { fr: "Acte fondateur", en: "Founding record" }, v: { fr: "« Acid Tracks », Phuture, 1987", en: "\"Acid Tracks\", Phuture, 1987" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Rave, warehouse, club", en: "Rave, warehouse, club" } },
    ],
    tell: {
      fr: "Cette basse qui gargouille et se tord sans jamais changer de note.",
      en: "That bassline gurgling and twisting without ever changing note.",
    },
  },
  Hardstyle: {
    bpm: "150–155",
    origin: { fr: "Pays-Bas, début des années 2000", en: "The Netherlands, early 2000s" },
    hook: {
      fr: "Un kick qui chante, une aréna qui saute sur le même temps.",
      en: "A kick that sings, an arena jumping on the same beat.",
    },
    text: {
      fr: "Une invention néerlandaise, née entre le hardcore et la trance. Sa signature tient en deux éléments : un kick long et travaillé jusqu'à devenir mélodique, et la « reverse bass », une basse jouée à contretemps qui donne cette sensation de balancier. Le style vit surtout en très grand format — les Pays-Bas et la Belgique lui consacrent des festivals et des arénas entières, avec une mise en scène pyrotechnique qui fait partie du genre.",
      en: "A Dutch invention, born between hardcore and trance. Its signature is two things: a long kick shaped until it turns melodic, and the \"reverse bass\", played off the beat to give that rocking, see-saw feel. The style lives at very large scale — the Netherlands and Belgium give it whole festivals and arenas, with pyrotechnic staging that is part of the genre itself.",
    },
    long: [
      {
        fr: "Le hardstyle est sans doute le style électronique le plus codifié : tempo quasi fixe autour de 150, structure annoncée, et un vocabulaire visuel — feu, lasers, hymnes annuels — qui appartient au morceau autant que le son. Chaque grand festival néerlandais commande son anthem, joué à l'ouverture et repris par tout le terrain.",
        en: "Hardstyle may be the most codified electronic style: a near-fixed tempo around 150, an announced structure, and a visual vocabulary — fire, lasers, yearly anthems — that belongs to the track as much as the sound does. Every major Dutch festival commissions its anthem, played at the opening and sung back by the whole field.",
      },
      {
        fr: "C'est aussi le style qui vit le plus loin du club : ses rendez-vous sont des week-ends entiers en plein champ ou des arénas de plusieurs dizaines de milliers de places, aux Pays-Bas et en Belgique d'abord, avec des dates régulières en Allemagne, en France et en Italie.",
        en: "It is also the style that lives furthest from the club: its dates are whole weekends in open fields or arenas seating tens of thousands, first in the Netherlands and Belgium, with regular dates in Germany, France and Italy.",
      },
    ],
    marks: [
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Reverse bass", en: "Reverse bass" } },
      { k: { fr: "Pays", en: "Country" }, v: { fr: "Pays-Bas, Belgique", en: "Netherlands, Belgium" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Aréna & festival, avec pyrotechnie", en: "Arena & festival, with pyrotechnics" } },
    ],
    tell: {
      fr: "Le kick chante, et la basse tombe entre les temps.",
      en: "The kick sings, and the bass lands between the beats.",
    },
  },
  Hardcore: {
    bpm: "160–200+",
    origin: { fr: "Rotterdam, début des années 1990", en: "Rotterdam, early 1990s" },
    hook: {
      fr: "Le kick le plus rapide d'Europe, et trente ans qu'il tient.",
      en: "Europe's fastest kick, and thirty years of it holding.",
    },
    text: {
      fr: "Le gabber de Rotterdam contre la house d'Amsterdam : le style naît d'une rivalité de ville autant que d'une esthétique. Le kick y est volontairement distordu jusqu'à la limite du bruit, le tempo dépasse les 180, et les branches les plus rapides — terror, uptempo, frenchcore — vont bien au-delà de 200. Trente ans plus tard, la scène est toujours là, structurée autour de labels et de festivals néerlandais et français.",
      en: "Rotterdam gabber against Amsterdam house: the style was born from a rivalry between cities as much as from an aesthetic. The kick is deliberately distorted to the edge of noise, the tempo passes 180, and the fastest branches — terror, uptempo, frenchcore — run well beyond 200. Thirty years on the scene is still here, built around Dutch and French labels and festivals.",
    },
    long: [
      {
        fr: "Le hardcore ne cherche pas la nuance : il pousse le kick jusqu'à la distorsion, l'accélère au-delà de 180 et assume une esthétique volontairement brutale. C'est aussi l'une des scènes les plus fidèles du continent — un public qui se reconnaît, des labels qui durent, et un vocabulaire propre (gabber, hakken, terror) que personne d'autre n'emploie.",
        en: "Hardcore is not after nuance: it pushes the kick into distortion, drives it past 180 and owns a deliberately brutal aesthetic. It is also one of the continent's most loyal scenes — a crowd that recognises itself, labels that last, and a vocabulary of its own (gabber, hakken, terror) nobody else uses.",
      },
      {
        fr: "Les Pays-Bas restent son centre de gravité, avec des rendez-vous en hall couvert qui remplissent depuis les années 90. La France a développé sa propre branche, le frenchcore, plus rapide encore, avec ses labels et ses festivals.",
        en: "The Netherlands remain its centre of gravity, with indoor-hall events that have been filling since the 1990s. France grew its own branch, frenchcore, faster still, with its own labels and festivals.",
      },
    ],
    marks: [
      { k: { fr: "Ville", en: "City" }, v: { fr: "Rotterdam", en: "Rotterdam" } },
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Kick distordu jusqu'au bruit", en: "Kick distorted to the edge of noise" } },
      { k: { fr: "Branches", en: "Branches" }, v: { fr: "Gabber, terror, uptempo, frenchcore", en: "Gabber, terror, uptempo, frenchcore" } },
    ],
    tell: {
      fr: "Un kick saturé si vite qu'il devient une note à lui seul.",
      en: "A kick so fast and so clipped it becomes a note in itself.",
    },
  },
  EDM: {
    bpm: "126–130",
    origin: { fr: "États-Unis, années 2010", en: "United States, 2010s" },
    hook: {
      fr: "Le format mainstage : la montée, le drop, et cinquante mille personnes qui l'attendent.",
      en: "The mainstage format: the build, the drop, and fifty thousand people waiting for it.",
    },
    text: {
      fr: "EDM n'est pas un style mais un terme parapluie, forgé par l'industrie américaine au tournant des années 2010 pour vendre la musique électronique aux grandes scènes. Ce qu'il désigne concrètement : le format mainstage — big room, electro house, structure couplet-montée-drop calquée sur la pop, et des têtes d'affiche qui jouent devant des dizaines de milliers de personnes. C'est le son d'entrée dans la musique électronique pour une large partie du public.",
      en: "EDM is not a style but an umbrella term, coined by the American industry around 2010 to sell electronic music to big stages. What it actually points at is the mainstage format: big room, electro house, a verse-build-drop structure modelled on pop, and headliners playing to tens of thousands. For a large part of the audience, it is the way into electronic music.",
    },
    long: [
      {
        fr: "EDM décrit moins un son qu'une manière de le jouer : devant une scène monumentale, avec un set calé sur ses moments forts, des visuels synchronisés et des invités surprise. C'est un format de spectacle autant qu'un genre — c'est pour ça qu'un même DJ peut y enchaîner house, big room et trance dans la même heure.",
        en: "EDM describes a way of playing more than a sound: in front of a monumental stage, with a set built around its peaks, synchronised visuals and surprise guests. It is a show format as much as a genre — which is why one DJ can run house, big room and trance inside the same hour.",
      },
      {
        fr: "En Europe, c'est le son des très grands festivals d'été — Belgique, Pays-Bas, Croatie, Espagne — et la porte par laquelle une grande partie du public entre dans la musique électronique avant d'aller voir ce qui se joue en club. Les têtes d'affiche y sont mondiales et les billets partent des mois à l'avance.",
        en: "In Europe it is the sound of the very large summer festivals — Belgium, the Netherlands, Croatia, Spain — and the door through which much of the audience enters electronic music before looking at what clubs are playing. Headliners are global and tickets go months ahead.",
      },
    ],
    marks: [
      { k: { fr: "Nature", en: "Nature" }, v: { fr: "Terme parapluie, pas un style", en: "Umbrella term, not a style" } },
      { k: { fr: "Structure", en: "Structure" }, v: { fr: "Couplet – montée – drop", en: "Verse – build – drop" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Mainstage de festival", en: "Festival mainstage" } },
    ],
    tell: {
      fr: "La montée annonce le drop, et tout le monde le voit venir — c'est voulu.",
      en: "The build announces the drop and everyone sees it coming — that's the point.",
    },
  },
  "Drum & Bass": {
    bpm: "170–180",
    origin: { fr: "Royaume-Uni, milieu des années 1990", en: "United Kingdom, mid-1990s" },
    hook: {
      fr: "174 BPM au-dessus d'une basse qui joue deux fois moins vite.",
      en: "174 BPM over a bass playing at half that speed.",
    },
    text: {
      fr: "Issue du jungle et du breakbeat hardcore britanniques, la drum & bass repose sur une dissociation : les breaks de batterie filent à 174 BPM pendant que la ligne de basse, elle, se joue à moitié tempo. D'où cette impression d'être rapide et lourd en même temps. Le breakbeat qui a tout lancé, le « Amen break », est un sample de six secondes emprunté à un disque de soul de 1969.",
      en: "Out of British jungle and breakbeat hardcore, drum & bass rests on a split: the drum breaks run at 174 BPM while the bassline plays at half that speed. Hence the feeling of being fast and heavy at once. The breakbeat that started it all, the \"Amen break\", is a six-second sample lifted from a 1969 soul record.",
    },
    long: [
      {
        fr: "C'est la seule grande famille électronique née britannique et restée britannique. Elle a gardé de la culture sound system l'usage du MC, qui parle sur le set, relance la salle et figure au line-up au même titre que le DJ — une soirée annoncée « DJ + MC » n'est pas un accident de programmation.",
        en: "It is the one major electronic family born British and still British. From sound-system culture it kept the MC, who talks over the set, works the room and sits on the bill as much as the DJ — a night billed \"DJ + MC\" is not a programming accident.",
      },
      {
        fr: "Ses branches vont du liquid mélodique au neurofunk le plus sombre, et son public est l'un des plus jeunes de la scène. Longtemps vécue surtout en club, elle est aujourd'hui très présente en festival, au Royaume-Uni comme sur le continent.",
        en: "Its branches run from melodic liquid to the darkest neurofunk, and its crowd is among the youngest in the scene. Long lived mostly in clubs, it is now a heavy presence at festivals, in the UK and on the continent alike.",
      },
    ],
    marks: [
      { k: { fr: "Le break", en: "The break" }, v: { fr: "« Amen break », The Winstons, 1969", en: "\"Amen break\", The Winstons, 1969" } },
      { k: { fr: "Pays", en: "Country" }, v: { fr: "Royaume-Uni", en: "United Kingdom" } },
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Batterie double tempo, basse demi-tempo", en: "Double-time drums, half-time bass" } },
    ],
    tell: {
      fr: "La batterie court, la basse traîne — deux vitesses dans le même morceau.",
      en: "The drums sprint, the bass drags — two speeds in one track.",
    },
  },
  House: {
    bpm: "118–130",
    origin: { fr: "Chicago, début des années 1980", en: "Chicago, early 1980s" },
    hook: {
      fr: "Le club qui a donné son nom à la moitié de la musique électronique.",
      en: "The club that gave its name to half of electronic music.",
    },
    text: {
      fr: "La house doit son nom à un club : le Warehouse de Chicago, où Frankie Knuckles mixait pour un public noir et gay au début des années 80. C'est la matrice de presque tout le reste — kick 4/4, charleston sur les contretemps, et une place laissée à la voix et au groove que la techno abandonnera. Ses ramifications sont innombrables : deep, tech house, disco house, afro house.",
      en: "House takes its name from a club: Chicago's Warehouse, where Frankie Knuckles played to a Black and gay crowd in the early 1980s. It is the template for nearly everything after — 4/4 kick, hi-hat on the off-beat, and room left for vocals and groove that techno would later drop. Its branches are countless: deep, tech house, disco house, afro house.",
    },
    long: [
      {
        fr: "La house est la plus généreuse de la famille : elle garde la voix, le groove et les accords que la techno a mis de côté, ce qui la rend immédiatement accessible sans rien lâcher sur l'exigence. C'est aussi la plus jouée au monde, du bar de quartier au festival, et la seule qui supporte vraiment d'être écoutée en plein jour.",
        en: "House is the most generous of the family: it keeps the vocal, the groove and the chords techno set aside, which makes it immediately approachable without giving up craft. It is also the most played style on earth, from the corner bar to the festival, and the only one that truly survives daylight.",
      },
      {
        fr: "Ses branches se comptent par dizaines et vivent chacune leur vie : deep house, tech house, disco house, afro house. En Europe, Ibiza et Amsterdam en restent les capitales officieuses — mais la house est surtout le seul style qu'on retrouve à l'affiche de presque tous les festivals du continent, quel que soit le genre annoncé.",
        en: "Its branches number in the dozens and each lives its own life: deep house, tech house, disco house, afro house. In Europe, Ibiza and Amsterdam remain its unofficial capitals — but house is above all the one style you find on almost every festival bill on the continent, whatever genre they advertise.",
      },
    ],
    marks: [
      { k: { fr: "Le club", en: "The club" }, v: { fr: "The Warehouse, Chicago", en: "The Warehouse, Chicago" } },
      { k: { fr: "La figure", en: "The figure" }, v: { fr: "Frankie Knuckles", en: "Frankie Knuckles" } },
      { k: { fr: "Branches", en: "Branches" }, v: { fr: "Deep, tech, disco, afro house", en: "Deep, tech, disco, afro house" } },
    ],
    tell: {
      fr: "Le charleston entre les temps, et une voix qu'on peut fredonner.",
      en: "The hi-hat between the beats, and a vocal you can hum.",
    },
  },
  Trance: {
    bpm: "130–145",
    origin: { fr: "Allemagne, début des années 1990", en: "Germany, early 1990s" },
    hook: {
      fr: "Tout s'arrête, ça monte trente secondes, et la salle repart d'un bloc.",
      en: "Everything stops, it builds for thirty seconds, and the room comes back as one.",
    },
    text: {
      fr: "Née à Francfort et Berlin au début des années 90, la trance construit tout autour d'une seule mécanique : un long breakdown où la rythmique disparaît, une montée qui s'étire, puis le retour du kick sous une nappe de synthé mélodique. C'est le style le plus ouvertement émotionnel de la famille électronique, et celui qui revient le plus régulièrement à la mode — la vague actuelle de hard trance en est la dernière preuve.",
      en: "Born in Frankfurt and Berlin in the early 1990s, trance builds everything around one mechanism: a long breakdown where the rhythm drops out, a build that stretches, then the kick returning under a sheet of melodic synth. It is the most openly emotional style in the electronic family, and the one that keeps coming back into fashion — the current hard-trance wave being the latest proof.",
    },
    long: [
      {
        fr: "C'est la plus collective des musiques électroniques : son mécanisme — breakdown, montée, retour du kick — est fait pour que toute la salle vive le même moment à la même seconde. Ça explique ses formats géants, et la fidélité d'un public qui suit certains DJs sur vingt ans de carrière.",
        en: "It is the most collective of electronic musics: its mechanism — breakdown, build, kick return — is designed so an entire room lives the same moment at the same second. That explains its giant formats, and the loyalty of a crowd that follows some DJs across twenty-year careers.",
      },
      {
        fr: "Après une éclipse relative dans les années 2010, elle est revenue par deux portes : les grandes marques historiques, toujours actives aux Pays-Bas et en Allemagne, et la hard trance jouée en club — plus rapide, plus brute, et qui a ramené la mélodie là où la techno l'avait chassée.",
        en: "After a relative eclipse in the 2010s it came back through two doors: the historic brands, still active in the Netherlands and Germany, and hard trance played in clubs — faster, rawer, and bringing melody back where techno had pushed it out.",
      },
    ],
    marks: [
      { k: { fr: "Villes", en: "Cities" }, v: { fr: "Francfort, Berlin", en: "Frankfurt, Berlin" } },
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Breakdown, montée, retour du kick", en: "Breakdown, build, kick return" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Grande salle & festival", en: "Big room & festival" } },
    ],
    tell: {
      fr: "Tout disparaît, ça monte pendant trente secondes, et le kick revient.",
      en: "Everything drops out, it builds for thirty seconds, then the kick returns.",
    },
  },
  Psytrance: {
    bpm: "140–150",
    origin: { fr: "Goa (Inde), années 1990", en: "Goa, India, 1990s" },
    hook: {
      fr: "Une basse qui roule, un ciel qui se lève, et personne qui s'arrête.",
      en: "A rolling bassline, a sky coming up, and nobody stopping.",
    },
    text: {
      fr: "Le style est né sur les plages de Goa, où des voyageurs européens organisaient des fêtes de plein air à partir des années 80, avant qu'Israël puis l'Europe ne le structurent en scène à part entière. Sa signature : une basse roulante en triolets, hypnotique et continue, et des textures psychédéliques superposées en couches. Il se joue en extérieur et sur la durée — le format naturel du psytrance, c'est le festival de plusieurs jours, pas la nuit de club.",
      en: "The style was born on the beaches of Goa, where European travellers threw open-air parties from the 1980s on, before Israel and then Europe built it into a scene of its own. Its signature: a rolling triplet bassline, hypnotic and unbroken, under layered psychedelic textures. It is played outdoors and over long stretches — psytrance's natural format is the multi-day festival, not the club night.",
    },
    long: [
      {
        fr: "Le psytrance ne se joue pas comme le reste : les sets durent souvent deux heures, la basse ne s'interrompt presque jamais, et le morceau se transforme par couches successives plutôt que par ruptures. C'est une musique conçue pour la durée — trois jours de festival en sont le format naturel, pas six heures de club.",
        en: "Psytrance isn't played like the rest: sets often run two hours, the bassline barely stops, and tracks change through layers rather than breaks. It is music built for duration — three festival days are its natural format, not six club hours.",
      },
      {
        fr: "Sa culture visuelle — décors fluorescents, structures en tissu, art psychédélique — et son organisation en plein air en font autant un lieu qu'un son. En Europe, le Portugal, l'Allemagne, la Hongrie et la France portent les rendez-vous les plus établis, généralement l'été, en forêt ou à la campagne.",
        en: "Its visual culture — fluorescent décor, fabric structures, psychedelic art — and its open-air staging make it a place as much as a sound. In Europe, Portugal, Germany, Hungary and France hold the most established gatherings, usually in summer, in forests or countryside.",
      },
    ],
    marks: [
      { k: { fr: "Berceau", en: "Birthplace" }, v: { fr: "Goa, Inde", en: "Goa, India" } },
      { k: { fr: "Signature", en: "Signature" }, v: { fr: "Basse roulante en triolets", en: "Rolling triplet bassline" } },
      { k: { fr: "Format", en: "Format" }, v: { fr: "Plein air, plusieurs jours", en: "Open air, several days" } },
    ],
    tell: {
      fr: "Une basse qui roule sans jamais s'arrêter, sous des textures qui tournent.",
      en: "A bassline rolling without pause, under textures that swirl.",
    },
  },
  Warehouse: {
    bpm: "130–150",
    origin: { fr: "Chicago, Londres, Berlin — années 1980-1990", en: "Chicago, London, Berlin — 1980s-1990s" },
    hook: {
      fr: "Ce n'est pas un style : c'est du béton, une sono trop grande, et pas d'heure de fin.",
      en: "Not a style: concrete, a rig too big for the room, and no closing time.",
    },
    text: {
      fr: "Warehouse n'est pas un style de musique, c'est un lieu — et on le garde comme catégorie parce que c'est ce que les gens cherchent. Entrepôts désaffectés, hangars, anciennes usines : des espaces bruts, souvent temporaires, où le son résonne sur du béton et où la nuit ne s'arrête pas à deux heures. Le nom vient du Warehouse de Chicago, celui-là même qui a donné son nom à la house. On y joue surtout de la techno et de la hard techno.",
      en: "Warehouse is not a musical style, it is a place — and it stays as a category here because it is what people search for. Disused warehouses, hangars, former factories: raw, often temporary spaces where sound bounces off concrete and the night doesn't end at two. The name comes from Chicago's Warehouse, the same club that gave house its name. What gets played there is mostly techno and hard techno.",
    },
    long: [
      {
        fr: "On garde la catégorie parce que le lieu change réellement la soirée. Un entrepôt n'a ni décor, ni sièges, ni sens de circulation : le système son y est le seul point d'attention, la réverbération du béton fait partie du son, et la jauge est celle du bâtiment — pas celle d'une salle conçue pour ça.",
        en: "We keep the category because the room genuinely changes the night. A warehouse has no décor, no seats and no circulation plan: the sound system is the only focal point, the concrete reverb is part of the sound, and capacity is whatever the building allows — not what a purpose-built room was designed for.",
      },
      {
        fr: "Beaucoup de ces soirées sont temporaires — un lieu ouvert quelques week-ends, une friche louée pour une nuit — d'où des adresses et des horaires annoncés tard. Ce qu'on y programme est presque toujours de la techno ou de la hard techno, plus rarement de la drum & bass.",
        en: "Many of these nights are temporary — a space open for a few weekends, a lot rented for one night — hence addresses and running times announced late. What gets booked there is nearly always techno or hard techno, more rarely drum & bass.",
      },
    ],
    marks: [
      { k: { fr: "Nature", en: "Nature" }, v: { fr: "Un lieu, pas un genre", en: "A place, not a genre" } },
      { k: { fr: "Le nom vient de", en: "Named after" }, v: { fr: "The Warehouse, Chicago", en: "The Warehouse, Chicago" } },
      { k: { fr: "Au programme", en: "On the bill" }, v: { fr: "Techno, hard techno", en: "Techno, hard techno" } },
    ],
    tell: {
      fr: "Du béton, une sono trop grande pour la salle, et pas d'heure de fin.",
      en: "Concrete, a rig too big for the room, and no closing time.",
    },
  },
};

export const genreProfile = (g: string): GenreProfile | undefined => GENRE_PROFILES[g];

/** Même accesseur que les guides festival — un seul motif bilingue dans tout le repo. */
export const pickL = (v: L, lang: Lang): string => (lang === "en" ? v.en : v.fr);
