import { NextResponse } from "next/server";
import { isEmail, normalizeEmail } from "@/lib/alerts";
import { notifyOwner } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const field = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * An organizer's event submission. It is not published automatically — the catalogue is
 * hand-verified per the project's content rule — so this only has to reach a human.
 * That's a mail to the owner, which means the endpoint needs no store at all.
 */
export async function POST(req: Request) {
  if (tooManyRequests(clientKey(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (field(body.company)) return NextResponse.json({ ok: true }); // honeypot

  const email = normalizeEmail(field(body.email, 254));
  const title = field(body.title, 160);
  if (!isEmail(email) || !title) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const lines = [
    `Titre    : ${title}`,
    `Contact  : ${email}`,
    `Type     : ${field(body.type, 40)}`,
    `Genre    : ${field(body.genre, 40)}`,
    `Ville    : ${field(body.city, 80)}`,
    `Pays     : ${field(body.country, 80)}`,
    `Date     : ${field(body.date, 40)} ${field(body.time, 20)}`,
    `Lieu     : ${field(body.venue, 160)}`,
    `Line-up  : ${Array.isArray(body.lineup) ? body.lineup.map((x) => field(x, 80)).join(", ") : ""}`,
    `Billets  : ${field(body.ticketUrl, 300)}`,
    // Only the file name: there is nowhere to put the image itself yet, so the point
    // is to tell the owner there is artwork to ask this organizer for.
    `Affiche  : ${field(body.poster, 200) || "aucune"}`,
    "",
    field(body.desc, 2000),
  ];

  const sent = await notifyOwner(`RaveRadar — soumission : ${title}`, lines.join("\n"));
  if (!sent) {
    // The submission is in the server log either way, but don't claim it was received
    // by someone when no mailbox was configured to receive it.
    console.error("[organizer] no mail transport configured — submission follows\n" + lines.join("\n"));
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  return NextResponse.json({ ok: true });
}
