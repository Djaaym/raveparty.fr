import { NextResponse } from "next/server";
import { parseAlert } from "@/lib/alerts";
import { providerName, subscribe } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

// Nothing here is cacheable, and the surrounding layouts export `revalidate`.
export const dynamic = "force-dynamic";

/**
 * Health check for the alerts subsystem. Reports which configuration keys the running
 * function can actually see (names only, never values) because "the endpoint answers
 * 501" gives an operator no way to tell a missing variable from one scoped to the wrong
 * environment or saved after the last deploy. Knowing the site uses Brevo is inferable
 * from a subscription mail anyway, so this leaks nothing a secret depends on.
 */
/**
 * Asks Brevo what it thinks of our credentials, from inside the deployed function,
 * the only vantage point that matters, since Vercel's egress IP is not ours to predict.
 * Returns a classification, never Brevo's raw message: that message quotes the calling
 * IP address, and a public endpoint has no business publishing it.
 */
async function probeBrevo() {
  const key = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!key || !listId) return { reachable: false, verdict: "variables_absentes" };

  const get = (path: string) =>
    fetch(`https://api.brevo.com/v3${path}`, { headers: { "api-key": key, accept: "application/json" } });

  try {
    const account = await get("/account");
    if (!account.ok) {
      const body = await account.text().catch(() => "");
      // Brevo answers 401 both for a bad key and for a key called from an IP the account
      // has not authorised. Only the message distinguishes them, and the fix is different.
      const verdict =
        account.status === 401 && /IP address/i.test(body)
          ? "ip_non_autorisee, passe le compte Brevo en « No IP review » : app.brevo.com/security/authorised_ips"
          : account.status === 401
            ? "cle_refusee, BREVO_API_KEY n'est pas reconnue"
            : `compte_http_${account.status}`;
      return { reachable: true, verdict };
    }

    const list = await get(`/contacts/lists/${listId}`);
    if (!list.ok) return { reachable: true, verdict: `liste_${listId}_introuvable (HTTP ${list.status})` };

    const attrs = await get("/contacts/attributes");
    const known = new Set(
      (((await attrs.json().catch(() => ({}))) as { attributes?: { name: string }[] }).attributes ?? []).map(
        (a) => a.name,
      ),
    );
    const missing = ["ALERT_KIND", "ALERT_VALUE", "ALERT_LABEL", "ALERT_SUMMARY", "LANG"].filter((a) => !known.has(a));

    // Brevo accepts POST /v3/smtp/email and answers 201 even when the sender is not a
    // validated one, the message is only dropped later, so a 201 is not proof of
    // delivery. Checking the sender list is the only way to catch that from here.
    // Verdicts only: ALERTS_NOTIFY_FROM is the owner's address, not something a public
    // endpoint should echo back.
    let expediteur = "non_configure";
    const from = process.env.ALERTS_NOTIFY_FROM?.toLowerCase();
    if (from) {
      const senders = await get("/senders");
      if (!senders.ok) expediteur = `illisible (HTTP ${senders.status})`;
      else {
        const list = ((await senders.json().catch(() => ({}))) as { senders?: { email: string; active?: boolean }[] })
          .senders ?? [];
        const match = list.find((s) => s.email?.toLowerCase() === from);
        expediteur = match
          ? match.active === false
            ? "declare_mais_inactif"
            : "valide"
          : `absent_de_la_liste (${list.length} expediteur(s) declare(s)), ajoute-le dans Expediteurs, domaine, IP, ou mets l'adresse de ton compte Brevo`;
      }
    }

    return {
      reachable: true,
      verdict: "ok",
      // Not fatal, subscribers.ts retries without them, but it silently loses the
      // detail of every alert, so it is worth surfacing.
      attributsManquants: missing,
      expediteur,
    };
  } catch (err) {
    return { reachable: false, verdict: err instanceof Error ? err.message.slice(0, 120) : "reseau" };
  }
}

export async function GET(req: Request) {
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
    // Opt-in: the plain check stays a free local read, the probe costs two round-trips
    // to Brevo and shouldn't fire on every curl.
    ...(new URL(req.url).searchParams.has("probe") && provider === "brevo" ? { brevo: await probeBrevo() } : {}),
  });
}

/**
 * Creates one alert subscription. The response codes are what the form renders:
 * 200 subscribed · 400 bad address · 429 slow down · 501 no provider configured ·
 * 502 the provider refused. `501` matters, it is the difference between telling
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
