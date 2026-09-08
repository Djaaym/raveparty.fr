import type { Lang, RaveEvent } from "./types";
/* `./display` et pas `./data` : module feuille, il ne doit jamais tirer le catalogue.
   Voir l'en-tête de display.ts. */
import { eventVenueL, isMultiVenueLabel, lastDay, slugify } from "./display";
import { HOTEL_AID, HOTEL_BRAND, HOTEL_CJ_CLICK, HOTEL_PARTNER, HOTEL_URL_TEMPLATE } from "./site";

/**
 * Affiliation hôtel : le lien « où dormir » posé sous chaque fiche événement.
 *
 * Ce que ce module fait, et surtout ce qu'il ne fait pas. Il ne connaît **aucun
 * hôtel** : il construit une recherche datée sur la ville de l'événement chez un
 * partenaire, avec l'identifiant d'affiliation. Publier une liste d'hôtels
 * « recommandés » supposerait des noms, des prix et des distances qu'on n'a pas
 * vérifiés, exactement la donnée inventée que la règle de contenu interdit, et un
 * prix d'hôtel bouge de toute façon tous les jours. La recherche du partenaire est
 * juste au moment du clic ; une liste figée serait fausse la semaine suivante.
 *
 * Les dates viennent du catalogue : arrivée le premier jour, départ le lendemain du
 * dernier. Une soirée de club qui finit à l'aube, c'est donc bien une nuit d'hôtel,
 * et un festival de trois jours en réserve trois.
 *
 * Sans identifiant configuré, `hotelStay()` renvoie `null` et la carte ne se rend
 * pas. C'est volontaire, et c'est la même règle que pour les alertes sans
 * fournisseur : un lien sortant vers un moteur de réservation qui ne rapporte rien
 * coûte du jus de lien pour zéro revenu, mieux vaut rien du tout.
 */
export interface HotelStay {
  /** URL de recherche chez le partenaire, déjà affiliée. */
  url: string;
  /** Arrivée, ISO yyyy-mm-dd (premier jour de l'événement). */
  checkin: string;
  /** Départ, ISO yyyy-mm-dd (lendemain du dernier jour). */
  checkout: string;
  /** Nombre de nuits, toujours >= 1. */
  nights: number;
  /** Nom affichable du partenaire ("Booking.com"), vide si non déclaré. */
  brand: string;
  /**
   * Ce sur quoi la recherche est centrée, tel qu'on l'écrit au lecteur : la salle
   * quand c'en est une, la ville sinon. La carte annonce ce que le lien fait
   * vraiment, elle ne promet pas « près du Rex Club » une recherche sur Paris.
   */
  near: string;
}

/** Décale une date ISO de `days` jours. En UTC, pour qu'un changement d'heure ne fasse pas glisser la nuit. */
function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Nombre de nuits entre deux dates ISO. */
function nightsBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400000));
}

/**
 * Étiquette de reporting envoyée au partenaire, une par page.
 *
 * Bornée à `[a-z0-9-]` : Booking rejette une étiquette qui sort de ce jeu, et une
 * étiquette rejetée fait retomber le clic sur le compte sans campagne, donc invisible
 * dans les rapports. La langue y est pour qu'on sache si /en convertit.
 */
function trackingLabel(e: RaveEvent, lang: Lang): string {
  return `rp-${lang}-ev${e.id}`;
}

/**
 * Recherche Booking.com datée, **centrée sur la salle** de l'événement.
 *
 * La version d'origine ne passait que `ss=« Ville, Pays »`, ce qui ouvre la recherche
 * au centre de l'agglomération. Ça se voit dès que la salle n'y est pas : le Klokgebouw
 * est à 3 km du centre d'Eindhoven, un Festivalpark est à la campagne, et le lecteur
 * qui arrive après une nuit de club veut dormir près de l'endroit d'où il sort, pas
 * près de la gare. Les 2 053 fiches du catalogue portent les coordonnées de leur salle
 * (mesuré : les 100 prochaines sont toutes à 3 décimales ou plus, soit une centaine de
 * mètres), donc l'information existe et il n'y a qu'à la passer.
 *
 * Trois paramètres pour ça, et pas un de plus :
 * - `latitude` / `longitude`, que Booking traite en dimensions de recherche de premier
 *   ordre (vérifié : sa redirection canonique jette `ss`, `checkin` et `order` mais
 *   **garde** ces deux-là, `searchresults.fr.html?latitude=…;longitude=…`) ;
 * - `order=distance_from_search`, qui range les résultats par distance à ce point.
 *
 * **Aucun filtre de rayon.** `nflt=distance=3000` est bien reconnu, et c'est
 * exactement pourquoi il est dangereux : un festival dans un champ n'a rien à 3 km, et
 * un filtre qui rend zéro hôtel est pire qu'une liste trop large. Trier ne peut pas
 * vider la page, filtrer si.
 *
 * `ss` reste, en « Ville, Pays » avec les libellés bruts du catalogue (en anglais) :
 * c'est l'ancre que l'autocomplétion de Booking résout le plus sûrement, et le repli
 * naturel si les coordonnées ne lui plaisent pas. Le reste des paramètres est celui
 * d'avant, stable et documenté.
 */
function bookingSearch(e: RaveEvent, lang: Lang, checkin: string, checkout: string): string {
  const q = new URLSearchParams({
    ss: `${e.city}, ${e.country}`,
    latitude: String(e.lat),
    longitude: String(e.lng),
    order: "distance_from_search",
    checkin,
    checkout,
    group_adults: "2",
    group_children: "0",
    no_rooms: "1",
    lang: lang === "en" ? "en-gb" : "fr",
  });
  return `https://www.booking.com/searchresults.html?${q.toString()}`;
}

/**
 * La même recherche, identifiée par un `aid` Booking en direct.
 *
 * Ne sert plus qu'à un compte historique : Booking.com ne délivre plus d'`aid` en
 * self-service, sa page de programme renvoie sur CJ. Le mode reste parce qu'un `aid`
 * déjà obtenu continue de fonctionner, et parce qu'il coûte quatre lignes.
 */
function bookingDirectUrl(e: RaveEvent, lang: Lang, checkin: string, checkout: string): string {
  const q = new URLSearchParams({ aid: HOTEL_AID, label: trackingLabel(e, lang) });
  return `${bookingSearch(e, lang, checkin, checkout)}&${q.toString()}`;
}

/**
 * La même recherche, encapsulée dans un lien de clic CJ Affiliate.
 *
 * C'est la seule route ouverte pour Booking aujourd'hui : leur page de programme dit
 * « Inscrivez-vous via nos réseaux affiliés officiels » et pointe sur CJ (vérifié).
 *
 * **Ni `aid` ni `label` dans la destination**, et ce n'est pas un oubli : CJ les
 * ajoute lui-même à la redirection (`aid=818286` et un `label` de la forme
 * `affnetcj-…_pub-…_site-…_clkid-{sid}_cjevent-…`). En poser une seconde paire ferait
 * deux `label` dans l'URL finale, et rien ne dit lequel Booking retient. Notre suivi
 * par événement passe donc par `sid`, mesuré : il ressort en `_clkid-rp-fr-ev777`.
 *
 * **`cjevent` est engendré au moment du clic** par la chaîne de redirection, il ne se
 * fabrique pas : c'est la raison pour laquelle on ne peut pas court-circuiter CJ en
 * recopiant un `label` déjà vu dans une URL construite à la main.
 *
 * Le lien de clic doit porter une annonce **profonde**. Sur une bannière, `url=` est
 * ignoré et le lecteur atterrit sur la page d'accueil de Booking, ce qui vide le bloc
 * de son intérêt (l'attribution Booking est à la session : il faut pouvoir réserver
 * dans la foulée du clic, pas refaire la recherche que la fiche connaissait déjà).
 */
function cjUrl(e: RaveEvent, lang: Lang, checkin: string, checkout: string): string {
  const q = new URLSearchParams({
    url: bookingSearch(e, lang, checkin, checkout),
    sid: trackingLabel(e, lang),
  });
  return `${HOTEL_CJ_CLICK}${HOTEL_CJ_CLICK.includes("?") ? "&" : "?"}${q.toString()}`;
}

/**
 * Ce sur quoi on annonce la recherche : la salle, ou la ville quand le libellé n'en
 * est pas une, ou n'en est plus une une fois lu.
 *
 * Le lien, lui, est **toujours** centré sur les coordonnées : elles valent mieux que
 * le centre-ville même quand le libellé ne mérite pas d'être cité. C'est l'annonce
 * qui s'ajuste, jamais la recherche, donc un repli prudent ici ne coûte rien.
 *
 * Trois façons pour un `venue` de ne pas être citable, toutes constatées dans le
 * catalogue, pas supposées :
 * - il décrit un ensemble de lieux (« Divers lieux, Rennes ») : `isMultiVenueLabel()`,
 *   la même règle qu'ailleurs, jamais une seconde copie ;
 * - il est nommé d'après sa propre ville (« Bordeaux, France »), libellé de
 *   remplissage : c'est la règle de la pilule « Clubs » de `CitiesHub` ;
 * - il ne désigne aucun endroit : « TBA », « Secret Location Notts ». Un lieu tenu
 *   secret est justement celui dont on ne peut pas être proche, et la ville est la
 *   seule chose vraie qu'on puisse en dire ;
 * - c'est une fiche Google Maps recopiée entière par le champ libre de Shotgun,
 *   « Glass Club Cannes, House music Bar à cocktails Festive & Club, Night Club,
 *   Boîte de Nuit, » (89 caractères). On garde ce qui précède la première virgule ou
 *   le premier tiret détaché, ce qui rend « Glass Club Cannes » et « Yaya Lille », et
 *   on renonce au-delà de 48 caractères, la longueur qui laisse passer « Parc des
 *   Expositions Paris Nord Villepinte » sans laisser passer une périphrase.
 */
const NAME_CAP = 48;
/* Libellés de remplissage, testés sur des mots entiers comme `isMultiVenueLabel()` :
   « TBA » ne doit pas emporter un nom qui le contient. */
const PLACEHOLDER = /\b(tba|tbc|to be announced|secret location|lieu secret)\b/i;

function centredOn(e: RaveEvent, lang: Lang): string {
  const venue = eventVenueL(e, lang);
  if (!venue || isMultiVenueLabel(venue) || PLACEHOLDER.test(venue)) return e.city;
  let name = venue.split(",")[0].trim();
  /* Le tiret détaché ne se coupe qu'en dernier recours, et il a fallu le rendre pour
     le voir : « 109 - l'Embarcadère » (Lyon) est un nom entier, la coupe systématique
     en faisait « Où dormir près de 109 ». « Yaya Lille - Restaurant méditerranéen avec
     terrasse par Juan Arbelaez » est le cas inverse, un nom suivi d'un descriptif.
     Rien ne les distingue sinon la longueur, donc on ne coupe que si le libellé ne
     tient pas. La virgule, elle, sépare toujours (adresse, ville, descriptif). */
  if (name.length > NAME_CAP) name = name.split(/ [-/] /)[0].trim();
  if (!name || name.length > NAME_CAP) return e.city;
  if (slugify(name) === slugify(e.city)) return e.city;
  return name;
}

/**
 * Gabarit libre, pour tout réseau qui n'est pas Booking (Stay22, Travelpayouts,
 * Awin/Expedia, un lien encapsulé Impact...). On ne devine jamais le format d'URL
 * d'un réseau : il est collé tel quel dans `HOTEL_URL_TEMPLATE`, avec des marqueurs.
 */
function templateUrl(e: RaveEvent, lang: Lang, checkin: string, checkout: string, nights: number): string {
  const vals: Record<string, string> = {
    city: e.city,
    country: e.country,
    checkin,
    checkout,
    nights: String(nights),
    lat: String(e.lat),
    lng: String(e.lng),
    lang,
    label: trackingLabel(e, lang),
  };
  return HOTEL_URL_TEMPLATE.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in vals ? encodeURIComponent(vals[k]) : m,
  );
}

/** La recherche d'hôtels correspondant aux nuits de cet événement, ou `null` si aucun partenaire n'est configuré. */
export function hotelStay(e: RaveEvent, lang: Lang): HotelStay | null {
  const checkin = e.date;
  const checkout = shiftDay(lastDay(e), 1);
  const nights = nightsBetween(checkin, checkout);

  const near = centredOn(e, lang);

  if (HOTEL_PARTNER === "cj" && HOTEL_CJ_CLICK) {
    return { url: cjUrl(e, lang, checkin, checkout), checkin, checkout, nights, brand: HOTEL_BRAND, near };
  }
  if (HOTEL_PARTNER === "booking" && HOTEL_AID) {
    return { url: bookingDirectUrl(e, lang, checkin, checkout), checkin, checkout, nights, brand: HOTEL_BRAND, near };
  }
  if (HOTEL_PARTNER === "template" && HOTEL_URL_TEMPLATE) {
    return { url: templateUrl(e, lang, checkin, checkout, nights), checkin, checkout, nights, brand: HOTEL_BRAND, near };
  }
  return null;
}
