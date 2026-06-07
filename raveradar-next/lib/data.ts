import type { RaveEvent, GenreColor, Lang } from "./types";

export const GENRES: Record<string, GenreColor> = {
  Techno: { c1: "#2F7BFF", c2: "#8B5CFF" },
  "Hard Techno": { c1: "#FF2D9B", c2: "#FF6A3D" },
  "Acid Techno": { c1: "#C6FF3D", c2: "#19E7FF" },
  Hardstyle: { c1: "#FF2D9B", c2: "#FFC23D" },
  Hardcore: { c1: "#FF3D3D", c2: "#8B5CFF" },
  EDM: { c1: "#19E7FF", c2: "#2F7BFF" },
  "Drum & Bass": { c1: "#8B5CFF", c2: "#19E7FF" },
  House: { c1: "#FF6A3D", c2: "#FF2D9B" },
  Trance: { c1: "#19E7FF", c2: "#8B5CFF" },
  Psytrance: { c1: "#C6FF3D", c2: "#8B5CFF" },
  "Free Party": { c1: "#C6FF3D", c2: "#FF2D9B" },
  Warehouse: { c1: "#6E7081", c2: "#2F7BFF" },
};

export const poster = (g: string): string => {
  const k = GENRES[g] ?? GENRES.Techno;
  return `linear-gradient(150deg, ${k.c1} 0%, ${k.c2} 55%, #0A0B11 110%)`;
};

export const EVENTS: RaveEvent[] = [
  // Verified real 2026 festivals — dates/venues checked online (see git history).
  // Line-ups only where officially announced; empty = "Programmation à venir".
  { id: 1, title: "Awakenings Summer Festival", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Hilvarenbeek", country: "Netherlands", lat: 51.52, lng: 5.13, date: "2026-07-10", time: "12:00", price: 99, currency: "€", venue: "Festivalpark Hilvarenbeek", trending: true, lineup: ["Amelie Lens", "Charlotte de Witte", "999999999", "I Hate Models", "Adriatique", "Joseph Capriati", "Joris Voorn", "Marco Carola", "Ben Klock", "Len Faki", "Dax J", "Indira Paganotto"], desc: "Le plus grand festival techno du monde, trois jours sur les plaines néerlandaises." },
  { id: 46, title: "Awakenings Upclose", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Spaarnwoude", country: "Netherlands", lat: 52.41, lng: 4.74, date: "2026-05-16", time: "12:00", price: 79, currency: "€", venue: "Spaarnwoude, Houtrak", trending: true, lineup: ["Ben UFO", "Four Tet", "Ben Klock", "Rødhåd", "Anetha", "Joris Voorn", "Chris Liebing", "Speedy J", "Freddy K", "Planetary Assault Systems"], desc: "L'édition de printemps d'Awakenings à Spaarnwoude : techno pure, deux jours en plein air." },
  { id: 3, title: "Verknipt Festival", type: "Festival", genres: ["Hard Techno", "Techno"], city: "Utrecht", country: "Netherlands", lat: 52.07, lng: 5.05, date: "2026-06-06", time: "12:00", price: 55, currency: "€", venue: "Strijkviertel", trending: true, lineup: ["Shlømo", "Justin Jay", "Johannes Schuster", "Restricted", "Peterblue", "Nicolas Julian", "KLOFAMA", "SLVL", "KRUELTY", "Vieze Asbak"], desc: "Le festival hard techno néerlandais à Strijkviertel, près d'Utrecht : deux jours de kicks implacables." },
  { id: 7, title: "Defqon.1 Weekend", type: "Festival", genres: ["Hardstyle", "Hardcore"], city: "Biddinghuizen", country: "Netherlands", lat: 52.45, lng: 5.70, date: "2026-06-25", time: "10:00", price: 219, currency: "€", venue: "Evenemententerrein", trending: true, lineup: ["D-Sturb", "Brennan Heart", "D-Block & S-te-Fan", "Coone", "Ran-D", "Sefa", "DJ Isaac", "GPF", "Outsiders", "Adaro"], desc: "Quatre jours d'euphorie hardstyle, la légendaire scène RED et des dizaines de milliers de warriors." },
  { id: 10, title: "Tomorrowland", type: "Festival", genres: ["EDM", "Trance"], city: "Boom", country: "Belgium", lat: 51.09, lng: 4.37, date: "2026-07-17", time: "12:00", price: 299, currency: "€", venue: "De Schorre", trending: true, lineup: ["Calvin Harris", "David Guetta", "Martin Garrix", "Armin van Buuren", "Hardwell", "Fisher", "John Summit", "The Chainsmokers", "Lost Frequencies", "Amelie Lens", "Sara Landry", "I Hate Models"], desc: "La production scénique la plus spectaculaire au monde, deux week-ends dans une forêt belge." },
  { id: 35, title: "Time Warp", type: "Festival", genres: ["Techno"], city: "Mannheim", country: "Germany", lat: 49.48, lng: 8.49, date: "2026-03-21", time: "19:00", price: 89, currency: "€", venue: "Maimarkthalle", trending: true, lineup: ["Richie Hawtin", "Sven Väth", "Adam Beyer", "Amelie Lens", "Nina Kraviz", "Marcel Dettmann", "Kobosil", "Sara Landry", "Honey Dijon", "Laurent Garnier", "Jamie Jones", "Loco Dice"], desc: "La nuit techno la plus mythique d'Allemagne : 19 heures non-stop, plusieurs scènes, du crépuscule au lendemain." },
  { id: 34, title: "Sónar", type: "Festival", genres: ["Techno", "EDM"], city: "Barcelona", country: "Spain", lat: 41.35, lng: 2.13, date: "2026-06-18", time: "12:00", price: 79, currency: "€", venue: "Fira Gran Via", trending: true, lineup: ["The Prodigy", "Skepta", "Charlotte de Witte", "Amelie Lens", "Dom Dolla", "Boys Noize", "Joy Orbison", "Sara Landry", "Daniel Avery", "Goldie", "Sammy Virji", "Nia Archives"], desc: "Le festival barcelonais des musiques avancées et des arts numériques : le futur du son, jour et nuit." },
  { id: 36, title: "DGTL Amsterdam", type: "Festival", genres: ["Techno", "House"], city: "Amsterdam", country: "Netherlands", lat: 52.40, lng: 4.89, date: "2026-04-03", time: "12:00", price: 69, currency: "€", venue: "NDSM Docklands", trending: true, lineup: ["Armand van Helden", "Dom Dolla", "CamelPhat", "Jayda G", "Kölsch", "FJAAK", "I Hate Models", "Âme", "Gerd Janson", "Héctor Oaks", "horsegiirL"], desc: "Le festival circulaire et durable des docks d'Amsterdam : techno mélodique et art monumental." },
  { id: 33, title: "Kappa FuturFestival", type: "Festival", genres: ["Techno", "House"], city: "Turin", country: "Italy", lat: 45.08, lng: 7.66, date: "2026-07-03", time: "12:00", price: 75, currency: "€", venue: "Parco Dora", trending: true, lineup: ["Charlotte de Witte", "Skrillex", "Solomun", "Peggy Gou", "Four Tet", "Amelie Lens", "Armin van Buuren", "Disclosure", "Richie Hawtin", "Sven Väth", "Michael Bibi", "Maceo Plex"], desc: "Le festival open-air le plus chaud d'Italie dans une ancienne aciérie de Turin : techno et house au soleil." },
  { id: 37, title: "Nature One", type: "Festival", genres: ["Techno", "Hardstyle"], city: "Kastellaun", country: "Germany", lat: 50.07, lng: 7.45, date: "2026-07-30", time: "14:00", price: 99, currency: "€", venue: "Raketenbasis Pydna", trending: true, lineup: ["Paul Kalkbrenner", "Fatboy Slim", "Sven Väth", "I Hate Models", "Angerfist", "Stephan Bodzin", "Paul van Dyk", "Monika Kruse", "Lilly Palmer", "Neelix", "Felix Jaehn"], desc: "Sur une ancienne base de missiles allemande, l'un des plus grands festivals électroniques d'Europe." },
  { id: 45, title: "Dour Festival", type: "Festival", genres: ["Techno", "Drum & Bass"], city: "Dour", country: "Belgium", lat: 50.39, lng: 3.78, date: "2026-07-15", time: "14:00", price: 99, currency: "€", venue: "Plaine de la Machine à Feu", trending: true, lineup: ["Pendulum", "Amelie Lens", "Sammy Virji", "Boys Noize", "SPFDJ", "DJ Gigola", "Rudimental", "Vladimir Cauchemar", "Peterblue", "Hamdi"], desc: "Le festival belge éclectique surnommé le Woodstock de la Borinage : techno, bass et toutes les contre-cultures." },
  { id: 39, title: "Junction 2", type: "Festival", genres: ["Techno"], city: "London", country: "UK", lat: 51.49, lng: -0.32, date: "2026-07-24", time: "12:00", price: 65, currency: "£", venue: "Boston Manor Park", trending: false, lineup: ["Adam Beyer", "Nina Kraviz", "Jeff Mills", "Marcel Dettmann", "I Hate Models", "Franky Wah", "Miss Monique", "Nicolas Lutz", "Funk Tribu", "Charlie Sparks"], desc: "Le festival techno londonien sous les pylônes électriques de Boston Manor : brut, urbain, intense." },
  { id: 17, title: "Nuits Sonores", type: "Festival", genres: ["Techno", "House"], city: "Lyon", country: "France", region: "Rhône", lat: 45.76, lng: 4.84, date: "2026-05-13", time: "14:00", price: 49, currency: "€", venue: "Les Grandes Locos", trending: true, lineup: ["Ben Klock", "Four Tet", "Amelie Lens", "Leftfield", "808 State", "Acid Arab", "Deena Abdelwahed", "James Holden", "The Sabres of Paradise"], desc: "Le rendez-vous électronique culte de Lyon : techno, house et découvertes dans d'anciennes usines réhabilitées." },
  { id: 18, title: "Astropolis", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Brest", country: "France", region: "Bretagne", lat: 48.40, lng: -4.55, date: "2026-07-02", time: "16:00", price: 45, currency: "€", venue: "Manoir de Keroual", trending: false, lineup: ["Jeff Mills", "Laurent Garnier", "Carl Craig", "Octo Octa", "Eris Drew", "Nathan Fake", "Perc", "Call Super", "Chlär", "Cassie Raptor"], desc: "Le plus vieux festival techno de France (30e édition), sur la pointe bretonne : raves en plein air et nuits en clubs." },
  { id: 21, title: "The Peacock Society", type: "Festival", genres: ["Techno", "Trance"], city: "Paris", country: "France", region: "Paris", lat: 48.83, lng: 2.49, date: "2026-07-10", time: "14:00", price: 59, currency: "€", venue: "Hippodrome Paris-Vincennes", trending: true, lineup: ["Boys Noize", "Busy P", "Floating Points", "Robert Hood", "Dax J", "Palms Trax", "SebastiAn", "Mathew Jonson", "horsegiirL", "Young Marco"], desc: "Le festival techno parisien de référence, deux jours à l'Hippodrome de Vincennes entre mélodique et hard." },
  { id: 22, title: "Marvellous Island", type: "Festival", genres: ["House", "Techno"], city: "Torcy", country: "France", region: "Seine-et-Marne", lat: 48.85, lng: 2.65, date: "2026-05-23", time: "13:00", price: 49, currency: "€", venue: "Plage de Torcy", trending: true, lineup: ["Ben Hemsley", "Dennis Cruz", "Korolova", "Mathame", "Nic Fanciulli", "Reinier Zonneveld", "Fatima Hajji", "Ilario Alicante", "Wade", "Oxia"], desc: "Un festival house et techno les pieds dans l'eau à l'est de Paris : lac, plage et cinq scènes." },
  { id: 23, title: "Family Piknik", type: "Festival", genres: ["House", "Techno"], city: "Montpellier", country: "France", region: "Hérault", lat: 43.59, lng: 3.95, date: "2026-08-01", time: "12:00", price: 45, currency: "€", venue: "Parc des Expositions", trending: true, lineup: ["Armand van Helden", "Kevin de Vries", "Space 92", "Blond:ish", "Korolova", "Etienne de Crécy", "Oliver Huntemann", "Brina Knauss", "Chus & Ceballos", "HVOB"], desc: "Le pique-nique électronique géant de Montpellier (15e édition) : house mélodique et soleil du Sud." },
  { id: 24, title: "Hadra Trance Festival", type: "Festival", genres: ["Psytrance", "Trance"], city: "Vieure", country: "France", region: "Allier", lat: 46.55, lng: 2.95, date: "2026-08-27", time: "12:00", price: 75, currency: "€", venue: "Plan d'Eau de Vieure", trending: false, lineup: [], desc: "Le grand rassemblement psytrance français (17e édition), désormais dans l'Allier : 72h de musique sur quatre scènes." },
  { id: 25, title: "Positiv Festival", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Orange", country: "France", region: "Vaucluse", lat: 44.14, lng: 4.81, date: "2026-08-14", time: "19:00", price: 55, currency: "€", venue: "Théâtre Antique d'Orange", trending: true, lineup: ["Boris Brejcha", "Charlotte de Witte", "Fisher", "Marlon Hoffstadt", "Novah", "Biianco", "Carla Schmitt", "Macklemore", "Apashe", "Venga"], desc: "Le festival électro au pied du Théâtre Antique d'Orange, monument classé à l'UNESCO." },
  { id: 31, title: "Insane Festival", type: "Festival", genres: ["Hardcore", "Hardstyle"], city: "Apt", country: "France", region: "Vaucluse", lat: 43.87, lng: 5.39, date: "2026-05-14", time: "16:00", price: 59, currency: "€", venue: "Plan d'Eau d'Apt", trending: false, lineup: ["IMANU", "Angerfist", "Lil Texas", "Reinier Zonneveld", "Daria Kolosova", "Rooler", "Krowdexx", "GPF", "Restricted", "Vortek's"], desc: "Le festival frenchcore et hardcore le plus dur de France (10e édition), cinq scènes en pleine Provence." },

  /* ---------- More verified 2026 festivals (multi-country) ---------- */
  { id: 49, title: "Rave The Planet Parade", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Berlin", country: "Germany", lat: 52.514, lng: 13.35, date: "2026-08-15", time: "14:00", price: 0, currency: "€", venue: "Straße des 17. Juni", trending: true, lineup: [], desc: "L'héritière de la Love Parade : la grande parade techno de Berlin sur la Straße des 17. Juni, gratuite et géante." },
  { id: 50, title: "UNTOLD", type: "Festival", genres: ["EDM", "Trance"], city: "Cluj-Napoca", country: "Romania", lat: 46.77, lng: 23.62, date: "2026-08-06", time: "16:00", price: 165, currency: "€", venue: "Cluj Arena", trending: true, lineup: ["Martin Garrix", "Kygo", "Marshmello", "Steve Aoki", "Afrojack", "Lost Frequencies", "The Chainsmokers", "Sebastian Ingrosso", "R3hab", "Alok"], desc: "L'un des plus grands festivals d'Europe de l'Est, dans l'arène de Cluj : quatre nuits de mainstages spectaculaires." },
  { id: 51, title: "Ultra Europe", type: "Festival", genres: ["EDM", "Techno"], city: "Split", country: "Croatia", lat: 43.51, lng: 16.44, date: "2026-07-10", time: "17:00", price: 159, currency: "€", venue: "Park Mladeži", trending: true, lineup: ["Calvin Harris", "Martin Garrix", "John Summit", "Fisher", "Dom Dolla", "Sara Landry", "Mau P", "Miss Monique", "I Hate Models", "Worship"], desc: "La déclinaison européenne d'Ultra, dans le stade de Split au bord de l'Adriatique : trois jours de grosses têtes d'affiche." },
  { id: 52, title: "Decibel Outdoor", type: "Festival", genres: ["Hardstyle", "Hardcore"], city: "Hilvarenbeek", country: "Netherlands", lat: 51.49, lng: 5.14, date: "2026-08-28", time: "11:00", price: 159, currency: "€", venue: "Safaripark Beekse Bergen", trending: true, lineup: ["Sub Zero Project", "Warface", "Rebelion", "Headhunterz", "Ran-D", "D-Sturb", "Angerfist", "Sefa", "D-Block & S-te-Fan", "Frequencerz", "B-Front", "Korsakoff"], desc: "Le rendez-vous hardstyle/hardcore géant des Pays-Bas à Beekse Bergen : 300+ artistes sur trois jours." },
  { id: 53, title: "Parookaville", type: "Festival", genres: ["EDM", "Trance"], city: "Weeze", country: "Germany", lat: 51.61, lng: 6.14, date: "2026-07-17", time: "12:00", price: 199, currency: "€", venue: "Airport Weeze", trending: true, lineup: ["Armin van Buuren", "Charlotte de Witte", "The Chainsmokers", "Hardwell", "Fisher", "Steve Aoki", "Don Diablo", "Timmy Trumpet", "Scooter", "W&W", "Felix Jaehn"], desc: "La « ville de rêve » EDM construite sur l'aéroport de Weeze : visas, scènes démesurées et stars mondiales." },
  { id: 54, title: "Dekmantel Festival", type: "Festival", genres: ["Techno", "House"], city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.84, date: "2026-07-31", time: "12:00", price: 109, currency: "€", venue: "Amsterdamse Bos", trending: true, lineup: ["Ricardo Villalobos", "Underground Resistance", "Sherelle", "DVS1", "DARKSIDE", "Eris Drew", "Octo Octa"], desc: "Le festival underground de référence dans l'Amsterdamse Bos : techno, house et programmation pointue." },
  { id: 55, title: "Creamfields", type: "Festival", genres: ["EDM", "Techno"], city: "Daresbury", country: "UK", lat: 53.34, lng: -2.64, date: "2026-08-27", time: "12:00", price: 99, currency: "£", venue: "Daresbury, Cheshire", trending: true, lineup: ["Calvin Harris", "Swedish House Mafia", "Carl Cox", "Tiësto", "Martin Garrix", "Armin van Buuren", "Amelie Lens", "Disclosure", "Chris Stussy", "Armand van Helden", "Underworld"], desc: "L'institution dance britannique à Daresbury (20 ans) : house, techno, trance et DnB sur d'immenses scènes." },
  { id: 56, title: "Monegros Desert Festival", type: "Festival", genres: ["Techno", "House"], city: "Fraga", country: "Spain", lat: 41.52, lng: 0.35, date: "2026-07-25", time: "18:00", price: 95, currency: "€", venue: "Monegros Desert", trending: false, lineup: ["Richie Hawtin", "Amelie Lens", "Seth Troxler", "Paco Osuna", "Joseph Capriati", "Len Faki", "Klangkuenstler", "Indira Paganotto", "Héctor Oaks", "Fatima Hajji", "Kobosil", "Ben Klock"], desc: "La rave mythique en plein désert espagnol de Fraga : 22 heures non-stop sur dix scènes." },
  { id: 57, title: "The Warehouse Project", type: "Festival", genres: ["Techno", "House"], city: "Manchester", country: "UK", lat: 53.47, lng: -2.23, date: "2026-09-18", time: "21:00", price: 45, currency: "£", venue: "Depot Mayfield", trending: false, lineup: ["Solomun", "Overmono", "Tiësto", "Aphex Twin"], desc: "La saison clubbing culte de Manchester au Depot Mayfield, de septembre au Nouvel An." },
  { id: 58, title: "Awakenings ADE", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Amsterdam", country: "Netherlands", lat: 52.36, lng: 4.90, date: "2026-10-21", time: "22:00", price: 45, currency: "€", venue: "Amsterdam (ADE)", trending: true, lineup: ["Adam Beyer", "Charlotte de Witte", "Amelie Lens", "Reinier Zonneveld", "Nina Kraviz", "Paula Temple", "Héctor Oaks", "Cera Khin", "Underground Resistance"], desc: "Les nuits techno d'Awakenings pendant l'Amsterdam Dance Event : la crème de la scène en clubs." },
  { id: 59, title: "OZORA Festival", type: "Festival", genres: ["Psytrance", "Trance"], city: "Dádpuszta", country: "Hungary", lat: 46.99, lng: 18.55, date: "2026-07-27", time: "12:00", price: 230, currency: "€", venue: "Dádpuszta", trending: false, lineup: [], desc: "Le grand rassemblement psytrance mondial dans la vallée de Dádpuszta : art, transe et tribu." },
  { id: 60, title: "Neopop Festival", type: "Festival", genres: ["Techno", "House"], city: "Viana do Castelo", country: "Portugal", lat: 41.69, lng: -8.83, date: "2026-08-06", time: "18:00", price: 79, currency: "€", venue: "Forte de Santiago da Barra", trending: false, lineup: ["Nina Kraviz", "Richie Hawtin", "Ben Klock", "Rødhåd", "Dubfire", "Enrico Sangiuliano", "Joseph Capriati", "Helena Hauff", "Ellen Allien", "Indira Paganotto"], desc: "Le festival techno portugais dans le fort de Viana do Castelo (20 ans) : avant-garde au bord de l'océan." },
  { id: 61, title: "Glitch Festival", type: "Festival", genres: ["Techno", "House"], city: "Rabat", country: "Malta", lat: 35.88, lng: 14.40, date: "2026-08-12", time: "16:00", price: 99, currency: "€", venue: "Gianpula Fields", trending: false, lineup: ["Amelie Lens", "Ben Klock", "Rødhåd", "VTSS", "KI/KI", "Job Jobse", "DAX J", "Quelza", "Henning Baer", "Wata Igarashi"], desc: "House & techno sur l'île de Malte : main stage à Gianpula, boat parties et fortifications UNESCO." },
  { id: 62, title: "Zamna Tulum", type: "Festival", genres: ["House", "Techno"], city: "Tulum", country: "Mexico", lat: 20.21, lng: -87.46, date: "2026-12-28", time: "16:00", price: 120, currency: "$", venue: "Tulum Jungle", trending: false, lineup: [], desc: "Dans la jungle de Tulum : house et techno mélodique sous les étoiles, le rendez-vous hivernal du Mexique." },
  { id: 63, title: "Let It Roll", type: "Festival", genres: ["Drum & Bass"], city: "Most", country: "Czech Republic", lat: 50.52, lng: 13.64, date: "2026-07-30", time: "16:00", price: 99, currency: "€", venue: "Lake Most", trending: true, lineup: ["Chase & Status", "Pendulum", "Black Sun Empire", "LTJ Bukem", "The Upbeats", "Aphrodite", "Current Value", "Rusko", "NGHTMRE", "Friction", "Metrik"], desc: "Le plus grand festival drum & bass du monde, au bord du lac de Most en Tchéquie : trois nuits de breaks à 174." },
  { id: 64, title: "UNUM Festival", type: "Festival", genres: ["House", "Techno"], city: "Shëngjin", country: "Albania", lat: 41.81, lng: 19.59, date: "2026-06-04", time: "16:00", price: 120, currency: "€", venue: "Rana e Hedhun Beach", trending: true, lineup: ["&ME", "Ricardo Villalobos", "Ben Klock", "Raresh", "Craig Richards", "DJ Tennis", "Cinthie", "Voigtmann"], desc: "Cinq jours et cinq nuits de house, techno et minimal sur une plage albanaise sauvage." },
  { id: 65, title: "No Sleep Festival", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Belgrade", country: "Serbia", lat: 44.83, lng: 20.43, date: "2026-11-28", time: "22:00", price: 55, currency: "€", venue: "New Hangar, Port of Belgrade", trending: false, lineup: [], desc: "Le petit frère hivernal d'EXIT : techno dans le hangar géant du port de Belgrade et 10 autres lieux." },
  { id: 66, title: "SonneMondSterne", type: "Festival", genres: ["Techno", "House"], city: "Saalburg-Ebersdorf", country: "Germany", lat: 50.50, lng: 11.71, date: "2026-08-07", time: "12:00", price: 139, currency: "€", venue: "Bleilochtalsperre", trending: false, lineup: ["Skrillex", "Scooter", "Paul Kalkbrenner", "The Chainsmokers", "Fisher", "I Hate Models", "Andy C", "Kobosil", "Nico Moreno", "Sara Landry"], desc: "L'un des grands festivals électro d'Allemagne, du coucher au lever du soleil au bord du lac de Saalburg." },
  { id: 67, title: "Polifonic", type: "Festival", genres: ["Techno", "House"], city: "Bari", country: "Italy", lat: 40.80, lng: 17.38, date: "2026-07-22", time: "16:00", price: 109, currency: "€", venue: "Valle d'Itria, Puglia", trending: false, lineup: ["Carl Craig", "Moodymann", "Ben UFO", "Donato Dozzy", "DjRUM", "Sama' Abdulhadi", "Gerd Janson", "Chloé Caillet", "A Guy Called Gerald", "Shackleton"], desc: "Festival boutique des Pouilles : électro pointue entre oliveraies, masseria et plages de l'Adriatique." },
  { id: 68, title: "Tauron Nowa Muzyka", type: "Festival", genres: ["Techno", "House"], city: "Katowice", country: "Poland", lat: 50.26, lng: 19.02, date: "2026-06-04", time: "16:00", price: 69, currency: "€", venue: "Strefa Kultury", trending: false, lineup: ["Apparat", "Modeselektor", "John Digweed", "Hania Rani", "Dave Clarke", "Blawan", "ANNA", "Erol Alkan", "Gui Boratto", "Nick Warren"], desc: "Le festival électro/techno primé de Katowice, dans une friche industrielle réhabilitée de Silésie." },

  /* ---------- More verified 2026 events — festivals & club nights ---------- */
  { id: 69, title: "Les Plages Électroniques", type: "Festival", genres: ["EDM", "Techno", "House"], city: "Cannes", country: "France", region: "Alpes-Maritimes", lat: 43.55, lng: 7.017, date: "2026-08-07", time: "16:00", price: 49, currency: "€", venue: "Plage du Palais des Festivals", trending: true, lineup: ["DJ Snake", "Martin Garrix", "Amelie Lens", "Nico Moreno", "Marshmello", "Mathame", "Maceo Plex", "Mind Against", "Sonny Fodera", "Vladimir Cauchemar"], desc: "La plus grande beach party de France fête ses 20 ans : trois jours les pieds dans le sable sur la plage du Palais des Festivals de Cannes, six scènes face à la Méditerranée." },
  { id: 70, title: "Paradise City", type: "Festival", genres: ["Techno", "House"], city: "Steenokkerzeel", country: "Belgium", lat: 50.91, lng: 4.49, date: "2026-06-26", time: "13:00", price: 75, currency: "€", venue: "Domaine du Château de Ribaucourt", trending: false, lineup: ["Richie Hawtin", "Floating Points", "Helena Hauff", "Sherelle", "LTJ Bukem", "Octo Octa", "Eris Drew", "Mall Grab", "Carista", "Enzo Siragusa"], desc: "Le festival éco-responsable belge dans les jardins du château de Ribaucourt : techno, house et art contemporain en dialogue avec la nature." },
  { id: 71, title: "Loveland Festival", type: "Festival", genres: ["Techno", "House"], city: "Amsterdam", country: "Netherlands", lat: 52.37, lng: 4.81, date: "2026-08-08", time: "12:00", price: 95, currency: "€", venue: "Sloterpark", trending: true, lineup: ["Sven Väth", "Sasha", "John Digweed", "Fatboy Slim", "Eric Prydz", "Ben Klock", "Hot Since 82", "CamelPhat", "Mau P", "Joris Voorn"], desc: "La rave lacustre d'Amsterdam fête ses 25 ans au Sloterpark : deux jours de techno et house au bord de l'eau avec les légendes du genre." },
  { id: 72, title: "Brunch Electronik Festival", type: "Festival", genres: ["House", "Techno"], city: "Barcelona", country: "Spain", lat: 41.41, lng: 2.22, date: "2026-08-07", time: "14:00", price: 65, currency: "€", venue: "Parc del Fòrum", trending: true, lineup: ["Eric Prydz", "Paul Kalkbrenner", "Jamie Jones", "Kaytranada", "Jeff Mills", "Floating Points", "CamelPhat", "I Hate Models", "Deborah de Luca", "The Blaze"], desc: "Le rendez-vous diurne de Barcelone passe à trois jours au Parc del Fòrum : house et techno face à la mer, du déjeuner au coucher du soleil." },
  { id: 73, title: "Dominator Festival", type: "Festival", genres: ["Hardcore", "Hardstyle"], city: "Eersel", country: "Netherlands", lat: 51.36, lng: 5.31, date: "2026-07-17", time: "12:00", price: 99, currency: "€", venue: "E3 Strand", trending: false, lineup: ["Angerfist", "Miss K8", "Partyraiser", "Paul Elstak", "Dr. Peacock"], desc: "Le plus grand rassemblement hardcore du monde au E3 Strand d'Eersel : édition « Fatal Fortune », 200+ artistes et dix scènes du frenchcore à l'uptempo." },
  { id: 74, title: "Pyramid · Amnesia Ibiza", type: "Club", genres: ["Techno", "House"], city: "Ibiza", country: "Spain", lat: 38.95, lng: 1.41, date: "2026-06-14", time: "23:00", price: 70, currency: "€", venue: "Amnesia Ibiza", trending: true, lineup: ["Ricardo Villalobos", "Raresh", "Enzo Siragusa", "Traumer", "Mar-T", "Lola Palmer"], desc: "L'ouverture de la résidence du dimanche d'Amnesia : un b2b Ricardo Villalobos & Raresh lance la saison sous la mythique pyramide d'Ibiza." },
  { id: 75, title: "Resistance · Amnesia Ibiza", type: "Club", genres: ["Techno"], city: "Ibiza", country: "Spain", lat: 38.95, lng: 1.41, date: "2026-07-22", time: "23:30", price: 75, currency: "€", venue: "Amnesia Ibiza", trending: true, lineup: ["Adam Beyer", "ARTBAT", "Boris Brejcha", "Eric Prydz"], desc: "La résidence techno du mercredi d'Amnesia, pilotée par Adam Beyer : ARTBAT, Boris Brejcha et Eric Prydz en têtes d'affiche tout l'été." },
  { id: 76, title: "Black Coffee · Hï Ibiza", type: "Club", genres: ["House"], city: "Ibiza", country: "Spain", lat: 38.88, lng: 1.41, date: "2026-08-01", time: "23:00", price: 75, currency: "€", venue: "Hï Ibiza", trending: true, lineup: ["Black Coffee", "Skepta"], desc: "La résidence du samedi de Black Coffee, huitième saison à Hï Ibiza : afro-house hypnotique sur le meilleur système son du monde, avec Skepta et son projet Más Tiempo au Club Room." },
  { id: 77, title: "Circoloco · DC-10 Ibiza", type: "Club", genres: ["House", "Techno"], city: "Ibiza", country: "Spain", lat: 38.88, lng: 1.40, date: "2026-04-27", time: "16:00", price: 60, currency: "€", venue: "DC-10", trending: true, lineup: ["&ME", "Rampa", "Dixon", "Seth Troxler", "Luciano", "Tania Vulcano", "Palms Trax", "Prospa", "Jimi Jules", "Call Super"], desc: "L'ouverture de la 27e saison de Circoloco au DC-10 : le lundi le plus culte d'Ibiza, du soleil de l'après-midi aux heures sombres du petit matin." },
];

/* AI-generated key-art posters (Nano Banana Pro), served from CDN. */
const IMG_BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3EfATp4Hvlogg4NEZfgyJXfo5Sh/";
export const IMAGES: Record<number, string> = {
  1: "hf_20260604_131554_9c8e03e9-d794-41e2-b043-bdd13ade4098.png",
  2: "hf_20260604_131601_f965ecd6-a38e-4c2b-8dde-a783c300a924.jpeg",
  3: "hf_20260604_131605_ba41434c-1956-4d6a-a129-dae96ab6dda1.png",
  4: "hf_20260604_131610_ccbfb1b3-7ffd-439b-8080-8abf7092963d.png",
  5: "hf_20260604_131615_86df2774-6d5f-4b47-8847-ae8ea116a253.png",
  6: "hf_20260604_131620_c9d3cd38-4470-4e1f-91c7-d37adc6ff374.png",
  7: "hf_20260604_131624_b6e88fc5-d4e8-4ee9-b0b9-f1af57015856.png",
  8: "hf_20260604_131628_ae370ce7-af87-4995-834e-4c9c4c4e37c6.png",
  9: "hf_20260604_131730_03a01ed2-6705-4e1d-a790-f76ffea0d88f.png",
  10: "hf_20260604_131732_aa86036b-ebb0-4085-b004-cb779f0cc590.png",
  11: "hf_20260604_131733_d2a2ecfa-4328-4986-92cb-a4ee98a5a1fd.png",
  12: "hf_20260604_131734_30f42580-c98c-4944-a122-fc70458da80d.png",
  13: "hf_20260604_131814_d3d5f1e1-11d7-46d2-b856-af66f0c053cb.png",
  14: "hf_20260604_131815_abf356b0-6b32-4f96-8152-fa01195cf263.png",
  15: "hf_20260604_131834_ae5e830f-0ace-4943-b5d2-18a6d6ec71d0.png",
  16: "hf_20260604_131836_3c564a55-5d17-45e3-833b-7cf874f35e66.png",
  17: "hf_20260604_151545_a3b11763-95c5-49ea-8edd-52f738c50b72.png",
  18: "hf_20260604_151546_b2353ca8-1afe-4cf5-829f-2e25980336c7.png",
  21: "hf_20260604_151548_7ab9b16d-d31c-4b8e-846b-0ce6e34db271.png",
  22: "hf_20260604_151549_d05c714a-e34a-4641-a5e4-abc22248e479.png",
  23: "hf_20260604_151652_ab109d96-7e8c-4015-ac40-2a287ce75bd6.png",
  24: "hf_20260604_151652_12b8ba5f-9fce-41bb-a1b8-cb42be632335.png",
  25: "hf_20260604_151654_f7d8e62b-82bd-4282-9dcf-9b81bdb619d5.png",
  26: "hf_20260604_151747_6f2d10cc-8dac-4440-bacf-5833b8963ec5.png",
  31: "hf_20260604_151749_1284b61c-1cda-4f82-b1a5-e2467624126b.png",
  33: "hf_20260604_151750_c52dc4a8-aaeb-482c-a71e-ebd2dffd06c9.png",
  34: "hf_20260604_151841_f932e4b1-008c-47b4-b787-cfb794a33c51.png",
  35: "hf_20260604_151842_5285e560-7e93-4070-b507-38f49d118d4a.png",
  36: "hf_20260604_151844_017801fc-d48d-4d32-a524-8265d8e4cf48.png",
  37: "hf_20260604_151939_cdf1bb4a-5dc7-41ed-ba2d-4f1af0b66f13.png",
  38: "hf_20260604_151940_f550f538-fad8-465f-9f2a-2c33155b9b39.png",
  39: "hf_20260604_151941_e808ce07-3104-402c-a861-97875544f61c.png",
  43: "hf_20260604_151942_aec345c8-c05c-41b9-8fa9-a91781ba3d21.png",
  44: "hf_20260604_152029_9703324b-b9fb-42d4-9e34-bb3929ecb451.png",
  45: "hf_20260604_152218_1dc3a2b2-c53d-4452-b80a-f57db6d95631.png",
  19: "hf_20260604_152728_4e92c8ac-bb1f-492a-9fc6-9f57211bfc23.png",
  20: "hf_20260604_152729_79bd6696-14e5-4ecf-be85-955f7cf0cfaf.png",
  27: "hf_20260604_152730_d26babbf-52ad-4b73-a6f3-2e31d585f85c.png",
  28: "hf_20260604_152731_7d6c2238-41bb-4ef7-bf82-8088cdd803bc.png",
  29: "hf_20260604_152815_2f86892c-38b9-4eed-8aed-edc627597430.png",
  30: "hf_20260604_152817_a652a0f5-c306-4723-91a1-7d057f0d3be5.png",
  32: "hf_20260604_152818_07da0a3e-9fb7-4e73-98c9-f442dd4440ca.png",
  40: "hf_20260604_152919_d547293f-742d-4c2c-8036-a325bc8b605e.png",
  41: "hf_20260604_152853_cc160818-dc2a-4a0b-8e79-a434cf4e12e1.png",
  42: "hf_20260604_152854_d802e872-d4ab-4c4b-b43e-f76379017277.png",
  46: "hf_20260604_152920_39c95ac2-e86f-48f7-beb1-ac44b7e4d215.png",
  47: "hf_20260604_152947_03d3bc5b-8ad8-46dc-b250-feb48fff366f.png",
  48: "hf_20260604_152948_8a3edd1d-8662-45ee-8310-936245d615fe.png",
  49: "hf_20260604_185741_44408ccc-8d6e-4a87-8ebb-6835b47d8b30.png",
  50: "hf_20260604_185743_16fe4b07-0251-4606-9c21-41544bceb559.png",
  51: "hf_20260604_185805_5080b41b-7ac1-4b9c-8ace-15abde5b5b72.png",
  52: "hf_20260604_185744_aa550291-6a41-444c-8cd9-8983585c3291.png",
  53: "hf_20260604_185845_73576712-4bb2-43ab-ac07-479032139768.png",
  54: "hf_20260604_185846_de1443c1-89f2-4213-ad49-8aca1c4dda8a.png",
  55: "hf_20260604_185920_b7280572-5930-44f2-a272-442ef6fabecf.png",
  56: "hf_20260604_190116_7a2252c0-65c6-403b-8642-93d2f202caaf.png",
  57: "hf_20260604_190117_bf48f8a6-b7a6-4f91-bdb3-700fec0050ee.png",
  58: "hf_20260604_190134_4ae9304d-711a-48be-903a-28215fafeed0.png",
  59: "hf_20260604_190151_5b88eee7-47dc-40ce-8779-5caf9dcb3706.png",
  60: "hf_20260604_190222_386e8b13-8f31-416a-9973-d736916d72d4.png",
  61: "hf_20260604_190224_532b7637-1fa6-4ef0-aca2-7abbaa86452e.png",
  62: "hf_20260604_190254_67874e0b-b428-4deb-8237-25a521d88eaa.png",
  63: "hf_20260604_190255_94318562-15f5-4cca-97eb-8a8aa9fef1d4.png",
  64: "hf_20260604_190325_b85d5106-0ebc-4be8-9ca6-496ba51c0d1d.png",
  65: "hf_20260604_190325_1f08b832-7222-4fa1-b137-f83375eafb91.png",
  66: "hf_20260604_190432_c369f23a-f9cf-4e67-9782-f6cf28de2109.png",
  67: "hf_20260604_190434_9abbe2f7-c70b-48c9-afa8-2f30976bdc14.png",
  68: "hf_20260604_190503_d26a409f-e768-4b36-837e-3b349c07be1e.png",
};
export const imageUrl = (e: RaveEvent): string | null => (IMAGES[e.id] ? IMG_BASE + IMAGES[e.id] : null);
/** composite CSS background: real poster on top, genre gradient as fallback */
export const cardBg = (e: RaveEvent): string => {
  const url = imageUrl(e);
  return url ? `url('${url}'), ${poster(e.genres[0])}` : poster(e.genres[0]);
};

/* Official ticketing / event URL per event (organizers provide this in prod). */
const TICKETS: Record<number, string> = {
  1: "https://www.awakenings.com",
  2: "https://www.berghain.berlin",
  3: "https://www.verknipt.com",
  4: "https://www.possession.paris",
  5: "https://ra.co",
  6: "https://boilerroom.tv",
  7: "https://www.defqon1.com",
  8: "https://www.boomfestival.org",
  // 9 = free party (no ticketing)
  10: "https://www.tomorrowland.com",
  11: "https://ra.co",
  12: "https://www.bassrush.com",
  13: "https://ra.co",
  14: "https://ra.co",
  15: "https://thewarehouseproject.com",
  16: "https://www.sunwavesfestival.com",
  17: "https://www.nuits-sonores.com",
  18: "https://www.astropolis.org",
  19: "https://www.le-sucre.eu",
  20: "https://www.rexclub.com",
  21: "https://www.thepeacocksociety.fr",
  22: "https://www.marvellousisland.com",
  23: "https://familypiknik.com",
  24: "https://hadra.net",
  25: "https://www.positivfestival.com",
  31: "https://www.insane-festival.com",
  33: "https://www.kappafuturfestival.it",
  34: "https://sonar.es",
  35: "https://www.time-warp.de",
  36: "https://amsterdam.dgtl.nl",
  37: "https://www.nature-one.de",
  38: "https://www.mysteryland.com",
  39: "https://junction2.london",
  40: "https://www.fabriclondon.com",
  43: "https://www.exitfest.org",
  44: "https://capricesfestival.ch",
  45: "https://www.dourfestival.eu",
  49: "https://www.ravetheplanet.com",
  50: "https://untold.com",
  51: "https://ultraeurope.com",
  52: "https://www.decibeloutdoor.com",
  53: "https://www.parookaville.com",
  54: "https://dekmantelfestival.com",
  55: "https://creamfields.com",
  56: "https://monegrosfestival.com",
  57: "https://thewarehouseproject.com",
  58: "https://www.awakenings.com",
  59: "https://ozorafestival.eu",
  60: "https://neopopfestival.com",
  61: "https://www.glitchfestival.com",
  62: "https://zamnafestival.com",
  63: "https://letitroll.eu",
  64: "https://unumfestival.com",
  65: "https://www.nosleepfestival.com",
  66: "https://www.sonnemondsterne.de",
  67: "https://www.polifonic.it",
  68: "https://festiwalnowamuzyka.pl",
};
/** Ticketing link: explicit URL, else Resident Advisor for paid events, null when free. */
export const ticketUrl = (e: RaveEvent): string | null =>
  TICKETS[e.id] ?? (e.price === 0 ? null : "https://ra.co");

export const ALL_GENRES = Object.keys(GENRES);
export const genreSlug = (g: string): string =>
  g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const genreFromSlug = (s: string): string | undefined =>
  ALL_GENRES.find((g) => genreSlug(g) === s);
export const eventsForGenre = (g: string): RaveEvent[] =>
  EVENTS.filter((e) => e.genres.includes(g)).sort((a, b) => a.date.localeCompare(b.date));

export const slugify = (s: string): string =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const eventSlug = (e: RaveEvent): string => slugify(e.title);
export const eventFromSlug = (s: string): RaveEvent | undefined => EVENTS.find((e) => eventSlug(e) === s);
export const FESTIVALS: RaveEvent[] = EVENTS.filter((e) => e.type === "Festival");
/** SEO-friendly canonical path for an event (festivals live under /festival). */
export const eventPath = (e: RaveEvent): string =>
  e.type === "Festival" ? `/festival/${eventSlug(e)}` : `/event/${eventSlug(e)}`;

export const COUNTRIES = [...new Set(EVENTS.map((e) => e.country))].sort();
export const TYPES: RaveEvent["type"][] = ["Festival", "Club", "Warehouse"];

export const COUNTRY_FR: Record<string, string> = {
  Netherlands: "Pays-Bas", Germany: "Allemagne", France: "France", UK: "Royaume-Uni",
  Portugal: "Portugal", Belgium: "Belgique", Spain: "Espagne", Austria: "Autriche", Romania: "Roumanie",
};
export const COUNTRY_FLAG: Record<string, string> = {
  Netherlands: "🇳🇱", Germany: "🇩🇪", France: "🇫🇷", UK: "🇬🇧", Portugal: "🇵🇹",
  Belgium: "🇧🇪", Spain: "🇪🇸", Austria: "🇦🇹", Romania: "🇷🇴",
};

export const GENRE_DESC_EN: Record<string, string> = {
  Techno: "The 4/4 heartbeat of Berlin & beyond", "Hard Techno": "Faster, harder, relentless BPM",
  "Acid Techno": "Squelching 303 hypnosis", Hardstyle: "Euphoric kicks & reverse bass",
  Hardcore: "200 BPM pure adrenaline", EDM: "Festival mainstage energy",
  "Drum & Bass": "Rolling 174 basslines", Trance: "Euphoric uplifting journeys",
  Psytrance: "Forest & goa frequencies", "Free Party": "Off-grid sound systems",
  Warehouse: "Raw industrial spaces", House: "Soulful grooves all night",
};
export const GENRE_DESC_FR: Record<string, string> = {
  Techno: "Le battement 4/4 de Berlin et au-delà", "Hard Techno": "Plus vite, plus dur, BPM implacable",
  "Acid Techno": "Hypnose grésillante de la 303", Hardstyle: "Kicks euphoriques & reverse bass",
  Hardcore: "200 BPM d'adrénaline pure", EDM: "L'énergie des mainstages de festival",
  "Drum & Bass": "Basslines roulantes à 174", Trance: "Voyages uplifting euphoriques",
  Psytrance: "Fréquences forest & goa", "Free Party": "Sound systems hors-réseau",
  Warehouse: "Espaces industriels bruts", House: "Grooves soul toute la nuit",
};

export const DESC_FR: Record<number, string> = {
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

/* localized accessors */
export const countryLabel = (c: string, lang: Lang) =>
  lang === "fr" ? COUNTRY_FR[c] ?? c : c;
export const genreDescL = (g: string, lang: Lang) =>
  (lang === "fr" ? GENRE_DESC_FR[g] : GENRE_DESC_EN[g]) ?? "";
export const eventDescL = (e: RaveEvent, lang: Lang) =>
  lang === "fr" ? DESC_FR[e.id] ?? e.desc : e.desc;
