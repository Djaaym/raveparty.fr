#!/usr/bin/env python3
"""Table de correspondance : un tag brut → (genre principal, sous-genre).

Le tag « hard techno » de last.fm, le genre Wikidata « hard techno » et le style
Discogs « Hard Techno » désignent la même chose ; les onze clés de `GENRES`
(lib/display.ts) sont ce que le site sait afficher, avec une page derrière. Ce
fichier fait le pont, et **lui seul** : les scripts qui le lisent ne décident de
rien, ils comptent des votes.

Trois cas, et la distinction porte tout :

- `("Hard Techno", None)` — le tag EST une des onze catégories du site.
- `("Techno", "Industrial Techno")` — le tag est un sous-genre : il vaut une voix
  pour la catégorie parente **et** un libellé qu'on affiche tel quel. C'est là
  qu'est l'information qu'un annuaire de onze cases perd : « industrial techno »
  et « minimal techno » ne se ressemblent pas.
- `IGNORE` — le tag ne dit rien du style : un pays, une décennie, un nom de label,
  « seen live », « electronic » (vrai de tout le catalogue, donc discriminant nul).

`OFF_GENRE` est le garde-fou contre l'homonyme. Les pages last.fm sont indexées par
nom : « Mind », « Kobra » ou « Rise » désignent aussi des groupes de metal. Un
artiste dont les tags dominants sont ici n'est pas *notre* artiste — on jette la
récolte plutôt que d'étiqueter un DJ techno en death metal.
"""

# tag -> (clé de GENRES, sous-genre affiché ou None)
TAGS = {
    # --- Techno et ses branches -------------------------------------------------
    "techno": ("Techno", None),
    "tekno": ("Techno", None),
    "detroit techno": ("Techno", "Detroit Techno"),
    "detroit": ("Techno", "Detroit Techno"),
    "minimal techno": ("Techno", "Minimal Techno"),
    "minimal": ("Techno", "Minimal Techno"),
    "microhouse": ("House", "Microhouse"),
    "melodic techno": ("Techno", "Melodic Techno"),
    "melodic techno & house": ("Techno", "Melodic Techno"),
    "industrial techno": ("Techno", "Industrial Techno"),
    "dark techno": ("Techno", "Dark Techno"),
    "deep techno": ("Techno", "Deep Techno"),
    "dub techno": ("Techno", "Dub Techno"),
    "hypnotic techno": ("Techno", "Hypnotic Techno"),
    "peak time techno": ("Techno", "Peak Time Techno"),
    "tribal techno": ("Techno", "Tribal Techno"),
    "ambient techno": ("Techno", "Ambient Techno"),
    "birmingham techno": ("Techno", "Birmingham Techno"),
    "hardgroove": ("Techno", "Hardgroove"),
    "hard groove": ("Techno", "Hardgroove"),
    "raw techno": ("Hard Techno", "Raw Techno"),
    "hard techno": ("Hard Techno", None),
    "schranz": ("Hard Techno", "Schranz"),
    "acid techno": ("Acid Techno", None),
    "acid": ("Acid Techno", None),
    "acid house": ("House", "Acid House"),
    "hard trance": ("Trance", "Hard Trance"),

    # --- House ------------------------------------------------------------------
    "house": ("House", None),
    "tech house": ("House", "Tech House"),
    "tech-house": ("House", "Tech House"),
    "techhouse": ("House", "Tech House"),
    "deep house": ("House", "Deep House"),
    "melodic house": ("House", "Melodic House"),
    "melodic house & techno": ("House", "Melodic House"),
    "progressive house": ("House", "Progressive House"),
    "afro house": ("House", "Afro House"),
    "organic house": ("House", "Organic House"),
    "bass house": ("House", "Bass House"),
    "chicago house": ("House", "Chicago House"),
    "french house": ("House", "French House"),
    "french touch": ("House", "French Touch"),
    "disco house": ("House", "Disco House"),
    "nu-disco": ("House", "Nu-Disco"),
    "nu disco": ("House", "Nu-Disco"),
    "disco": ("House", "Disco"),
    "italo disco": ("House", "Italo Disco"),
    "garage house": ("House", "Garage House"),
    "soulful house": ("House", "Soulful House"),
    "funky house": ("House", "Funky House"),
    "classic house": ("House", "Classic House"),
    "electro house": ("EDM", "Electro House"),
    "future house": ("EDM", "Future House"),
    "big room": ("EDM", "Big Room"),
    "big room house": ("EDM", "Big Room"),

    # --- EDM / mainstage --------------------------------------------------------
    "edm": ("EDM", None),
    "dance": ("EDM", None),
    "electro pop": ("EDM", "Electropop"),
    "electropop": ("EDM", "Electropop"),
    "future bass": ("EDM", "Future Bass"),
    "melbourne bounce": ("EDM", "Melbourne Bounce"),

    # --- Trance -----------------------------------------------------------------
    "trance": ("Trance", None),
    "uplifting trance": ("Trance", "Uplifting Trance"),
    "progressive trance": ("Trance", "Progressive Trance"),
    "vocal trance": ("Trance", "Vocal Trance"),
    "tech trance": ("Trance", "Tech Trance"),
    "psy trance": ("Psytrance", None),
    "psy-trance": ("Psytrance", None),
    "psytrance": ("Psytrance", None),
    "psychedelic trance": ("Psytrance", None),
    "psy": ("Psytrance", None),
    "goa": ("Psytrance", "Goa Trance"),
    "goa trance": ("Psytrance", "Goa Trance"),
    "full on": ("Psytrance", "Full-On"),
    "full-on": ("Psytrance", "Full-On"),
    "forest psytrance": ("Psytrance", "Forest"),
    "darkpsy": ("Psytrance", "Darkpsy"),
    "hitech": ("Psytrance", "Hi-Tech"),
    "hi-tech": ("Psytrance", "Hi-Tech"),
    "progressive psytrance": ("Psytrance", "Progressive Psy"),
    "psy techno": ("Psytrance", "Psy-Techno"),
    "psytech": ("Psytrance", "Psy-Techno"),

    # --- Hardstyle / hardcore ---------------------------------------------------
    "hardstyle": ("Hardstyle", None),
    "rawstyle": ("Hardstyle", "Rawstyle"),
    "raw hardstyle": ("Hardstyle", "Rawstyle"),
    "euphoric hardstyle": ("Hardstyle", "Euphoric Hardstyle"),
    "jumpstyle": ("Hardstyle", "Jumpstyle"),
    "hardcore": ("Hardcore", None),
    "hardcore techno": ("Hardcore", None),
    "gabber": ("Hardcore", "Gabber"),
    "gabba": ("Hardcore", "Gabber"),
    "uptempo": ("Hardcore", "Uptempo"),
    "uptempo hardcore": ("Hardcore", "Uptempo"),
    "frenchcore": ("Hardcore", "Frenchcore"),
    "terrorcore": ("Hardcore", "Terrorcore"),
    "speedcore": ("Hardcore", "Speedcore"),
    "happy hardcore": ("Hardcore", "Happy Hardcore"),
    "darkcore": ("Hardcore", "Darkcore"),
    "industrial hardcore": ("Hardcore", "Industrial Hardcore"),
    "millennium hardcore": ("Hardcore", "Millennium Hardcore"),
    "crossbreed": ("Hardcore", "Crossbreed"),

    # --- Drum & bass et bass music ---------------------------------------------
    "drum and bass": ("Drum & Bass", None),
    "drum n bass": ("Drum & Bass", None),
    "drum & bass": ("Drum & Bass", None),
    "drum'n'bass": ("Drum & Bass", None),
    "dnb": ("Drum & Bass", None),
    "d&b": ("Drum & Bass", None),
    "liquid funk": ("Drum & Bass", "Liquid Drum & Bass"),
    "liquid dnb": ("Drum & Bass", "Liquid Drum & Bass"),
    "neurofunk": ("Drum & Bass", "Neurofunk"),
    "jump up": ("Drum & Bass", "Jump Up"),
    "jungle": ("Drum & Bass", "Jungle"),
    "breakcore": ("Hardcore", "Breakcore"),
    "dubstep": ("Drum & Bass", "Dubstep"),
    "riddim": ("Drum & Bass", "Riddim"),
    "uk garage": ("House", "UK Garage"),
    "2-step": ("House", "UK Garage"),
    "speed garage": ("House", "Speed Garage"),
    "bassline": ("House", "Bassline"),
    "breakbeat": ("Techno", "Breakbeat"),
    "breaks": ("Techno", "Breakbeat"),
    "big beat": ("Techno", "Big Beat"),
    "electro": ("Techno", "Electro"),
    "electro-funk": ("Techno", "Electro"),
    "ghettotech": ("Techno", "Ghettotech"),
    "gqom": ("House", "Gqom"),
    "amapiano": ("House", "Amapiano"),
    "baile funk": ("House", "Baile Funk"),

    # --- Marges (jamais un genre principal à eux seuls, mais un vrai sous-genre) --
    "ambient": ("Techno", "Ambient"),
    "downtempo": ("Techno", "Downtempo"),
    "idm": ("Techno", "IDM"),
    "experimental": ("Techno", "Experimental"),
    "ebm": ("Techno", "EBM"),
    "industrial": ("Techno", "Industrial"),
    "trip-hop": ("Techno", "Trip-Hop"),
    "trip hop": ("Techno", "Trip-Hop"),
    "electronica": ("Techno", "Electronica"),
    "leftfield": ("Techno", "Leftfield"),
    "rave": ("Techno", "Rave"),
    "hardhouse": ("House", "Hard House"),
    "hard house": ("House", "Hard House"),
    "harthouse": ("House", "Hard House"),

    # --- Vocabulaire Discogs (champ « Style ») ----------------------------------
    # Discogs étiquette les *disques*, pas les artistes : agréger les styles de la
    # discographie donne le profil le plus fin qu'on puisse obtenir sans lire une bio.
    # Son vocabulaire lui est propre — « Psy-Trance », « Drum n Bass », « Euro House » —
    # d'où ces alias, qui retombent sur les mêmes catégories que le reste.
    "psy-trance": ("Psytrance", None),
    "drum n bass": ("Drum & Bass", None),
    "euro house": ("EDM", "Euro House"),
    "eurodance": ("EDM", "Eurodance"),
    "italo-disco": ("House", "Italo Disco"),
    "broken beat": ("Techno", "Broken Beat"),
    "future jazz": ("Techno", "Future Jazz"),
    "bass music": ("Drum & Bass", "Bass Music"),
    "grime": ("Drum & Bass", "Grime"),
    "footwork": ("Techno", "Footwork"),
    "juke": ("Techno", "Footwork"),
    "makina": ("Hardcore", "Makina"),
    "doomcore": ("Hardcore", "Doomcore"),
    "new beat": ("Techno", "New Beat"),
    "electro-industrial": ("Techno", "EBM"),
    "abstract": ("Techno", "Experimental"),
    "illbient": ("Techno", "Experimental"),
    "noise": ("Techno", "Experimental"),
    "drone": ("Techno", "Ambient"),
    "modern classical": ("Techno", "Ambient"),
    "berlin-school": ("Techno", "Ambient"),
    "dark ambient": ("Techno", "Ambient"),
    "hip house": ("House", "Hip House"),
    "ghetto house": ("House", "Ghetto House"),
    "ghettotech ": ("Techno", "Ghettotech"),
    "jersey club": ("House", "Jersey Club"),
    "hardtek": ("Hardcore", "Hardtek"),
    "tribe": ("Hardcore", "Tribe"),
    "raggacore": ("Hardcore", "Raggacore"),
    "digital hardcore": ("Hardcore", "Digital Hardcore"),
    "nu-jazz": ("Techno", "Future Jazz"),
    "balearic": ("House", "Balearic"),
    "afro-house": ("House", "Afro House"),
    "afrobeat": ("House", "Afro House"),
    "latin house": ("House", "Latin House"),
    "tribal house": ("House", "Tribal House"),
    "progressive breaks": ("Techno", "Breakbeat"),
    "nu skool breaks": ("Techno", "Breakbeat"),
    "florida breaks": ("Techno", "Breakbeat"),
    "darkstep": ("Drum & Bass", "Darkstep"),
    "techstep": ("Drum & Bass", "Techstep"),
    "drumfunk": ("Drum & Bass", "Drumfunk"),
    "halftime": ("Drum & Bass", "Halftime"),
    "ragga jungle": ("Drum & Bass", "Ragga Jungle"),
    "atmospheric drum and bass": ("Drum & Bass", "Liquid Drum & Bass"),
}

# Tags qui ne disent rien du style : pays, langues, décennies, humeurs, labels,
# artefacts de scrobbling. Les lister explicitement évite qu'un « belgium » très
# voté écrase un « hard techno » discret.
IGNORE = {
    "electronic", "electronic music", "electro music", "club", "dj", "female dj", "producer",
    "seen live", "favourites", "favorites", "awesome", "cool", "chill", "chillout", "summer",
    "party", "instrumental", "mixtape", "mix", "remix", "live", "set", "podcast", "radio",
    "beautiful", "love", "sexy", "epic", "banger", "music", "beats", "bass", "tech", "deep",
    "dark", "hard", "underground", "alternative", "indie", "new", "00s", "10s", "20s", "90s",
    "80s", "70s", "60s", "male vocalists", "female vocalists", "vocal", "piano", "flute",
    "guitar", "singer-songwriter", "composer",
}
# Pays / villes / gentilés — même raison.
IGNORE |= {
    "french", "france", "paris", "british", "uk", "england", "london", "scottish", "irish",
    "german", "germany", "berlin", "cologne", "dutch", "netherlands", "holland", "amsterdam",
    "belgian", "belgium", "italian", "italy", "spanish", "spain", "portuguese", "portugal",
    "swedish", "sweden", "norwegian", "norway", "danish", "denmark", "finnish", "finland",
    "polish", "poland", "czech", "austrian", "austria", "swiss", "switzerland", "greek",
    "greece", "russian", "russia", "american", "usa", "us", "canadian", "canada", "australian",
    "australia", "japanese", "japan", "korean", "korea", "chilean", "brazilian", "brazil",
    "mexican", "mexico", "argentinian", "colombian", "israeli", "turkish", "romanian",
    "hungarian", "croatian", "serbian", "slovenian", "bulgarian", "estonian", "latvian",
    "lithuanian", "icelandic", "detroit house", "ibiza", "detroit michigan", "chicago",
    "new york", "manchester", "glasgow", "bristol", "rotterdam", "eindhoven", "antwerp",
}

# Tags qui prouvent que la page consultée décrit quelqu'un d'autre. Un homonyme sur
# last.fm est fréquent (« Mind », « Rise », « Kobra »), et rien dans la réponse ne le
# signale : c'est le vocabulaire qui trahit.
OFF_GENRE = {
    "rock", "metal", "death metal", "brutal death metal", "technical death metal",
    "black metal", "heavy metal", "metalcore", "deathcore", "hardcore punk", "punk",
    "post-hardcore", "thrash metal", "doom metal", "grindcore", "emo", "screamo",
    "hip-hop", "hip hop", "rap", "trap", "r&b", "soul", "funk", "jazz", "blues",
    "country", "folk", "classical", "opera", "reggae", "ska", "dancehall", "pop punk",
    "k-pop", "j-pop", "anime", "soundtrack", "christian", "gospel", "worship",
    "singer songwriter", "acoustic", "grunge", "shoegaze", "post-rock", "darkwave",
    "synthpop", "new wave", "goth", "gothic", "industrial metal", "nu metal",
    "beatdown hardcore", "post-punk",
}

# Un seul de ces tags dans les trois premiers suffit à valider que la page est bien
# celle d'un artiste électronique (garde-fou symétrique d'OFF_GENRE).
ELECTRONIC_HINT = set(TAGS) | {"electronic", "electronic music", "rave", "club", "dj"}
