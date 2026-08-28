/**
 * Le style de chaque artiste — attribué, pas déduit.
 *
 * Module **feuille** : il n'importe rien, pas même un type de `lib/data.ts`. C'est
 * délibéré, pour la raison documentée sur `lib/display.ts` — un composant client qui
 * toucherait `lib/data.ts` embarquerait les 870 événements du catalogue.
 *
 * ## Pourquoi une map plutôt qu'un calcul
 *
 * Le site savait déjà classer un artiste : `rankGenres()` pondère les genres des
 * soirées où il joue. C'est une déduction, et elle a une limite qu'aucun réglage ne
 * corrige — un festival étiqueté sur huit styles étiquette du même coup les cinquante
 * noms de son affiche. Le jeu brut affirmait ainsi qu'I Hate Models joue de la
 * psytrance. La pondération réduit le bruit, elle ne crée pas l'information manquante :
 * le calendrier ne sait pas ce que joue un artiste, il sait où il joue.
 *
 * `ARTIST_STYLES` porte l'information elle-même, récoltée par
 * `.research/artists/harvest.py` (Wikidata P136, tags MusicBrainz, tags last.fm) et par
 * les lots de recherche `genres-*.json`, puis fusionnée par `.research/artists/genres.py`.
 * `src` dit d'où vient l'attribution, ce qui permet de la reprendre : une entrée
 * `"last.fm"` est un vote de communauté, une entrée `"research"` a été lue quelque part.
 *
 * **Un artiste absent de la map n'est pas une erreur** : aucune source ne le décrivait,
 * `artistGenres()` retombe alors sur `rankGenres()` et sa page ne change pas. Un trou
 * est honnête ; une étiquette plausible ne l'est pas. Ne jamais compléter cette map à la
 * main — elle est réécrite entre les marqueurs STYLES:start / STYLES:end.
 *
 * ## Principal et sous-genre
 *
 * `m` ne contient que des clés de `GENRES` (lib/display.ts) : ce sont les onze cases du
 * site, celles qui ont une page derrière, donc les seules qui peuvent devenir un lien.
 * `s` porte ce que onze cases ne savent pas dire — « Industrial Techno », « Rawstyle »,
 * « Neurofunk », « Tech House ». Ces libellés n'ont **pas** de page : les afficher en
 * lien créerait des centaines d'URLs vides, exactement les pages satellites que le
 * projet évite partout ailleurs. Ils s'affichent, ils ne cliquent pas.
 */

export interface ArtistStyle {
  /** Genres principaux — clés de `GENRES`, le plus représentatif d'abord. 1 à 3. */
  m: string[];
  /** Sous-genres, en libellé d'affichage. Aucune page derrière : jamais un lien. */
  s: string[];
  /** Provenance de l'attribution : "research", ou la liste des sources automatiques. */
  src: string;
}

/* STYLES:start — généré par .research/artists/genres.py, ne pas éditer à la main */
export const ARTIST_STYLES: Record<string, ArtistStyle> = {
  "999999999": { m: ["Acid Techno", "Techno"], s: [], src: "last.fm" }, // 999999999
  "a-guy-called-gerald": { m: ["House", "Drum & Bass"], s: ["Acid House", "Jungle"], src: "research" }, // A Guy Called Gerald
  "above-beyond": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Above & Beyond
  "acid-arab": { m: ["House", "Techno", "Acid Techno"], s: [], src: "last.fm" }, // Acid Arab
  "acid-pauli": { m: ["House", "Techno"], s: ["Downtempo", "Minimal Techno", "Deep House"], src: "research" }, // Acid Pauli
  "act-of-rage": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Act of Rage
  "adam-beyer": { m: ["Techno"], s: ["Minimal Techno", "Breakbeat", "Tech House"], src: "last.fm+musicbrainz" }, // Adam Beyer
  "adaro": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Adaro
  "adrian-mills": { m: ["Hard Techno", "Trance"], s: ["Makina", "Hard Bounce"], src: "research" }, // Adrián Mills
  "afem-syko": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Bouncy Techno"], src: "research" }, // Afem Syko
  "agents-of-time": { m: ["Techno", "House", "Acid Techno"], s: ["Melodic Techno"], src: "research" }, // Agents Of Time
  "alignment": { m: ["Techno"], s: ["Dark Techno", "Rave"], src: "musicbrainz" }, // Alignment
  "alix-perez": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Halftime", "Dubstep"], src: "research" }, // Alix Perez
  "alok": { m: ["EDM", "House"], s: ["Bass House", "Progressive House", "Tropical House"], src: "research" }, // Alok
  "ame": { m: ["House", "Techno"], s: ["Deep House", "Melodic House", "Melodic Techno"], src: "research" }, // Âme
  "amelie-lens": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz" }, // Amelie Lens
  "andy-c": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Andy C
  "anetha": { m: ["Techno", "House"], s: ["Electronica", "Disco", "Industrial Techno"], src: "last.fm+musicbrainz" }, // Anetha
  "angerfist": { m: ["Hardcore"], s: ["Gabber", "Darkcore"], src: "last.fm+musicbrainz" }, // Angerfist
  "anika-kunst": { m: ["Techno", "House"], s: ["Peak Time Techno"], src: "research" }, // Anika Kunst
  "anthony-rother": { m: ["Techno"], s: ["Electro", "Ambient"], src: "research" }, // Anthony Rother
  "anyma": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House", "Progressive House"], src: "research" }, // Anyma
  "apparat": { m: ["Techno"], s: ["Ambient", "IDM", "Downtempo"], src: "research" }, // Apparat
  "armand-van-helden": { m: ["House"], s: ["Speed Garage", "Tech House", "Disco"], src: "research" }, // Armand van Helden
  "armin-van-buuren": { m: ["Trance", "EDM"], s: ["Progressive Trance", "Vocal Trance", "Uplifting Trance"], src: "last.fm+musicbrainz" }, // Armin van Buuren
  "autechre": { m: ["Techno"], s: ["Experimental", "Ambient Techno", "IDM"], src: "musicbrainz" }, // Autechre
  "axwell": { m: ["House", "EDM", "Techno"], s: ["Electro"], src: "last.fm" }, // Axwell
  "beau-didier": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Beau Didier
  "bellaire": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Bellaire
  "ben-hemsley": { m: ["House", "Trance"], s: ["Progressive House", "Rave"], src: "research" }, // Ben Hemsley
  "ben-klock": { m: ["Techno"], s: ["Minimal Techno"], src: "musicbrainz" }, // Ben Klock
  "ben-sims": { m: ["Techno"], s: ["Minimal Techno", "Tribal Techno"], src: "last.fm+musicbrainz" }, // Ben Sims
  "ben-ufo": { m: ["Techno", "House", "Drum & Bass"], s: ["Dubstep", "Experimental", "Electronica"], src: "last.fm+musicbrainz" }, // Ben UFO
  "blasterjaxx": { m: ["EDM", "House"], s: ["Big Room", "Electro House"], src: "research" }, // Blasterjaxx
  "blawan": { m: ["Techno"], s: ["Industrial Techno"], src: "research" }, // Blawan
  "bob-sinclar": { m: ["House", "EDM"], s: ["Electro House", "French House", "Hip House"], src: "last.fm+musicbrainz" }, // Bob Sinclar
  "boris-brejcha": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "last.fm+musicbrainz" }, // Boris Brejcha
  "boys-noize": { m: ["Techno", "House", "Acid Techno"], s: ["Electro"], src: "research" }, // Boys Noize
  "bredren": { m: ["Drum & Bass"], s: [], src: "research" }, // Bredren
  "brennan-heart": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Brennan Heart
  "call-super": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno", "Ambient"], src: "research" }, // Call Super
  "calvin-harris": { m: ["House", "EDM"], s: ["Nu-Disco", "Disco", "Electro House"], src: "last.fm+musicbrainz" }, // Calvin Harris
  "camelphat": { m: ["House"], s: ["Tech House", "Melodic House"], src: "research" }, // CamelPhat
  "carl-craig": { m: ["Techno", "House"], s: ["Detroit Techno"], src: "musicbrainz" }, // Carl Craig
  "cassius": { m: ["House"], s: ["French House", "Filter House", "Disco"], src: "research" }, // Cassius
  "charlotte-de-witte": { m: ["Techno"], s: ["Minimal Techno", "Peak Time Techno"], src: "last.fm+musicbrainz" }, // Charlotte de Witte
  "chicane": { m: ["Trance", "House"], s: ["Ambient", "Downtempo"], src: "research" }, // Chicane
  "chris-liebing": { m: ["Techno", "Hard Techno"], s: ["Schranz", "Minimal Techno", "Tech House"], src: "research" }, // Chris Liebing
  "chris-stussy": { m: ["House", "Techno"], s: ["Deep House"], src: "last.fm" }, // Chris Stussy
  "christian-loffler": { m: ["House", "Techno"], s: ["Deep House", "Ambient", "Downtempo"], src: "research" }, // Christian Löffler
  "coone": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "musicbrainz" }, // Coone
  "d-block-s-te-fan": { m: ["EDM", "Hardstyle", "Hardcore"], s: ["Electro House", "Happy Hardcore"], src: "musicbrainz" }, // D-Block & S-te-Fan
  "daniel-avery": { m: ["Techno", "Acid Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Daniel Avery
  "danth": { m: ["House", "EDM", "Hardstyle"], s: ["Future House", "Big Room"], src: "research" }, // Danth
  "darkside": { m: ["House"], s: ["Downtempo", "Left-field House", "Neo-psychedelia"], src: "research" }, // DARKSIDE
  "dax-j": { m: ["Techno", "Acid Techno", "Drum & Bass"], s: ["Jungle", "Detroit Techno", "Electro"], src: "last.fm+musicbrainz" }, // Dax J
  "digital-punk": { m: ["Hardstyle"], s: [], src: "research" }, // Digital Punk
  "digitalism": { m: ["EDM", "Techno", "House"], s: ["Electro House", "Electro", "French House"], src: "musicbrainz" }, // Digitalism
  "disclosure": { m: ["House", "Techno"], s: ["Breakbeat", "UK Garage", "Afro House"], src: "musicbrainz" }, // Disclosure
  "dixon": { m: ["House", "Techno"], s: ["Deep House", "Melodic House"], src: "research" }, // Dixon
  "dj-cringey": { m: ["Techno", "Acid Techno"], s: ["Hypertechno", "Hard House", "EBM"], src: "research" }, // DJ Cringey
  "duke-dumont": { m: ["House", "EDM"], s: ["Deep House", "Tech House"], src: "research" }, // Duke Dumont
  "dusky": { m: ["House"], s: ["Deep House"], src: "musicbrainz" }, // Dusky
  "dvs1": { m: ["Techno"], s: ["Minimal Techno", "Hardgroove"], src: "research" }, // DVS1
  "eats-everything": { m: ["House"], s: ["Tech House", "UK Garage"], src: "research" }, // Eats Everything
  "ellen-allien": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno"], src: "musicbrainz" }, // Ellen Allien
  "ely-oaks": { m: ["House", "EDM"], s: ["Tech House", "Dance-pop"], src: "research" }, // Ely Oaks
  "enzo-siragusa": { m: ["House"], s: ["Tech House"], src: "last.fm" }, // Enzo Siragusa
  "eric-prydz": { m: ["House", "EDM", "Trance"], s: ["Progressive House"], src: "last.fm" }, // Eric Prydz
  "eris-drew": { m: ["House"], s: ["Breakbeat", "Rave", "Acid House"], src: "research" }, // Eris Drew
  "erol-alkan": { m: ["House", "Techno"], s: ["Acid House", "Electro", "Indie Dance"], src: "research" }, // Erol Alkan
  "evil-activities": { m: ["Hardcore"], s: ["Gabber", "Mainstream Hardcore"], src: "research" }, // Evil Activities
  "faithless": { m: ["House", "Trance"], s: ["Trip-Hop"], src: "research" }, // Faithless
  "fakear": { m: ["Techno", "House"], s: ["Trip-Hop", "Deep House", "Downtempo"], src: "last.fm+musicbrainz" }, // Fakear
  "felix-jaehn": { m: ["House", "EDM"], s: ["Tropical House", "Dance-pop"], src: "research" }, // Felix Jaehn
  "felix-krocher": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Peak Time Techno"], src: "research" }, // Felix Kröcher
  "fisher": { m: ["House"], s: ["Tech House"], src: "research" }, // Fisher
  "fjaak": { m: ["Techno", "Acid Techno"], s: ["Breakbeat", "Electro"], src: "research" }, // FJAAK
  "four-tet": { m: ["Techno"], s: ["Downtempo", "IDM", "Microhouse"], src: "musicbrainz" }, // Four Tet
  "funk-tribu": { m: ["Hard Techno", "Techno"], s: ["Hard Trance", "Hardgroove"], src: "research" }, // Funk Tribu
  "groove-armada": { m: ["House"], s: ["Big Beat", "Downtempo", "Trip-Hop"], src: "research" }, // Groove Armada
  "hedex": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // Hedex
  "hilight-tribe": { m: ["Trance"], s: [], src: "musicbrainz" }, // Hilight Tribe
  "honey-dijon": { m: ["House"], s: ["Deep House", "Chicago House", "Classic House"], src: "last.fm+musicbrainz" }, // Honey Dijon
  "horse-meat-disco": { m: ["House"], s: ["Disco", "Nu-Disco"], src: "research" }, // Horse Meat Disco
  "i-hate-models": { m: ["Techno"], s: ["Industrial Techno", "Dark Techno", "Minimal Techno"], src: "last.fm+musicbrainz" }, // I Hate Models
  "il-est-vilaine": { m: ["Techno", "House"], s: ["EBM", "Electro"], src: "last.fm" }, // Il Est Vilaine
  "in-verruf": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno", "Hard Trance"], src: "research" }, // In Verruf
  "indira-paganotto": { m: ["Psytrance", "Techno", "Hard Techno"], s: ["Psy-Trance Techno"], src: "research" }, // Indira Paganotto
  "iosio": { m: ["Hard Techno", "Trance"], s: ["Bouncy Techno", "Hard Bounce"], src: "research" }, // IOSIO
  "james-hype": { m: ["House", "EDM"], s: ["Tech House", "Future House", "UK Garage"], src: "research" }, // James Hype
  "jamie-jones": { m: ["House"], s: ["Tech House", "Afro House", "Bassline"], src: "musicbrainz" }, // Jamie Jones
  "jayda-g": { m: ["House"], s: ["Deep House", "Disco"], src: "research" }, // Jayda G
  "jeff-mills": { m: ["Techno"], s: ["Detroit Techno", "Minimal Techno"], src: "last.fm+musicbrainz" }, // Jeff Mills
  "jonas-blue": { m: ["House", "EDM"], s: ["Tropical House"], src: "research" }, // Jonas Blue
  "joris-delacroix": { m: ["Techno", "Trance", "House"], s: ["Minimal Techno", "Deep House"], src: "last.fm" }, // Joris Delacroix
  "joris-voorn": { m: ["House", "Techno"], s: ["Detroit Techno", "Tech House"], src: "musicbrainz" }, // Joris Voorn
  "joseph-capriati": { m: ["Techno", "House"], s: [], src: "research" }, // Joseph Capriati
  "justin-jay": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Justin Jay
  "k-motionz": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // K Motionz
  "klangkuenstler": { m: ["Techno"], s: ["Dark Techno"], src: "musicbrainz" }, // Klangkuenstler
  "klofama": { m: ["Hard Techno"], s: ["Industrial Techno", "Rave"], src: "research" }, // KLOFAMA
  "kobosil": { m: ["Techno", "EDM"], s: ["Industrial Techno"], src: "musicbrainz" }, // Kobosil
  "korolova": { m: ["Techno", "House"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Korolova
  "krowdexx": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Uptempo"], src: "research" }, // Krowdexx
  "kuko": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Kuko
  "la-p-tite-fumee": { m: ["Psytrance", "Trance"], s: ["Organic Trance", "Tribal"], src: "research" }, // La P'tite Fumée
  "lane-8": { m: ["House", "EDM"], s: ["Deep House", "Disco", "Melodic House"], src: "musicbrainz" }, // Lane 8
  "lekkerfaces": { m: ["Hardcore"], s: ["Uptempo", "Speedcore"], src: "research" }, // Lekkerfaces
  "len-faki": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "last.fm" }, // Len Faki
  "luciid": { m: ["Hard Techno", "Techno"], s: ["Dark Techno"], src: "research" }, // Luciid
  "mall-grab": { m: ["House", "Techno"], s: ["Lo-Fi House", "Breakbeat"], src: "research" }, // Mall Grab
  "marc-acardipane": { m: ["Hardcore", "Hard Techno"], s: ["Gabber", "Doomcore"], src: "research" }, // Marc Acardipane
  "marcel-dettmann": { m: ["Techno"], s: ["Minimal Techno"], src: "musicbrainz" }, // Marcel Dettmann
  "marco-carola": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Marco Carola
  "martin-garrix": { m: ["EDM", "House"], s: ["Electropop", "Electro House", "Progressive House"], src: "last.fm" }, // Martin Garrix
  "masters-at-work": { m: ["House"], s: ["Garage House", "Deep House"], src: "research" }, // Masters at Work
  "mathame": { m: ["Techno"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Mathame
  "max-cooper": { m: ["Techno"], s: ["Ambient", "Electronica"], src: "musicbrainz" }, // Max Cooper
  "me": { m: ["House", "Techno"], s: ["Melodic House", "Deep House"], src: "research" }, // &ME
  "medusa": { m: ["Hard Techno", "Trance", "Acid Techno"], s: ["Schranz", "Uptempo"], src: "research" }, // Medusa
  "mika-heggemann": { m: ["Trance", "Hard Techno"], s: ["Nu Trance", "Hard House"], src: "research" }, // Mika Heggemann
  "miss-monique": { m: ["House", "Techno", "Trance"], s: ["Progressive House", "Melodic Techno", "Melodic House"], src: "musicbrainz" }, // Miss Monique
  "monolink": { m: ["House", "Techno"], s: ["Melodic House", "Progressive House", "Downtempo"], src: "research" }, // Monolink
  "moodymann": { m: ["House", "Techno"], s: ["Deep House", "Detroit Techno"], src: "last.fm" }, // Moodymann
  "neophyte": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Neophyte
  "nia-archives": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Nia Archives
  "nico-moreno": { m: ["Techno"], s: ["Industrial Techno"], src: "musicbrainz" }, // Nico Moreno
  "nicole-moudaber": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Nicole Moudaber
  "nina-kraviz": { m: ["Techno", "House"], s: ["Deep House", "IDM", "Dubstep"], src: "last.fm" }, // Nina Kraviz
  "nto": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz" }, // NTO
  "overmono": { m: ["Techno"], s: ["Ambient", "Breakbeat", "UK Garage"], src: "last.fm+musicbrainz" }, // Overmono
  "paco-osuna": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Paco Osuna
  "palms-trax": { m: ["House"], s: ["Deep House", "Disco", "Nu-Disco"], src: "research" }, // Palms Trax
  "paul-elstak": { m: ["Hardcore"], s: ["Gabber", "Happy Hardcore", "Rave"], src: "last.fm" }, // Paul Elstak
  "paul-kalkbrenner": { m: ["Techno"], s: ["Minimal Techno", "Electronica", "Electro"], src: "last.fm+musicbrainz" }, // Paul Kalkbrenner
  "pawsa": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Pawsa
  "peggy-gou": { m: ["House", "Techno"], s: ["Deep House"], src: "last.fm" }, // Peggy Gou
  "pendulum": { m: ["Drum & Bass"], s: ["Dancefloor Drum & Bass", "Electronic Rock"], src: "research" }, // Pendulum
  "prospa": { m: ["Techno", "House", "EDM"], s: ["Rave", "Breakbeat"], src: "last.fm" }, // Prospa
  "purple-disco-machine": { m: ["House"], s: ["Nu-Disco", "Disco"], src: "research" }, // Purple Disco Machine
  "r-dhad": { m: ["Techno"], s: ["Dub Techno", "Minimal Techno", "Industrial Techno"], src: "research" }, // Rødhåd
  "rebelion": { m: ["Hardstyle"], s: [], src: "research" }, // Rebelion
  "restricted": { m: ["Techno", "Hardcore"], s: ["Electronica", "Industrial"], src: "last.fm" }, // Restricted
  "rey-colino": { m: ["House", "Techno", "Acid Techno"], s: ["Progressive House", "Electro"], src: "research" }, // Rey Colino
  "ricardo-villalobos": { m: ["Techno", "House"], s: ["Minimal Techno", "Microhouse"], src: "research" }, // Ricardo Villalobos
  "richie-hawtin": { m: ["Techno"], s: ["Minimal Techno"], src: "last.fm+musicbrainz" }, // Richie Hawtin
  "robot-rock-alive": { m: ["House", "EDM"], s: ["French Touch", "Electro"], src: "research" }, // Robot Rock Alive
  "royksopp": { m: ["House"], s: ["Ambient", "Synth-Pop", "Downtempo"], src: "research" }, // Röyksopp
  "s-p-y": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk", "Jungle"], src: "research" }, // S.P.Y
  "sammy-virji": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Sammy Virji
  "sara-landry": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "Minimal Techno"], src: "last.fm+musicbrainz" }, // Sara Landry
  "scientyfreaks": { m: ["Psytrance", "Techno"], s: ["Progressive Trance", "Breakbeat"], src: "research" }, // Scientyfreaks
  "seth-troxler": { m: ["Techno", "House"], s: ["Minimal Techno", "Detroit Techno", "Tech House"], src: "last.fm+musicbrainz" }, // Seth Troxler
  "shanti-celeste": { m: ["House", "Techno"], s: ["Electro", "Ambient", "Deep House"], src: "research" }, // Shanti Celeste
  "skepta": { m: ["House"], s: ["Tech House", "Grime"], src: "research" }, // Skepta
  "solomun": { m: ["House", "Techno"], s: ["Deep House", "Minimal Techno", "Tech House"], src: "last.fm+musicbrainz" }, // Solomun
  "speedy-j": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno", "Industrial Techno"], src: "research" }, // Speedy J
  "spoink": { m: ["Techno", "Drum & Bass", "Acid Techno"], s: ["Dubstep"], src: "research" }, // Spoink
  "stephan-bodzin": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Stephan Bodzin
  "sub-zero-project": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Sub Zero Project
  "sven-vath": { m: ["Techno", "Trance"], s: [], src: "musicbrainz" }, // Sven Väth
  "teho": { m: ["Techno", "House"], s: ["Downtempo", "Minimal Techno", "Deep House"], src: "last.fm" }, // Teho
  "the-blaze": { m: ["House"], s: ["French House", "Electro"], src: "research" }, // The Blaze
  "the-chainsmokers": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // The Chainsmokers
  "the-prodigy": { m: ["EDM", "Hardcore"], s: ["Big Beat", "Breakbeat", "Rave"], src: "research" }, // The Prodigy
  "tiesto": { m: ["Trance", "Techno", "EDM"], s: ["Electronica", "Progressive Trance", "Vocal Trance"], src: "last.fm" }, // Tiësto
  "trym": { m: ["Trance", "Techno", "Acid Techno"], s: ["Tech Trance"], src: "last.fm" }, // Trym
  "ueberrest": { m: ["Hard Techno", "Techno"], s: ["Hard Bounce", "Industrial Techno"], src: "research" }, // Ueberrest
  "vladimir-cauchemar": { m: ["Techno", "House"], s: ["Electro", "French House"], src: "last.fm" }, // Vladimir Cauchemar
  "warface": { m: ["Hardstyle"], s: ["Rawstyle"], src: "last.fm+musicbrainz" }, // Warface
  "wilkinson": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Wilkinson
  "yves-deruyter": { m: ["Trance", "Techno", "Acid Techno"], s: ["Hard Trance"], src: "research" }, // Yves Deruyter
  "zelecter": { m: ["Hardstyle"], s: ["Hardstyle Classics", "Rawstyle"], src: "research" }, // Zelecter
};
/* STYLES:end */

export const styleFor = (slug: string): ArtistStyle | undefined => ARTIST_STYLES[slug];
