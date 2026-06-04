import Link from "next/link";
import type { Lang, RaveEvent } from "@/lib/types";
import { EVENTS, GENRES, cardBg, countryLabel, eventDescL, slugify } from "@/lib/data";
import { fmtDate, priceLabel } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import FavButton from "./FavButton";
import MiniMap from "./MiniMap";

export default function EventDetail({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const g = GENRES[e.genres[0]];
  const related = EVENTS.filter((x) => x.id !== e.id && x.genres.some((gg) => e.genres.includes(gg))).slice(0, 4);

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <Link href={`${p}/explore`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            {t("event.back")}
          </Link>

          <div className="event-hero" style={{ marginTop: 16 }}>
            <div className="bg" style={{ backgroundImage: cardBg(e) }} />
            <div>
              <div className="event-hero-meta">
                <span className="tag type">{e.type}</span>
                {e.genres.map((gg) => (
                  <span className="tag type" key={gg}>
                    {gg}
                  </span>
                ))}
              </div>
              <h1 className="h-xl" style={{ fontSize: "clamp(2.2rem,6vw,4.5rem)" }}>
                {e.title}
              </h1>
              <p className="lead" style={{ marginTop: 10, color: "var(--white)" }}>
                📍 {e.venue} · {e.city}, {countryLabel(e.country, lang)}
              </p>
            </div>
          </div>

          <div className="event-layout">
            <div>
              <div className="info-card">
                <h3 className="h-md">{t("event.about")}</h3>
                <p className="lead" style={{ fontSize: "1rem" }}>
                  {eventDescL(e, lang)}
                </p>
              </div>

              <div className="info-card">
                <h3 className="h-md">{t("event.lineup")}</h3>
                <div className="lineup">
                  {e.lineup.map((a, i) => (
                    <Link
                      href={`${p}/artistes/${slugify(a.trim())}`}
                      className={`artist ${i === 0 ? "headliner" : ""}`}
                      key={a}
                    >
                      <div className="av">{a.trim()[0]}</div>
                      <div>
                        <b>{a.trim()}</b>
                        <span>{i === 0 ? t("event.headliner") : t("event.djset")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="info-card">
                <h3 className="h-md">{t("event.gallery")}</h3>
                <div className="gallery">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ backgroundImage: `linear-gradient(${130 + i * 25}deg, ${g.c1}, ${g.c2})` }} />
                  ))}
                </div>
              </div>

              <div className="info-card">
                <h3 className="h-md">{t("event.location")}</h3>
                <MiniMap lat={e.lat} lng={e.lng} />
              </div>
            </div>

            <aside>
              <div className="ticket-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="eyebrow">{t("event.tickets")}</span>
                  <FavButton id={e.id} />
                </div>
                <div className="h-lg" style={{ margin: "14px 0 4px" }}>
                  {priceLabel(e, lang)}
                </div>
                <p style={{ color: "var(--grey)", fontSize: ".85rem", marginBottom: 18 }}>{t("event.fromprice")}</p>
                <div className="ticket-row">
                  <span>{t("event.date")}</span>
                  <b>{fmtDate(e.date, lang)}</b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.venue")}</span>
                  <b>{e.venue}</b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.city")}</span>
                  <b>
                    {e.city}, {countryLabel(e.country, lang)}
                  </b>
                </div>
                <a href="#" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
                  {t("event.gettickets")}
                </a>
                <Link href={`${p}/map`} className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
                  {t("event.viewmap")}
                </Link>
              </div>
            </aside>
          </div>

          <div className="divider" />
          <h2 className="h-md" style={{ marginBottom: 24 }}>
            {t("event.related")}
          </h2>
          <div className="grid grid-4">
            {related.map((r) => (
              <EventCard key={r.id} e={r} lang={lang} />
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
