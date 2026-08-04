import { NextResponse } from "next/server";
import { parseAlert } from "@/lib/alerts";
import { providerName, subscribe } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

// Nothing here is cacheable, and the surrounding layouts export `revalidate`.
export const dynamic = "force-dynamic";

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
