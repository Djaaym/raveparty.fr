import { getAccount, getSubmission, saveAccount, saveSubmission } from "@/lib/accounts-store";
import { actionTokenOk } from "@/lib/promoter-auth";
import { sendMail } from "@/lib/subscribers";
import { geocode } from "@/lib/geocode";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
// Runtime Node explicite : cette route envoie du mail, et le transport SMTP a besoin
// des sockets de Node, que le runtime edge n'offre pas.
export const runtime = "nodejs";

/**
 * Les liens que le propriétaire reçoit par mail : approuver un compte, refuser, publier
 * un dépôt, l'écarter.
 *
 * Oui, c'est un GET qui change un état. C'est assumé, et c'est le but : la décision doit
 * se prendre depuis un téléphone, en un clic, sans ouvrir de session ni retrouver un mot
 * de passe. Ce qui tient la porte, c'est le HMAC de `lib/promoter-auth.ts`, lié à la
 * *cible* et à l'*action* : le lien « approuver » d'un compte n'approuve que celui-là, et
 * il ne se devine pas. Un lien rejoué ne fait rien de plus qu'annoncer l'état courant.
 *
 * La réponse est une page, pas du JSON : elle est lue par un humain dans un navigateur.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = (url.searchParams.get("a") ?? "").slice(0, 20);
  const token = url.searchParams.get("t");
  const email = (url.searchParams.get("e") ?? "").slice(0, 254).toLowerCase();
  const subId = (url.searchParams.get("s") ?? "").slice(0, 60);

  if (email && (action === "approve" || action === "reject")) return decideAccount(email, action, token);
  if (subId && (action === "publish" || action === "reject")) return decideSubmission(subId, action, token);
  return page("Lien incomplet", "Ce lien ne désigne ni un compte ni un dépôt.", false);
}

/* ---------------------------------------------------------------------------
   Comptes
--------------------------------------------------------------------------- */

async function decideAccount(email: string, action: "approve" | "reject", token: string | null) {
  if (!actionTokenOk(email, action, token)) return page("Lien invalide", "Ce lien a expiré ou a été modifié.", false);

  const account = await getAccount(email).catch(() => null);
  if (!account) return page("Compte introuvable", `Aucun compte pour ${escapeHtml(email)}.`, false);

  const next = action === "approve" ? "approved" : "rejected";
  if (account.status === next) {
    return page("Déjà fait", `Le compte de ${escapeHtml(account.name)} est déjà ${label(next)}.`, true);
  }

  account.status = next;
  account.decidedAt = new Date().toISOString();
  try {
    await saveAccount(account);
  } catch {
    return page("Échec de l'écriture", "Le magasin n'a pas répondu, réessaie dans un instant.", false);
  }

  const fr = account.lang !== "en";
  const told = await sendMail(
    account.email,
    action === "approve"
      ? fr ? "Ton compte promoteur RaveRadar est validé" : "Your RaveRadar promoter account is approved"
      : fr ? "Ta demande de compte promoteur RaveRadar" : "Your RaveRadar promoter account request",
    action === "approve"
      ? fr
        ? `Bonjour ${account.contact},\n\nLe compte de ${account.name} est validé. Tu peux déposer tes événements ici :\n${SITE_URL}/organizer\n\nChaque dépôt est relu avant publication : dates, line-up, lieu et tarif sont vérifiés, c'est la règle du catalogue et elle vaut pour tout le monde.\n\nÀ bientôt,\nRaveRadar`
        : `Hi ${account.contact},\n\n${account.name} is approved. You can submit your events here:\n${SITE_URL}/en/organizer\n\nEvery submission is reviewed before publication: dates, line-up, venue and price are checked. That rule applies to everyone.\n\nSee you,\nRaveRadar`
      : fr
        ? `Bonjour ${account.contact},\n\nOn ne peut pas valider le compte de ${account.name} pour le moment. Si tu penses que c'est une erreur, réponds à ce message avec un lien vers vos événements passés.\n\nRaveRadar`
        : `Hi ${account.contact},\n\nWe can't approve ${account.name} at the moment. If you think that's a mistake, reply to this message with a link to your past events.\n\nRaveRadar`,
  ).catch(() => false);

  return page(
    action === "approve" ? "Compte approuvé" : "Compte refusé",
    `${escapeHtml(account.name)} (${escapeHtml(account.email)}) est maintenant ${label(next)}. ` +
      // Sans transport mail configuré, `sendMail` rend false : annoncer un envoi qui n'a
      // pas eu lieu laisserait croire que l'intéressé est prévenu, alors qu'il ne verra
      // son statut changer qu'en rouvrant son compte.
      (told ? "Un mail vient de partir." : "Aucun mail envoyé (pas de transport configuré), préviens-le à la main."),
    true,
  );
}

/* ---------------------------------------------------------------------------
   Dépôts d'événement
--------------------------------------------------------------------------- */

async function decideSubmission(id: string, action: "publish" | "reject", token: string | null) {
  if (!actionTokenOk(id, action, token)) return page("Lien invalide", "Ce lien a expiré ou a été modifié.", false);

  const sub = await getSubmission(id).catch(() => null);
  if (!sub) return page("Dépôt introuvable", "Ce dépôt n'existe plus.", false);

  const next = action === "publish" ? "published" : "rejected";
  if (sub.status === next) return page("Déjà fait", `« ${escapeHtml(sub.title)} » est déjà ${label(next)}.`, true);

  sub.status = next;
  sub.decidedAt = new Date().toISOString();
  // Une seule salle, un seul appel : c'est le bon moment pour géocoder, plutôt qu'un lot
  // entier au moment de l'export. Un échec n'empêche pas la décision, il est signalé.
  if (next === "published" && typeof sub.lat !== "number") {
    const hit = await geocode(sub).catch(() => null);
    if (hit) {
      sub.lat = hit.lat;
      sub.lng = hit.lng;
      sub.geocodeQuery = hit.query;
    }
  }
  try {
    await saveSubmission(sub);
  } catch {
    return page("Échec de l'écriture", "Le magasin n'a pas répondu, réessaie dans un instant.", false);
  }

  const fr = sub.lang !== "en";
  const to = sub.contactEmail || sub.owner;
  const told = await sendMail(
    to,
    fr ? `RaveRadar, ${sub.title}` : `RaveRadar, ${sub.title}`,
    action === "publish"
      ? fr
        ? `Bonne nouvelle : « ${sub.title} » est en ligne sur RaveRadar.\n\n${SITE_URL}/explore?q=${encodeURIComponent(sub.title)}\n\nUn détail à corriger ? Réponds à ce message.\n\nRaveRadar`
        : `Good news: "${sub.title}" is live on RaveRadar.\n\n${SITE_URL}/en/explore?q=${encodeURIComponent(sub.title)}\n\nSomething to fix? Just reply.\n\nRaveRadar`
      : fr
        ? `« ${sub.title} » n'a pas pu être publié en l'état. Il manque le plus souvent une source vérifiable (page officielle, billetterie) ou une information confirmée. Réponds à ce message avec le lien et on reprend le dossier.\n\nRaveRadar`
        : `"${sub.title}" couldn't be published as is. Usually a verifiable source (official page, ticketing) or a confirmed detail is missing. Reply with the link and we'll pick it up again.\n\nRaveRadar`,
  ).catch(() => false);

  // Le dépôt marqué « publié » ne met rien en ligne tout seul : le catalogue est un
  // fichier TypeScript, et la fiche y entre par `.research/merge.py` comme les autres.
  // Le statut dit « validé et à saisir », c'est une file de travail, pas un CMS.
  return page(
    action === "publish" ? "Dépôt validé" : "Dépôt écarté",
    `« ${escapeHtml(sub.title)} » est ${label(next)}.` +
      (next === "published" && typeof sub.lat !== "number"
        ? " Aucune coordonnée trouvée pour cette salle : à saisir à la main."
        : "") +
      (action === "publish" ? " Il n\u2019est pas en ligne pour autant : lance .research/from-submissions.py puis merge.py pour le saisir au catalogue." : "") +
      (told ? "" : " Aucun mail envoyé (pas de transport configuré)."),
    true,
  );
}

/* ---------------------------------------------------------------------------
   Rendu
--------------------------------------------------------------------------- */

const label = (s: string) =>
  ({ approved: "approuvé", rejected: "refusé", published: "vérifié, à saisir", pending: "en attente", suspended: "suspendu" })[s] ?? s;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function page(title: string, detail: string, ok: boolean) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)} - RaveRadar</title>
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050608;color:#F3F3F8;
      font:16px/1.55 system-ui,sans-serif;padding:24px}
 .box{max-width:520px;border:1px solid #23252F;border-radius:24px;padding:32px;background:#12131B}
 h1{font-size:1.4rem;margin:0 0 12px;color:${ok ? "#C6FF3D" : "#FF2D9B"}}
 p{color:#A7A9B8;margin:0 0 20px}
 a{color:#19E7FF}
</style></head><body><div class="box">
 <h1>${escapeHtml(title)}</h1><p>${detail}</p>
 <a href="${SITE_URL}/">Retour sur RaveRadar</a>
</div></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
