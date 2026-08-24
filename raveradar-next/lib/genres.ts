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
   C'est ce qui manquait le plus à la page : une définition qui serve à quelque chose. */

export interface GenreProfile {
  /** Fourchette de tempo couramment pratiquée, en BPM. */
  bpm: string;
  /** Lieu et décennie de naissance — l'ancrage le plus court possible. */
  origin: L;
  /** Deux ou trois phrases : d'où ça vient, ce qui le caractérise, où ça se joue aujourd'hui. */
  text: L;
  /** Le signe qui ne trompe pas, en une ligne. */
  tell: L;
}

export const GENRE_PROFILES: Record<string, GenreProfile> = {
  Techno: {
    bpm: "125–150",
    origin: { fr: "Detroit, milieu des années 1980", en: "Detroit, mid-1980s" },
    text: {
      fr: "Née à Detroit sous l'impulsion de Juan Atkins, Derrick May et Kevin Saunderson — les « Belleville Three » — d'une rencontre entre funk américain et synthétiseurs européens. L'Europe s'en empare à la chute du Mur : Berlin en fait sa musique de réunification, et les clubs y jouent encore aujourd'hui des nuits entières sans interruption. Un kick 4/4 régulier, peu ou pas de voix, la tension construite par des couches qui s'ajoutent et se retirent plutôt que par un refrain.",
      en: "Born in Detroit through Juan Atkins, Derrick May and Kevin Saunderson — the Belleville Three — where American funk met European synthesizers. Europe took it up as the Wall came down: Berlin made it the sound of reunification, and its clubs still run unbroken nights on it. A steady 4/4 kick, little or no vocal, tension built by layers added and pulled away rather than by a chorus.",
    },
    tell: {
      fr: "Un kick qui ne s'arrête jamais et pas un seul refrain.",
      en: "A kick that never stops and not a single chorus.",
    },
  },
  "Hard Techno": {
    bpm: "145–170",
    origin: { fr: "Allemagne et Pays-Bas, années 2000", en: "Germany and the Netherlands, 2000s" },
    text: {
      fr: "La techno poussée jusqu'à la saturation : kick distordu, tempo qui monte à 150 et au-delà, et cette « hard groove » aux percussions tribales qui a ramené une génération entière en club depuis 2020. Elle doit beaucoup au schranz allemand des années 2000, mais s'en distingue par ses breaks mélodiques et ses emprunts assumés à la trance. C'est aujourd'hui le style qui remplit le plus vite les salles européennes.",
      en: "Techno pushed to saturation: distorted kick, tempo climbing past 150, and the tribal-percussion \"hard groove\" that has pulled a whole generation back into clubs since 2020. It owes plenty to German schranz of the 2000s but parts ways with it through melodic breaks and unabashed borrowings from trance. Right now it is the style filling European rooms fastest.",
    },
    tell: {
      fr: "Le kick sature, puis tout s'arrête net pour une montée mélodique.",
      en: "The kick clips, then everything cuts out for a melodic build.",
    },
  },
  "Acid Techno": {
    bpm: "130–150",
    origin: { fr: "Chicago 1987, puis Londres années 1990", en: "Chicago 1987, then 1990s London" },
    text: {
      fr: "Tout vient d'une seule machine détournée : la Roland TB-303, une boîte à basse pour guitaristes solitaires, dont le filtre poussé à fond produit ce miaulement liquide qu'on appelle l'acid. Phuture en pose l'acte fondateur avec « Acid Tracks » en 1987 à Chicago. Le son traverse ensuite l'Atlantique et devient l'emblème des raves et des squats londoniens des années 90.",
      en: "It all comes from one machine used wrong: the Roland TB-303, a bassline box built for guitarists playing alone, whose filter cranked wide open gives that liquid squelch called acid. Phuture laid the cornerstone with \"Acid Tracks\" in Chicago in 1987. The sound then crossed the Atlantic and became the emblem of 1990s London raves and squat parties.",
    },
    tell: {
      fr: "Cette basse qui gargouille et se tord sans jamais changer de note.",
      en: "That bassline gurgling and twisting without ever changing note.",
    },
  },
  Hardstyle: {
    bpm: "150–155",
    origin: { fr: "Pays-Bas, début des années 2000", en: "The Netherlands, early 2000s" },
    text: {
      fr: "Une invention néerlandaise, née entre le hardcore et la trance. Sa signature tient en deux éléments : un kick long et travaillé jusqu'à devenir mélodique, et la « reverse bass », une basse jouée à contretemps qui donne cette sensation de balancier. Le style vit surtout en très grand format — les Pays-Bas et la Belgique lui consacrent des festivals et des arénas entières, avec une mise en scène pyrotechnique qui fait partie du genre.",
      en: "A Dutch invention, born between hardcore and trance. Its signature is two things: a long kick shaped until it turns melodic, and the \"reverse bass\", played off the beat to give that rocking, see-saw feel. The style lives at very large scale — the Netherlands and Belgium give it whole festivals and arenas, with pyrotechnic staging that is part of the genre itself.",
    },
    tell: {
      fr: "Le kick chante, et la basse tombe entre les temps.",
      en: "The kick sings, and the bass lands between the beats.",
    },
  },
  Hardcore: {
    bpm: "160–200+",
    origin: { fr: "Rotterdam, début des années 1990", en: "Rotterdam, early 1990s" },
    text: {
      fr: "Le gabber de Rotterdam contre la house d'Amsterdam : le style naît d'une rivalité de ville autant que d'une esthétique. Le kick y est volontairement distordu jusqu'à la limite du bruit, le tempo dépasse les 180, et les branches les plus rapides — terror, uptempo, frenchcore — vont bien au-delà de 200. Trente ans plus tard, la scène est toujours là, structurée autour de labels et de festivals néerlandais et français.",
      en: "Rotterdam gabber against Amsterdam house: the style was born from a rivalry between cities as much as from an aesthetic. The kick is deliberately distorted to the edge of noise, the tempo passes 180, and the fastest branches — terror, uptempo, frenchcore — run well beyond 200. Thirty years on the scene is still here, built around Dutch and French labels and festivals.",
    },
    tell: {
      fr: "Un kick saturé si vite qu'il devient une note à lui seul.",
      en: "A kick so fast and so clipped it becomes a note in itself.",
    },
  },
  EDM: {
    bpm: "126–130",
    origin: { fr: "États-Unis, années 2010", en: "United States, 2010s" },
    text: {
      fr: "EDM n'est pas un style mais un terme parapluie, forgé par l'industrie américaine au tournant des années 2010 pour vendre la musique électronique aux grandes scènes. Ce qu'il désigne concrètement : le format mainstage — big room, electro house, structure couplet-montée-drop calquée sur la pop, et des têtes d'affiche qui jouent devant des dizaines de milliers de personnes. C'est le son d'entrée dans la musique électronique pour une large partie du public.",
      en: "EDM is not a style but an umbrella term, coined by the American industry around 2010 to sell electronic music to big stages. What it actually points at is the mainstage format: big room, electro house, a verse-build-drop structure modelled on pop, and headliners playing to tens of thousands. For a large part of the audience, it is the way into electronic music.",
    },
    tell: {
      fr: "La montée annonce le drop, et tout le monde le voit venir — c'est voulu.",
      en: "The build announces the drop and everyone sees it coming — that's the point.",
    },
  },
  "Drum & Bass": {
    bpm: "170–180",
    origin: { fr: "Royaume-Uni, milieu des années 1990", en: "United Kingdom, mid-1990s" },
    text: {
      fr: "Issue du jungle et du breakbeat hardcore britanniques, la drum & bass repose sur une dissociation : les breaks de batterie filent à 174 BPM pendant que la ligne de basse, elle, se joue à moitié tempo. D'où cette impression d'être rapide et lourd en même temps. Le breakbeat qui a tout lancé, le « Amen break », est un sample de six secondes emprunté à un disque de soul de 1969.",
      en: "Out of British jungle and breakbeat hardcore, drum & bass rests on a split: the drum breaks run at 174 BPM while the bassline plays at half that speed. Hence the feeling of being fast and heavy at once. The breakbeat that started it all, the \"Amen break\", is a six-second sample lifted from a 1969 soul record.",
    },
    tell: {
      fr: "La batterie court, la basse traîne — deux vitesses dans le même morceau.",
      en: "The drums sprint, the bass drags — two speeds in one track.",
    },
  },
  House: {
    bpm: "118–130",
    origin: { fr: "Chicago, début des années 1980", en: "Chicago, early 1980s" },
    text: {
      fr: "La house doit son nom à un club : le Warehouse de Chicago, où Frankie Knuckles mixait pour un public noir et gay au début des années 80. C'est la matrice de presque tout le reste — kick 4/4, charleston sur les contretemps, et une place laissée à la voix et au groove que la techno abandonnera. Ses ramifications sont innombrables : deep, tech house, disco house, afro house.",
      en: "House takes its name from a club: Chicago's Warehouse, where Frankie Knuckles played to a Black and gay crowd in the early 1980s. It is the template for nearly everything after — 4/4 kick, hi-hat on the off-beat, and room left for vocals and groove that techno would later drop. Its branches are countless: deep, tech house, disco house, afro house.",
    },
    tell: {
      fr: "Le charleston entre les temps, et une voix qu'on peut fredonner.",
      en: "The hi-hat between the beats, and a vocal you can hum.",
    },
  },
  Trance: {
    bpm: "130–145",
    origin: { fr: "Allemagne, début des années 1990", en: "Germany, early 1990s" },
    text: {
      fr: "Née à Francfort et Berlin au début des années 90, la trance construit tout autour d'une seule mécanique : un long breakdown où la rythmique disparaît, une montée qui s'étire, puis le retour du kick sous une nappe de synthé mélodique. C'est le style le plus ouvertement émotionnel de la famille électronique, et celui qui revient le plus régulièrement à la mode — la vague actuelle de hard trance en est la dernière preuve.",
      en: "Born in Frankfurt and Berlin in the early 1990s, trance builds everything around one mechanism: a long breakdown where the rhythm drops out, a build that stretches, then the kick returning under a sheet of melodic synth. It is the most openly emotional style in the electronic family, and the one that keeps coming back into fashion — the current hard-trance wave being the latest proof.",
    },
    tell: {
      fr: "Tout disparaît, ça monte pendant trente secondes, et le kick revient.",
      en: "Everything drops out, it builds for thirty seconds, then the kick returns.",
    },
  },
  Psytrance: {
    bpm: "140–150",
    origin: { fr: "Goa (Inde), années 1990", en: "Goa, India, 1990s" },
    text: {
      fr: "Le style est né sur les plages de Goa, où des voyageurs européens organisaient des fêtes de plein air à partir des années 80, avant qu'Israël puis l'Europe ne le structurent en scène à part entière. Sa signature : une basse roulante en triolets, hypnotique et continue, et des textures psychédéliques superposées en couches. Il se joue en extérieur et sur la durée — le format naturel du psytrance, c'est le festival de plusieurs jours, pas la nuit de club.",
      en: "The style was born on the beaches of Goa, where European travellers threw open-air parties from the 1980s on, before Israel and then Europe built it into a scene of its own. Its signature: a rolling triplet bassline, hypnotic and unbroken, under layered psychedelic textures. It is played outdoors and over long stretches — psytrance's natural format is the multi-day festival, not the club night.",
    },
    tell: {
      fr: "Une basse qui roule sans jamais s'arrêter, sous des textures qui tournent.",
      en: "A bassline rolling without pause, under textures that swirl.",
    },
  },
  Warehouse: {
    bpm: "130–150",
    origin: { fr: "Chicago, Londres, Berlin — années 1980-1990", en: "Chicago, London, Berlin — 1980s-1990s" },
    text: {
      fr: "Warehouse n'est pas un style de musique, c'est un lieu — et on le garde comme catégorie parce que c'est ce que les gens cherchent. Entrepôts désaffectés, hangars, anciennes usines : des espaces bruts, souvent temporaires, où le son résonne sur du béton et où la nuit ne s'arrête pas à deux heures. Le nom vient du Warehouse de Chicago, celui-là même qui a donné son nom à la house. On y joue surtout de la techno et de la hard techno.",
      en: "Warehouse is not a musical style, it is a place — and it stays as a category here because it is what people search for. Disused warehouses, hangars, former factories: raw, often temporary spaces where sound bounces off concrete and the night doesn't end at two. The name comes from Chicago's Warehouse, the same club that gave house its name. What gets played there is mostly techno and hard techno.",
    },
    tell: {
      fr: "Du béton, une sono trop grande pour la salle, et pas d'heure de fin.",
      en: "Concrete, a rig too big for the room, and no closing time.",
    },
  },
};

export const genreProfile = (g: string): GenreProfile | undefined => GENRE_PROFILES[g];

/** Même accesseur que les guides festival — un seul motif bilingue dans tout le repo. */
export const pickL = (v: L, lang: Lang): string => (lang === "en" ? v.en : v.fr);
