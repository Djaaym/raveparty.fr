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
  { id: 1, title: "Awakenings Summer Festival", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Hilvarenbeek", country: "Netherlands", lat: 51.52, lng: 5.13, date: "2026-07-10", time: "12:00", price: 99, currency: "€", venue: "Festivalpark Hilvarenbeek", trending: true, lineup: [], desc: "Le plus grand festival techno du monde, trois jours sur les plaines néerlandaises." },
  { id: 46, title: "Awakenings Upclose", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Spaarnwoude", country: "Netherlands", lat: 52.41, lng: 4.74, date: "2026-05-16", time: "12:00", price: 79, currency: "€", venue: "Spaarnwoude, Houtrak", trending: true, lineup: [], desc: "L'édition de printemps d'Awakenings à Spaarnwoude : techno pure, deux jours en plein air." },
  { id: 3, title: "Verknipt Festival", type: "Festival", genres: ["Hard Techno", "Techno"], city: "Utrecht", country: "Netherlands", lat: 52.07, lng: 5.05, date: "2026-06-06", time: "12:00", price: 55, currency: "€", venue: "Strijkviertel", trending: true, lineup: [], desc: "Le festival hard techno néerlandais à Strijkviertel, près d'Utrecht : deux jours de kicks implacables." },
  { id: 7, title: "Defqon.1 Weekend", type: "Festival", genres: ["Hardstyle", "Hardcore"], city: "Biddinghuizen", country: "Netherlands", lat: 52.45, lng: 5.70, date: "2026-06-25", time: "10:00", price: 219, currency: "€", venue: "Evenemententerrein", trending: true, lineup: [], desc: "Quatre jours d'euphorie hardstyle, la légendaire scène RED et des dizaines de milliers de warriors." },
  { id: 10, title: "Tomorrowland", type: "Festival", genres: ["EDM", "Trance"], city: "Boom", country: "Belgium", lat: 51.09, lng: 4.37, date: "2026-07-17", time: "12:00", price: 299, currency: "€", venue: "De Schorre", trending: true, lineup: [], desc: "La production scénique la plus spectaculaire au monde, deux week-ends dans une forêt belge." },
  { id: 35, title: "Time Warp", type: "Festival", genres: ["Techno"], city: "Mannheim", country: "Germany", lat: 49.48, lng: 8.49, date: "2026-03-21", time: "19:00", price: 89, currency: "€", venue: "Maimarkthalle", trending: true, lineup: ["Richie Hawtin", "Sven Väth", "Adam Beyer", "Amelie Lens"], desc: "La nuit techno la plus mythique d'Allemagne : 19 heures non-stop, plusieurs scènes, du crépuscule au lendemain." },
  { id: 34, title: "Sónar", type: "Festival", genres: ["Techno", "EDM"], city: "Barcelona", country: "Spain", lat: 41.35, lng: 2.13, date: "2026-06-18", time: "12:00", price: 79, currency: "€", venue: "Fira Gran Via", trending: true, lineup: ["The Prodigy"], desc: "Le festival barcelonais des musiques avancées et des arts numériques : le futur du son, jour et nuit." },
  { id: 36, title: "DGTL Amsterdam", type: "Festival", genres: ["Techno", "House"], city: "Amsterdam", country: "Netherlands", lat: 52.40, lng: 4.89, date: "2026-04-03", time: "12:00", price: 69, currency: "€", venue: "NDSM Docklands", trending: true, lineup: [], desc: "Le festival circulaire et durable des docks d'Amsterdam : techno mélodique et art monumental." },
  { id: 33, title: "Kappa FuturFestival", type: "Festival", genres: ["Techno", "House"], city: "Turin", country: "Italy", lat: 45.08, lng: 7.66, date: "2026-07-03", time: "12:00", price: 75, currency: "€", venue: "Parco Dora", trending: true, lineup: [], desc: "Le festival open-air le plus chaud d'Italie dans une ancienne aciérie de Turin : techno et house au soleil." },
  { id: 37, title: "Nature One", type: "Festival", genres: ["Techno", "Hardstyle"], city: "Kastellaun", country: "Germany", lat: 50.07, lng: 7.45, date: "2026-07-30", time: "14:00", price: 99, currency: "€", venue: "Raketenbasis Pydna", trending: true, lineup: [], desc: "Sur une ancienne base de missiles allemande, l'un des plus grands festivals électroniques d'Europe." },
  { id: 45, title: "Dour Festival", type: "Festival", genres: ["Techno", "Drum & Bass"], city: "Dour", country: "Belgium", lat: 50.39, lng: 3.78, date: "2026-07-15", time: "14:00", price: 99, currency: "€", venue: "Plaine de la Machine à Feu", trending: true, lineup: [], desc: "Le festival belge éclectique surnommé le Woodstock de la Borinage : techno, bass et toutes les contre-cultures." },
  { id: 39, title: "Junction 2", type: "Festival", genres: ["Techno"], city: "London", country: "UK", lat: 51.49, lng: -0.32, date: "2026-07-24", time: "12:00", price: 65, currency: "£", venue: "Boston Manor Park", trending: false, lineup: [], desc: "Le festival techno londonien sous les pylônes électriques de Boston Manor : brut, urbain, intense." },
  { id: 17, title: "Nuits Sonores", type: "Festival", genres: ["Techno", "House"], city: "Lyon", country: "France", region: "Rhône", lat: 45.76, lng: 4.84, date: "2026-05-13", time: "14:00", price: 49, currency: "€", venue: "Les Grandes Locos", trending: true, lineup: [], desc: "Le rendez-vous électronique culte de Lyon : techno, house et découvertes dans d'anciennes usines réhabilitées." },
  { id: 18, title: "Astropolis", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Brest", country: "France", region: "Bretagne", lat: 48.40, lng: -4.55, date: "2026-07-02", time: "16:00", price: 45, currency: "€", venue: "Manoir de Keroual", trending: false, lineup: [], desc: "Le plus vieux festival techno de France (30e édition), sur la pointe bretonne : raves en plein air et nuits en clubs." },
  { id: 21, title: "The Peacock Society", type: "Festival", genres: ["Techno", "Trance"], city: "Paris", country: "France", region: "Paris", lat: 48.83, lng: 2.49, date: "2026-07-10", time: "14:00", price: 59, currency: "€", venue: "Hippodrome Paris-Vincennes", trending: true, lineup: ["Busy P", "Boys Noize"], desc: "Le festival techno parisien de référence, deux jours à l'Hippodrome de Vincennes entre mélodique et hard." },
  { id: 22, title: "Marvellous Island", type: "Festival", genres: ["House", "Techno"], city: "Torcy", country: "France", region: "Seine-et-Marne", lat: 48.85, lng: 2.65, date: "2026-05-23", time: "13:00", price: 49, currency: "€", venue: "Plage de Torcy", trending: true, lineup: ["Ben Hemsley", "Dennis Cruz", "Korolova", "Mathame", "Nic Fanciulli", "Reinier Zonneveld", "Fatima Hajji", "Ilario Alicante", "Wade"], desc: "Un festival house et techno les pieds dans l'eau à l'est de Paris : lac, plage et cinq scènes." },
  { id: 23, title: "Family Piknik", type: "Festival", genres: ["House", "Techno"], city: "Montpellier", country: "France", region: "Hérault", lat: 43.59, lng: 3.95, date: "2026-08-01", time: "12:00", price: 45, currency: "€", venue: "Parc des Expositions", trending: true, lineup: ["El Row", "HVOB"], desc: "Le pique-nique électronique géant de Montpellier (15e édition) : house mélodique et soleil du Sud." },
  { id: 24, title: "Hadra Trance Festival", type: "Festival", genres: ["Psytrance", "Trance"], city: "Vieure", country: "France", region: "Allier", lat: 46.55, lng: 2.95, date: "2026-08-27", time: "12:00", price: 75, currency: "€", venue: "Plan d'Eau de Vieure", trending: false, lineup: [], desc: "Le grand rassemblement psytrance français (17e édition), désormais dans l'Allier : 72h de musique sur quatre scènes." },
  { id: 25, title: "Positiv Festival", type: "Festival", genres: ["Techno", "Hard Techno"], city: "Orange", country: "France", region: "Vaucluse", lat: 44.14, lng: 4.81, date: "2026-08-14", time: "19:00", price: 55, currency: "€", venue: "Théâtre Antique d'Orange", trending: true, lineup: ["Boris Brejcha", "Charlotte de Witte", "Fisher", "Macklemore", "Apashe"], desc: "Le festival électro au pied du Théâtre Antique d'Orange, monument classé à l'UNESCO." },
  { id: 31, title: "Insane Festival", type: "Festival", genres: ["Hardcore", "Hardstyle"], city: "Apt", country: "France", region: "Vaucluse", lat: 43.87, lng: 5.39, date: "2026-05-14", time: "16:00", price: 59, currency: "€", venue: "Plan d'Eau d'Apt", trending: false, lineup: ["IMANU", "Angerfist", "Lil Texas", "Reinier Zonneveld"], desc: "Le festival frenchcore et hardcore le plus dur de France (10e édition), cinq scènes en pleine Provence." },
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
