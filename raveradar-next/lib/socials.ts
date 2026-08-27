import type { RaveEvent } from "./types";
import { slugify } from "./data";

/**
 * Comptes sociaux vérifiés des festivals, des salles et des artistes.
 *
 * Pourquoi ce fichier existe : les fiches événement affichaient une « Galerie » de huit
 * dégradés générés à la volée. Zéro information, zéro texte alternatif, zéro raison de
 * cliquer. Le remplaçant honnête n'est pas une fausse photo, c'est le lien vers ce que
 * l'organisateur publie lui-même — son Instagram d'abord, son site et ses autres réseaux
 * ensuite. On n'héberge rien, on ne recopie rien : on renvoie chez la source.
 *
 * ## Ce que Meta permet, et ce qu'il ne permet plus
 *
 * Afficher « les 6 derniers posts » d'un compte tiers n'est plus faisable proprement :
 * l'API Basic Display est fermée depuis décembre 2024, la Graph API ne lit que les comptes
 * dont on détient le jeton (donc les siens), et l'oEmbed réclame un jeton d'application
 * *et* un permalien connu d'avance. Le seul chemin restant serait le scraping — contraire
 * aux CGU, cassé par le mur de connexion, et de toute façon impossible au build.
 *
 * D'où le compromis : `posts` porte des permaliens que la recherche a réellement vus, et
 * `<InstagramFeed>` les rend via le lecteur officiel d'Instagram (`/p/{code}/embed`), qui
 * sert le contenu depuis Instagram, crédite le compte et renvoie vers lui. Un compte sans
 * `posts` n'affiche pas de grille vide : il affiche sa carte de profil, ce qui est déjà la
 * vérité utile — « voici où ça se passe ».
 *
 * ## Règle de contenu
 *
 * Même discipline que `lib/bios.ts` : ce sont de vraies marques et de vraies personnes.
 * Un compte non vérifié n'entre pas, et la fiche se contente alors de ne rien afficher.
 * Les maps sont écrites par `.research/socials/ingest.py` — ne pas les éditer à la main.
 */

/** Les réseaux qu'une fiche sait afficher, dans l'ordre d'importance à l'écran. */
export const NETWORKS = [
  "instagram",
  "site",
  "facebook",
  "tiktok",
  "youtube",
  "soundcloud",
  "spotify",
  "bandcamp",
  "x",
  "ra",
] as const;

export type Network = (typeof NETWORKS)[number];

export type Socials = Partial<Record<Network, string>> & {
  /** Codes de posts Instagram publics, du plus récent au plus ancien (6 max). */
  posts?: string[];
};

/** Libellé humain d'un réseau (identique en FR et EN — ce sont des noms propres). */
export const NETWORK_LABEL: Record<Network, string> = {
  instagram: "Instagram",
  site: "Site officiel",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  bandcamp: "Bandcamp",
  x: "X",
  ra: "Resident Advisor",
};

export const NETWORK_LABEL_EN: Record<Network, string> = { ...NETWORK_LABEL, site: "Official site" };

/**
 * URL complète d'un profil.
 *
 * Les champs stockent un *handle* quand la plateforme en a un (`instagram`, `tiktok`, `x`,
 * `soundcloud`) et une URL entière sinon — un identifiant Spotify ou une page Facebook n'a
 * pas de forme courte fiable. On accepte les deux dans les deux sens : une valeur qui
 * commence par `http` passe telle quelle.
 */
export function socialUrl(net: Network, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const h = value.replace(/^@/, "");
  switch (net) {
    case "instagram":
      return `https://www.instagram.com/${h}/`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "x":
      return `https://x.com/${h}`;
    case "soundcloud":
      return `https://soundcloud.com/${h}`;
    case "facebook":
      return `https://www.facebook.com/${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    case "bandcamp":
      return `https://${h}.bandcamp.com`;
    default:
      return `https://${h}`;
  }
}

/**
 * Le pseudo à afficher à côté du nom du réseau — ou rien.
 *
 * « Spotify · @5Ho1vKl1Uz8bJlk4vbmvmf » ne renseigne personne : un identifiant Spotify ou
 * un identifiant de chaîne YouTube (`/channel/UC…`) n'est pas un nom, c'est une clé
 * primaire. On ne montre un pseudo que là où il en existe un que le public reconnaît.
 */
export function socialHandle(net: Network, value: string): string | undefined {
  if (net === "site" || net === "ra" || net === "spotify" || net === "bandcamp") return undefined;
  if (!/^https?:\/\//i.test(value)) return `@${value.replace(/^@/, "")}`;
  try {
    const seg = new URL(value).pathname.split("/").filter(Boolean);
    const last = seg[seg.length - 1];
    if (!last) return undefined;
    // YouTube n'a de pseudo lisible que sous la forme /@nom ; /channel/UC… n'en est pas un.
    if (net === "youtube" && !value.includes("/@")) return undefined;
    return `@${last.replace(/^@/, "")}`;
  } catch {
    return undefined;
  }
}

/** Les liens d'une fiche, dans l'ordre de `NETWORKS`, Instagram en tête. */
export function socialLinks(s: Socials): { net: Network; url: string; handle?: string }[] {
  return NETWORKS.filter((n) => s[n]).map((n) => ({
    net: n,
    url: socialUrl(n, s[n]!),
    handle: socialHandle(n, s[n]!),
  }));
}

/**
 * `sameAs` schema.org : les profils officiels de l'entité décrite par la page.
 *
 * C'est le vrai gain SEO de ce chantier. Google réconcilie une entité (un festival, un
 * artiste) à partir de ses profils déclarés ; sans `sameAs`, « Positiv Festival » n'est
 * qu'une chaîne de caractères de plus.
 */
export const sameAs = (s: Socials | undefined): string[] =>
  s ? socialLinks(s).map((l) => l.url) : [];

/** Permalien du lecteur officiel Instagram pour un code de post. */
/* Définies dans `lib/instagram.ts`, un module sans aucun import, et ré-exportées ici
   pour les appelants serveur. `<InstagramFeed>` doit taper le module feuille : passer
   par ce fichier-ci embarquerait les trois maps ci-dessous, et `slugify` avec elles
   tout le catalogue, dans le bundle client de chaque fiche. */
export { embedUrl, postUrl } from "./instagram";

/* Les maps sont générées — voir .research/socials/ingest.py. */
/* SOCIALS:start */
export const EVENT_SOCIALS: Record<string, Socials> = {
  "airbeat-one": { instagram: "airbeatone", site: "https://www.airbeat-one.de", facebook: "https://www.facebook.com/airbeatone/", tiktok: "airbeatonefestival", youtube: "https://www.youtube.com/user/airbeatone00" },
  "all-together-now": { instagram: "alltogethernow.ie", site: "https://alltogethernow.ie", facebook: "https://www.facebook.com/ATNFestival/", youtube: "https://www.youtube.com/channel/UC_04-lD4FqzVvzSKijR9D3g" },
  "aluna-festival": { instagram: "ardeche_alunafestival", site: "https://aluna-festival.fr", facebook: "https://www.facebook.com/ALUNAFESTIVAL", tiktok: "alunafestival", youtube: "https://www.youtube.com/channel/UCfAFpR3iYnabA0_E48e6dTg" },
  "amsterdam-dance-event-ade": { instagram: "amsterdamdanceevent", site: "https://www.amsterdam-dance-event.nl", facebook: "https://www.facebook.com/amsterdamdanceevent", x: "ADE_NL" },
  "aquasella": { instagram: "aquasellafest", site: "https://aquasella.com", facebook: "https://www.facebook.com/aquasellafest", tiktok: "aquasellafest", youtube: "https://www.youtube.com/user/AquasellaChannel", soundcloud: "aquasella-fest" },
  "astropolis": { instagram: "astropolis", site: "https://www.astropolis.org", facebook: "https://www.facebook.com/festival.astropolis", tiktok: "astropolisfestival" },
  "audra-festival": { instagram: "audrafestival", site: "https://audrafestival.lt" },
  "ava-london": { instagram: "avafestival", site: "https://avafestival.com", facebook: "https://www.facebook.com/avafestival/", tiktok: "avafestival", youtube: "https://www.youtube.com/c/AVAFestival", soundcloud: "avafestival", x: "AVAFestival_" },
  "awakenings-ade": { instagram: "awakenings", site: "https://www.awakenings.com" },
  "awakenings-festival": { instagram: "awakenings", site: "https://www.awakenings.com", facebook: "https://www.facebook.com/awakenings", tiktok: "awakenings", youtube: "https://www.youtube.com/user/awakeningsevent", soundcloud: "awakenings", x: "awakenings" },
  "awakenings-summer-festival": { instagram: "awakenings", site: "https://www.awakenings.com" },
  "awakenings-upclose": { instagram: "awakenings.upclose", site: "https://www.awakenings.com" },
  "barrakud-festival": { instagram: "barrakud_official", site: "https://www.barrakud.com", youtube: "https://www.youtube.com/@BARRAKUDFestival" },
  "beatpatrol-festival": { instagram: "beatpatrol.festival", site: "https://www.beatpatrol.at", facebook: "https://www.facebook.com/beatpatrol.at", tiktok: "beatpatrol" },
  "beats-for-love": { instagram: "beats.for.love.festival", site: "https://www.b4l.cz", facebook: "https://www.facebook.com/beats.for.love", tiktok: "beats.for.love", youtube: "https://www.youtube.com/user/BEATSFORLOVEFESTIVAL" },
  "beonix-music-festival": { instagram: "beonix_festival", site: "https://beonix.art", facebook: "https://www.facebook.com/beonixfestival/", tiktok: "beonix_festival", youtube: "https://www.youtube.com/channel/UCRayZ21KY625V7tXczytwRA" },
  "bloom-festival": { instagram: "bloomfest.pt", site: "https://www.bloomfestival.pt", facebook: "https://www.facebook.com/bloomfest.pt/" },
  "bonfire-festival": { instagram: "bonfirefestival.se", site: "https://bonfirefestival.se", facebook: "https://www.facebook.com/bonfirefestival.se/", tiktok: "bonfirefestival.se" },
  "boom-festival": { instagram: "boomfestivalofficial", site: "https://www.boomfestival.org", facebook: "https://www.facebook.com/boomfestivalofficialpage/", soundcloud: "boomfestival" },
  "boomtown-chapter-five": { instagram: "boomtownfairofficial", site: "https://www.boomtownfair.co.uk", facebook: "https://www.facebook.com/boomtownofficial", tiktok: "boomtownfair", youtube: "https://www.youtube.com/c/BoomtownFairOfficial", x: "boomtownfair" },
  "brunch-electronik-lisboa-4-adam-beyer": { instagram: "brunchlisboa", site: "https://lisboa.brunchelectronik.com", facebook: "https://www.facebook.com/brunchlisboa/", tiktok: "brunchlisboa" },
  "brunch-electronik-lisboa-5-charlotte-de-witte": { instagram: "brunchlisboa", site: "https://lisboa.brunchelectronik.com", facebook: "https://www.facebook.com/brunchlisboa/", tiktok: "brunchlisboa" },
  "c2c-festival": { instagram: "clubtoclub", site: "https://clubtoclub.it", facebook: "https://www.facebook.com/clubtoclub", tiktok: "clubtoclub" },
  "copenhagen-distortion": { instagram: "cphdistortion", site: "https://www.cphdistortion.dk", facebook: "https://www.facebook.com/cphdistortion", tiktok: "cphdistortion" },
  "crazy-new-year": { instagram: "crazynewyearfestival", facebook: "https://www.facebook.com/crazynewyearfestival/", tiktok: "crazynewyear" },
  "creamfields": { instagram: "creamfieldsofficial", site: "https://www.creamfields.com", facebook: "https://www.facebook.com/OfficialCreamfields", tiktok: "creamfieldsofficial", youtube: "https://www.youtube.com/channel/UC7RZ3YtxzlR61_3kfjdolAA" },
  "ctm-festival": { instagram: "ctmfestival", site: "https://www.ctm-festival.de", facebook: "https://www.facebook.com/CTMFestival", youtube: "https://www.youtube.com/user/DISKCTM", soundcloud: "ctm-festival", x: "CTMFestival" },
  "dalma-festival": { instagram: "dalmafestival", site: "https://www.dalmafestival.com", facebook: "https://www.facebook.com/dalmafestival" },
  "dantz-festival": { instagram: "dantzmusik", site: "https://dantz.eu", facebook: "https://www.facebook.com/dantzmusik/", tiktok: "dantzmusik", youtube: "https://www.youtube.com/channel/UC8ErqRxdgwWhMmf5yuBYF5Q", soundcloud: "dantzmusik" },
  "decibel-open-air": { instagram: "decibelopenair", site: "https://www.decibelopenair.com", facebook: "https://www.facebook.com/decibelopenair/", youtube: "https://youtube.com/decibelopenair" },
  "decibel-outdoor": { instagram: "officialdecibeloutdoor", site: "https://www.decibeloutdoor.com", facebook: "https://www.facebook.com/decibeloutdoorfestival" },
  "defqon-1-weekend": { instagram: "defqon1", site: "https://www.q-dance.com/en/events/defqon-1", facebook: "https://www.facebook.com/defqon1", tiktok: "defqon1" },
  "dekmantel-festival": { instagram: "dkmntl", site: "https://www.dekmantelfestival.com", soundcloud: "dkmntl" },
  "detonation-festival": { instagram: "detonationfestival", site: "https://detonation-festival.com", facebook: "https://www.facebook.com/festivaldetonation/" },
  "dgtl-amsterdam": { instagram: "dgtlfestival", site: "https://www.dgtl.nl", facebook: "https://www.facebook.com/dgtlfestival", tiktok: "dgtlfestival", youtube: "https://www.youtube.com/channel/UCXAuu4lli9oBgKZVGapNvBw", soundcloud: "dgtl-festival" },
  "dimensions-festival": { instagram: "dimensionsfestival", site: "https://www.dimensionsfestival.com", soundcloud: "dimensionsfestival" },
  "dockyard-festival-ade": { instagram: "dockyardfestival", site: "https://www.dockyardfestival.com", facebook: "https://www.facebook.com/DockyardFestival", tiktok: "dockyardfestival" },
  "dominator-festival": { instagram: "dominatorofficial", site: "https://www.dominatorfestival.nl", facebook: "https://www.facebook.com/dominatorfestival", tiktok: "dominator.festival", youtube: "https://www.youtube.com/user/dominatorfestival", soundcloud: "dominatorfestival" },
  "dour-festival": { instagram: "dourfestival", site: "https://www.dourfestival.eu", facebook: "https://www.facebook.com/dourfestival", tiktok: "dourfestival", youtube: "https://www.youtube.com/@dourfestival", spotify: "https://open.spotify.com/user/dourfestival" },
  "draaimolen-festival": { site: "https://www.draaimolen.nu", soundcloud: "draaimolen" },
  "dream-nation-festival": { instagram: "dreamnation_festival", site: "https://www.dreamnation.fr", facebook: "https://www.facebook.com/dreamnationfestival", tiktok: "dreamnation_fest", youtube: "https://www.youtube.com/@dreamnationfestival", x: "DreamNationFest" },
  "dreambeach-costa-del-sol": { instagram: "dreambeachfest", site: "https://www.dreambeach.es", facebook: "https://www.facebook.com/DreambeachFest", youtube: "https://www.youtube.com/channel/UCirsb9ukXh4LWQwBllSJe3Q" },
  "duro-festival-xxl": { instagram: "durofestival", site: "https://durofestival.com", facebook: "https://facebook.com/durofestival" },
  "dystopia-festival": { instagram: "dystopiafestival", site: "https://dystopia-festival.com/saint-etienne/", facebook: "https://www.facebook.com/festivaldystopia", tiktok: "dystopia.festival", youtube: "https://www.youtube.com/@dystopia.festival" },
  "electric-castle": { instagram: "electriccastle", site: "https://www.electriccastle.ro", facebook: "https://www.facebook.com/ElectricCastle", tiktok: "electriccastle", youtube: "https://www.youtube.com/user/ElectricCastleCluj", x: "Electric_Castle" },
  "electric-love-festival": { instagram: "electricloveaut", site: "https://www.electriclove.at", facebook: "https://www.facebook.com/electriclovefestival", tiktok: "electriclovefestival", youtube: "https://www.youtube.com/c/electriclovetv", x: "ElectricLoveAut" },
  "elektric-park-festival": { instagram: "elektric_park", site: "https://elektricpark.com", facebook: "https://www.facebook.com/elektricparkfestival", youtube: "https://www.youtube.com/channel/UCPoSq9W97bOWhoFZb1h3IRw" },
  "emerge-festival": { instagram: "emergebelfast", site: "https://www.emergebelfast.com", facebook: "https://www.facebook.com/emergebelfast", tiktok: "shinebelfast", x: "Emerge_Belfast" },
  "eskape-festival": { site: "https://www.eskapefestival.com", facebook: "https://www.facebook.com/eskapefestival" },
  "eternal-sun-festival": { instagram: "eternalsunfestival", site: "https://www.eternalsunfestival.com", facebook: "https://www.facebook.com/profile.php?id=61571564712205" },
  "extrema-outdoor-belgium": { instagram: "extrema.be", site: "https://www.extrema.be", facebook: "https://www.facebook.com/ExtremaOutdoor.Belgium/", tiktok: "extrema.be", youtube: "https://www.youtube.com/channel/UCb98bAT19io2A8H4n_omFHw", soundcloud: "extrema-outdoor-belgium" },
  "extreme-chill-festival": { instagram: "extremechill", site: "https://www.extremechill.org", facebook: "https://www.facebook.com/extremechillfestival" },
  "family-piknik": { instagram: "familypiknikofc", site: "https://www.familypiknikfestival.com", facebook: "https://www.facebook.com/familypiknik" },
  "fcknye-festival": { instagram: "fcknyefestival", site: "https://www.fcknyefestival.com", facebook: "https://www.facebook.com/FcknyeFestival/", youtube: "https://www.youtube.com/@FCKNYEFestival", x: "fcknyefestival" },
  "festival-le-bon-air": { instagram: "bonairfestival", site: "https://www.le-bon-air.com", facebook: "https://www.facebook.com/bonairfestival" },
  "festival-maintenant": { instagram: "maintenant_festival", site: "https://www.maintenant-festival.fr", facebook: "https://www.facebook.com/maintenant.festival/" },
  "festival-plein-air": { instagram: "pleinair.fest", site: "https://www.festivalpleinair.fr", facebook: "https://www.facebook.com/pleinair.fest/" },
  "field-day": { instagram: "fielddayfestivals", site: "https://www.fielddayfestivals.com", facebook: "https://www.facebook.com/fielddaylondon", tiktok: "fielddaylondon", youtube: "https://www.youtube.com/@fielddaylondon" },
  "field-maneuvers": { site: "https://fieldmaneuvers.com", soundcloud: "fieldmaneuvers" },
  "flow-festival": { instagram: "flowfestivalhelsinki", site: "https://www.flowfestival.com", facebook: "https://www.facebook.com/FlowFestival", tiktok: "flowfestival", youtube: "https://www.youtube.com/user/flowfestival" },
  "fly-open-air-edinburgh": { instagram: "openairfly", site: "https://www.flyflyfly.co.uk/open-air", tiktok: "stayflytv", x: "openairfly" },
  "forwards-festival": { instagram: "forwardsbristol", site: "https://www.forwardsbristol.co.uk", facebook: "https://www.facebook.com/forwardsbristol/" },
  "free-earth-festival": { instagram: "freeearthfestival", site: "https://freeearth-festival.com", facebook: "https://www.facebook.com/freeearthfestival", youtube: "https://www.youtube.com/@FreeEarthFest", soundcloud: "freeearthfestival" },
  "freshwave-festival": { instagram: "freshwavefest", site: "https://freshwavefestival.com", facebook: "https://www.facebook.com/freshwavefestival/", youtube: "https://www.youtube.com/channel/UCuXzJefmQ1CsSHkTgVD5cHQ" },
  "glitch-festival": { instagram: "glitchfestival", site: "https://glitchfestival.com", facebook: "https://www.facebook.com/glitchfestival", soundcloud: "glitchfestival" },
  "gottwood-festival": { instagram: "gottwood", site: "https://gottwood.co.uk", tiktok: "gottwood", soundcloud: "gottwax" },
  "grape-festival": { instagram: "grape_festival", site: "https://www.grapefestival.sk", facebook: "https://www.facebook.com/grapefest", youtube: "https://www.youtube.com/user/grapefestival2010", x: "grape_festival" },
  "hadra-trance-festival": { instagram: "hadratrancefestival", site: "https://hadra.net", facebook: "https://www.facebook.com/hadratrancefestivalofficial", tiktok: "hadratrancefestival", soundcloud: "hadratrancefestival" },
  "hideout-festival": { instagram: "hideoutfestival", site: "https://www.hideoutfestival.com", facebook: "https://www.facebook.com/hideoutfestival", tiktok: "hideoutfestival", x: "hideoutfestival" },
  "houghton-festival": { instagram: "houghtonfestival", site: "https://houghtonfestival.co.uk" },
  "iceland-airwaves": { instagram: "icelandairwaves", site: "https://icelandairwaves.is", facebook: "https://www.facebook.com/icelandairwavesfestival/" },
  "ikarus-festival": { instagram: "ikarus.festival", site: "https://www.ikarus-festival.de", facebook: "https://www.facebook.com/ikarusfestival/", tiktok: "ikarusfestival", youtube: "https://www.youtube.com/channel/UCeK89m0PIAJKHQ3ICEGvJdA" },
  "illusion-bzh-edition": { instagram: "pandemic_events_", site: "https://www.pandemic-events.com/illusion", facebook: "https://www.facebook.com/Pandemic.Events/", tiktok: "pandemic.events", youtube: "https://www.youtube.com/channel/UC8bXfHT9_AhGLvS5RALl5zA" },
  "insane-festival": { instagram: "insanefestival", site: "https://www.insanefestival.com", facebook: "https://www.facebook.com/insanefestival", tiktok: "insanefestival", youtube: "https://www.youtube.com/user/InsaneFestival", x: "insanefestival" },
  "insomnia-festival": { instagram: "insomniatromso", site: "https://insomniafestival.no", facebook: "https://www.facebook.com/insomniatromso" },
  "intents-festival": { instagram: "intentsfestival", site: "https://www.intentsfestival.nl", facebook: "https://www.facebook.com/intentsfestival", youtube: "https://youtube.com/intentsfestival" },
  "into-the-madness": { instagram: "intothemadnessfestival", site: "https://www.intothemadness.de", facebook: "https://www.facebook.com/intothemadnessfestival" },
  "junction-2": { instagram: "junction_2", site: "https://junction2.london", facebook: "https://www.facebook.com/Junction2London", tiktok: "junction_2" },
  "kappa-futurfestival": { instagram: "futur_festival", site: "https://www.kappafuturfestival.it", facebook: "https://www.facebook.com/FuturFestival", tiktok: "futurfestival", youtube: "https://www.youtube.com/@futur_festival", spotify: "https://open.spotify.com/user/futurfestival", x: "futurfestival" },
  "lake-fest": { instagram: "lakefestniksic", site: "https://lake-fest.me", facebook: "https://www.facebook.com/lakefestniksic" },
  "le-jardin-electronique": { instagram: "lejardinelectronique", site: "https://www.jardinelectronique.com", facebook: "https://www.facebook.com/JardinElectronique" },
  "les-nuits-secretes": { instagram: "lesnuitssecretes", site: "https://www.lesnuitssecretes.com", facebook: "https://www.facebook.com/festivalnuitssecretes/", tiktok: "lesnuitssecretes", youtube: "https://www.youtube.com/channel/UCCdWt16fjpE6MNCMmBBW1cw" },
  "les-plages-electroniques": { instagram: "plageselectro", site: "https://www.plages-electroniques.com", facebook: "https://www.facebook.com/lesplages", tiktok: "les_plages_electroniques", youtube: "https://www.youtube.com/@LesPlagesElectroniquesOfficiel", x: "plageselectro" },
  "les-rencontres-trans-musicales": { instagram: "transmusicales", site: "https://www.lestrans.com", facebook: "https://www.facebook.com/transmusicales", tiktok: "les_trans", youtube: "https://youtube.com/transmusicales" },
  "let-it-roll": { instagram: "letitrollfestival", site: "https://letitroll.eu", facebook: "https://www.facebook.com/letitrollcz", tiktok: "letitrollfestival", youtube: "https://www.youtube.com/channel/UCEJCxoQ6Ck-BQfmoHbdXcEg", x: "letitroll_fest" },
  "lethargy-festival": { instagram: "lethargyfestival", site: "https://www.lethargy.ch", facebook: "https://www.facebook.com/LethargyFestival/", soundcloud: "lethargyfestival" },
  "loftas-fest": { instagram: "loftasfest", site: "https://loftasfest.com", facebook: "https://www.facebook.com/loftasfest" },
  "lost-village": { instagram: "lostvillagefestival", site: "https://lostvillagefestival.com" },
  "lovefest": { instagram: "lovefest.rs", site: "https://www.lovefest.rs", facebook: "https://www.facebook.com/lovefestVB/", tiktok: "lovefest.rs", youtube: "https://www.youtube.com/@LovefestSerbia", x: "lovefestrs" },
  "loveland-festival": { instagram: "lovelandnl", site: "https://www.loveland.nl", facebook: "https://www.facebook.com/lovelandevents", tiktok: "lovelandevents", youtube: "https://www.youtube.com/user/lovelandfestival", spotify: "https://open.spotify.com/user/lovelandfestival" },
  "lunchmeat-festival": { instagram: "lunchmeatfestival", site: "https://lunchmeatfestival.cz", facebook: "https://www.facebook.com/LunchmeatFestival/" },
  "malmofestivalen": { instagram: "malmofestivalen", site: "https://www.malmofestivalen.se", facebook: "https://www.facebook.com/malmofestivalen/", tiktok: "malmofestivalen_official", youtube: "https://www.youtube.com/@malmofestivalen2011" },
  "marvellous-island": { instagram: "marvellousisland", site: "https://www.marvellous-island.fr", facebook: "https://www.facebook.com/marvellous.island.festival", youtube: "https://www.youtube.com/channel/UC8YrSeiFS_p3BO-Iuhq3lOg", soundcloud: "marvellous-island-00" },
  "marvellous-island-festival": { instagram: "marvellousisland", site: "https://marvellous-island.fr", facebook: "https://www.facebook.com/marvellous.island.festival", youtube: "https://www.youtube.com/channel/UC8YrSeiFS_p3BO-Iuhq3lOg", soundcloud: "marvellous-island-00" },
  "masters-of-hardcore-the-masterplan": { instagram: "mastersofhardcore", site: "https://www.mastersofhardcore.com", facebook: "https://www.facebook.com/officialMOH/", youtube: "https://www.youtube.com/user/mastersofhardcore", soundcloud: "mastersofhardcore", x: "official_MOH" },
  "mayday": { instagram: "mayday_dortmund", site: "https://www.mayday.de", facebook: "https://www.facebook.com/mayday.dortmund/", tiktok: "mayday_dortmund", youtube: "https://www.youtube.com/@MaydayDeutschland", soundcloud: "mayday-official", spotify: "https://open.spotify.com/user/maydaydortmund" },
  "mayday-poland-2026-iconic": { instagram: "mayday_poland", site: "https://mayday.pl", facebook: "https://www.facebook.com/MaydayPoland/", tiktok: "maydaypoland", youtube: "https://www.youtube.com/user/MaydayPolandOfficial" },
  "medusa-sunbeach-festival": { instagram: "medusa_festival", site: "https://www.medusasunbeach.com", facebook: "https://www.facebook.com/medusasunbeach", tiktok: "medusafestival" },
  "micro-festival": { instagram: "microfestival", site: "https://microfestival.be", facebook: "https://www.facebook.com/microfestival" },
  "mira-digital-arts-festival": { instagram: "mirafestival", site: "https://mirafestival.com", facebook: "https://www.facebook.com/MIRA.Festival/" },
  "nameless-festival": { instagram: "namelessfestival", site: "https://www.namelessfestival.it", facebook: "https://www.facebook.com/namelessfestivalit/" },
  "nature-one": { instagram: "natureonefestival", site: "https://www.nature-one.de", facebook: "https://www.facebook.com/natureone.festival", tiktok: "natureonefestival", youtube: "https://www.youtube.com/NatureOneChannel", soundcloud: "official-nature-one", spotify: "https://open.spotify.com/user/natureonefestival" },
  "ndk-festival": { instagram: "ndkfestival", site: "https://ndkfestival.com", facebook: "https://www.facebook.com/ndkfestival", youtube: "https://www.youtube.com/@ndkfestival5800" },
  "nemora-festival": { instagram: "nemorafest.eu", site: "https://www.nemorafest.eu" },
  "neopop-festival": { instagram: "neopopfestival", site: "https://neopopfestival.net", facebook: "https://www.facebook.com/neopopfestival", youtube: "https://www.youtube.com/user/neopopfestival" },
  "nibirii-festival": { instagram: "nibirii", site: "https://nibirii.com", facebook: "https://facebook.com/nibirii", tiktok: "nibirii", youtube: "https://www.youtube.com/@nibirii" },
  "no-bounds-festival": { instagram: "noboundsfestivaluk", site: "https://noboundsfestival.co.uk", facebook: "https://www.facebook.com/noboundsfestival/" },
  "no-sleep-festival": { instagram: "nosleepfestival", site: "https://www.nosleepfestival.com", facebook: "https://www.facebook.com/NSNSexit", youtube: "https://www.youtube.com/c/NoSleepFestival" },
  "nuits-sonores": { instagram: "nuits_sonores", site: "https://www.nuits-sonores.com", facebook: "https://www.facebook.com/nuitssonores.festival", tiktok: "nuitssonoreslyon" },
  "o-days-festival": { instagram: "odaysfestival", site: "https://www.odaysfestival.dk", facebook: "https://www.facebook.com/ODaysFestival/", youtube: "https://www.youtube.com/@odaysfestival" },
  "omana-festival": { instagram: "omanafestival", site: "https://omana-festival.de" },
  "ortigia-music": { instagram: "ortigiamusicfestival", site: "https://ortigiamusic.com", facebook: "https://www.facebook.com/ortigiamusic/", tiktok: "ortigiamusic" },
  "ostend-beach-festival": { instagram: "ostendbeach", site: "https://www.ostendbeach.be", facebook: "https://www.facebook.com/ostendbeach", tiktok: "ostendbeach", youtube: "https://www.youtube.com/OstendBeach" },
  "palmesus": { instagram: "palmesus", site: "https://www.palmesus.com", facebook: "https://www.facebook.com/Palmesus/", tiktok: "palmesus.com", youtube: "https://www.youtube.com/user/palmesusbeachparty" },
  "panorama-festival": { instagram: "panoramafestival_", site: "https://www.panorama-festival.it", facebook: "https://www.facebook.com/panoramafestivalpuglia/", tiktok: "panoramafestival_" },
  "paradigm-festival": { instagram: "paradigm050", site: "https://www.paradigmfestival.com", soundcloud: "paradigm050" },
  "paradise-city": { instagram: "paradisecityofficial", site: "https://paradisecity.be", facebook: "https://www.facebook.com/paradisecityfestival", tiktok: "paradisecityfestival" },
  "parklife": { instagram: "parklife_festival", site: "https://www.parklife.uk.com", facebook: "https://www.facebook.com/parklifefestival", tiktok: "parklifefestival", x: "Parklifefest" },
  "parookaville": { instagram: "parookaville", site: "https://www.parookaville.com", facebook: "https://www.facebook.com/parookaville", tiktok: "parookaville", youtube: "https://www.youtube.com/channel/UCR5mwo9sMrF3y8Y2gN5pknw" },
  "pharaonic": { instagram: "festivalpharaonic", site: "https://www.pharaonic.fr", facebook: "https://www.facebook.com/festivalpharaonic", tiktok: "festivalpharaonic", youtube: "https://www.youtube.com/channel/UCLjbKGxCsKNIO1KlDXuQkuw", x: "Pharaonic_fest" },
  "pohoda-festival": { instagram: "pohodafestival", site: "https://www.pohodafestival.sk", facebook: "https://www.facebook.com/pohoda.festival", tiktok: "pohoda_festival", youtube: "https://www.youtube.com/user/FestivalPohoda" },
  "polifonic": { instagram: "polifonic_", site: "https://www.polifonic.it", facebook: "https://www.facebook.com/polifonicfestival", soundcloud: "polifonicfestival" },
  "positiv-festival": { instagram: "positiv_festival_official", site: "https://www.positivfestival.fr", facebook: "https://www.facebook.com/positivfestival", youtube: "https://www.youtube.com/channel/UCS5Qt35fYtHEbOJ73R_qWDg" },
  "positivus-2026-calvin-harris": { instagram: "positivus", site: "https://www.positivusfestival.com", facebook: "https://www.facebook.com/PositivusFestival/", x: "positivus" },
  "pukkelpop": { instagram: "pukkelpop", site: "https://www.pukkelpop.be", facebook: "https://www.facebook.com/pukkelpop", tiktok: "pukkelpop", youtube: "https://www.youtube.com/@pukkelpopfestival" },
  "pussy-lounge": { instagram: "officialpssylounge", site: "https://www.b2s.nl/pussylounge", facebook: "https://www.facebook.com/pussylounge/" },
  "rampage-weekend": { instagram: "rampage.international", site: "https://rampage.eu", facebook: "https://www.facebook.com/Rampage.International.Events", tiktok: "rampage_belgium", youtube: "https://www.youtube.com/user/WeAreRampageEvents", x: "WeAreRampage" },
  "rave-on-snow": { instagram: "raveonsnow_festival", site: "https://raveonsnow.com", facebook: "https://www.facebook.com/RaveOnSnowSaalbach", youtube: "https://www.youtube.com/raveonsnow" },
  "rave-rebels-xxl": { instagram: "raverebels", site: "https://raverebels.com", facebook: "https://www.facebook.com/raverebelsfestival/", tiktok: "raverebels", youtube: "https://www.youtube.com/@raverebels" },
  "rave-the-planet-parade": { instagram: "ravetheplanet", site: "https://www.ravetheplanet.com", facebook: "https://www.facebook.com/ravetheplanetggmbh", tiktok: "ravetheplanet", youtube: "https://www.youtube.com/ravetheplanet", soundcloud: "ravetheplanetggmbh" },
  "reperkusound": { instagram: "reperkusound", site: "https://www.reperkusound.com", facebook: "https://www.facebook.com/Reperkusound", tiktok: "reperkusound", youtube: "https://www.youtube.com/channel/UCrjREC5HCkEgY7D5To29XCw", soundcloud: "reperkusound" },
  "reverze": { instagram: "reverze.be", site: "https://www.reverze.be", facebook: "https://www.facebook.com/reverzeofficial", tiktok: "reverze.be" },
  "rewire": { instagram: "rewirefestival", site: "https://www.rewirefestival.nl", facebook: "https://www.facebook.com/rewirefestival", youtube: "https://www.youtube.com/channel/UCJF8DEI0B2_Zqlb_wwp-gcg", soundcloud: "rewirefestival", bandcamp: "https://rewirefestival.bandcamp.com", x: "rewirefestival" },
  "reworks": { instagram: "reworksfestival", site: "https://reworks.gr", facebook: "https://www.facebook.com/reworksfestivalofficial/", x: "reworksfestival", ra: "https://ra.co/promoters/39101" },
  "robot-festival": { instagram: "robotfestival", site: "https://www.robotfestival.it", facebook: "https://www.facebook.com/festivalrobot/", spotify: "https://open.spotify.com/user/robotfestival" },
  "rong-open-air-festival-malta": { instagram: "rongevents", site: "https://malta.rongevents.com", facebook: "https://facebook.com/rongevents", tiktok: "rongevents" },
  "roskilde-festival": { instagram: "roskildefestival", site: "https://www.roskilde-festival.dk", facebook: "https://www.facebook.com/orangefeeling", tiktok: "roskildefestival", youtube: "https://www.youtube.com/user/roskildefestival" },
  "rotterdam-rave-festival": { instagram: "rotterdamrave", site: "https://www.rotterdamrave.com", facebook: "https://www.facebook.com/rotterdamrave.events", tiktok: "rotterdamrave", youtube: "https://www.youtube.com/rotterdamrave", soundcloud: "rotterdamse-rave" },
  "ruhr-in-love": { instagram: "ruhrinlove", site: "https://www.ruhr-in-love.de", facebook: "https://facebook.com/ruhrinlove", tiktok: "ruhrinlove", youtube: "https://www.youtube.com/ruhrinloveofficial", soundcloud: "ruhr-in-love" },
  "shapes-festival-zakynthos": { instagram: "shapesfestival", site: "https://shapesfestival.gr", facebook: "https://www.facebook.com/shapesfestival/" },
  "smeerboel-festival": { instagram: "smeerboelfestival", site: "https://www.smeerboel.nl", facebook: "https://www.facebook.com/Smeerboel/" },
  "snowbombing": { instagram: "snowbombingofficial", site: "https://www.snowbombing.com", facebook: "https://www.facebook.com/snowbombing", youtube: "https://www.youtube.com/@snowbombing", x: "Snowbombing" },
  "snowboxx": { instagram: "snowboxx", site: "https://www.snowboxx.com", facebook: "https://www.facebook.com/snowboxx", tiktok: "snowboxx" },
  "solar-weekend-festival": { instagram: "solarweekend", site: "https://www.solarweekend.com", facebook: "https://www.facebook.com/SolarWeekend/", tiktok: "solarweekend" },
  "solomun-lisboa-brunch-neopop": { instagram: "brunchlisboa", site: "https://lisboa.brunchelectronik.com", facebook: "https://www.facebook.com/brunchlisboa/", tiktok: "brunchlisboa" },
  "sonar": { instagram: "sonarfestival", site: "https://sonar.es", facebook: "https://www.facebook.com/SonarFestival", tiktok: "sonar.festival", youtube: "https://www.youtube.com/SonarFestival", soundcloud: "sonarfestival", spotify: "https://open.spotify.com/user/sonarfestival" },
  "sputnik-spring-break": { instagram: "sputnikspringbreak", site: "https://www.sputnik-springbreak.de", facebook: "https://www.facebook.com/Sputnik.SPRINGBREAK.Festival/" },
  "station-narva": { instagram: "stationnarva", site: "https://www.stationnarva.ee", facebook: "https://www.facebook.com/StationNarva/", tiktok: "stationnarva" },
  "stray-lights-festival": { instagram: "straylights.festival", site: "https://straylightsfestival.ro", facebook: "https://www.facebook.com/profile.php?id=61590382532366" },
  "street-parade": { instagram: "streetparadeofficial", site: "https://www.streetparade.com", facebook: "https://www.facebook.com/streetparade", tiktok: "streetparadeofficial", youtube: "https://www.youtube.com/user/streetparadeZuerich", x: "streetparadeZH" },
  "summer-sound": { instagram: "summersoundlv", site: "https://summersound.lv", facebook: "https://www.facebook.com/summersoundlv/", tiktok: "summersoundlv", youtube: "https://youtube.com/lmtsummersound" },
  "sunandbass": { instagram: "sunandbassofficial", site: "https://www.sunandbass.net", facebook: "https://www.facebook.com/sunandbass", soundcloud: "sunandbass", x: "sunandbass" },
  "sunny-side-festival": { instagram: "sunnysidefestival.mt", site: "https://ssfestivalmalta.com", facebook: "https://www.facebook.com/SunnySideFestivalMT", tiktok: "ssfestivalmt" },
  "sunrise-festival": { instagram: "sunrisefestivalpl", site: "https://sunrisefestival.pl", facebook: "https://www.facebook.com/sunrisefestivalpl", youtube: "https://www.youtube.com/sunrisefestivaltv", x: "sunrisepoland" },
  "supremacy-state-of-distortion": { instagram: "supremacyevent", site: "https://www.supremacy.nl", facebook: "https://www.facebook.com/supremacyevents/", youtube: "https://www.youtube.com/@Supremacyevent" },
  "syndicate": { instagram: "syndicate_dortmund", site: "https://www.syndicate-festival.de", facebook: "https://www.facebook.com/syndicate.festival", tiktok: "syndicate_festival", youtube: "https://www.youtube.com/@SYNDICATEOFCL", soundcloud: "syndicate-festival" },
  "sziget-festival": { instagram: "szigetofficial", site: "https://szigetfestival.com" },
  "taksirat-festival": { instagram: "taksiratfestival", site: "https://taksirat.mk", facebook: "https://www.facebook.com/TaksiratFestival", youtube: "https://www.youtube.com/user/TaksiratFestival", x: "TaksiratFest" },
  "tauron-nowa-muzyka": { instagram: "nowa_muzyka_festiwal", site: "https://festiwalnowamuzyka.pl", facebook: "https://www.facebook.com/NowaMuzyka", tiktok: "tauronnowamuzykakatowice", youtube: "https://www.youtube.com/@festiwalnowamuzyka" },
  "techno-parade": { instagram: "technoparade", site: "https://www.technoparade.fr" },
  "teletech-festival": { instagram: "teletechuk", site: "https://www.teletech.events", tiktok: "teletechuk", soundcloud: "teletechuk", bandcamp: "https://teletechuk.bandcamp.com" },
  "terminal-v-croatia": { instagram: "terminalvcroatia", site: "https://terminalvcroatia.com", facebook: "https://www.facebook.com/terminalvfest/", tiktok: "terminalvfest", youtube: "https://www.youtube.com/channel/UCIyfD_fk7WOkHpm31e3rOXQ" },
  "the-peacock-society": { instagram: "peacocksociety", site: "https://peacocksociety.fr", facebook: "https://www.facebook.com/thepeacocksociety", tiktok: "peacocksociety", youtube: "https://www.youtube.com/user/thepeacocksociety" },
  "the-walking-bass-festival": { instagram: "walkingbassfestival", site: "https://www.thewalkingbass.fr", facebook: "https://www.facebook.com/thewalkingbassfestival", tiktok: "walkingbassfestival", youtube: "https://www.youtube.com/channel/UCVi-muKTxmPlMSxIaQpHyNQ" },
  "the-warehouse-project": { instagram: "whp_mcr", site: "https://www.thewarehouseproject.com", facebook: "https://www.facebook.com/thewarehouseproject", tiktok: "thewarehouseproject", x: "WHP_Mcr" },
  "time-warp": { instagram: "time_warp_official", site: "https://www.time-warp.de", facebook: "https://www.facebook.com/timewarpofficial", tiktok: "time_warp_official", soundcloud: "timewarp_official" },
  "time-warp-spain": { instagram: "time_warp_spain", site: "https://www.time-warp.de/spain/", facebook: "https://www.facebook.com/timewarpfestivalspain" },
  "toffler-festival": { instagram: "tofflerfestival", site: "https://tofflerfestival.nl" },
  "tomorrowland": { instagram: "tomorrowland", site: "https://www.tomorrowland.com", facebook: "https://www.facebook.com/tomorrowland" },
  "tomorrowland-winter": { instagram: "tomorrowlandwinter", site: "https://winter.tomorrowland.com", facebook: "https://www.facebook.com/TomorrowlandWinter" },
  "toxicator": { instagram: "toxicator_mannheim", site: "https://www.toxicator.de", facebook: "https://facebook.com/toxicator", tiktok: "toxicator_mannheim", youtube: "https://www.youtube.com/TOXICATOROFFICIAL", soundcloud: "toxicator-official" },
  "tradgarden-festival": { instagram: "tradgardenfestival", site: "https://tradgardenfestival.se", facebook: "https://www.facebook.com/tradgardenfestival", tiktok: "tradgardenfestival", youtube: "https://www.youtube.com/@tradgardenfestival" },
  "ultra-europe": { instagram: "ultraeurope", site: "https://ultraeurope.com", facebook: "https://www.facebook.com/ultraeurope", x: "ultraeurope" },
  "unsound-krakow-soft-power": { instagram: "unsoundfestival", site: "https://www.unsound.pl", facebook: "https://facebook.com/unsoundfestival", soundcloud: "unsound", x: "unsound" },
  "unsound-warsaw-soft-power": { instagram: "unsoundfestival", site: "https://www.unsound.pl", facebook: "https://facebook.com/unsoundfestival", soundcloud: "unsound", x: "unsound" },
  "untold": { instagram: "untoldfestival", site: "https://untold.com", facebook: "https://www.facebook.com/UNTOLDFestival", tiktok: "untold.festival", youtube: "https://www.youtube.com/channel/UCeDqemm8j1o4u90IHkC0h0w", x: "UntoldFestival" },
  "unum-festival": { instagram: "unumfestival", site: "https://unumfestival.com" },
  "verknipt-festival": { instagram: "verkniptevents", site: "https://www.verknipt.org", facebook: "https://www.facebook.com/VerkniptEvents", tiktok: "verkniptevents", youtube: "https://www.youtube.com/@verkniptevents", soundcloud: "verknipt-events" },
  "viva-festival": { instagram: "viva_festival", site: "https://vivafestival.it", facebook: "https://www.facebook.com/VIVAfestivalIT/" },
  "waterworks-festival": { instagram: "waterworksldn", site: "https://waterworksfestival.co.uk", tiktok: "waterworksfestival" },
  "way-out-west": { instagram: "wayoutwestfestival", site: "https://www.wayoutwest.se", facebook: "https://www.facebook.com/wayoutwestfestival", spotify: "https://open.spotify.com/user/wayoutwestfestival", x: "wayoutwestgbg" },
  "we-out-here-festival": { instagram: "weoutherefest", site: "https://weoutherefestival.com", facebook: "https://www.facebook.com/weoutherefest", youtube: "https://www.youtube.com/channel/UC9h_HIGiJNgJ0BUyhxUG9MQ", x: "weoutherefest" },
  "wecandance": { instagram: "wecandancefest", site: "https://www.wecandance.be", facebook: "https://www.facebook.com/WECANDANCEFEST/", tiktok: "wecandancefest", youtube: "https://www.youtube.com/@WECANDANCE", x: "WECANDANCEFEST" },
  "weekend-festival-finland": { instagram: "weekendfestival", site: "https://www.wknd.fi", facebook: "https://www.facebook.com/WEEKENDFESTIVAL/", tiktok: "weekendfestival", youtube: "https://www.youtube.com/user/WKNDFESTIVAL" },
  "world-club-dome": { instagram: "worldclubdome", site: "https://www.worldclubdome.com", facebook: "https://www.facebook.com/worldclubdome", tiktok: "worldclubdome", youtube: "https://www.youtube.com/@wcdmusic" },
  "wos-festival": { instagram: "wosfestival", site: "https://wosfestival.es" },
  "xrds-crossroads-festival": { instagram: "xrds.be", site: "https://www.xrds.be", tiktok: "xrds.festival.be", youtube: "https://www.youtube.com/@XRDSfestival" },
  "zamna-primer-athens": { instagram: "primermusicfestival", site: "https://primermusicfestival.com", facebook: "https://www.facebook.com/primermusicfestival/", tiktok: "primermusicfestival", youtube: "https://www.youtube.com/@primermusicfestival" },
  "zamna-tulum": { instagram: "zamna.music", site: "https://www.zamnafestival.com", facebook: "https://www.facebook.com/zamna.music", youtube: "https://www.youtube.com/channel/UCh07liXGiNazlEH6Xj6-S0w" },
  "zug-der-liebe": { instagram: "zugderliebe", site: "https://zugderliebe.org", soundcloud: "zugderliebe" },
};

export const VENUE_SOCIALS: Record<string, Socials> = {
  "aaniwalli": { instagram: "aaniwalli", site: "https://aaniwalli.fi", facebook: "https://www.facebook.com/Aaniwalli" },
  "afas-dome": { instagram: "afasdome", site: "https://www.afas-dome.be", facebook: "https://www.facebook.com/afasdome" },
  "afas-live": { instagram: "afaslive", site: "https://www.afaslive.nl", facebook: "https://www.facebook.com/AFASLiveOfficial", tiktok: "afaslive", youtube: "https://www.youtube.com/channel/UCnbJaTxDUBsCKaVqrprXKuQ", spotify: "https://open.spotify.com/user/afaslive", x: "AFASLive" },
  "ainterexpo-ekinox": { instagram: "ainterexpo_ekinox", site: "https://www.ainterexpo.com", facebook: "https://www.facebook.com/AinterexpoBourgenBresse", youtube: "https://www.youtube.com/channel/UC9NazPMMGOKaE22jLlyX-5A" },
  "akvarium-klub": { instagram: "akvariumklub", site: "https://www.akvariumklub.hu", facebook: "https://www.facebook.com/akvariumklub/", tiktok: "akvariumklub", youtube: "https://www.youtube.com/channel/UC7C1zwKSsOf1ESEnDWaVpyw" },
  "amnesia": { instagram: "amnesiaibiza", site: "https://www.amnesia.es", facebook: "https://www.facebook.com/amnesiaibiza", youtube: "https://www.youtube.com/user/amnesiaibizatv", soundcloud: "amnesia-ibiza", spotify: "https://open.spotify.com/user/amnesiaibizadjcenter", x: "amnesia_ibiza" },
  "amnesia-ibiza": { instagram: "amnesiaibiza", site: "https://www.amnesia.es", facebook: "https://www.facebook.com/amnesiaibiza", youtube: "https://www.youtube.com/user/amnesiaibizatv", soundcloud: "amnesia-ibiza", x: "amnesia_ibiza" },
  "amsterdamse-bos": { instagram: "amsterdamsebos", site: "https://www.amsterdamsebos.nl", facebook: "https://www.facebook.com/amsterdamsebos" },
  "ankali": { instagram: "ankali2.0", site: "https://anka.li", facebook: "https://www.facebook.com/ankaliclub/", tiktok: "ankali.club", soundcloud: "ankali" },
  "ankali-planeta-za": { instagram: "ankali2.0", site: "https://anka.li", facebook: "https://www.facebook.com/ankaliclub/", tiktok: "ankali.club", soundcloud: "ankali" },
  "audio-club": { instagram: "audio_club", site: "https://www.audio-club.ch", facebook: "https://www.facebook.com/audiogeneva", soundcloud: "audioclubgeneva" },
  "auditorium-parco-della-musica-ennio-morricone": { instagram: "auditoriumparcodellamusica", site: "https://www.auditorium.com", facebook: "https://www.facebook.com/AuditoriumParcodellaMusica" },
  "badaboum": { instagram: "badaboum.paris", site: "https://badaboum.paris", facebook: "https://www.facebook.com/lebadaboum/", tiktok: "badaboum.paris", soundcloud: "badaboum_paris" },
  "bassiani": { instagram: "basssiani", site: "https://bassiani.com", facebook: "https://www.facebook.com/bassiani" },
  "bataclan": { instagram: "bataclanofficiel", site: "https://www.bataclan.fr", facebook: "https://www.facebook.com/bataclanFR", tiktok: "bataclan_officiel", x: "bataclan_" },
  "beekse-bergen": { instagram: "beeksebergen", site: "https://www.beeksebergen.nl", facebook: "https://www.facebook.com/beeksebergen.nl/", tiktok: "beekse_bergen", youtube: "https://www.youtube.com/@Beekse-Bergen" },
  "berghain-panorama-bar": { site: "https://www.berghain.berlin" },
  "bernexpo": { instagram: "bernexpo", site: "https://www.bernexpo.ch", youtube: "https://www.youtube.com/user/BERNEXPO" },
  "bird": { instagram: "birdrotterdam", site: "https://www.birdrotterdam.nl", facebook: "https://www.facebook.com/BIRDrotterdam", tiktok: "BIRDRotterdam" },
  "blitz-club": { instagram: "blitz_music_club", site: "https://blitz.club", facebook: "https://www.facebook.com/blitzmusicclub/", x: "BLITZ_club_muc" },
  "bootshaus": { instagram: "bootshaus", site: "https://www.bootshaus.tv", facebook: "https://www.facebook.com/ClubBootshaus", tiktok: "bootshausclub", youtube: "https://www.youtube.com/channel/UCeTDb36jRhdTNPFYX1L4mrg", soundcloud: "bootshaus-podcast", spotify: "https://open.spotify.com/user/bootshaus_club", x: "BOOTSHAUS_Club" },
  "c12": { instagram: "c12_bxl", site: "https://c12space.com", facebook: "https://www.facebook.com/C12Bxl/", ra: "https://ra.co/clubs/145682" },
  "cabaret-sauvage": { instagram: "cabaret_sauvage_paris", site: "https://www.cabaretsauvage.com", facebook: "https://www.facebook.com/cabaretsauvageparis19", x: "CabaretSauvage" },
  "cargo-de-nuit": { instagram: "cargodenuit", site: "https://www.cargodenuit.com", facebook: "https://www.facebook.com/cargo.de.nuit.arles/", x: "Cargo_de_Nuit" },
  "cavo-paradiso-paradise-beach": { instagram: "cavoparadisoclub", site: "https://www.cavoparadiso.gr", facebook: "https://www.facebook.com/cavoparadiso", tiktok: "cavoparadisoclub", youtube: "https://www.youtube.com/@CavoParadisoClub", spotify: "https://open.spotify.com/user/cavoparadiso" },
  "central-chapelle": { instagram: "central.chapelle", site: "https://centralchapelle.com", facebook: "https://www.facebook.com/central.chapelle/", tiktok: "central.chapelle", youtube: "https://www.youtube.com/@central.chapelle" },
  "club-guesthouse": { instagram: "club_guesthouse", site: "https://www.clubguesthouse.ro", facebook: "https://www.facebook.com/clubguesthouse/" },
  "cluj-arena": { site: "https://www.clujarena.ro", facebook: "https://www.facebook.com/clujarena/" },
  "cocorico-via-chieti-44": { instagram: "cocoricoriccione", site: "https://cocorico.it", facebook: "https://www.facebook.com/cocoricoofficial", tiktok: "cocoricoriccione" },
  "concorde-2": { instagram: "concorde2", site: "https://www.concorde2.co.uk", facebook: "https://www.facebook.com/Concorde2/", youtube: "https://www.youtube.com/@concorde2-brighton", x: "concorde_2" },
  "conne-island": { site: "https://www.conne-island.de", facebook: "https://www.facebook.com/conneisland" },
  "control-club": { instagram: "clubcontrol", site: "https://control-club.ro", facebook: "https://www.facebook.com/clubcontrol/", youtube: "https://www.youtube.com/c/ControlClub", soundcloud: "control-club" },
  "culture-box": { instagram: "cultureboxdk", site: "https://www.culture-box.com", facebook: "https://www.facebook.com/cultureboxdk/" },
  "d-club": { instagram: "dclublausanne", site: "https://dclub.ch", facebook: "https://www.facebook.com/Dclub.Lausanne", youtube: "https://www.youtube.com/user/DClubLausanneTV", soundcloud: "dclublausanne" },
  "depot-mayfield": { instagram: "depotmayfield", site: "https://depotmayfield.com", x: "depotmayfield" },
  "deutsche-bank-park": { instagram: "deutschebankpark", site: "https://www.deutschebankpark.de", facebook: "https://www.facebook.com/deutschebankpark/", youtube: "https://www.youtube.com/deutschebankpark", x: "DeuBaPark" },
  "dolni-vitkovice": { instagram: "dolnivitkovice", site: "https://www.dolnivitkovice.cz", facebook: "https://www.facebook.com/DolniVitkovice/", youtube: "https://www.youtube.com/channel/UCBSc-DIiUwJDif9oj3btAXA" },
  "doornroosje": { instagram: "doornroosjenl", site: "https://www.doornroosje.nl", facebook: "https://www.facebook.com/doornroosjenl/", youtube: "https://www.youtube.com/channel/UCMvmpoOGg0w6eVeLwXa4X5A" },
  "drumsheds": { instagram: "drumsheds", site: "https://www.drumshedslondon.com", tiktok: "drumsheds", youtube: "https://www.youtube.com/@Drumsheds" },
  "fira-montjuic": { instagram: "firadebarcelona", site: "https://www.firabarcelona.com", facebook: "https://es-es.facebook.com/FiradeBarcelona/", youtube: "https://www.youtube.com/channel/UCdmkZctSVGWuuEf5V3Yuhjw", x: "Fira_Barcelona" },
  "fira-montjuic-fira-gran-via": { instagram: "firadebarcelona", site: "https://www.firabarcelona.com", facebook: "https://es-es.facebook.com/FiradeBarcelona/", youtube: "https://www.youtube.com/channel/UCdmkZctSVGWuuEf5V3Yuhjw", x: "Fira_Barcelona" },
  "fold": { instagram: "fold.ldn", site: "https://fold.london", facebook: "https://www.facebook.com/fld.ldn", youtube: "https://www.youtube.com/foldlondon", soundcloud: "foldldn" },
  "friche-la-belle-de-mai": { instagram: "frichelabelledemai", site: "https://www.lafriche.org", facebook: "https://www.facebook.com/friche.labelledemai/", youtube: "https://www.youtube.com/channel/UC0bV_X2Zqncknv6SgVvLU0w" },
  "fuse": { instagram: "fusebrussels", site: "https://www.fuse.be", facebook: "https://www.facebook.com/fusebrussels/", tiktok: "fusebrussels", soundcloud: "fusebrussels" },
  "gianpula-fields": { instagram: "gianpulavillage_malta", site: "https://www.gianpulavillage.com", facebook: "https://www.facebook.com/gianpulavillagemalta", tiktok: "gianpulavillage_malta", x: "GianpulaVillage" },
  "hi-ibiza": { instagram: "hiibizaofficial", site: "https://hiibiza.com", facebook: "https://www.facebook.com/hiibizaofficial", tiktok: "hiibiza", youtube: "https://www.youtube.com/channel/UC072CZUvhdCg6Dsdvc18NkQ", soundcloud: "hiibizaofficial", x: "hiibizaofficial" },
  "ifema-madrid-avenida-del-partenon-5": { instagram: "ifema_madrid", site: "https://www.ifema.es", facebook: "https://www.facebook.com/IFEMA", tiktok: "ifemadrid", youtube: "https://www.youtube.com/channel/UCeEnAhiS3oUvbXvVwGDBJtw" },
  "index": { instagram: "indexdublin", site: "https://www.indexdublin.com", facebook: "https://www.facebook.com/IndexDublin", tiktok: "indexdublin" },
  "ing-arena-palais-12-heysel": { instagram: "ing.arena.brussels", site: "https://ing.arena.brussels", facebook: "https://www.facebook.com/ing.arena.brussels/", tiktok: "ing.arena.brussels" },
  "jaeger": { instagram: "jaegeroslo", site: "https://jaegeroslo.no", facebook: "https://www.facebook.com/jaegeroslo/" },
  "jasna-1": { instagram: "jasnajeden", site: "https://www.jasna1.com", facebook: "https://www.facebook.com/JasnaJeden/", soundcloud: "jasnajeden", bandcamp: "https://jasna1.bandcamp.com" },
  "kaiku": { instagram: "clubkaiku", site: "https://clubkaiku.fi", facebook: "https://www.facebook.com/clubkaiku" },
  "klokgebouw-strijp-s": { instagram: "klokgebouw", site: "https://klokgebouw.nl", facebook: "https://www.facebook.com/klokgebouw", x: "klokgebouw" },
  "klub-k4": { instagram: "klub_k4", site: "https://www.klub-k4.si", facebook: "https://www.facebook.com/klubk4" },
  "l-archipel": { instagram: "archipel_perpignan", site: "https://www.theatredelarchipel.org", facebook: "https://www.facebook.com/theatredelarchipel/" },
  "l-autre-canal": { instagram: "lautrecanalnancy", site: "https://lautrecanalnancy.fr", facebook: "https://www.facebook.com/LAutreCanalNancy/", tiktok: "lautrecanalnancy", youtube: "https://www.youtube.com/channel/UCkB9QDdmVmhFjuEov7SMflQ", spotify: "https://open.spotify.com/user/lautrecanal" },
  "l-echonova": { instagram: "lechonova", site: "https://www.lechonova.com", facebook: "https://www.facebook.com/lechonova/", youtube: "https://www.youtube.com/channel/UCpt5OhV-l9HFxS5ycq5uYJg" },
  "l-elysee-montmartre": { instagram: "elyseemontmartre", site: "https://www.elyseemontmartre.com", facebook: "https://www.facebook.com/elyseemontmartreofficiel/", x: "elyseemofficiel" },
  "l-olympia": { instagram: "olympiahall", site: "https://www.olympiahall.com", facebook: "https://www.facebook.com/olympiabrunocoquatrix/", x: "olympiahall" },
  "la-cartonnerie": { instagram: "cartoreims", site: "https://www.cartonnerie.fr", facebook: "https://www.facebook.com/cartonnerie.reims.fanpage/", tiktok: "lacartonneriedereims", youtube: "https://www.youtube.com/channel/UCui2Kz_G6IQmzlqw6kr8evw" },
  "la-cigale": { instagram: "lacigaleofficiel", site: "https://www.lacigale.fr", facebook: "https://www.facebook.com/lacigaleofficiel", tiktok: "lacigaleofficiel" },
  "la-condition-publique": { instagram: "laconditionpublique", site: "https://www.laconditionpublique.com", facebook: "https://www.facebook.com/LaConditionPublique/", youtube: "https://www.youtube.com/user/ConditionDeRoubaix", x: "laCPublique" },
  "la-cooperative-de-mai": { instagram: "lacooperativedemai", site: "https://www.lacoope.org", facebook: "https://www.facebook.com/ruesergegainsbourg", tiktok: "lacooperativedemai", youtube: "https://www.youtube.com/@lacooperativedemai4392" },
  "la-friche-la-belle-de-mai": { instagram: "frichelabelledemai", site: "https://www.lafriche.org", facebook: "https://www.facebook.com/friche.labelledemai/", youtube: "https://www.youtube.com/channel/UC0bV_X2Zqncknv6SgVvLU0w" },
  "la-gaite-lyrique": { instagram: "gaitelyrique", site: "https://gaite-lyrique.net", facebook: "https://www.facebook.com/gaitelyrique", tiktok: "gaitelyrique" },
  "la-graviere": { instagram: "lagraviereliveclub", site: "https://lagraviere.ch", facebook: "https://www.facebook.com/lagraviereliveclub/", ra: "https://ra.co/clubs/60218" },
  "la-laiterie": { instagram: "laiterie_artefact", site: "https://www.artefact.org", facebook: "https://www.facebook.com/lalaiterieofficielle", x: "laiterie" },
  "la-luciole": { instagram: "laluciole_alencon", site: "https://www.laluciole.org", facebook: "https://www.facebook.com/LaLucioleAlencon", tiktok: "laluciole_alencon" },
  "la-machine-du-moulin-rouge": { instagram: "lamachineparis", site: "https://www.lamachinedumoulinrouge.com", facebook: "https://www.facebook.com/LaMachineParis/" },
  "la-maroquinerie": { instagram: "lamaroquinerie", site: "https://www.lamaroquinerie.fr", facebook: "https://www.facebook.com/La-Maroquinerie-174356179294437/", x: "lamaroquinerie" },
  "la-nef": { instagram: "la_nef_angouleme", site: "https://www.lanef-musiques.com", facebook: "https://www.facebook.com/lanefangouleme/" },
  "la-rodia": { instagram: "larodia", site: "https://www.larodia.com", facebook: "https://www.facebook.com/larodiasmac", youtube: "https://www.youtube.com/channel/UCyiZdyk2iBAjMB1IP1QsYuA" },
  "lab11": { instagram: "lab11warehouse", site: "https://www.lab11.co.uk", facebook: "https://www.facebook.com/LAB11venue", x: "Lab11Warehouse" },
  "le-bikini": { instagram: "le_bikini_toulouse", site: "https://lebikini.com", facebook: "https://www.facebook.com/le.bikini.toulouse" },
  "le-cargo": { instagram: "cargocaen", site: "https://lecargo.fr", facebook: "https://www.facebook.com/LeCargo/", youtube: "https://www.youtube.com/channel/UCjjJMrKX0un3tfP6Yh7IbcA" },
  "le-ferrailleur": { instagram: "leferrailleur", site: "https://www.leferrailleur.fr", facebook: "https://www.facebook.com/le.ferrailleur.nantes", youtube: "https://www.youtube.com/channel/UCNJxmuWe0uBhIQ-eqyB6hRg", x: "LeFerrailleur" },
  "le-mem": { instagram: "lememrennes", site: "https://www.lemem.fr", facebook: "https://www.facebook.com/lememrennes/", tiktok: "lememrennes" },
  "lehmann-club": { instagram: "lehmannclubstuttgart", site: "https://lehmannclub.de", facebook: "https://www.facebook.com/LehmannClub" },
  "les-cuizines": { instagram: "lescuizines", site: "https://www.lescuizines.fr", facebook: "https://www.facebook.com/LesCuizines", youtube: "https://www.youtube.com/@lescuizines1933" },
  "les-halles-de-la-cartoucherie": { instagram: "leshallesdelacartoucherie", site: "https://halles-cartoucherie.fr", facebook: "https://www.facebook.com/hallescartoucherietoulouse" },
  "maassilo": { instagram: "officialmaassilo", site: "https://maassilo.com", facebook: "https://www.facebook.com/maassilo/", tiktok: "maassilo" },
  "menu-fabrikas-loftas": { instagram: "menufabrikas", site: "https://menufabrikas.lt", facebook: "https://www.facebook.com/loftasvilnius" },
  "mfcc-arena-ta-qali-attard": { instagram: "mfccmalta", site: "https://mfcc.com.mt", facebook: "https://www.facebook.com/MFCC.Malta", x: "mfccmalta" },
  "muziekgieterij": { instagram: "muziekgieterij.nl", site: "https://www.muziekgieterij.nl", facebook: "https://www.facebook.com/muziekgieterij", tiktok: "muziekgieterij", youtube: "https://www.youtube.com/@muziekgieterij_nl", x: "muziekgieterij" },
  "nordstern": { instagram: "nordsternbasel", site: "https://www.nordstern.com", facebook: "https://www.facebook.com/nordsternbasel", ra: "https://ra.co/clubs/8280" },
  "pacha-ibiza": { instagram: "pachaofficial", site: "https://pacha.com", tiktok: "pachaibizaofficial", youtube: "https://www.youtube.com/c/pacha", spotify: "https://open.spotify.com/user/pacha", x: "pacha" },
  "paloma": { instagram: "paloma_nimes", site: "https://www.paloma-nimes.fr", facebook: "https://www.facebook.com/paloma.nimes", youtube: "https://www.youtube.com/user/palomanimestube" },
  "poolen": { instagram: "poolencopenhagen", site: "https://poolen.dk", facebook: "https://www.facebook.com/poolencopenhagen", tiktok: "poolencopenhagen", ra: "https://ra.co/clubs/235165" },
  "postgarage": { instagram: "postgarage", site: "https://www.postgarage.at" },
  "ritter-butzke": { instagram: "ritterbutzke.berlin", site: "https://club.ritterbutzke.com", facebook: "https://www.facebook.com/ritterbutzkeberlin/", youtube: "https://www.youtube.com/@ritterbutzkestudio", ra: "https://ra.co/clubs/6950" },
  "rotterdam-ahoy": { instagram: "rotterdam.ahoy", site: "https://www.ahoy.nl", facebook: "https://www.facebook.com/ahoyrotterdam", tiktok: "rotterdam.ahoy", youtube: "https://www.youtube.com/channel/UCWvcxV4CYqQk8krJwFf2R0A" },
  "safaripark-beekse-bergen": { instagram: "beeksebergen", site: "https://www.beeksebergen.nl", facebook: "https://www.facebook.com/beeksebergen.nl/", tiktok: "beekse_bergen", youtube: "https://www.youtube.com/@Beekse-Bergen" },
  "salzburgring": { instagram: "salzburgring_official", site: "https://www.salzburgring.com", facebook: "https://www.facebook.com/salzburgring/", youtube: "https://www.youtube.com/@salzburgring_official" },
  "seepark-zulpich": { instagram: "seeparkzuelpich", site: "https://www.seepark-zuelpich.de", facebook: "https://www.facebook.com/seeparkzuelpich" },
  "sektor6d": { instagram: "sektor6d", site: "https://www.sektor6d.pl", facebook: "https://www.facebook.com/sektor6d" },
  "sew-la-manu": { instagram: "sewmorlaix", site: "https://www.sew-morlaix.com", facebook: "https://www.facebook.com/sewmorlaix" },
  "spodek": { instagram: "spodekkatowice", site: "https://www.spodekkatowice.pl", facebook: "https://www.facebook.com/halaspodek" },
  "stereolux": { instagram: "stereolux_scopitone", site: "https://stereolux.org", facebook: "https://www.facebook.com/stereolux.nantes", tiktok: "stereolux_scopitone", youtube: "https://www.youtube.com/user/stereoluxnantes" },
  "suvilahti": { instagram: "suvilahtihelsinki", site: "https://www.suvilahti.fi", facebook: "https://www.facebook.com/suvilahdenkulttuurikeskus" },
  "swg3-galvanizers": { instagram: "swg3glasgow", site: "https://swg3.tv", facebook: "https://www.facebook.com/SWG3glasgow/", youtube: "https://www.youtube.com/channel/UCqab9G6vkN7ZrTzxAj69jLA", x: "SWG3glasgow" },
  "swg3-galvanizers-yard": { instagram: "swg3glasgow", site: "https://swg3.tv", facebook: "https://www.facebook.com/SWG3glasgow/", youtube: "https://www.youtube.com/channel/UCqab9G6vkN7ZrTzxAj69jLA", x: "SWG3glasgow" },
  "swg3-warehouse": { instagram: "swg3glasgow", site: "https://swg3.tv", facebook: "https://www.facebook.com/SWG3glasgow/", youtube: "https://www.youtube.com/channel/UCqab9G6vkN7ZrTzxAj69jLA", x: "SWG3glasgow" },
  "tanzhaus-west": { instagram: "tanzhaus.west", site: "https://www.tanzhaus-west.de", facebook: "https://www.facebook.com/TanzhausWest" },
  "the-british-library": { instagram: "britishlibrary", site: "https://www.bl.uk", facebook: "https://www.facebook.com/britishlibrary/", tiktok: "britishlibrary", x: "britishlibrary" },
  "the-cause": { instagram: "thecauselondon", site: "https://supportthecause.co.uk", facebook: "https://www.facebook.com/thecauselondon/", soundcloud: "thecauselondon" },
  "the-prospect-building": { instagram: "theprospectbuilding", site: "https://www.theprospectbuilding.com", facebook: "https://www.facebook.com/theprospectbuilding", tiktok: "theprospectbuilding" },
  "the-warehouse": { instagram: "thewarehouseleeds", site: "https://www.theleedswarehouse.com", facebook: "https://www.facebook.com/TheWarehouseLeeds/", tiktok: "thewarehouseleeds" },
  "theater-amsterdam": { instagram: "theater.amsterdam", site: "https://www.theateramsterdam.nl", facebook: "https://www.facebook.com/theateramsterdam/" },
  "theatre-antique-d-orange": { instagram: "theatreantiquedorange_officiel", site: "https://theatre-antique.com", facebook: "https://www.facebook.com/theatreantiqueorangeofficiel", tiktok: "theatreantiquedorange", youtube: "https://www.youtube.com/channel/UCarmdrCkff6HJ48_eoe7uyA", x: "TheatreAntique" },
  "thuishaven": { instagram: "thuishaven", site: "https://www.thuishaven.nl", facebook: "https://www.facebook.com/thuishaven.am/", youtube: "https://www.youtube.com/channel/UC2KhiKAhm8wIkjt2chtIUTA" },
  "toffler": { instagram: "tofflerrotterdam", site: "https://toffler.nl", tiktok: "tofflerrotterdam" },
  "toplocentrala": { instagram: "toplocentrala", site: "https://toplocentrala.bg", facebook: "https://www.facebook.com/toplocentralata/" },
  "tresor-globus": { instagram: "tresorberlin", site: "https://www.tresorberlin.com", facebook: "https://www.facebook.com/tresorberlin", soundcloud: "tresorberlin" },
  "turbina": { instagram: "turbinabudapest", site: "https://turbinabudapest.hu", facebook: "https://www.facebook.com/turbinabudapest/" },
  "tvornica-kulture": { instagram: "tvornicakulture", site: "https://www.tvornicakulture.com", facebook: "https://www.facebook.com/tvornicakulture/" },
  "unvrs": { instagram: "unvrsibiza", site: "https://www.unvrs.com", facebook: "https://www.facebook.com/unvrsibiza", tiktok: "unvrsibiza", youtube: "https://www.youtube.com/@unvrsibiza", x: "unvrsibiza" },
  "vermo-arena": { instagram: "vermoareena", site: "https://vermo.fi", facebook: "https://www.facebook.com/vermoareena", x: "vermoareena" },
  "vooruit-viernulvier-sint-pietersnieuwstraat-23": { instagram: "viernulvier.gent", site: "https://viernulvier.gent", facebook: "https://www.facebook.com/VIERNULVIER.gent/", tiktok: "viernulvier.gent", youtube: "https://www.youtube.com/channel/UCdRYlqUQcIm6pbLgHHobQcQ" },
  "walibi-holland-evenemententerrein-biddinghuizen": { instagram: "walibihollandofficial", site: "https://www.walibi.nl", facebook: "https://www.facebook.com/walibiholland/", tiktok: "walibihollandofficial", youtube: "https://www.youtube.com/user/WalibiVideos", x: "WalibiHolland" },
  "warehouse": { instagram: "warehousenantes", site: "https://www.warehouse-nantes.fr", facebook: "https://www.facebook.com/warehousenantes", tiktok: "warehousenantes", youtube: "https://www.youtube.com/WarehouseNantes", soundcloud: "warehousenantes" },
  "wilde-renate": { instagram: "renate.berlin", site: "https://www.renate.cc", facebook: "https://www.facebook.com/renateclubberlin", ra: "https://ra.co/clubs/8556" },
  "world-headquarters": { instagram: "worldheadquartersclub", site: "https://www.welovewhq.com", facebook: "https://www.facebook.com/WorldHQ/", x: "welovewhq" },
  "zenith-paris-la-villette": { instagram: "zenithparis", site: "https://le-zenith.com", facebook: "https://www.facebook.com/ZenithParisLaVillette", tiktok: "zenithparis", youtube: "https://www.youtube.com/channel/UChEDmor6L6tdXfzRQmsAp8Q" },
};

export const ARTIST_SOCIALS: Record<string, Socials> = {
  "adam-beyer": { instagram: "realadambeyer", site: "https://www.adambeyer.se", facebook: "https://www.facebook.com/realadambeyer", soundcloud: "adambeyer", x: "realAdamBeyer" },
  "adaro": { instagram: "djadaro", site: "https://www.djadaro.com", facebook: "https://www.facebook.com/djadaro", youtube: "https://www.youtube.com/c/djadaro", soundcloud: "djadaro", spotify: "https://open.spotify.com/artist/05ndiewdJogtosuRWN8iwF", x: "djadaro" },
  "adriatique": { instagram: "adriatique", facebook: "https://facebook.com/adriatiqueofficial", youtube: "https://www.youtube.com/user/adriatiquemusic", soundcloud: "adriatique", spotify: "https://open.spotify.com/artist/02DWGcShQivFepRvGJ7xhB", x: "adriatiquemusic" },
  "alok": { instagram: "alok", facebook: "https://www.facebook.com/livealok/", soundcloud: "livealok" },
  "amelie-lens": { instagram: "amelie_lens", site: "https://www.amelielens.com", facebook: "https://www.facebook.com/amelielensmusic/", youtube: "https://www.youtube.com/channel/UCg2JFUP67ZdKzehy8TWMUmw", soundcloud: "amelielens", spotify: "https://open.spotify.com/artist/5Ho1vKl1Uz8bJlk4vbmvmf", x: "amelielens" },
  "angerfist": { instagram: "angerfist_official", site: "https://angerfist.nl", facebook: "https://www.facebook.com/angerfistmusic/", youtube: "https://www.youtube.com/user/TheAngerfistHardcore", soundcloud: "angerfistmusic", x: "DJ_ANGERFIST" },
  "anyma": { instagram: "anyma", site: "https://anyma.com", tiktok: "anyma", youtube: "https://www.youtube.com/@anyma_ofc", spotify: "https://open.spotify.com/artist/4iBwchw0U0GZv5RfVYSMxN", x: "anyma_eva" },
  "apparat": { instagram: "apparat3000", facebook: "https://www.facebook.com/apparat.official", youtube: "https://www.youtube.com/@apparat2548", soundcloud: "apparat", spotify: "https://open.spotify.com/artist/40Ojab0UtVQFjA76qXr8Ot", x: "apparatofficial" },
  "armin-van-buuren": { instagram: "arminvanbuuren", site: "https://www.arminvanbuuren.com", facebook: "https://www.facebook.com/arminvanbuuren", tiktok: "arminvanbuuren", youtube: "https://www.youtube.com/user/arminvanbuuren", spotify: "https://open.spotify.com/artist/0SfsnGyD8FpIN4U4WCkBZ5", x: "arminvanbuuren" },
  "artbat": { instagram: "artbatmusic", facebook: "https://www.facebook.com/artbatmusic/", tiktok: "artbat_ofc", soundcloud: "artbatmusic" },
  "ben-klock": { instagram: "ben_klock", facebook: "https://facebook.com/Ben-Klock-60928281674", soundcloud: "ben-klock", spotify: "https://open.spotify.com/artist/1vJHfCreWAS46V8RZ67ojo", x: "benklock" },
  "biianco": { instagram: "itsbiianco", site: "https://www.biianco.com", facebook: "https://www.facebook.com/itsbiianco", soundcloud: "biianco", bandcamp: "https://biianco.bandcamp.com", x: "biiancomusic", ra: "https://ra.co/dj/biianco" },
  "blawan": { facebook: "https://www.facebook.com/BlawanUK", x: "Blawan", ra: "https://ra.co/dj/blawan" },
  "blond-ish": { instagram: "blondish", site: "https://blondish.world", facebook: "https://www.facebook.com/blondish", soundcloud: "blondish", bandcamp: "https://blondish.bandcamp.com", x: "blond_ish", ra: "https://ra.co/dj/blondish" },
  "bob-sinclar": { site: "https://www.bobsinclar.com", facebook: "https://www.facebook.com/bobsinclar", soundcloud: "bob-sinclar-official", x: "bobsinclar", ra: "https://ra.co/dj/bobsinclar" },
  "brennan-heart": { site: "https://brennanheart.com", facebook: "https://www.facebook.com/djbrennanheart", soundcloud: "brennanheart", x: "djbrennanheart", ra: "https://ra.co/dj/brennanheart" },
  "camelphat": { instagram: "camelphatmusic", site: "https://www.camelphatmusic.com", facebook: "https://www.facebook.com/CamelPhat", tiktok: "camelphat.music", youtube: "https://www.youtube.com/channel/UCpm-eB6U_qtPYYQC7kjlNIA", soundcloud: "camelphat", spotify: "https://open.spotify.com/artist/240wlM8vDrf6S4zCyzGj2W", x: "CamelPhat" },
  "charlotte-de-witte": { instagram: "charlottedewittemusic", site: "https://charlottedewittemusic.com", facebook: "https://www.facebook.com/charlottedewittemusic", soundcloud: "charlottedewittemusic" },
  "chris-liebing": { instagram: "chris_liebing", site: "https://www.chrisliebing.com", facebook: "https://www.facebook.com/chrisliebingofficial", soundcloud: "chris-liebing", bandcamp: "https://chrisliebing.bandcamp.com", x: "chrisliebing", ra: "https://ra.co/dj/chrisliebing" },
  "coone": { instagram: "djcoone", site: "https://www.djcoone.com", facebook: "https://www.facebook.com/djcoone", youtube: "https://www.youtube.com/channel/UC7alhTRNkawfATqvctiSZjA", soundcloud: "coone", spotify: "https://open.spotify.com/artist/1Wt63OMKtv6v2ivHuQLm2C", x: "djcoone" },
  "cynthia-spiering": { site: "https://www.cynthiaspiering.com", soundcloud: "cynthia-spiering", ra: "https://ra.co/dj/cynthiaspiering" },
  "damian-lazarus": { site: "https://damianlazarus.com", facebook: "https://www.facebook.com/DamianLazarus", soundcloud: "damianlazarus", x: "damianlazarus", ra: "https://ra.co/dj/damianlazarus" },
  "dan-shake": { instagram: "danshake_", site: "https://danshake.com", soundcloud: "danshakemusic", bandcamp: "https://danshake.bandcamp.com", ra: "https://ra.co/dj/danshake" },
  "david-guetta": { instagram: "davidguetta", site: "https://davidguetta.com", facebook: "https://www.facebook.com/DavidGuetta", youtube: "https://www.youtube.com/channel/UC1l7wYrva1qCH-wgqcHaaRg", soundcloud: "davidguetta", spotify: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai", x: "davidguetta" },
  "deborah-de-luca": { instagram: "deborahdeluca", site: "https://deborahdeluca.it", facebook: "https://www.facebook.com/deborahdelucadj", youtube: "https://www.youtube.com/deborahdelucamusic", soundcloud: "deborahdeluca", spotify: "https://open.spotify.com/artist/144HzhpLjcR9k37w5Ico9B", x: "deborahdeluca" },
  "dom-dolla": { instagram: "domdolla", facebook: "https://facebook.com/domdollamusic", tiktok: "domdolla", soundcloud: "domdolla", spotify: "https://open.spotify.com/artist/205i7E8fNVfojowcQSfK9m" },
  "duke-dumont": { instagram: "dukedumont", site: "https://dukedumont.com", facebook: "https://www.facebook.com/dukedumont", youtube: "https://www.youtube.com/channel/UCQCtrgPAP6pjxLeVFTKJfhA", soundcloud: "dukedumont", spotify: "https://open.spotify.com/artist/61lyPtntblHJvA7FMMhi7E", x: "DukeDumont" },
  "dvs1": { instagram: "dvs1", site: "https://hushsound.com", facebook: "https://www.facebook.com/dvs1.hush", youtube: "https://youtube.com/dvs1", soundcloud: "dvs1", bandcamp: "https://dvs1hush.bandcamp.com", ra: "https://ra.co/dj/dvs1" },
  "enrico-sangiuliano": { instagram: "enricosangiuliano", site: "https://enricosangiuliano.com", facebook: "https://www.facebook.com/enricosangiuliano", youtube: "https://www.youtube.com/channel/UC_z-XE-y8Dzzz2VlMBr3DOQ", soundcloud: "enricosangiuliano", spotify: "https://open.spotify.com/artist/1u7DsNFbakULvxnDGtMm90", x: "esangiuliano" },
  "eric-prydz": { instagram: "ericprydz", site: "https://www.ericprydz.com", facebook: "https://www.facebook.com/EricPrydzOfficial/", tiktok: "ericprydz", youtube: "https://www.youtube.com/channel/UCOjTxt7xBAjh1NraToYYlog", soundcloud: "eric-prydz", spotify: "https://open.spotify.com/artist/5sm0jQ1mq0dusiLtDJ2b4R", x: "ericprydz" },
  "erol-alkan": { instagram: "erolalkan", site: "https://www.erolalkan.co.uk", facebook: "https://www.facebook.com/erolalkan", soundcloud: "erolalkan", spotify: "https://open.spotify.com/artist/3jQ8hpdQo3TCEnb5gmOtH5", x: "erolalkan" },
  "fatboy-slim": { instagram: "officialfatboyslim", site: "https://www.fatboyslim.net", facebook: "https://www.facebook.com/fatboyslim", youtube: "https://www.youtube.com/officialfatboyslim", soundcloud: "fatboyslim", spotify: "https://open.spotify.com/artist/4Y7tXHSEejGu1vQ9bwDdXW", x: "FatboySlim" },
  "fatima-hajji": { instagram: "fatimahajji", facebook: "https://www.facebook.com/fatimahajjidj", youtube: "https://www.youtube.com/@djfatimahajji", soundcloud: "fatimahajji", spotify: "https://open.spotify.com/artist/6jZSXmTCxZhFfYELtp78Ci", x: "fatimahajji" },
  "floating-points": { instagram: "floatingpoints", site: "https://www.floatingpoints.co.uk", facebook: "https://www.facebook.com/floatingpoints", youtube: "https://www.youtube.com/channel/UC5NbPNPbdLwAPPwWTJw0EbQ", soundcloud: "floatingpoints", spotify: "https://open.spotify.com/artist/2AR42Ur9PcchQDtEdwkv4L", bandcamp: "https://floatingpoints.bandcamp.com", x: "floatingpoints" },
  "four-tet": { instagram: "fourtetkieran", site: "https://www.fourtet.net", youtube: "https://www.youtube.com/channel/UC3sZYInu3YYkyIXBif83ZCg", spotify: "https://open.spotify.com/artist/7Eu1txygG6nJttLHbZdQOh", bandcamp: "https://fourtet.bandcamp.com", x: "fourtet" },
  "hardwell": { instagram: "hardwell", site: "https://djhardwell.com", facebook: "https://www.facebook.com/djhardwell", youtube: "https://www.youtube.com/channel/UCPT5Q93YbgJ_7du1gV7UHQQ", soundcloud: "hardwell", spotify: "https://open.spotify.com/artist/6BrvowZBreEkXzJQMpL174", x: "hardwell" },
  "helena-hauff": { site: "https://helena-hauff.com", soundcloud: "helena-hauff", spotify: "https://open.spotify.com/artist/1JcefSOP7bcWEluL0iEIaN", bandcamp: "https://helenahauff.bandcamp.com" },
  "honey-dijon": { instagram: "honeydijon", site: "https://honeyfuckingdijon.com", facebook: "https://www.facebook.com/HoneyDijon", tiktok: "djhoneydijon", youtube: "https://www.youtube.com/channel/UCoZ8tyMeD5aTKqE4F4yb2OA", spotify: "https://open.spotify.com/artist/0XfQBWgzisaS9ltDV9bXAS" },
  "i-hate-models": { instagram: "ihatemodels1", soundcloud: "ihatemodels" },
  "jeff-mills": { instagram: "jeff_mills_official", site: "https://www.axisrecords.com", x: "DJJeffMills" },
  "john-summit": { instagram: "johnsummit", site: "https://www.johnsummitmusic.com", facebook: "https://www.facebook.com/itsjohnsummit", tiktok: "johnsummit", youtube: "https://www.youtube.com/johnsummit", soundcloud: "johnsummit", spotify: "https://open.spotify.com/artist/7kNqXtgeIwFtelmRjWv205", x: "johnsummit" },
  "joris-delacroix": { instagram: "joris_delacroix", site: "https://jorisdelacroix.fr", facebook: "https://www.facebook.com/jorisdelacroix/", youtube: "https://www.youtube.com/channel/UC_AlTNYYHf8v4zMgUZoSaMA", soundcloud: "jorisdelacroix", spotify: "https://open.spotify.com/artist/3HRRzIZNQFus3xlUx2xKy1", x: "jorisdelacroix" },
  "joris-voorn": { instagram: "jorisvoorn", site: "https://jorisvoorn.com", facebook: "https://www.facebook.com/jorisvoorndj", tiktok: "jorisvoorn", youtube: "https://www.youtube.com/channel/UCXn-jxml9VfSPdnuPfjwRtg", soundcloud: "joris-voorn", spotify: "https://open.spotify.com/artist/4jGpKAmwvU263l0tUh4xKU", x: "jorisvoorn" },
  "joseph-capriati": { instagram: "josephcapriati", site: "https://www.josephcapriati.com", facebook: "https://www.facebook.com/JosephCapriatiOfficial", soundcloud: "joseph-capriati", x: "josephcapriati" },
  "kobosil": { soundcloud: "kobosil" },
  "konstantin-sibold": { instagram: "konstantinsibold", facebook: "https://www.facebook.com/KonstantinSiboldMusic/", tiktok: "konstantinsibold", youtube: "https://www.youtube.com/@konstantinsibold", soundcloud: "konstantinsibold" },
  "len-faki": { instagram: "len_faki", soundcloud: "lenfaki", bandcamp: "https://lenfaki.bandcamp.com" },
  "maceo-plex": { instagram: "maceoplex", site: "https://maceoplex.net", facebook: "https://www.facebook.com/MaceoPlex/", youtube: "https://www.youtube.com/channel/UC9SIHJ9kGwd40SVJ3Gmj2Dg", soundcloud: "maceoplex", spotify: "https://open.spotify.com/artist/3TXQ1ddouwQAI78hV4hXDj", bandcamp: "https://maceoplex.bandcamp.com", x: "MaceoPlex" },
  "mala": { instagram: "maladmz", site: "https://www.maladmz.com", facebook: "https://www.facebook.com/malamystikz", tiktok: "maladmz", youtube: "https://www.youtube.com/user/maladmz", soundcloud: "maladmz", spotify: "https://open.spotify.com/artist/0QTEYauMG3DrAVPXCYMseu", x: "mala_dmz" },
  "marcel-dettmann": { instagram: "marceldettmann", facebook: "https://www.facebook.com/marceldettmannofficial", youtube: "https://www.youtube.com/channel/UCXgX3zbGMvZTu5JTkTsO6cg", soundcloud: "marceldettmann", spotify: "https://open.spotify.com/artist/1sxHp39RqBEE01pgVqsdyP" },
  "martin-garrix": { instagram: "martingarrix", site: "https://martingarrix.com", facebook: "https://www.facebook.com/martin.garrix", tiktok: "martingarrix", youtube: "https://www.youtube.com/@MartinGarrix", soundcloud: "martingarrix", spotify: "https://open.spotify.com/artist/60d24wfXkVzDSfLS6hyCjZ", x: "martingarrix" },
  "mathame": { instagram: "mathame_", site: "https://www.mathamemusic.com", facebook: "https://www.facebook.com/MathameMusic/", youtube: "https://www.youtube.com/channel/UCJ7m-W_30NkM-TnxsTPdgkw", x: "mathame_ofc" },
  "miss-k8": { instagram: "missk8", site: "https://www.missk8.com", facebook: "https://www.facebook.com/MissK8music", tiktok: "djmissk8", youtube: "https://www.youtube.com/channel/UC9QwEZj-KBlYzW3hbsgwS-Q", soundcloud: "missk8", spotify: "https://open.spotify.com/artist/776uRsooWrGiVZkVWtvfgO", x: "MissK8music" },
  "modeselektor": { instagram: "modeselektor_berlin", site: "https://www.modeselektor.com", facebook: "https://www.facebook.com/MDSLKTR", soundcloud: "modeselektor", spotify: "https://open.spotify.com/artist/2jYMYP2SVifgmzNRQJx3SJ", bandcamp: "https://modeselektor.bandcamp.com", x: "modeselektor" },
  "netsky": { instagram: "netskyofficial", site: "https://www.netskymusic.com", youtube: "https://www.youtube.com/@Netsky", soundcloud: "netsky" },
  "nina-kraviz": { instagram: "ninakraviz", site: "https://triprecordings.com", facebook: "https://www.facebook.com/NinaKravizMusic/", soundcloud: "nina-kraviz", spotify: "https://open.spotify.com/artist/1oZmFNkGAT93yD1xX4vTRE", x: "NinaKraviz" },
  "nto": { instagram: "ntomusic", facebook: "https://www.facebook.com/nto.music", soundcloud: "ntonto", spotify: "https://open.spotify.com/artist/7ry8L53T4oJtSIogGYuioq" },
  "oklou": { instagram: "oklou_", site: "https://oklou.com", facebook: "https://www.facebook.com/Oklou93", tiktok: "oklou__", youtube: "https://www.youtube.com/user/loumar86", soundcloud: "oklou93", spotify: "https://open.spotify.com/artist/6fFcUOFcbjeIuEomuUthkw", bandcamp: "https://oklou.bandcamp.com", x: "oklou_" },
  "oscar-mulero": { instagram: "oscarmulerooficial", site: "https://www.oscarmulero.com", facebook: "https://www.facebook.com/dj.oscarmulero", youtube: "https://www.youtube.com/user/OfficialOscarMulero", soundcloud: "oscarmulero", x: "oscarmulero", ra: "https://ra.co/dj/oscarmulero" },
  "overmono": { instagram: "overmono", site: "https://www.overmono.com", bandcamp: "https://overmono.bandcamp.com" },
  "palms-trax": { instagram: "palmstrax", soundcloud: "palmstrax", bandcamp: "https://palmstraxdekmantel.bandcamp.com", ra: "https://ra.co/dj/palmstrax" },
  "pan-pot": { instagram: "panpotofficial", site: "https://www.pan-pot.net", soundcloud: "pan-pot", spotify: "https://open.spotify.com/artist/6OQOvP7RAdmAKVXXQqD0Se" },
  "paul-elstak": { instagram: "djpaulelstak", site: "https://www.paulelstak.nl", facebook: "https://www.facebook.com/officialpaulelstak/", youtube: "https://www.youtube.com/channel/UCu8uKKPkFacSxiOyj_-D1aA", soundcloud: "djpaulelstak", spotify: "https://open.spotify.com/artist/123hDJRbi4KtCdBaaKNHW6" },
  "paul-kalkbrenner": { instagram: "iampaulkalkbrenner", site: "https://paulkalkbrenner.net", facebook: "https://www.facebook.com/paulkalkbrenner", tiktok: "paulkalkbrennerofficial", youtube: "https://www.youtube.com/user/paulkalkbrenner", soundcloud: "paulkalkbrenner", spotify: "https://open.spotify.com/artist/0rasA5Z5h1ITtHelCpfu9R", x: "paulkalkbrenner" },
  "peggy-gou": { instagram: "peggygou_", site: "https://peggygou.com", facebook: "https://www.facebook.com/peggygoupeggygou", youtube: "https://www.youtube.com/channel/UCWd5yMFDEuSCWzTM4xuA1fg", soundcloud: "peggygou", spotify: "https://open.spotify.com/artist/2mLA48B366zkELXYx7hcDN", bandcamp: "https://peggygou.bandcamp.com" },
  "planetary-assault-systems": { instagram: "lukeslater_planetary", site: "https://www.lukeslater.com/planetary-assault-systems", soundcloud: "luke-slater", bandcamp: "https://planetaryassaultsystemsplanet.bandcamp.com" },
  "quelza": { instagram: "quelza_m", facebook: "https://www.facebook.com/quelzamusic/", soundcloud: "quelza", ra: "https://ra.co/dj/quelza" },
  "r3hab": { instagram: "r3hab", site: "https://www.r3hab.com", facebook: "https://www.facebook.com/r3hab", tiktok: "r3hab", youtube: "https://www.youtube.com/r3hab", soundcloud: "r3hab", spotify: "https://open.spotify.com/artist/6cEuCEZu7PAE9ZSzLLc2oQ", x: "R3HAB" },
  "radical-redemption": { instagram: "radicalredemption", site: "https://www.radicalredemption.nl", facebook: "https://www.facebook.com/RadicalRedemptionDJ", youtube: "https://www.youtube.com/user/RadicalRedemption", soundcloud: "radical-redemption", x: "rdclredemption" },
  "rampa": { instagram: "rampa_keinemusik", facebook: "https://www.facebook.com/keinemusik.rampa", tiktok: "rampa_keinemusik", soundcloud: "rampa", spotify: "https://open.spotify.com/artist/08jywfUS0hp8XYlYs0cvz8", ra: "https://ra.co/dj/rampa" },
  "raresh": { facebook: "https://www.facebook.com/RareshArpiar/", soundcloud: "rareshofficial" },
  "rdhad": { instagram: "rodhad_dystopian", site: "https://www.dystopian.de", soundcloud: "rodhad" },
  "richie-hawtin": { instagram: "richiehawtin", facebook: "https://www.facebook.com/richiehawtin", tiktok: "richiehawtin", youtube: "https://www.youtube.com/@richiehawtin" },
  "sammy-virji": { instagram: "sammyvirji", facebook: "https://www.facebook.com/sammyvirjiuk", soundcloud: "sammyvirji", bandcamp: "https://sammyvirji.bandcamp.com", x: "sammy_virji" },
  "sara-landry": { instagram: "saralandrydj", site: "https://saralandry.com", facebook: "https://www.facebook.com/sara-landry-dj", soundcloud: "sara-landry-dj" },
  "scooter": { instagram: "scooterofficial", site: "https://scootertechno.com", facebook: "https://www.facebook.com/scooterofficial", youtube: "https://www.youtube.com/channel/UCZuJMSiCDWGaYmKAvt990ng", spotify: "https://open.spotify.com/artist/0HlxL5hisLf59ETEPM3cUA", x: "scooter_techno" },
  "seth-troxler": { instagram: "stroxler", site: "https://sethtroxler.com", facebook: "https://www.facebook.com/sethtroxlerofficial/", tiktok: "sethtroxler", youtube: "https://www.youtube.com/channel/UCLomjWeo7aBxvrTKCn9zrTw", soundcloud: "sethtroxler", spotify: "https://open.spotify.com/artist/3JkLFcTej6tdwZoQT6Nx4B" },
  "skrillex": { instagram: "skrillex", site: "https://www.skrillex.com", facebook: "https://www.facebook.com/skrillex", tiktok: "skrillex", youtube: "https://www.youtube.com/channel/UC_TVqp_SyG6j5hG-xVRy95A", soundcloud: "skrillex", spotify: "https://open.spotify.com/artist/5he5w2lnU9x7JFhnwcekXX", x: "Skrillex" },
  "solomun": { instagram: "solomun", site: "https://solomun.org", facebook: "https://www.facebook.com/SolomunMusic/", youtube: "https://www.youtube.com/channel/UCN8v8tNOCmaZaN-t4ynDdEA", spotify: "https://open.spotify.com/artist/5wJK4kQAkVGjqM9x46KQOC", x: "solomunmusic" },
  "space-92": { instagram: "space92__official", soundcloud: "space92", spotify: "https://open.spotify.com/artist/6TVdVlY6irsNPkMHT2HkfD" },
  "stephan-bodzin": { instagram: "stephanbodzin", site: "https://www.stephanbodzin.de", facebook: "https://www.facebook.com/StephanBodzinOfficial/", soundcloud: "stephanbodzinofficial", x: "stephanbodzin" },
  "teho": { instagram: "teho_live", site: "https://www.labo-t.fr/teho", bandcamp: "https://teho.bandcamp.com" },
  "the-avalanches": { instagram: "theavalanches", site: "https://www.theavalanches.com", facebook: "https://www.facebook.com/theavalanches", tiktok: "theavalanches", youtube: "https://www.youtube.com/user/avalanchesofficial", soundcloud: "theavalanches", spotify: "https://open.spotify.com/artist/3C8RpaI3Go0yFF9whvKoED", x: "theavalanches" },
  "the-chainsmokers": { instagram: "thechainsmokers", site: "https://www.thechainsmokers.com", facebook: "https://www.facebook.com/thechainsmokers", tiktok: "thechainsmokers", soundcloud: "thechainsmokers", x: "thechainsmokers" },
  "tiesto": { instagram: "tiesto", site: "https://www.tiesto.com", facebook: "https://www.facebook.com/tiesto", youtube: "https://www.youtube.com/channel/UCPk3RMMXAfLhMJPFpQhye9g", soundcloud: "tiesto", spotify: "https://open.spotify.com/artist/2o5jDhtHVPhrJdv3cEQ99Z", x: "tiesto" },
  "timmy-trumpet": { instagram: "timmytrumpet", site: "https://www.timmytrumpet.com", facebook: "https://www.facebook.com/timmytrumpet", tiktok: "timmytrumpet", youtube: "https://www.youtube.com/channel/UCd61k-5ykv_4RIbQg-Mpvrg", soundcloud: "timmytrumpet", spotify: "https://open.spotify.com/artist/0CbeG1224FS58EUx4tPevZ", x: "TimmyTrumpet" },
  "trym": { instagram: "trym", youtube: "https://www.youtube.com/channel/UCnYB3OPrgYCRY3VlbfS6X4g", soundcloud: "trymofficial", spotify: "https://open.spotify.com/artist/5Nd385K2g3s0828W8Ab70z" },
  "underworld": { instagram: "underworld", site: "https://www.underworldlive.com", facebook: "https://www.facebook.com/Underworld/", youtube: "https://www.youtube.com/UnderworldLiveTV", bandcamp: "https://underworld.bandcamp.com", x: "underworldlive" },
  "victor-ruiz": { instagram: "victorruizdj", site: "https://www.victor-ruiz.com", facebook: "https://www.facebook.com/victorruizofficial", tiktok: "victorruizdj", soundcloud: "victorruiz", spotify: "https://open.spotify.com/artist/0xgdNNa5mIbnJKp8AG8S4z", x: "victorruizdj" },
  "vortek-s": { instagram: "vorteks_official", facebook: "https://www.facebook.com/vortekss/", soundcloud: "vortek-s" },
};
/* SOCIALS:end */

export const artistSocials = (slug: string): Socials | undefined => ARTIST_SOCIALS[slug];
export const venueSocials = (slug: string): Socials | undefined => VENUE_SOCIALS[slug];

/**
 * Les réseaux à afficher sur une fiche événement, et à qui ils appartiennent.
 *
 * Un festival a sa propre marque ; une soirée de club n'en a souvent pas — c'est le club
 * qui publie l'affiche et le line-up. On retombe donc sur le compte de la salle, mais on
 * renvoie `from` pour que la fiche le dise (« Instagram du lieu »), au lieu de laisser
 * croire que l'événement a un compte.
 *
 * `allowVenue` est à `false` pour les programmes-ombrelles (ADE & co.) : leur `venue` est
 * un libellé, pas une adresse, et n'a donc pas de compte à lui.
 */
export function eventSocials(
  e: RaveEvent,
  allowVenue = true,
): { s: Socials; from: "event" | "venue"; name: string } | undefined {
  const own = EVENT_SOCIALS[slugify(e.title)];
  if (own) return { s: own, from: "event", name: e.title };
  if (!allowVenue) return undefined;
  const v = VENUE_SOCIALS[slugify(e.venue)];
  return v ? { s: v, from: "venue", name: e.venue } : undefined;
}
