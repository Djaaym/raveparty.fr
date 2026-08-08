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
};
