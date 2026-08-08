import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import {
  ALL_GENRES,
  countryLabel,
  eventsForGenre,
  genreDescL,
  genreFromSlug,
  genreSlug,
  isPast,
  todayISO,
} from "@/lib/data";
import { PLACES } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import JsonLd from "./JsonLd";

export default function GenrePage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const genre = genreFromSlug(slug);
  if (!genre) return notFound();

  const today = todayISO();
  const events = eventsForGenre(genre);
  const live = events.filter((e) => !isPast(e, today));
  const done = events.filter((e) => isPast(e, today));
  const countries = [...new Set(live.map((e) => e.country))];
  // Artists who actually play this genre — turns the genre page into an artist hub.
  const artists = ARTISTS.filter((a) => a.genres.includes(genre))
    .sort((a, b) => b.eventIds.length - a.eventIds.length)
    .slice(0, 24);
  const otherGenres = ALL_GENRES.filter((g) => g !== genre);
  const places = PLACES.filter((x) => x.kind !== "ville" || x.vol >= 320).slice(0, 12);

  const intro =
    lang === "fr"
      ? `${live.length} événement${live.length > 1 ? "s" : ""} ${genre} à venir en Europe${
          countries.length ? ` (${countries.map((c) => countryLabel(c, lang)).join(", ")})` : ""
        }. Dates, line-ups, lieux et billetterie officielle — mis à jour en continu.`
      : `${live.length} upcoming ${genre} event${live.length > 1 ? "s" : ""} across Europe${
          countries.length ? ` (${countries.map((c) => countryLabel(c, lang)).join(", ")})` : ""
        }. Dates, line-ups, venues and official ticketing — updated continuously.`;

  const trail: [string, string][] = [
    [t("nav.genres"), "/genres"],
    [genre, `/genres/${genreSlug(genre)}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          ...(events.length ? [itemListJsonLd(events, lang, `${genre} — RaveRadar`)] : []),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg gradient-text" style={{ margin: "14px 0 8px" }}>
            {genre}
          </h1>
          <p className="lead" style={{ marginBottom: 8 }}>
            {genreDescL(genre, lang)}
          </p>
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="genre" value={slug} label={genre} />

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("hub.next")} · {genre}
          </h2>
          <div className="grid grid-4">
            {live.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} today={today} />
            ))}
          </div>

          {done.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")} · {genre}
              </h2>
              <div className="grid grid-4">
                {done.slice(0, 8).map((e) => (
                  <EventCard key={e.id} e={e} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          {artists.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("genre.artists")} {genre}
              </h2>
              <div className="linkfarm">
                {artists.map((a) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`}>
                    {a.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("genre.bycity")}
          </h2>
          <div className="linkcols">
            {places.map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                {genre} {x.label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("genre.othergenres")}
          </h2>
          <div className="linkfarm">
            {otherGenres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
