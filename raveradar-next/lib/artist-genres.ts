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
  "1200-micrograms": { m: ["Psytrance"], s: [], src: "wikidata" }, // 1200 Micrograms
  "2hot2play": { m: ["Hard Techno", "Techno", "Trance"], s: ["Hard House"], src: "research" }, // 2HOT2PLAY
  "2manydjs": { m: ["House", "Techno"], s: ["Breakbeat", "Disco"], src: "research" }, // 2ManyDJs
  "808-state": { m: ["Techno", "House"], s: ["Acid House", "Breakbeat"], src: "research" }, // 808 State
  "999999999": { m: ["Acid Techno", "Techno"], s: [], src: "discogs+last.fm" }, // 999999999
  "a-guy-called-gerald": { m: ["House", "Drum & Bass"], s: ["Acid House", "Jungle"], src: "research" }, // A Guy Called Gerald
  "a-m-c": { m: ["Drum & Bass"], s: ["Neurofunk", "Jump Up"], src: "research" }, // A.M.C
  "aat": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // AAT
  "above-beyond": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Above & Beyond
  "acid-arab": { m: ["House", "Techno"], s: ["Acid House"], src: "discogs+last.fm+wikidata" }, // Acid Arab
  "acid-pauli": { m: ["House", "Techno"], s: ["Downtempo", "Minimal Techno", "Deep House"], src: "research" }, // Acid Pauli
  "act-of-rage": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Act of Rage
  "adam-beyer": { m: ["Techno"], s: ["Minimal Techno", "Tech House", "Breakbeat"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Adam Beyer
  "adam-ten": { m: ["House", "Techno"], s: ["Melodic House", "Indie Dance"], src: "research" }, // Adam Ten
  "adaro": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Adaro
  "adjuzt": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Adjuzt
  "adrenalize": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Adrenalize
  "adrian-mills": { m: ["Hard Techno", "Trance"], s: ["Makina", "Hard Bounce"], src: "research" }, // Adrián Mills
  "adriatique": { m: ["House", "Techno"], s: ["Progressive House", "Tech House", "Deep House"], src: "discogs" }, // Adriatique
  "afem-syko": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Bouncy Techno"], src: "research" }, // Afem Syko
  "agents-of-time": { m: ["Techno", "House", "Acid Techno"], s: ["Melodic Techno"], src: "research" }, // Agents Of Time
  "alarico": { m: ["Techno"], s: ["Hardgroove", "Industrial Techno"], src: "research" }, // Alarico
  "alignment": { m: ["Techno"], s: ["Dark Techno", "Rave"], src: "discogs+musicbrainz" }, // Alignment
  "alix-perez": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Halftime", "Dubstep"], src: "research" }, // Alix Perez
  "alok": { m: ["EDM", "House"], s: ["Bass House", "Deep House", "Brazilian Bass"], src: "research" }, // Alok
  "alycia-bezgo": { m: ["Techno", "Hard Techno", "Trance"], s: ["Hardgroove"], src: "research" }, // Alycia Bezgo
  "amber-broos": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Amber Broos
  "ame": { m: ["House", "Techno"], s: ["Deep House", "Melodic House", "Melodic Techno"], src: "research" }, // Âme
  "amelie-lens": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Amelie Lens
  "amor": { m: ["House"], s: ["Afro House", "Tech House"], src: "research" }, // Amor
  "andhim": { m: ["House"], s: ["Tech House"], src: "research" }, // Andhim
  "andy-c": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Andy C
  "andy-stott": { m: ["Techno"], s: [], src: "wikidata" }, // Andy Stott
  "anetha": { m: ["Techno", "House"], s: ["Electronica", "Disco", "Industrial Techno"], src: "discogs+last.fm+musicbrainz" }, // Anetha
  "angerfist": { m: ["Hardcore"], s: ["Gabber", "Darkcore"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Angerfist
  "anika-kunst": { m: ["Techno", "House"], s: ["Peak Time Techno"], src: "research" }, // Anika Kunst
  "anime": { m: ["Hardcore", "Hardstyle"], s: ["Gabber", "Uptempo"], src: "research" }, // AniMe
  "anthony-rother": { m: ["Techno"], s: ["Electro", "Ambient"], src: "research" }, // Anthony Rother
  "anyma": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House", "Progressive House"], src: "research" }, // Anyma
  "aphex-twin": { m: ["Techno", "Acid Techno"], s: ["Ambient Techno"], src: "wikidata" }, // Aphex Twin
  "apparat": { m: ["Techno"], s: ["Ambient", "IDM", "Downtempo"], src: "research" }, // Apparat
  "argy": { m: ["House", "Techno"], s: ["Tech House", "Melodic Techno"], src: "research" }, // Argy
  "armand-van-helden": { m: ["House"], s: ["Speed Garage", "Nu-Disco", "Big Beat"], src: "research" }, // Armand van Helden
  "armin-van-buuren": { m: ["Trance"], s: ["Progressive Trance", "Vocal Trance", "Uplifting Trance"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Armin van Buuren
  "art-of-fighters": { m: ["Hardcore"], s: ["Gabber"], src: "wikidata" }, // Art of Fighters
  "artbat": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House"], src: "research" }, // ARTBAT
  "astral-projection": { m: ["Psytrance"], s: [], src: "wikidata" }, // Astral Projection
  "atmozfears": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Atmozfears
  "audrey-danza": { m: ["Techno", "Trance"], s: ["Industrial Techno", "Progressive Trance"], src: "research" }, // Audrey Danza
  "autechre": { m: ["Techno"], s: ["Experimental", "IDM", "Ambient Techno"], src: "discogs+musicbrainz" }, // Autechre
  "axwell": { m: ["House", "EDM"], s: ["Progressive House"], src: "research" }, // Axwell
  "ayla": { m: ["Trance"], s: [], src: "wikidata" }, // Ayla
  "azyr": { m: ["Hard Techno", "Techno"], s: ["Hard Dance"], src: "research" }, // Azyr
  "b-ery": { m: ["Hard Techno"], s: ["Industrial Techno", "Bochka"], src: "research" }, // BØĘRY
  "b-front": { m: ["Hardstyle"], s: [], src: "wikidata" }, // B-Front
  "beau-didier": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Beau Didier
  "bedouin": { m: ["House"], s: ["Melodic House", "Deep House", "Organic House"], src: "research" }, // Bedouin
  "bella-claxton": { m: ["House", "Trance"], s: ["Hard House", "Progressive House"], src: "research" }, // Bella Claxton
  "bellaire": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Bellaire
  "ben-hemsley": { m: ["House", "Trance"], s: ["Rave", "Happy Hardcore", "Progressive House"], src: "research" }, // Ben Hemsley
  "ben-klock": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+musicbrainz" }, // Ben Klock
  "ben-sims": { m: ["Techno"], s: ["Minimal Techno", "Tribal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Ben Sims
  "ben-ufo": { m: ["Techno", "House"], s: ["UK Garage", "Dubstep"], src: "research" }, // Ben UFO
  "benga": { m: ["Drum & Bass"], s: ["Dubstep", "UK Garage"], src: "research" }, // Benga
  "benny-benassi": { m: ["House", "EDM"], s: ["Electro House", "Progressive House", "Tech House"], src: "wikidata" }, // Benny Benassi
  "benny-rodrigues": { m: ["Techno", "House"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Benny Rodrigues
  "black-coffee": { m: ["House"], s: ["Afro House", "Deep House"], src: "research" }, // Black Coffee
  "black-sun-empire": { m: ["Drum & Bass"], s: ["Dubstep", "Neurofunk"], src: "wikidata" }, // Black Sun Empire
  "blasterjaxx": { m: ["EDM", "House"], s: ["Big Room", "Electro House"], src: "research" }, // Blasterjaxx
  "blastoyz": { m: ["Psytrance", "Trance"], s: ["Full-On", "Progressive Trance"], src: "research" }, // Blastoyz
  "blawan": { m: ["Techno"], s: ["Industrial Techno"], src: "research" }, // Blawan
  "blond-ish": { m: ["House", "Techno"], s: ["Melodic House", "Afro House", "Organic House"], src: "research" }, // Blond:ish
  "bob-sinclar": { m: ["House", "EDM"], s: ["Electro House", "French House", "Hip House"], src: "discogs+last.fm+musicbrainz" }, // Bob Sinclar
  "boris-brejcha": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Boris Brejcha
  "bou": { m: ["Drum & Bass"], s: ["Jump-Up"], src: "research" }, // Bou
  "boys-noize": { m: ["Techno", "House", "Acid Techno"], s: ["Electro"], src: "research" }, // Boys Noize
  "bredren": { m: ["Drum & Bass"], s: [], src: "research" }, // Bredren
  "brennan-heart": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Brennan Heart
  "broiler": { m: ["EDM", "House"], s: ["Electro House", "Progressive House"], src: "wikidata" }, // Broiler
  "bt": { m: ["Techno", "House", "Trance"], s: ["Breakbeat", "Electronica", "Progressive House"], src: "wikidata" }, // BT
  "buraka-som-sistema": { m: ["Techno"], s: ["Breakbeat"], src: "wikidata" }, // Buraka Som Sistema
  "busy-p": { m: ["House"], s: ["Electro", "French House"], src: "research" }, // Busy P
  "call-super": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno", "Ambient"], src: "research" }, // Call Super
  "calvin-harris": { m: ["House", "EDM"], s: ["Nu-Disco", "Disco", "Electro House"], src: "discogs+last.fm+musicbrainz" }, // Calvin Harris
  "camelphat": { m: ["House"], s: ["Tech House", "Melodic House"], src: "research" }, // CamelPhat
  "cara-elizabeth": { m: ["Hard Techno", "Trance"], s: ["Hard Trance"], src: "research" }, // Cara Elizabeth
  "carista": { m: ["Techno", "House"], s: ["Breakbeat", "Ambient", "Downtempo"], src: "discogs" }, // Carista
  "carl-cox": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Carl Cox
  "carl-craig": { m: ["Techno", "House"], s: ["Detroit Techno"], src: "research" }, // Carl Craig
  "carlita": { m: ["House", "Techno"], s: [], src: "research" }, // Carlita
  "cassius": { m: ["House"], s: ["French House", "Disco"], src: "research" }, // Cassius
  "cedex-higher-underground": { m: ["Drum & Bass"], s: [], src: "research" }, // Cedex & Higher Underground
  "cedric": { m: ["Techno", "House"], s: ["Melodic House", "Afro House"], src: "research" }, // Cédric
  "charlotte-de-witte": { m: ["Techno"], s: ["Minimal Techno", "Peak Time Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Charlotte de Witte
  "chase-status": { m: ["Drum & Bass"], s: ["Breakbeat", "Dubstep", "Grime"], src: "wikidata" }, // Chase & Status
  "chicane": { m: ["Trance", "House"], s: ["Ambient", "Downtempo"], src: "research" }, // Chicane
  "chlar": { m: ["Techno"], s: ["Minimal Techno", "Tech Trance"], src: "discogs+musicbrainz" }, // Chlär
  "chloe-caillet": { m: ["House"], s: ["Bassline", "Breakbeat", "Deep House"], src: "discogs+musicbrainz" }, // Chloé Caillet
  "chris-liebing": { m: ["Techno", "Hard Techno"], s: ["Schranz", "Minimal Techno", "Tech House"], src: "research" }, // Chris Liebing
  "chris-stussy": { m: ["House"], s: ["Deep House"], src: "discogs+last.fm" }, // Chris Stussy
  "christian-loffler": { m: ["House", "Techno"], s: ["Deep House", "Ambient", "Downtempo"], src: "research" }, // Christian Löffler
  "cinthie": { m: ["House", "Techno"], s: ["Deep House", "UK Garage"], src: "research" }, // Cinthie
  "cobrah": { m: ["EDM", "House"], s: ["Electropop", "Hip House"], src: "wikidata" }, // Cobrah
  "code-black": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Code Black
  "complex": { m: ["Hardstyle"], s: [], src: "research" }, // Complex
  "coone": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "research" }, // Coone
  "cosmic-gate": { m: ["Trance"], s: [], src: "research" }, // Cosmic Gate
  "crazy-p": { m: ["House", "Techno"], s: ["Deep House", "Disco", "Downtempo"], src: "wikidata" }, // Crazy P
  "creeds": { m: ["Hardcore", "Techno", "Hardstyle"], s: ["Electro", "Frenchcore"], src: "discogs+wikidata" }, // Creeds
  "current-value": { m: ["Drum & Bass"], s: ["Darkstep"], src: "wikidata" }, // Current Value
  "cynthia-spiering": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Hardgroove"], src: "research" }, // Cynthia Spiering
  "d-block-s-te-fan": { m: ["Hardstyle", "EDM"], s: ["Electro House", "Happy Hardcore"], src: "discogs+musicbrainz" }, // D-Block & S-te-Fan
  "d-tiffany": { m: ["Techno"], s: [], src: "wikidata" }, // D. Tiffany
  "da-tweekaz": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Da Tweekaz
  "damian-lazarus": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Melodic House"], src: "research" }, // Damian Lazarus
  "damien-rk": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Frenchcore", "Hard Trance"], src: "research" }, // Damien RK
  "dan-shake": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Dan Shake
  "daniel-avery": { m: ["Techno", "Acid Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Daniel Avery
  "danth": { m: ["House", "EDM", "Hardstyle"], s: ["Future House", "Big Room"], src: "research" }, // Danth
  "darin-epsilon": { m: ["Techno"], s: [], src: "wikidata" }, // Darin Epsilon
  "darkside": { m: ["House"], s: ["Downtempo", "Left-field House", "Neo-psychedelia"], src: "research" }, // DARKSIDE
  "darrell-pulse": { m: ["Techno"], s: [], src: "research" }, // Darrell Pulse
  "darren-emerson": { m: ["Techno"], s: [], src: "wikidata" }, // Darren Emerson
  "darude": { m: ["Trance"], s: ["Hard Trance"], src: "wikidata" }, // Darude
  "dave-clarke": { m: ["Techno"], s: ["Electro"], src: "research" }, // Dave Clarke
  "david-guetta": { m: ["EDM", "House"], s: ["Electro House", "Progressive House"], src: "research" }, // David Guetta
  "david-morales": { m: ["House"], s: ["Nu-Disco"], src: "wikidata" }, // David Morales
  "davyboi": { m: ["Trance"], s: ["Hard Dance", "Eurodance"], src: "research" }, // Davyboi
  "dax-j": { m: ["Techno", "Acid Techno", "Drum & Bass"], s: ["Jungle", "Detroit Techno", "Electro"], src: "discogs+last.fm+musicbrainz" }, // Dax J
  "deborah-de-luca": { m: ["Techno", "EDM"], s: ["Peak Time Techno"], src: "musicbrainz" }, // Deborah De Luca
  "dennis-cruz": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "research" }, // Dennis Cruz
  "dennis-ferrer": { m: ["House"], s: ["Deep House"], src: "wikidata" }, // Dennis Ferrer
  "digital-punk": { m: ["Hardstyle"], s: [], src: "research" }, // Digital Punk
  "digitalism": { m: ["House", "Techno"], s: ["Electro", "Electro House", "Electroclash"], src: "research" }, // Digitalism
  "dillinja": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Dillinja
  "disclosure": { m: ["House"], s: ["UK Garage", "Breakbeat", "Deep House"], src: "discogs+musicbrainz" }, // Disclosure
  "dixon": { m: ["House", "Techno"], s: ["Deep House", "Melodic House"], src: "research" }, // Dixon
  "dj-aligator": { m: ["EDM"], s: ["Eurodance", "Electro House"], src: "research" }, // DJ Aligator
  "dj-bone": { m: ["Techno"], s: ["Detroit Techno"], src: "wikidata" }, // DJ Bone
  "dj-cringey": { m: ["Techno", "Acid Techno"], s: ["Hypertechno", "Hard House", "EBM"], src: "research" }, // DJ Cringey
  "dj-f-r-a-n-k": { m: ["House", "EDM"], s: ["Disco House", "Jumpstyle"], src: "research" }, // DJ F.R.A.N.K.
  "dj-hell": { m: ["Techno"], s: [], src: "wikidata" }, // DJ Hell
  "dj-hype": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // DJ Hype
  "dj-isaac": { m: ["Hardstyle", "Hardcore"], s: ["Gabber"], src: "research" }, // DJ Isaac
  "dj-quicksilver": { m: ["Techno", "Trance"], s: [], src: "wikidata" }, // DJ Quicksilver
  "dj-tennis": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // DJ Tennis
  "dj-zinc": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // DJ Zinc
  "djerry-c": { m: ["Techno", "House"], s: [], src: "research" }, // Djerry C
  "dom-dolla": { m: ["House"], s: ["Tech House", "Progressive House"], src: "research" }, // Dom Dolla
  "donato-dozzy": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // Donato Dozzy
  "dopplereffekt": { m: ["Techno"], s: [], src: "wikidata" }, // Dopplereffekt
  "dr-peacock": { m: ["Hardcore"], s: ["Frenchcore"], src: "discogs+musicbrainz+wikidata" }, // Dr. Peacock
  "dual-damage": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "discogs" }, // Dual Damage
  "duke-dumont": { m: ["House", "EDM"], s: ["Deep House", "Tech House"], src: "research" }, // Duke Dumont
  "dusky": { m: ["House", "Techno"], s: ["Deep House", "Tech House", "Breakbeat"], src: "research" }, // Dusky
  "dvs1": { m: ["Techno"], s: ["Minimal Techno", "Hardgroove"], src: "research" }, // DVS1
  "dyen": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno"], src: "musicbrainz" }, // DYEN
  "east-end-dubs": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "research" }, // East End Dubs
  "eats-everything": { m: ["House"], s: ["Tech House", "UK Garage"], src: "research" }, // Eats Everything
  "ellen-allien": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+musicbrainz+wikidata" }, // Ellen Allien
  "ely-oaks": { m: ["House", "EDM"], s: ["Tech House", "Dance-pop"], src: "research" }, // Ely Oaks
  "emilija": { m: ["Techno", "Acid Techno"], s: ["Hard House", "Eurodance"], src: "research" }, // Emilija
  "enrico-sangiuliano": { m: ["Techno"], s: ["Experimental", "Ambient", "Breakbeat"], src: "discogs+musicbrainz" }, // Enrico Sangiuliano
  "enzo-siragusa": { m: ["House"], s: ["Tech House"], src: "discogs+last.fm" }, // Enzo Siragusa
  "eric-prydz": { m: ["House"], s: ["Progressive House", "Tech House"], src: "discogs+last.fm+wikidata" }, // Eric Prydz
  "eris-drew": { m: ["House"], s: ["Breakbeat", "Rave", "Acid House"], src: "research" }, // Eris Drew
  "erol-alkan": { m: ["House", "Techno"], s: ["Acid House", "Electro", "Indie Dance"], src: "research" }, // Erol Alkan
  "etienne-de-crecy": { m: ["House"], s: ["French House", "Electro House"], src: "research" }, // Etienne de Crécy
  "evil-activities": { m: ["Hardcore"], s: ["Gabber", "Mainstream Hardcore"], src: "research" }, // Evil Activities
  "fadi-mohem": { m: ["Techno"], s: ["Dub Techno"], src: "research" }, // Fadi Mohem
  "faithless": { m: ["House", "Trance"], s: ["Trip-Hop"], src: "research" }, // Faithless
  "fakear": { m: ["EDM"], s: ["Downtempo", "Trip-Hop"], src: "research" }, // Fakear
  "fantasm": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno"], src: "wikidata" }, // Fantasm
  "fatboy-slim": { m: ["Techno"], s: [], src: "wikidata" }, // Fatboy Slim
  "fatima-hajji": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "research" }, // Fatima Hajji
  "felix-jaehn": { m: ["House", "EDM"], s: ["Tropical House", "Dance-pop"], src: "research" }, // Felix Jaehn
  "felix-krocher": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Peak Time Techno"], src: "research" }, // Felix Kröcher
  "fisher": { m: ["House"], s: ["Tech House"], src: "research" }, // Fisher
  "fjaak": { m: ["Techno", "Acid Techno"], s: ["Breakbeat", "Electro"], src: "research" }, // FJAAK
  "floating-points": { m: ["House"], s: ["Dubstep", "Microhouse", "Progressive House"], src: "discogs+musicbrainz" }, // Floating Points
  "folamour": { m: ["House"], s: ["Deep House", "Disco", "Nu-Disco"], src: "discogs" }, // Folamour
  "four-tet": { m: ["Techno"], s: ["Electronica", "Downtempo", "IDM"], src: "discogs+musicbrainz+wikidata" }, // Four Tet
  "fox-stevenson": { m: ["Drum & Bass"], s: ["Dubstep", "Melodic Dubstep"], src: "research" }, // Fox Stevenson
  "franky-rizardo": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Franky Rizardo
  "fred-v": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Fred V
  "freddy-k": { m: ["Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Freddy K
  "funk-tribu": { m: ["Hard Techno", "Techno"], s: ["Hard Trance", "Hardgroove"], src: "research" }, // Funk Tribu
  "furyan": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Furyan
  "g-ha-olanskii": { m: ["House", "Techno"], s: ["Disco"], src: "research" }, // g-HA & Olanskii
  "gabry-ponte": { m: ["EDM", "House"], s: ["Eurodance", "Italo Dance"], src: "research" }, // Gabry Ponte
  "gerd-janson": { m: ["House", "Techno"], s: ["Disco"], src: "research" }, // Gerd Janson
  "giuseppe-ottaviani": { m: ["Trance"], s: ["Progressive Trance", "Tech Trance", "Uplifting Trance"], src: "wikidata" }, // Giuseppe Ottaviani
  "gms": { m: ["Psytrance"], s: [], src: "wikidata" }, // GMS
  "goldie": { m: ["Techno", "Drum & Bass"], s: ["Downtempo", "Electronica"], src: "musicbrainz" }, // Goldie
  "gpf": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo"], src: "research" }, // GPF
  "groove-armada": { m: ["House"], s: ["Big Beat", "Downtempo", "Trip-Hop"], src: "research" }, // Groove Armada
  "gui-boratto": { m: ["Techno"], s: ["Minimal Techno"], src: "wikidata" }, // Gui Boratto
  "gusgus": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // GusGus
  "guy-gerber": { m: ["Techno"], s: [], src: "wikidata" }, // Guy Gerber
  "habstrakt": { m: ["Drum & Bass", "House"], s: ["Bass House", "Dubstep"], src: "wikidata" }, // Habstrakt
  "hannah-laing": { m: ["Techno", "House", "Trance"], s: ["Hard House"], src: "wikidata" }, // Hannah Laing
  "hardwell": { m: ["EDM", "House"], s: ["Big Room", "Progressive House", "Electro House"], src: "research" }, // Hardwell
  "hbz": { m: ["Hardstyle", "Psytrance"], s: [], src: "wikidata" }, // HBz
  "hector-oaks": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Héctor Oaks
  "hedex": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // Hedex
  "helena-hauff": { m: ["Techno", "Hardcore", "House"], s: ["Ambient"], src: "musicbrainz" }, // Helena Hauff
  "hercules-love-affair": { m: ["House"], s: ["Disco"], src: "wikidata" }, // Hercules & Love Affair
  "hilight-tribe": { m: ["Trance"], s: ["Goa Trance"], src: "discogs+musicbrainz" }, // Hilight Tribe
  "honey-dijon": { m: ["House"], s: ["Deep House", "Chicago House", "Classic House"], src: "discogs+last.fm+musicbrainz" }, // Honey Dijon
  "hooja": { m: ["EDM"], s: ["Electro House"], src: "wikidata" }, // Hooja
  "horse-meat-disco": { m: ["House"], s: ["Disco", "Nu-Disco"], src: "research" }, // Horse Meat Disco
  "horsegiirl": { m: ["Hardcore"], s: ["Happy Hardcore", "UK Hardcore"], src: "research" }, // horsegiirL
  "hysta": { m: ["Hardcore"], s: ["Frenchcore", "Gabber", "Uptempo"], src: "musicbrainz" }, // Hysta
  "i-hate-models": { m: ["Techno"], s: ["Industrial Techno", "Dark Techno", "EBM"], src: "discogs+last.fm+musicbrainz+wikidata" }, // I Hate Models
  "il-est-vilaine": { m: ["Techno", "House"], s: ["EBM", "Electro"], src: "last.fm" }, // Il Est Vilaine
  "ilario-alicante": { m: ["Techno", "House"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Ilario Alicante
  "in-verruf": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno", "Hard Trance"], src: "research" }, // In Verruf
  "indira-paganotto": { m: ["Psytrance", "Techno", "Hard Techno"], s: ["Psy-Trance Techno"], src: "research" }, // Indira Paganotto
  "iosio": { m: ["Hard Techno", "Trance"], s: ["Bouncy Techno", "Hard Bounce"], src: "research" }, // IOSIO
  "isabel-soto": { m: ["Techno"], s: ["Ambient", "Industrial Techno"], src: "research" }, // Isabel Soto
  "james-blake": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // James Blake
  "james-holden": { m: ["Techno"], s: [], src: "wikidata" }, // James Holden
  "james-hype": { m: ["House", "EDM"], s: ["Tech House", "Future House"], src: "research" }, // James Hype
  "jamie-jones": { m: ["House"], s: ["Tech House", "Deep House", "Disco"], src: "discogs+musicbrainz" }, // Jamie Jones
  "jasmine-not-jafar": { m: ["Techno"], s: ["Electro"], src: "research" }, // Jasmine Not Jafar
  "jayda-g": { m: ["House"], s: ["Deep House", "Disco"], src: "research" }, // Jayda G
  "jeff-mills": { m: ["Techno"], s: ["Detroit Techno", "Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Jeff Mills
  "joachim-garraud": { m: ["EDM"], s: ["Electro House"], src: "wikidata" }, // Joachim Garraud
  "joachim-pastor": { m: ["House"], s: ["Deep House", "Tech House", "Progressive House"], src: "discogs" }, // Joachim Pastor
  "joakim-lundell": { m: ["EDM"], s: ["Dance Pop"], src: "research" }, // Joakim Lundell
  "johannes-schuster": { m: ["Hard Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Johannes Schuster
  "john-digweed": { m: ["House", "Techno"], s: ["Progressive House", "Progressive Trance"], src: "research" }, // John Digweed
  "john-summit": { m: ["House", "EDM"], s: ["Tech House", "Progressive House"], src: "research" }, // John Summit
  "jonas-blue": { m: ["House", "EDM"], s: ["Tropical House"], src: "research" }, // Jonas Blue
  "joris-delacroix": { m: ["Techno", "House", "Trance"], s: ["Minimal Techno", "Progressive House", "Deep House"], src: "discogs+last.fm" }, // Joris Delacroix
  "joris-voorn": { m: ["House", "Techno"], s: ["Tech House", "Detroit Techno"], src: "discogs+musicbrainz+wikidata" }, // Joris Voorn
  "joseph-capriati": { m: ["Techno", "House"], s: [], src: "research" }, // Joseph Capriati
  "joss-dean": { m: ["House"], s: ["Deep House", "Tech House", "Minimal House"], src: "research" }, // Joss Dean
  "joy-orbison": { m: ["Drum & Bass", "House"], s: ["Dubstep", "UK Garage", "Jungle"], src: "musicbrainz+wikidata" }, // Joy Orbison
  "justin-jay": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Justin Jay
  "k-motionz": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // K Motionz
  "kamafaka": { m: ["Hard Techno", "Hardcore"], s: ["Industrial Techno", "Frenchcore"], src: "research" }, // Kamafaka
  "kangding-ray": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Kangding Ray
  "karah": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // KARAH
  "kasparov": { m: ["Hardcore"], s: ["Gabber"], src: "wikidata" }, // Kasparov
  "kettama": { m: ["House", "Techno", "Trance"], s: ["Tech Trance", "UK Garage", "Breakbeat"], src: "discogs" }, // Kettama
  "ki-ki": { m: ["Techno", "Trance"], s: ["Electro"], src: "wikidata" }, // KI/KI
  "klangkuenstler": { m: ["Techno"], s: ["Dark Techno", "Tech House"], src: "discogs+musicbrainz+wikidata" }, // Klangkuenstler
  "klingande": { m: ["House"], s: ["Deep House"], src: "wikidata" }, // Klingande
  "klofama": { m: ["Hard Techno"], s: ["Industrial Techno", "Rave"], src: "research" }, // KLOFAMA
  "kloud": { m: ["Techno", "House"], s: ["Electro"], src: "research" }, // Kloud
  "kobosil": { m: ["Techno"], s: ["Industrial Techno"], src: "discogs+musicbrainz" }, // Kobosil
  "kode9": { m: ["Drum & Bass"], s: ["Dubstep", "Future Garage", "UK Bass"], src: "research" }, // Kode9
  "kolter": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Kolter
  "korolova": { m: ["Techno", "House"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Korolova
  "kosheen": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Kosheen
  "krowdexx": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Uptempo"], src: "research" }, // Krowdexx
  "kruelty": { m: ["Hard Techno", "Hardstyle"], s: ["Industrial Hardcore"], src: "research" }, // KRUELTY
  "kuko": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Kuko
  "la-p-tite-fumee": { m: ["Psytrance", "Trance"], s: ["Organic Trance", "Tribal"], src: "research" }, // La P'tite Fumée
  "lady-waks": { m: ["Techno"], s: ["Breakbeat"], src: "wikidata" }, // Lady Waks
  "lane-8": { m: ["House"], s: ["Melodic House", "Progressive House", "Deep House"], src: "research" }, // Lane 8
  "laurent-garnier": { m: ["Techno", "House", "Acid Techno"], s: [], src: "research" }, // Laurent Garnier
  "laurent-wolf": { m: ["EDM", "House"], s: ["Electro House", "French House"], src: "wikidata" }, // Laurent Wolf
  "lekkerfaces": { m: ["Hardcore"], s: ["Uptempo", "Speedcore"], src: "research" }, // Lekkerfaces
  "len-faki": { m: ["Techno"], s: ["Minimal Techno"], src: "research" }, // Len Faki
  "lieks": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // LIEKS
  "lil-texas": { m: ["Techno", "Hardcore"], s: [], src: "wikidata" }, // Lil Texas
  "lilly-palmer": { m: ["Techno", "Hard Techno"], s: ["Peak Time Techno"], src: "research" }, // Lilly Palmer
  "liquidfive": { m: ["House", "EDM"], s: ["Electro House"], src: "research" }, // Liquidfive
  "loco-dice": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Loco Dice
  "lost-frequencies": { m: ["House", "EDM"], s: ["Deep House", "Tropical House"], src: "research" }, // Lost Frequencies
  "ltj-bukem": { m: ["Drum & Bass"], s: ["Jungle", "Jazzstep", "Breakbeat"], src: "research" }, // LTJ Bukem
  "luciano": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Luciano
  "luciid": { m: ["Hard Techno", "Techno"], s: ["Dark Techno"], src: "research" }, // Luciid
  "luigi-tozzi": { m: ["Techno"], s: ["Dub Techno", "Hypnotic Techno", "Ambient"], src: "research" }, // Luigi Tozzi
  "luke-slater": { m: ["Techno"], s: [], src: "wikidata" }, // Luke Slater
  "luneris": { m: ["Psytrance", "Techno"], s: ["Electro Pagan Trance"], src: "research" }, // Luneris
  "luuk-van-dijk": { m: ["House"], s: ["Tech House", "Breakbeat"], src: "research" }, // Luuk Van Dijk
  "maddix": { m: ["Techno", "Hard Techno", "Acid Techno"], s: ["Big Room"], src: "research" }, // Maddix
  "main-phase": { m: ["House"], s: ["UK Garage", "Speed Garage", "Jungle"], src: "research" }, // Main Phase
  "mala": { m: ["Drum & Bass"], s: ["Dubstep"], src: "wikidata" }, // Mala
  "malaa": { m: ["House"], s: ["Bass House", "Tech House"], src: "wikidata" }, // Malaa
  "mall-grab": { m: ["House", "Techno"], s: ["Lo-Fi House", "Breakbeat"], src: "research" }, // Mall Grab
  "mar-t": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Mar-T
  "mara": { m: ["Drum & Bass"], s: ["Jungle", "Dubstep"], src: "research" }, // Mara
  "marc-acardipane": { m: ["Hardcore", "Hard Techno"], s: ["Gabber", "Doomcore"], src: "research" }, // Marc Acardipane
  "marcel-dettmann": { m: ["Techno"], s: ["Minimal Techno", "Electro"], src: "research" }, // Marcel Dettmann
  "marcellus-pittman": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Marcellus Pittman
  "marco-carola": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Marco Carola
  "maria-healy": { m: ["Trance"], s: [], src: "wikidata" }, // Maria Healy
  "maribou-state": { m: ["Techno", "House"], s: ["Downtempo", "Leftfield"], src: "musicbrainz" }, // Maribou State
  "markus-schulz": { m: ["Trance"], s: ["Progressive Trance"], src: "wikidata" }, // Markus Schulz
  "marlon-hoffstadt": { m: ["EDM", "Trance"], s: ["Eurodance"], src: "wikidata" }, // Marlon Hoffstadt
  "martin-garrix": { m: ["EDM"], s: ["Electro House", "Big Room", "Progressive House"], src: "last.fm+musicbrainz+wikidata" }, // Martin Garrix
  "martyn": { m: ["Drum & Bass"], s: ["Dubstep"], src: "wikidata" }, // Martyn
  "masters-at-work": { m: ["House"], s: ["Garage House", "Deep House"], src: "research" }, // Masters at Work
  "mathame": { m: ["Techno"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Mathame
  "mau-p": { m: ["EDM", "House"], s: ["Big Room", "Tech House"], src: "wikidata" }, // Mau P
  "maudux": { m: ["Techno", "Trance", "Hard Techno"], s: ["Bounce Trap", "Ghetto Trance"], src: "research" }, // Maudux
  "max-cooper": { m: ["Techno"], s: ["IDM", "Ambient"], src: "research" }, // Max Cooper
  "me": { m: ["House", "Techno"], s: ["Melodic House", "Deep House"], src: "research" }, // &ME
  "medusa": { m: ["Hard Techno", "Trance", "Acid Techno"], s: ["Schranz", "Uptempo"], src: "research" }, // Medusa
  "melvo-baptiste": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Melvo Baptiste
  "metrik": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk"], src: "research" }, // Metrik
  "michael-amani": { m: ["EDM", "House"], s: [], src: "research" }, // Michael Amani
  "michel-de-hey": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Michel de Hey
  "mika-heggemann": { m: ["Trance", "Hard Techno"], s: ["Nu Trance", "Hard House"], src: "research" }, // Mika Heggemann
  "miss-k8": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Miss K8
  "miss-monique": { m: ["House", "Techno"], s: ["Progressive House", "Melodic Techno"], src: "discogs+musicbrainz+wikidata" }, // Miss Monique
  "mk": { m: ["House"], s: ["Deep House", "UK Garage"], src: "research" }, // MK
  "moby": { m: ["Techno"], s: ["Downtempo", "Electronica", "Trip-Hop"], src: "wikidata" }, // Moby
  "modestep": { m: ["Drum & Bass"], s: ["Dubstep"], src: "wikidata" }, // Modestep
  "monika-kruse": { m: ["Techno"], s: [], src: "wikidata" }, // Monika Kruse
  "monolink": { m: ["House", "Techno"], s: ["Melodic House", "Progressive House", "Downtempo"], src: "research" }, // Monolink
  "moodymann": { m: ["House", "Techno"], s: ["Deep House", "Detroit Techno"], src: "discogs+last.fm+wikidata" }, // Moodymann
  "mosimann": { m: ["EDM", "House"], s: ["Deep House", "Progressive House"], src: "research" }, // Mosimann
  "mousse-t": { m: ["House"], s: ["Disco"], src: "wikidata" }, // Mousse T.
  "mrak": { m: ["Techno"], s: ["Melodic Techno"], src: "research" }, // MRAK
  "muzz": { m: ["Drum & Bass"], s: ["Neurofunk"], src: "research" }, // Muzz
  "n-vitral": { m: ["Hardcore"], s: ["Industrial Hardcore", "Uptempo"], src: "research" }, // N-Vitral
  "nastia": { m: ["Techno", "House"], s: ["Minimal Techno"], src: "research" }, // Nastia
  "nathan-fake": { m: ["Techno"], s: ["Ambient", "IDM"], src: "research" }, // Nathan Fake
  "natte-visstick": { m: ["Hard Techno", "Drum & Bass"], s: ["Memetechno"], src: "research" }, // Natte Visstick
  "negitiv": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Industrial Techno"], src: "research" }, // NEGITIV
  "neophyte": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Neophyte
  "netsky": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Netsky
  "nghtmre": { m: ["EDM"], s: ["Dubstep", "Future Bass", "Electro House"], src: "research" }, // NGHTMRE
  "nia-archives": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Nia Archives
  "nic-fanciulli": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Progressive House"], src: "research" }, // Nic Fanciulli
  "nick-warren": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // Nick Warren
  "nico-moreno": { m: ["Techno"], s: ["Industrial Techno"], src: "discogs+musicbrainz" }, // Nico Moreno
  "nicolas-julian": { m: ["Hard Techno"], s: [], src: "wikidata" }, // Nicolas Julian
  "nicole-moudaber": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Nicole Moudaber
  "nina-kraviz": { m: ["Techno", "House"], s: ["Deep House", "IDM", "Dubstep"], src: "discogs+last.fm+wikidata" }, // Nina Kraviz
  "noiseflow": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo"], src: "research" }, // Noiseflow
  "novah": { m: ["House", "Techno", "Trance"], s: ["Electro House", "Hard House", "Tech Trance"], src: "discogs" }, // Novah
  "nto": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz" }, // NTO
  "nu-tone": { m: ["Techno", "Drum & Bass"], s: ["Electronica"], src: "wikidata" }, // Nu:Tone
  "nyra": { m: ["Hard Techno", "Trance"], s: ["Bounce"], src: "research" }, // Nyra
  "octave-one": { m: ["Techno"], s: ["Detroit Techno", "Deep House"], src: "research" }, // Octave One
  "octo-octa": { m: ["House"], s: ["Breakbeat"], src: "research" }, // Octo Octa
  "ofenbach": { m: ["EDM"], s: ["Electropop"], src: "wikidata" }, // Ofenbach
  "oliver-heldens": { m: ["EDM"], s: ["Electro House", "Future House"], src: "wikidata" }, // Oliver Heldens
  "oliver-huntemann": { m: ["Techno"], s: [], src: "wikidata" }, // Oliver Huntemann
  "oliver-lieb": { m: ["Techno"], s: [], src: "wikidata" }, // Oliver Lieb
  "oliver-magenta": { m: ["EDM", "House"], s: ["Electro", "Deep House"], src: "research" }, // Oliver Magenta
  "ophidian": { m: ["Hardcore"], s: ["Doomcore"], src: "wikidata" }, // Ophidian
  "ornella": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "research" }, // Ornella
  "oscar-mulero": { m: ["Techno"], s: [], src: "wikidata" }, // Oscar Mulero
  "outsiders": { m: ["Hardstyle"], s: [], src: "research" }, // Outsiders
  "overmono": { m: ["Techno"], s: ["Breakbeat", "Ambient", "UK Garage"], src: "discogs+last.fm+musicbrainz" }, // Overmono
  "paco-osuna": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Paco Osuna
  "paffendorf": { m: ["Trance"], s: [], src: "wikidata" }, // Paffendorf
  "palms-trax": { m: ["House"], s: ["Deep House", "Disco", "Nu-Disco"], src: "research" }, // Palms Trax
  "paramida": { m: ["House"], s: ["Disco", "Italo Disco", "Goa Trance"], src: "research" }, // Paramida
  "partyraiser": { m: ["Hardcore"], s: ["Uptempo", "Gabber"], src: "research" }, // Partyraiser
  "pat-b": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "research" }, // Pat B
  "paul-elstak": { m: ["Hardcore"], s: ["Gabber", "Happy Hardcore", "Rave"], src: "last.fm+wikidata" }, // Paul Elstak
  "paul-kalkbrenner": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Paul Kalkbrenner
  "paul-oakenfold": { m: ["Trance"], s: [], src: "wikidata" }, // Paul Oakenfold
  "paul-van-dyk": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Paul van Dyk
  "pawlowski": { m: ["Hard Techno", "Acid Techno", "Trance"], s: ["Hardgroove", "Hard House"], src: "research" }, // Pawlowski
  "pawsa": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Pawsa
  "pegassi": { m: ["Techno", "Hard Techno", "Trance"], s: ["Eurodance"], src: "research" }, // Pegassi
  "peggy-gou": { m: ["House", "Techno"], s: ["Deep House"], src: "last.fm" }, // Peggy Gou
  "pendulum": { m: ["Drum & Bass"], s: ["Dancefloor Drum & Bass", "Electronic Rock"], src: "research" }, // Pendulum
  "peterblue": { m: ["Techno", "House"], s: ["Hardgroove", "Latin Club", "Guaracha"], src: "research" }, // Peterblue
  "petit-biscuit": { m: ["Techno", "EDM", "House"], s: ["Deep House", "Downtempo", "Electropop"], src: "wikidata" }, // Petit Biscuit
  "photek": { m: ["Techno", "Drum & Bass", "House"], s: ["Deep House", "Downtempo"], src: "wikidata" }, // Photek
  "phuture-noize": { m: ["Hardstyle"], s: [], src: "research" }, // Phuture Noize
  "pinkpantheress": { m: ["Drum & Bass"], s: ["Jungle"], src: "wikidata" }, // PinkPantheress
  "pole": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // Pole
  "polo-pan": { m: ["Techno"], s: ["Electro"], src: "wikidata" }, // Polo & Pan
  "project-one": { m: ["Hardstyle"], s: [], src: "research" }, // Project One
  "prospa": { m: ["Techno", "House", "EDM"], s: ["Breakbeat", "Rave"], src: "discogs+last.fm" }, // Prospa
  "prunk": { m: ["House"], s: ["Deep House", "UK Garage", "Tech House"], src: "research" }, // Prunk
  "pulsedriver": { m: ["EDM"], s: ["Eurodance"], src: "wikidata" }, // Pulsedriver
  "purple-disco-machine": { m: ["House"], s: ["Nu-Disco", "Disco"], src: "research" }, // Purple Disco Machine
  "r-dhad": { m: ["Techno"], s: ["Dub Techno", "Minimal Techno", "Industrial Techno"], src: "research" }, // Rødhåd
  "radical-redemption": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle"], src: "research" }, // Radical Redemption
  "ran-d": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Ran-D
  "raresh": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "research" }, // Raresh
  "raxeller": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Raxeller
  "rebelion": { m: ["Hardstyle"], s: [], src: "research" }, // Rebelion
  "refuzion": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Refuzion
  "regain": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Regain
  "regi": { m: ["Trance", "EDM"], s: ["Eurodance"], src: "research" }, // Regi
  "reinier-zonneveld": { m: ["Acid Techno", "Techno"], s: ["Minimal Techno"], src: "research" }, // Reinier Zonneveld
  "restricted": { m: ["Hard Techno"], s: ["Rave"], src: "research" }, // Restricted
  "rey-colino": { m: ["House", "Techno", "Acid Techno"], s: ["Progressive House", "Electro"], src: "research" }, // Rey Colino
  "ricardo-villalobos": { m: ["Techno", "House"], s: ["Minimal Techno", "Microhouse"], src: "research" }, // Ricardo Villalobos
  "richie-hawtin": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Richie Hawtin
  "rob-gee": { m: ["Hardcore"], s: ["Gabber"], src: "wikidata" }, // Rob Gee
  "robbie-doherty": { m: ["House"], s: ["Deep House", "Tech House"], src: "research" }, // Robbie Doherty
  "robert-hood": { m: ["Techno"], s: ["Minimal Techno"], src: "research" }, // Robert Hood
  "robot-rock-alive": { m: ["House", "EDM"], s: ["French Touch", "Electro"], src: "research" }, // Robot Rock Alive
  "romare": { m: ["House"], s: ["UK Garage", "Downtempo"], src: "research" }, // Romare
  "ron-trent": { m: ["House"], s: ["Deep House", "Chicago House"], src: "research" }, // Ron Trent
  "rooler": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Rooler
  "roots-zombie": { m: ["Drum & Bass"], s: ["Dub", "Jungle", "Dubstep"], src: "research" }, // Roots Zombie
  "rotterdam-terror-corps": { m: ["Hardcore"], s: ["Gabber"], src: "wikidata" }, // Rotterdam Terror Corps
  "royksopp": { m: ["House"], s: ["Ambient", "Synth-Pop", "Downtempo"], src: "research" }, // Röyksopp
  "roza-terenzi": { m: ["Techno"], s: ["Breakbeat", "Electro", "Progressive House"], src: "wikidata" }, // Roza Terenzi
  "rp-boo": { m: ["Techno"], s: ["Footwork"], src: "wikidata" }, // RP Boo
  "rudimental": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Rudimental
  "rusko": { m: ["Drum & Bass"], s: ["Dubstep"], src: "wikidata" }, // Rusko
  "ryan-elliott": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Ryan Elliott
  "s-p-y": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk", "Jungle"], src: "research" }, // S.P.Y
  "sama-abdulhadi": { m: ["Techno"], s: ["Peak Time Techno", "Hardgroove"], src: "research" }, // Sama' Abdulhadi
  "sammy-virji": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Sammy Virji
  "samuel-moriero": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // Samuel Moriero
  "sander-kleinenberg": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // Sander Kleinenberg
  "sandrien": { m: ["Techno", "Acid Techno"], s: ["Breakbeat"], src: "research" }, // Sandrien
  "sara-landry": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Sara Landry
  "sasha": { m: ["House", "Trance"], s: ["Progressive House", "Progressive Trance", "Breakbeat"], src: "research" }, // Sasha
  "scientyfreaks": { m: ["Psytrance", "Techno"], s: ["Progressive Trance", "Breakbeat"], src: "research" }, // Scientyfreaks
  "scissor-sisters": { m: ["House"], s: ["Nu-Disco"], src: "wikidata" }, // Scissor Sisters
  "seth-troxler": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "research" }, // Seth Troxler
  "shanti-celeste": { m: ["House", "Techno"], s: ["Electro", "Ambient", "Deep House"], src: "research" }, // Shanti Celeste
  "she-her": { m: ["Techno"], s: [], src: "research" }, // SHE/HER
  "sherelle": { m: ["Drum & Bass"], s: ["Jungle", "Footwork"], src: "research" }, // Sherelle
  "shygirl": { m: ["House", "EDM"], s: ["Deconstructed Club", "UK Garage"], src: "research" }, // Shygirl
  "silva-bumpa": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Silva Bumpa
  "skepta": { m: ["House"], s: ["Tech House", "Grime"], src: "research" }, // Skepta
  "skream": { m: ["House", "Techno"], s: ["Dubstep", "UK Garage", "Disco"], src: "research" }, // Skream
  "slvl": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // SLVL
  "snts": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // SNTS
  "sofia-kourtesis": { m: ["House"], s: ["Deep House", "Microhouse"], src: "research" }, // Sofia Kourtesis
  "solomun": { m: ["House", "Techno"], s: ["Deep House", "Minimal Techno", "Tech House"], src: "discogs+last.fm+musicbrainz" }, // Solomun
  "sophie-sugar": { m: ["Trance"], s: [], src: "wikidata" }, // Sophie Sugar
  "soulwax": { m: ["House"], s: ["Electro House", "Electroclash", "New Rave"], src: "research" }, // Soulwax
  "sound-rush": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Sound Rush
  "speedy-j": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno", "Industrial Techno"], src: "research" }, // Speedy J
  "spfdj": { m: ["Techno", "Hard Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // SPFDJ
  "spoink": { m: ["Techno", "Drum & Bass", "Acid Techno"], s: ["Dubstep"], src: "research" }, // Spoink
  "stephan-bodzin": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Stephan Bodzin
  "steve-aoki": { m: ["Techno"], s: ["Electronica"], src: "wikidata" }, // Steve Aoki
  "sub-focus": { m: ["Drum & Bass", "EDM"], s: ["Drumstep", "Dubstep", "Electro House"], src: "research" }, // Sub Focus
  "sub-zero-project": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Sub Zero Project
  "sunnery-james-ryan-marciano": { m: ["House"], s: ["Progressive House"], src: "wikidata" }, // Sunnery James & Ryan Marciano
  "surgeon": { m: ["Techno"], s: [], src: "wikidata" }, // Surgeon
  "suzane": { m: ["Techno"], s: ["Electro"], src: "wikidata" }, // Suzane
  "sven-vath": { m: ["Techno", "Trance"], s: ["Electro", "Minimal Techno", "Tech House"], src: "discogs+musicbrainz+wikidata" }, // Sven Väth
  "swedish-house-mafia": { m: ["House", "EDM"], s: ["Progressive House"], src: "research" }, // Swedish House Mafia
  "tassery": { m: ["Hard Techno", "Trance"], s: ["Schranz"], src: "research" }, // Tassery
  "tauceti": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Tauceti
  "technimatic": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Technimatic
  "teho": { m: ["Techno", "House"], s: ["Downtempo", "Tech House", "Minimal Techno"], src: "discogs+last.fm" }, // Teho
  "teknoclash": { m: ["EDM", "House"], s: ["Future House", "Electro House", "Bass House"], src: "research" }, // Teknoclash
  "the-advent": { m: ["Techno"], s: [], src: "wikidata" }, // The Advent
  "the-avalanches": { m: ["House"], s: ["Disco"], src: "wikidata" }, // The Avalanches
  "the-avener": { m: ["House"], s: ["Deep House", "Electro"], src: "research" }, // The Avener
  "the-blaze": { m: ["House"], s: ["French House", "Electro"], src: "research" }, // The Blaze
  "the-chainsmokers": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // The Chainsmokers
  "the-lady-machine": { m: ["Techno"], s: ["Hypnotic Techno", "Industrial Techno"], src: "research" }, // The Lady Machine
  "the-prodigy": { m: ["EDM", "Hardcore"], s: ["Big Beat", "Breakbeat", "Rave"], src: "research" }, // The Prodigy
  "the-sabres-of-paradise": { m: ["Techno", "House"], s: ["Dub Techno", "Industrial Techno"], src: "research" }, // The Sabres of Paradise
  "the-saints": { m: ["Hardstyle", "Hardcore"], s: ["Uptempo"], src: "research" }, // The Saints
  "the-upbeats": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // The Upbeats
  "theo-parrish": { m: ["Techno"], s: [], src: "wikidata" }, // Theo Parrish
  "thylacine": { m: ["Techno", "House"], s: ["Ambient", "Downtempo", "Deep House"], src: "research" }, // Thylacine
  "tiesto": { m: ["Trance", "Techno", "EDM"], s: ["Progressive Trance", "Electronica", "Vocal Trance"], src: "discogs+last.fm" }, // Tiësto
  "tiga": { m: ["Techno"], s: ["Electro"], src: "wikidata" }, // Tiga
  "timmy-trumpet": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // Timmy Trumpet
  "timo-maas": { m: ["House"], s: ["Progressive House"], src: "wikidata" }, // Timo Maas
  "tinlicker": { m: ["House"], s: ["Deep House", "Progressive House"], src: "wikidata" }, // Tinlicker
  "titi": { m: ["Hard Techno", "Techno"], s: [], src: "research" }, // TITI
  "toman": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno"], src: "wikidata" }, // Toman
  "tony-romera": { m: ["House", "EDM"], s: ["Bass House", "Electro House", "French House"], src: "wikidata" }, // Tony Romera
  "traumer": { m: ["House", "Techno"], s: ["Minimal Techno", "Deep House"], src: "research" }, // Traumer
  "tricky": { m: ["Techno"], s: ["Trip-Hop"], src: "wikidata" }, // Tricky
  "trinix": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // Trinix
  "trym": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Hard Trance", "Hard House"], src: "research" }, // Trym
  "ueberrest": { m: ["Hard Techno", "Techno"], s: ["Hard Bounce", "Industrial Techno"], src: "research" }, // Ueberrest
  "ummet-ozcan": { m: ["EDM", "Trance", "House"], s: ["Big Room", "Electro House", "Progressive House"], src: "wikidata" }, // Ummet Ozcan
  "underworld": { m: ["Techno", "House"], s: ["Progressive House"], src: "wikidata" }, // Underworld
  "unexist": { m: ["Hardcore"], s: [], src: "wikidata" }, // Unexist
  "ush": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // USH
  "vendex": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Vendex
  "venga": { m: ["House", "Techno", "Acid Techno"], s: ["Tech House", "Bass House"], src: "research" }, // Venga
  "vertile": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Vertile
  "vieze-asbak": { m: ["Hard Techno", "Techno"], s: ["Memetechno"], src: "research" }, // Vieze Asbak
  "vini-vici": { m: ["Psytrance"], s: [], src: "wikidata" }, // Vini Vici
  "virginia": { m: ["House"], s: ["Deep House"], src: "research" }, // Virginia
  "vladimir-cauchemar": { m: ["House", "Techno"], s: ["Electro", "French House", "Euro House"], src: "discogs+last.fm" }, // Vladimir Cauchemar
  "vok": { m: ["Techno"], s: ["Trip-Hop"], src: "wikidata" }, // Vök
  "w-w": { m: ["EDM"], s: ["Big Room", "Electro House"], src: "wikidata" }, // W&W
  "warface": { m: ["Hardstyle"], s: ["Rawstyle"], src: "discogs+last.fm+musicbrainz" }, // Warface
  "wasted-penguinz": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Wasted Penguinz
  "wata-igarashi": { m: ["Techno"], s: ["Ambient", "Dub Techno"], src: "research" }, // Wata Igarashi
  "wildstylez": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Wildstylez
  "wilkinson": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Wilkinson
  "will-atkinson": { m: ["Trance", "Psytrance"], s: ["Breakbeat"], src: "research" }, // Will Atkinson
  "worakls": { m: ["Techno"], s: ["Minimal Techno"], src: "wikidata" }, // Worakls
  "yotto": { m: ["House"], s: ["Deep House"], src: "wikidata" }, // Yotto
  "young-marco": { m: ["House", "Techno"], s: ["Ambient", "Balearic", "Deep House"], src: "research" }, // Young Marco
  "yuksek": { m: ["Techno", "House"], s: ["Electronica", "Nu-Disco"], src: "wikidata" }, // Yuksek
  "yves-deruyter": { m: ["Trance", "Techno", "Acid Techno"], s: ["Hard Trance"], src: "research" }, // Yves Deruyter
  "zapravka": { m: ["Hard Techno", "Techno", "Hardstyle"], s: ["Gabber", "Bass House"], src: "research" }, // Zapravka
  "zelecter": { m: ["Hardstyle"], s: ["Early Hardstyle", "Rawstyle", "Uptempo"], src: "research" }, // Zelecter
};
/* STYLES:end */

export const styleFor = (slug: string): ArtistStyle | undefined => ARTIST_STYLES[slug];
