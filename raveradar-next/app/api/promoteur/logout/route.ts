import { NextResponse } from "next/server";
import { clearCookies, withCookies } from "@/lib/promoter-session";

export const dynamic = "force-dynamic";

/** Fermer la session. Rien à supprimer côté serveur, le cookie *est* la session : on le
 *  vide, et il n'y a pas d'état résiduel à nettoyer. */
export function POST() {
  return withCookies(NextResponse.json({ ok: true }), clearCookies());
}
