import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { artistBySlug, eventsForArtist, relatedArtists } from "@/lib/artists";
import { countryLabel } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { showsForArtist } from "@/lib/shows";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

export default function ArtistPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const artist = artistBySlug(slug);
  if (!artist) return notFound();

  const events = eventsForArtist(slug);
  const shows = showsForArtist(slug);
  const related = relatedArtists(artist);
  const countries = artist.countries.map((c) => countryLabel(c, lang)).join(", ");

  const intro =
    lang === "fr"
      ? `${artist.name} est programmé sur ${events.length} événement${events.length > 1 ? "s" : ""} référencé${
          events.length > 1 ? "s" : ""
        } sur RaveRadar (${countries}). Découvre ses prochaines dates, line-ups et billetterie.`
      : `${artist.name} is booked for ${events.length} event${events.length > 1 ? "s" : ""} listed on RaveRadar (${countries}). Discover upcoming dates, line-ups and tickets.`;

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Link href={`${p}/artistes`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {t("nav.artists")}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "16px 0 10px" }}>
            <div className="avatar">{artist.name.trim()[0]}</div>
            <h1 className="h-lg" style={{ margin: 0 }}>
              {artist.name}
            </h1>
          </div>
          <p className="lead">{intro}</p>

          <div className="card-meta" style={{ marginTop: 16 }}>
            {artist.genres.map((g) => (
              <Link key={g} href={`${p}/genres/${g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`} className="gpill">
                {g}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("artist.dates")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shows.map((s) => (
              <Link key={s.slug} href={`${p}/show/${s.slug}`} className="mini">
                <div style={{ minWidth: 92 }}>
                  <h4 style={{ color: "var(--cyan)", fontFamily: "var(--f-mono)", fontSize: ".8rem" }}>
                    {fmtDate(s.date, lang)}
                  </h4>
                </div>
                <div>
                  <h4>{s.venue}</h4>
                  <span>
                    {s.city}, {countryLabel(s.country, lang)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("artist.playsat")}
          </h2>
          <div className="grid grid-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>

          {related.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("artist.discover")}
              </h2>
              <div className="artist-grid">
                {related.map((a) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`} className="artist-tile">
                    <div className="av">{a.name.trim()[0]}</div>
                    <div>
                      <b>{a.name}</b>
                      <span>
                        {a.eventIds.length} {t("artist.events")}
                      </span>
                    </div>
                  </Link>
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
