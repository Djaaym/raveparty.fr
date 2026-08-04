import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { artistBySlug, eventsForArtist, relatedArtists } from "@/lib/artists";
import { countryLabel, genreSlug, isPast, slugify, todayISO, venueLabelL } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { fmtDate } from "@/lib/format";
import { showsForArtist } from "@/lib/shows";
import { getDict, langPrefix } from "@/lib/i18n";
import { artistJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import JsonLd from "./JsonLd";

export default function ArtistPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const artist = artistBySlug(slug);
  if (!artist) return notFound();

  const today = todayISO();
  const events = eventsForArtist(slug);
  const live = events.filter((e) => !isPast(e, today));
  const shows = showsForArtist(slug);
  const related = relatedArtists(artist, 12);
  const countries = artist.countries.map((c) => countryLabel(c, lang)).join(", ");
  // Cities the artist plays that we actually have a page for — links the artist mesh
  // into the geographic mesh without pointing at routes that don't exist.
  const cities = PLACES.filter((pl) =>
    events.some((e) =>
      (pl.match ?? [pl.label]).some((m) => slugify(m) === slugify(e.city) || slugify(m) === slugify(e.region ?? "")),
    ),
  );

  const intro =
    lang === "fr"
      ? live.length > 0
        ? `${artist.name} est programmé sur ${live.length} date${live.length > 1 ? "s" : ""} à venir référencée${
            live.length > 1 ? "s" : ""
          } sur RaveRadar (${countries}). Découvre les prochains festivals, line-ups et billetterie.`
        : `${artist.name} n'a pas de date à venir référencée sur RaveRadar pour le moment (${countries}). Retrouve ci-dessous ses dernières apparitions et active une alerte pour être prévenu de la prochaine.`
      : live.length > 0
        ? `${artist.name} is booked for ${live.length} upcoming date${live.length > 1 ? "s" : ""} listed on RaveRadar (${countries}). Browse the festivals, line-ups and tickets.`
        : `${artist.name} has no upcoming dates listed on RaveRadar right now (${countries}). Their latest appearances are below — set an alert to hear about the next one.`;

  const trail: [string, string][] = [
    [t("nav.artists"), "/artistes"],
    [artist.name, `/artistes/${artist.slug}`],
  ];

  return (
    <>
      <JsonLd data={[artistJsonLd(artist.name, artist.slug, live, lang), breadcrumbJsonLd(trail, lang)]} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />

          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "16px 0 10px" }}>
            <div className="avatar">{artist.name.trim()[0]}</div>
            <h1 className="h-lg" style={{ margin: 0 }}>
              {artist.name}
            </h1>
          </div>
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="artist" value={artist.slug} label={artist.name} />

          <div className="card-meta" style={{ marginTop: 16 }}>
            {artist.genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`} className="gpill">
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
                  <h4>{venueLabelL(s.venue, s.venueEn, lang)}</h4>
                  <span>
                    {s.city}, {countryLabel(s.country, lang)}
                    {s.endDate < today && ` · ${t("event.pastbadge")}`}
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
              <EventCard key={e.id} e={e} lang={lang} today={today} />
            ))}
          </div>

          {cities.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("artist.wherecities")}
              </h2>
              <div className="linkfarm">
                {cities.map((c) => (
                  <Link key={c.slug} href={`${p}/rave-party/${c.slug}`}>
                    {artist.name} {c.label}
                  </Link>
                ))}
              </div>
            </>
          )}

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
