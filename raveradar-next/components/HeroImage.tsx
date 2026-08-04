import type { Lang, RaveEvent } from "@/lib/types";
import { cardBg, imageFull } from "@/lib/data";
import { imageAlt } from "@/lib/format";

/**
 * The full-bleed poster behind an event or show hero. Shared by `EventDetail` and
 * `ShowPage` because both used to paint the card's 560×700 crop as a CSS background —
 * a 2.5× upscale of a thumbnail, invisible to image search, and an LCP the preload
 * scanner could never find. Falls back to the genre gradient when there is no file.
 */
export default function HeroImage({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const src = imageFull(e);
  if (!src) return <div className="bg" style={{ backgroundImage: cardBg(e) }} />;
  return (
    <img
      className="bg"
      src={src}
      alt={imageAlt(e, lang)}
      decoding="async"
      /* Lowercased on purpose: react-dom 18 doesn't know `fetchPriority` and would pass
         the camelCase spelling through as an unknown prop, with a dev warning. */
      {...{ fetchpriority: "high" }}
    />
  );
}
