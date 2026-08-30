import Link from "next/link";
import type { Lang, RaveEvent } from "@/lib/types";
import { COUNTRY_FR, EVENTS, genreSlug, slugify, cardEvent, eventPath } from "@/lib/data";
import { countryName } from "@/lib/countries";
import { fmtDayLong } from "@/lib/format";
import { pick, type FestivalGuide as Guide } from "@/lib/guides";
import { getDict, langPrefix } from "@/lib/i18n";
import { PLACES } from "@/lib/places";
import EventCard from "./EventCard";

/* Long-form body for the few festivals that are really a week-long programme.
   Rendered full width, below the two-column event layout, the reader has
   already seen the dates and the ticket box by the time they get here. */
export default function FestivalGuide({
  guide,
  e,
  lang,
  today,
}: {
  guide: Guide;
  e: RaveEvent;
  lang: Lang;
  today?: string;
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const byId = (id: number) => EVENTS.find((x) => x.id === id);
  const subEvents = guide.subEventIds.map(byId).filter((x): x is NonNullable<typeof x> => !!x);
  // Only link geography we actually have a page for, a dead /rave-party/{city}
  // costs more than the link is worth.
  const place = PLACES.find((pl) => (pl.match ?? [pl.label]).some((m) => slugify(m) === slugify(e.city)));
  const countrySlug = slugify(COUNTRY_FR[e.country] ?? e.country);

  return (
    <div className="guide">
      <div className="divider" />

      <section>
        <span className="eyebrow">{t("guide.numbers")}</span>
        <div className="guide-stats">
          {guide.stats.map((s) => (
            <div className="stat" key={s.label.fr}>
              <b>{pick(s.value, lang)}</b>
              <span>{pick(s.label, lang)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-md">{t("guide.howitworks")}</h2>
        <div className="grid grid-3">
          {guide.blocks.map((b) => (
            <div className="info-card" key={b.title.fr}>
              <h3>{pick(b.title, lang)}</h3>
              <p>{pick(b.body, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-md">{t("guide.strands")}</h2>
        <div className="guide-strands">
          {guide.strands.map((s) => (
            <div className="info-card" key={s.name}>
              <h3>
                {s.name} <em>{pick(s.when, lang)}</em>
              </h3>
              <p>{pick(s.body, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-md">{t("guide.daybyday")}</h2>
        <ol className="guide-days">
          {guide.days.map((d) => {
            const events = d.eventIds.map(byId).filter((e): e is NonNullable<typeof e> => !!e);
            return (
              <li className="info-card" key={d.date}>
                <span className="guide-day-date">{fmtDayLong(d.date, lang)}</span>
                <h3>{pick(d.title, lang)}</h3>
                <p>{pick(d.body, lang)}</p>
                {events.length > 0 && (
                  <div className="linkfarm" style={{ marginTop: 14 }}>
                    {events.map((e) => (
                      <Link key={e.id} href={`${p}${eventPath(e)}`}>
                        🎟 {e.title}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {subEvents.length > 0 && (
        <section>
          <h2 className="h-md">{t("guide.onradar")}</h2>
          <p className="lead" style={{ fontSize: ".95rem", marginBottom: 20 }}>
            {t("guide.onradar.lead")}
          </p>
          <div className="grid grid-4">
            {subEvents.map((e) => (
              <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="h-md">{t("guide.tickets")}</h2>
        <div className="guide-passes">
          {guide.passes.map((x) => (
            <div className="info-card" key={x.name.fr}>
              <span className="guide-pass-price">{pick(x.price, lang)}</span>
              <h3>{pick(x.name, lang)}</h3>
              <p>{pick(x.body, lang)}</p>
            </div>
          ))}
        </div>
        <p className="guide-note">{pick(guide.passNote, lang)}</p>
      </section>

      <section>
        <h2 className="h-md">{t("guide.venues")}</h2>
        <div className="guide-strands">
          {guide.venues.map((v) => (
            <div className="info-card" key={v.name}>
              <h3>
                {v.slug ? <Link href={`${p}/lieux/${v.slug}`}>{v.name}</Link> : v.name}
              </h3>
              <p>{pick(v.body, lang)}</p>
            </div>
          ))}
        </div>
        <p className="guide-note">{pick(guide.venueNote, lang)}</p>
      </section>

      <section>
        <h2 className="h-md">{t("guide.practical")}</h2>
        <div className="grid grid-2">
          {guide.practical.map((b) => (
            <div className="info-card" key={b.title.fr}>
              <h3>{pick(b.title, lang)}</h3>
              <p>{pick(b.body, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-md">{t("city.faq")}</h2>
        <div className="grid grid-2">
          {guide.faq.map((f) => (
            <div className="info-card" key={f.q.fr}>
              <h3>{pick(f.q, lang)}</h3>
              <p>{pick(f.a, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-md">{t("guide.explore")}</h2>
        <div className="linkfarm">
          {place && (
            <>
              <Link href={`${p}/rave-party/${place.slug}`}>📍 Rave party {place.label}</Link>
              <Link href={`${p}/festival/${place.slug}`}>🎪 Festivals {place.label}</Link>
            </>
          )}
          <Link href={`${p}/pays/${countrySlug}`}>🌍 {countryName(e.country, lang)}</Link>
          {e.genres.map((g) => (
            <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
              {g}
            </Link>
          ))}
          {guide.venues
            .filter((v) => v.slug)
            .map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                🏛 {v.name}
              </Link>
            ))}
          <Link href={`${p}/explore`}>🔎 {t("nav.explore")}</Link>
        </div>
      </section>

      <div className="notice" style={{ marginTop: 32 }}>
        <span>{t("guide.officialnote")}</span>
        <a href={guide.programUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
          {t("guide.programlink")}
        </a>
        <a href={guide.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          {t("guide.sitelink")}
        </a>
      </div>
    </div>
  );
}
