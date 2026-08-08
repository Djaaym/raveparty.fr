import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RENAMED_EVENT_SLUGS } from "@/lib/renamed";

/**
 * Redirections 301 des slugs d'événements renommés.
 *
 * Le slug d'un événement dérive de son titre : corriger un titre casse l'URL déjà
 * indexée, et une URL gagnée ne doit jamais retomber en 404 (même principe que les
 * anciennes pages `/show/`). Le mapping vit dans `lib/renamed.ts`.
 *
 * Ici et pas dans la page : un `permanentRedirect()` à l'intérieur d'une page
 * **prérendue** renvoie un 308 dépourvu d'en-tête `Location` — la destination
 * n'existe plus que dans un méta-refresh du HTML. Le middleware répond avant tout
 * rendu, donc avec un vrai `Location`, et sans forcer la route en dynamique (ce qui
 * aurait coûté la génération statique des 300+ fiches festival).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = /^(\/en)?\/(event|festival)\/([^/]+)\/?$/.exec(pathname);
  if (m) {
    const to = RENAMED_EVENT_SLUGS[m[3]];
    if (to) {
      const url = req.nextUrl.clone();
      url.pathname = `${m[1] ?? ""}/${m[2]}/${to}`;
      return NextResponse.redirect(url, 301);
    }
  }
  return NextResponse.next();
}

/* Ne réveiller le middleware que sur les deux arborescences concernées. */
export const config = {
  matcher: ["/event/:path*", "/festival/:path*", "/en/event/:path*", "/en/festival/:path*"],
};
