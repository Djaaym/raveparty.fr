import { NextResponse } from "next/server";
import type { Hit, RawHit } from "@/lib/track";
import { applyUtm, classifyReferrer, isBot, langOfPath, parseHit, parseUa } from "@/lib/track";
import { pushHits, storeInfo } from "@/lib/track-store";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A visit is a handful of hits and the tracker batches them; 60 requests a minute is
 *  far above a human clicking through the site and far below a flood. */
const MAX_PER_MINUTE = 60;

/** One request may not carry more than this, the tracker never sends near it. */
const MAX_HITS = 30;

/**
 * The collector. Open by necessity: a beacon fired from a visitor's browser cannot
 * authenticate, so the defences are shape (`parseHit` stores nothing it doesn't
 * recognise), volume (rate limit + batch cap), and the fact that nothing here is ever
 * echoed back, the response is always 204, whatever happened.
 *
 * That last point is deliberate. A tracker that surfaces errors is a tracker that breaks
 * pages: a 500 in the console of every visitor, a red network row, a retry storm. If the
 * store is down the hit is lost and the server log says so; the reader sees nothing.
 *
 * The client asserts what only it can know (which page, which session, how long it was
 * looked at). Everything derivable from the request (the clock, the country, the
 * device) is filled in here, because a client-supplied country is a client-supplied
 * lie waiting to happen.
 */
export async function POST(req: Request) {
  const ip = clientKey(req);
  if (tooManyRequests(`track:${ip}`, MAX_PER_MINUTE)) return new NextResponse(null, { status: 204 });

  // sendBeacon posts a Blob, fetch posts JSON, read as text and parse once, so both
  // paths land in the same place.
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const raw = (body as { hits?: unknown })?.hits;
  if (!Array.isArray(raw) || !raw.length) return new NextResponse(null, { status: 204 });

  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new NextResponse(null, { status: 204 });

  const { dev, br, os } = parseUa(ua);

  // Vercel resolves geography at the edge and hands it over in headers. Absent locally,
  // and absent on any other host, hence the optional fields rather than a fake default.
  const header = (k: string) => {
    const v = req.headers.get(k);
    return v ? decodeURIComponent(v).slice(0, 60) : undefined;
  };
  const cc = header("x-vercel-ip-country")?.toUpperCase();
  const city = header("x-vercel-ip-city");
  const reg = header("x-vercel-ip-country-region");

  const selfHost = (() => {
    try {
      return new URL(req.url).hostname;
    } catch {
      return "raveparty.fr";
    }
  })();

  const now = Date.now();
  const hits: Hit[] = [];

  for (const item of raw.slice(0, MAX_HITS)) {
    const parsed: RawHit | null = parseHit(item);
    if (!parsed) continue;

    const acquisition = applyUtm(classifyReferrer(parsed.ref, selfHost), parsed.utm);

    hits.push({
      ...parsed,
      // The client's clock is not trusted for ordering, a device an hour out of sync
      // would scatter its hits across the timeline and corrupt every session.
      t: now,
      k: parsed.k!,
      sid: parsed.sid!,
      vid: parsed.vid!,
      p: parsed.p!,
      lang: langOfPath(parsed.p!),
      src: acquisition.src,
      med: acquisition.med,
      dev,
      br,
      os,
      ...(cc ? { cc } : {}),
      ...(city ? { city } : {}),
      ...(reg ? { reg } : {}),
    });
  }

  if (hits.length) await pushHits(hits);
  return new NextResponse(null, { status: 204 });
}

/** Lets the dashboard (and a curl) tell "nothing is being collected" from "nothing has
 *  happened yet". Names and verdicts only, never a value, never an address. */
export async function GET() {
  const info = storeInfo();
  return NextResponse.json({
    collecting: true,
    store: info.name,
    persistent: info.persistent,
    retentionDays: info.retentionDays,
  });
}
