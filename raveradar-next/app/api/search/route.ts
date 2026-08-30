import { NextResponse } from "next/server";
import { suggest } from "@/lib/search-index";

/**
 * Les suggestions de la barre de recherche.
 *
 * Pourquoi une route et pas un index embarqué dans la page : l'index dérive de
 * `lib/data.ts`, et la règle du projet interdit qu'un composant client l'importe, même
 * indirectement. Passer les 3 400 entrées en props ferait le même dégât par une autre
 * porte, sur la page d'accueil, celle dont le LCP compte le plus. Le client n'envoie
 * donc qu'une chaîne et reçoit huit lignes.
 *
 * Le catalogue ne bouge qu'au déploiement : la réponse est mise en cache au bord pour
 * une heure, avec `stale-while-revalidate`, donc une frappe répétée ne réveille rien.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  // Borné à l'entrée, comme `parseHit` : un point d'accès ouvert ne lit jamais
  // une chaîne dont il n'a pas fixé la taille.
  const q = (url.searchParams.get("q") ?? "").slice(0, 64);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "fr";
  return NextResponse.json(
    { items: suggest(q, lang) },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
