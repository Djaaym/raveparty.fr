import { getAccount, getSubmission, saveAccount, saveSubmission } from "@/lib/accounts-store";
import { actionTokenOk } from "@/lib/promoter-auth";
import { sendMail } from "@/lib/subscribers";
import { accountDecisionMail, submissionDecisionMail } from "@/lib/promoter-mail";
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

  const mail = accountDecisionMail(account, action);
  const told = await sendMail(account.email, mail.subject, mail.text, [], mail.html).catch(() => false);

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

  const mail = submissionDecisionMail(sub, action);
  // Le contact de la fiche d'abord : c'est l'adresse que le promoteur a désignée pour
  // cet événement. À défaut, celle du compte, qui existe toujours.
  const told = await sendMail(sub.contactEmail || sub.owner, mail.subject, mail.text, [], mail.html).catch(
    () => false,
  );

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

/**
 * La page qu'on voit après avoir cliqué dans le mail.
 *
 * Elle est la suite du message, pas une réponse technique : un lien de décision pris
 * depuis un téléphone rend une page, donc elle porte la même marque que le mail qui l'a
 * envoyée (barre dégradée, carte anthracite, accent vert ou magenta selon l'issue).
 * Styles en ligne dans un `<style>` à elle, cette route ne passe pas par le layout du
 * site et n'a donc pas `globals.css` : les valeurs sont recopiées, comme dans
 * `lib/mail-template.ts` et pour la même raison.
 */
function page(title: string, detail: string, ok: boolean) {
  const accent = ok ? "#C6FF3D" : "#FF2D9B";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(title)} - RaveRadar</title>
<style>
 :root{--line:#23252F;--grey:#A7A9B8}
 *{box-sizing:border-box}
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050608;color:#F3F3F8;
      font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;padding:24px}
 .wrap{width:100%;max-width:520px}
 .brand{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding-left:4px}
 .brand img{width:30px;height:30px;border-radius:8px;display:block}
 .brand span{font-size:19px;font-weight:700;letter-spacing:-.01em}
 .bar{height:4px;border-radius:4px 4px 0 0;
      background:linear-gradient(90deg,#2F7BFF 0%,#8B5CFF 50%,#FF2D9B 100%)}
 .box{border:1px solid var(--line);border-top:none;border-radius:0 0 20px 20px;padding:30px 26px;background:#12131B}
 .kicker{margin:0 0 8px;font:11px/1 ui-monospace,'Courier New',monospace;letter-spacing:.16em;
         text-transform:uppercase;color:${accent}}
 h1{font-size:1.45rem;line-height:1.25;margin:0 0 12px}
 p{color:var(--grey);margin:0 0 22px}
 a.cta{display:inline-block;padding:12px 22px;border-radius:999px;border:1px solid var(--line);
       background:#181A24;color:#F3F3F8;text-decoration:none;font-weight:700;font-size:.95rem}
 .foot{margin:18px 4px 0;font-size:.78rem;color:#7D7F8E}
</style></head><body><div class="wrap">
 <div class="brand"><img src="${SITE_URL}/icon-96.png" alt="" width="30" height="30"><span>RaveRadar</span></div>
 <div class="bar"></div>
 <div class="box">
  <p class="kicker">${ok ? "C'est fait" : "Rien n'a changé"}</p>
  <h1>${escapeHtml(title)}</h1><p>${detail}</p>
  <a class="cta" href="${SITE_URL}/admin">Ouvrir la console</a>
 </div>
 <p class="foot">Page privée, atteinte depuis un lien signé. Elle n'est indexée nulle part.</p>
</div></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
