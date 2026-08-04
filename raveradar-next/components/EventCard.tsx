import Link from "next/link";
import type { Lang, RaveEvent } from "@/lib/types";
import { cardBg, countryLabel, eventPath, imageThumb, isPast, lastDay } from "@/lib/data";
import { fmtDate, imageAlt, priceLabel } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import FavButton from "./FavButton";

/**
 * Deliberately not a client component: a listing renders 24+ of these, and shipping
 * framer-motion plus a router hook per card was the bulk of the JS on every hub page.
 * The hover lift lives in CSS (`.card:hover`) and only the heart stays interactive.
 *
 * The card used to be a `<div onClick={router.push}>`, which meant no crawler ever saw
 * the link, and neither did a keyboard or a middle click. The title now carries a real
 * `<a href>` and `.card-link::after` stretches it back over the whole card.
 */
export default function EventCard({
  e,
  lang,
  today,
  href,
}: {
  e: RaveEvent;
  lang: Lang;
  today?: string;
  /** Overrides the destination — an artist page sends its cards to that artist's
   *  `/show/` page, which is the more specific answer to "when do they play". */
  href?: string;
}) {
  const t = getDict(lang);
  const to = href ?? `${langPrefix(lang)}${eventPath(e)}`;
  // `today` is passed down from the server where the distinction matters on screen;
  // without it the card just renders neutrally.
  const done = today ? isPast(e, today) : false;
  const multiDay = lastDay(e) !== e.date;
  const thumb = imageThumb(e);

  return (
    <article className={`card${done ? " is-past" : ""}`}>
      <span className="card-genre-bar" />
      {/* The heart is a sibling of the link, never a descendant: an interactive element
          inside an <a> is invalid and swallows the click. */}
      <div className="card-top">
        <span className={`tag ${done ? "past" : "type"}`}>{done ? t("event.pastbadge") : e.type}</span>
        <FavButton id={e.id} />
      </div>
      <Link className="card-link" href={to}>
        <div className="card-media">
          {thumb ? (
          // 560×700 is exactly what the crop is encoded at — declaring it keeps the 4:5
          // box reserved before the file lands, so a grid never reflows as it fills in.
            <img
              className="poster"
              src={thumb}
              alt={imageAlt(e, lang)}
              width={560}
              height={700}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="poster" style={{ backgroundImage: cardBg(e) }} />
          )}
          <div className="card-body">
            <div className="card-date">
              {multiDay
                ? `${fmtDate(e.date, lang)} → ${fmtDate(lastDay(e), lang)}`
                : `${fmtDate(e.date, lang)} · ${e.time}`}
            </div>
            <h3 className="card-title">{e.title}</h3>
            <div className="card-loc">
              📍 {e.city}, {countryLabel(e.country, lang)}
            </div>
            <div className="card-foot">
              <div className="card-meta">
                {e.genres.slice(0, 2).map((g) => (
                  <span className="gpill" key={g}>
                    {g}
                  </span>
                ))}
              </div>
              <div className="card-price">{priceLabel(e, lang)}</div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
