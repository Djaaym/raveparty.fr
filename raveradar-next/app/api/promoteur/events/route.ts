import { NextResponse } from "next/server";
import type { EventSubmission } from "@/lib/accounts";
import { countRecentSubmissions, createSubmission, listSubmissions, saveSubmission } from "@/lib/accounts-store";
import { actionToken, newId } from "@/lib/promoter-auth";
import { currentAccount } from "@/lib/promoter-session";
import { parseSubmission } from "@/lib/submissions";
import { plainRich } from "@/lib/richtext";
import { MAX_ATTACHMENT_BYTES, notifyOwner, ownerAddress, type MailAttachment } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
// Runtime Node explicite : cette route envoie du mail, et le transport SMTP a besoin
// des sockets de Node, que le runtime edge n'offre pas.
export const runtime = "nodejs";

/** Combien de dépôts sur 24 h. Un promoteur annonce sa saison, pas son catalogue :
 *  au-delà, c'est un import, et un import se discute avant de se relire. */
const PER_DAY = 12;

export async function GET(req: Request) {
  const account = await currentAccount(req).catch(() => null);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const submissions = await listSubmissions(account.email).catch(() => []);
  return NextResponse.json({ submissions }, { headers: { "cache-control": "no-store" } });
}

/**
 * Le dépôt d'un événement par un promoteur approuvé.
 *
 * **Un dépôt validé ne publie rien tout seul.** Le catalogue est un fichier TypeScript
 * relu à la main, et la règle de contenu du projet (rien d'inventé, tout vérifié) ne
 * s'assouplit pas parce que l'information vient de l'organisateur : elle vient juste
 * d'une meilleure source. Ce que cette route apporte, c'est un canal propre, structuré
 * et attribué, à la place d'un mail libre.
 */
export async function POST(req: Request) {
  if (tooManyRequests(`sub:${clientKey(req)}`, 6)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const account = await currentAccount(req).catch(() => null);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (account.status !== "approved") {
    return NextResponse.json({ error: "not_approved", status: account.status }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company) return NextResponse.json({ ok: true }); // honeypot

  const today = new Date().toISOString().slice(0, 10);
  const parsed = parseSubmission(body, today);
  if ("errors" in parsed) return NextResponse.json({ error: "invalid", fields: parsed.errors }, { status: 400 });

  const since = new Date(Date.now() - 86400_000).toISOString();
  if ((await countRecentSubmissions(account.email, since).catch(() => 0)) >= PER_DAY) {
    return NextResponse.json({ error: "quota" }, { status: 429 });
  }

  const submission: EventSubmission = {
    ...parsed.fields,
    id: newId(),
    owner: account.email,
    status: "pending",
    createdAt: new Date().toISOString(),
    contactEmail: parsed.fields.contactEmail || account.email,
  };

  try {
    await createSubmission(submission);
  } catch (err) {
    console.error("[promoteur] écriture du dépôt impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  // Comme à l'inscription : le dépôt est enregistré quoi qu'il arrive, on note seulement
  // si l'annonce est partie, pour que la console signale ce que personne n'a vu passer.
  submission.notified = await sendToOwner(submission, account.name, poster(body));
  if (!submission.notified) await saveSubmission(submission).catch(() => undefined);
  return NextResponse.json({ ok: true, submission });
}

/**
 * L'affiche, si elle tient dans un mail.
 *
 * Le formulaire envoie le fichier en `data:` URL. Il n'y a nulle part où stocker une
 * image (le site sert `public/` depuis le dépôt), donc elle part en pièce jointe au
 * propriétaire, qui la range dans `public/posters/` s'il retient l'événement. Trop
 * lourde, on garde le nom du fichier et on le dit : c'est ce que faisait déjà l'ancien
 * formulaire, mais c'était son seul mode, et « glisse ton artwork ici » promettait alors
 * un envoi qui n'avait pas lieu.
 */
function poster(body: Record<string, unknown>): MailAttachment | null {
  const data = typeof body.posterData === "string" ? body.posterData : "";
  const name = typeof body.posterFile === "string" ? body.posterFile.slice(0, 120) : "affiche";
  const m = data.match(/^data:image\/(png|jpe?g|webp|avif);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const content = m[2];
  // 4 caractères de base64 pour 3 octets : on mesure la taille réelle avant de décoder,
  // pas après, sinon le plafond arrive une fois la mémoire déjà prise.
  if ((content.length * 3) / 4 > MAX_ATTACHMENT_BYTES) return null;
  const safe = name.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80) || `affiche.${m[1]}`;
  return { filename: /\.[a-z0-9]{3,4}$/i.test(safe) ? safe : `${safe}.${m[1] === "jpeg" ? "jpg" : m[1]}`, content };
}

async function sendToOwner(s: EventSubmission, promoter: string, file: MailAttachment | null): Promise<boolean> {
  const link = (action: "publish" | "reject") =>
    `${SITE_URL}/api/promoteur/approve?s=${encodeURIComponent(s.id)}&a=${action}&t=${actionToken(s.id, action)}`;

  const price = s.price
    ? `${s.price} ${s.currency}${s.priceNote === "estimated" ? " (estimé, à confirmer)" : ""}`
    : "non communiqué";

  const lines = [
    `Dépôt d'événement par ${promoter} <${s.owner}>.`,
    "",
    `Titre      : ${s.title}`,
    `Type       : ${s.type}`,
    `Genre      : ${s.genre}${s.subgenres.length ? ` (${s.subgenres.join(", ")})` : ""}`,
    `Date       : ${s.date}${s.endDate ? ` → ${s.endDate}` : ""} ${s.time}${s.endTime ? `-${s.endTime}` : ""}`,
    `Lieu       : ${s.venue}, ${s.city}, ${s.country}`,
    `Adresse    : ${s.address || "non renseignée"}`,
    `Tarif      : ${price}`,
    `Billetterie: ${s.ticketUrl || "aucune"}`,
    `Affiche    : ${file ? `en pièce jointe (${file.filename})` : s.posterUrl || s.posterFile || "aucune"}`,
    `Line-up    : ${s.lineup.join(", ") || "à venir"}`,
    `Contact    : ${s.contactEmail}`,
    "",
    "Description (FR) :",
    plainRich(s.desc),
    ...(s.descEn ? ["", "Description (EN) :", plainRich(s.descEn)] : []),
    "",
    "----",
    "À vérifier avant saisie : page officielle, billetterie, jour de la semaine de la date.",
    `Valider : ${link("publish")}`,
    `Écarter : ${link("reject")}`,
  ];

  const sent = await notifyOwner(
    `RaveRadar, dépôt : ${s.title} (${s.city})`,
    lines.join("\n"),
    file ? [file] : [],
  );
  if (!sent) {
    console.error(
      `[promoteur] mail non parti (destinataire ${ownerAddress() || "vide"}), dépôt enregistré :\n` +
        lines.join("\n"),
    );
  }
  return sent;
}
