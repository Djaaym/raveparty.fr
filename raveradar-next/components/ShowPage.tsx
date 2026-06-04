import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { EVENTS, cardBg, countryLabel, ticketUrl, slugify, eventPath } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { showBySlug, showsForArtist } from "@/lib/shows";
import { eventsForVenue } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import MiniMap from "./MiniMap";

export default function ShowPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const show = showBySlug(slug);
  if (!show) return notFound();
  const e = EVENTS.find((x) => x.id === show.eventId);
  if (!e) return notFound();

  const eventHref = `${p}${eventPath(e)}`;
  const otherDates = showsForArtist(show.artistSlug).filter((s) => s.slug !== show.slug).slice(0, 6);
  const sameVenue = eventsForVenue(show.venueSlug).filter((x) => x.id !== e.id).slice(0, 4);

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <Link href={`${p}/artistes/${show.artistSlug}`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {show.artistName}
          </Link>

          <div className="event-hero" style={{ marginTop: 16, minHeight: "44vh" }}>
            <div className="bg" style={{ backgroundImage: cardBg(e) }} />
            <div>
              <div className="event-hero-meta">
                {e.genres.map((g) => (
                  <span className="tag type" key={g}>
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="h-xl" style={{ fontSize: "clamp(2rem,5.5vw,4rem)" }}>
                <Link href={`${p}/artistes/${show.artistSlug}`} className="gradient-text">
                  {show.artistName}
                </Link>{" "}
                <span style={{ color: "var(--grey)" }}>{t("show.at")}</span>{" "}
                <Link href={`${p}/lieux/${show.venueSlug}`}>{show.venue}</Link>
              </h1>
              <p className="lead" style={{ marginTop: 10, color: "var(--white)" }}>
                📅 {fmtDate(e.date, lang)} · {e.time} · 📍 {show.city}, {countryLabel(show.country, lang)}
              </p>
            </div>
          </div>

          <div className="event-layout">
            <div>
              <div className="info-card">
                <h2 className="h-md">{t("show.fulllineup")}</h2>
                <div className="lineup" style={{ marginTop: 14 }}>
                  {e.lineup.map((a, i) => (
                    <Link href={`${p}/artistes/${slugify(a.trim())}`} className={`artist ${a.trim() === show.artistName ? "headliner" : ""}`} key={a}>
                      <div className="av">{a.trim()[0]}</div>
                      <div>
                        <b>{a.trim()}</b>
                        <span>{a.trim() === show.artistName ? t("event.headliner") : t("event.djset")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={eventHref} className="btn btn-ghost" style={{ marginTop: 18 }}>
                  {t("show.fullevent")}
                </Link>
              </div>

              <div className="info-card">
                <h2 className="h-md">{t("event.location")}</h2>
                <MiniMap lat={e.lat} lng={e.lng} />
              </div>

              {otherDates.length > 0 && (
                <div className="info-card">
                  <h2 className="h-md" style={{ marginBottom: 14 }}>
                    {t("show.otherdates")} {show.artistName}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {otherDates.map((s) => (
                      <Link key={s.slug} href={`${p}/show/${s.slug}`} className="mini">
                        <div>
                          <h4>{s.venue}</h4>
                          <span>
                            {s.city} · {fmtDate(s.date, lang)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside>
              <div className="ticket-box">
                <span className="eyebrow">{t("event.tickets")}</span>
                <div className="ticket-row" style={{ marginTop: 12 }}>
                  <span>{t("event.date")}</span>
                  <b>{fmtDate(e.date, lang)}</b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.venue")}</span>
                  <b>{show.venue}</b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.city")}</span>
                  <b>
                    {show.city}, {countryLabel(show.country, lang)}
                  </b>
                </div>
                {ticketUrl(e) ? (
                  <a href={ticketUrl(e)!} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
                    {t("show.tickets")}
                  </a>
                ) : (
                  <div className="btn btn-ghost btn-block" style={{ marginTop: 18, cursor: "default" }}>
                    {t("event.freeentry")}
                  </div>
                )}
                <Link href={`${p}/lieux/${show.venueSlug}`} className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
                  {show.venue} →
                </Link>
              </div>
            </aside>
          </div>

          {sameVenue.length > 0 && (
            <>
              <div className="divider" />
              <h2 className="h-md" style={{ marginBottom: 24 }}>
                {t("show.atvenue")} · {show.venue}
              </h2>
              <div className="grid grid-4">
                {sameVenue.map((x) => (
                  <EventCard key={x.id} e={x} lang={lang} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
