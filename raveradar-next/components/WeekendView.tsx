import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, FESTIVALS, eventSlug, genreSlug, todayISO, upcoming } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

/** Events running or starting within the next `days` days (computed at build/render time). */
export default function WeekendView({ lang, days = 12 }: { lang: Lang; days?: number }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  // Horizon as a plain ISO day: comparing `yyyy-mm-dd` strings keeps everything on the
  // site's reference timezone instead of drifting with the server's local time.
  const horizon = new Date(`${today}T00:00:00Z`).getTime() + days * 86400000;
  const horizonISO = new Date(horizon).toISOString().slice(0, 10);
  const live = upcoming();
  // `upcoming()` keeps multi-day festivals that already started, so they stay in the window.
  const soon = live.filter((e) => e.date <= horizonISO);
  const later = live.filter((e) => e.date > horizonISO).slice(0, 8);
  const fests = upcoming(FESTIVALS).slice(0, 16);

  // Long-form date ("29 juillet") reads better in a sentence than the uppercase card format.
  const day = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(t("locale"), { day: "numeric", month: "long" });

  const intro =
    lang === "fr"
      ? soon.length > 0
        ? `${soon.length} événement${soon.length > 1 ? "s" : ""} entre le ${day(today)} et le ${day(
            horizonISO,
          )} : clubs, entrepôts, free parties et festivals. Prix d'entrée, line-up et billetterie sur chaque fiche.`
        : `Rien de confirmé dans les ${days} prochains jours. Voici les prochaines dates référencées en Europe — et tu peux activer une alerte pour ta ville.`
      : soon.length > 0
        ? `${soon.length} event${soon.length > 1 ? "s" : ""} between ${day(today)} and ${day(
            horizonISO,
          )}: clubs, warehouses, free parties and festivals. Entry price, line-up and ticketing on every listing.`
        : `Nothing confirmed in the next ${days} days. Here are the next dates listed across Europe — and you can set an alert for your city.`;

  const trail: [string, string][] = [[t("soon.crumb"), "/rave-party/ce-week-end"]];
  const listed = soon.length ? soon : later;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          ...(listed.length ? [itemListJsonLd(listed, lang, t("soon.title"))] : []),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("soon.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("soon.title")}
          </h1>
          <p className="lead">{t("soon.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
          </div>

          {soon.length > 0 ? (
            <div className="grid grid-4" style={{ marginTop: 36 }}>
              {soon.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} today={today} />
              ))}
            </div>
          ) : (
            <div className="info-card" style={{ marginTop: 36 }}>
              <p className="lead" style={{ fontSize: "1rem", marginBottom: 16 }}>
                {t("soon.empty")}
              </p>
              <Link href={`${p}/explore`} className="btn btn-primary">
                {t("soon.all")}
              </Link>
            </div>
          )}

          {later.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("soon.later")}
              </h2>
              <div className="grid grid-4">
                {later.map((e) => (
                  <EventCard key={e.id} e={e} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

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

          {fests.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
                {t("cities.topfest")}
              </h2>
              <div className="linkcols">
                {fests.map((e) => (
                  <Link key={e.id} href={`${p}/festival/${eventSlug(e)}`}>
                    ✦ {e.title}
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
