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

/** Ce qu'on affiche dans une pilule : le handle quand il y en a un, le domaine sinon. */
export function socialHandle(net: Network, value: string): string {
  if (!/^https?:\/\//i.test(value)) return net === "site" ? value : `@${value.replace(/^@/, "")}`;
  try {
    const u = new URL(value);
    const seg = u.pathname.split("/").filter(Boolean);
    if (net === "site" || net === "ra" || seg.length === 0) return u.hostname.replace(/^www\./, "");
    return `@${seg[seg.length - 1].replace(/^@/, "")}`;
  } catch {
    return value;
  }
}

/** Les liens d'une fiche, dans l'ordre de `NETWORKS`, Instagram en tête. */
export function socialLinks(s: Socials): { net: Network; url: string; handle: string }[] {
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
export const embedUrl = (code: string): string =>
  `https://www.instagram.com/p/${code}/embed/captioned/`;

export const postUrl = (code: string): string => `https://www.instagram.com/p/${code}/`;

/* Les maps sont générées — voir .research/socials/ingest.py. */
/* SOCIALS:start */
export const EVENT_SOCIALS: Record<string, Socials> = {
  "airbeat-one": { instagram: "airbeatone", site: "https://www.airbeat-one.de", facebook: "https://www.facebook.com/airbeatone/", tiktok: "airbeatonefestival", youtube: "https://www.youtube.com/user/airbeatone00" },
  "all-together-now": { instagram: "alltogethernow.ie", site: "https://alltogethernow.ie", facebook: "https://www.facebook.com/ATNFestival/", youtube: "https://www.youtube.com/channel/UC_04-lD4FqzVvzSKijR9D3g" },
  "amsterdam-dance-event-ade": { instagram: "amsterdamdanceevent", site: "https://www.amsterdam-dance-event.nl", facebook: "https://www.facebook.com/amsterdamdanceevent", x: "ADE_NL" },
  "astropolis": { instagram: "astropolis", site: "https://www.astropolis.org", facebook: "https://www.facebook.com/festival.astropolis", tiktok: "astropolisfestival" },
  "ava-london": { instagram: "avafestival", site: "https://avafestival.com", facebook: "https://www.facebook.com/avafestival/", tiktok: "avafestival", youtube: "https://www.youtube.com/c/AVAFestival", soundcloud: "avafestival", x: "AVAFestival_" },
  "barrakud-festival": { instagram: "barrakud_official", site: "https://www.barrakud.com", youtube: "https://www.youtube.com/@BARRAKUDFestival" },
  "beatpatrol-festival": { instagram: "beatpatrol.festival", site: "https://www.beatpatrol.at", facebook: "https://www.facebook.com/beatpatrol.at", tiktok: "beatpatrol" },
  "beats-for-love": { instagram: "beats.for.love.festival", site: "https://www.b4l.cz", facebook: "https://www.facebook.com/beats.for.love", tiktok: "beats.for.love", youtube: "https://www.youtube.com/user/BEATSFORLOVEFESTIVAL" },
  "c2c-festival": { instagram: "clubtoclub", site: "https://clubtoclub.it", facebook: "https://www.facebook.com/clubtoclub", tiktok: "clubtoclub" },
  "copenhagen-distortion": { instagram: "cphdistortion", site: "https://www.cphdistortion.dk", facebook: "https://www.facebook.com/cphdistortion", tiktok: "cphdistortion" },
  "creamfields": { instagram: "creamfieldsofficial", site: "https://www.creamfields.com", facebook: "https://www.facebook.com/OfficialCreamfields", tiktok: "creamfieldsofficial", youtube: "https://www.youtube.com/channel/UC7RZ3YtxzlR61_3kfjdolAA" },
  "ctm-festival": { instagram: "ctmfestival", site: "https://www.ctm-festival.de", facebook: "https://www.facebook.com/CTMFestival", youtube: "https://www.youtube.com/user/DISKCTM", soundcloud: "ctm-festival", x: "CTMFestival" },
  "decibel-open-air": { instagram: "decibelopenair", site: "https://www.decibelopenair.com", facebook: "https://www.facebook.com/decibelopenair/", youtube: "https://youtube.com/decibelopenair" },
  "dekmantel-festival": { instagram: "dkmntl", site: "https://www.dekmantelfestival.com", soundcloud: "dkmntl" },
  "dgtl-amsterdam": { instagram: "dgtlfestival", site: "https://www.dgtl.nl", facebook: "https://www.facebook.com/dgtlfestival", tiktok: "dgtlfestival", youtube: "https://www.youtube.com/channel/UCXAuu4lli9oBgKZVGapNvBw", soundcloud: "dgtl-festival" },
  "dimensions-festival": { instagram: "dimensionsfestival", site: "https://www.dimensionsfestival.com", soundcloud: "dimensionsfestival" },
  "dockyard-festival-ade": { instagram: "dockyardfestival", site: "https://www.dockyardfestival.com", facebook: "https://www.facebook.com/DockyardFestival", tiktok: "dockyardfestival" },
  "dour-festival": { instagram: "dourfestival", site: "https://www.dourfestival.eu", facebook: "https://www.facebook.com/dourfestival", tiktok: "dourfestival", youtube: "https://www.youtube.com/@dourfestival", spotify: "https://open.spotify.com/user/dourfestival" },
  "dream-nation-festival": { instagram: "dreamnation_festival", site: "https://www.dreamnation.fr", facebook: "https://www.facebook.com/dreamnationfestival", tiktok: "dreamnation_fest", youtube: "https://www.youtube.com/@dreamnationfestival", x: "DreamNationFest" },
  "dreambeach-costa-del-sol": { instagram: "dreambeachfest", site: "https://www.dreambeach.es", facebook: "https://www.facebook.com/DreambeachFest", youtube: "https://www.youtube.com/channel/UCirsb9ukXh4LWQwBllSJe3Q" },
  "electric-castle": { instagram: "electriccastle", site: "https://www.electriccastle.ro", facebook: "https://www.facebook.com/ElectricCastle", tiktok: "electriccastle", youtube: "https://www.youtube.com/user/ElectricCastleCluj", x: "Electric_Castle" },
  "electric-love-festival": { instagram: "electricloveaut", site: "https://www.electriclove.at", facebook: "https://www.facebook.com/electriclovefestival", tiktok: "electriclovefestival", youtube: "https://www.youtube.com/c/electriclovetv", x: "ElectricLoveAut" },
  "extrema-outdoor-belgium": { instagram: "extrema.be", site: "https://www.extrema.be", facebook: "https://www.facebook.com/ExtremaOutdoor.Belgium/", tiktok: "extrema.be", youtube: "https://www.youtube.com/channel/UCb98bAT19io2A8H4n_omFHw", soundcloud: "extrema-outdoor-belgium" },
  "family-piknik": { instagram: "familypiknikofc", site: "https://www.familypiknikfestival.com", facebook: "https://www.facebook.com/familypiknik" },
  "fcknye-festival": { instagram: "fcknyefestival", site: "https://www.fcknyefestival.com", facebook: "https://www.facebook.com/FcknyeFestival/", youtube: "https://www.youtube.com/@FCKNYEFestival", x: "fcknyefestival" },
  "festival-le-bon-air": { instagram: "bonairfestival", site: "https://www.le-bon-air.com", facebook: "https://www.facebook.com/bonairfestival" },
  "festival-maintenant": { instagram: "maintenant_festival", site: "https://www.maintenant-festival.fr", facebook: "https://www.facebook.com/maintenant.festival/" },
  "field-day": { instagram: "fielddayfestivals", site: "https://www.fielddayfestivals.com", facebook: "https://www.facebook.com/fielddaylondon", tiktok: "fielddaylondon", youtube: "https://www.youtube.com/@fielddaylondon" },
  "field-maneuvers": { site: "https://fieldmaneuvers.com", soundcloud: "fieldmaneuvers" },
  "flow-festival": { instagram: "flowfestivalhelsinki", site: "https://www.flowfestival.com", facebook: "https://www.facebook.com/FlowFestival", tiktok: "flowfestival", youtube: "https://www.youtube.com/user/flowfestival" },
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
  "insane-festival": { instagram: "insanefestival", site: "https://www.insanefestival.com", facebook: "https://www.facebook.com/insanefestival", tiktok: "insanefestival", youtube: "https://www.youtube.com/user/InsaneFestival", x: "insanefestival" },
  "insomnia-festival": { instagram: "insomniatromso", site: "https://insomniafestival.no", facebook: "https://www.facebook.com/insomniatromso" },
  "intents-festival": { instagram: "intentsfestival", site: "https://www.intentsfestival.nl", facebook: "https://www.facebook.com/intentsfestival", youtube: "https://youtube.com/intentsfestival" },
  "into-the-madness": { instagram: "intothemadnessfestival", site: "https://www.intothemadness.de", facebook: "https://www.facebook.com/intothemadnessfestival" },
  "junction-2": { instagram: "junction_2", site: "https://junction2.london", facebook: "https://www.facebook.com/Junction2London", tiktok: "junction_2" },
  "kappa-futurfestival": { instagram: "futur_festival", site: "https://www.kappafuturfestival.it", facebook: "https://www.facebook.com/FuturFestival", tiktok: "futurfestival", youtube: "https://www.youtube.com/@futur_festival", spotify: "https://open.spotify.com/user/futurfestival", x: "futurfestival" },
  "les-nuits-secretes": { instagram: "lesnuitssecretes", site: "https://www.lesnuitssecretes.com", facebook: "https://www.facebook.com/festivalnuitssecretes/", tiktok: "lesnuitssecretes", youtube: "https://www.youtube.com/channel/UCCdWt16fjpE6MNCMmBBW1cw" },
  "les-plages-electroniques": { instagram: "plageselectro", site: "https://www.plages-electroniques.com", facebook: "https://www.facebook.com/lesplages", tiktok: "les_plages_electroniques", youtube: "https://www.youtube.com/@LesPlagesElectroniquesOfficiel", x: "plageselectro" },
  "les-rencontres-trans-musicales": { instagram: "transmusicales", site: "https://www.lestrans.com", facebook: "https://www.facebook.com/transmusicales", tiktok: "les_trans", youtube: "https://youtube.com/transmusicales" },
  "let-it-roll": { instagram: "letitrollfestival", site: "https://letitroll.eu", facebook: "https://www.facebook.com/letitrollcz", tiktok: "letitrollfestival", youtube: "https://www.youtube.com/channel/UCEJCxoQ6Ck-BQfmoHbdXcEg", x: "letitroll_fest" },
  "lethargy-festival": { instagram: "lethargyfestival", site: "https://www.lethargy.ch", facebook: "https://www.facebook.com/LethargyFestival/", soundcloud: "lethargyfestival" },
  "lost-village": { instagram: "lostvillagefestival", site: "https://lostvillagefestival.com" },
  "lovefest": { instagram: "lovefest.rs", site: "https://www.lovefest.rs", facebook: "https://www.facebook.com/lovefestVB/", tiktok: "lovefest.rs", youtube: "https://www.youtube.com/@LovefestSerbia", x: "lovefestrs" },
  "loveland-festival": { instagram: "lovelandnl", site: "https://www.loveland.nl", facebook: "https://www.facebook.com/lovelandevents", tiktok: "lovelandevents", youtube: "https://www.youtube.com/user/lovelandfestival", spotify: "https://open.spotify.com/user/lovelandfestival" },
  "malmofestivalen": { instagram: "malmofestivalen", site: "https://www.malmofestivalen.se", facebook: "https://www.facebook.com/malmofestivalen/", tiktok: "malmofestivalen_official", youtube: "https://www.youtube.com/@malmofestivalen2011" },
  "marvellous-island": { instagram: "marvellousisland", site: "https://www.marvellous-island.fr", facebook: "https://www.facebook.com/marvellous.island.festival", youtube: "https://www.youtube.com/channel/UC8YrSeiFS_p3BO-Iuhq3lOg", soundcloud: "marvellous-island-00" },
  "marvellous-island-festival": { instagram: "marvellousisland", site: "https://marvellous-island.fr", facebook: "https://www.facebook.com/marvellous.island.festival", youtube: "https://www.youtube.com/channel/UC8YrSeiFS_p3BO-Iuhq3lOg", soundcloud: "marvellous-island-00" },
  "masters-of-hardcore-the-masterplan": { instagram: "mastersofhardcore", site: "https://www.mastersofhardcore.com", facebook: "https://www.facebook.com/officialMOH/", youtube: "https://www.youtube.com/user/mastersofhardcore", soundcloud: "mastersofhardcore", x: "official_MOH" },
  "mayday": { instagram: "mayday_dortmund", site: "https://www.mayday.de", facebook: "https://www.facebook.com/mayday.dortmund/", tiktok: "mayday_dortmund", youtube: "https://www.youtube.com/@MaydayDeutschland", soundcloud: "mayday-official", spotify: "https://open.spotify.com/user/maydaydortmund" },
  "micro-festival": { instagram: "microfestival", site: "https://microfestival.be", facebook: "https://www.facebook.com/microfestival" },
  "nature-one": { instagram: "natureonefestival", site: "https://www.nature-one.de", facebook: "https://www.facebook.com/natureone.festival", tiktok: "natureonefestival", youtube: "https://www.youtube.com/NatureOneChannel", soundcloud: "official-nature-one", spotify: "https://open.spotify.com/user/natureonefestival" },
  "nemora-festival": { instagram: "nemorafest.eu", site: "https://www.nemorafest.eu" },
  "neopop-festival": { instagram: "neopopfestival", site: "https://neopopfestival.net", facebook: "https://www.facebook.com/neopopfestival", youtube: "https://www.youtube.com/user/neopopfestival" },
  "no-bounds-festival": { instagram: "noboundsfestivaluk", site: "https://noboundsfestival.co.uk", facebook: "https://www.facebook.com/noboundsfestival/" },
  "nuits-sonores": { instagram: "nuits_sonores", site: "https://www.nuits-sonores.com", facebook: "https://www.facebook.com/nuitssonores.festival", tiktok: "nuitssonoreslyon" },
  "ostend-beach-festival": { instagram: "ostendbeach", site: "https://www.ostendbeach.be", facebook: "https://www.facebook.com/ostendbeach", tiktok: "ostendbeach", youtube: "https://www.youtube.com/OstendBeach" },
  "palmesus": { instagram: "palmesus", site: "https://www.palmesus.com", facebook: "https://www.facebook.com/Palmesus/", tiktok: "palmesus.com", youtube: "https://www.youtube.com/user/palmesusbeachparty" },
  "panorama-festival": { instagram: "panoramafestival_", site: "https://www.panorama-festival.it", facebook: "https://www.facebook.com/panoramafestivalpuglia/", tiktok: "panoramafestival_" },
  "paradigm-festival": { instagram: "paradigm050", site: "https://www.paradigmfestival.com", soundcloud: "paradigm050" },
  "paradise-city": { instagram: "paradisecityofficial", site: "https://paradisecity.be", facebook: "https://www.facebook.com/paradisecityfestival", tiktok: "paradisecityfestival" },
  "parklife": { instagram: "parklife_festival", site: "https://www.parklife.uk.com", facebook: "https://www.facebook.com/parklifefestival", tiktok: "parklifefestival", x: "Parklifefest" },
  "parookaville": { instagram: "parookaville", site: "https://www.parookaville.com", facebook: "https://www.facebook.com/parookaville", tiktok: "parookaville", youtube: "https://www.youtube.com/channel/UCR5mwo9sMrF3y8Y2gN5pknw" },
  "pohoda-festival": { instagram: "pohodafestival", site: "https://www.pohodafestival.sk", facebook: "https://www.facebook.com/pohoda.festival", tiktok: "pohoda_festival", youtube: "https://www.youtube.com/user/FestivalPohoda" },
  "polifonic": { instagram: "polifonic_", site: "https://www.polifonic.it", facebook: "https://www.facebook.com/polifonicfestival", soundcloud: "polifonicfestival" },
  "positivus-2026-calvin-harris": { instagram: "positivus", site: "https://www.positivusfestival.com", facebook: "https://www.facebook.com/PositivusFestival/", x: "positivus" },
  "pukkelpop": { instagram: "pukkelpop", site: "https://www.pukkelpop.be", facebook: "https://www.facebook.com/pukkelpop", tiktok: "pukkelpop", youtube: "https://www.youtube.com/@pukkelpopfestival" },
  "pussy-lounge": { instagram: "officialpssylounge", site: "https://www.b2s.nl/pussylounge", facebook: "https://www.facebook.com/pussylounge/" },
  "rampage-weekend": { instagram: "rampage.international", site: "https://rampage.eu", facebook: "https://www.facebook.com/Rampage.International.Events", tiktok: "rampage_belgium", youtube: "https://www.youtube.com/user/WeAreRampageEvents", x: "WeAreRampage" },
  "rave-on-snow": { instagram: "raveonsnow_festival", site: "https://raveonsnow.com", facebook: "https://www.facebook.com/RaveOnSnowSaalbach", youtube: "https://www.youtube.com/raveonsnow" },
  "reperkusound": { instagram: "reperkusound", site: "https://www.reperkusound.com", facebook: "https://www.facebook.com/Reperkusound", tiktok: "reperkusound", youtube: "https://www.youtube.com/channel/UCrjREC5HCkEgY7D5To29XCw", soundcloud: "reperkusound" },
  "reverze": { instagram: "reverze.be", site: "https://www.reverze.be", facebook: "https://www.facebook.com/reverzeofficial", tiktok: "reverze.be" },
  "rewire": { instagram: "rewirefestival", site: "https://www.rewirefestival.nl", facebook: "https://www.facebook.com/rewirefestival", youtube: "https://www.youtube.com/channel/UCJF8DEI0B2_Zqlb_wwp-gcg", soundcloud: "rewirefestival", bandcamp: "https://rewirefestival.bandcamp.com", x: "rewirefestival" },
  "reworks": { instagram: "reworksfestival", site: "https://reworks.gr", facebook: "https://www.facebook.com/reworksfestivalofficial/", x: "reworksfestival", ra: "https://ra.co/promoters/39101" },
  "robot-festival": { instagram: "robotfestival", site: "https://www.robotfestival.it", facebook: "https://www.facebook.com/festivalrobot/", spotify: "https://open.spotify.com/user/robotfestival" },
  "roskilde-festival": { instagram: "roskildefestival", site: "https://www.roskilde-festival.dk", facebook: "https://www.facebook.com/orangefeeling", tiktok: "roskildefestival", youtube: "https://www.youtube.com/user/roskildefestival" },
  "ruhr-in-love": { instagram: "ruhrinlove", site: "https://www.ruhr-in-love.de", facebook: "https://facebook.com/ruhrinlove", tiktok: "ruhrinlove", youtube: "https://www.youtube.com/ruhrinloveofficial", soundcloud: "ruhr-in-love" },
  "smeerboel-festival": { instagram: "smeerboelfestival", site: "https://www.smeerboel.nl", facebook: "https://www.facebook.com/Smeerboel/" },
  "snowbombing": { instagram: "snowbombingofficial", site: "https://www.snowbombing.com", facebook: "https://www.facebook.com/snowbombing", youtube: "https://www.youtube.com/@snowbombing", x: "Snowbombing" },
  "snowboxx": { instagram: "snowboxx", site: "https://www.snowboxx.com", facebook: "https://www.facebook.com/snowboxx", tiktok: "snowboxx" },
  "solar-weekend-festival": { instagram: "solarweekend", site: "https://www.solarweekend.com", facebook: "https://www.facebook.com/SolarWeekend/", tiktok: "solarweekend" },
  "sonar": { instagram: "sonarfestival", site: "https://sonar.es", facebook: "https://www.facebook.com/SonarFestival", tiktok: "sonar.festival", youtube: "https://www.youtube.com/SonarFestival", soundcloud: "sonarfestival", spotify: "https://open.spotify.com/user/sonarfestival" },
  "street-parade": { instagram: "streetparadeofficial", site: "https://www.streetparade.com", facebook: "https://www.facebook.com/streetparade", tiktok: "streetparadeofficial", youtube: "https://www.youtube.com/user/streetparadeZuerich", x: "streetparadeZH" },
  "summer-sound": { instagram: "summersoundlv", site: "https://summersound.lv", facebook: "https://www.facebook.com/summersoundlv/", tiktok: "summersoundlv", youtube: "https://youtube.com/lmtsummersound" },
  "sunandbass": { instagram: "sunandbassofficial", site: "https://www.sunandbass.net", facebook: "https://www.facebook.com/sunandbass", soundcloud: "sunandbass", x: "sunandbass" },
  "supremacy-state-of-distortion": { instagram: "supremacyevent", site: "https://www.supremacy.nl", facebook: "https://www.facebook.com/supremacyevents/", youtube: "https://www.youtube.com/@Supremacyevent" },
  "syndicate": { instagram: "syndicate_dortmund", site: "https://www.syndicate-festival.de", facebook: "https://www.facebook.com/syndicate.festival", tiktok: "syndicate_festival", youtube: "https://www.youtube.com/@SYNDICATEOFCL", soundcloud: "syndicate-festival" },
  "tauron-nowa-muzyka": { instagram: "nowa_muzyka_festiwal", site: "https://festiwalnowamuzyka.pl", facebook: "https://www.facebook.com/NowaMuzyka", tiktok: "tauronnowamuzykakatowice", youtube: "https://www.youtube.com/@festiwalnowamuzyka" },
  "techno-parade": { instagram: "technoparade", site: "https://www.technoparade.fr" },
  "teletech-festival": { instagram: "teletechuk", site: "https://www.teletech.events", tiktok: "teletechuk", soundcloud: "teletechuk", bandcamp: "https://teletechuk.bandcamp.com" },
  "terminal-v-croatia": { instagram: "terminalvcroatia", site: "https://terminalvcroatia.com", facebook: "https://www.facebook.com/terminalvfest/", tiktok: "terminalvfest", youtube: "https://www.youtube.com/channel/UCIyfD_fk7WOkHpm31e3rOXQ" },
  "the-peacock-society": { instagram: "peacocksociety", site: "https://peacocksociety.fr", facebook: "https://www.facebook.com/thepeacocksociety", tiktok: "peacocksociety", youtube: "https://www.youtube.com/user/thepeacocksociety" },
  "the-warehouse-project": { instagram: "whp_mcr", site: "https://www.thewarehouseproject.com", facebook: "https://www.facebook.com/thewarehouseproject", tiktok: "thewarehouseproject", x: "WHP_Mcr" },
  "time-warp": { instagram: "time_warp_official", site: "https://www.time-warp.de", facebook: "https://www.facebook.com/timewarpofficial", tiktok: "time_warp_official", soundcloud: "timewarp_official" },
  "tomorrowland-winter": { instagram: "tomorrowlandwinter", site: "https://winter.tomorrowland.com", facebook: "https://www.facebook.com/TomorrowlandWinter" },
  "toxicator": { instagram: "toxicator_mannheim", site: "https://www.toxicator.de", facebook: "https://facebook.com/toxicator", tiktok: "toxicator_mannheim", youtube: "https://www.youtube.com/TOXICATOROFFICIAL", soundcloud: "toxicator-official" },
  "ultra-europe": { instagram: "ultraeurope", site: "https://ultraeurope.com", facebook: "https://www.facebook.com/ultraeurope", x: "ultraeurope" },
  "unsound-krakow-soft-power": { instagram: "unsoundfestival", site: "https://www.unsound.pl", facebook: "https://facebook.com/unsoundfestival", soundcloud: "unsound", x: "unsound" },
  "unsound-warsaw-soft-power": { instagram: "unsoundfestival", site: "https://www.unsound.pl", facebook: "https://facebook.com/unsoundfestival", soundcloud: "unsound", x: "unsound" },
  "untold": { instagram: "untoldfestival", site: "https://untold.com", facebook: "https://www.facebook.com/UNTOLDFestival", tiktok: "untold.festival", youtube: "https://www.youtube.com/channel/UCeDqemm8j1o4u90IHkC0h0w", x: "UntoldFestival" },
  "waterworks-festival": { instagram: "waterworksldn", site: "https://waterworksfestival.co.uk", tiktok: "waterworksfestival" },
  "way-out-west": { instagram: "wayoutwestfestival", site: "https://www.wayoutwest.se", facebook: "https://www.facebook.com/wayoutwestfestival", spotify: "https://open.spotify.com/user/wayoutwestfestival", x: "wayoutwestgbg" },
  "we-out-here-festival": { instagram: "weoutherefest", site: "https://weoutherefestival.com", facebook: "https://www.facebook.com/weoutherefest", youtube: "https://www.youtube.com/channel/UC9h_HIGiJNgJ0BUyhxUG9MQ", x: "weoutherefest" },
  "wecandance": { instagram: "wecandancefest", site: "https://www.wecandance.be", facebook: "https://www.facebook.com/WECANDANCEFEST/", tiktok: "wecandancefest", youtube: "https://www.youtube.com/@WECANDANCE", x: "WECANDANCEFEST" },
  "world-club-dome": { instagram: "worldclubdome", site: "https://www.worldclubdome.com", facebook: "https://www.facebook.com/worldclubdome", tiktok: "worldclubdome", youtube: "https://www.youtube.com/@wcdmusic" },
  "zug-der-liebe": { instagram: "zugderliebe", site: "https://zugderliebe.org", soundcloud: "zugderliebe" },
};

export const VENUE_SOCIALS: Record<string, Socials> = {};

export const ARTIST_SOCIALS: Record<string, Socials> = {
  "adam-beyer": { instagram: "realadambeyer", site: "https://www.adambeyer.se", facebook: "https://www.facebook.com/realadambeyer", soundcloud: "adambeyer", x: "realAdamBeyer" },
  "amelie-lens": { instagram: "amelie_lens", site: "https://www.amelielens.com", facebook: "https://www.facebook.com/amelielensmusic/", youtube: "https://www.youtube.com/channel/UCg2JFUP67ZdKzehy8TWMUmw", soundcloud: "amelielens", spotify: "https://open.spotify.com/artist/5Ho1vKl1Uz8bJlk4vbmvmf", x: "amelielens" },
  "angerfist": { instagram: "angerfist_official", site: "https://angerfist.nl", facebook: "https://www.facebook.com/angerfistmusic/", youtube: "https://www.youtube.com/user/TheAngerfistHardcore", soundcloud: "angerfistmusic", x: "DJ_ANGERFIST" },
  "anyma": { instagram: "anyma", site: "https://anyma.com", tiktok: "anyma", youtube: "https://www.youtube.com/@anyma_ofc", spotify: "https://open.spotify.com/artist/4iBwchw0U0GZv5RfVYSMxN", x: "anyma_eva" },
  "charlotte-de-witte": { instagram: "charlottedewittemusic", site: "https://charlottedewittemusic.com", facebook: "https://www.facebook.com/charlottedewittemusic", soundcloud: "charlottedewittemusic" },
  "i-hate-models": { instagram: "ihatemodels1", soundcloud: "ihatemodels" },
  "jeff-mills": { instagram: "jeff_mills_official", site: "https://www.axisrecords.com", x: "DJJeffMills" },
  "joris-delacroix": { instagram: "joris_delacroix", site: "https://jorisdelacroix.fr", facebook: "https://www.facebook.com/jorisdelacroix/", youtube: "https://www.youtube.com/channel/UC_AlTNYYHf8v4zMgUZoSaMA", soundcloud: "jorisdelacroix", spotify: "https://open.spotify.com/artist/3HRRzIZNQFus3xlUx2xKy1", x: "jorisdelacroix" },
  "mala": { instagram: "maladmz", site: "https://www.maladmz.com", facebook: "https://www.facebook.com/malamystikz", tiktok: "maladmz", youtube: "https://www.youtube.com/user/maladmz", soundcloud: "maladmz", spotify: "https://open.spotify.com/artist/0QTEYauMG3DrAVPXCYMseu", x: "mala_dmz" },
  "nto": { instagram: "ntomusic", facebook: "https://www.facebook.com/nto.music", soundcloud: "ntonto", spotify: "https://open.spotify.com/artist/7ry8L53T4oJtSIogGYuioq" },
  "overmono": { instagram: "overmono", site: "https://www.overmono.com", bandcamp: "https://overmono.bandcamp.com" },
  "rdhad": { instagram: "rodhad_dystopian", site: "https://www.dystopian.de", soundcloud: "rodhad" },
  "sammy-virji": { instagram: "sammyvirji", facebook: "https://www.facebook.com/sammyvirjiuk", soundcloud: "sammyvirji", bandcamp: "https://sammyvirji.bandcamp.com", x: "sammy_virji" },
  "sara-landry": { instagram: "saralandrydj", site: "https://saralandry.com", facebook: "https://www.facebook.com/sara-landry-dj", soundcloud: "sara-landry-dj" },
  "stephan-bodzin": { instagram: "stephanbodzin", site: "https://www.stephanbodzin.de", facebook: "https://www.facebook.com/StephanBodzinOfficial/", soundcloud: "stephanbodzinofficial", x: "stephanbodzin" },
  "teho": { instagram: "teho_live", site: "https://www.labo-t.fr/teho", bandcamp: "https://teho.bandcamp.com" },
  "the-avalanches": { instagram: "theavalanches", site: "https://www.theavalanches.com", facebook: "https://www.facebook.com/theavalanches", tiktok: "theavalanches", youtube: "https://www.youtube.com/user/avalanchesofficial", soundcloud: "theavalanches", spotify: "https://open.spotify.com/artist/3C8RpaI3Go0yFF9whvKoED", x: "theavalanches" },
  "the-chainsmokers": { instagram: "thechainsmokers", site: "https://www.thechainsmokers.com", facebook: "https://www.facebook.com/thechainsmokers", tiktok: "thechainsmokers", soundcloud: "thechainsmokers", x: "thechainsmokers" },
  "tiesto": { instagram: "tiesto", site: "https://www.tiesto.com", facebook: "https://www.facebook.com/tiesto", youtube: "https://www.youtube.com/channel/UCPk3RMMXAfLhMJPFpQhye9g", soundcloud: "tiesto", spotify: "https://open.spotify.com/artist/2o5jDhtHVPhrJdv3cEQ99Z", x: "tiesto" },
  "underworld": { instagram: "underworld", site: "https://www.underworldlive.com", facebook: "https://www.facebook.com/Underworld/", youtube: "https://www.youtube.com/UnderworldLiveTV", bandcamp: "https://underworld.bandcamp.com", x: "underworldlive" },
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
