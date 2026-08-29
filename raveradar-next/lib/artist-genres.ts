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
  "2-engel-charlie": { m: ["EDM", "Hardstyle"], s: ["Hands Up"], src: "research" }, // 2 Engel & Charlie
  "25emeheure": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Hardgroove", "Hard Trance"], src: "research" }, // 25emeheure
  "2hot2play": { m: ["Hard Techno", "Techno", "Trance"], s: ["Hard House"], src: "research" }, // 2HOT2PLAY
  "2manydjs": { m: ["House", "Techno"], s: ["Breakbeat", "Disco"], src: "research" }, // 2ManyDJs
  "36framez": { m: ["House"], s: ["Deep House"], src: "research" }, // 36framez
  "5napback": { m: ["House", "EDM", "Hardstyle"], s: ["Electro House", "Progressive House"], src: "research" }, // 5NAPBACK
  "6ejou": { m: ["Hard Techno", "Techno", "Hardcore"], s: ["Downtempo", "Industrial"], src: "discogs" }, // 6Ejou
  "808-state": { m: ["Techno", "House"], s: ["Acid House", "Breakbeat"], src: "research" }, // 808 State
  "999999999": { m: ["Acid Techno", "Techno"], s: [], src: "discogs+last.fm" }, // 999999999
  "a-c-killer": { m: ["Hardcore"], s: ["Breakcore"], src: "research" }, // A.C.Killer
  "a-for-alpha": { m: ["House", "Techno"], s: ["UK Garage", "Tech House", "Breakbeat"], src: "research" }, // A For Alpha
  "a-guy-called-gerald": { m: ["House", "Drum & Bass"], s: ["Acid House", "Jungle"], src: "research" }, // A Guy Called Gerald
  "a-m-c": { m: ["Drum & Bass"], s: ["Neurofunk", "Jump Up"], src: "research" }, // A.M.C
  "a-n-i": { m: ["Hard Techno", "Acid Techno", "Hardstyle"], s: ["Gabber", "Hard Trance"], src: "research" }, // A.N.I.
  "a-n-z": { m: ["House", "Techno", "Trance"], s: ["Eurodance"], src: "research" }, // A.N.Z
  "a-s-y-s": { m: ["Acid Techno", "Trance", "Techno"], s: ["Hard Trance"], src: "discogs" }, // A*S*Y*S
  "a-teens": { m: ["House"], s: ["Europop", "Eurodance", "Euro House"], src: "research" }, // A*Teens
  "a-tom-x": { m: ["House"], s: ["Retro House", "Hard House"], src: "research" }, // A-Tom-X
  "aaron-hibell": { m: ["House", "Techno", "Trance"], s: ["Progressive House", "Ambient", "Downtempo"], src: "discogs" }, // Aaron Hibell
  "aat": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // AAT
  "abo-abo": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Abo Abo
  "above-beyond": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Above & Beyond
  "abul-mogard": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Abul Mogard
  "acid-arab": { m: ["House", "Techno"], s: ["Acid House"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Acid Arab
  "acid-pauli": { m: ["House", "Techno"], s: ["Downtempo", "Minimal Techno", "Deep House"], src: "research" }, // Acid Pauli
  "acid-talk": { m: [], s: [], src: "hors-perimetre" }, // Acid Talk
  "acidpach": { m: ["Acid Techno", "Hard Techno", "Techno"], s: ["Freetekno", "Tribal Techno"], src: "research" }, // Acidpach
  "act-of-rage": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Act of Rage
  "actress-m": { m: ["House"], s: ["Italo Disco", "Dark Disco", "EBM"], src: "research" }, // Actress M
  "adam-beyer": { m: ["Techno"], s: ["Minimal Techno", "Tech House", "Breakbeat"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Adam Beyer
  "adam-f": { m: ["Drum & Bass"], s: ["Jungle", "Breakbeat"], src: "research" }, // Adam F
  "adam-ten": { m: ["House", "Techno"], s: ["Melodic House", "Indie Dance"], src: "research" }, // Adam Ten
  "adaro": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Adaro
  "adene": { m: ["Techno"], s: [], src: "discogs" }, // Adene
  "adiel": { m: ["Techno"], s: ["Breakbeat", "Electro", "Tech House"], src: "discogs" }, // Adiel
  "adjuzt": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Adjuzt
  "adrenalize": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Adrenalize
  "adrian-mills": { m: ["Hard Techno", "Trance"], s: ["Makina", "Hard Bounce"], src: "research" }, // Adrián Mills
  "adriatique": { m: ["House", "Techno"], s: ["Deep House", "Minimal Techno", "Progressive House"], src: "discogs+musicbrainz" }, // Adriatique
  "aerea": { m: ["Techno"], s: [], src: "research" }, // Aerea
  "afem-syko": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Bouncy Techno"], src: "research" }, // Afem Syko
  "afrojack": { m: ["EDM", "House"], s: ["Big Room", "Electro House", "Dutch House"], src: "research" }, // Afrojack
  "agents-of-time": { m: ["Techno", "House", "Acid Techno"], s: ["Melodic Techno"], src: "research" }, // Agents Of Time
  "agnes": { m: ["House"], s: ["Disco", "Dance-pop", "Europop"], src: "research" }, // Agnes
  "agoria": { m: ["Techno", "House"], s: ["Tech House", "Electro", "Deep House"], src: "discogs" }, // Agoria
  "aiden": { m: ["Hard Techno", "Techno"], s: ["Peak Time Techno"], src: "research" }, // Aiden
  "aja-gulris": { m: ["Techno"], s: ["Melodic Techno"], src: "research" }, // Aja Gulris
  "ajja": { m: ["Psytrance"], s: ["Downtempo", "Progressive Trance"], src: "research" }, // Ajja
  "akimbo": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Akimbo
  "akirah": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs" }, // Akirah
  "alan-fitzpatrick": { m: ["Techno"], s: ["Tech House", "Progressive House", "Minimal Techno"], src: "discogs" }, // Alan Fitzpatrick
  "alarico": { m: ["Techno"], s: ["Hardgroove", "Industrial Techno"], src: "research" }, // Alarico
  "alarico-pres-kenji-hina": { m: ["Techno", "Hard Techno"], s: ["Hardgroove", "Tribal Techno"], src: "research" }, // Alarico pres. Kenji Hina
  "alex-kassian": { m: ["House", "Techno"], s: ["Balearic", "Ambient", "Deep House"], src: "discogs" }, // Alex Kassian
  "alex-stein": { m: ["Techno"], s: ["Tech House", "Euro House", "Progressive Trance"], src: "discogs" }, // Alex Stein
  "alex-wann": { m: ["House"], s: ["Progressive House", "Deep House", "Tribal House"], src: "discogs" }, // Alex Wann
  "alexander-koning": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Progressive House"], src: "discogs" }, // Alexander Koning
  "alienata": { m: ["Techno"], s: ["Electro"], src: "discogs" }, // Alienata
  "alignment": { m: ["Techno"], s: ["Dark Techno", "Rave"], src: "discogs+musicbrainz" }, // Alignment
  "alika": { m: [], s: [], src: "hors-perimetre" }, // ALIKA
  "alisha": { m: ["House", "Techno"], s: ["Electro", "Disco"], src: "discogs" }, // Alisha
  "alison-swing": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Alison Swing
  "alison-wonderland": { m: ["EDM"], s: ["Future Bass", "Dubstep"], src: "research" }, // Alison Wonderland
  "alix-perez": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Halftime", "Dubstep"], src: "research" }, // Alix Perez
  "alle-farben": { m: ["House"], s: ["Deep House", "Tech House"], src: "research" }, // Alle Farben
  "alma-negrot": { m: ["House", "Acid Techno"], s: [], src: "research" }, // Alma Negrot
  "alok": { m: ["EDM", "House"], s: ["Bass House", "Deep House", "Brazilian Bass"], src: "research" }, // Alok
  "alt8": { m: ["Hard Techno", "Techno"], s: ["Electro"], src: "research" }, // ALT8
  "altinbas": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Altinbas
  "aly-fila": { m: ["Trance"], s: ["Uplifting Trance", "Progressive Trance"], src: "research" }, // Aly & Fila
  "alycia-bezgo": { m: ["Techno", "Hard Techno", "Trance"], s: ["Hardgroove"], src: "research" }, // Alycia Bezgo
  "amada": { m: ["Hardcore"], s: [], src: "research" }, // Amada
  "amara": { m: ["Hard Techno"], s: ["Schranz", "Industrial Techno"], src: "research" }, // Amara
  "amber-broos": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Amber Broos
  "ame": { m: ["House", "Techno"], s: ["Deep House", "Melodic House", "Melodic Techno"], src: "research" }, // Âme
  "amelia-holt": { m: ["Techno"], s: ["Downtempo", "Experimental", "Trip-Hop"], src: "discogs" }, // Amelia Holt
  "amelie-lens": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Amelie Lens
  "amor": { m: ["House"], s: ["Afro House", "Tech House"], src: "research" }, // Amor
  "amy-dabbs": { m: ["House"], s: ["UK Garage", "Breakbeat", "Jungle"], src: "research" }, // Amy Dabbs
  "anais": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Anaïs
  "anane": { m: ["House"], s: ["Deep House", "Disco"], src: "discogs" }, // Anane
  "anastasia-rose": { m: ["EDM"], s: ["Electro House"], src: "discogs" }, // Anastasia Rose
  "anders-hp": { m: ["House", "Techno"], s: ["Melodic House", "Progressive House"], src: "research" }, // Anders HP
  "andhim": { m: ["House"], s: ["Tech House"], src: "research" }, // Andhim
  "andre-visior": { m: ["Trance"], s: ["Hard Trance", "Progressive Trance"], src: "research" }, // Andre Visior
  "andreas-kraemer": { m: ["Techno"], s: [], src: "discogs" }, // Andreas Kraemer
  "andres-campo": { m: ["Techno"], s: ["Tech House"], src: "discogs" }, // Andrés Campo
  "andrew-azara": { m: ["House"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Andrew Azara
  "andrew-rayel": { m: ["Trance"], s: ["Progressive Trance", "Progressive House", "Tech Trance"], src: "discogs" }, // Andrew Rayel
  "andy-c": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Andy C
  "andy-stott": { m: ["Techno"], s: ["Experimental", "Ambient", "Dub Techno"], src: "discogs+wikidata" }, // Andy Stott
  "anetha": { m: ["Techno", "House"], s: ["Electronica", "Disco", "Industrial Techno"], src: "discogs+last.fm+musicbrainz" }, // Anetha
  "angerfist": { m: ["Hardcore"], s: ["Gabber", "Darkcore"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Angerfist
  "anika-kunst": { m: ["Techno", "House"], s: ["Peak Time Techno"], src: "research" }, // Anika Kunst
  "anime": { m: ["Hardcore", "Hardstyle"], s: ["Gabber", "Uptempo"], src: "research" }, // AniMe
  "anish-kumar": { m: ["House"], s: ["Breakbeat"], src: "research" }, // Anish Kumar
  "ankkh": { m: ["Techno"], s: [], src: "research" }, // Ankkh
  "anna": { m: ["Techno"], s: ["Melodic Techno", "Ambient"], src: "research" }, // ANNA
  "anna-reusch": { m: ["Techno"], s: ["Tech House"], src: "discogs" }, // Anna Reusch
  "annasnel": { m: ["House", "Acid Techno"], s: ["Progressive House"], src: "research" }, // ANNASNEL
  "annie": { m: ["Techno", "House"], s: ["Electro"], src: "discogs" }, // Annie
  "annie-mac": { m: ["House", "Techno", "Drum & Bass"], s: ["Electro", "Electro House"], src: "discogs" }, // Annie Mac
  "anstandslos-durchgeknallt": { m: ["House", "EDM"], s: ["Deep House", "Hands Up", "Dance-Pop"], src: "research" }, // Anstandslos & Durchgeknallt
  "antdot": { m: ["House"], s: ["Progressive House", "Deep House"], src: "discogs" }, // Antdot
  "anthea": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Downtempo"], src: "discogs" }, // Anthea
  "anthony-rother": { m: ["Techno"], s: ["Electro", "Ambient"], src: "research" }, // Anthony Rother
  "antonym": { m: ["Techno"], s: ["Experimental", "Industrial", "Ambient"], src: "discogs" }, // Antonym
  "anyma": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House", "Progressive House"], src: "research" }, // Anyma
  "anz": { m: ["Drum & Bass", "House"], s: ["Grime", "Bass Music", "Dubstep"], src: "discogs" }, // Anz
  "aph-tic": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Aphøtic
  "aphex-twin": { m: ["Techno", "Acid Techno"], s: ["Ambient Techno", "IDM", "Experimental"], src: "discogs+wikidata" }, // Aphex Twin
  "aphrodite": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs" }, // Aphrodite
  "apocalipse": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // Apocalipse
  "apparat": { m: ["Techno"], s: ["Ambient", "IDM", "Downtempo"], src: "research" }, // Apparat
  "aquagen": { m: ["Trance"], s: ["Hard Trance", "Hard House"], src: "discogs" }, // Aquagen
  "ar-gang": { m: ["Hardstyle"], s: ["Rawstyle", "Uptempo"], src: "research" }, // AR Gang
  "arca": { m: ["Techno"], s: ["Experimental", "Leftfield", "Bass Music"], src: "discogs" }, // Arca
  "archie-hamilton": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Deep House"], src: "discogs" }, // Archie Hamilton
  "argy": { m: ["House", "Techno"], s: ["Tech House", "Melodic Techno"], src: "research" }, // Argy
  "arjuna": { m: ["Psytrance"], s: ["Forest", "Goa Trance"], src: "research" }, // Arjuna
  "armand-van-helden": { m: ["House"], s: ["Speed Garage", "Nu-Disco", "Big Beat"], src: "research" }, // Armand van Helden
  "armin-van-buuren": { m: ["Trance"], s: ["Progressive Trance", "Vocal Trance", "Uplifting Trance"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Armin van Buuren
  "arovane": { m: ["Techno"], s: ["Ambient", "IDM", "Experimental"], src: "discogs" }, // Arovane
  "art-of-fighters": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Art of Fighters
  "artbat": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House"], src: "research" }, // ARTBAT
  "artifact": { m: ["Hardstyle"], s: [], src: "research" }, // Artifact
  "artino": { m: ["Drum & Bass"], s: [], src: "discogs" }, // Artino
  "asco": { m: ["EDM", "House", "Trance"], s: ["Electro House", "Progressive House", "Progressive Trance"], src: "discogs" }, // Asco
  "asdek": { m: ["House", "EDM"], s: ["Electro House"], src: "discogs" }, // Asdek
  "ash-lauryn": { m: ["House"], s: ["Deep House"], src: "research" }, // Ash Lauryn
  "astral-projection": { m: ["Psytrance"], s: ["Goa Trance"], src: "discogs+wikidata" }, // Astral Projection
  "athenalys": { m: ["Hardcore", "Hard Techno"], s: [], src: "discogs" }, // Athenalys
  "atmozfears": { m: ["Hardstyle"], s: ["Happy Hardcore"], src: "discogs+wikidata" }, // Atmozfears
  "audiotricz": { m: ["Hardstyle"], s: ["Electro House", "Happy Hardcore"], src: "discogs" }, // Audiotricz
  "audrey-danza": { m: ["Techno", "Trance"], s: ["Industrial Techno", "Progressive Trance"], src: "research" }, // Audrey Danza
  "aurora-halal": { m: ["Techno"], s: ["Electro", "Ambient"], src: "research" }, // Aurora Halal
  "austher": { m: ["Techno", "House"], s: ["EBM", "Italo Disco"], src: "discogs" }, // Austher
  "autechre": { m: ["Techno"], s: ["Experimental", "IDM", "Ambient Techno"], src: "discogs+musicbrainz" }, // Autechre
  "autodrive": { m: ["Drum & Bass"], s: [], src: "research" }, // Autodrive
  "autopski": { m: ["Drum & Bass"], s: [], src: "research" }, // Autopski
  "avalon": { m: ["Psytrance"], s: ["Goa Trance", "Progressive Trance"], src: "research" }, // Avalon
  "aversion": { m: ["Hardstyle", "Hardcore"], s: [], src: "discogs" }, // Aversion
  "avi8": { m: ["Hardstyle"], s: ["Happy Hardcore"], src: "discogs" }, // Avi8
  "axmo": { m: ["EDM", "Hardstyle"], s: ["Electro House", "Happy Hardcore", "Hands Up"], src: "research" }, // Axmo
  "axwell": { m: ["House", "EDM"], s: ["Progressive House"], src: "research" }, // Axwell
  "ayah-marar": { m: ["Drum & Bass", "House"], s: ["Dubstep", "Electro House"], src: "research" }, // Ayah Marar
  "ayla": { m: ["Trance"], s: ["Downtempo", "Ambient", "Progressive Trance"], src: "discogs+wikidata" }, // Ayla
  "azuur": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Azuur
  "azyr": { m: ["Hard Techno", "Techno"], s: ["Hard Dance"], src: "research" }, // Azyr
  "b-ery": { m: ["Hard Techno"], s: ["Industrial Techno", "Bochka"], src: "research" }, // BØĘRY
  "b-front": { m: ["Hardstyle"], s: [], src: "discogs+wikidata" }, // B-Front
  "b1980": { m: ["Techno"], s: ["EBM", "Industrial Techno", "Electro"], src: "research" }, // B1980
  "baboush": { m: ["Hardcore", "Hard Techno"], s: ["Hard Dance", "Neo Rave"], src: "research" }, // Baboush
  "baby-berserk": { m: [], s: [], src: "hors-perimetre" }, // Baby Berserk
  "babybel": { m: ["Techno"], s: ["Breakbeat"], src: "research" }, // Babybel
  "babyschon": { m: ["House"], s: ["New Beat", "Synth-pop", "Electro"], src: "research" }, // babyschön
  "badsista": { m: ["Techno", "House"], s: ["Baile Funk", "Bass House", "Breakbeat"], src: "research" }, // Badsista
  "bapari": { m: ["Techno", "Drum & Bass"], s: [], src: "discogs" }, // Bapari
  "barbara-butch": { m: ["House"], s: ["Disco"], src: "research" }, // Barbara Butch
  "barber": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Barber
  "bardix-le-gaulois": { m: ["Techno"], s: ["Celtic Techno"], src: "research" }, // Bardix le Gaulois
  "bart-skils": { m: ["Techno", "House"], s: ["Tech House"], src: "discogs" }, // Bart Skils
  "basement-jaxx": { m: ["Techno", "House"], s: ["Electronica"], src: "discogs+wikidata" }, // Basement Jaxx
  "bashkka": { m: ["Techno", "House"], s: ["Breakbeat", "Tech House"], src: "discogs" }, // BASHKKA
  "battery": { m: ["Drum & Bass"], s: [], src: "research" }, // Battery
  "batu": { m: ["Techno"], s: ["Experimental", "Ambient", "Bass Music"], src: "discogs" }, // Batu
  "bcuc": { m: [], s: [], src: "hors-perimetre" }, // BCUC
  "beau-didier": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Beau Didier
  "bedouin": { m: ["House"], s: ["Melodic House", "Deep House", "Organic House"], src: "research" }, // Bedouin
  "bella-claxton": { m: ["House", "Trance"], s: ["Hard House", "Progressive House"], src: "research" }, // Bella Claxton
  "bellaire": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Bellaire
  "ben-hemsley": { m: ["House", "Trance"], s: ["Rave", "Happy Hardcore", "Progressive House"], src: "research" }, // Ben Hemsley
  "ben-klock": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+musicbrainz" }, // Ben Klock
  "ben-sims": { m: ["Techno"], s: ["Minimal Techno", "Tribal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Ben Sims
  "ben-techy": { m: ["Techno"], s: ["Industrial", "Schranz"], src: "discogs" }, // Ben Techy
  "ben-ufo": { m: ["Techno", "House"], s: ["UK Garage", "Dubstep"], src: "research" }, // Ben UFO
  "benga": { m: ["Drum & Bass", "House"], s: ["Dubstep", "UK Garage"], src: "research" }, // Benga
  "benny-benassi": { m: ["House", "EDM"], s: ["Electro House", "Tech House", "Progressive House"], src: "discogs+wikidata" }, // Benny Benassi
  "benny-rodrigues": { m: ["Techno", "House"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Benny Rodrigues
  "benwal": { m: ["Trance", "House"], s: ["Hard Trance", "Rave"], src: "research" }, // Benwal
  "bicep": { m: ["House", "Techno"], s: ["Breakbeat", "Tech House", "Deep House"], src: "discogs" }, // Bicep
  "biia": { m: ["Techno"], s: [], src: "discogs" }, // Biia
  "biianco": { m: ["House"], s: [], src: "discogs" }, // Biianco
  "biocym": { m: ["Techno"], s: ["Deep Techno"], src: "discogs" }, // Biocym
  "bitter-babe": { m: ["Techno", "House"], s: ["Guaracha", "Breakbeat"], src: "research" }, // Bitter Babe
  "bjork": { m: ["Techno"], s: ["Experimental", "IDM", "Leftfield"], src: "discogs" }, // Björk
  "bjorn-mulik": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Progressive House"], src: "discogs" }, // Björn Mulik
  "black-coffee": { m: ["House"], s: ["Afro House", "Deep House"], src: "research" }, // Black Coffee
  "black-sun-empire": { m: ["Drum & Bass"], s: ["Dubstep", "Neurofunk"], src: "discogs+wikidata" }, // Black Sun Empire
  "blackburn-aeros": { m: ["Hardstyle"], s: [], src: "discogs" }, // Blackburn & Aeros
  "blackhaine": { m: ["Techno"], s: ["Experimental", "Grime", "Industrial"], src: "discogs" }, // Blackhaine
  "blanke": { m: ["Drum & Bass", "Techno", "EDM"], s: ["Dubstep", "Ambient"], src: "discogs" }, // Blanke
  "blanko": { m: ["Drum & Bass"], s: [], src: "research" }, // Blanko
  "blasha-allatt": { m: ["Techno", "House"], s: ["Electro"], src: "research" }, // Blasha & Allatt
  "blasterjaxx": { m: ["EDM", "House"], s: ["Big Room", "Electro House"], src: "research" }, // Blasterjaxx
  "blastoyz": { m: ["Psytrance", "Trance"], s: ["Full-On", "Progressive Trance"], src: "research" }, // Blastoyz
  "blawan": { m: ["Techno"], s: ["Industrial Techno"], src: "research" }, // Blawan
  "blnk": { m: ["Hard Techno"], s: [], src: "discogs" }, // BLNK
  "blond-ish": { m: ["House", "Techno"], s: ["Melodic House", "Afro House", "Organic House"], src: "research" }, // Blond:ish
  "bloody-mary": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno"], src: "research" }, // Bloody Mary
  "bob-sinclar": { m: ["House", "EDM"], s: ["Electro House", "French House", "Hip House"], src: "discogs+last.fm+musicbrainz" }, // Bob Sinclar
  "bobby-6-killa": { m: ["Drum & Bass"], s: [], src: "research" }, // Bobby 6 Killa
  "bomel": { m: ["House", "Techno"], s: ["Melodic Techno", "Melodic House"], src: "research" }, // Bomel
  "bon-entendeur": { m: ["House"], s: ["Disco", "Nu-Disco", "French Touch"], src: "research" }, // Bon Entendeur
  "bontan": { m: ["House"], s: ["Tech House", "Deep House", "Tribal House"], src: "discogs" }, // Bontan
  "bonzai-all-stars": { m: ["Trance", "Techno"], s: ["Electro", "Hard Trance", "Tech Trance"], src: "discogs" }, // Bonzai All Stars
  "border-one": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // Border One
  "bored-bouddha": { m: ["Techno"], s: ["Minimal Techno", "Melodic Techno"], src: "research" }, // Bored Bouddha
  "borgore": { m: ["EDM"], s: ["Dubstep"], src: "research" }, // Borgore
  "boris-brejcha": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Boris Brejcha
  "boss-priester": { m: ["House"], s: ["Tech House", "Minimal Techno", "Speed Garage"], src: "discogs" }, // Boss Priester
  "boston-bun": { m: ["House"], s: ["Electro", "Electro House", "Tech House"], src: "discogs" }, // Boston Bun
  "bou": { m: ["Drum & Bass"], s: ["Jump-Up"], src: "research" }, // Bou
  "bovski": { m: ["House", "Techno"], s: ["UK Garage", "Hypertechno", "Eurodance"], src: "research" }, // BOVSKI
  "bow-miller": { m: ["House"], s: ["Slow House", "Deep House", "Organic House"], src: "research" }, // Bow Miller
  "boycot": { m: ["Drum & Bass"], s: [], src: "research" }, // Boycot
  "boys-noize": { m: ["Techno", "House", "Acid Techno"], s: ["Electro"], src: "research" }, // Boys Noize
  "bradley-zero": { m: ["House"], s: ["Deep House", "Disco", "Broken Beat"], src: "research" }, // Bradley Zero
  "brainrape": { m: ["Hardcore"], s: ["Industrial"], src: "discogs" }, // Brainrape
  "break": { m: ["Drum & Bass"], s: ["Disco"], src: "discogs" }, // Break
  "breaze": { m: ["EDM"], s: ["Hypertechno"], src: "research" }, // Breaze
  "bredren": { m: ["Drum & Bass"], s: [], src: "research" }, // Bredren
  "brennan-heart": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Brennan Heart
  "brent-honey": { m: ["Techno", "Trance"], s: ["Hardgroove", "Hard House"], src: "research" }, // Brent Honey
  "brina-knauss": { m: ["Techno", "House"], s: ["Progressive House"], src: "discogs" }, // Brina Knauss
  "broiler": { m: ["House", "EDM"], s: ["Electro House", "Progressive House"], src: "discogs+wikidata" }, // Broiler
  "brokenchord": { m: ["Techno", "Drum & Bass"], s: ["Dubstep", "IDM", "Experimental"], src: "discogs" }, // Brokenchord
  "brooklyn-bounce": { m: ["Trance", "House", "Hardstyle"], s: ["Hard Trance", "Hands Up", "Euro House"], src: "research" }, // Brooklyn Bounce
  "bt": { m: ["Techno", "Trance", "House"], s: ["Progressive House", "Breakbeat", "Electronica"], src: "discogs+wikidata" }, // BT
  "bufiman": { m: ["House", "Techno"], s: ["Breakbeat", "Disco", "Leftfield"], src: "discogs" }, // Bufiman
  "bulletproof": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Bulletproof
  "buraka-som-sistema": { m: ["Techno"], s: ["Breakbeat"], src: "discogs+wikidata" }, // Buraka Som Sistema
  "burr-oak": { m: ["Drum & Bass"], s: ["Bassline", "Downtempo", "Halftime"], src: "discogs" }, // Burr Oak
  "busy-p": { m: ["House"], s: ["Electro", "French House"], src: "research" }, // Busy P
  "buunshin": { m: ["Drum & Bass"], s: ["Halftime", "Dubstep"], src: "research" }, // Buunshin
  "buzzfuzz": { m: ["Hardcore"], s: ["Gabber", "Happy Hardcore"], src: "research" }, // Buzzfuzz
  "byorn": { m: ["Hard Techno"], s: [], src: "discogs" }, // BYORN
  "caiva": { m: ["Techno", "Trance"], s: [], src: "discogs" }, // Caiva
  "call-super": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno", "Ambient"], src: "research" }, // Call Super
  "callush": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno", "Schranz", "Hardgroove"], src: "research" }, // Callush
  "calvin-clarke": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Calvin Clarke
  "calvin-harris": { m: ["House", "EDM"], s: ["Nu-Disco", "Disco", "Electro House"], src: "discogs+last.fm+musicbrainz" }, // Calvin Harris
  "camelphat": { m: ["House"], s: ["Tech House", "Melodic House"], src: "research" }, // CamelPhat
  "camo-krooked": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs" }, // Camo & Krooked
  "canelle-doublekick": { m: ["Trance", "Techno"], s: ["Hard House", "Makina", "Ghettotech"], src: "research" }, // Canelle Doublekick
  "cannibal-cooking-club": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Cannibal Cooking Club
  "cara-elizabeth": { m: ["Hard Techno", "Trance"], s: ["Hard Trance"], src: "research" }, // Cara Elizabeth
  "caribou": { m: ["Techno"], s: ["Experimental", "Leftfield", "Electro"], src: "discogs" }, // Caribou
  "carista": { m: ["Techno", "House"], s: ["Breakbeat", "Ambient", "Downtempo"], src: "discogs" }, // Carista
  "carl-cox": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Carl Cox
  "carl-craig": { m: ["Techno", "House"], s: ["Detroit Techno"], src: "research" }, // Carl Craig
  "carl-dutt": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Carl Dutt
  "carl-h": { m: ["House"], s: ["UK Garage"], src: "discogs" }, // Carl H
  "carl-stone": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Carl Stone
  "carla-schmitt": { m: ["Techno"], s: [], src: "discogs" }, // Carla Schmitt
  "carlita": { m: ["House", "Techno"], s: [], src: "research" }, // Carlita
  "carly-zeng": { m: ["House", "Techno"], s: ["Tribal House", "Progressive House", "Minimal Techno"], src: "research" }, // Carly Zeng
  "casa-mata": { m: ["House", "Techno"], s: ["Afro House", "Melodic House"], src: "research" }, // Casa Mata
  "cassie-raptor": { m: ["Techno", "Trance"], s: ["Hard Trance", "Breakbeat", "IDM"], src: "discogs" }, // Cassie Raptor
  "cassius": { m: ["House"], s: ["French House", "Disco"], src: "research" }, // Cassius
  "cassy": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "discogs" }, // Cassy
  "cc-disco": { m: ["House"], s: ["Disco", "Nu-Disco", "Balearic"], src: "research" }, // CC:DISCO!
  "ccl": { m: ["Techno", "Drum & Bass"], s: ["Bass Music", "Breakbeat", "Dubstep"], src: "discogs" }, // CCL
  "cedex-higher-underground": { m: ["Drum & Bass"], s: [], src: "research" }, // Cedex & Higher Underground
  "cedric": { m: ["Techno", "House"], s: ["Melodic House", "Afro House"], src: "research" }, // Cédric
  "cera-khin": { m: ["Techno"], s: ["Ambient", "Experimental", "Electro"], src: "discogs" }, // Cera Khin
  "cerj": { m: ["Techno", "House"], s: ["Melodic Techno", "Melodic House"], src: "research" }, // Cerj
  "chain-reaction": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Chain Reaction
  "chaos-project": { m: ["Hardcore"], s: [], src: "discogs" }, // Chaos Project
  "charlie-sparks": { m: ["Techno", "Hard Techno"], s: ["Hard Trance"], src: "discogs" }, // Charlie Sparks
  "charlotte-de-witte": { m: ["Techno"], s: ["Minimal Techno", "Peak Time Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Charlotte de Witte
  "charlotte-preckler": { m: ["Hard Techno"], s: ["Bounce"], src: "research" }, // Charlotte Preckler
  "charly-lownoise": { m: ["Hardcore", "Trance", "Hardstyle"], s: ["Happy Hardcore", "Hard Trance", "Gabber"], src: "discogs" }, // Charly Lownoise
  "chase-status": { m: ["Drum & Bass"], s: ["Dubstep", "Breakbeat", "Grime"], src: "discogs+wikidata" }, // Chase & Status
  "chelina-manuhutu": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Chelina Manuhutu
  "chicane": { m: ["Trance", "House"], s: ["Ambient", "Downtempo"], src: "research" }, // Chicane
  "chlar": { m: ["Techno"], s: ["Minimal Techno", "Tech Trance"], src: "discogs+musicbrainz" }, // Chlär
  "chloe": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // CHLOE
  "chloe-caillet": { m: ["House"], s: ["Bassline", "Breakbeat", "Deep House"], src: "discogs+musicbrainz" }, // Chloé Caillet
  "chopper": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Chopper
  "chouhal": { m: ["Techno", "Hard Techno"], s: [], src: "research" }, // chouhal
  "chris-avantgarde": { m: ["House", "Techno"], s: ["Progressive House", "Electro", "Tech House"], src: "discogs" }, // Chris Avantgarde
  "chris-liebing": { m: ["Techno", "Hard Techno"], s: ["Schranz", "Minimal Techno", "Tech House"], src: "research" }, // Chris Liebing
  "chris-rinox": { m: ["Hard Techno", "Techno"], s: ["Minimal Techno"], src: "research" }, // Chris Rinox
  "chris-stussy": { m: ["House"], s: ["Deep House"], src: "discogs+last.fm" }, // Chris Stussy
  "christian-loffler": { m: ["House", "Techno"], s: ["Deep House", "Ambient", "Downtempo"], src: "research" }, // Christian Löffler
  "christine-benz": { m: ["Techno", "House"], s: ["Minimal Techno", "Dub Techno", "Tech House"], src: "discogs" }, // Christine Benz
  "chuquimamani-condori": { m: [], s: [], src: "hors-perimetre" }, // Chuquimamani-Condori
  "chus-ceballos": { m: ["House"], s: ["Tribal House", "Progressive House", "Tech House"], src: "discogs" }, // Chus & Ceballos
  "chz": { m: ["Techno", "Hardcore"], s: ["Breakbeat"], src: "discogs" }, // CHZ
  "ciaran-mcauley": { m: ["Trance"], s: ["Progressive Trance"], src: "discogs" }, // Ciaran McAuley
  "cinthie": { m: ["House", "Techno"], s: ["Deep House", "UK Garage"], src: "research" }, // Cinthie
  "circadian": { m: ["Drum & Bass"], s: [], src: "research" }, // Circadian
  "clank-maider": { m: ["Drum & Bass"], s: [], src: "discogs" }, // Clank & Maider
  "clara-cuve": { m: ["Techno"], s: ["Breakbeat", "Jungle", "Hardgroove"], src: "research" }, // Clara Cuvé
  "claudio-prc": { m: ["Techno"], s: ["Ambient", "Deep Techno", "Experimental"], src: "discogs" }, // Claudio PRC
  "cleric": { m: ["Techno"], s: ["Experimental", "Ambient", "Industrial"], src: "discogs" }, // Cleric
  "closing": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Closing
  "cloudy": { m: ["Techno"], s: ["Dub Techno", "Ambient"], src: "discogs" }, // Cloudy
  "cobrah": { m: ["EDM", "House"], s: ["Electropop", "Hip House"], src: "wikidata" }, // Cobrah
  "code-black": { m: ["Hardstyle"], s: [], src: "wikidata" }, // Code Black
  "colette": { m: ["House"], s: ["Deep House", "Electro"], src: "research" }, // Colette
  "colin-benders": { m: ["Techno"], s: [], src: "research" }, // Colin Benders
  "complex": { m: ["Hardstyle"], s: [], src: "research" }, // Complex
  "comrade-winston": { m: ["Techno"], s: [], src: "discogs" }, // Comrade Winston
  "coone": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "research" }, // Coone
  "corentin-mab": { m: ["House"], s: ["Deep House", "Tech House", "Disco"], src: "research" }, // Corentin Mab
  "cosmic-gate": { m: ["Trance"], s: [], src: "research" }, // Cosmic Gate
  "courtesy": { m: ["Techno", "Trance"], s: ["Electro"], src: "research" }, // Courtesy
  "craig-connelly": { m: ["Trance"], s: ["Progressive Trance"], src: "discogs" }, // Craig Connelly
  "craig-richards": { m: ["Techno", "House"], s: ["Tech House", "Electro", "Minimal Techno"], src: "discogs" }, // Craig Richards
  "crazy-p": { m: ["House", "Techno"], s: ["Deep House", "Disco", "Downtempo"], src: "wikidata" }, // Crazy P
  "creeds": { m: ["Hardcore", "Techno", "Hardstyle"], s: ["Electro", "Frenchcore"], src: "discogs+wikidata" }, // Creeds
  "cristoph": { m: ["House"], s: ["Progressive House", "Melodic House", "Tech House"], src: "research" }, // Cristoph
  "cross-the-fingers": { m: ["Drum & Bass"], s: [], src: "research" }, // Cross The Fingers
  "crypsis": { m: ["Hardstyle"], s: [], src: "discogs" }, // Crypsis
  "crystallmess": { m: ["Techno", "Drum & Bass"], s: ["Bass Music", "IDM", "Footwork"], src: "discogs" }, // Crystallmess
  "cuba": { m: ["Techno"], s: ["Big Beat", "Downtempo", "Trip-Hop"], src: "discogs" }, // Cuba
  "current-value": { m: ["Drum & Bass"], s: ["Darkstep"], src: "discogs+wikidata" }, // Current Value
  "curses": { m: ["Techno", "House"], s: ["Italo Disco", "New Beat", "EBM"], src: "research" }, // Curses!
  "cyber": { m: ["Techno", "Hardstyle"], s: ["Electro", "Italo Disco", "EBM"], src: "discogs" }, // Cyber
  "cynthia-spiering": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Hardgroove"], src: "research" }, // Cynthia Spiering
  "d-block-s-te-fan": { m: ["Hardstyle", "EDM"], s: ["Electro House", "Happy Hardcore"], src: "discogs+musicbrainz" }, // D-Block & S-te-Fan
  "d-fence": { m: ["Hardcore"], s: ["Euro House", "Jumpstyle"], src: "discogs" }, // D-Fence
  "d-frek": { m: ["Hardcore"], s: ["Frenchcore"], src: "research" }, // D-Frek
  "d-razor": { m: ["Hardcore"], s: [], src: "research" }, // D-Razor
  "d-sturb": { m: ["Hardstyle"], s: [], src: "discogs" }, // D-Sturb
  "d-tiffany": { m: ["Techno"], s: ["Deep House", "Breakbeat", "Ambient"], src: "discogs+wikidata" }, // D. Tiffany
  "d-trich": { m: ["Drum & Bass"], s: ["Jungle", "UK Garage", "Dubstep"], src: "research" }, // D-Trich
  "da-i-freyr": { m: [], s: [], src: "hors-perimetre" }, // Daði Freyr
  "da-tweekaz": { m: ["Hardstyle"], s: ["Euphoric Hardstyle", "Happy Hardcore"], src: "research" }, // Da Tweekaz
  "daft-funk-live": { m: ["House"], s: ["French House", "Electro", "Disco"], src: "research" }, // Daft Funk Live
  "daichi-wada": { m: ["Techno"], s: ["Electro", "Breakbeat", "Industrial Techno"], src: "research" }, // Daichi Wada
  "damian-lazarus": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Melodic House"], src: "research" }, // Damian Lazarus
  "damien-rk": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Frenchcore", "Hard Trance"], src: "research" }, // Damien RK
  "dan-bono": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Dan Bono
  "dan-haward": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Dan Haward
  "dan-shake": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Dan Shake
  "dana-ruh": { m: ["House", "Techno"], s: ["Minimal Techno", "Deep House", "Tech House"], src: "discogs" }, // Dana Ruh
  "daniel-avery": { m: ["Techno", "Acid Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Daniel Avery
  "danke-al": { m: ["Techno", "Acid Techno"], s: ["Hard Trance", "Rave"], src: "research" }, // Danke Al
  "danou-p": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Danou P
  "danth": { m: ["House", "EDM", "Hardstyle"], s: ["Future House", "Big Room"], src: "research" }, // Danth
  "daphni": { m: ["House", "Techno"], s: ["Leftfield", "Disco", "Experimental"], src: "discogs" }, // Daphni
  "daria-kolosova": { m: ["Techno", "Hard Techno"], s: ["Breakbeat", "Electro", "Jungle"], src: "research" }, // Daria Kolosova
  "darin-epsilon": { m: ["Techno", "House"], s: ["Progressive House", "Tech House", "Deep House"], src: "discogs+wikidata" }, // Darin Epsilon
  "dark-e": { m: ["Hardstyle", "Trance"], s: ["Jumpstyle", "Hard Trance", "Hard House"], src: "discogs" }, // Dark-E
  "dark-headz": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Dark Headz
  "darkcontroller": { m: ["Hardcore"], s: ["Gabber", "Industrial"], src: "discogs" }, // Darkcontroller
  "darkside": { m: ["House"], s: ["Downtempo", "Left-field House", "Neo-psychedelia"], src: "research" }, // DARKSIDE
  "darrell-pulse": { m: ["Techno"], s: [], src: "research" }, // Darrell Pulse
  "darren-emerson": { m: ["Techno", "House"], s: ["Tech House", "Progressive House"], src: "discogs+wikidata" }, // Darren Emerson
  "dart": { m: ["House"], s: ["Hard House", "Hard Trance"], src: "research" }, // DART
  "darude": { m: ["Trance"], s: ["Hard Trance"], src: "discogs+wikidata" }, // Darude
  "darwin": { m: ["Drum & Bass", "Techno"], s: ["Dubstep", "Jungle", "Breakbeat"], src: "research" }, // Darwin
  "das-beat": { m: [], s: [], src: "hors-perimetre" }, // Das Beat
  "dasha-rush": { m: ["Techno"], s: ["Experimental", "Ambient", "Minimal Techno"], src: "discogs" }, // Dasha Rush
  "dave-clarke": { m: ["Techno"], s: ["Electro"], src: "research" }, // Dave Clarke
  "dave-lambert": { m: ["House"], s: ["Tech House", "Deep House", "Melodic House"], src: "research" }, // Dave Lambert
  "dave-replay": { m: ["House", "EDM"], s: ["Electro House", "Big Room"], src: "research" }, // Dave Replay
  "david-guetta": { m: ["EDM", "House"], s: ["Electro House", "Progressive House"], src: "research" }, // David Guetta
  "david-morales": { m: ["House"], s: ["Nu-Disco"], src: "discogs+wikidata" }, // David Morales
  "davyboi": { m: ["Trance"], s: ["Hard Dance", "Eurodance", "Hard House"], src: "research" }, // Davyboi
  "dax-j": { m: ["Techno", "Acid Techno", "Drum & Bass"], s: ["Jungle", "Detroit Techno", "Electro"], src: "discogs+last.fm+musicbrainz" }, // Dax J
  "deadly-guns": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Deadly Guns
  "dean-turnley": { m: ["Techno", "House"], s: ["Bass Music", "Deep House", "Deep Techno"], src: "discogs" }, // Dean Turnley
  "debit": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Debit
  "deborah-de-luca": { m: ["Techno"], s: ["Peak Time Techno"], src: "discogs+musicbrainz" }, // Deborah De Luca
  "decode": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Decode
  "deena-abdelwahed": { m: ["Techno"], s: ["Experimental", "IDM", "Electro"], src: "discogs" }, // Deena Abdelwahed
  "deetox": { m: ["Hardstyle"], s: [], src: "discogs" }, // Deetox
  "degos-re-done": { m: ["Hardstyle"], s: [], src: "discogs" }, // Degos & Re-Done
  "delff": { m: ["Drum & Bass"], s: ["Dubstep"], src: "research" }, // Delff
  "demi-kanon": { m: ["Hardstyle"], s: ["Downtempo"], src: "discogs" }, // Demi Kanon
  "demol": { m: ["Hard Techno", "Hardcore"], s: ["Uptempo"], src: "research" }, // Demol
  "denis-sulta": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Denis Sulta
  "dennis-cruz": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "research" }, // Dennis Cruz
  "dennis-ferrer": { m: ["House"], s: ["Deep House"], src: "discogs+wikidata" }, // Dennis Ferrer
  "derrick-carter": { m: ["House"], s: ["Deep House", "Tech House", "Disco"], src: "discogs" }, // Derrick Carter
  "desiree": { m: ["House"], s: ["Afro House", "Deep House"], src: "research" }, // Desiree
  "desiree-falessi": { m: ["Techno"], s: ["EBM", "Electro", "Leftfield"], src: "discogs" }, // Desirée Falessi
  "desolate-discotheque": { m: ["Techno"], s: ["EBM", "Electro", "Disco"], src: "research" }, // Desolate Discotheque
  "devin-wild": { m: ["Hardstyle"], s: [], src: "discogs" }, // Devin Wild
  "diamanda-galas": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Diamanda Galás
  "didz-mina": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk"], src: "research" }, // Didz & Mina
  "diffrent": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Diffrent
  "digital-punk": { m: ["Hardstyle"], s: [], src: "research" }, // Digital Punk
  "digitalism": { m: ["House", "Techno"], s: ["Electro", "Electro House", "Electroclash"], src: "research" }, // Digitalism
  "dijon": { m: [], s: [], src: "hors-perimetre" }, // Dijon
  "dillinja": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs+wikidata" }, // Dillinja
  "dimension": { m: ["Trance", "Drum & Bass"], s: ["Progressive Trance"], src: "discogs" }, // Dimension
  "dimitri-from-paris": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Dimitri From Paris
  "dimitri-vegas": { m: ["House", "EDM"], s: ["Electro House", "Progressive House"], src: "discogs" }, // Dimitri Vegas
  "dione": { m: ["Hardcore"], s: ["Gabber", "Uptempo"], src: "research" }, // Dione
  "dirty-doering": { m: ["House"], s: ["Tech House", "Deep House", "Progressive House"], src: "discogs" }, // Dirty Doering
  "disclosure": { m: ["House"], s: ["UK Garage", "Breakbeat", "Deep House"], src: "discogs+musicbrainz" }, // Disclosure
  "dissolver": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Dissolver
  "dither": { m: ["Hardcore", "Techno"], s: ["Gabber", "IDM", "Ambient"], src: "discogs" }, // Dither
  "divorce-from-new-york": { m: ["House", "Techno"], s: ["Broken Beat", "Disco", "Downtempo"], src: "discogs" }, // Divorce From New York
  "dixon": { m: ["House", "Techno"], s: ["Deep House", "Melodic House"], src: "research" }, // Dixon
  "dj-aligator": { m: ["EDM"], s: ["Eurodance", "Electro House"], src: "research" }, // DJ Aligator
  "dj-assault": { m: ["Techno"], s: ["Electro", "Ghettotech"], src: "discogs" }, // DJ Assault
  "dj-bone": { m: ["Techno"], s: ["Detroit Techno"], src: "discogs+wikidata" }, // DJ Bone
  "dj-boring": { m: ["House"], s: ["Deep House", "Breakbeat"], src: "discogs" }, // DJ Boring
  "dj-breakfast": { m: ["Drum & Bass"], s: ["Jungle", "Breakbeat"], src: "research" }, // DJ Breakfast
  "dj-caline": { m: ["Trance", "Hard Techno"], s: ["Hard Trance", "Bounce"], src: "research" }, // DJ Caline
  "dj-camslut": { m: ["Hardcore"], s: ["Breakcore", "Uptempo", "Speedcore"], src: "research" }, // DJ CAMSLUT
  "dj-chuckie": { m: ["House", "EDM"], s: ["Electro House", "Tech House", "Electro"], src: "discogs" }, // DJ Chuckie
  "dj-cosworth": { m: ["House"], s: ["UK Garage", "Speed Garage", "Tech House"], src: "research" }, // DJ Cosworth
  "dj-cringey": { m: ["Techno", "Acid Techno"], s: ["Hypertechno", "Hard House", "EBM"], src: "research" }, // DJ Cringey
  "dj-cruse": { m: ["Techno", "House"], s: ["Electro", "Tech House"], src: "discogs" }, // DJ Cruse
  "dj-dag": { m: ["Trance"], s: ["Progressive Trance", "Progressive House", "Hard Trance"], src: "discogs" }, // DJ Dag
  "dj-f-r-a-n-k": { m: ["House", "EDM"], s: ["Disco House", "Jumpstyle"], src: "research" }, // DJ F.R.A.N.K.
  "dj-firmeza": { m: ["Techno"], s: ["Breakbeat"], src: "discogs" }, // DJ Firmeza
  "dj-gee": { m: ["Hardcore", "House", "Trance"], s: ["Happy Hardcore", "Hard House", "Breakbeat"], src: "discogs" }, // DJ Gee
  "dj-gigola": { m: ["Techno"], s: ["Electro", "Downtempo", "Eurodance"], src: "discogs" }, // DJ Gigola
  "dj-hell": { m: ["Techno"], s: ["Electro", "Bass Music", "Gabber"], src: "discogs+wikidata" }, // DJ Hell
  "dj-hildegard": { m: ["House", "Techno"], s: ["Tech House"], src: "discogs" }, // DJ Hildegard
  "dj-hype": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs+wikidata" }, // DJ Hype
  "dj-isaac": { m: ["Hardstyle", "Hardcore"], s: ["Gabber"], src: "research" }, // DJ Isaac
  "dj-jean": { m: ["House", "Trance"], s: ["Euro House", "Hard House", "Hard Trance"], src: "discogs" }, // DJ Jean
  "dj-krush": { m: ["Techno"], s: ["Trip-Hop", "Experimental", "Downtempo"], src: "discogs" }, // DJ Krush
  "dj-lycox": { m: ["Techno", "House"], s: ["Breakbeat"], src: "discogs" }, // DJ Lycox
  "dj-masda": { m: ["Techno", "House"], s: ["Breakbeat", "Electro", "Minimal Techno"], src: "discogs" }, // DJ Masda
  "dj-mass": { m: ["House"], s: ["Tech House", "Disco", "Electro"], src: "research" }, // DJ Mass
  "dj-narciso": { m: ["House"], s: [], src: "discogs" }, // DJ Narciso
  "dj-nobu": { m: ["Techno"], s: ["Experimental", "Deep House", "Minimal Techno"], src: "discogs" }, // DJ Nobu
  "dj-paulette": { m: ["House"], s: ["Progressive House", "Garage House"], src: "discogs" }, // DJ Paulette
  "dj-plaisir": { m: ["Hardcore"], s: ["Frenchcore", "Gabber"], src: "research" }, // dj plaisir
  "dj-quicksilver": { m: ["Trance", "Techno"], s: ["Euro House", "Progressive House"], src: "discogs+wikidata" }, // DJ Quicksilver
  "dj-snake": { m: ["EDM", "House"], s: ["Moombahton", "Electro House"], src: "research" }, // DJ Snake
  "dj-tennis": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // DJ Tennis
  "dj-thera": { m: ["Hardstyle"], s: ["Hard Trance"], src: "discogs" }, // DJ Thera
  "dj-zinc": { m: ["Drum & Bass"], s: ["Jungle", "Breakbeat"], src: "discogs+wikidata" }, // DJ Zinc
  "djantrix": { m: ["Psytrance"], s: ["Progressive Trance"], src: "discogs" }, // Djantrix
  "djedjotronic": { m: ["Techno"], s: ["Electro"], src: "discogs" }, // Djedjotronic
  "djeff": { m: ["House"], s: ["Afro House", "Progressive House", "Deep House"], src: "discogs" }, // DJeff
  "djerry-c": { m: ["Techno", "House"], s: [], src: "research" }, // Djerry C
  "djrum": { m: ["Techno", "Drum & Bass"], s: ["Breakbeat", "Ambient", "Dubstep"], src: "research" }, // DjRUM
  "dom-dolla": { m: ["House"], s: ["Tech House", "Progressive House"], src: "research" }, // Dom Dolla
  "dombrance": { m: ["House", "Techno"], s: ["Electro", "Nu-Disco", "Disco"], src: "discogs" }, // Dombrance
  "domenique-dumont": { m: ["Techno"], s: ["Ambient", "Experimental", "Downtempo"], src: "discogs" }, // Domenique Dumont
  "don-diablo": { m: ["House", "EDM"], s: ["Future House", "Electro House", "Progressive House"], src: "research" }, // Don Diablo
  "donato-dozzy": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // Donato Dozzy
  "donis": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // Donis
  "dopplereffekt": { m: ["Techno"], s: ["Electro", "Experimental", "Ambient"], src: "discogs+wikidata" }, // Dopplereffekt
  "dorian-craft": { m: ["House"], s: ["Tech House", "Deep House", "Progressive House"], src: "research" }, // Dorian Craft
  "doudou-md": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Doudou MD
  "dr-banana": { m: ["House", "Techno"], s: ["Breakbeat", "UK Garage", "Electro"], src: "discogs" }, // Dr Banana
  "dr-donk": { m: ["Hardcore"], s: ["Hard House", "Jumpstyle"], src: "discogs" }, // Dr Donk
  "dr-donk-presents-zaagstep": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo", "Zaagstep", "Dubstep"], src: "research" }, // Dr. Donk presents Zaagstep
  "dr-peacock": { m: ["Hardcore"], s: ["Frenchcore"], src: "discogs+musicbrainz+wikidata" }, // Dr. Peacock
  "drea": { m: ["House"], s: ["Vocal House", "Afro House", "Bass House"], src: "research" }, // Drea
  "drumslave": { m: ["Drum & Bass"], s: [], src: "discogs" }, // Drumslave
  "dt43": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // DT43
  "dual-damage": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "discogs" }, // Dual Damage
  "dub-inc": { m: ["Drum & Bass", "House"], s: ["UK Garage"], src: "discogs" }, // Dub Inc
  "dubrunner": { m: ["Techno"], s: ["Breakbeat", "Dubstep"], src: "discogs" }, // Dubrunner
  "duke-dumont": { m: ["House", "EDM"], s: ["Deep House", "Tech House"], src: "research" }, // Duke Dumont
  "dumonde": { m: ["Trance"], s: ["Hard Trance"], src: "discogs" }, // Dumonde
  "dusky": { m: ["House", "Techno"], s: ["Deep House", "Tech House", "Breakbeat"], src: "research" }, // Dusky
  "dvaid": { m: ["Hard Techno"], s: [], src: "research" }, // Dvaid
  "dvs1": { m: ["Techno"], s: ["Minimal Techno", "Hardgroove"], src: "research" }, // DVS1
  "dwonji": { m: ["Drum & Bass"], s: [], src: "research" }, // Dwonji
  "dxnby": { m: ["House"], s: ["Tech House", "Deep House", "Speed Garage"], src: "discogs" }, // DXNBY
  "dyen": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno"], src: "discogs+musicbrainz" }, // DYEN
  "e-force": { m: ["Hardstyle"], s: [], src: "discogs" }, // E-Force
  "e-x-e-c-u-t-e": { m: ["Hardcore"], s: [], src: "research" }, // E.X.E.C.U.T.E
  "east-end-dubs": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "research" }, // East End Dubs
  "easttown": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Easttown
  "eats-everything": { m: ["House"], s: ["Tech House", "UK Garage"], src: "research" }, // Eats Everything
  "ecstatic": { m: ["Hardstyle"], s: ["Downtempo", "Leftfield"], src: "discogs" }, // Ecstatic
  "ed-rush-optical": { m: ["Drum & Bass"], s: ["Neurofunk", "Techstep", "Jungle"], src: "research" }, // Ed Rush & Optical
  "eelke-kleijn": { m: ["House"], s: ["Progressive House", "Deep House"], src: "discogs" }, // Eelke Kleijn
  "efdemin": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno", "Tech House"], src: "discogs" }, // Efdemin
  "eileen": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Eileen
  "einmusik": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Deep House"], src: "discogs" }, // Einmusik
  "einsturzende-neubauten": { m: ["Techno"], s: ["Industrial", "Experimental"], src: "discogs" }, // Einstürzende Neubauten
  "element": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Element
  "elemental": { m: ["Techno", "Drum & Bass"], s: ["Dubstep", "Ambient", "Downtempo"], src: "discogs" }, // Elemental
  "eli-brown": { m: ["House", "Techno"], s: ["Tech House"], src: "discogs" }, // Eli Brown
  "elias-mazian": { m: ["Techno", "House"], s: ["Electro", "Deep House", "Downtempo"], src: "discogs" }, // Elias Mazian
  "eliasz": { m: ["House", "Techno"], s: ["Tech House", "Melodic Techno"], src: "research" }, // Eliasz
  "elisa-do-brasil": { m: ["Drum & Bass"], s: ["Dubstep", "Jungle"], src: "discogs" }, // Elisa Do Brasil
  "eliza-rose": { m: ["House"], s: ["UK Garage"], src: "discogs" }, // Eliza Rose
  "ellen-allien": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+musicbrainz+wikidata" }, // Ellen Allien
  "elli-acula": { m: ["Techno"], s: ["Electro"], src: "discogs" }, // Elli Acula
  "ellia-jaya": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Ellia Jaya
  "elowinz": { m: ["Psytrance"], s: [], src: "discogs" }, // Elowinz
  "ely-oaks": { m: ["House", "EDM"], s: ["Tech House", "Dance-pop"], src: "research" }, // Ely Oaks
  "emilaki": { m: ["Drum & Bass"], s: ["Bass Music"], src: "research" }, // Emilaki
  "emiliana-torrini": { m: ["Techno", "House"], s: ["Downtempo"], src: "discogs" }, // Emilíana Torrini
  "emilija": { m: ["Techno", "Acid Techno"], s: ["Hard House", "Eurodance"], src: "research" }, // Emilija
  "emjie": { m: ["Techno", "House"], s: ["IDM", "Progressive House"], src: "discogs" }, // EMJIE
  "ems": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // EMS
  "endymion": { m: ["Hardcore", "Hardstyle"], s: ["Gabber"], src: "discogs" }, // Endymion
  "enrico-sangiuliano": { m: ["Techno"], s: ["Experimental", "Ambient", "Breakbeat"], src: "discogs+musicbrainz" }, // Enrico Sangiuliano
  "enzo-siragusa": { m: ["House"], s: ["Tech House"], src: "discogs+last.fm" }, // Enzo Siragusa
  "eptic": { m: ["Drum & Bass"], s: ["Dubstep", "Electro House"], src: "discogs" }, // Eptic
  "eric-cloutier": { m: ["Techno", "House"], s: ["Dub Techno", "Deep House", "Ambient"], src: "research" }, // Eric Cloutier
  "eric-prydz": { m: ["House"], s: ["Progressive House", "Tech House"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Eric Prydz
  "eris-drew": { m: ["House"], s: ["Breakbeat", "Rave", "Acid House"], src: "research" }, // Eris Drew
  "ernst-bobbie-de-rest": { m: [], s: [], src: "hors-perimetre" }, // Ernst, Bobbie & de rest
  "erol-alkan": { m: ["House", "Techno"], s: ["Acid House", "Electro", "Indie Dance"], src: "research" }, // Erol Alkan
  "eskei83": { m: ["Drum & Bass"], s: ["Dubstep", "Turntablism"], src: "research" }, // Eskei83
  "etienne-de-crecy": { m: ["House"], s: ["French House", "Electro House"], src: "research" }, // Etienne de Crécy
  "evertwo": { m: ["Techno"], s: ["Melodic Techno"], src: "research" }, // EverTwo
  "evil-activities": { m: ["Hardcore"], s: ["Gabber", "Mainstream Hardcore"], src: "research" }, // Evil Activities
  "evil-grimace": { m: ["Hardcore", "Hard Techno"], s: ["Gabber"], src: "discogs" }, // Evil Grimace
  "evissimax": { m: ["Hard Techno"], s: ["Ghetto Tech"], src: "research" }, // Evissimax
  "ewan-mcvicar": { m: ["House"], s: ["Tech House", "Breakbeat", "Speed Garage"], src: "research" }, // Ewan McVicar
  "ex-echo": { m: ["Psytrance", "Trance"], s: ["Progressive Trance", "Dub"], src: "research" }, // Ex-Echo
  "explorers-of-the-internet": { m: ["Drum & Bass", "Hardcore"], s: ["Dubstep", "Ambient", "Bass Music"], src: "discogs" }, // Explorers of the Internet
  "extrawelt": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "discogs" }, // Extrawelt
  "fabian-farell": { m: ["EDM", "House"], s: ["Future House", "Deep House", "Electro"], src: "research" }, // Fabian Farell
  "fadi-mohem": { m: ["Techno"], s: ["Dub Techno"], src: "research" }, // Fadi Mohem
  "faithless": { m: ["House", "Trance"], s: ["Trip-Hop"], src: "research" }, // Faithless
  "fakear": { m: ["EDM"], s: ["Downtempo", "Trip-Hop"], src: "research" }, // Fakear
  "fantasm": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "discogs+wikidata" }, // Fantasm
  "farflow": { m: ["Drum & Bass"], s: [], src: "discogs" }, // FarFlow
  "faster-horses": { m: ["Techno", "House"], s: ["UK Garage", "Hard House", "Jungle"], src: "research" }, // Faster Horses
  "fatboy-slim": { m: ["Techno"], s: ["Big Beat", "Breakbeat"], src: "discogs+wikidata" }, // Fatboy Slim
  "fatima-hajji": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "research" }, // Fatima Hajji
  "fava": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Jungle"], src: "research" }, // Fava
  "felix-fleer": { m: ["Techno", "House"], s: ["Breakbeat", "Tech House", "Electro"], src: "discogs" }, // Felix Fleer
  "felix-jaehn": { m: ["House", "EDM"], s: ["Tropical House", "Dance-pop"], src: "research" }, // Felix Jaehn
  "felix-krocher": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Peak Time Techno"], src: "research" }, // Felix Kröcher
  "fellatio": { m: [], s: [], src: "hors-perimetre" }, // Fellatio
  "fenim0re": { m: ["Techno", "Hard Techno"], s: [], src: "research" }, // FENIM0RE
  "fenimore": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Fenimore
  "feral": { m: ["Techno"], s: ["Deep Techno", "Dub Techno", "Tribal"], src: "research" }, // Feral
  "ferry-corsten": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Ferry Corsten
  "fiedel": { m: ["Techno"], s: ["Ambient", "Experimental", "Industrial"], src: "discogs" }, // Fiedel
  "finnebassen": { m: ["House"], s: ["Deep House", "Nu-Disco", "Tech House"], src: "research" }, // Finnebassen
  "fishbach": { m: [], s: [], src: "hors-perimetre" }, // Fishbach
  "fisher": { m: ["House"], s: ["Tech House"], src: "research" }, // Fisher
  "fjaak": { m: ["Techno", "Acid Techno"], s: ["Breakbeat", "Electro"], src: "research" }, // FJAAK
  "fleur-shore": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Fleur Shore
  "flits": { m: ["Techno"], s: [], src: "discogs" }, // Flits
  "floating-points": { m: ["House"], s: ["Dubstep", "Microhouse", "Progressive House"], src: "discogs+musicbrainz" }, // Floating Points
  "flora": { m: ["Techno"], s: ["Hypnotic Techno"], src: "research" }, // Flora
  "floxytek": { m: ["Hardcore"], s: ["Gabber", "Schranz"], src: "discogs" }, // Floxytek
  "flupke": { m: ["House", "Techno"], s: ["Synthwave", "Electro House", "Downtempo"], src: "research" }, // Flupke
  "flux-pavilion": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs" }, // Flux Pavilion
  "flymeon": { m: ["Hard Techno", "Acid Techno"], s: ["Rave"], src: "research" }, // Flymeon
  "folamour": { m: ["House"], s: ["Deep House", "Disco", "Nu-Disco"], src: "discogs" }, // Folamour
  "forbidden-fruit": { m: ["House"], s: ["Disco", "Electro", "Balearic"], src: "discogs" }, // Forbidden Fruit
  "four-tet": { m: ["Techno"], s: ["Electronica", "Downtempo", "IDM"], src: "discogs+musicbrainz+wikidata" }, // Four Tet
  "fox-stevenson": { m: ["Drum & Bass"], s: ["Dubstep", "Melodic Dubstep"], src: "research" }, // Fox Stevenson
  "francesco-del-garda": { m: ["House", "Techno"], s: ["Electro", "Deep House", "Garage House"], src: "discogs" }, // Francesco Del Garda
  "franck-vigroux": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Franck Vigroux
  "franco-cinelli": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "discogs" }, // Franco Cinelli
  "frank-maurel": { m: ["House", "Techno"], s: ["Tech House", "Tribal House", "Deep House"], src: "discogs" }, // Frank Maurel
  "frankey-sandrino": { m: ["House", "Techno"], s: ["Deep House", "Tech House", "Progressive House"], src: "research" }, // Frankey & Sandrino
  "franky-kloeck": { m: ["Trance", "House"], s: ["Hard Trance", "Hard House", "Jumpstyle"], src: "research" }, // Franky Kloeck
  "franky-rizardo": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Franky Rizardo
  "franky-wah": { m: ["House", "Techno"], s: ["Progressive House", "Breakbeat", "Tech House"], src: "discogs" }, // Franky Wah
  "franz-scala": { m: ["House", "Techno"], s: ["Italo Disco", "Electro", "Nu-Disco"], src: "discogs" }, // Franz Scala
  "fred-p": { m: ["Techno", "House"], s: ["Deep House", "Ambient"], src: "discogs" }, // Fred P
  "fred-v": { m: ["Drum & Bass"], s: ["Progressive House"], src: "discogs+wikidata" }, // Fred V
  "freddi": { m: ["Trance", "House"], s: ["Hard House", "Progressive House"], src: "research" }, // Freddi
  "freddy-k": { m: ["Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Freddy K
  "frederic": { m: ["Techno", "Hard Techno"], s: ["Peak Time Techno", "Melodic Techno"], src: "research" }, // Frederic.
  "freedom-fighters": { m: ["Psytrance", "Trance"], s: ["Progressive Trance"], src: "discogs" }, // Freedom Fighters
  "frinda-di-lanco": { m: ["House"], s: ["Disco", "Balearic", "Downtempo"], src: "research" }, // Frinda di Lanco
  "frits-wentink": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Frits Wentink
  "front-de-cadeaux": { m: ["House", "Techno"], s: ["Downtempo", "Tech House"], src: "discogs" }, // Front de Cadeaux
  "funk-tribu": { m: ["Hard Techno", "Techno"], s: ["Hard Trance", "Hardgroove"], src: "research" }, // Funk Tribu
  "furax": { m: ["Hardstyle", "Techno"], s: ["Jumpstyle"], src: "discogs" }, // Furax
  "furyan": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Furyan
  "future-666": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno", "Schranz"], src: "research" }, // Future.666
  "futuregrapher": { m: ["Techno"], s: ["Ambient", "IDM"], src: "discogs" }, // Futuregrapher
  "fx-31": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // FX-31
  "g-ha": { m: ["House", "Techno"], s: ["Disco", "Micro House"], src: "research" }, // g-HA
  "g-ha-olanskii": { m: ["House", "Techno"], s: ["Disco"], src: "research" }, // g-HA & Olanskii
  "gabber-eleganza": { m: ["Techno", "Hardcore"], s: ["Experimental", "Gabber", "Ambient"], src: "discogs" }, // Gabber Eleganza
  "gabriel-munoz": { m: ["House"], s: ["Speed Garage", "UK Garage"], src: "discogs" }, // Gabriel Muñoz
  "gabry-ponte": { m: ["EDM", "House"], s: ["Eurodance", "Italo Dance"], src: "research" }, // Gabry Ponte
  "gaiko": { m: ["Techno"], s: ["Ambient", "Downtempo", "IDM"], src: "discogs" }, // Gaiko
  "gaiveu": { m: ["Hard Techno", "Techno"], s: [], src: "research" }, // Gaiveu
  "galrav": { m: ["Hard Techno"], s: ["Hard Dance"], src: "research" }, // Galrav
  "gandoolf": { m: ["Hard Techno", "Hardcore"], s: ["Hardgroove", "Schranz", "Uptempo"], src: "research" }, // Gandoolf
  "gaskin": { m: ["House"], s: [], src: "research" }, // Gaskin
  "genesi": { m: ["House", "Techno"], s: ["Tech House"], src: "discogs" }, // Genesi
  "georg": { m: ["Techno"], s: [], src: "research" }, // Georg
  "gerd-janson": { m: ["House", "Techno"], s: ["Disco"], src: "research" }, // Gerd Janson
  "gezellige-uptempo": { m: ["Hardcore"], s: [], src: "discogs" }, // Gezellige Uptempo
  "ghostface": { m: ["Hard Techno", "Hardcore"], s: ["Schranz", "Uptempo"], src: "research" }, // Ghostface
  "gigi-fm": { m: ["Techno"], s: ["Ambient", "Deep Techno", "Experimental"], src: "discogs" }, // GiGi FM
  "gina-beldam": { m: ["Techno"], s: [], src: "discogs" }, // Gina Beldam
  "gioray": { m: ["Techno"], s: ["Breakbeat", "Deep Techno", "IDM"], src: "discogs" }, // gioray
  "gissa": { m: ["House"], s: ["Tech House", "Big Room"], src: "research" }, // Gissa
  "giuseppe-ottaviani": { m: ["Trance"], s: ["Progressive Trance", "Tech Trance", "Uplifting Trance"], src: "discogs+wikidata" }, // Giuseppe Ottaviani
  "gladde-paling": { m: ["Hardcore", "Drum & Bass"], s: ["Bassline", "Gabber", "Happy Hardcore"], src: "discogs" }, // gladde paling
  "globul": { m: ["Techno", "Acid Techno"], s: ["Detroit Techno", "Tribal Techno"], src: "research" }, // Globul
  "gms": { m: ["Psytrance"], s: ["Goa Trance"], src: "discogs+wikidata" }, // GMS
  "gogol-bordello": { m: [], s: [], src: "hors-perimetre" }, // Gogol Bordello
  "gold-panda": { m: ["House"], s: ["Downtempo", "IDM", "Trip-Hop"], src: "research" }, // Gold Panda
  "goldi": { m: ["Techno", "Hard Techno", "Trance"], s: ["Hardgroove"], src: "research" }, // Goldi
  "goldie": { m: ["Drum & Bass", "Techno"], s: ["Downtempo", "Electronica", "Jungle"], src: "discogs+musicbrainz" }, // Goldie
  "golpe": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "research" }, // Golpe
  "gow-fast": { m: ["Hard Techno", "Techno"], s: ["Hardgroove"], src: "research" }, // Gow Fast
  "gpf": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo"], src: "research" }, // GPF
  "grace-dahl": { m: ["Techno"], s: ["Peak Time Techno", "Hypnotic Techno"], src: "research" }, // Grace Dahl
  "greekazo": { m: [], s: [], src: "hors-perimetre" }, // Greekazo
  "groove-armada": { m: ["House"], s: ["Big Beat", "Downtempo", "Trip-Hop"], src: "research" }, // Groove Armada
  "groove-fm": { m: ["House"], s: ["Garage House", "Deep House", "Tech House"], src: "discogs" }, // Groove FM
  "groove-raiderz": { m: ["Techno"], s: [], src: "research" }, // Groove Raiderz
  "grouper": { m: [], s: [], src: "hors-perimetre" }, // Grouper
  "gui-boratto": { m: ["Techno"], s: ["Minimal Techno"], src: "wikidata" }, // Gui Boratto
  "gusgus": { m: ["Techno", "House"], s: ["Electronica"], src: "discogs+wikidata" }, // GusGus
  "guy-gerber": { m: ["Techno"], s: [], src: "wikidata" }, // Guy Gerber
  "gyrofield": { m: ["Drum & Bass", "Techno"], s: ["Jungle", "Breakbeat", "Dubstep"], src: "research" }, // gyrofield
  "habstrakt": { m: ["Drum & Bass", "House"], s: ["Bass House", "Dubstep"], src: "wikidata" }, // Habstrakt
  "hadone": { m: ["Techno"], s: ["Breakbeat", "IDM", "Industrial"], src: "discogs" }, // Hadone
  "halo": { m: ["EDM", "House"], s: ["Big Room", "Progressive House"], src: "research" }, // Halō
  "halvmane": { m: ["Drum & Bass"], s: ["Jungle", "UK Garage", "Dubstep"], src: "research" }, // Halvmåne
  "hamdi": { m: ["Drum & Bass"], s: ["Dubstep", "UK Garage", "Bassline"], src: "research" }, // Hamdi
  "hannah-doc": { m: ["House"], s: ["Tech House"], src: "research" }, // Hannah Doc
  "hannah-laing": { m: ["Trance", "House", "Techno"], s: ["Hard House"], src: "discogs+wikidata" }, // Hannah Laing
  "hanson-schrempf": { m: ["Techno", "Hard Techno"], s: ["Schranz"], src: "discogs" }, // Hanson & Schrempf
  "hard-driver": { m: ["Hardstyle"], s: [], src: "discogs" }, // Hard Driver
  "hardstyle-mafia": { m: ["Hardstyle"], s: [], src: "discogs" }, // Hardstyle Mafia
  "hardwell": { m: ["EDM", "House"], s: ["Big Room", "Progressive House", "Electro House"], src: "research" }, // Hardwell
  "harris-ford": { m: ["Hardstyle", "EDM"], s: ["Electro House", "Electro"], src: "discogs" }, // Harris & Ford
  "harry-nash": { m: ["Trance", "Techno"], s: ["Hard Trance"], src: "research" }, // Harry Nash
  "hashashin": { m: ["Techno"], s: ["Industrial Techno"], src: "research" }, // Hashashin
  "hausgardian": { m: ["Techno", "House"], s: ["Tech House", "Deep House"], src: "research" }, // Hausgardian
  "hayley-zalassi": { m: ["House", "Techno"], s: [], src: "research" }, // Hayley Zalassi
  "hbz": { m: ["Hardstyle", "Psytrance", "Trance"], s: ["Hard Trance"], src: "discogs+wikidata" }, // HBz
  "hdn": { m: ["Drum & Bass"], s: [], src: "research" }, // HDN
  "headbanger": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Headbanger
  "headhunter": { m: ["Techno", "Drum & Bass"], s: ["Dubstep", "Jungle", "Footwork"], src: "research" }, // Headhunter
  "hector-oaks": { m: ["Techno"], s: ["Hardgroove"], src: "research" }, // Héctor Oaks
  "hedemann": { m: ["Techno"], s: ["Hardgroove", "Peak Time Techno"], src: "research" }, // Hedemann
  "hedex": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // Hedex
  "helena-hauff": { m: ["Techno"], s: ["Ambient", "Electro"], src: "discogs+musicbrainz" }, // Helena Hauff
  "helena-lauwaert": { m: ["House", "Techno"], s: ["Hard Trance", "Speed House", "Hard Dance"], src: "research" }, // Helena Lauwaert
  "hendrik-stein": { m: ["House", "Techno"], s: ["Melodic House"], src: "research" }, // Hendrik Stein
  "henning-baer": { m: ["Techno"], s: ["Electro", "Ambient", "EBM"], src: "discogs" }, // Henning Baer
  "hercules-love-affair": { m: ["House"], s: ["Disco"], src: "wikidata" }, // Hercules & Love Affair
  "hermetica": { m: ["Techno"], s: ["Detroit Techno", "Electro"], src: "research" }, // Hermetica
  "hidde-van-wee": { m: ["House"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Hidde Van Wee
  "hilight-tribe": { m: ["Trance"], s: ["Goa Trance"], src: "discogs+musicbrainz" }, // Hilight Tribe
  "hiraku": { m: ["Techno"], s: ["Ambient", "Experimental", "IDM"], src: "discogs" }, // Hiraku
  "hitech": { m: ["Drum & Bass", "Techno"], s: ["Dubstep", "Grime", "Electro"], src: "discogs" }, // HiTech
  "hitoshi": { m: ["House"], s: ["Disco", "Acid House"], src: "research" }, // Hitoshi
  "holy-priest": { m: ["Hard Techno"], s: [], src: "discogs" }, // Holy Priest
  "honey-dijon": { m: ["House"], s: ["Deep House", "Chicago House", "Classic House"], src: "discogs+last.fm+musicbrainz" }, // Honey Dijon
  "honeyluv": { m: ["House"], s: ["Tech House"], src: "discogs" }, // HoneyLuv
  "hooja": { m: ["EDM"], s: ["Electro House"], src: "wikidata" }, // Hooja
  "horse-meat-disco": { m: ["House"], s: ["Disco", "Nu-Disco"], src: "research" }, // Horse Meat Disco
  "horsegiirl": { m: ["Hardcore", "Techno"], s: ["Happy Hardcore", "Eurodance", "Gabber"], src: "research" }, // horsegiirL
  "hot-since-82": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Hot Since 82
  "hu-bee": { m: ["Psytrance"], s: ["Progressive Trance"], src: "research" }, // Hu Bee
  "hubbabubbaklubb-djs": { m: ["House"], s: ["Disco", "Balearic", "Downtempo"], src: "research" }, // Hubbabubbaklubb DJs
  "hugo-lx": { m: ["House", "Techno"], s: ["Deep House", "Ambient"], src: "discogs" }, // Hugo LX
  "huma-utku": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Hüma Utku
  "human-safari": { m: ["Techno", "Acid Techno"], s: ["Hardgroove", "Tribal Techno"], src: "research" }, // Human Safari
  "hvob": { m: ["House", "Techno"], s: ["Deep House", "Downtempo", "Tech House"], src: "discogs" }, // HVOB
  "hybrid-minds": { m: ["Drum & Bass"], s: ["Jungle", "UK Garage"], src: "discogs" }, // Hybrid Minds
  "hypnosis-therapy": { m: ["Techno"], s: ["Breakbeat", "Experimental"], src: "research" }, // Hypnosis Therapy
  "hysta": { m: ["Hardcore"], s: ["Frenchcore", "Gabber", "Uptempo"], src: "discogs+musicbrainz" }, // Hysta
  "i-hate-models": { m: ["Techno"], s: ["Industrial Techno", "Dark Techno", "EBM"], src: "discogs+last.fm+musicbrainz+wikidata" }, // I Hate Models
  "i-jordan": { m: ["House", "Techno", "Trance"], s: ["Breakbeat", "Bass Music"], src: "research" }, // I. Jordan
  "i-roots": { m: ["Trance", "Psytrance"], s: ["Dub"], src: "research" }, // I Roots
  "ian-pooley": { m: ["House"], s: ["Deep House", "Tech House"], src: "discogs" }, // Ian Pooley
  "identified-patient": { m: ["Techno"], s: ["Electro", "Downtempo", "Leftfield"], src: "discogs" }, // Identified Patient
  "ignez": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Ignez
  "ii-faces": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // II Faces
  "il-est-vilaine": { m: ["Techno", "House"], s: ["EBM", "Electro"], src: "discogs+last.fm" }, // Il Est Vilaine
  "ilario-alicante": { m: ["Techno", "House"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Ilario Alicante
  "imperia": { m: ["Hard Techno", "Techno"], s: [], src: "research" }, // Imperia
  "in-furcht": { m: ["Techno", "Hard Techno"], s: ["Schranz", "Hardgroove"], src: "research" }, // In Furcht
  "in-verruf": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno", "Hard Trance"], src: "research" }, // In Verruf
  "ind": { m: ["Techno", "Hardcore"], s: ["Experimental", "Disco", "Industrial"], src: "discogs" }, // Ind
  "indira-paganotto": { m: ["Psytrance", "Techno", "Hard Techno"], s: ["Psy-Trance Techno"], src: "research" }, // Indira Paganotto
  "infected-mushroom": { m: ["Psytrance", "Techno"], s: ["Experimental", "Goa Trance", "Dubstep"], src: "discogs" }, // Infected Mushroom
  "inox-traxx": { m: ["Techno"], s: [], src: "discogs" }, // Inox Traxx
  "interplanetary-criminal": { m: ["House"], s: ["UK Garage"], src: "discogs" }, // Interplanetary Criminal
  "iosio": { m: ["Hard Techno", "Trance"], s: ["Bouncy Techno", "Hard Bounce"], src: "research" }, // IOSIO
  "isa-roos": { m: ["House"], s: ["Afro House", "Afro Tech", "Deep House"], src: "research" }, // Isa Roos
  "isabel-soto": { m: ["Techno"], s: ["Ambient", "Industrial Techno"], src: "research" }, // Isabel Soto
  "isaiah": { m: ["Techno", "Hard Techno"], s: ["Hardgroove"], src: "research" }, // Isaiah
  "isis-cloudt": { m: ["House", "Drum & Bass"], s: ["Bass House", "Dubstep", "UK Garage"], src: "research" }, // Isis Cloudt
  "istoria": { m: ["Drum & Bass"], s: ["Experimental"], src: "discogs" }, // Istoria
  "ivan-smagghe": { m: ["Techno", "House"], s: ["Electro", "Leftfield"], src: "discogs" }, // Ivan Smagghe
  "ivory": { m: ["Techno", "House"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Ivory
  "ivy": { m: ["Drum & Bass"], s: ["Rave", "Jungle"], src: "research" }, // [IVY]
  "ivy-lab": { m: ["Drum & Bass"], s: ["Halftime"], src: "discogs" }, // Ivy Lab
  "ixakt": { m: ["Hard Techno", "Techno"], s: [], src: "discogs" }, // Ixakt
  "jacidorex": { m: ["Techno", "Acid Techno"], s: ["Tech Trance", "Acid House", "Gabber"], src: "discogs" }, // Jacidorex
  "jakojako": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // JakoJako
  "jam-el-mar": { m: ["Techno"], s: ["Tech House", "Downtempo", "Ambient"], src: "discogs" }, // Jam el Mar
  "james-bangura": { m: ["Techno", "House"], s: ["Electro", "Bassline", "Deep Techno"], src: "discogs" }, // James Bangura
  "james-blake": { m: ["Techno"], s: ["Electronica", "Leftfield"], src: "discogs+wikidata" }, // James Blake
  "james-holden": { m: ["Techno"], s: ["Experimental", "Progressive House", "IDM"], src: "discogs+wikidata" }, // James Holden
  "james-hype": { m: ["House", "EDM"], s: ["Tech House", "Future House"], src: "research" }, // James Hype
  "jamie-jones": { m: ["House"], s: ["Tech House", "Deep House", "Disco"], src: "discogs+musicbrainz" }, // Jamie Jones
  "jamie-woon": { m: ["Techno", "Drum & Bass", "House"], s: ["Dubstep", "Downtempo"], src: "discogs" }, // Jamie Woon
  "jan-blomqvist": { m: ["Techno", "House"], s: ["Melodic Techno", "Deep House"], src: "research" }, // Jan Blomqvist
  "jan-loup": { m: ["Drum & Bass"], s: ["Dubstep", "Dub Techno"], src: "research" }, // Jan Loup
  "jan-vervloet": { m: ["Trance", "House"], s: ["Hard Trance", "Progressive House", "Eurodance"], src: "research" }, // Jan Vervloet
  "jana-rush": { m: ["House"], s: ["Footwork", "Ghetto House", "Jungle"], src: "research" }, // Jana Rush
  "jane-fitz": { m: ["House", "Techno", "Acid Techno"], s: ["Deep House", "Ambient"], src: "research" }, // Jane Fitz
  "janeret": { m: ["House", "Techno"], s: ["Deep House"], src: "discogs" }, // Janeret
  "japau": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Japau
  "jappo": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Jappo
  "jasmine-not-jafar": { m: ["Techno"], s: ["Electro"], src: "research" }, // Jasmine Not Jafar
  "jason-payne": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Dubstep"], src: "research" }, // Jason Payne
  "jay-reeve": { m: ["Hardstyle"], s: [], src: "discogs" }, // Jay Reeve
  "jayda-g": { m: ["House"], s: ["Deep House", "Disco"], src: "research" }, // Jayda G
  "jazzy-ie": { m: ["House"], s: ["Dance-Pop"], src: "research" }, // Jazzy (IE)
  "jean-michel-jarre": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Jean-Michel Jarre
  "jeff-mills": { m: ["Techno"], s: ["Detroit Techno", "Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Jeff Mills
  "jekkamai": { m: ["Techno", "House"], s: ["Ghettotech", "Hard House"], src: "research" }, // JEKKAMAÏ
  "jennifer-cardini": { m: ["Techno", "House"], s: ["Electro", "Minimal Techno", "Tech House"], src: "discogs" }, // Jennifer Cardini
  "jennifer-loveless": { m: ["House"], s: ["Electro", "Deep House"], src: "research" }, // Jennifer Loveless
  "jerome": { m: ["Techno", "House"], s: ["Tech House", "Electro House"], src: "discogs" }, // Jerome
  "jesse-maas": { m: ["House"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Jesse Maas
  "jessie-dols": { m: ["Techno", "Hard Techno"], s: ["Hardgroove"], src: "research" }, // Jessie Dols
  "jhobei": { m: ["House"], s: ["Tech House", "Deep House", "Electro"], src: "research" }, // Jhobei
  "joachim-garraud": { m: ["EDM"], s: ["Electro House"], src: "wikidata" }, // Joachim Garraud
  "joachim-pastor": { m: ["House", "Techno", "EDM"], s: ["Tech House", "Progressive House", "Electronica"], src: "discogs+musicbrainz" }, // Joachim Pastor
  "joakim-lundell": { m: ["EDM"], s: ["Dance Pop"], src: "research" }, // Joakim Lundell
  "job-jobse": { m: ["House", "Techno"], s: ["Deep House", "Acid House", "Ambient"], src: "discogs" }, // Job Jobse
  "joe-jam": { m: ["House"], s: ["Deep House", "Jungle", "Acid House"], src: "discogs" }, // Joe Jam
  "johannes-schuster": { m: ["Hard Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Johannes Schuster
  "john-digweed": { m: ["House", "Techno"], s: ["Progressive House", "Progressive Trance"], src: "research" }, // John Digweed
  "john-gilliot": { m: ["Techno"], s: [], src: "research" }, // John Gilliot
  "john-morales": { m: ["House"], s: ["Disco", "Garage House"], src: "research" }, // John Morales
  "john-summit": { m: ["House", "EDM"], s: ["Tech House", "Progressive House"], src: "research" }, // John Summit
  "john-t-gast": { m: [], s: [], src: "hors-perimetre" }, // John T. Gast
  "jolani-jhones": { m: ["House"], s: ["UK Garage", "Speed Garage"], src: "research" }, // Jolani Jhones
  "jonas-blue": { m: ["House", "EDM"], s: ["Tropical House"], src: "research" }, // Jonas Blue
  "jonathan-kaspar": { m: ["House", "Techno"], s: ["Melodic Techno", "Deep House"], src: "research" }, // Jonathan Kaspar
  "jordan-brando": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Jordan Brando
  "joris-delacroix": { m: ["Techno", "House", "Trance"], s: ["Minimal Techno", "Progressive House", "Deep House"], src: "discogs+last.fm" }, // Joris Delacroix
  "joris-voorn": { m: ["House", "Techno"], s: ["Tech House", "Detroit Techno"], src: "discogs+musicbrainz+wikidata" }, // Joris Voorn
  "jorja-smith": { m: [], s: [], src: "hors-perimetre" }, // Jorja Smith
  "joro-joabo": { m: ["Techno"], s: ["Progressive House"], src: "discogs" }, // Joro & Joabo
  "joseph-capriati": { m: ["Techno", "House"], s: [], src: "research" }, // Joseph Capriati
  "josh-baker": { m: ["House"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Josh Baker
  "joshwa": { m: ["House"], s: ["Tech House"], src: "research" }, // Joshwa
  "joss-dean": { m: ["House"], s: ["Deep House", "Tech House", "Minimal House"], src: "research" }, // Joss Dean
  "jovynn": { m: ["Hard Techno"], s: [], src: "discogs" }, // Jovynn
  "jowi": { m: ["Hard Techno", "Techno"], s: [], src: "research" }, // Jowi
  "joy-orbison": { m: ["House", "Drum & Bass", "Techno"], s: ["UK Garage", "Dubstep", "Jungle"], src: "discogs+musicbrainz+wikidata" }, // Joy Orbison
  "juda": { m: ["Techno"], s: [], src: "research" }, // JUDA
  "juliet-fox": { m: ["Techno", "House"], s: ["Tech House", "Deep House", "Tech Trance"], src: "discogs" }, // Juliet Fox
  "junior-pappa": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Junior Pappa
  "juno-reactor": { m: ["Psytrance", "Trance"], s: ["Goa Trance", "Tribal"], src: "research" }, // Juno Reactor
  "justin-jay": { m: ["House"], s: ["Tech House", "Deep House"], src: "research" }, // Justin Jay
  "k-lone": { m: ["House"], s: ["Deep House", "UK Garage", "Dubstep"], src: "research" }, // K-LONE
  "k-motionz": { m: ["Drum & Bass"], s: ["Jump Up"], src: "research" }, // K Motionz
  "k-tee": { m: ["Techno", "Drum & Bass"], s: ["UK Bass"], src: "research" }, // K-Tee
  "kaa": { m: ["House"], s: ["Tech House", "Afro House"], src: "research" }, // Kaa
  "kaboutertje-putlucht": { m: ["Techno", "Hardcore"], s: ["EBM", "Gabber"], src: "discogs" }, // Kaboutertje Putlucht
  "kaizersoze": { m: ["House"], s: ["Deep House", "Tech House", "Melodic House"], src: "research" }, // Kaizersoze
  "kaltblume": { m: ["Techno", "Hard Techno", "Acid Techno"], s: ["Hard Trance"], src: "research" }, // KALTBLUME
  "kamafaka": { m: ["Hard Techno", "Hardcore"], s: ["Industrial Techno", "Frenchcore"], src: "research" }, // Kamafaka
  "kamma": { m: ["House", "Techno"], s: ["Disco", "Deep House"], src: "research" }, // Kamma
  "kandelissa": { m: ["Techno", "Hard Techno"], s: ["Hardgroove", "Tribal Techno", "Hard House"], src: "research" }, // Kandelissa
  "kangding-ray": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Kangding Ray
  "karah": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // KARAH
  "karakals": { m: ["EDM"], s: ["Open Format"], src: "research" }, // Karakals
  "karlfroye": { m: ["Hardcore"], s: ["Gabber", "Jumpstyle", "Uptempo"], src: "research" }, // Karlfroye
  "kas-st": { m: ["Techno"], s: ["Deep Techno"], src: "discogs" }, // KAS:ST
  "kasei-p": { m: [], s: [], src: "hors-perimetre" }, // Kasei P
  "kasparov": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Kasparov
  "katatonic-silentio": { m: ["Techno"], s: ["Experimental", "Ambient", "IDM"], src: "discogs" }, // Katatonic Silentio
  "kate-ryan": { m: ["EDM", "Trance"], s: ["Euro House"], src: "discogs" }, // Kate Ryan
  "kathleen-c": { m: ["House", "Techno"], s: ["Ghettotech", "Progressive Trance"], src: "research" }, // Kathleen C
  "katy-rough": { m: ["Hard Techno", "Trance"], s: ["Hard Dance", "Schranz"], src: "research" }, // Katy Rough
  "kaufmann": { m: ["Techno"], s: ["Minimal Techno", "Peak Time Techno"], src: "research" }, // Kaufmann
  "kavari": { m: ["Drum & Bass"], s: ["Dubstep", "Deconstructed Club", "Experimental"], src: "research" }, // KAVARI
  "kayla-painter": { m: ["Techno"], s: ["Ambient", "Downtempo", "Experimental"], src: "discogs" }, // Kayla Painter
  "kaytranada": { m: ["House"], s: ["Deep House", "Future House"], src: "research" }, // Kaytranada
  "kazajak": { m: ["Trance"], s: ["Hard Trance"], src: "research" }, // Kazajak
  "kelela": { m: [], s: [], src: "hors-perimetre" }, // Kelela
  "kelly-lee-owens": { m: ["Techno"], s: ["Ambient", "Experimental", "Leftfield"], src: "discogs" }, // Kelly Lee Owens
  "kelman-duran": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Kelman Duran
  "ken-ming": { m: ["Techno"], s: ["Tribal Techno", "Breakbeat"], src: "research" }, // Ken-Ming
  "kendal": { m: ["Trance", "House"], s: ["Italo Disco", "EBM", "Synthwave"], src: "research" }, // Kendal
  "kenton-slash-demon": { m: ["House", "Techno"], s: ["Deep House", "Tech House", "Experimental"], src: "discogs" }, // Kenton Slash Demon
  "kerri-chandler": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Kerri Chandler
  "kerrie": { m: ["Techno"], s: ["Electro", "Breakbeat"], src: "research" }, // Kerrie
  "kettama": { m: ["House", "Techno", "Trance"], s: ["Tech Trance", "UK Garage", "Breakbeat"], src: "discogs" }, // Kettama
  "kevin-arnold": { m: ["Techno", "House"], s: [], src: "research" }, // Kevin Arnold
  "kevin-de-vries": { m: ["Techno", "House"], s: ["Progressive House", "Tech House"], src: "discogs" }, // Kevin de Vries
  "kevin-lo": { m: ["House"], s: ["Deep House", "Acid House"], src: "research" }, // Kevin Lo
  "kg": { m: ["House"], s: ["Afro House", "UK Funky", "Amapiano"], src: "research" }, // KG
  "ki-ki": { m: ["Techno", "Trance"], s: ["Electro"], src: "discogs+wikidata" }, // KI/KI
  "kili": { m: ["Hardcore"], s: ["Uptempo", "Frenchcore"], src: "research" }, // Kili
  "killbox": { m: ["Drum & Bass"], s: ["Neurofunk"], src: "research" }, // Killbox
  "kimmic": { m: ["Hard Techno"], s: ["Hard Dance"], src: "research" }, // Kimmic
  "kings-of-the-rollers": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs" }, // Kings of the Rollers
  "kink": { m: ["House", "Techno", "Acid Techno"], s: ["Tech House"], src: "research" }, // KiNK
  "kirsty": { m: ["House", "Techno", "Trance"], s: ["Progressive House", "Downtempo", "Progressive Trance"], src: "discogs" }, // Kirsty
  "klangkuenstler": { m: ["Techno"], s: ["Dark Techno", "Tech House"], src: "discogs+musicbrainz+wikidata" }, // Klangkuenstler
  "klanglos": { m: ["Techno"], s: ["Deep Techno", "Minimal Techno"], src: "discogs" }, // Klanglos
  "klin-klop": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Klin Klop
  "klingande": { m: ["House"], s: ["Deep House"], src: "wikidata" }, // Klingande
  "klofama": { m: ["Hard Techno"], s: ["Industrial Techno", "Rave"], src: "research" }, // KLOFAMA
  "kloud": { m: ["Techno", "House"], s: ["Electro"], src: "research" }, // Kloud
  "kmru": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // KMRU
  "kntrlvrlst": { m: ["Hard Techno", "Techno"], s: [], src: "discogs" }, // Kntrlvrlst
  "kobalt": { m: ["Techno"], s: ["Ambient", "Experimental", "Minimal Techno"], src: "discogs" }, // Kobalt
  "kobosil": { m: ["Techno"], s: ["Industrial Techno"], src: "discogs+musicbrainz" }, // Kobosil
  "kode9": { m: ["Drum & Bass", "House"], s: ["Dubstep", "Footwork", "UK Garage"], src: "research" }, // Kode9
  "kofu": { m: ["House"], s: ["Hard House", "Gqom"], src: "research" }, // Kofu
  "kokoprisci": { m: ["House", "Techno"], s: ["Breakbeat", "UK Garage", "Jungle"], src: "research" }, // Kokoprisci
  "kolsch": { m: ["House", "Techno"], s: ["Tech House", "Progressive House"], src: "discogs" }, // Kölsch
  "kolter": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Kolter
  "konstantin-sibold": { m: ["Techno", "House"], s: ["Deep House", "Minimal Techno", "Dub Techno"], src: "discogs" }, // Konstantin Sibold
  "korolova": { m: ["Techno", "House"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Korolova
  "korsakoff": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Korsakoff
  "kosheen": { m: ["Drum & Bass", "Techno"], s: ["Breakbeat", "Downtempo", "Trip-Hop"], src: "discogs+wikidata" }, // Kosheen
  "kotorri": { m: ["Hard Techno"], s: [], src: "research" }, // Kotorri
  "koven": { m: ["Drum & Bass"], s: ["Dubstep", "Liquid Drum & Bass"], src: "research" }, // Koven
  "kozlov": { m: ["Hard Techno", "Techno", "Hardcore"], s: ["Industrial Techno", "Schranz"], src: "research" }, // Kozlov
  "krak-in-dub": { m: ["Drum & Bass", "Techno"], s: ["Jungle", "Breakbeat"], src: "discogs" }, // Krak In Dub
  "kream": { m: ["House", "EDM"], s: ["Melodic House", "Tech House"], src: "research" }, // KREAM
  "krimska": { m: ["Techno"], s: ["Breakbeat", "UK Bass"], src: "research" }, // Krimska
  "krowdexx": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Uptempo"], src: "research" }, // Krowdexx
  "kruella": { m: ["Hardcore"], s: [], src: "discogs" }, // Kruella
  "kruelty": { m: ["Hard Techno", "Hardstyle"], s: ["Industrial Hardcore"], src: "research" }, // KRUELTY
  "kuko": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Kuko
  "kuss": { m: ["Techno"], s: ["Hypnotic Techno", "Ambient", "Downtempo"], src: "research" }, // KUSS
  "kx-chr": { m: ["Hard Techno"], s: [], src: "discogs" }, // KX CHR
  "kxxma": { m: ["Hard Techno", "Techno"], s: ["Hardtek"], src: "research" }, // KXXMA
  "kyanu": { m: ["EDM", "Hardstyle"], s: ["Electro House", "Hands Up", "Happy Hardcore"], src: "research" }, // Kyanu
  "kygo": { m: ["House", "EDM"], s: ["Tropical House", "Deep House", "Progressive House"], src: "research" }, // Kygo
  "kyle-cortis": { m: ["Techno"], s: [], src: "discogs" }, // Kyle Cortis
  "kyle-starkey": { m: ["House"], s: ["Hard House"], src: "discogs" }, // Kyle Starkey
  "l-art-cene": { m: ["Techno", "Acid Techno"], s: [], src: "discogs" }, // l'Art Cène
  "la-bringue": { m: ["Techno"], s: [], src: "research" }, // La Bringue
  "la-fuente": { m: ["House", "EDM"], s: ["Electro House"], src: "research" }, // La Fuente
  "la-p-tite-fumee": { m: ["Psytrance", "Trance"], s: ["Organic Trance", "Tribal"], src: "research" }, // La P'tite Fumée
  "lady-waks": { m: ["Techno"], s: ["Breakbeat"], src: "discogs+wikidata" }, // Lady Waks
  "laidback-luke": { m: ["House", "Techno"], s: ["Electro", "Tech House", "Progressive House"], src: "discogs" }, // Laidback Luke
  "lakuti": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Lakuti
  "lane-8": { m: ["House"], s: ["Melodic House", "Progressive House", "Deep House"], src: "research" }, // Lane 8
  "lauff": { m: ["Hard Techno", "Trance"], s: ["Hard Trance", "Hard Dance"], src: "research" }, // Läuff
  "laura-meester": { m: ["House"], s: ["Disco", "Afro House", "Nu-Disco"], src: "research" }, // Laura Meester
  "laura-van-dam": { m: ["House", "Trance", "Techno"], s: ["Progressive House"], src: "discogs" }, // Laura van Dam
  "laure-croft": { m: ["Techno", "Hard Techno", "Acid Techno"], s: [], src: "research" }, // Laure Croft
  "laurent-garnier": { m: ["Techno", "House", "Acid Techno"], s: [], src: "research" }, // Laurent Garnier
  "laurent-wolf": { m: ["House", "EDM"], s: ["Electro House", "French House", "Electro"], src: "discogs+wikidata" }, // Laurent Wolf
  "lavance": { m: ["Drum & Bass"], s: [], src: "discogs" }, // Lavance
  "law-haktion": { m: ["Techno"], s: ["EBM", "Electro"], src: "research" }, // Law & Haktion
  "lb-honne": { m: ["Techno"], s: ["Ambient", "Deep House", "Minimal Techno"], src: "discogs" }, // Lb Honne
  "le-motel-magugu": { m: ["Drum & Bass", "House"], s: ["Dubstep", "UK Garage"], src: "discogs" }, // Le Motel & Magugu
  "le-shuuk": { m: ["EDM", "Hardstyle"], s: ["Electro House"], src: "discogs" }, // le Shuuk
  "lee-burridge": { m: ["House", "Techno"], s: ["Tech House", "Progressive House", "Deep House"], src: "discogs" }, // Lee Burridge
  "lee-gamble": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Lee Gamble
  "lee-parkinson": { m: ["House", "Techno", "Trance"], s: [], src: "research" }, // Lee Parkinson
  "leftfield": { m: ["Techno"], s: ["Leftfield", "Progressive House", "Breakbeat"], src: "discogs" }, // Leftfield
  "leiris": { m: ["Techno", "House"], s: ["Minimal Techno", "Electro", "Tech House"], src: "discogs" }, // Leiris
  "lekkerfaces": { m: ["Hardcore"], s: ["Uptempo", "Speedcore"], src: "research" }, // Lekkerfaces
  "len-faki": { m: ["Techno"], s: ["Minimal Techno"], src: "research" }, // Len Faki
  "lena-willikens": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Lena Willikens
  "leo-pol": { m: ["House"], s: ["Deep House", "Disco", "Tech House"], src: "discogs" }, // Leo Pol
  "leon-vynehall": { m: ["House", "Techno"], s: ["Deep House", "Ambient", "UK Garage"], src: "discogs" }, // Leon Vynehall
  "les-potes-au-feu": { m: [], s: [], src: "hors-perimetre" }, // Les Potes au Feu
  "lessss": { m: ["Techno"], s: [], src: "discogs" }, // LESSSS
  "let-3": { m: [], s: [], src: "hors-perimetre" }, // Let 3
  "levenkhan": { m: ["Hardcore"], s: ["Frenchcore", "Uptempo"], src: "research" }, // Levenkhan
  "lewis-ofman": { m: ["House"], s: ["French House", "Disco", "Nu-Disco"], src: "research" }, // Lewis OfMan
  "lieks": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // LIEKS
  "lil-kleine": { m: [], s: [], src: "hors-perimetre" }, // Lil' Kleine
  "lil-texas": { m: ["Hardcore", "Techno"], s: ["Gabber", "Breakcore", "Breakbeat"], src: "discogs+wikidata" }, // Lil Texas
  "lilly-palmer": { m: ["Techno", "Hard Techno"], s: ["Peak Time Techno"], src: "research" }, // Lilly Palmer
  "liquidfive": { m: ["House", "EDM"], s: ["Electro House"], src: "research" }, // Liquidfive
  "lis-sarroca": { m: ["House"], s: ["Deep House", "Breakbeat"], src: "discogs" }, // Lis Sarroca
  "lisa-korver": { m: ["Techno", "Trance"], s: ["Hardgroove"], src: "research" }, // Lisa Korver
  "lobster": { m: ["Techno"], s: ["Electro", "Ghetto House"], src: "research" }, // Lobster
  "loco-dice": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Loco Dice
  "lola-palmer": { m: ["House", "Techno"], s: ["Deep House", "Progressive House", "Deep Techno"], src: "discogs" }, // Lola Palmer
  "loscil": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Loscil
  "lossia": { m: ["House"], s: [], src: "research" }, // Lossia
  "lost-frequencies": { m: ["House", "EDM"], s: ["Deep House", "Tropical House"], src: "research" }, // Lost Frequencies
  "louie-vega": { m: ["House"], s: ["Deep House", "Garage House"], src: "discogs" }, // Louie Vega
  "loukeman": { m: ["House"], s: ["Lo-fi House"], src: "research" }, // Loukeman
  "love-transmission": { m: ["House"], s: ["Disco"], src: "research" }, // Love Transmission
  "low-r": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs" }, // Low:r
  "lowriderz": { m: ["Drum & Bass", "Hardstyle"], s: ["Jumpstyle", "Jungle"], src: "discogs" }, // Lowriderz
  "lsdxoxo": { m: ["Techno"], s: ["Breakbeat", "Ghetto House", "Bass Music"], src: "discogs" }, // LSDXOXO
  "ltj-bukem": { m: ["Drum & Bass"], s: ["Jungle", "Jazzstep", "Breakbeat"], src: "research" }, // LTJ Bukem
  "luca-agnelli": { m: ["Techno"], s: ["Tech House", "Dub Techno", "Deep House"], src: "discogs" }, // Luca Agnelli
  "luciano": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Luciano
  "luciid": { m: ["Hard Techno", "Techno"], s: ["Dark Techno"], src: "research" }, // Luciid
  "luigi-tozzi": { m: ["Techno"], s: ["Dub Techno", "Hypnotic Techno", "Ambient"], src: "research" }, // Luigi Tozzi
  "luis-ripa": { m: ["House"], s: ["UK Garage", "Deep House", "Tech House"], src: "discogs" }, // Luis Ripa
  "luke-alessi": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Luke Alessi
  "luke-slater": { m: ["Techno"], s: ["Electro", "Breakbeat", "Ambient"], src: "discogs+wikidata" }, // Luke Slater
  "lunax": { m: ["EDM", "Trance", "House"], s: ["Electro House"], src: "discogs" }, // Lunax
  "luneris": { m: ["Psytrance", "Techno"], s: ["Electro Pagan Trance"], src: "research" }, // Luneris
  "luuk-van-dijk": { m: ["House"], s: ["Tech House", "Breakbeat"], src: "research" }, // Luuk Van Dijk
  "m-high": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // M-High
  "maceo-plex": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "discogs" }, // Maceo Plex
  "mad-dog": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Mad Dog
  "mad-kate": { m: ["Techno"], s: ["Electro", "Ambient"], src: "research" }, // Mad Kate
  "madben": { m: ["Techno"], s: ["Progressive House", "Tech House"], src: "discogs" }, // Madben
  "maddix": { m: ["Techno", "Hard Techno", "Acid Techno"], s: ["Big Room"], src: "research" }, // Maddix
  "madmotormiquel": { m: ["House"], s: ["Deep House", "Tech House", "Minimal Techno"], src: "discogs" }, // Madmotormiquel
  "madness": { m: [], s: [], src: "hors-perimetre" }, // Madness
  "maduk": { m: ["Drum & Bass"], s: ["Electro House"], src: "discogs" }, // Maduk
  "madwoman": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Madwoman
  "maike-depas": { m: ["Techno"], s: [], src: "discogs" }, // Maike Depas
  "main-phase": { m: ["House"], s: ["UK Garage", "Speed Garage", "Jungle"], src: "research" }, // Main Phase
  "major7": { m: ["Psytrance", "Trance"], s: ["Progressive Trance"], src: "discogs" }, // Major7
  "makez": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Makèz
  "mala": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs+wikidata" }, // Mala
  "malaa": { m: ["House"], s: ["Tech House", "Bass House", "Bassline"], src: "discogs+wikidata" }, // Malaa
  "malice": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Malice
  "mall-grab": { m: ["House", "Techno"], s: ["Lo-Fi House", "Breakbeat"], src: "research" }, // Mall Grab
  "mandragora": { m: ["Psytrance", "Trance"], s: ["Progressive Trance", "Goa Trance"], src: "research" }, // Mandragora
  "maoh": { m: ["Techno"], s: [], src: "discogs" }, // Maōh
  "mar-t": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Mar-T
  "mara": { m: ["Drum & Bass"], s: ["Jungle", "Dubstep"], src: "research" }, // Mara
  "marc-acardipane": { m: ["Hardcore", "Hard Techno"], s: ["Gabber", "Doomcore"], src: "research" }, // Marc Acardipane
  "marc-jerome": { m: ["Trance"], s: ["Hard Trance"], src: "discogs" }, // Marc Jerome
  "marc-zocher": { m: ["Techno"], s: ["Peak Time Techno"], src: "research" }, // Marc Zocher
  "marcel-dettmann": { m: ["Techno"], s: ["Minimal Techno", "Electro"], src: "research" }, // Marcel Dettmann
  "marcellus-pittman": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Marcellus Pittman
  "marco-carola": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Marco Carola
  "marco-zaffarano": { m: ["Techno", "Trance"], s: ["Hard Trance", "Tech House", "Minimal Techno"], src: "discogs" }, // Marco Zaffarano
  "maria-healy": { m: ["Trance"], s: [], src: "discogs+wikidata" }, // Maria Healy
  "maribou-state": { m: ["Techno", "House"], s: ["Downtempo", "Leftfield"], src: "discogs+musicbrainz" }, // Maribou State
  "marie-davidson": { m: ["Techno"], s: ["Electro", "Experimental", "Ambient"], src: "discogs" }, // Marie Davidson
  "marie-julie": { m: ["Techno"], s: [], src: "research" }, // Marie-Julie
  "marie-vaunt": { m: ["Techno", "Hard Techno"], s: ["Tech Trance"], src: "discogs" }, // Marie Vaunt
  "mark-broom": { m: ["Techno"], s: ["Minimal Techno", "Tech House", "Ambient"], src: "discogs" }, // Mark Broom
  "mark-hawkins": { m: ["Techno"], s: ["Experimental", "Deep House", "Electro"], src: "discogs" }, // Mark Hawkins
  "mark-with-a-k": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "discogs" }, // Mark With A K
  "markus-schulz": { m: ["Trance"], s: ["Progressive Trance"], src: "discogs+wikidata" }, // Markus Schulz
  "marlon-hoffstadt": { m: ["Trance", "EDM", "House"], s: ["Eurodance"], src: "discogs+wikidata" }, // Marlon Hoffstadt
  "marmotek-sound-system": { m: ["Hardcore", "Hard Techno"], s: ["Frenchcore", "Hardtek", "Gabber"], src: "research" }, // Marmotek Sound System
  "maro": { m: ["Techno", "Trance"], s: ["Hardgroove", "Breakbeat"], src: "research" }, // Maro
  "marshall-jefferson": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Marshall Jefferson
  "marshmello": { m: ["EDM", "Drum & Bass"], s: ["Future Bass", "Electro House", "Dubstep"], src: "discogs" }, // Marshmello
  "marsolo": { m: ["House"], s: ["Deep House", "Tech House"], src: "discogs" }, // Marsolo
  "martin-garrix": { m: ["EDM", "House"], s: ["Electro House", "Big Room", "Progressive House"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Martin Garrix
  "martin-oelz": { m: ["Techno"], s: [], src: "research" }, // Martin Oelz
  "martina-bertoni": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Martina Bertoni
  "martyn": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs+wikidata" }, // Martyn
  "marz": { m: ["Hard Techno", "Techno"], s: ["Hardgroove"], src: "research" }, // März
  "masalo": { m: ["House", "Techno"], s: ["Disco", "Hi-NRG"], src: "research" }, // Masalo
  "masters-at-work": { m: ["House"], s: ["Garage House", "Deep House"], src: "research" }, // Masters at Work
  "mateo-spirit": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs" }, // Mateo&Spirit
  "mathame": { m: ["Techno"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Mathame
  "mathew-jonson": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House", "Electro"], src: "discogs" }, // Mathew Jonson
  "matrakk": { m: ["Hard Techno", "Techno", "Trance"], s: ["Hard Trance"], src: "discogs" }, // Matrakk
  "matthias-geerts": { m: ["Techno", "Acid Techno"], s: [], src: "research" }, // Matthias Geerts
  "mau-p": { m: ["House", "EDM"], s: ["Tech House", "Big Room"], src: "discogs+wikidata" }, // Mau P
  "maudux": { m: ["Techno", "Trance", "Hard Techno"], s: ["Bounce Trap", "Ghetto Trance"], src: "research" }, // Maudux
  "max-cooper": { m: ["Techno"], s: ["IDM", "Ambient"], src: "research" }, // Max Cooper
  "max-dean": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Max Dean
  "max-finney": { m: ["House"], s: ["Disco", "Hi-NRG"], src: "research" }, // Max Finney
  "mc-alee": { m: ["Hardcore", "Hardstyle"], s: [], src: "discogs" }, // MC Alee
  "mc-boogshe": { m: ["Hardcore"], s: [], src: "research" }, // MC Boogshe
  "mc-chucky": { m: ["Hardstyle", "Hardcore"], s: ["Jumpstyle", "Gabber"], src: "discogs" }, // MC Chucky
  "mc-dl": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "discogs" }, // MC DL
  "mc-livid": { m: ["Hardstyle"], s: [], src: "discogs" }, // MC Livid
  "mc-mars": { m: ["Techno"], s: [], src: "research" }, // MC Mars
  "mc-nice": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // MC Nice
  "mc-tonn-piper": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs" }, // MC Tonn Piper
  "mcde": { m: ["House", "Techno"], s: ["Deep House", "Disco"], src: "research" }, // MCDE
  "mcr-t": { m: ["Techno", "Hard Techno"], s: ["Ghettotech", "Miami Bass"], src: "research" }, // MCR-T
  "me": { m: ["House", "Techno"], s: ["Melodic House", "Deep House"], src: "research" }, // &ME
  "medusa": { m: ["Hard Techno", "Trance", "Acid Techno"], s: ["Schranz", "Uptempo"], src: "research" }, // Medusa
  "meduza": { m: ["House"], s: ["Tech House", "Progressive House"], src: "research" }, // Meduza
  "mella-dee": { m: ["Techno", "House"], s: ["Breakbeat", "UK Garage", "Tech House"], src: "discogs" }, // Mella Dee
  "melon-bomb": { m: ["House"], s: ["Disco"], src: "research" }, // Melon Bomb
  "melvo-baptiste": { m: ["House"], s: ["Disco", "Deep House"], src: "research" }, // Melvo Baptiste
  "menesix": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Menesix
  "mestiza": { m: ["Techno", "House"], s: [], src: "research" }, // MËSTIZA
  "metrik": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk"], src: "research" }, // Metrik
  "mia-mia": { m: ["Techno", "Hard Techno"], s: ["Hardgroove"], src: "research" }, // Mia Mia
  "michael-amani": { m: ["EDM", "House"], s: [], src: "research" }, // Michael Amani
  "michael-bibi": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Michael Bibi
  "michel-de-hey": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Michel de Hey
  "mietze-conte": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Mietze Conte
  "mika-heggemann": { m: ["Trance", "Hard Techno"], s: ["Nu Trance", "Hard House"], src: "research" }, // Mika Heggemann
  "mike-servito": { m: ["House"], s: ["Acid House"], src: "discogs" }, // Mike Servito
  "mikee": { m: ["House", "Techno"], s: ["Tech House"], src: "discogs" }, // Mikee
  "mila-haj-kasem": { m: ["Techno", "Hard Techno"], s: ["Hypnotic Techno"], src: "research" }, // Mila Haj Kasem
  "milion": { m: ["House"], s: ["UK Garage", "Speed Garage", "Tech House"], src: "research" }, // Milion
  "millad": { m: ["House"], s: ["Deep House", "Tech House"], src: "research" }, // Millad
  "mind-against": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "discogs" }, // Mind Against
  "mind-compressor": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Mind Compressor
  "mind-dimension": { m: ["Hardstyle"], s: ["Industrial"], src: "discogs" }, // Mind Dimension
  "minna": { m: ["House"], s: ["Disco"], src: "research" }, // MiNNA
  "mira-mark": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Mira Mark
  "mish": { m: ["House", "Techno", "Hardstyle"], s: ["Electro", "Electro House"], src: "discogs" }, // Mish
  "miss-k8": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Miss K8
  "miss-monique": { m: ["House", "Techno"], s: ["Progressive House", "Melodic Techno"], src: "discogs+musicbrainz+wikidata" }, // Miss Monique
  "missnoa": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Missnoa
  "mita-gami": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Progressive House"], src: "discogs" }, // Mita Gami
  "miyagi": { m: ["House", "Techno"], s: ["Deep House", "Melodic Techno", "Tech House"], src: "research" }, // Miyagi
  "mk": { m: ["House"], s: ["Deep House", "UK Garage"], src: "research" }, // MK
  "moa": { m: ["Techno"], s: ["Downtempo", "Trip-Hop", "Future Jazz"], src: "discogs" }, // Moå
  "moby": { m: ["Techno"], s: ["Downtempo", "Electronica", "Trip-Hop"], src: "discogs+wikidata" }, // Moby
  "mochakk": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Mochakk
  "modeselektor": { m: ["Techno"], s: ["Electro", "IDM"], src: "discogs+musicbrainz" }, // Modeselektor
  "modestep": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs+wikidata" }, // Modestep
  "monika-kruse": { m: ["Techno"], s: ["Tech House", "Minimal Techno"], src: "discogs+wikidata" }, // Monika Kruse
  "monika-seta": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Monika Seta
  "monkey-safari": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Monkey Safari
  "monolink": { m: ["House", "Techno"], s: ["Melodic House", "Progressive House", "Downtempo"], src: "research" }, // Monolink
  "moodfino": { m: ["House", "Trance", "Techno"], s: ["Italo Disco"], src: "research" }, // Moodfino
  "moodymann": { m: ["Techno", "House"], s: ["Deep House", "Detroit Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Moodymann
  "morgan-seatree": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Morgan Seatree
  "mosimann": { m: ["EDM", "House"], s: ["Deep House", "Progressive House"], src: "research" }, // Mosimann
  "mosmoz": { m: ["Hard Techno", "Techno"], s: [], src: "discogs" }, // Mosmoz
  "mota": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Mota
  "mousse-t": { m: ["House"], s: ["Disco"], src: "discogs+wikidata" }, // Mousse T.
  "mozey": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs" }, // Mozey
  "mr-bassmeister": { m: ["Hardcore"], s: [], src: "discogs" }, // Mr. Bassmeister
  "mr-scruff": { m: ["House"], s: ["Downtempo", "Breakbeat", "Disco"], src: "research" }, // Mr Scruff
  "mrak": { m: ["Techno"], s: ["Melodic Techno"], src: "research" }, // MRAK
  "mulatu-astatke": { m: [], s: [], src: "hors-perimetre" }, // Mulatu Astatke
  "multiplex": { m: ["Drum & Bass"], s: ["Neurofunk", "Jungle"], src: "research" }, // Multiplex
  "musclecars": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Musclecars
  "muzz": { m: ["Drum & Bass"], s: ["Neurofunk"], src: "research" }, // Muzz
  "myu-sa": { m: ["Hard Techno", "Techno"], s: ["Hard Dance"], src: "research" }, // Myu:sa
  "n-rbak": { m: ["Techno"], s: ["Deep Techno", "Ambient", "Experimental"], src: "discogs" }, // Nørbak
  "n-vitral": { m: ["Hardcore"], s: ["Industrial Hardcore", "Uptempo"], src: "research" }, // N-Vitral
  "naft": { m: ["House", "Techno"], s: ["Tech House", "Live Electronic"], src: "research" }, // NAFT
  "naomi": { m: ["Techno"], s: ["Downtempo"], src: "discogs" }, // Naomi
  "narciss": { m: ["Techno", "Trance"], s: ["Ambient", "Breakbeat", "Deep House"], src: "discogs" }, // Narciss
  "nastia": { m: ["Techno", "House"], s: ["Minimal Techno"], src: "research" }, // Nastia
  "nathan-fake": { m: ["Techno"], s: ["Ambient", "IDM"], src: "research" }, // Nathan Fake
  "nathan-homan": { m: ["Techno", "House"], s: ["Electro", "Leftfield", "Tech House"], src: "discogs" }, // Nathan Homan
  "nativesun": { m: ["Techno"], s: [], src: "discogs" }, // Nativesun
  "natte-visstick": { m: ["Hard Techno", "Drum & Bass"], s: ["Memetechno"], src: "research" }, // Natte Visstick
  "nd-baumecker": { m: ["Techno", "House"], s: ["Electro", "Ambient"], src: "research" }, // nd_baumecker
  "ned-bennett": { m: ["Techno"], s: [], src: "research" }, // Ned Bennett
  "neelix": { m: ["Psytrance", "Trance"], s: ["Progressive Psy", "Progressive Trance"], src: "research" }, // Neelix
  "negitiv": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Industrial Techno"], src: "research" }, // NEGITIV
  "neil-landstrumm": { m: ["Techno"], s: ["Electro", "Experimental", "Dubstep"], src: "discogs" }, // Neil Landstrumm
  "nemesys": { m: ["Techno", "Trance"], s: ["Electro", "Industrial", "Ambient"], src: "discogs" }, // Nemesys
  "neophyte": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Neophyte
  "nervo": { m: ["House"], s: ["Progressive House", "Electro House"], src: "discogs" }, // NERVO
  "ness": { m: ["Techno"], s: ["Deep Techno", "Minimal Techno", "Ambient"], src: "discogs" }, // Ness
  "netsky": { m: ["Drum & Bass"], s: ["Dubstep", "Electro House", "Breakbeat"], src: "discogs+wikidata" }, // Netsky
  "nghtmre": { m: ["EDM"], s: ["Dubstep", "Future Bass", "Electro House"], src: "research" }, // NGHTMRE
  "nhu": { m: ["Techno", "Hard Techno"], s: [], src: "research" }, // Nhū
  "nia-archives": { m: ["Drum & Bass"], s: ["Jungle"], src: "research" }, // Nia Archives
  "nic-fanciulli": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Progressive House"], src: "research" }, // Nic Fanciulli
  "nick-cave-the-bad-seeds": { m: [], s: [], src: "hors-perimetre" }, // Nick Cave & The Bad Seeds
  "nick-d-lite": { m: ["House"], s: ["Bass House", "Tech House"], src: "research" }, // Nick D-lite
  "nick-hoppner": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Deep House"], src: "discogs" }, // Nick Höppner
  "nick-warren": { m: ["Techno", "House"], s: ["Electronica", "Progressive House"], src: "discogs+wikidata" }, // Nick Warren
  "nickodemus": { m: ["House"], s: ["Afro House", "Downtempo"], src: "research" }, // Nickodemus
  "nico-moreno": { m: ["Techno"], s: ["Industrial Techno"], src: "discogs+musicbrainz" }, // Nico Moreno
  "nicolas-cuer": { m: ["Techno"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Nicolas Cuer
  "nicolas-julian": { m: ["Hard Techno"], s: [], src: "wikidata" }, // Nicolas Julian
  "nicolas-lutz": { m: ["Techno"], s: ["Electro", "Tech House", "Industrial"], src: "discogs" }, // Nicolas Lutz
  "nicole-moudaber": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Nicole Moudaber
  "nicone": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Niconé
  "nightwave": { m: ["Techno", "Drum & Bass"], s: ["Grime", "Bass Music", "Breakbeat"], src: "discogs" }, // Nightwave
  "nikki-nair": { m: ["Techno"], s: ["Breakbeat", "Electro", "Leftfield"], src: "discogs" }, // Nikki Nair
  "nikolina": { m: ["Hard Techno", "Techno"], s: ["Schranz", "Hardgroove"], src: "research" }, // Nikolina
  "nina-kraviz": { m: ["Techno", "House"], s: ["Deep House", "IDM", "Dubstep"], src: "discogs+last.fm+wikidata" }, // Nina Kraviz
  "nkisi": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Nkisi
  "nmss": { m: ["Techno"], s: ["Breakbeat", "Downtempo", "Electro"], src: "discogs" }, // NMSS
  "noiseflow": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo"], src: "research" }, // Noiseflow
  "noiseshock": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Noiseshock
  "noize-suppressor": { m: ["Hardcore"], s: ["Gabber"], src: "research" }, // Noize Suppressor
  "noizer": { m: ["Hardstyle", "Hardcore", "Techno"], s: ["Gabber", "Jumpstyle"], src: "discogs" }, // Noizer
  "noless": { m: ["House"], s: ["Tech House"], src: "research" }, // Noless
  "norbak": { m: ["Techno"], s: ["Deep Techno", "Ambient", "Experimental"], src: "discogs" }, // Norbak
  "nordiks": { m: ["House"], s: ["Deep House"], src: "research" }, // Nordiks
  "nosedrip": { m: ["Techno"], s: ["Ambient", "Experimental", "Minimal Techno"], src: "discogs" }, // Nosedrip
  "nosferatu": { m: ["Hardcore"], s: ["Gabber", "Ambient"], src: "discogs" }, // Nosferatu
  "notion": { m: ["Drum & Bass", "House"], s: ["Bassline", "UK Garage", "Electro House"], src: "discogs" }, // Notion
  "novah": { m: ["House", "Techno", "Trance"], s: ["Electro House", "Hard House", "Tech Trance"], src: "discogs" }, // Novah
  "nox": { m: ["House", "Techno"], s: [], src: "research" }, // NOX
  "nto": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz" }, // NTO
  "nu-tone": { m: ["Techno", "Drum & Bass"], s: ["Electronica"], src: "wikidata" }, // Nu:Tone
  "nyra": { m: ["Hard Techno", "Trance"], s: ["Bounce"], src: "research" }, // Nyra
  "o-b-i": { m: ["Hard Techno", "Trance"], s: ["Schranz"], src: "discogs" }, // O.B.I.
  "obsimo": { m: ["House", "Techno"], s: ["Electro", "IDM"], src: "discogs" }, // Obsimo
  "octave-one": { m: ["Techno"], s: ["Detroit Techno", "Deep House"], src: "research" }, // Octave One
  "octo-octa": { m: ["House"], s: ["Breakbeat"], src: "research" }, // Octo Octa
  "odyssee": { m: ["Trance"], s: ["Ambient"], src: "research" }, // Odyssée
  "ofenbach": { m: ["EDM", "House"], s: ["Electropop"], src: "discogs+wikidata" }, // Ofenbach
  "ogalla": { m: ["Hardstyle"], s: ["Newstyle", "Hard House", "Makina"], src: "research" }, // Ogalla
  "ogazon": { m: ["House", "Techno"], s: [], src: "research" }, // Ogazón
  "ojoo": { m: ["Techno"], s: ["Experimental", "Ambient", "Industrial"], src: "discogs" }, // ojoo
  "ok-eg": { m: ["Techno"], s: ["Ambient", "Deep Techno", "Dub Techno"], src: "discogs" }, // OK EG
  "ok-williams": { m: ["Techno", "House"], s: [], src: "discogs" }, // Ok Williams
  "oklou": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs+musicbrainz" }, // Oklou
  "olanskii": { m: ["House", "Techno"], s: ["Disco", "Leftfield", "Deep House"], src: "discogs" }, // Olanskii
  "oliver-heldens": { m: ["EDM"], s: ["Electro House", "Future House"], src: "wikidata" }, // Oliver Heldens
  "oliver-huntemann": { m: ["Techno"], s: ["Electro", "Tech House", "Minimal Techno"], src: "discogs+wikidata" }, // Oliver Huntemann
  "oliver-koletzki": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "discogs" }, // Oliver Koletzki
  "oliver-lieb": { m: ["Techno"], s: ["Ambient", "Progressive House", "Tech House"], src: "discogs+wikidata" }, // Oliver Lieb
  "oliver-magenta": { m: ["EDM", "House"], s: ["Electro", "Deep House"], src: "research" }, // Oliver Magenta
  "olivia-lensen": { m: ["House", "Techno"], s: [], src: "research" }, // Olivia Lensen
  "omaks": { m: ["House", "Hard Techno", "EDM"], s: ["Electro House"], src: "discogs" }, // Omaks
  "omiki": { m: ["Psytrance", "Trance"], s: ["Progressive Trance"], src: "research" }, // Omiki
  "omnya": { m: ["Hardstyle"], s: ["Progressive House", "Disco"], src: "discogs" }, // Omnya
  "one87": { m: ["Drum & Bass"], s: ["Neurofunk", "Jungle"], src: "research" }, // One87
  "onlynumbers": { m: ["Techno", "Hard Techno", "Hardstyle"], s: [], src: "discogs" }, // Onlynumbers
  "ophidian": { m: ["Hardcore"], s: ["Doomcore"], src: "discogs+wikidata" }, // Ophidian
  "orkidea": { m: ["Trance"], s: ["Progressive Trance"], src: "discogs" }, // Orkidea
  "ornella": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "research" }, // Ornella
  "oscar-mulero": { m: ["Techno"], s: ["IDM", "Experimental", "Ambient"], src: "discogs+wikidata" }, // Oscar Mulero
  "ouai-stephane": { m: ["House", "Techno"], s: ["Breakbeat", "Electro"], src: "research" }, // Ouai Stéphane
  "outlined": { m: ["Hardstyle"], s: [], src: "discogs" }, // Outlined
  "outsiders": { m: ["Hardstyle"], s: [], src: "research" }, // Outsiders
  "overmono": { m: ["Techno"], s: ["Breakbeat", "Ambient", "UK Garage"], src: "discogs+last.fm+musicbrainz" }, // Overmono
  "oxia": { m: ["Techno", "House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Oxia
  "ozan": { m: ["Techno"], s: ["Hypnotic Techno"], src: "research" }, // Ozan
  "paco-osuna": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Paco Osuna
  "pact-joachim-pastor-joris-delacroix-teho": { m: ["Techno", "House"], s: ["Melodic Techno"], src: "research" }, // PACT (Joachim Pastor + Joris Delacroix + Teho)
  "paffendorf": { m: ["Trance"], s: ["Euro House", "Hard Trance", "Hard House"], src: "discogs+wikidata" }, // Paffendorf
  "palms-trax": { m: ["House"], s: ["Deep House", "Disco", "Nu-Disco"], src: "research" }, // Palms Trax
  "paloma": { m: ["House"], s: ["Disco", "Afro House"], src: "research" }, // Paloma
  "paloma-colombe": { m: ["House", "Techno"], s: ["Disco", "Afro House", "Bass Music"], src: "research" }, // Paloma Colombe
  "pan-pot": { m: ["Techno"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Pan-Pot
  "pancratio": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Electro"], src: "discogs" }, // Pancratio
  "panic-mc-alee": { m: ["Hardcore"], s: [], src: "discogs" }, // Panic & MC Alee
  "panteros666": { m: ["Techno", "House", "Trance"], s: ["Tech Trance"], src: "discogs" }, // Panteros666
  "paralich": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "Melodic Techno"], src: "research" }, // Paralich
  "paramida": { m: ["House"], s: ["Disco", "Italo Disco", "Goa Trance"], src: "research" }, // Paramida
  "paranoid-london": { m: ["House", "Techno"], s: ["Acid House"], src: "discogs" }, // Paranoid London
  "parents-in-denial": { m: ["Hardcore"], s: ["Frenchcore"], src: "research" }, // Parents in Denial
  "part-time-killer": { m: ["Techno", "Hard Techno"], s: ["Peak Time Techno", "Industrial Techno"], src: "research" }, // Part Time Killer
  "partyraiser": { m: ["Hardcore"], s: ["Uptempo", "Gabber"], src: "research" }, // Partyraiser
  "pat-b": { m: ["Hardstyle"], s: ["Jumpstyle"], src: "research" }, // Pat B
  "paul-elstak": { m: ["Hardcore"], s: ["Gabber", "Happy Hardcore"], src: "discogs+last.fm+wikidata" }, // Paul Elstak
  "paul-kalkbrenner": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Paul Kalkbrenner
  "paul-oakenfold": { m: ["Trance"], s: ["Progressive Trance", "Breakbeat", "Progressive House"], src: "discogs+wikidata" }, // Paul Oakenfold
  "paul-sg": { m: ["Drum & Bass"], s: [], src: "discogs" }, // Paul SG
  "paul-van-dyk": { m: ["Trance"], s: ["Progressive Trance", "Uplifting Trance"], src: "research" }, // Paul van Dyk
  "pawlowski": { m: ["Hard Techno", "Acid Techno", "Trance"], s: ["Hardgroove", "Hard House"], src: "research" }, // Pawlowski
  "pawsa": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Pawsa
  "pearson-sound": { m: ["Techno", "Drum & Bass"], s: ["Bass Music", "Dubstep", "Experimental"], src: "discogs" }, // Pearson Sound
  "peder-mannerfelt": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Peder Mannerfelt
  "pegassi": { m: ["Techno", "Hard Techno", "Trance"], s: ["Eurodance"], src: "research" }, // Pegassi
  "peggy-gou": { m: ["House", "Techno", "EDM"], s: ["Deep House"], src: "discogs+last.fm+musicbrainz" }, // Peggy Gou
  "pendulum": { m: ["Drum & Bass"], s: ["Dancefloor Drum & Bass", "Electronic Rock"], src: "research" }, // Pendulum
  "perc": { m: ["Techno"], s: ["Industrial", "Minimal Techno", "Progressive House"], src: "discogs" }, // Perc
  "perila": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // Perila
  "peter-pan": { m: ["Techno"], s: [], src: "research" }, // Peter Pan
  "peter-van-hoesen": { m: ["Techno"], s: ["Minimal Techno", "Ambient", "Dub Techno"], src: "discogs" }, // Peter Van Hoesen
  "peterblue": { m: ["Techno", "House"], s: ["Hardgroove", "Latin Club", "Guaracha"], src: "research" }, // Peterblue
  "petit-biscuit": { m: ["Techno", "House", "EDM"], s: ["Downtempo", "Deep House", "Electropop"], src: "discogs+wikidata" }, // Petit Biscuit
  "peven-everett": { m: ["House"], s: ["Deep House", "Future Jazz"], src: "discogs" }, // Peven Everett
  "phace": { m: ["Drum & Bass"], s: ["Dubstep", "Tech House"], src: "discogs" }, // Phace
  "phara": { m: ["Techno", "Psytrance"], s: ["Goa Trance"], src: "discogs" }, // Phara
  "phase": { m: ["Drum & Bass", "Techno"], s: ["Minimal Techno", "Eurodance"], src: "discogs" }, // Phase
  "phase-fatale": { m: ["Techno"], s: ["Industrial", "EBM"], src: "discogs" }, // Phase Fatale
  "philou-louzolo": { m: ["House", "Techno"], s: ["Afro House", "Deep House", "Tribal House"], src: "research" }, // Philou Louzolo
  "photek": { m: ["Drum & Bass", "Techno", "House"], s: ["Downtempo", "Deep House"], src: "discogs+wikidata" }, // Photek
  "phuture-noize": { m: ["Hardstyle"], s: [], src: "research" }, // Phuture Noize
  "pianeti-sintetici": { m: ["Techno"], s: ["Deep Techno", "Experimental", "Ambient"], src: "discogs" }, // Pianeti Sintetici
  "piazza": { m: ["House"], s: ["Melodic House", "Indie Dance", "Afro House"], src: "research" }, // Piazza
  "piem": { m: ["House"], s: ["Tech House"], src: "discogs" }, // PIEM
  "pigminds": { m: ["Hardcore"], s: ["Uptempo", "Frenchcore"], src: "research" }, // Pigminds
  "pink-concrete": { m: ["Techno"], s: [], src: "discogs" }, // Pink Concrete
  "pinkpantheress": { m: ["Drum & Bass"], s: ["Jungle"], src: "wikidata" }, // PinkPantheress
  "pinotello": { m: ["Hardcore"], s: [], src: "discogs" }, // Pinotello
  "planetary-assault-systems": { m: ["Techno"], s: ["Ambient", "Minimal Techno", "Broken Beat"], src: "discogs" }, // Planetary Assault Systems
  "plo-man": { m: ["Techno"], s: ["Ambient", "Experimental", "Leftfield"], src: "discogs" }, // Plo Man
  "polar-inertia": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Polar Inertia
  "pole": { m: ["Techno"], s: ["Electronica", "Experimental"], src: "discogs+wikidata" }, // Pole
  "polo-pan": { m: ["Techno"], s: ["Electro"], src: "discogs+wikidata" }, // Polo & Pan
  "polygonia": { m: ["Techno"], s: ["Deep Techno"], src: "discogs" }, // Polygonia
  "pooja-b": { m: ["Techno"], s: [], src: "discogs" }, // Pooja B
  "popof": { m: ["Techno"], s: ["Minimal Techno", "Tech House", "Electro"], src: "discogs" }, // Popof
  "povoa": { m: ["House"], s: ["Dubstep", "Baile Funk"], src: "research" }, // Povoa
  "prada2000": { m: ["Techno"], s: [], src: "discogs" }, // Prada2000
  "prefix-density": { m: ["Hardstyle"], s: [], src: "discogs" }, // Prefix & Density
  "primate": { m: ["Drum & Bass"], s: ["Jump-Up"], src: "research" }, // Primate
  "project-one": { m: ["Hardstyle"], s: [], src: "research" }, // Project One
  "prospa": { m: ["Techno", "House", "EDM"], s: ["Breakbeat", "Rave"], src: "discogs+last.fm" }, // Prospa
  "prunk": { m: ["House"], s: ["Deep House", "UK Garage", "Tech House"], src: "research" }, // Prunk
  "pulp": { m: [], s: [], src: "hors-perimetre" }, // Pulp
  "pulsedriver": { m: ["EDM", "Trance"], s: ["Eurodance"], src: "discogs+wikidata" }, // Pulsedriver
  "purple-disco-machine": { m: ["House"], s: ["Nu-Disco", "Disco"], src: "research" }, // Purple Disco Machine
  "qlas": { m: [], s: [], src: "hors-perimetre" }, // Qlas
  "quelza": { m: ["Techno"], s: ["IDM", "Industrial", "Breakbeat"], src: "discogs" }, // Quelza
  "quentin-schneider": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Quentin Schneider
  "qwenty": { m: ["Techno"], s: ["Experimental", "IDM"], src: "discogs" }, // Qwenty
  "r-dhad": { m: ["Techno"], s: ["Dub Techno", "Minimal Techno", "Industrial Techno"], src: "research" }, // Rødhåd
  "r3hab": { m: ["EDM", "House"], s: ["Electro House", "Progressive House"], src: "discogs+musicbrainz" }, // R3HAB
  "radical-redemption": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle"], src: "research" }, // Radical Redemption
  "rafael-anton-irisarri": { m: ["Techno"], s: ["Ambient"], src: "discogs" }, // Rafael Anton Irisarri
  "rampa": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Rampa
  "ran-d": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Ran-D
  "randali": { m: ["Techno"], s: [], src: "discogs" }, // Randali
  "ranger-trucco": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Ranger Trucco
  "raredub": { m: ["Techno"], s: ["Electro", "Tech House"], src: "discogs" }, // Raredub
  "raresh": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "research" }, // Raresh
  "rawb": { m: [], s: [], src: "hors-perimetre" }, // RAWB
  "raxeller": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Raxeller
  "rbenyx": { m: ["Hard Techno", "Hardcore", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // ØRBENYX
  "rd": { m: ["Hardcore"], s: ["Experimental", "Bass Music", "Minimal Techno"], src: "discogs" }, // RDØ
  "re-style": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Re-Style
  "rebelion": { m: ["Hardstyle"], s: [], src: "research" }, // Rebelion
  "rebko": { m: ["Drum & Bass"], s: ["Neurofunk", "Liquid Drum & Bass"], src: "research" }, // Rebko
  "redbatun": { m: ["Hard Techno"], s: [], src: "research" }, // Redbatun
  "refuzion": { m: ["Hardstyle"], s: ["Happy Hardcore"], src: "discogs+wikidata" }, // Refuzion
  "regain": { m: ["Hardstyle"], s: ["Industrial"], src: "discogs+wikidata" }, // Regain
  "regi": { m: ["Trance", "EDM"], s: ["Eurodance"], src: "research" }, // Regi
  "reinier-zonneveld": { m: ["Acid Techno", "Techno"], s: ["Minimal Techno"], src: "research" }, // Reinier Zonneveld
  "rejecta": { m: ["Hardstyle"], s: [], src: "discogs" }, // Rejecta
  "rekkt": { m: ["Hardcore", "Hard Techno"], s: ["Gabber"], src: "research" }, // REKKT
  "relova": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Relova
  "remzcore": { m: ["Hardcore"], s: [], src: "discogs" }, // Remzcore
  "restricted": { m: ["Hard Techno"], s: ["Rave"], src: "research" }, // Restricted
  "restrictless": { m: ["Hardstyle"], s: ["Early Hardstyle"], src: "research" }, // Restrictless
  "rey-colino": { m: ["House", "Techno", "Acid Techno"], s: ["Progressive House", "Electro"], src: "research" }, // Rey Colino
  "rey-kjavik": { m: ["House", "Techno"], s: ["Deep House", "Tech House", "Downtempo"], src: "discogs" }, // Rey&Kjavik
  "ricardo-villalobos": { m: ["Techno", "House"], s: ["Minimal Techno", "Microhouse"], src: "research" }, // Ricardo Villalobos
  "richie-hawtin": { m: ["Techno"], s: ["Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Richie Hawtin
  "rick-shiver": { m: ["House", "Techno"], s: ["Disco", "Italo Disco", "Leftfield"], src: "discogs" }, // Rick Shiver
  "riot-shift": { m: ["Hardstyle"], s: [], src: "discogs" }, // Riot Shift
  "rob-gee": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Rob Gee
  "robbie-doherty": { m: ["House"], s: ["Deep House", "Tech House"], src: "research" }, // Robbie Doherty
  "robert-hood": { m: ["Techno"], s: ["Minimal Techno"], src: "research" }, // Robert Hood
  "robin-hirte": { m: ["Techno"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Robin Hirte
  "robin-nicolas": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "research" }, // Robin Nicolas
  "robot-rock-alive": { m: ["House", "EDM"], s: ["French Touch", "Electro"], src: "research" }, // Robot Rock Alive
  "rocketman": { m: ["Trance", "Techno", "House"], s: ["Hard Trance"], src: "discogs" }, // Rocketman
  "roger-sanchez": { m: ["House"], s: ["Deep House", "Garage House", "Electro"], src: "discogs" }, // Roger Sanchez
  "rokis": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Rokis
  "roll-dann": { m: ["Techno"], s: [], src: "discogs" }, // Roll Dann
  "romain-garcia": { m: ["House"], s: ["Progressive House"], src: "discogs" }, // Romain Garcia
  "roman-flugel": { m: ["Techno", "House"], s: ["Tech House", "Minimal Techno", "Deep House"], src: "discogs" }, // Roman Flügel
  "romare": { m: ["House"], s: ["UK Garage", "Downtempo"], src: "research" }, // Romare
  "romen-est-omen": { m: ["Techno"], s: ["Classic Techno"], src: "research" }, // Romen Est Omen
  "ron-trent": { m: ["House"], s: ["Deep House", "Chicago House"], src: "research" }, // Ron Trent
  "ronny-retro": { m: ["Hardstyle"], s: [], src: "discogs" }, // Ronny Retro
  "rooleh": { m: ["House"], s: ["Tech House", "Minimal Techno"], src: "discogs" }, // Rooléh
  "rooler": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Rooler
  "roots-zombie": { m: ["Drum & Bass"], s: ["Dub", "Jungle", "Bass Music"], src: "research" }, // Roots Zombie
  "rose": { m: ["Hard Techno", "Techno", "Psytrance"], s: [], src: "research" }, // Rōse
  "rotterdam-terror-corps": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Rotterdam Terror Corps
  "rouge": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "EBM"], src: "research" }, // Roüge
  "roussakis": { m: ["House"], s: [], src: "research" }, // Roussakis
  "row1": { m: ["Hard Techno", "Trance"], s: ["Hard Trance", "Hard Dance"], src: "research" }, // Row1
  "royksopp": { m: ["House"], s: ["Ambient", "Synth-Pop", "Downtempo"], src: "research" }, // Röyksopp
  "roza-terenzi": { m: ["Techno"], s: ["Breakbeat", "Electro", "Progressive House"], src: "discogs+wikidata" }, // Roza Terenzi
  "rp-boo": { m: ["Techno"], s: ["Footwork"], src: "discogs+wikidata" }, // RP Boo
  "ruben-de-ronde": { m: ["Trance"], s: ["Progressive Trance", "Progressive House"], src: "discogs" }, // Ruben de Ronde
  "rudimental": { m: ["Drum & Bass"], s: [], src: "wikidata" }, // Rudimental
  "ruffneck": { m: ["House", "Hardcore"], s: ["Garage House", "Gabber"], src: "discogs" }, // Ruffneck
  "rusko": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs+wikidata" }, // Rusko
  "ryan-dank": { m: ["House"], s: ["Deep House", "Organic House"], src: "research" }, // Ryan Dank
  "ryan-elliott": { m: ["House", "Techno"], s: ["Deep House"], src: "research" }, // Ryan Elliott
  "ryan-resso": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "discogs" }, // Ryan Resso
  "ryota": { m: ["Techno", "Trance"], s: ["Ambient", "Deep House", "Minimal Techno"], src: "discogs" }, // RYOTA
  "s-p-y": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass", "Neurofunk", "Jungle"], src: "research" }, // S.P.Y
  "s3ppa": { m: ["House", "Trance"], s: ["Hard House", "Hard Trance", "Tech House"], src: "discogs" }, // S3PPA
  "saar-kuus": { m: ["House"], s: ["UK Garage", "Minimal Techno"], src: "research" }, // Saar Kuus
  "sadu": { m: ["Techno", "House"], s: ["Tech House"], src: "discogs" }, // SADU
  "sakyra": { m: ["Hardcore"], s: [], src: "discogs" }, // Sakyra
  "sally-c": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Sally C
  "saltysis": { m: ["Hard Techno", "Trance"], s: ["Hard Trance", "Schranz", "Neo Rave"], src: "research" }, // SaltySis
  "salute": { m: ["House"], s: ["Garage House", "Experimental", "French House"], src: "discogs" }, // Salute
  "sam-divine": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Sam Divine
  "sam-feldt": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Sam Feldt
  "sam-ruffillo": { m: ["House"], s: ["Deep House", "Nu-Disco"], src: "discogs" }, // Sam Ruffillo
  "sama-abdulhadi": { m: ["Techno"], s: ["Peak Time Techno", "Hardgroove"], src: "research" }, // Sama' Abdulhadi
  "sammy-virji": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Sammy Virji
  "samuel-moriero": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // Samuel Moriero
  "samynator": { m: ["Hardcore"], s: [], src: "discogs" }, // Samynator
  "sander-kleinenberg": { m: ["Techno", "House"], s: ["Electronica", "Progressive House"], src: "discogs+wikidata" }, // Sander Kleinenberg
  "sandrien": { m: ["Techno", "Acid Techno"], s: ["Breakbeat"], src: "research" }, // Sandrien
  "sanem": { m: ["Hard Techno", "Psytrance"], s: ["Psy-Trance Techno"], src: "research" }, // Sanem
  "sansibar": { m: ["Techno"], s: ["Electro", "Breakbeat"], src: "discogs" }, // Sansibar
  "sant-s": { m: ["House", "Techno"], s: ["Tech House", "Breakbeat"], src: "discogs" }, // Santøs
  "saoirse": { m: ["House", "Techno"], s: ["UK Garage", "Breakbeat"], src: "research" }, // Saoirse
  "sara-landry": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "Minimal Techno"], src: "discogs+last.fm+musicbrainz+wikidata" }, // Sara Landry
  "sarah-de-warren": { m: ["Trance", "House"], s: ["Progressive House", "Progressive Trance", "Dubstep"], src: "discogs" }, // Sarah de Warren
  "sasha": { m: ["House", "Trance"], s: ["Progressive House", "Progressive Trance", "Breakbeat"], src: "research" }, // Sasha
  "sasha-john-digweed": { m: ["House", "Trance"], s: ["Progressive House", "Progressive Trance"], src: "research" }, // Sasha & John Digweed
  "satoshi-tomiie": { m: ["House"], s: ["Progressive House", "Tech House", "Deep House"], src: "discogs" }, // Satoshi Tomiie
  "schacke": { m: ["Techno"], s: ["Experimental", "Ambient"], src: "discogs" }, // Schacke
  "schwesta-p": { m: ["House"], s: ["Tech House", "Progressive House"], src: "research" }, // Schwesta P
  "scientyfreaks": { m: ["Psytrance", "Techno"], s: ["Progressive Trance", "Breakbeat"], src: "research" }, // Scientyfreaks
  "scissor-sisters": { m: ["House"], s: ["Nu-Disco"], src: "wikidata" }, // Scissor Sisters
  "scooter": { m: ["Techno", "Hardcore", "EDM"], s: ["Rave", "Happy Hardcore", "Eurodance"], src: "discogs+musicbrainz" }, // Scooter
  "scott-steer": { m: ["House"], s: ["Bass House"], src: "research" }, // Scott Steer
  "scratch-massive": { m: ["Techno"], s: ["Electro"], src: "discogs" }, // Scratch Massive
  "sean-laird": { m: ["Techno"], s: [], src: "research" }, // Sean Laird
  "seasick": { m: [], s: [], src: "hors-perimetre" }, // Seasick
  "sebastian": { m: ["House"], s: ["Electro", "French House"], src: "research" }, // SebastiAn
  "sebastian-ingrosso": { m: ["House"], s: ["Progressive House", "Tech House", "Electro House"], src: "discogs" }, // Sebastian Ingrosso
  "sebastien-drums": { m: ["House"], s: ["Progressive House", "Electro House", "French House"], src: "discogs" }, // Sébastien Drums
  "sebastien-leger": { m: ["House"], s: ["Tech House", "Electro"], src: "discogs" }, // Sebastien Leger
  "seconds-setaoc-mass-phara": { m: ["Techno"], s: ["Peak Time Techno"], src: "research" }, // SECONDS (Setaoc Mass & Phara)
  "sedef-adasi": { m: ["Techno", "House"], s: ["Electro", "Acid House"], src: "discogs" }, // Sedef Adasï
  "see-rose": { m: ["Trance", "Hard Techno"], s: ["Hard Trance"], src: "research" }, // See Rose
  "seelen": { m: ["House"], s: ["Deep House", "Tech House", "Electro"], src: "research" }, // Seelen
  "sefa": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Sefa
  "serafina": { m: ["Techno", "Hard Techno"], s: ["Hardgroove", "Bouncy Techno"], src: "research" }, // Serafina
  "serum": { m: ["Drum & Bass"], s: ["Downtempo", "Experimental"], src: "discogs" }, // Serum
  "setaoc-mass": { m: ["Techno"], s: ["Electro", "Ambient", "Experimental"], src: "discogs" }, // Setaoc Mass
  "seth-troxler": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "research" }, // Seth Troxler
  "sg-lewis": { m: ["House"], s: ["Deep House", "Electro", "Downtempo"], src: "discogs" }, // SG Lewis
  "shackleton": { m: ["Drum & Bass", "Techno"], s: ["Dubstep", "Experimental"], src: "discogs+wikidata" }, // Shackleton
  "shae-reid": { m: ["House"], s: ["Tech House"], src: "research" }, // Shae Reid
  "shaggy": { m: [], s: [], src: "hors-perimetre" }, // Shaggy
  "shaleen": { m: ["Techno"], s: [], src: "discogs" }, // Shaleen
  "shanti-celeste": { m: ["House", "Techno"], s: ["Electro", "Ambient", "Deep House"], src: "research" }, // Shanti Celeste
  "shaun-johnston": { m: ["Techno", "Hard Techno"], s: [], src: "research" }, // Shaun Johnston
  "she-her": { m: ["Techno"], s: [], src: "research" }, // SHE/HER
  "she-the-dj": { m: ["House"], s: ["UK Garage", "Breakbeat"], src: "research" }, // She The DJ
  "sherelle": { m: ["Drum & Bass"], s: ["Jungle", "Footwork"], src: "research" }, // Sherelle
  "shimza": { m: ["House"], s: ["Tribal House"], src: "discogs" }, // Shimza
  "shl-mo": { m: ["Techno", "Hard Techno"], s: ["Ambient", "IDM"], src: "research" }, // Shlømo
  "showtek": { m: ["Hardstyle", "EDM"], s: ["Electro House", "Big Room", "Jumpstyle"], src: "research" }, // Showtek
  "shygirl": { m: ["House", "EDM"], s: ["Deconstructed Club", "UK Garage"], src: "research" }, // Shygirl
  "sickmode": { m: ["Hardstyle"], s: [], src: "discogs" }, // Sickmode
  "sidney-charles": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Sidney Charles
  "sigala": { m: ["House"], s: ["Electro", "Progressive House"], src: "discogs" }, // Sigala
  "sigma": { m: ["Drum & Bass"], s: ["Dubstep"], src: "discogs+musicbrainz" }, // Sigma
  "silva-bumpa": { m: ["House"], s: ["UK Garage", "Bassline", "Speed Garage"], src: "research" }, // Silva Bumpa
  "silvie-loto": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Electro House"], src: "discogs" }, // Silvie Loto
  "sim0ne": { m: ["House"], s: [], src: "discogs" }, // sim0ne
  "six-ou-sept": { m: ["Acid Techno", "Techno"], s: [], src: "discogs" }, // Six ou Sept
  "skarn": { m: ["Techno", "House"], s: ["Melodic Techno", "Progressive House"], src: "research" }, // Skarn
  "skee-mask": { m: ["Techno"], s: ["Breakbeat", "Ambient"], src: "discogs" }, // Skee Mask
  "skepta": { m: ["House"], s: ["Tech House", "Grime"], src: "research" }, // Skepta
  "skream": { m: ["House", "Techno"], s: ["Dubstep", "UK Garage", "Disco"], src: "research" }, // Skream
  "skream-benga": { m: ["Drum & Bass", "House"], s: ["Dubstep", "UK Garage"], src: "research" }, // Skream & Benga
  "skrillex": { m: ["EDM", "Techno", "Drum & Bass"], s: ["Dubstep", "Breakbeat", "Electro House"], src: "discogs+musicbrainz" }, // Skrillex
  "slam": { m: ["House", "Techno"], s: ["Tech House", "Downtempo", "Electro"], src: "discogs" }, // Slam
  "slin": { m: ["House", "Techno", "EDM"], s: ["Electro House", "Hard Trance", "Progressive House"], src: "discogs" }, // Slin
  "slvl": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // SLVL
  "sneijder": { m: ["Trance"], s: ["Tech Trance", "Hard Trance"], src: "discogs" }, // Sneijder
  "snts": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // SNTS
  "sofia-kourtesis": { m: ["House"], s: ["Deep House", "Microhouse"], src: "research" }, // Sofia Kourtesis
  "softy": { m: ["Techno", "House"], s: ["Ambient", "UK Garage", "Experimental"], src: "discogs" }, // Softy
  "solomun": { m: ["House", "Techno"], s: ["Deep House", "Minimal Techno", "Tech House"], src: "discogs+last.fm+musicbrainz" }, // Solomun
  "solyd": { m: ["Hard Techno"], s: [], src: "discogs" }, // Solyd
  "sonny-fodera": { m: ["House"], s: ["Deep House", "Tech House"], src: "discogs" }, // Sonny Fodera
  "sophie-sugar": { m: ["Trance"], s: ["Progressive Trance", "Hard Trance"], src: "discogs+wikidata" }, // Sophie Sugar
  "sosa": { m: ["Trance", "House"], s: ["Tech House", "Progressive Trance"], src: "discogs" }, // Sosa
  "soulwax": { m: ["House"], s: ["Electro House", "Electroclash", "New Rave"], src: "research" }, // Soulwax
  "sound-rush": { m: ["Hardstyle"], s: ["Euphoric Hardstyle"], src: "research" }, // Sound Rush
  "space-92": { m: ["Techno"], s: ["Tech Trance"], src: "discogs" }, // Space 92
  "spacid": { m: ["Acid Techno"], s: [], src: "discogs" }, // Spacid
  "special-d": { m: ["Trance", "EDM"], s: ["Euro House", "Hard Trance"], src: "discogs" }, // Special D
  "special-request-sully": { m: ["Drum & Bass"], s: ["Jungle", "Breakbeat", "Hardcore Breaks"], src: "research" }, // Special Request & Sully
  "speedwagon": { m: ["Drum & Bass"], s: ["Jungle", "Liquid Drum & Bass"], src: "research" }, // Speedwagon
  "speedy-j": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno", "Industrial Techno"], src: "research" }, // Speedy J
  "spfdj": { m: ["Techno", "Hard Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // SPFDJ
  "spikey-lee": { m: ["Techno", "House"], s: [], src: "research" }, // Spikey Lee
  "spoink": { m: ["Techno", "Drum & Bass"], s: ["Dubstep", "Live Electronic"], src: "research" }, // Spoink
  "stan-christ": { m: ["Techno", "Hard Techno"], s: [], src: "discogs" }, // Stan Christ
  "stanton": { m: ["Hardcore"], s: ["Gabber", "Early Rave"], src: "research" }, // Stanton
  "stanton-warriors": { m: ["Techno"], s: ["Breakbeat"], src: "discogs" }, // Stanton Warriors
  "stef-davidse": { m: ["House"], s: ["Deep House", "Tech House"], src: "discogs" }, // Stef Davidse
  "steffi": { m: ["Techno", "House"], s: ["Deep House", "Electro", "IDM"], src: "discogs" }, // Steffi
  "stephan-bodzin": { m: ["Techno"], s: ["Minimal Techno", "Tech House"], src: "research" }, // Stephan Bodzin
  "stephan-licha": { m: ["House", "Techno"], s: ["Tech House", "Deep House"], src: "research" }, // Stephan Licha
  "stereo-mcs": { m: ["House"], s: ["Trip-Hop", "Breakbeat", "Acid Jazz"], src: "research" }, // Stereo MCs
  "stereolab": { m: [], s: [], src: "hors-perimetre" }, // Stereolab
  "steve-angello": { m: ["House"], s: ["Tech House", "Electro", "Progressive House"], src: "discogs" }, // Steve Angello
  "steve-aoki": { m: ["House", "Techno"], s: ["Electronica", "Electro House"], src: "discogs+musicbrainz+wikidata" }, // Steve Aoki
  "stijn-vm": { m: ["House", "Trance"], s: ["Electro", "Progressive Trance"], src: "research" }, // Stijn VM
  "sting": { m: [], s: [], src: "hors-perimetre" }, // Sting
  "stv": { m: ["Hardcore"], s: ["Electro House", "Progressive House", "Tech House"], src: "discogs" }, // STV
  "stvw": { m: ["EDM", "Hardcore"], s: ["Electro House", "Happy Hardcore"], src: "discogs" }, // STVW
  "sub-focus": { m: ["Drum & Bass", "EDM"], s: ["Drumstep", "Dubstep", "Electro House"], src: "research" }, // Sub Focus
  "sub-sonik": { m: ["Hardstyle"], s: [], src: "discogs" }, // Sub Sonik
  "sub-zero-project": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Sub Zero Project
  "sunnery-james-ryan-marciano": { m: ["House"], s: ["Progressive House"], src: "wikidata" }, // Sunnery James & Ryan Marciano
  "surgeon": { m: ["Techno"], s: ["Experimental", "Ambient", "Dubstep"], src: "discogs+wikidata" }, // Surgeon
  "suzane": { m: ["Techno"], s: ["Electro"], src: "wikidata" }, // Suzane
  "suze": { m: ["House", "Techno"], s: ["Melodic House", "Progressive House", "Melodic Techno"], src: "research" }, // SUZé
  "sven-vath": { m: ["Techno", "Trance"], s: ["Electro", "Minimal Techno", "Tech House"], src: "discogs+musicbrainz+wikidata" }, // Sven Väth
  "swae-lee": { m: [], s: [], src: "hors-perimetre" }, // Swae Lee
  "swedish-house-mafia": { m: ["House", "EDM"], s: ["Progressive House"], src: "research" }, // Swedish House Mafia
  "swen-baez": { m: ["Techno", "House"], s: ["Deep House", "Tech House", "Progressive House"], src: "discogs" }, // Swen Baez
  "sydney-ayven": { m: ["EDM", "House"], s: ["Big Room"], src: "research" }, // Sydney Ayven
  "sylence": { m: ["Hardstyle"], s: [], src: "discogs" }, // Sylence
  "syn-cole": { m: ["House", "EDM"], s: ["Electro House", "Progressive House"], src: "discogs" }, // Syn Cole
  "syreeta": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Syreeta
  "t-a-m-22": { m: ["Techno"], s: ["Ambient", "Experimental"], src: "discogs" }, // T.A.M.22
  "t-quest": { m: ["Techno"], s: ["Minimal Techno", "Electro", "Tech House"], src: "discogs" }, // T-Quest
  "talla-2xlc": { m: ["Trance"], s: ["Progressive Trance"], src: "discogs" }, // Talla 2XLC
  "tama-sumo": { m: ["House", "Techno"], s: ["Tech House", "Deep House", "Minimal Techno"], src: "discogs" }, // Tama Sumo
  "tania-vulcano": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Tania Vulcano
  "tassery": { m: ["Hard Techno", "Trance"], s: ["Schranz"], src: "research" }, // Tassery
  "tatie-dee": { m: ["House", "Techno"], s: ["Deep House", "Broken Beat", "Leftfield"], src: "discogs" }, // Tatie Dee
  "tatyana-jane": { m: ["Techno", "Drum & Bass", "House"], s: ["Grime", "Jersey Club", "Leftfield"], src: "discogs" }, // Tatyana Jane
  "tauceti": { m: ["Techno"], s: ["Industrial Techno", "Ambient"], src: "research" }, // Tauceti
  "technimatic": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Technimatic
  "teho": { m: ["Techno", "House"], s: ["Downtempo", "Tech House", "Minimal Techno"], src: "discogs+last.fm" }, // Teho
  "teknoclash": { m: ["EDM", "House"], s: ["Future House", "Electro House", "Bass House"], src: "research" }, // Teknoclash
  "tha-watcher": { m: ["Hardcore", "Hardstyle"], s: ["Uptempo"], src: "research" }, // Tha Watcher
  "tharken": { m: ["Hardcore"], s: [], src: "discogs" }, // Tharken
  "the-advent": { m: ["Techno"], s: ["Electro"], src: "discogs+wikidata" }, // The Advent
  "the-avalanches": { m: ["House", "Techno"], s: ["Disco", "Experimental"], src: "discogs+wikidata" }, // The Avalanches
  "the-avener": { m: ["House"], s: ["Deep House", "Electro"], src: "research" }, // The Avener
  "the-blaze": { m: ["House"], s: ["French House", "Electro"], src: "research" }, // The Blaze
  "the-bloody-beetroots": { m: ["EDM", "Techno"], s: ["Electro House", "Electro"], src: "discogs+wikidata" }, // The Bloody Beetroots
  "the-chainsmokers": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // The Chainsmokers
  "the-dark-horror": { m: ["Hardcore"], s: ["Happy Hardcore"], src: "discogs" }, // The Dark Horror
  "the-lady-machine": { m: ["Techno"], s: ["Hypnotic Techno", "Industrial Techno"], src: "research" }, // The Lady Machine
  "the-martinez-brothers": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // The Martinez Brothers
  "the-mary-wallopers": { m: [], s: [], src: "hors-perimetre" }, // The Mary Wallopers
  "the-prodigy": { m: ["EDM", "Hardcore"], s: ["Big Beat", "Breakbeat", "Rave"], src: "research" }, // The Prodigy
  "the-purge": { m: ["Hardstyle", "Hardcore"], s: ["Rawstyle", "Uptempo"], src: "research" }, // The Purge
  "the-rocketman": { m: ["Trance", "Techno"], s: ["Hard Trance"], src: "discogs" }, // The Rocketman
  "the-sabres-of-paradise": { m: ["Techno", "House"], s: ["Dub Techno", "Industrial Techno"], src: "research" }, // The Sabres of Paradise
  "the-saints": { m: ["Hardstyle", "Hardcore"], s: ["Uptempo"], src: "research" }, // The Saints
  "the-shapeshifters": { m: ["House"], s: ["Nu-Disco", "Disco"], src: "research" }, // The Shapeshifters
  "the-straikerz": { m: ["Hardstyle"], s: [], src: "discogs" }, // The Straikerz
  "the-streets": { m: ["House", "Techno"], s: ["UK Garage", "Breakbeat"], src: "discogs" }, // The Streets
  "the-tunegirl": { m: ["Techno", "Acid Techno"], s: ["Minimal Techno", "Modular Live"], src: "research" }, // The Tunegirl
  "the-upbeats": { m: ["Drum & Bass"], s: ["Downtempo", "Dubstep"], src: "discogs+wikidata" }, // The Upbeats
  "the-wishmaster": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // The Wishmaster
  "theo-kottis": { m: ["House"], s: ["Tech House", "Deep House"], src: "discogs" }, // Theo Kottis
  "theo-parrish": { m: ["Techno", "House"], s: ["Deep House"], src: "discogs+wikidata" }, // Theo Parrish
  "thick-as-thieves": { m: ["House", "Techno", "Trance"], s: ["Disco", "Deep House", "Tech Trance"], src: "discogs" }, // Thick as Thieves
  "thiso": { m: ["Hard Techno", "Techno"], s: ["Industrial Techno"], src: "research" }, // Thiso
  "thomas-ankersmit": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // Thomas Ankersmit
  "thundercat": { m: [], s: [], src: "hors-perimetre" }, // Thundercat
  "thylacine": { m: ["Techno", "House"], s: ["Ambient", "Downtempo", "Deep House"], src: "research" }, // Thylacine
  "tiesto": { m: ["Trance", "EDM", "House"], s: ["Progressive Trance", "Electro House", "Progressive House"], src: "discogs+last.fm+musicbrainz" }, // Tiësto
  "tiga": { m: ["Techno"], s: ["Electro"], src: "discogs+wikidata" }, // Tiga
  "tikiman": { m: ["Techno"], s: ["Dub Techno", "Minimal Techno"], src: "discogs" }, // Tikiman
  "tim-reaper": { m: ["Drum & Bass"], s: ["Jungle"], src: "discogs" }, // Tim Reaper
  "timmy-trumpet": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // Timmy Trumpet
  "timo-maas": { m: ["House"], s: ["Progressive House"], src: "discogs+wikidata" }, // Timo Maas
  "tini-gessler": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Tini Gessler
  "tinlicker": { m: ["House"], s: ["Progressive House", "Deep House"], src: "discogs+wikidata" }, // Tinlicker
  "tino-machauer": { m: ["Techno"], s: [], src: "discogs" }, // Tino Machauer
  "titan": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Titan
  "titi": { m: ["Hard Techno", "Techno"], s: [], src: "research" }, // TITI
  "tjade": { m: ["House", "Techno", "Trance"], s: ["Breakbeat", "Nu-Disco", "Electro"], src: "discogs" }, // Tjade
  "tkz": { m: ["Techno", "Trance"], s: ["Hardgroove"], src: "research" }, // TKZ
  "todd-edwards": { m: ["House"], s: ["UK Garage", "Garage House"], src: "research" }, // Todd Edwards
  "todd-terje": { m: ["House"], s: ["Disco", "Nu-Disco"], src: "discogs" }, // Todd Terje
  "toirabat": { m: ["House"], s: ["Downtempo", "Slow Motion Disco"], src: "research" }, // Toirabat
  "toman": { m: ["House", "Techno"], s: ["Minimal Techno", "Deep House"], src: "discogs+wikidata" }, // Toman
  "tommy-cash": { m: [], s: [], src: "hors-perimetre" }, // Tommy Cash
  "tommy-phillips": { m: ["House"], s: ["Tech House", "Breakbeat"], src: "research" }, // Tommy Phillips
  "tony-humphries": { m: ["House"], s: ["Garage House", "Deep House"], src: "discogs" }, // Tony Humphries
  "tony-moya": { m: ["House"], s: ["Disco", "Tech House"], src: "research" }, // Tony Moya
  "tony-romera": { m: ["House", "EDM"], s: ["Electro House", "Bass House", "French House"], src: "discogs+wikidata" }, // Tony Romera
  "toxic-machinery": { m: ["Hard Techno", "Hardstyle"], s: [], src: "discogs" }, // Toxic Machinery
  "trancemaster-krause": { m: ["Trance"], s: ["Hard House", "Hard Trance"], src: "discogs" }, // Trancemaster Krause
  "tratratrax": { m: ["Techno"], s: ["Guaracha", "Dembow", "Breakbeat"], src: "research" }, // TraTraTrax
  "traumer": { m: ["House", "Techno"], s: ["Minimal Techno", "Deep House"], src: "research" }, // Traumer
  "tricky": { m: ["Techno"], s: ["Trip-Hop"], src: "discogs+wikidata" }, // Tricky
  "trinix": { m: ["EDM", "House"], s: ["Electro House"], src: "research" }, // Trinix
  "trio-xenakis": { m: [], s: [], src: "hors-perimetre" }, // Trio Xenakis
  "triptykh": { m: ["Hard Techno", "Techno"], s: ["Schranz"], src: "discogs" }, // Triptykh
  "tristan": { m: ["Psytrance"], s: ["Experimental", "Goa Trance", "Tribal House"], src: "discogs" }, // Tristan
  "trym": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Hard Trance", "Hard House"], src: "research" }, // Trym
  "tsha": { m: ["House"], s: ["Deep House", "Breakbeat", "Progressive House"], src: "discogs" }, // TSHA
  "twisted-sibling": { m: ["Trance", "Psytrance"], s: ["Progressive Trance"], src: "discogs" }, // Twisted Sibling
  "twonot": { m: ["House", "Techno"], s: ["Tech House", "Afro House", "Melodic Techno"], src: "research" }, // Twonot
  "tymon": { m: ["Hardcore", "Techno"], s: ["Industrial"], src: "discogs" }, // Tymon
  "tyson-o-brien": { m: ["House"], s: ["Deep House"], src: "discogs" }, // Tyson O'Brien
  "u999": { m: ["Techno"], s: ["Bouncy Techno"], src: "research" }, // Ű999
  "udow": { m: ["Hardcore"], s: ["Experimental"], src: "discogs" }, // Udow
  "ueberrest": { m: ["Hard Techno", "Techno"], s: ["Hard Bounce", "Industrial Techno"], src: "research" }, // Ueberrest
  "ummet-ozcan": { m: ["Trance", "EDM", "House"], s: ["Electro House", "Tech Trance", "Progressive House"], src: "discogs+wikidata" }, // Ummet Ozcan
  "umru": { m: ["Techno"], s: ["Experimental"], src: "discogs" }, // umru
  "unai-trotti": { m: ["Techno"], s: ["Electro House", "Breakbeat", "Electro"], src: "discogs" }, // Unai Trotti
  "underground-resistance": { m: ["Techno"], s: ["Electro"], src: "discogs" }, // Underground Resistance
  "underworld": { m: ["Techno", "House"], s: ["Progressive House", "Ambient", "Electronica"], src: "discogs+musicbrainz+wikidata" }, // Underworld
  "unexist": { m: ["Hardcore"], s: ["Gabber"], src: "discogs+wikidata" }, // Unexist
  "unresolved": { m: ["Hardstyle"], s: [], src: "discogs" }, // Unresolved
  "upper": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // Upper
  "upsammy": { m: ["Techno"], s: ["IDM", "Ambient", "Experimental"], src: "discogs" }, // upsammy
  "upsilone": { m: ["Techno", "EDM", "Drum & Bass"], s: ["Bass Music", "Electro", "Electro House"], src: "discogs" }, // Upsilone
  "urumi": { m: ["Techno", "House"], s: ["Acid House", "Breakbeat", "Deep House"], src: "discogs" }, // Urumi
  "use-knife": { m: ["Techno"], s: ["Experimental", "New Beat"], src: "discogs" }, // Use Knife
  "ush": { m: ["Hard Techno"], s: ["Industrial Techno"], src: "research" }, // USH
  "vabu": { m: ["House", "Techno"], s: ["Melodic House", "Tech House", "Indie Dance"], src: "research" }, // Vabu
  "vai": { m: ["Trance"], s: ["Melodic Techno"], src: "research" }, // Vaï
  "vendex": { m: ["Hard Techno", "Techno", "Acid Techno"], s: ["Industrial Techno"], src: "research" }, // Vendex
  "venehing": { m: ["Techno", "Hard Techno"], s: ["Industrial Techno", "Schranz", "Hardgroove"], src: "research" }, // Venëhing
  "venga": { m: ["House", "Techno", "Acid Techno"], s: ["Tech House", "Bass House"], src: "research" }, // Venga
  "verdun": { m: ["House", "Techno"], s: ["Tech House", "Minimal Techno", "Melodic Techno"], src: "research" }, // Verdun
  "verraco": { m: ["Techno"], s: ["IDM", "Ambient", "Bass Music"], src: "discogs" }, // Verraco
  "vertile": { m: ["Hardstyle"], s: ["Rawstyle"], src: "research" }, // Vertile
  "vibrant": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Vibrant
  "victor-ruiz": { m: ["Techno"], s: ["Tech House", "Progressive House", "Progressive Trance"], src: "discogs" }, // Victor Ruiz
  "vieze-asbak": { m: ["Hard Techno", "Techno"], s: ["Memetechno"], src: "research" }, // Vieze Asbak
  "vini-vici": { m: ["Psytrance"], s: ["Progressive Trance"], src: "discogs+wikidata" }, // Vini Vici
  "vintage-culture": { m: ["House"], s: ["Progressive House", "Tech House"], src: "discogs" }, // Vintage Culture
  "virginia": { m: ["House"], s: ["Deep House"], src: "research" }, // Virginia
  "virtual-vault": { m: ["Trance"], s: ["Progressive Trance", "Progressive House"], src: "discogs" }, // Virtual Vault
  "vladimir-cauchemar": { m: ["House", "Techno"], s: ["Electro", "French House", "Euro House"], src: "discogs+last.fm" }, // Vladimir Cauchemar
  "voigtmann": { m: ["House", "Techno"], s: ["Minimal Techno", "Tech House", "Deep House"], src: "discogs" }, // Voigtmann
  "vojko-v": { m: [], s: [], src: "hors-perimetre" }, // Vojko V
  "vok": { m: ["Techno"], s: ["Trip-Hop", "Electro"], src: "discogs+wikidata" }, // Vök
  "von-bikrav": { m: ["Hardcore"], s: ["Gabber"], src: "discogs" }, // Von Bikräv
  "von-disco": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Von Disco
  "vortek-s": { m: ["Hardcore", "Hard Techno", "Acid Techno"], s: ["Hard Trance", "Goa Trance"], src: "discogs" }, // Vortek's
  "vtss": { m: ["Techno"], s: ["EBM", "Breakbeat", "Industrial"], src: "discogs" }, // VTSS
  "vuur": { m: ["House", "Techno"], s: ["Tech House"], src: "research" }, // Vuur
  "w-w": { m: ["EDM"], s: ["Electro House", "Big Room"], src: "discogs+wikidata" }, // W&W
  "wade": { m: ["House"], s: ["Tech House"], src: "discogs" }, // Wade
  "wal-halla": { m: ["Techno", "House"], s: [], src: "research" }, // Wal_Halla
  "warface": { m: ["Hardstyle"], s: ["Rawstyle"], src: "discogs+last.fm+musicbrainz" }, // Warface
  "wasted-penguinz": { m: ["Hardstyle"], s: ["Happy Hardcore"], src: "discogs+wikidata" }, // Wasted Penguinz
  "wata-igarashi": { m: ["Techno"], s: ["Ambient", "Dub Techno"], src: "research" }, // Wata Igarashi
  "wata-igarashi-dj-nobu": { m: ["Techno"], s: [], src: "discogs" }, // Wata Igarashi & DJ Nobu
  "whiney": { m: ["Drum & Bass"], s: ["Grime"], src: "discogs" }, // Whiney
  "whomadewho": { m: ["House", "Techno"], s: ["Electro", "Disco", "Tech House"], src: "discogs" }, // WhoMadeWho
  "wildstylez": { m: ["Hardstyle"], s: ["Broken Beat"], src: "discogs+wikidata" }, // Wildstylez
  "wilkinson": { m: ["Drum & Bass"], s: ["Liquid Drum & Bass"], src: "research" }, // Wilkinson
  "will-atkinson": { m: ["Trance", "Psytrance"], s: ["Breakbeat"], src: "research" }, // Will Atkinson
  "william-basinski": { m: ["Techno"], s: ["Ambient", "Minimal Techno", "Experimental"], src: "discogs" }, // William Basinski
  "william-kiss": { m: ["Techno", "House"], s: ["Tech House"], src: "research" }, // William Kiss
  "wolfgang-voigt": { m: ["Techno"], s: ["Ambient", "Minimal Techno", "Experimental"], src: "discogs" }, // Wolfgang Voigt
  "wolv": { m: ["Hardstyle"], s: [], src: "discogs" }, // Wolv
  "worakls": { m: ["Techno", "House"], s: ["Minimal Techno", "Tech House"], src: "discogs+wikidata" }, // Worakls
  "worship": { m: ["Drum & Bass"], s: [], src: "research" }, // Worship
  "x-club": { m: ["Techno", "Hardcore", "Trance"], s: ["Hard Trance", "Electro", "Happy Hardcore"], src: "discogs" }, // X Club.
  "x-noize": { m: ["Psytrance"], s: ["Progressive Trance"], src: "discogs" }, // X-Noize
  "xdb": { m: ["Techno", "House"], s: ["Dub Techno", "Deep House"], src: "discogs" }, // XDB
  "xijaro-pitch": { m: ["Trance"], s: [], src: "discogs" }, // XiJaro & Pitch
  "xmoze": { m: ["Hard Techno", "Trance"], s: ["Hard Trance"], src: "research" }, // Øxmoze
  "xp": { m: ["Techno"], s: ["EBM", "Electro", "Industrial"], src: "discogs" }, // XP
  "yaeji": { m: ["House"], s: ["Deep House", "Hip-House"], src: "research" }, // Yaeji
  "yan-wagner": { m: ["Techno", "House"], s: ["Disco", "Electro"], src: "discogs" }, // Yan Wagner
  "yanamaste": { m: ["Techno"], s: ["Bass Music", "Industrial"], src: "discogs" }, // Yanamaste
  "yellow-claw": { m: ["EDM", "Hardstyle"], s: ["Moombahton"], src: "research" }, // Yellow Claw
  "yogg": { m: ["Techno"], s: ["Dub Techno", "IDM", "Breakbeat"], src: "research" }, // Yogg
  "yoshiko": { m: ["Hardcore"], s: ["Uptempo"], src: "research" }, // Yoshiko
  "yotto": { m: ["House"], s: ["Deep House", "Progressive House"], src: "discogs+wikidata" }, // Yotto
  "young-marco": { m: ["House", "Techno"], s: ["Ambient", "Balearic", "Deep House"], src: "research" }, // Young Marco
  "yousuke-yukimatsu": { m: ["Techno", "Trance"], s: ["Ambient", "Experimental"], src: "discogs+wikidata" }, // Yousuke Yukimatsu
  "ypy": { m: ["Techno", "House"], s: ["Experimental"], src: "research" }, // YPY
  "yuksek": { m: ["Techno", "House"], s: ["Electronica", "Nu-Disco"], src: "wikidata" }, // Yuksek
  "yung-singh": { m: ["House", "Drum & Bass"], s: ["UK Garage", "Jungle"], src: "research" }, // Yung Singh
  "yves-deruyter": { m: ["Trance", "Techno", "Acid Techno"], s: ["Hard Trance"], src: "research" }, // Yves Deruyter
  "yvind-morken": { m: ["House", "Techno"], s: ["Electro", "Leftfield", "Deep House"], src: "discogs" }, // Øyvind Morken
  "zapravka": { m: ["Hard Techno", "Techno", "Hardstyle"], s: ["Gabber", "Bass House"], src: "research" }, // Zapravka
  "zelecter": { m: ["Hardstyle"], s: ["Early Hardstyle", "Rawstyle", "Uptempo"], src: "research" }, // Zelecter
  "zora-jones": { m: ["Techno", "Drum & Bass"], s: ["Experimental", "Bass Music"], src: "discogs" }, // Zora Jones
  "zoster": { m: [], s: [], src: "hors-perimetre" }, // Zoster
};
/* STYLES:end */

export const styleFor = (slug: string): ArtistStyle | undefined => ARTIST_STYLES[slug];

/**
 * L'artiste a été regardé, et **aucune des onze catégories ne le décrit**.
 *
 * Pulp, Sting, Nick Cave, Shaggy, Madness, le Trio Xenakis, Mulatu Astatke : ils sont
 * légitimement au catalogue, programmés sur des festivals multi-genres qui ne sont pas
 * qu'électroniques. Mais sans ce marqueur, `artistGenres()` retomberait sur la
 * déduction et leur collerait « House » ou « Techno » d'après l'étiquetage de
 * l'affiche — une affirmation fausse sur une personne réelle, reprise ensuite dans le
 * JSON-LD `MusicGroup` et la meta description.
 *
 * La distinction avec un artiste absent de la map est le cœur du mécanisme : là, on
 * n'a **pas de donnée** et la déduction reste le meilleur repli ; ici, on a la donnée
 * et elle dit « pas notre sujet ». `src: "hors-perimetre"` avec un `m` vide encode
 * cette différence.
 */
export const isOutOfScope = (slug: string): boolean =>
  ARTIST_STYLES[slug]?.src === "hors-perimetre";
