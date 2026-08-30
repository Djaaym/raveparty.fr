import { NextResponse } from "next/server";
import { suggest } from "@/lib/search-index";
import type { SuggestKind } from "@/lib/types";

/** Les catégories que `kind` accepte, celles de `SuggestKind`. */
const KINDS = ["genre", "city", "country", "festival", "artist", "venue", "event"] as const;

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
  /* `kind` restreint à une catégorie. Le champ de line-up du dépôt d'événement demande
     `kind=artist` : il complète un nom d'artiste, et proposer une ville ou un festival
     à cet endroit ferait entrer au catalogue une faute de frappe sur une affiche. */
  const kind = url.searchParams.get("kind");
  const kinds = kind && (KINDS as readonly string[]).includes(kind) ? ([kind] as SuggestKind[]) : undefined;
  const limit = kinds ? 10 : 8;
  return NextResponse.json(
    { items: suggest(q, lang, limit, kinds ? limit : 3, kinds) },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
