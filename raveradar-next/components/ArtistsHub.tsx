import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, genreSlug, nextUp, todayISO, upcoming } from "@/lib/data";
import { ARTISTS } from "@/lib/artists";
import { BIOS } from "@/lib/bios";
import { PLACES } from "@/lib/places";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import ArtistDirectory from "./ArtistDirectory";
import JsonLd from "./JsonLd";

export default function ArtistsHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  const next = nextUp(4, undefined, today);
  // Artists booked on a date that hasn't happened yet — the useful half of the directory.
  const headliners = ARTISTS.filter((a) => a.eventIds.some((id) => liveIds.has(id))).sort(
    (a, b) => b.eventIds.length - a.eventIds.length,
  );
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 14);
  const artistItems = ARTISTS.map((a) => ({
    slug: a.slug,
    name: a.name,
    n: a.eventIds.length,
    photo: BIOS[a.slug]?.photo?.file,
  }));
  /* A CC BY photo may be reused *provided* the author and licence travel with it —
     that is the condition, not a footnote. A 42 px avatar has no room for a credit
     line, so the page carries them all here, once, for the portraits it shows. */
  const credits = ARTISTS.map((a) => BIOS[a.slug]?.photo && { name: a.name, ...BIOS[a.slug]!.photo! })
    .filter((c): c is { name: string; file: string; author: string; license: string; page: string } => Boolean(c))
    .sort((x, y) => x.name.localeCompare(y.name));

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
          itemListJsonLd(next, lang, t("artists.title"), today),
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

          {/* The directory is what this page is for, so it comes first — filter
              included. It used to sit below the "next dates" grid, four screens
              down, which is where search boxes go to be never used. */}
          <h2 className="h-md" style={{ margin: "40px 0 0" }}>
            {t("artists.az")}
          </h2>
          <ArtistDirectory
            items={artistItems}
            hrefBase={`${p}/artistes/`}
            placeholder={t("filter.artists")}
            countLabel={t("filter.count")}
            emptyLabel={t("filter.none")}
            clearLabel={t("filter.clear")}
            dateLabel={t("dyn.event")}
            datesLabel={t("dyn.events")}
            artistLabel={t("dyn.artist")}
            artistsLabel={t("dyn.artists")}
            jumpLabel={t("artists.jump")}
          />

          {credits.length > 0 && (
            <details className="az-credits">
              <summary>{t("artists.credits").replace("{n}", String(credits.length))}</summary>
              <ul>
                {credits.map((c) => (
                  <li key={c.file}>
                    {c.name} — {c.author}, {c.license} (
                    <a href={c.page} target="_blank" rel="noopener noreferrer nofollow">
                      Wikimedia Commons
                    </a>
                    )
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="linkfarm" style={{ marginTop: 44 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
          </div>

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
