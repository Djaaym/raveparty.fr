/**
 * Les portraits d'artistes, et le crédit qui doit voyager avec.
 *
 * Module **feuille** : il n'importe rien. Un composant client peut le lire sans
 * embarquer le catalogue (voir la note de `lib/display.ts`).
 *
 * ## Pourquoi ce module existe séparément de `lib/bios.ts`
 *
 * Le portrait vivait dans `ArtistBio.photo`, ce qui rendait la photo **conditionnée à
 * la bio** : un artiste dont on trouvait le portrait sur Commons mais dont on n'avait
 * pas su écrire deux phrases sourcées restait affiché avec son initiale dans un rond.
 * Ce sont deux faits indépendants — une image sous licence libre et un texte vérifié —
 * et les coupler faisait perdre le premier chaque fois que le second manquait.
 *
 * ## Ce qui n'a pas changé, et ne doit pas changer
 *
 * **Wikimedia Commons uniquement.** Une photo de presse ou d'Instagram est un travail
 * protégé quel que soit celui qui la publie, et « usage presse » n'est pas une licence
 * pour illustrer un annuaire. Commons énonce ses termes, et l'essentiel de son fonds
 * est en CC BY / CC BY-SA — réutilisables **à condition** d'afficher l'auteur et la
 * licence. `author`, `license` et `page` ne sont donc pas de la décoration : ce sont
 * les conditions d'usage, rendues sous le portrait sur la fiche artiste et regroupées
 * sous l'annuaire pour les vignettes, qui n'ont pas la place de les porter.
 *
 * **Aucun portrait généré pour une personne réelle.** Produire une image réaliste et
 * reconnaissable d'un individu identifiable, publiée sur sa fiche, n'est pas illustrer
 * un festival. Sans photo libre, on affiche l'initiale — c'est une réponse honnête.
 *
 * Généré par `.research/artists/avatars.py` entre les marqueurs PHOTOS:start / PHOTOS:end.
 */

export interface ArtistPhoto {
  /** Fichier sous /artists/, carré, viré en duotone par avatars.py. */
  file: string;
  /** Auteur / crédit, exactement comme Commons l'énonce. */
  author: string;
  /** Nom court de la licence, p. ex. "CC BY-SA 4.0". */
  license: string;
  /** Page du fichier sur Commons, pour que le lecteur puisse vérifier les termes. */
  page: string;
}

/* PHOTOS:start — généré par .research/artists/avatars.py, ne pas éditer à la main */
export const ARTIST_PHOTOS: Record<string, ArtistPhoto> = {
  "808-state": { file: "808-state.webp", author: "Music Tech Fest", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Graham_Massey_2_-_MTFCentral_Hack_Camp_(2015-09-19_21.34.45_by_Music_Tech_Fest).jpg" },
  "a-guy-called-gerald": { file: "a-guy-called-gerald.webp", author: "Victor Frankowski for Southbank Centre", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:A_Guy_Called_Gerald_(2014,_cropped).jpg" },
  "adam-beyer": { file: "adam-beyer.webp", author: "Dave Walker", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Adam_Beyer_(3559941164).jpg" },
  "alok": { file: "alok.webp", author: "Humor Multishow", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Alok_-_Lady_Night.png" },
  "amelie-lens": { file: "amelie-lens.webp", author: "Rayukk", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Amelie_Lens_06_2022.jpg" },
  "andy-stott": { file: "andy-stott.webp", author: "Tkiehne", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Andy_stott_cmky_2009.jpg" },
  "angerfist": { file: "angerfist.webp", author: "JoeJoeJoe93", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Angerfist_(17)_(cropped).JPG" },
  "anyma": { file: "anyma.webp", author: "ObAnyma", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Anyma_2025_(cropped).jpg" },
  "aphex-twin": { file: "aphex-twin.webp", author: "Blackphoenix94", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Aphextwin1.jpg" },
  "apparat": { file: "apparat.webp", author: "shiver_shi", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Apparat_(musician)_in_2009.jpg" },
  "autechre": { file: "autechre.webp", author: "Pablo Sanz Almoguera", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Autechre_(cropped).jpg" },
  "benga": { file: "benga.webp", author: "Stuart Sevastos", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Benga_%40_Wellington_Square.jpg" },
  "blastoyz": { file: "blastoyz.webp", author: "Ady111", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Blastoyz_performing_in_Tel_Aviv-_2025.jpg" },
  "blond-ish": { file: "blond-ish.webp", author: "DeepBluuue", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Blondish-2019.jpg" },
  "boris-brejcha": { file: "boris-brejcha.webp", author: "Gauvain", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Boris_brejcha_2017_03_12.jpg" },
  "bt": { file: "bt.webp", author: "Rudy Gray of rGRAYphotography", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:BT_of_All_Hail_The_Silence_03_(cropped).jpg" },
  "calvin-harris": { file: "calvin-harris.webp", author: "Sony BMG", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Calvin_Harris_-_Press_Image_1.tif" },
  "carl-cox": { file: "carl-cox.webp", author: "Sergey Kozak", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Carl_Cox_%40_ADE_2012.jpg" },
  "carl-craig": { file: "carl-craig.webp", author: "Copyright: Monty Luke, Planet E Communications, https://www.planet-e.net", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Carl_Craig.jpg" },
  "charlotte-de-witte": { file: "charlotte-de-witte.webp", author: "Alan Overbeek", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Charlotte_de_witte-1513626416.jpg" },
  "chicane": { file: "chicane.webp", author: "Riza Nugraha", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Chicane_2013_(cropped)_(1).jpg" },
  "christian-loffler": { file: "christian-loffler.webp", author: "Marvin Contessi", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:20230922_MarvinContessi_%40ctssi_Freitag_ChristianLoeffler_GrosseFreiheit36_MCR62553_(1).jpg" },
  "darin-epsilon": { file: "darin-epsilon.webp", author: "Robert Kerian", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Darin_Epsilon_Press_Photo_1.jpg" },
  "darren-emerson": { file: "darren-emerson.webp", author: "Cabaret Voltaire", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Darren_Emerson_%40_Sugarbeatclub_Cabaret_Voltaire_(cropped).jpg" },
  "deborah-de-luca": { file: "deborah-de-luca.webp", author: "Denis Apel", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sterne_und_Bass-Feb_2017-Deborah_de_Luca-Flyingpixel-8380.jpg" },
  "disclosure": { file: "disclosure.webp", author: "Andresojeda713", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Disclosure_en_Concierto_(2016).jpg" },
  "dj-hype": { file: "dj-hype.webp", author: "Adam J Roberts", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:DJ_Hype,_Matrix,_and_Futurebound_at_Egg.jpg" },
  "dj-isaac": { file: "dj-isaac.webp", author: "R. Schutrups", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Dj_isaac-1452842209.jpg" },
  "dj-krush": { file: "dj-krush.webp", author: "Jhayne", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:DJ_Krush.jpg" },
  "dj-quicksilver": { file: "dj-quicksilver.webp", author: "Denis Apel", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:90er-Rave-2017-03-11-DJ-QUICKSILVER-flyingpixel.de-Denis-Apel--6581_(cropped).jpg" },
  "dj-snake": { file: "dj-snake.webp", author: "Arno Partissimo", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:DJS-Presskit05_(cropped).jpg" },
  "dr-peacock": { file: "dr-peacock.webp", author: "Ss279", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Mayday_2019_Dr._Peacock_2.jpg" },
  "duke-dumont": { file: "duke-dumont.webp", author: "swimfinfan", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Duke_Dumont,_Lollapalooza_2014_(cropped).jpg" },
  "dvs1": { file: "dvs1.webp", author: "Celina Dzyacky", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:DVS1_portrait4.jpg" },
  "eats-everything": { file: "eats-everything.webp", author: "Ben Price", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Eats_Everything.jpg" },
  "ellen-allien": { file: "ellen-allien.webp", author: "Ventura Mendoza", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Ellen_Allien_(MAGMA_2006,_Tenerife).jpg" },
  "eric-prydz": { file: "eric-prydz.webp", author: "Haydn Curtis", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Eric_Prydz_at_Glastonbury_2009.jpg" },
  "erol-alkan": { file: "erol-alkan.webp", author: "yapsnaps", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:ErolAlkan.jpg" },
  "evil-activities": { file: "evil-activities.webp", author: "MissBeertje", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Kelly_van_Soest1.jpg" },
  "fatboy-slim": { file: "fatboy-slim.webp", author: "Tadeáš Kirschner", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Fatboy_Slim,_Iris_Festival_2025.jpg" },
  "felix-krocher": { file: "felix-krocher.webp", author: "Robin Krahl", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:2015-07-19_6639_Felix_Kr%C3%B6cher_(Sea_You).jpg" },
  "floating-points": { file: "floating-points.webp", author: "Fred von Lohmann", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Floating_Points_at_Coachella_2017_(cropped).jpg" },
  "folamour": { file: "folamour.webp", author: "Originalcat", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Folamour_at_StrafWerk_Amsterdam_2023.jpg" },
  "fox-stevenson": { file: "fox-stevenson.webp", author: "Sheet050", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Fox_Liqucity-36-of-71(2).jpg" },
  "groove-armada": { file: "groove-armada.webp", author: "Hamish2k", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Groove_Armada_at_Chi_Dubai.JPG" },
  "gui-boratto": { file: "gui-boratto.webp", author: "Dave Van den Eynde (GroovBird)", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Gui-boratto%40ten-days-off-2008.jpg" },
  "helena-hauff": { file: "helena-hauff.webp", author: "deepskyobject from Saint Petersburg, Russia", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Helena_Hauff_@_Primavera_Sound_Festival,_Barcelona,_02.06.2016_(36682200586)_(cropped).jpg" },
  "hercules-love-affair": { file: "hercules-love-affair.webp", author: "Jovan Đokić, EXIT Photo Team", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:EXIT_2012_Hercules_%26_Love_Affair.jpg" },
  "hysta": { file: "hysta.webp", author: "Philcotof", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Philcotof_dj_Hysta_DSC00001_attribution_AUTEUR_OBLIGATOIRE.jpg" },
  "james-hype": { file: "james-hype.webp", author: "InvadingInvader", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:James_Hype_at_FWD_Cleveland_2025.jpg" },
  "jeff-mills": { file: "jeff-mills.webp", author: "Angie Schwendemann", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Jeff_Mills_2.jpg" },
  "joachim-pastor": { file: "joachim-pastor.webp", author: "Thesupermat", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Festival_des_Vieilles_Charrues_2018_-_Hungry_5_-_002.jpg" },
  "john-digweed": { file: "john-digweed.webp", author: "Peter Drier", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:John_Digweed.jpg" },
  "john-summit": { file: "john-summit.webp", author: "Wynneplaga", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:John_Summit_DJ%E2%80%99ing_at_Vail,_March_20th,_2026_(cropped).jpg" },
  "jonas-blue": { file: "jonas-blue.webp", author: "Nils Melckenbeeck", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Jonas_Blue_(cropped).jpg" },
  "kangding-ray": { file: "kangding-ray.webp", author: "Pedro J Pacheco", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Premios_Goya_2026_-_Kangding_Ray-2_(cropped).jpg" },
  "klangkuenstler": { file: "klangkuenstler.webp", author: "Medusa Festival", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Klangkuenstler_in_2024_Medusa_Festival_podcast.png" },
  "kmru": { file: "kmru.webp", author: "David Gauntlett", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:KMRU_Interview_Aug_2021.jpg" },
  "kobosil": { file: "kobosil.webp", author: "Rayukk", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Kobosil_Kamehameha_Festival_15_Juni_2019.jpg" },
  "kolsch": { file: "kolsch.webp", author: "Robin Krahl", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:2015-07-19_6748_K%C3%B6lsch_(Sea_You).jpg" },
  "laurent-garnier": { file: "laurent-garnier.webp", author: "Joost Pauwels", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Laurent_Garnier_(2021).jpg" },
  "lost-frequencies": { file: "lost-frequencies.webp", author: "Stefan Brending (2eight)", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:2016_Open_Beatz_-_Lost_Frequencies_-_by_2eight_-DSC_5232.jpg" },
  "marie-vaunt": { file: "marie-vaunt.webp", author: "Florida Supercon (Flickr)", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:DJ_Heavygrinder_at_FSC_2008.jpeg" },
  "marshmello": { file: "marshmello.webp", author: "Stefan Brending (2eight)", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:2016_Open_Beatz_-_Marshmello_-_by_2eight_-DSC_4448.jpg" },
  "masters-at-work": { file: "masters-at-work.webp", author: "glenjamn3", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Masters_At_Work,_2013.png" },
  "mau-p": { file: "mau-p.webp", author: "Medusa Festival", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Mau_P_in_Medusa_Festival_podcast.png" },
  "me": { file: "me.webp", author: "Eze Electronic Music", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:%26Me_in_2025.png" },
  "miss-monique": { file: "miss-monique.webp", author: "Kate Martin", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Miss_Monique_(Feb_%2726).tif" },
  "mk": { file: "mk.webp", author: "glenjamn3", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Marc_Kinchen_DJing_at_Holy_Ship!,_2016_(cropped).jpg" },
  "modeselektor": { file: "modeselektor.webp", author: "Matt Biddulph", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Modeselektor,_2009.jpg" },
  "moodymann": { file: "moodymann.webp", author: "acidpolly", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Sonar_2010_-_Moodymann.jpg" },
  "nastia": { file: "nastia.webp", author: "MiCkY", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Nastia_(Anastasia_Topolskaia)_Ukrainian_DJ.png" },
  "netsky": { file: "netsky.webp", author: "James Starkey", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Netsky_(DJ)_2008.jpg" },
  "nghtmre": { file: "nghtmre.webp", author: "FROZYO!", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:NGHTMRE.jpg" },
  "nina-kraviz": { file: "nina-kraviz.webp", author: "Alec Luhn", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Nina_Kraviz,_2012.jpg" },
  "nto": { file: "nto.webp", author: "Thesupermat", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Festival_des_Vieilles_Charrues_2018_-_Hungry_5_-_031.jpg" },
  "oklou": { file: "oklou.webp", author: "Blaithnaid", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Oklou_performing_in_the_Academy_in_2025.jpg" },
  "oliver-heldens": { file: "oliver-heldens.webp", author: "Denis Apel", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Airbeat_One_2015_Oliver_Heldens_by_Denis_Apel-1666.jpg" },
  "oliver-lieb": { file: "oliver-lieb.webp", author: "Scott Sandars from Melbourne, Australia", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Oliver_lieb_(cropped).jpg" },
  "pan-pot": { file: "pan-pot.webp", author: "Robin Krahl", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:2015-07-19_6705_Pan-Pot_(Sea_You).jpg" },
  "paul-elstak": { file: "paul-elstak.webp", author: "Kristel van den Hooven", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Dj-paul-elstak-1305292754.jpg" },
  "peggy-gou": { file: "peggy-gou.webp", author: "Davide Guidone", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Peggy_Gou_2019.jpg" },
  "pinkpantheress": { file: "pinkpantheress.webp", author: "CamilaAlves.raf", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:PinkPantheress_at_2026_Montreux_Jazz_Festival-9.jpg" },
  "planetary-assault-systems": { file: "planetary-assault-systems.webp", author: "PASLBDUB", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Luke_Slater_1_24.jpg" },
  "robert-hood": { file: "robert-hood.webp", author: "Ventolin", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Robert_Hood_Live_%40_Kennedys,_Dublin,_Ireland_2009.JPG" },
  "royksopp": { file: "royksopp.webp", author: "Stian Andersen", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Royksopp_2014-09-29_001_(cropped).jpg" },
  "sam-feldt": { file: "sam-feldt.webp", author: "The Media Nanny", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:SamFeldt2020_2_srgb_crop.jpg" },
  "sama-abdulhadi": { file: "sama-abdulhadi.webp", author: "TSolange", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sama'_Abdulhadi_en_el_53%C2%B0_Festival_Internacional_Cervantino,_2025_02.jpg" },
  "sara-landry": { file: "sara-landry.webp", author: "Stormedelf", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Sara_Landry_Palace_of_Fine_Arts_SF_11-28-2025.jpg" },
  "satoshi-tomiie": { file: "satoshi-tomiie.webp", author: "Raj Taneja from Vancouver, CA", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Satoshi_Tomiie_(crop).jpg" },
  "scooter": { file: "scooter.webp", author: "Stefan Brending (2eight)", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:2022_Rock_im_Park_-_Scooter_-_H_P_Baxxter_-_by_2eight_-_9SC7035.jpg" },
  "shimza": { file: "shimza.webp", author: "Andy Vuyo", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Dj_Shimza_with_Black_Coffee_Dj.jpg" },
  "shygirl": { file: "shygirl.webp", author: "OnlyFans", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Shygirl.jpg" },
  "skream": { file: "skream.webp", author: "https://www.flickr.com/photos/drown/", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Skream_at_Metropolis_Leeds.jpg" },
  "sofia-kourtesis": { file: "sofia-kourtesis.webp", author: "Phoebe Fox", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sofia_Kourtesis_en_vivo_en_el_Glastonbury_Festival,_Reino_Unido.jpg" },
  "soulwax": { file: "soulwax.webp", author: "Bertrand from Paris, France, original upload: (Uploaded by User:Chin tin tin)", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Rock_en_Seine_2007,_2_Many_DJs-3.jpg" },
  "speedy-j": { file: "speedy-j.webp", author: "basic_sounds", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Speedy_J_(Seattle_2006).jpg" },
  "steve-aoki": { file: "steve-aoki.webp", author: "Gage Skidmore", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Steve_Aoki_by_Gage_Skidmore.jpg" },
  "sven-vath": { file: "sven-vath.webp", author: "Krd", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Sven_V%C3%A4th_01.jpg" },
  "swedish-house-mafia": { file: "swedish-house-mafia.webp", author: "Gianluca199063", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Swedish_house_mafia_2.jpg" },
  "the-martinez-brothers": { file: "the-martinez-brothers.webp", author: "Amnesia Ibiza from Ibiza, Spain", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Martinez_Brothers_on_the_decks.jpg" },
  "the-prodigy": { file: "the-prodigy.webp", author: "Silver Blu3", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:The_Prodigy_IMG_2972_(5353883317)_(cropped).jpg" },
  "tiesto": { file: "tiesto.webp", author: "Julia Keiser", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Ti%C3%ABsto_@_Airbeat_One_2017.jpg" },
  "ummet-ozcan": { file: "ummet-ozcan.webp", author: "Ummet Ozcan", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Ummet_Ozcan.jpg" },
  "underscores": { file: "underscores.webp", author: "georgeybuckley", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Underscores_in_Los_Angeles,_15_April_2026_(cropped).jpg" },
  "vladimir-cauchemar": { file: "vladimir-cauchemar.webp", author: "Mickaël Schauli", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Vladimir_Cauchemar,_lors_du_ZEVENT_2025.jpg" },
  "zara-larsson": { file: "zara-larsson.webp", author: "Hellomoto100", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Zara_Larsson_Midnight_Sun_European_Tour_(cropped)_(cropped).jpg" },
};
/* PHOTOS:end */

export const artistPhoto = (slug: string): ArtistPhoto | undefined => ARTIST_PHOTOS[slug];
