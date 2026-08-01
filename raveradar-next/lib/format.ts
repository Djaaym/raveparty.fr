import type { Lang, RaveEvent } from "./types";
import { DICT } from "./i18n";

export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(DICT[lang].locale, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

/** "Mercredi 21 octobre" / "Wednesday 21 October" — used by the day-by-day guides. */
export function fmtDayLong(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  const s = d.toLocaleDateString(DICT[lang].locale, { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function priceLabel(e: RaveEvent, lang: Lang): string {
  if (e.priceNote === "unknown") return DICT[lang]["dyn.priceunknown"];
  if (e.price === 0) return DICT[lang]["dyn.free"];
  return `${e.priceNote === "estimated" ? "≈ " : ""}${e.currency}${e.price}`;
}
