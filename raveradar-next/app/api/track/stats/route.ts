import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isConfigured, verifyToken } from "@/lib/track-auth";
import { dayKey } from "@/lib/track";
import { FILTER_KEYS, applyFilters, buildReport, sessionize, type Filters } from "@/lib/track-report";
import { hitCounts, pingStore, readHits, storeInfo, deleteDays } from "@/lib/track-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Widest range the dashboard may ask for in one go. Beyond this the function is
 *  reading and sessionizing more than it can hold. */
const MAX_DAYS = 180;

function guard(): NextResponse | null {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "not_configured", hint: "Définis TRACKING_PASSWORD dans les variables d'environnement." },
      { status: 501 },
    );
  }
  if (!verifyToken(cookies().get(COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function range(params: URLSearchParams): { from: string; to: string } {
  const today = dayKey(Date.now());
  let to = params.get("to") ?? "";
  let from = params.get("from") ?? "";
  if (!ISO.test(to)) to = today;
  if (!ISO.test(from)) from = dayKey(Date.parse(to + "T00:00:00Z") - 6 * 86400_000);
  if (from > to) [from, to] = [to, from];
  // Clamp rather than reject: a too-wide range is a slider dragged too far, not an error
  // worth an empty screen.
  const span = (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400_000;
  if (span > MAX_DAYS) from = dayKey(Date.parse(to + "T00:00:00Z") - MAX_DAYS * 86400_000);
  return { from, to };
}

/**
 * The whole dashboard in one response: KPIs, series, every breakdown, and the most
 * recent visits in full.
 *
 * One request rather than a dozen because the expensive half is reading and sessionizing
 * the range, doing that once and counting fifteen ways is far cheaper than fifteen
 * endpoints each re-reading Redis, and it guarantees every panel describes the same
 * set of visits.
 */
export async function GET(req: Request) {
  const denied = guard();
  if (denied) return denied;

  const params = new URL(req.url).searchParams;
  const { from, to } = range(params);

  const filters: Filters = {};
  for (const k of FILTER_KEYS) {
    const v = params.get(k);
    if (v) filters[k] = v.slice(0, 200);
  }

  let hits;
  try {
    hits = await readHits(from, to);
  } catch (err) {
    return NextResponse.json(
      { error: "store_unreachable", detail: err instanceof Error ? err.message.slice(0, 200) : "réseau" },
      { status: 502 },
    );
  }

  const all = sessionize(hits);
  const filtered = applyFilters(all, filters);
  const report = buildReport(filtered, all, { from, to, now: Date.now() });

  return NextResponse.json({
    ...report,
    filters,
    store: storeInfo(),
    hits: hits.length,
  });
}

/**
 * Store health + how much data each day actually holds. Split out from the report
 * because it costs its own round-trips and only the settings panel wants it.
 */
export async function POST(req: Request) {
  const denied = guard();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as { action?: string; days?: unknown };

  if (body.action === "counts") {
    const { from, to } = range(new URL(req.url).searchParams);
    return NextResponse.json({ counts: await hitCounts(from, to), store: storeInfo(), ping: await pingStore() });
  }

  // Erasure. Explicit day list only, no "delete everything" shortcut, because the one
  // time you fat-finger this there is no undo and no backup.
  if (body.action === "delete") {
    const days = Array.isArray(body.days) ? body.days.filter((d): d is string => typeof d === "string" && ISO.test(d)) : [];
    if (!days.length) return NextResponse.json({ error: "no_days" }, { status: 400 });
    return NextResponse.json({ deleted: await deleteDays(days.slice(0, 400)) });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
