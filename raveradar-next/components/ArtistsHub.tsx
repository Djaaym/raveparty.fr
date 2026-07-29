import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, genreSlug, todayISO, upcoming } from "@/lib/data";
import { ARTISTS } from "@/lib/artists";
import { PLACES } from "@/lib/places";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function ArtistsHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming();
  const liveIds = new Set(live.map((e) => e.id));
  const next = live.slice(0, 4);
  // Artists booked on a date that hasn't happened yet — the useful half of the directory.
  const headliners = ARTISTS.filter((a) => a.eventIds.some((id) => liveIds.has(id))).sort(
    (a, b) => b.eventIds.length - a.eventIds.length,
  );
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 14);

  const intro =
    lang === "fr"
      ? `${ARTISTS.length} artistes référencés à partir des line-ups publiés : DJs techno, live hardstyle, sélecteurs house, MCs drum & bass. ${
          headliners.length
        } d'entre eux ont au moins une date à venir en Europe. Chaque fiche artiste liste ses prochains sets, les lieux où il joue et les genres qu'il défend.`
      : `${ARTISTS.length} artists indexed from published line-ups: techno DJs, hardstyle live acts, house selectors, drum & bass MCs. ${
          headliners.length
        } of them have at least one upcoming date in Europe. Every artist page lists their next sets, the venues they play and the genres they carry.`;

  const trail: [string, string][] = [[t("nav.artists"), "/artistes"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          ...(next.length ? [itemListJsonLd(next, lang, t("artists.title"))] : []),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("artists.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("artists.title")}
          </h1>
          <p className="lead">{t("artists.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
          </div>

          {headliners.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "44px 0 16px" }}>
                {t("artists.headliners")}
              </h2>
              <div className="linkfarm">
                {headliners.slice(0, 40).map((a) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`}>
                    {a.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          {next.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("hub.next")}
              </h2>
              <div className="grid grid-4">
                {next.map((e) => (
                  <EventCard key={e.id} e={e} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("artists.az")}
          </h2>
          <div className="artist-grid">
            {ARTISTS.map((a) => (
              <Link key={a.slug} href={`${p}/artistes/${a.slug}`} className="artist-tile">
                <div className="av">{a.name.trim()[0]}</div>
                <div>
                  <b>{a.name}</b>
                  <span>
                    {a.eventIds.length} {t(a.eventIds.length > 1 ? "dyn.events" : "dyn.event")}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.bygenre")}
          </h2>
          <div className="linkfarm">
            {ALL_GENRES.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.venues")}
          </h2>
          <div className="linkfarm">
            {venues.map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                🏛 {v.name}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.bycity")}
          </h2>
          <div className="linkcols">
            {PLACES.map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                Rave party {x.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
