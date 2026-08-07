import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, SESSION_SECONDS, isConfigured, issueToken, passwordOk, verifyToken } from "@/lib/track-auth";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Whether the dashboard is set up, and whether this browser is already let in. */
export async function GET() {
  return NextResponse.json({ configured: isConfigured(), authed: verifyToken(cookies().get(COOKIE)?.value) });
}

/** Exchanges the password for the signed cookie. Rate-limited hard: this is the one
 *  endpoint on the site where guessing repeatedly is the whole attack. */
export async function POST(req: Request) {
  if (tooManyRequests(`trackauth:${clientKey(req)}`, 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (!isConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 501 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!passwordOk((body as { password?: unknown })?.password)) {
    return NextResponse.json({ error: "denied" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    // Off in dev so `next dev` over http still logs in; on everywhere else, where the
    // cookie is the only thing standing between a network and the visitor journeys.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return res;
}

/** Log out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
