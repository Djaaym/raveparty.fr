import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { countryLabel, genreSlug, isPast, slugify, todayISO, venueLabelL } from "@/lib/data";
import { VENUES, venueBySlug, eventsForVenue } from "@/lib/venues";
import { showsForVenue } from "@/lib/shows";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { sameAs, venueSocials } from "@/lib/socials";
import { breadcrumbJsonLd, venueJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import SocialsCard from "./SocialsCard";
import JsonLd from "./JsonLd";

export default function VenuePage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const venue = venueBySlug(slug);
  if (!venue) return notFound();

  const today = todayISO();
  const name = venueLabelL(venue.name, venue.nameEn, lang);
  const social = venueSocials(slug);
  const events = eventsForVenue(slug);
  const live = events.filter((e) => !isPast(e, today));
  const genres = [...new Set(events.flatMap((e) => e.genres))];
  // Every artist who has played or will play here — the venue↔artist mesh.
  const artists = [...new Map(showsForVenue(slug).map((s) => [s.artistSlug, s])).values()].slice(0, 30);
  const sameCity = VENUES.filter((v) => v.slug !== venue.slug && v.city === venue.city);
  const place = PLACES.find((x) =>
    (x.match ?? [x.label]).some(
      (m) => slugify(m) === slugify(venue.city) || slugify(m) === slugify(venue.region ?? ""),
    ),
  );

  const intro =
    lang === "fr"
      ? `Tout l'agenda de ${name} à ${venue.city} : ${live.length} date${live.length > 1 ? "s" : ""} à venir, line-ups, horaires et billetterie officielle.`
      : `The full agenda for ${name} in ${venue.city}: ${live.length} upcoming date${live.length > 1 ? "s" : ""}, line-ups, times and official ticketing.`;

  const trail: [string, string][] = [
    [t("nav.venues"), "/lieux"],
    [name, `/lieux/${venue.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          venueJsonLd({ ...venue, name }, live, lang, sameAs(social)),
          breadcrumbJsonLd(trail, lang),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("venue.eyebrow")} · {venue.city}, {countryLabel(venue.country, lang)}
          </span>
          <h1 className="h-lg" style={{ margin: "10px 0 8px" }}>
            {name}
          </h1>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 18 }}>
            {place && <Link href={`${p}/rave-party/${place.slug}`}>📍 Rave party {place.label}</Link>}
            {genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
              </Link>
            ))}
          </div>

          {social && (
            <div style={{ marginTop: 28 }}>
              <SocialsCard s={social} lang={lang} owner="event" />
            </div>
          )}

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("venue.agenda")}
          </h2>
          <div className="grid grid-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} today={today} />
            ))}
          </div>

          {artists.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("venue.artists")}
              </h2>
              <div className="linkfarm">
                {artists.map((s) => (
                  <Link key={s.artistSlug} href={`${p}/show/${s.slug}`}>
                    {s.artistName}
                  </Link>
                ))}
              </div>
            </>
          )}

          {sameCity.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("venue.samecity")} {venue.city}
              </h2>
              <div className="linkfarm">
                {sameCity.map((v) => (
                  <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                    {venueLabelL(v.name, v.nameEn, lang)}
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
