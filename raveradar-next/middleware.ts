import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RENAMED_ARTIST_SLUGS, RENAMED_EVENT_SLUGS } from "@/lib/renamed";
import { editionRedirect } from "@/lib/editions";

/**
 * Redirections 301 des slugs d'événements **et d'artistes** renommés.
 *
 * Le slug d'un événement dérive de son titre : corriger un titre casse l'URL déjà
 * indexée, et une URL gagnée ne doit jamais retomber en 404 (même principe que les
 * anciennes pages `/show/`). Le mapping vit dans `lib/renamed.ts`.
 *
 * Ici et pas dans la page : un `permanentRedirect()` à l'intérieur d'une page
 * **prérendue** renvoie un 308 dépourvu d'en-tête `Location`, la destination
 * n'existe plus que dans un méta-refresh du HTML. Le middleware répond avant tout
 * rendu, donc avec un vrai `Location`, et sans forcer la route en dynamique (ce qui
 * aurait coûté la génération statique des 300+ fiches festival).
 *
 * Deuxième famille, la bascule d'édition : `editionRedirect()` (lib/editions.ts) rattrape
 * la forme suffixée d'un festival dont l'édition vient d'hériter du slug nu.
 */
/* Le jour de référence, à l'heure de Paris comme partout ailleurs sur le site : à minuit
   UTC un slug basculerait deux heures avant que la fiche ne se dise terminée. Le repli
   n'est pas décoratif : le runtime edge n'est pas tenu de fournir un ICU complet, et un
   `en-CA` rendu « 2026-09-01 » ici mais « 9/1/2026 » ailleurs comparerait n'importe quoi. */
const todayISO = (): string => {
  const d = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0, 10);
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = /^(\/en)?\/(event|festival)\/([^/]+)\/?$/.exec(pathname);
  if (m) {
    const to = RENAMED_EVENT_SLUGS[m[3]];
    // Seulement sous l'arborescence où l'ancienne URL vivait vraiment : rediriger
    // `/event/{slug}` d'un festival mènerait à un 404, ce qui vaut moins qu'un 404 direct.
    if (to && to.base === m[2]) {
      const url = req.nextUrl.clone();
      url.pathname = `${m[1] ?? ""}/${to.base}/${to.slug}`;
      return NextResponse.redirect(url, 301);
    }
    // Le slug nu appartient à l'édition en cours et change donc de main chaque année :
    // `/festival/sonar-2027`, indexée tant que 2026 était à venir, doit suivre le slug
    // nu le jour où 2027 en hérite, jamais tomber en 404. Le calcul se refait ici, avec
    // le jour courant, pour rester juste entre deux déploiements (voir lib/editions.ts).
    const edition = editionRedirect(m[2], m[3], todayISO());
    if (edition) {
      const url = req.nextUrl.clone();
      url.pathname = `${m[1] ?? ""}${edition}`;
      return NextResponse.redirect(url, 301);
    }
  }
  const a = /^(\/en)?\/artistes\/([^/]+)\/?$/.exec(pathname);
  if (a && a[2] in RENAMED_ARTIST_SLUGS) {
    const to = RENAMED_ARTIST_SLUGS[a[2]];
    const url = req.nextUrl.clone();
    // `null` = personne ne succède (un créneau b2b scindé en deux artistes, un nom de
    // soirée pris pour un artiste) : l'annuaire est la réponse honnête.
    url.pathname = `${a[1] ?? ""}/artistes${to ? `/${to}` : ""}`;
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

/* Ne réveiller le middleware que sur les deux arborescences concernées. */
export const config = {
  matcher: [
    "/event/:path*", "/festival/:path*", "/artistes/:path*",
    "/en/event/:path*", "/en/festival/:path*", "/en/artistes/:path*",
  ],
};
