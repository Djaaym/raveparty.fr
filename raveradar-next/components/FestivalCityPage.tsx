import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, FESTIVALS, addDays, genreSlug, isPast, nextUp, rankGenres, todayISO, cardEvent } from "@/lib/data";
import { PLACES, placeBySlug, eventsForPlace } from "@/lib/places";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { placeCopy } from "@/lib/pagecopy";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function FestivalCityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const today = todayISO();
  const here = eventsForPlace(place).filter((e) => e.type === "Festival");
  const hereIds = new Set(here.map((e) => e.id));
  const liveHere = here.filter((e) => !isPast(e, today));
  const pastHere = here.filter((e) => isPast(e, today));
  const nearby = nextUp(4, FESTIVALS.filter((e) => !hereIds.has(e.id)), today);

  // Only link genres and venues that this place actually has content for.
  const localGenres = ALL_GENRES.filter((g) => here.some((e) => e.genres.includes(g)));
  const localVenues = VENUES.filter((v) => v.eventIds.some((id) => hereIds.has(id)));
  const otherPlaces = PLACES.filter((x) => x.slug !== place.slug);

  /* Même correction que sur `/rave-party/{lieu}` : l'intro n'interpolait que le nom, et
     la FAQ affirmait des généralités que rien ne vérifiait, « la saison court de mai à
     septembre » sur toutes les pages, et l'existence de festivals gratuits même là où
     il n'y en a aucun. Tout vient maintenant des festivals du lieu. */
  const copy = placeCopy(lang, {
    label: place.label,
    kind: place.kind,
    live: liveHere,
    past: pastHere,
    genres: rankGenres(here).slice(0, 4),
    soon: liveHere.filter((e) => e.date <= addDays(today, 15)),
    scope: "festival",
  });
  const intro = copy.context;
  const faq = copy.faq;

  const trail: [string, string][] = [
    [t("nav.cities"), "/villes"],
    [place.label, `/rave-party/${place.slug}`],
    [`Festivals ${place.label}`, `/festival/${place.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(here, lang, `Festival ${place.label}`, today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            Festivals <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/${place.slug}`}>📍 Rave party {place.label}</Link>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            {localGenres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g} {place.label}
              </Link>
            ))}
            {localVenues.map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                🏛 {v.name}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {lang === "fr" ? "Festivals à venir" : "Upcoming festivals"} · {place.label}
          </h2>
          {liveHere.length > 0 ? (
            <div className="grid grid-4">
              {liveHere.map((e) => (
                <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
              ))}
            </div>
          ) : (
            <div className="info-card">
              <p className="lead" style={{ fontSize: "1rem", marginBottom: 18 }}>
                {t("city.empty")}
              </p>
              <Link href={`${p}/account`} className="btn btn-primary">
                🔔 {t("city.alert")}
              </Link>
            </div>
          )}

          {pastHere.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")} · {place.label}
              </h2>
              <div className="grid grid-4">
                {pastHere.slice(0, 8).map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.nearby")}
          </h2>
          <div className="grid grid-4">
            {nearby.map((e) => (
              <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("cities.festbycity")}
          </h2>
          <div className="linkcols">
            {otherPlaces.map((x) => (
              <Link key={x.slug} href={`${p}/festival/${x.slug}`}>
                Festival {x.label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.faq")}
          </h2>
          <div className="grid grid-2">
            {faq.map(([q, a]) => (
              <div className="info-card" key={q}>
                <h3 className="h-md" style={{ fontSize: "1.1rem", marginBottom: 10 }}>
                  {q}
                </h3>
                <p className="lead" style={{ fontSize: ".95rem" }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
