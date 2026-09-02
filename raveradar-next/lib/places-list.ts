import type { RaveEvent } from "./types";

/**
 * La liste des lieux, et rien qui lise le calendrier.
 *
 * Module feuille, pour la même raison que `lib/display.ts` : `<Footer>` appelle
 * `placeBySlug()` et il est rendu à l'intérieur de composants client. Tant que ce
 * lookup vivait à côté de `eventsForPlace()` (qui, lui, parcourt `EVENTS`) le
 * footer traînait tout le catalogue dans le bundle de ces pages.
 *
 * `lib/places.ts` ré-exporte tout ce fichier : rien ne change pour les appelants.
 */

export type PlaceKind = "ville" | "departement" | "region";

export interface Place {
  slug: string; // URL slug → /rave-party/{slug}
  label: string; // display name
  kind: PlaceKind;
  vol: number; // approx monthly search volume for "rave party {label}"
  /** city names (in our event data) considered part of this place */
  match?: string[];
}

/* Prioritised from the SEMrush keyword export (see /docs/seo-keywords.md). */
export const PLACES: Place[] = [
  { slug: "lyon", label: "Lyon", kind: "ville", vol: 1000, match: ["Lyon", "Villeurbanne"] },
  { slug: "paris", label: "Paris", kind: "ville", vol: 390, match: ["Paris", "Torcy", "Nanterre", "Villepinte", "Chelles"] },
  { slug: "rennes", label: "Rennes", kind: "ville", vol: 3600, match: ["Rennes"] },
  { slug: "bordeaux", label: "Bordeaux", kind: "ville", vol: 720, match: ["Bordeaux", "Cenon", "Mérignac"] },
  { slug: "nantes", label: "Nantes", kind: "ville", vol: 320, match: ["Nantes"] },
  { slug: "marseille", label: "Marseille", kind: "ville", vol: 260, match: ["Marseille"] },
  { slug: "toulouse", label: "Toulouse", kind: "ville", vol: 210, match: ["Toulouse", "Ramonville-Saint-Agne", "Balma"] },
  { slug: "montpellier", label: "Montpellier", kind: "ville", vol: 260, match: ["Montpellier"] },
  { slug: "brest", label: "Brest", kind: "ville", vol: 210, match: ["Brest"] },
  { slug: "lille", label: "Lille", kind: "ville", vol: 320, match: ["Lille", "Roubaix", "Tourcoing"] },
  { slug: "strasbourg", label: "Strasbourg", kind: "ville", vol: 210, match: ["Strasbourg"] },
  { slug: "nice", label: "Nice", kind: "ville", vol: 210, match: ["Nice"] },
  { slug: "grenoble", label: "Grenoble", kind: "ville", vol: 260, match: ["Grenoble"] },
  /* Ouvertes par le lot d'hiver 2026-27. Leurs départements (Seine-Maritime, Côte-d'Or,
     Pas-de-Calais) n'ont pas de page : sans entrée ici, ces dates n'étaient atteignables
     que par la page pays et les pages genre. `vol` pas encore issu de l'export SEMrush. */
  { slug: "rouen", label: "Rouen", kind: "ville", vol: 210, match: ["Rouen"] },
  { slug: "le-havre", label: "Le Havre", kind: "ville", vol: 170, match: ["Le Havre"] },
  { slug: "dijon", label: "Dijon", kind: "ville", vol: 170, match: ["Dijon"] },
  { slug: "lens", label: "Lens", kind: "ville", vol: 140, match: ["Lens", "Liévin"] },
  /* Ouvertes par le lot BE/FR d'août 2026. Leurs départements (Somme, Loiret,
     Indre-et-Loire) n'ont pas de page : sans entrée ici, ces dates n'étaient
     atteignables que par la page pays et les pages genre, c'est exactement ce que
     signale l'avertissement « dates FR hors de toute page lieu » d'audit.py.
     `vol` pas encore issu de l'export SEMrush : valeur plancher en attendant. */
  { slug: "amiens", label: "Amiens", kind: "ville", vol: 170, match: ["Amiens"] },
  { slug: "orleans", label: "Orléans", kind: "ville", vol: 170, match: ["Orléans"] },
  { slug: "tours", label: "Tours", kind: "ville", vol: 170, match: ["Tours", "Joué-lès-Tours"] },
  /* Nevers : ouverte par la soirée Yann YL au Centre Gérard Philipe de Varennes-Vauzelles,
     commune limitrophe au nord de l'agglomération. La Nièvre n'a pas de page département :
     sans cette entrée, la date n'était atteignable que par /pays/france et les pages genre.
     `vol` pas encore issu de l'export SEMrush : valeur plancher en attendant. */
  { slug: "nevers", label: "Nevers", kind: "ville", vol: 170, match: ["Nevers", "Varennes-Vauzelles"] },
  // Major European cities (target NL/DE/UK volumes; populated by our events)
  { slug: "amsterdam", label: "Amsterdam", kind: "ville", vol: 1900, match: ["Amsterdam"] },
  { slug: "rotterdam", label: "Rotterdam", kind: "ville", vol: 8100, match: ["Rotterdam"] },
  { slug: "berlin", label: "Berlin", kind: "ville", vol: 2400, match: ["Berlin"] },
  /* Cologne : ouverte par la saison Bootshaus (20 dates). `vol` pas encore issu de l'export SEMrush. */
  { slug: "cologne", label: "Cologne", kind: "ville", vol: 480, match: ["Cologne"] },
  { slug: "london", label: "London", kind: "ville", vol: 1300, match: ["London"] },
  { slug: "manchester", label: "Manchester", kind: "ville", vol: 720, match: ["Manchester"] },
  { slug: "barcelona", label: "Barcelona", kind: "ville", vol: 880, match: ["Barcelona"] },
  /* Belgique : 66 dates au catalogue et pas une seule page ville jusqu'ici, elles
     n'étaient atteignables que par /pays/belgique. Les communes rattachées sont celles
     de l'agglomération (Grimbergen et Steenokkerzeel pour Bruxelles, Brasschaat et Boom
     pour Anvers, Seraing pour Liège) : un lecteur qui cherche « rave party Anvers »
     attend Tomorrowland, à quinze kilomètres, dans la même province.
     `vol` pas encore issu de l'export SEMrush : valeur plancher en attendant. */
  { slug: "bruxelles", label: "Bruxelles", kind: "ville", vol: 880, match: ["Brussels", "Grimbergen", "Steenokkerzeel"] },
  { slug: "gand", label: "Gand", kind: "ville", vol: 320, match: ["Ghent"] },
  { slug: "anvers", label: "Anvers", kind: "ville", vol: 320, match: ["Antwerp", "Brasschaat", "Boom"] },
  { slug: "charleroi", label: "Charleroi", kind: "ville", vol: 210, match: ["Charleroi"] },
  { slug: "liege", label: "Liège", kind: "ville", vol: 260, match: ["Liège", "Seraing"] },
  { slug: "drome", label: "Drôme", kind: "departement", vol: 1000 },
  { slug: "lozere", label: "Lozère", kind: "departement", vol: 4400 },
  { slug: "aude", label: "Aude", kind: "departement", vol: 4400 },
  { slug: "lot", label: "Lot", kind: "departement", vol: 5400 },
  { slug: "isere", label: "Isère", kind: "departement", vol: 1000 },
  { slug: "ain", label: "Ain", kind: "departement", vol: 1000 },
  { slug: "herault", label: "Hérault", kind: "departement", vol: 880 },
  { slug: "hautes-alpes", label: "Hautes-Alpes", kind: "departement", vol: 1000 },
  { slug: "tarn", label: "Tarn", kind: "departement", vol: 480 },
  { slug: "aveyron", label: "Aveyron", kind: "departement", vol: 320 },
  { slug: "bretagne", label: "Bretagne", kind: "region", vol: 720 },
  { slug: "loire-atlantique", label: "Loire-Atlantique", kind: "departement", vol: 390 },
  // Departments the calendar now actually covers, each one has at least one dated event.
  { slug: "vaucluse", label: "Vaucluse", kind: "departement", vol: 260 },
  { slug: "bouches-du-rhone", label: "Bouches-du-Rhône", kind: "departement", vol: 320 },
  { slug: "alpes-maritimes", label: "Alpes-Maritimes", kind: "departement", vol: 260 },
  { slug: "gironde", label: "Gironde", kind: "departement", vol: 320 },
  { slug: "nord", label: "Nord", kind: "departement", vol: 390 },
  { slug: "ille-et-vilaine", label: "Ille-et-Vilaine", kind: "departement", vol: 260 },
  { slug: "seine-et-marne", label: "Seine-et-Marne", kind: "departement", vol: 260 },
  { slug: "seine-saint-denis", label: "Seine-Saint-Denis", kind: "departement", vol: 210 },
  { slug: "yvelines", label: "Yvelines", kind: "departement", vol: 210 },
  { slug: "haute-savoie", label: "Haute-Savoie", kind: "departement", vol: 260 },
  { slug: "allier", label: "Allier", kind: "departement", vol: 210 },
  { slug: "ardeche", label: "Ardèche", kind: "departement", vol: 260 },
  { slug: "calvados", label: "Calvados", kind: "departement", vol: 210 },
  { slug: "orne", label: "Orne", kind: "departement", vol: 320 },
  { slug: "rhone", label: "Rhône", kind: "departement", vol: 320 },
  /* Départements ouverts par la vague d'ajouts FR automne/hiver 2026-2027. Leur `vol`
     n'est pas encore issu de l'export SEMrush : valeur plancher en attendant. */
  { slug: "loire", label: "Loire", kind: "departement", vol: 210 },
  { slug: "puy-de-dome", label: "Puy-de-Dôme", kind: "departement", vol: 210 },
  { slug: "meurthe-et-moselle", label: "Meurthe-et-Moselle", kind: "departement", vol: 210 },
  { slug: "moselle", label: "Moselle", kind: "departement", vol: 210 },
  { slug: "bas-rhin", label: "Bas-Rhin", kind: "departement", vol: 210 },
  { slug: "marne", label: "Marne", kind: "departement", vol: 210 },
  { slug: "morbihan", label: "Morbihan", kind: "departement", vol: 210 },
  { slug: "finistere", label: "Finistère", kind: "departement", vol: 210 },
  { slug: "gard", label: "Gard", kind: "departement", vol: 210 },
  { slug: "haute-garonne", label: "Haute-Garonne", kind: "departement", vol: 210 },
  { slug: "pyrenees-orientales", label: "Pyrénées-Orientales", kind: "departement", vol: 210 },
  { slug: "hauts-de-seine", label: "Hauts-de-Seine", kind: "departement", vol: 210 },
  { slug: "doubs", label: "Doubs", kind: "departement", vol: 210 },
  { slug: "charente", label: "Charente", kind: "departement", vol: 210 },
  { slug: "aisne", label: "Aisne", kind: "departement", vol: 210 },
  /* Ouverts par le lot d'août 2026 : Fréjus et Puget-sur-Argens (Var), Bergerac
     (Dordogne), Biarritz (Pyrénées-Atlantiques), Limoges (Haute-Vienne), Oigny
     (Côte-d'Or). Sans entrée ici ces dates n'étaient atteignables que par la page
     pays et les pages genre. `vol` pas encore issu de l'export SEMrush. */
  { slug: "var", label: "Var", kind: "departement", vol: 260 },
  { slug: "dordogne", label: "Dordogne", kind: "departement", vol: 210 },
  { slug: "pyrenees-atlantiques", label: "Pyrénées-Atlantiques", kind: "departement", vol: 210 },
  { slug: "haute-vienne", label: "Haute-Vienne", kind: "departement", vol: 210 },
  /* Ouvert par une correction, pas par un nouveau lot : la soirée Insolitum du 26/02/2027
     était fichée à Bordeaux (Gironde) alors qu'elle a lieu au Bœuf sur le Toit de
     Lons-le-Saunier, deux salles portent ce nom, à 400 km l'une de l'autre. Sans entrée
     ici, la date corrigée n'aurait plus eu aucune page géographique. */
  { slug: "jura", label: "Jura", kind: "departement", vol: 210 },
  { slug: "cote-d-or", label: "Côte-d'Or", kind: "departement", vol: 210 },
  // European cities the calendar now covers, each has at least one dated event.
  { slug: "copenhague", label: "Copenhague", kind: "ville", vol: 1300, match: ["Copenhagen", "Roskilde"] },
  { slug: "stockholm", label: "Stockholm", kind: "ville", vol: 1000, match: ["Stockholm", "Linköping", "Kristianstad"] },
  { slug: "oslo", label: "Oslo", kind: "ville", vol: 720, match: ["Oslo"] },
  { slug: "helsinki", label: "Helsinki", kind: "ville", vol: 880, match: ["Helsinki", "Espoo"] },
  { slug: "reykjavik", label: "Reykjavik", kind: "ville", vol: 320, match: ["Reykjavík", "Hellissandur"] },
  { slug: "tallinn", label: "Tallinn", kind: "ville", vol: 260, match: ["Tallinn", "Narva"] },
  { slug: "riga", label: "Riga", kind: "ville", vol: 320, match: ["Riga", "Liepāja"] },
  { slug: "vilnius", label: "Vilnius", kind: "ville", vol: 260, match: ["Vilnius", "Kaunas"] },
  { slug: "dublin", label: "Dublin", kind: "ville", vol: 880, match: ["Dublin", "Portlaw"] },
  { slug: "belfast", label: "Belfast", kind: "ville", vol: 480, match: ["Belfast"] },
  { slug: "glasgow", label: "Glasgow", kind: "ville", vol: 720, match: ["Glasgow"] },
  { slug: "edimbourg", label: "Édimbourg", kind: "ville", vol: 320, match: ["Edinburgh"] },
  { slug: "bristol", label: "Bristol", kind: "ville", vol: 590, match: ["Bristol"] },
  { slug: "leeds", label: "Leeds", kind: "ville", vol: 480, match: ["Leeds"] },
  { slug: "birmingham", label: "Birmingham", kind: "ville", vol: 480, match: ["Birmingham"] },
  { slug: "liverpool", label: "Liverpool", kind: "ville", vol: 390, match: ["Liverpool"] },
  { slug: "sheffield", label: "Sheffield", kind: "ville", vol: 320, match: ["Sheffield"] },
  { slug: "newcastle", label: "Newcastle", kind: "ville", vol: 320, match: ["Newcastle", "Gateshead"] },
  { slug: "brighton", label: "Brighton", kind: "ville", vol: 390, match: ["Brighton"] },
  { slug: "cardiff", label: "Cardiff", kind: "ville", vol: 260, match: ["Cardiff"] },
  /* Villes britanniques arrivées avec le lot Skiddle. `vol` reste à 0 : l'export
     SEMrush ne les couvre pas, et inventer un volume pour trier une liste serait
     exactement la donnée fabriquée que la règle de contenu interdit. Le champ ne
     sert que de départage dans `rankPlaces()`, après le nombre de dates. */
  { slug: "nottingham", label: "Nottingham", kind: "ville", vol: 0, match: ["Nottingham"] },
  { slug: "southampton", label: "Southampton", kind: "ville", vol: 0, match: ["Southampton"] },
  { slug: "bournemouth", label: "Bournemouth", kind: "ville", vol: 0, match: ["Bournemouth"] },
  { slug: "derby", label: "Derby", kind: "ville", vol: 0, match: ["Derby"] },
  { slug: "leicester", label: "Leicester", kind: "ville", vol: 0, match: ["Leicester"] },
  { slug: "coventry", label: "Coventry", kind: "ville", vol: 0, match: ["Coventry"] },
  { slug: "plymouth", label: "Plymouth", kind: "ville", vol: 0, match: ["Plymouth"] },
  { slug: "aberdeen", label: "Aberdeen", kind: "ville", vol: 0, match: ["Aberdeen"] },
  { slug: "milton-keynes", label: "Milton Keynes", kind: "ville", vol: 0, match: ["Milton Keynes"] },
  { slug: "preston", label: "Preston", kind: "ville", vol: 0, match: ["Preston"] },
  { slug: "northampton", label: "Northampton", kind: "ville", vol: 0, match: ["Northampton"] },
  { slug: "peterborough", label: "Peterborough", kind: "ville", vol: 0, match: ["Peterborough"] },
  { slug: "prague", label: "Prague", kind: "ville", vol: 880, match: ["Prague", "Ostrava"] },
  { slug: "varsovie", label: "Varsovie", kind: "ville", vol: 720, match: ["Warsaw", "Katowice", "Kolobrzeg"] },
  { slug: "budapest", label: "Budapest", kind: "ville", vol: 880, match: ["Budapest"] },
  { slug: "bucarest", label: "Bucarest", kind: "ville", vol: 590, match: ["Bucharest"] },
  { slug: "zagreb", label: "Zagreb", kind: "ville", vol: 390, match: ["Zagreb", "Tisno", "Novalja"] },
  { slug: "belgrade", label: "Belgrade", kind: "ville", vol: 480, match: ["Belgrade", "Vrnjacka Banja"] },
  { slug: "sofia", label: "Sofia", kind: "ville", vol: 320, match: ["Sofia"] },
  { slug: "tbilissi", label: "Tbilissi", kind: "ville", vol: 590, match: ["Tbilisi"] },
];

export const placeBySlug = (slug: string): Place | undefined => PLACES.find((p) => p.slug === slug);
