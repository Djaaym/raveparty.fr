import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, COUNTRY_FLAG, genreSlug, isPast, todayISO } from "@/lib/data";
import { COUNTRIES_INDEX, countryName, eventsForCountry } from "@/lib/countries";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function CountriesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();

  const rows = COUNTRIES_INDEX.map((c) => {
    const all = eventsForCountry(c.name);
    return { ...c, live: all.filter((e) => !isPast(e, today)), all };
  }).sort((a, b) => b.live.length - a.live.length || a.name.localeCompare(b.name));

  const liveTotal = rows.reduce((n, r) => n + r.live.length, 0);
  const next = rows.flatMap((r) => r.live).sort((a, b) => a.date.localeCompare(b.date));

  const intro =
    lang === "fr"
      ? `${liveTotal} événements à venir dans ${rows.filter((r) => r.live.length).length} pays. Choisis ta destination : chaque page pays réunit les festivals, clubs et warehouses du moment, avec les dates, les line-ups et la billetterie officielle.`
      : `${liveTotal} upcoming events across ${rows.filter((r) => r.live.length).length} countries. Pick a destination: each country page gathers the festivals, clubs and warehouses currently on, with dates, line-ups and official ticketing.`;

  const trail: [string, string][] = [[t("nav.countries"), "/pays"]];

  return (
    <>
      <JsonLd
        data={[breadcrumbJsonLd(trail, lang), ...(next.length ? [itemListJsonLd(next.slice(0, 30), lang, t("countries.title"))] : [])]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("countries.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("countries.title")}
          </h1>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>📅 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
          </div>

          <div className="artist-grid" style={{ marginTop: 36 }}>
            {rows.map((c) => (
              <Link key={c.slug} href={`${p}/pays/${c.slug}`} className="artist-tile">
                <div className="av" style={{ background: "none", fontSize: "1.6rem" }}>
                  {COUNTRY_FLAG[c.name] ?? "🌍"}
                </div>
                <div>
                  <b>{countryName(c.name, lang)}</b>
                  <span>
                    {c.live.length > 0
                      ? `${c.live.length} ${c.live.length > 1 ? t("dyn.events") : t("dyn.event")}`
                      : t("hub.past")}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("hub.next")}
          </h2>
          <div className="grid grid-4">
            {next.slice(0, 8).map((e) => (
              <EventCard key={e.id} e={e} lang={lang} today={today} />
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("hub.bycity")}
          </h2>
          <div className="linkcols">
            {PLACES.map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                Rave party {x.label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
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
