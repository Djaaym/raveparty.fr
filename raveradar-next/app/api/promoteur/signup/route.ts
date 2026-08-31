import { NextResponse } from "next/server";
import { parseSignup, publicAccount, type PromoterAccount } from "@/lib/accounts";
import { createAccount, isConfigured, memoryOnlyAllowed, saveAccount } from "@/lib/accounts-store";
import { actionToken, hashPassword, issueSession, SESSION_SECONDS } from "@/lib/promoter-auth";
import { sessionCookies, withCookies } from "@/lib/promoter-session";
import { notifyOwner, ownerAddress } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
// Runtime Node explicite : cette route envoie du mail, et le transport SMTP a besoin
// des sockets de Node, que le runtime edge n'offre pas.
export const runtime = "nodejs";

/**
 * La création d'un compte promoteur.
 *
 * Le compte naît en `pending` : il peut se connecter et compléter son profil tout de
 * suite, il ne peut rien déposer avant que le propriétaire n'ait tranché. C'est la même
 * porte que partout ailleurs sur ce site, la règle de contenu ne se délègue pas.
 *
 * **Sans magasin configuré, on répond 501 plutôt que d'annoncer un compte créé.** C'est
 * le défaut que corrige déjà `/api/alerts` : un faux succès coûte plus cher qu'un refus
 * clair, et un mot de passe enregistré dans la mémoire d'une lambda disparaît au premier
 * redéploiement, sans que personne ne le sache. Le repli mémoire reste ouvert en
 * développement, où il est exactement ce qu'il faut.
 */
export async function POST(req: Request) {
  if (tooManyRequests(`signup:${clientKey(req)}`, 4)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Honeypot, comme les autres formulaires du site.
  if (typeof (body as Record<string, unknown>)?.company === "string" && (body as Record<string, unknown>).company) {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseSignup(body);
  if ("errors" in parsed) return NextResponse.json({ error: "invalid", fields: parsed.errors }, { status: 400 });

  if (!isConfigured() && !memoryOnlyAllowed()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const account: PromoterAccount = {
    ...parsed.input.profile,
    email: parsed.input.email,
    password: hashPassword(parsed.input.password),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  let created: boolean;
  try {
    created = await createAccount(account);
  } catch (err) {
    console.error("[promoteur] écriture du compte impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
  if (!created) return NextResponse.json({ error: "taken", fields: { email: "taken" } }, { status: 409 });

  // Le compte existe déjà à ce stade : on note seulement si l'annonce est partie, pour
  // que la console puisse signaler une demande que personne n'a vue passer.
  account.notified = await sendReviewRequest(account);
  if (!account.notified) await saveAccount(account).catch(() => undefined);

  // La session s'ouvre tout de suite : le compte est en attente, pas absent, et faire
  // ressaisir un mot de passe pour lire « en attente de validation » n'apporte rien.
  const token = issueSession(account.email, account.password);
  return withCookies(
    NextResponse.json({ ok: true, account: publicAccount(account) }),
    sessionCookies(token, SESSION_SECONDS),
  );
}

/** Le mail que le propriétaire reçoit, avec les deux liens d'un clic. Rend `false`
 *  quand rien n'est parti, ce que la console montre à côté de la demande. */
async function sendReviewRequest(a: PromoterAccount): Promise<boolean> {
  const link = (action: "approve" | "reject") =>
    `${SITE_URL}/api/promoteur/approve?e=${encodeURIComponent(a.email)}&a=${action}&t=${actionToken(a.email, action)}`;

  const lines = [
    "Nouvelle demande de compte promoteur.",
    "",
    `Structure   : ${a.name} (${a.kind})`,
    `Contact     : ${a.contact} <${a.email}>`,
    `Téléphone   : ${a.phone || "non renseigné"}`,
    `Basé à      : ${a.city}, ${a.country}`,
    `Site        : ${a.website || "non renseigné"}`,
    `Instagram   : ${a.instagram ? "@" + a.instagram : "non renseigné"}`,
    `SoundCloud  : ${a.soundcloud ? "@" + a.soundcloud : "non renseigné"}`,
    `Identifiant : ${a.legalId || "non renseigné"}`,
    "",
    "Présentation :",
    a.about,
    "",
    "----",
    `Approuver : ${link("approve")}`,
    `Refuser   : ${link("reject")}`,
  ];

  const sent = await notifyOwner(`RaveRadar, demande de compte : ${a.name}`, lines.join("\n"));
  if (!sent) {
    // Le compte existe quand même, il attend simplement une décision prise à la main.
    // Le journal serveur est alors la seule trace, autant qu'elle soit complète.
    console.error(
      `[promoteur] mail non parti (destinataire ${ownerAddress() || "vide"}), demande en attente :\n` +
        lines.join("\n"),
    );
  }
  return sent;
}
