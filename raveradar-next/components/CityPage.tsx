import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, EVENTS, addDays, genreSlug, isPast, nextUp, rankGenres, todayISO, cardEvent } from "@/lib/data";
import { PLACES, placeBySlug, eventsForPlace } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { placeCopy } from "@/lib/pagecopy";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import JsonLd from "./JsonLd";

export default function CityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const today = todayISO();
  const here = eventsForPlace(place);
  // Upcoming and finished as two lists: `eventsForPlace` returns upcoming-first, but
  // run together the archive just trails off the end of the grid with no boundary.
  const liveHere = here.filter((e) => !isPast(e, today));
  const pastHere = here.filter((e) => isPast(e, today));
  const hereIds = new Set(here.map((e) => e.id));
  const nearby = nextUp(4, EVENTS.filter((e) => !hereIds.has(e.id)), today);

  // Sibling places of the same kind, the horizontal mesh between geo pages.
  const siblings = PLACES.filter((x) => x.slug !== place.slug && x.kind === place.kind).slice(0, 12);
  const otherKinds = PLACES.filter((x) => x.kind !== place.kind).slice(0, 12);
  // Genres that actually have something on here, so the link always lands on content.
  const localGenres = ALL_GENRES.filter((g) => here.some((e) => e.genres.includes(g)));

  /* L'intro et la FAQ étaient un gabarit qui n'interpolait que le nom du lieu :
     242 pages qui se ressemblaient mot pour mot, et une FAQ qui répondait « consulte
     la liste ci-dessus » à « y a-t-il une soirée ce week-end ». Tout sort désormais du
     calendrier du lieu (salles, styles, tarifs réels, prochaines dates), donc le texte
     change avec lui et ne peut pas se périmer sans qu'on le voie. Voir `placeCopy()`. */
  const soon = liveHere.filter((e) => e.date <= addDays(today, 15));
  const copy = placeCopy(lang, {
    label: place.label,
    kind: place.kind,
    live: liveHere,
    past: pastHere,
    genres: rankGenres(here).slice(0, 4),
    soon,
  });
  const intro = copy.context;
  const faq = copy.faq;

  const trail: [string, string][] = [
    [t("nav.cities"), "/villes"],
    [place.label, `/rave-party/${place.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(here, lang, `Rave party ${place.label}`, today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            Rave party <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="city" value={place.slug} label={place.label} />

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/festival/${place.slug}`}>
              🎪 {lang === "fr" ? "Festivals" : "Festivals"} {place.label}
            </Link>
            <Link href={`${p}/rave-party/ce-week-end`}>📅 {lang === "fr" ? "Ce week-end" : "This weekend"}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {lang === "fr" ? "Autour de moi" : "Near me"}</Link>
            {localGenres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g} {place.label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("city.events")} · {place.label}
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

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.otherplaces")}
          </h2>
          <div className="linkcols">
            {[...siblings, ...otherKinds].map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                Rave party {x.label}
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
