import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN } from "@/lib/admin-auth";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** La console est-elle configurée, et ce navigateur est-il déjà entré ? */
export async function GET() {
  return NextResponse.json({
    configured: ADMIN.isConfigured(),
    authed: ADMIN.verifyToken(cookies().get(ADMIN.cookie)?.value),
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
