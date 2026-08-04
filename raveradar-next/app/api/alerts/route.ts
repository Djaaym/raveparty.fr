import { NextResponse } from "next/server";
import { parseAlert } from "@/lib/alerts";
import { providerName, subscribe } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

// Nothing here is cacheable, and the surrounding layouts export `revalidate`.
export const dynamic = "force-dynamic";

/**
 * Health check for the alerts subsystem. Reports which configuration keys the running
 * function can actually see — names only, never values — because "the endpoint answers
 * 501" gives an operator no way to tell a missing variable from one scoped to the wrong
 * environment or saved after the last deploy. Knowing the site uses Brevo is inferable
 * from a subscription mail anyway, so this leaks nothing a secret depends on.
 */
export async function GET() {
  const present = (k: string) => Boolean(process.env[k]);
  const brevo = ["BREVO_API_KEY", "BREVO_LIST_ID"];
  const resend = ["RESEND_API_KEY", "RESEND_AUDIENCE_ID"];
  const notify = ["ALERTS_NOTIFY_TO", "ALERTS_NOTIFY_FROM"];
  const provider = providerName();

  return NextResponse.json({
    configured: Boolean(provider),
    provider,
    // Only the incomplete sets are worth reporting: a fully-set provider needs no advice.
    missing: provider
      ? []
      : brevo.some(present)
        ? brevo.filter((k) => !present(k))
        : resend.some(present)
          ? resend.filter((k) => !present(k))
          : ["BREVO_API_KEY", "BREVO_LIST_ID (ou RESEND_API_KEY + RESEND_AUDIENCE_ID)"],
    organizerMail: notify.every(present) ? "ok" : `manque ${notify.filter((k) => !present(k)).join(", ")}`,
  });
}

/**
 * Creates one alert subscription. The response codes are what the form renders:
 * 200 subscribed · 400 bad address · 429 slow down · 501 no provider configured ·
 * 502 the provider refused. `501` matters — it is the difference between telling
 * someone they're on the list and telling them the list isn't plugged in yet.
 */
export async function POST(req: Request) {
  if (tooManyRequests(clientKey(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Honeypot: a real visitor never fills a field they cannot see. Answer 200 so a bot
  // gets no signal about which of its submissions were dropped.
  if (typeof (body as Record<string, unknown>)?.company === "string" && (body as Record<string, string>).company) {
    return NextResponse.json({ ok: true, provider: null });
  }

  const alert = parseAlert(body);
  if (!alert) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (!providerName()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const result = await subscribe(alert);
  if (!result.ok) {
    // The provider's own message can carry the submitted address; keep it in the
    // server log and hand the client a code it can translate.
    console.error("[alerts] provider refused", result.status, result.reason);
    return NextResponse.json({ error: "provider" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, provider: providerName() });
}
