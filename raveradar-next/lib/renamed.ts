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
