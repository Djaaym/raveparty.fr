/**
 * Production base URL. Governs every canonical, hreflang, sitemap entry, og:image and
 * schema.org `image` on the site, so it has to be the host that actually serves them.
 *
 * `www` on purpose: Vercel treats it as the primary domain and 308-redirects the apex
 * to it. Declaring the apex here pointed all ~8 100 canonicals at a URL that redirects,
 * harmless in the sense that crawlers follow it, but every canonical then disagreed with
 * the address the page was really served from. If the apex ever becomes the primary
 * domain in Vercel, flip this line back rather than leaving the two out of step.
 */
export const SITE_URL = "https://www.raveparty.fr";

/**
 * Google Analytics 4 Measurement ID (looks like "G-XXXXXXXXXX").
 * Paste it here (or set NEXT_PUBLIC_GA_ID in Vercel env). Empty = GA disabled.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-M1CERK8ERF";

/**
 * Impact.com Universal Tracking Tag, programme d'affiliation Ticketmaster.
 * L'identifiant de compte fait partie de l'URL du tag (utt.impactcdn.com/{id}.js).
 * Vide = affiliation désactivée. Le tag doit rester présent dans le HTML de la
 * page d'accueil : c'est lui qu'Impact vient vérifier depuis « Ajouter un site Web ».
 */
export const IMPACT_UTT_ID =
  process.env.NEXT_PUBLIC_IMPACT_UTT_ID ?? "P-A7550075-4be3-413e-9b85-2f3a1ece72cd1";

/**
 * Affiliation hôtel (bloc « où dormir » des fiches événement, `lib/hotels.ts`).
 *
 * Trois variables, toutes **sans préfixe `NEXT_PUBLIC_`** : le lien est construit
 * dans un composant serveur, il n'a aucune raison de partir dans le bundle du
 * navigateur, et un identifiant d'affiliation lisible côté client se recopie.
 * Corollaire à tenir : ne jamais lire ces constantes depuis un composant client,
 * elles y vaudraient la chaîne vide et le rendu divergerait de celui du serveur.
 *
 * `HOTEL_PARTNER` vaut "cj" (la même recherche, encapsulée dans un lien de clic CJ,
 * la seule route ouverte pour Booking aujourd'hui), "booking" (recherche construite
 * par le code avec un `aid` en direct) ou "template" (gabarit d'URL fourni par un
 * autre réseau). Il se déduit de ce qui est renseigné, donc poser `HOTEL_CJ_CLICK`
 * suffit. Vide = pas de partenaire,
 * et la carte ne se rend pas du tout. Mise en route détaillée dans `docs/hotels.md`.
 */
export const HOTEL_AID = process.env.HOTEL_AID ?? "";
/**
 * Lien de clic CJ Affiliate, **sans paramètres**, de la forme
 * `https://www.tkqlhce.com/click-{site}-{annonce}`.
 *
 * Booking.com ne se vend plus en direct : sa page de programme renvoie sur CJ
 * (« Inscrivez-vous via nos réseaux affiliés officiels », vérifié). Il n'y a donc pas
 * d'`aid` à poser, c'est CJ qui l'injecte à la redirection, avec un `label` qui porte
 * notre `sid`.
 *
 * **L'annonce doit être un lien profond, pas une bannière.** Mesuré sur une bannière
 * (`utm_medium=bannerindex`) : le `sid` passe, `url=` est purement ignoré et le
 * lecteur atterrit sur la page d'accueil. Le générateur de liens profonds de CJ
 * (Links → Link Tools) rend une annonce qui, elle, accepte `url=`.
 */
export const HOTEL_CJ_CLICK = process.env.HOTEL_CJ_CLICK ?? "";
export const HOTEL_URL_TEMPLATE = process.env.HOTEL_URL_TEMPLATE ?? "";
export const HOTEL_PARTNER: "" | "booking" | "cj" | "template" =
  (process.env.HOTEL_PARTNER as "booking" | "cj" | "template" | undefined) ??
  (HOTEL_CJ_CLICK ? "cj" : HOTEL_AID ? "booking" : HOTEL_URL_TEMPLATE ? "template" : "");
/** Nom affiché du partenaire. Il apparaît dans la mention d'affiliation, donc il doit être exact. */
export const HOTEL_BRAND =
  process.env.HOTEL_BRAND ??
  (HOTEL_PARTNER === "booking" || HOTEL_PARTNER === "cj" ? "Booking.com" : "");

/**
 * L'image de partage par défaut.
 *
 * Environ 5 200 pages (artistes, salles, villes, genres, hubs) n'avaient **ni Open
 * Graph ni Twitter Card** : seules cinq familles de routes passaient par `pageMeta()`,
 * les autres écrivaient leur `Metadata` à la main avec le seul `alternates`. Un partage
 * de `/rave-party/lyon` ou d'une fiche artiste sortait donc sans vignette, sur toutes
 * les messageries où se partage une soirée, et il n'existait aucune image de secours
 * dans `public/`.
 *
 * C'est le visuel du hero, 1280x720, déjà servi en cache immuable : une photo de la
 * chose que le site décrit, pas un logo. Elle ne prétend rien sur une page en
 * particulier, ce qui est exactement ce qu'on veut d'un repli, et les pages qui ont une
 * vraie image (l'affiche d'un événement, le portrait d'un artiste, la photo d'une
 * salle) gardent la leur.
 *
 * Absolue, comme `imageUrl()` : une URL relative n'est pas résolue par les robots des
 * réseaux sociaux.
 */
export const OG_DEFAULT = `${SITE_URL}/hero/rave-707891b510-1280.webp`;
