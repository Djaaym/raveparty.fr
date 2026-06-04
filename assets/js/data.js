/* =========================================================================
   RAVERADAR — Data layer
   Self-contained sample dataset (no backend / no external images required).
   Posters are generated procedurally with CSS gradients keyed per genre.
   ========================================================================= */

const GENRES = {
  "Techno":       { c1: "#2F7BFF", c2: "#8B5CFF" },
  "Hard Techno":  { c1: "#FF2D9B", c2: "#FF6A3D" },
  "Acid Techno":  { c1: "#C6FF3D", c2: "#19E7FF" },
  "Hardstyle":    { c1: "#FF2D9B", c2: "#FFC23D" },
  "Hardcore":     { c1: "#FF3D3D", c2: "#8B5CFF" },
  "EDM":          { c1: "#19E7FF", c2: "#2F7BFF" },
  "Drum & Bass":  { c1: "#8B5CFF", c2: "#19E7FF" },
  "House":        { c1: "#FF6A3D", c2: "#FF2D9B" },
  "Trance":       { c1: "#19E7FF", c2: "#8B5CFF" },
  "Psytrance":    { c1: "#C6FF3D", c2: "#8B5CFF" },
  "Free Party":   { c1: "#C6FF3D", c2: "#FF2D9B" },
  "Warehouse":    { c1: "#6E7081", c2: "#2F7BFF" },
};

const GENRE_DESC = {
  "Techno": "The 4/4 heartbeat of Berlin & beyond",
  "Hard Techno": "Faster, harder, relentless BPM",
  "Acid Techno": "Squelching 303 hypnosis",
  "Hardstyle": "Euphoric kicks & reverse bass",
  "Hardcore": "200 BPM pure adrenaline",
  "EDM": "Festival mainstage energy",
  "Drum & Bass": "Rolling 174 basslines",
  "Trance": "Euphoric uplifting journeys",
  "Psytrance": "Forest & goa frequencies",
  "Free Party": "Off-grid sound systems",
  "Warehouse": "Raw industrial spaces",
  "House": "Soulful grooves all night",
};

function poster(g) {
  const k = GENRES[g] || GENRES["Techno"];
  return `linear-gradient(150deg, ${k.c1} 0%, ${k.c2} 55%, #0A0B11 110%)`;
}

const EVENTS = [
  { id: 1, title: "Awakenings Festival", type: "Festival", genres: ["Techno","Hard Techno"],
    city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.94,
    date: "2026-06-27", time: "12:00", price: 89, currency: "€",
    venue: "Spaarnwoude Houtrak", trending: true,
    lineup: ["Charlotte de Witte","Amelie Lens","I Hate Models","Sara Landry","999999999","Reinier Zonneveld"],
    desc: "The world's biggest techno festival returns to the Dutch plains. Twelve hours of relentless 4/4 across eight industrial stages, lasers cutting through the smoke from noon to midnight." },

  { id: 2, title: "HÖR x Berghain Night", type: "Club", genres: ["Techno","Warehouse"],
    city: "Berlin", country: "Germany", lat: 52.51, lng: 13.44,
    date: "2026-06-13", time: "23:59", price: 25, currency: "€",
    venue: "Kraftwerk Halle", trending: true,
    lineup: ["Héctor Oaks","Freddy K","Kobosil","VTSS","SPFDJ"],
    desc: "A 14-hour marathon inside a decommissioned power plant. No phones, no photos — just concrete, fog and sound. The most uncompromising room in Berlin." },

  { id: 3, title: "Verknipt ADE Special", type: "Warehouse", genres: ["Hard Techno","Acid Techno"],
    city: "Utrecht", country: "Netherlands", lat: 52.09, lng: 5.12,
    date: "2026-10-17", time: "22:00", price: 45, currency: "€",
    venue: "Jaarbeurs Hall 7", trending: true,
    lineup: ["Trym","Hadone","Cera Khin","Èarth","Marwan Sabb"],
    desc: "Verknipt take over a 6000-capacity warehouse for an industrial onslaught. Strobes, sub-bass and acid lines until sunrise during Amsterdam Dance Event." },

  { id: 4, title: "Possession Open Air", type: "Festival", genres: ["Hard Techno","Hardcore"],
    city: "Paris", country: "France", lat: 48.86, lng: 2.35,
    date: "2026-07-04", time: "14:00", price: 55, currency: "€",
    venue: "Bois de Vincennes", trending: true,
    lineup: ["Perc","AnD","SHDW & Obscure Shape"," ÈartH","Lukas"],
    desc: "Paris' hardest collective brings its dystopian aesthetic outdoors. Brutal kicks, fog walls and a stage built like a derelict factory." },

  { id: 5, title: "Intercell Warehouse", type: "Warehouse", genres: ["Techno"],
    city: "Amsterdam", country: "Netherlands", lat: 52.40, lng: 4.89,
    date: "2026-09-19", time: "23:00", price: 38, currency: "€",
    venue: "NDSM Docklands", trending: false,
    lineup: ["Setaoc Mass","Stef Mendesidis","Kr!z","Rene Wise"],
    desc: "Pure underground techno in a riverside shipyard. Functional, dark, hypnotic — the way the dancefloor was meant to be." },

  { id: 6, title: "Boiler Room: London", type: "Club", genres: ["House","Drum & Bass"],
    city: "London", country: "UK", lat: 51.51, lng: -0.12,
    date: "2026-08-08", time: "21:00", price: 30, currency: "£",
    venue: "Hangar Studios E9", trending: true,
    lineup: ["Sherelle","Sicaria Sound","Tim Reaper","Coco Bryce"],
    desc: "The iconic crowd-around-the-booth session goes jungle. 174 BPM breaks, rewinds and the sweatiest room in East London." },

  { id: 7, title: "Defqon.1 Weekend", type: "Festival", genres: ["Hardstyle","Hardcore"],
    city: "Biddinghuizen", country: "Netherlands", lat: 52.45, lng: 5.70,
    date: "2026-06-26", time: "10:00", price: 199, currency: "€",
    venue: "Evenemententerrein", trending: false,
    lineup: ["Headhunterz","D-Block & S-te-Fan","Sub Zero Project","Angerfist","Phuture Noize"],
    desc: "Four days of pure hardstyle euphoria. The legendary RED stage, fireworks, and 100,000 warriors chanting as one." },

  { id: 8, title: "Boom Festival", type: "Festival", genres: ["Psytrance","Trance"],
    city: "Idanha-a-Nova", country: "Portugal", lat: 39.92, lng: -7.23,
    date: "2026-07-21", time: "00:00", price: 220, currency: "€",
    venue: "Lake Idanha", trending: true,
    lineup: ["Vini Vici","Captain Hook","Ace Ventura","Liquid Soul","Astrix"],
    desc: "A week-long psychedelic gathering by a Portuguese lake. Visionary art, off-grid sound and the most famous psytrance dancefloor on Earth." },

  { id: 9, title: "Teknival Free Party", type: "Warehouse", genres: ["Free Party","Acid Techno"],
    city: "Secret Location", country: "France", lat: 45.76, lng: 4.83,
    date: "2026-08-15", time: "20:00", price: 0, currency: "€",
    venue: "Location revealed 24h before", trending: true,
    lineup: ["Spiral Tribe","Heretik System","OQP","Nostromo Sound"],
    desc: "A true free party — coordinates dropped the night before. Multiple rigs, generators, mud and freedom. Bring your own water. No commercial sponsors, ever." },

  { id: 10, title: "Tomorrowland Mainstage", type: "Festival", genres: ["EDM","Trance"],
    city: "Boom", country: "Belgium", lat: 51.09, lng: 4.37,
    date: "2026-07-18", time: "12:00", price: 285, currency: "€",
    venue: "De Schorre", trending: true,
    lineup: ["Martin Garrix","Armin van Buuren","Adam Beyer","Charlotte de Witte","Anyma"],
    desc: "The most spectacular stage production in the world. Pyrotechnics, a fairytale set design and the global EDM family united in a Belgian forest." },

  { id: 11, title: "Klockworks Loft", type: "Club", genres: ["Techno","Warehouse"],
    city: "Leipzig", country: "Germany", lat: 51.34, lng: 12.37,
    date: "2026-09-05", time: "23:00", price: 22, currency: "€",
    venue: "Distillery Annex", trending: false,
    lineup: ["Ben Klock","DVS1","Function","Lewis Fautzi"],
    desc: "Stripped-back, dub-laden techno in an intimate loft. Low ceilings, heavy Funktion-One stacks, and a strictly heads-down crowd." },

  { id: 12, title: "Bassrush Arena", type: "Club", genres: ["Drum & Bass","Hardcore"],
    city: "Manchester", country: "UK", lat: 53.48, lng: -2.24,
    date: "2026-10-31", time: "22:00", price: 32, currency: "£",
    venue: "Depot Mayfield", trending: false,
    lineup: ["Sub Focus","Dimension","Bou","Hedex","A.M.C"],
    desc: "Halloween DnB carnage inside a cavernous former railway depot. Liquid rollers early, jump-up mayhem by 2am." },

  { id: 13, title: "Acid Camp Open Air", type: "Festival", genres: ["Acid Techno","House"],
    city: "Barcelona", country: "Spain", lat: 41.39, lng: 2.17,
    date: "2026-06-20", time: "16:00", price: 42, currency: "€",
    venue: "Parc del Fòrum", trending: true,
    lineup: ["DJ Tennis","Mind Against","Âme","Trikk","Carlita"],
    desc: "Mediterranean sunset, sea breeze and squelching 303s. A boutique open-air where house melts into acid as the night takes over." },

  { id: 14, title: "Renaissance Trance Night", type: "Club", genres: ["Trance","Psytrance"],
    city: "Vienna", country: "Austria", lat: 48.21, lng: 16.37,
    date: "2026-09-12", time: "22:00", price: 28, currency: "€",
    venue: "Grelle Forelle", trending: false,
    lineup: ["Paul van Dyk","Aly & Fila","John 00 Fleming","Cosmic Gate"],
    desc: "Uplifting and progressive trance on the banks of the Danube canal. Hands in the air, lasers overhead, pure euphoria till dawn." },

  { id: 15, title: "Warehouse Project: Hard", type: "Warehouse", genres: ["Hard Techno","Techno"],
    city: "Brussels", country: "Belgium", lat: 50.85, lng: 4.35,
    date: "2026-11-14", time: "22:00", price: 40, currency: "€",
    venue: "Tour & Taxis Depot", trending: true,
    lineup: ["Klangkuenstler","Nico Moreno","FJAAK","Luccio","Cassie Raptor"],
    desc: "Belgium's hardest line-up inside a 19th-century freight hall. Industrial steel, blinding strobes and 150 BPM with no mercy." },

  { id: 16, title: "Sunwaves Beach", type: "Festival", genres: ["House","Techno"],
    city: "Mamaia", country: "Romania", lat: 44.25, lng: 28.62,
    date: "2026-08-28", time: "10:00", price: 120, currency: "€",
    venue: "Black Sea Shore", trending: false,
    lineup: ["Ricardo Villalobos","Raresh","Rhadoo","Praslea","Sonja Moonear"],
    desc: "The legendary marathon on the Romanian coast. Minimal & micro-house that stretches for days — nobody knows what time it is, and nobody cares." },
];

// Apply procedural posters keyed to the primary genre.
EVENTS.forEach(e => { e.poster = poster(e.genres[0]); e.img = poster(e.genres[0]); });

const COUNTRIES = [...new Set(EVENTS.map(e => e.country))].sort();
const CITIES    = [...new Set(EVENTS.map(e => e.city))].sort();
const ALL_GENRES = Object.keys(GENRES);
const TYPES = ["Festival","Club","Warehouse"];

/* ---- i18n data: French translations (English is the base in the objects) ---- */
const COUNTRY_FR = {
  "Netherlands": "Pays-Bas", "Germany": "Allemagne", "France": "France",
  "UK": "Royaume-Uni", "Portugal": "Portugal", "Belgium": "Belgique",
  "Spain": "Espagne", "Austria": "Autriche", "Romania": "Roumanie",
};
const COUNTRY_FLAG = {
  "Netherlands": "🇳🇱", "Germany": "🇩🇪", "France": "🇫🇷", "UK": "🇬🇧",
  "Portugal": "🇵🇹", "Belgium": "🇧🇪", "Spain": "🇪🇸", "Austria": "🇦🇹", "Romania": "🇷🇴",
};

const GENRE_DESC_FR = {
  "Techno": "Le battement 4/4 de Berlin et au-delà",
  "Hard Techno": "Plus vite, plus dur, BPM implacable",
  "Acid Techno": "Hypnose grésillante de la 303",
  "Hardstyle": "Kicks euphoriques & reverse bass",
  "Hardcore": "200 BPM d'adrénaline pure",
  "EDM": "L'énergie des mainstages de festival",
  "Drum & Bass": "Basslines roulantes à 174",
  "Trance": "Voyages uplifting euphoriques",
  "Psytrance": "Fréquences forest & goa",
  "Free Party": "Sound systems hors-réseau",
  "Warehouse": "Espaces industriels bruts",
  "House": "Grooves soul toute la nuit",
};

const DESC_FR = {
  1: "Le plus grand festival techno du monde revient dans la plaine néerlandaise. Douze heures de 4/4 implacable sur huit scènes industrielles, des lasers fendant la fumée de midi à minuit.",
  2: "Un marathon de 14 heures dans une centrale électrique désaffectée. Pas de téléphone, pas de photo — juste du béton, de la fumée et du son. La salle la plus intransigeante de Berlin.",
  3: "Verknipt investit un entrepôt de 6000 personnes pour un déferlement industriel. Stroboscopes, sub-bass et lignes acid jusqu'au lever du soleil pendant l'Amsterdam Dance Event.",
  4: "Le collectif le plus dur de Paris sort son esthétique dystopique en plein air. Kicks brutaux, murs de fumée et une scène construite comme une usine à l'abandon.",
  5: "De la techno underground pure dans un chantier naval au bord de l'eau. Fonctionnelle, sombre, hypnotique — le dancefloor comme il devrait être.",
  6: "La session culte autour de la cabine passe en mode jungle. Breaks à 174 BPM, rewinds et la salle la plus moite de l'est londonien.",
  7: "Quatre jours de pure euphorie hardstyle. La légendaire scène RED, des feux d'artifice et 100 000 warriors chantant à l'unisson.",
  8: "Un rassemblement psychédélique d'une semaine au bord d'un lac portugais. Art visionnaire, son off-grid et le dancefloor psytrance le plus célèbre de la planète.",
  9: "Une vraie free party — les coordonnées tombent la veille au soir. Plusieurs sound systems, groupes électrogènes, boue et liberté. Apporte ton eau. Aucun sponsor commercial, jamais.",
  10: "La production scénique la plus spectaculaire au monde. Pyrotechnie, décor féérique et la famille EDM mondiale réunie dans une forêt belge.",
  11: "De la techno dub épurée dans un loft intime. Plafonds bas, gros stacks Funktion-One et un public strictement tête baissée.",
  12: "Carnage DnB d'Halloween dans un ancien dépôt ferroviaire caverneux. Rollers liquides en début de soirée, jump-up déchaîné dès 2h.",
  13: "Coucher de soleil méditerranéen, brise marine et 303 qui grésillent. Un open-air boutique où la house fond dans l'acid quand la nuit prend le dessus.",
  14: "Trance uplifting et progressive sur les rives du canal du Danube. Mains en l'air, lasers au-dessus, pure euphorie jusqu'à l'aube.",
  15: "La programmation la plus dure de Belgique dans un hall de fret du XIXe siècle. Acier industriel, stroboscopes aveuglants et 150 BPM sans pitié.",
  16: "Le marathon légendaire de la côte roumaine. Minimal & micro-house qui s'étire sur des jours — personne ne connaît l'heure, et personne ne s'en soucie.",
};
