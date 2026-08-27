import Link from "next/link";
import type { CardEvent, Lang } from "@/lib/types";
/* `@/lib/display` et pas `@/lib/data` : cette carte est rendue aussi bien depuis un
   composant serveur que depuis /explore, /map ou la page d'accueil, qui sont clients.
   Le moindre import de `lib/data.ts` y ferait entrer les 870 événements du catalogue —
   218 Ko compressés de JavaScript pour afficher une vignette. Tout ce qui vient du
   catalogue (chemin, vignette, dégradé) est donc résolu en amont : voir `cardEvents()`. */
import { countryLabel, isPast, lastDay } from "@/lib/display";
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
}: {
  /** Un événement déjà préparé — `cardEvent(e)` côté serveur, `cardEvents()` pour une
   *  liste. C'est ce qui porte le chemin de la fiche, la vignette et le dégradé. */
  e: CardEvent;
  lang: Lang;
  today?: string;
}) {
  const t = getDict(lang);
  // Always the event itself. The artist page used to override this with a
  // `/show/{artist}-{venue}-{date}` URL; those pages are gone (301 → the event).
  const to = `${langPrefix(lang)}${e.path}`;
  // `today` is passed down from the server where the distinction matters on screen;
  // without it the card just renders neutrally.
  const done = today ? isPast(e, today) : false;
  const multiDay = lastDay(e) !== e.date;

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
          {e.thumb ? (
          // 560×700 is exactly what the crop is encoded at — declaring it keeps the 4:5
          // box reserved before the file lands, so a grid never reflows as it fills in.
            <img
              className="poster"
              src={e.thumb}
              alt={imageAlt(e, lang, e.isPhoto)}
              width={560}
              height={700}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="poster" style={{ backgroundImage: e.bg }} />
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
