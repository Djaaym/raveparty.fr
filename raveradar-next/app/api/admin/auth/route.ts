import { NextResponse } from "next/server";
import { ADMIN, adminEmails } from "@/lib/admin-auth";
import { adminAccess } from "@/lib/admin-access";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ce navigateur est-il déjà entré, et par quelle porte ?
 *
 * `configured` ne dit plus que l'état du mot de passe de secours : on entre aussi avec
 * le compte du propriétaire, donc la console reste ouvrable même sans lui, et la page
 * doit pouvoir le dire au lieu d'afficher un formulaire qui n'ouvrira rien.
 */
export async function GET(req: Request) {
  const access = await adminAccess(req);
  return NextResponse.json({
    configured: ADMIN.isConfigured(),
    authed: access.ok,
    via: access.via,
    email: access.email,
    // Les adresses déclarées : sans elles, quelqu'un qui ne peut pas entrer n'a aucun
    // moyen de savoir avec quel compte il devrait se connecter.
    admins: adminEmails(),
  });
}

/** Échange le mot de passe contre le cookie signé. Bridé serré : c'est le seul endroit
 *  où deviner en boucle est l'attaque entière. */
export async function POST(req: Request) {
  if (tooManyRequests(`adminauth:${clientKey(req)}`, 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (!ADMIN.isConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 501 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!ADMIN.passwordOk((body as { password?: unknown })?.password)) {
    return NextResponse.json({ error: "denied" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN.cookie, ADMIN.issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    // Éteint en développement pour que `next dev` en http laisse entrer ; posé partout
    // ailleurs, où ce cookie est la seule chose entre un réseau et la suppression d'un
    // compte.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN.sessionSeconds,
  });
  return res;
}

/** Sortir. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN.cookie, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
