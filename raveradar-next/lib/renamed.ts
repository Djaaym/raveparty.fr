/**
 * Slugs d'événements abandonnés → slug actuel.
 *
 * Le slug dérive du titre, donc corriger un titre casse l'URL déjà indexée. « The
 * Warehouse Project » était un titre générique posé sur la seule date du 18/09 à
 * Manchester, alors que les 21 autres dates de la saison suivent la convention
 * « The Warehouse Project: {artiste} » — et c'est bien la soirée KI/KI. Mais
 * `/festival/the-warehouse-project` existe et est indexée : même règle que pour les
 * anciennes pages `/show/`, on renvoie un 301, jamais un 404.
 *
 * **Module à part, et volontairement sans dépendance.** Il est importé par
 * `middleware.ts`, qui tourne sur le runtime edge : y tirer `lib/data.ts` (577
 * événements) embarquerait tout le catalogue dans le bundle du middleware, exécuté
 * à chaque requête.
 *
 * Pourquoi le middleware et pas un `permanentRedirect()` dans la page : un
 * `redirect()` dans une page **prérendue** produit un 308 **sans en-tête
 * `Location`** — la cible n'est plus que dans un méta-refresh du HTML, ce que Google
 * traite bien moins sûrement qu'une vraie redirection. Le middleware, lui, répond
 * avant tout rendu et pose un `Location` en bonne et due forme.
 */
export const RENAMED_EVENT_SLUGS: Record<string, { base: "event" | "festival"; slug: string }> = {
  "the-warehouse-project": { base: "festival", slug: "the-warehouse-project-ki-ki" },
  // « Tiësto » décrivait la date du 01/10 à la MEO Arena comme un concert ordinaire. C'est
  // en fait INFINITY Lisbon, la soirée de clôture du SBC Summit, réservée aux détenteurs
  // d'un pass du salon : le titre le dit maintenant, et l'ancien slug pointe ici.
  tiesto: { base: "event", slug: "tiesto-infinity-lisbon" },
  // Time Warp Spain 2026 (Madrid, 18-19/09) a été **annulé par l'organisateur** —
  // communiqué officiel sur time-warp.de. Une date annulée laissée « à venir »
  // envoie nos lecteurs à un festival qui n'aura pas lieu, donc la fiche a été
  // retirée ; mais son URL était indexée, et une URL gagnée ne retombe jamais en
  // 404 : elle pointe vers la fiche allemande de la même marque.
  "time-warp-spain": { base: "festival", slug: "time-warp" },
};

/**
 * Slugs d'artistes abandonnés → slug actuel, ou `null` quand l'artiste n'existait pas.
 *
 * Même règle que ci-dessus, et elle vaut d'autant plus ici que le slug d'un artiste
 * dérive d'un nom recopié à la main sur une affiche : la moindre coquille corrigée
 * casse une URL. La vérification du catalogue en a produit une trentaine d'un coup —
 * des fautes de frappe (« Jennifer Lovell » pour Loveless, « Da Tweeka » pour
 * Da Tweekaz, « Diachi Wada » pour Daichi Wada), une graphie stylisée illisible
 * (« ¥ØU$UK€ ¥UK1MAT$U »), et surtout les **créneaux b2b** qui figuraient en line-up
 * comme s'ils étaient un artiste (« Freddi B2B Sophia Violet »).
 *
 * Deux cas, et la distinction compte :
 *
 * - **une cible** quand la page décrit toujours quelqu'un : la coquille et la graphie
 *   stylisée renvoient vers la bonne fiche ;
 * - **`null` quand personne ne succède**, et c'est le cas des b2b : le créneau
 *   partagé n'a pas d'héritier unique, ni « Freddi » ni « Sophia Violet » n'est
 *   *cette* page. On renvoie alors vers l'annuaire `/artistes` — moins précis qu'une
 *   fiche, infiniment mieux qu'un 404, et honnête : la page promise n'existait pas.
 */
export const RENAMED_ARTIST_SLUGS: Record<string, string | null> = {
  // Coquilles et graphies corrigées.
  "jennifer-lovell": "jennifer-loveless",
  "da-tweeka": "da-tweekaz",
  "diachi-wada": "daichi-wada",
  "u-uk-uk1mat-u": "yousuke-yukimatsu",
  // N'étaient pas des artistes : un nom de soirée de club, un titre de tournée.
  fused: null,
  "a-nice-place-to-be": null,
  // Créneaux b2b scindés : deux artistes, donc aucun successeur unique. Les slugs
  // sont recopiés du catalogue d'avant la scission, jamais réécrits de tête : « ø »
  // et « Ø » ne se décomposent pas en « o », donc « Aphøtic » donne `aph-tic`.
  "amara-b2b-thiso": null, // Amara b2b Thiso
  "aph-tic-b2b-tassery": null, // Aphøtic b2b Tassery
  "axwell-b2b-sebastian-ingrosso": null, // Axwell b2b Sebastian Ingrosso
  "b-ery-b2b-cynthia-spiering": null, // Bøęry b2b Cynthia Spiering
  "ben-techy-b2b-luciid": null, // Ben Techy b2b Luciid
  "buunshin-b2b-phace": null, // Buunshin b2b Phace
  "callush-b2b-ornella": null, // Callush b2b Ornella
  "cleo-grooves-b2b-zuke": null, // Cleo Grooves b2b Zuke
  "dj-cosworth-b2b-oldboy": null, // DJ Cosworth b2b Oldboy
  "dt43-b2b-vino": null, // DT43 b2b Vino
  "freddi-b2b-sophia-violet": null, // Freddi B2B Sophia Violet
  "furcht-b2b-mit": null, // Furcht b2b MIT
  "kamma-b2b-masalo": null, // Kamma b2b Masalo
  "line-o-b2b-roboith": null, // Line-O b2b ROBOITH
  "mo-disko-b2b-nico-juice": null, // Mo Disko b2b Nico Juice
  "mortis-b2b-outrage": null, // Mortis b2b Outrage
  "n-e-o-b2b-rbenyx": null, // N~E~O b2b ØRBENYX
  "paul-van-dyk-b2b-aly-fila": null, // Paul van Dyk b2b Aly & Fila
  "saoirse-b2b-leon-vynehall": null, // Saoirse b2b Leon Vynehall
  "schwesta-p-b2b-olivia-lensen": null, // Schwesta P B2B Olivia Lensen
};
