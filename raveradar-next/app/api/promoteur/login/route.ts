import { NextResponse } from "next/server";
import { normalizeEmail, publicAccount } from "@/lib/accounts";
import { getAccount } from "@/lib/accounts-store";
import { SESSION_SECONDS, issueSession, verifyPassword } from "@/lib/promoter-auth";
import { sessionCookies, withCookies } from "@/lib/promoter-session";
import { isAdminEmail } from "@/lib/admin-auth";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Ouvrir une session.
 *
 * Un seul message d'échec pour « adresse inconnue » et « mot de passe faux » : les
 * distinguer transforme le formulaire en test d'existence d'adresse. Le compte refusé ou
 * suspendu, lui, est bien distingué, mais **après** vérification du mot de passe, donc
 * l'information n'est donnée qu'à son propriétaire légitime.
 *
 * Le throttle est plus serré qu'ailleurs (cinq essais par minute et par adresse IP) :
 * c'est le seul point d'entrée du site où deviner sert à quelque chose. Il reste
 * best-effort et par instance, comme le reste de `lib/ratelimit.ts`.
 */
export async function POST(req: Request) {
  if (tooManyRequests(`login:${clientKey(req)}`, 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email.slice(0, 254) : "");
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return NextResponse.json({ error: "credentials" }, { status: 400 });

  let account;
  try {
    account = await getAccount(email);
  } catch (err) {
    console.error("[promoteur] lecture du compte impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  if (!account || !verifyPassword(password, account.password)) {
    return NextResponse.json({ error: "credentials" }, { status: 401 });
  }
  if (account.status === "rejected" || account.status === "suspended") {
    return NextResponse.json({ error: account.status, note: account.note ?? "" }, { status: 403 });
  }

  const token = issueSession(account.email, account.password);
  return withCookies(
    NextResponse.json({ ok: true, account: publicAccount(account) }),
    // Mêmes conditions que `lib/admin-access.ts` : adresse déclarée **et** compte
    // approuvé. Le témoin n'accorde rien, il évite juste un appel réseau sur les
    // milliers de fiches événement.
    sessionCookies(token, SESSION_SECONDS, account.status === "approved" && isAdminEmail(account.email)),
  );
}
