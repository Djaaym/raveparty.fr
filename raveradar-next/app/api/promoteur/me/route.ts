import { NextResponse } from "next/server";
import { parseProfile, passwordIssue, publicAccount } from "@/lib/accounts";
import { isConfigured, listSubmissions, memoryOnlyAllowed, saveAccount } from "@/lib/accounts-store";
import { SESSION_SECONDS, hashPassword, issueSession, verifyPassword } from "@/lib/promoter-auth";
import { adminFlagCookie, currentAccount, sessionCookies, withCookies } from "@/lib/promoter-session";
import { isAdminEmail } from "@/lib/admin-auth";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** Ce compte ouvre-t-il la console ? Mêmes conditions que `lib/admin-access.ts`, adresse
 *  déclarée **et** compte approuvé. Une seule définition ici, elle sert au drapeau rendu
 *  par le GET et au témoin lisible posé avec la session. */
const isAdmin = (a: { email: string; status: string }): boolean =>
  a.status === "approved" && isAdminEmail(a.email);

/** Le compte courant, ses dépôts, et l'état d'ouverture du service. `open` est faux
 *  quand aucun magasin n'est configuré : la page l'annonce au lieu de proposer un
 *  formulaire qui répondrait 501 à la validation. */
export async function GET(req: Request) {
  const open = isConfigured() || memoryOnlyAllowed();
  const account = await currentAccount(req).catch(() => null);
  if (!account) return NextResponse.json({ open, account: null }, { headers: { "cache-control": "no-store" } });

  const submissions = await listSubmissions(account.email).catch(() => []);
  const admin = isAdmin(account);
  const res = NextResponse.json(
    {
      open,
      account: publicAccount(account),
      submissions,
      /* Sert uniquement à afficher le lien vers la console : l'autorisation, elle, est
         revérifiée par les routes de `/admin` et de `/api/event-edit`. */
      admin,
    },
    { headers: { "cache-control": "no-store" } },
  );

  /* Un GET qui pose un cookie est inhabituel, et c'est délibéré : le témoin lisible
     `rr_admin_on` est né après les sessions déjà ouvertes, et il n'accorde rien. Le
     rafraîchir ici évite d'avoir à se reconnecter pour que le bouton « Modifier »
     apparaisse sur les fiches, et il suit le statut du compte, donc un retrait
     d'administration l'efface au premier passage. */
  return withCookies(res, [adminFlagCookie(admin, SESSION_SECONDS)]);
}

/**
 * Modifier son profil, et éventuellement son mot de passe.
 *
 * Le changement de mot de passe exige l'ancien : un cookie volé ne doit pas suffire à
 * verrouiller le vrai propriétaire dehors. Il change aussi le marqueur porté par les
 * sessions (`lib/promoter-auth.ts`), donc toutes les autres se ferment, et le cookie de
 * *cette* requête est réémis, sans quoi on se déconnecterait soi-même en changeant.
 */
export async function PATCH(req: Request) {
  if (tooManyRequests(`me:${clientKey(req)}`, 10)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const account = await currentAccount(req).catch(() => null);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = parseProfile(body, account);
  if ("errors" in parsed) return NextResponse.json({ error: "invalid", fields: parsed.errors }, { status: 400 });

  const next = { ...account, ...parsed.profile };
  let reissue = false;

  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword) {
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (!verifyPassword(current, account.password)) {
      return NextResponse.json({ error: "invalid", fields: { currentPassword: "wrong" } }, { status: 400 });
    }
    const issue = passwordIssue(newPassword, account.email, next.name);
    if (issue) return NextResponse.json({ error: "invalid", fields: { newPassword: issue } }, { status: 400 });
    next.password = hashPassword(newPassword);
    reissue = true;
  }

  try {
    await saveAccount(next);
  } catch (err) {
    console.error("[promoteur] écriture du profil impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  const res = NextResponse.json({ ok: true, account: publicAccount(next) });
  // Le mot de passe a changé, donc le marqueur du cookie aussi : sans réémission, on se
  // déconnecterait soi-même en changeant son propre mot de passe.
  return reissue
    ? withCookies(res, sessionCookies(issueSession(next.email, next.password), SESSION_SECONDS, isAdmin(next)))
    : res;
}
