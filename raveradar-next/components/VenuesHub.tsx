import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, countryLabel, genreSlug, nextUp, slugify, todayISO, upcoming, venueLabelL } from "@/lib/data";
import { VENUES } from "@/lib/venues";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function VenuesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  const next = nextUp(4, undefined, today);
  const liveCount = (ids: number[]) => ids.filter((id) => liveIds.has(id)).length;
  // Venues with something still to come first; the rest stay listed alphabetically for the archive.
  const venues = [...VENUES].sort(
    (a, b) => liveCount(b.eventIds) - liveCount(a.eventIds) || a.name.localeCompare(b.name),
  );
  const open = venues.filter((v) => liveCount(v.eventIds) > 0).length;
  // Only geo pages that actually host one of our venues — never link a slug into the void.
  const placesWithVenues = PLACES.filter((x) =>
    VENUES.some((v) =>
      (x.match ?? [x.label]).some(
        (m) => slugify(m) === slugify(v.city) || slugify(m) === slugify(v.region ?? ""),
      ),
    ),
  );
  const countries = [...new Set(VENUES.map((v) => v.country))];

  const intro =
    lang === "fr"
      ? `${VENUES.length} lieux référencés dans ${countries.length} pays : clubs mythiques, entrepôts, hangars portuaires et plaines de festival. ${open} d'entre eux ont une date à venir. Chaque fiche donne l'agenda complet du lieu, les artistes qui y passent et la billetterie.`
      : `${VENUES.length} venues indexed across ${countries.length} countries: legendary clubs, warehouses, dockside hangars and festival fields. ${open} of them have an upcoming date. Each page gives the venue's full agenda, the artists playing there and the ticketing.`;

  const trail: [string, string][] = [[t("nav.venues"), "/lieux"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          itemListJsonLd(next, lang, t("venues.title"), today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("venues.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("venues.title")}
          </h1>
          <p className="lead">{t("venues.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
          </div>

          <h2 className="h-md" style={{ margin: "44px 0 16px" }}>
            {t("venues.all")}
          </h2>
          <div className="artist-grid">
            {venues.map((v) => {
              const n = liveCount(v.eventIds);
              return (
                <Link key={v.slug} href={`${p}/lieux/${v.slug}`} className="artist-tile">
                  <div className="av">🏛</div>
                  <div>
                    <b>{venueLabelL(v.name, v.nameEn, lang)}</b>
                    <span>
                      {v.city}, {countryLabel(v.country, lang)} ·{" "}
                      {n > 0 ? `${n} ${t(n > 1 ? "dyn.events" : "dyn.event")}` : t("hub.past")}
                    </span>
                  </div>
                </Link>
              );
            })}
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
            {t("venues.bycity")}
          </h2>
          <div className="linkcols">
            {placesWithVenues.map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                {lang === "fr" ? "Clubs & soirées" : "Clubs & parties"} {x.label}
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
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
