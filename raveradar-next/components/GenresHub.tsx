import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, GENRES, FESTIVALS, eventSlug, genreSlug, genreDescL, liveEditions, todayISO, upcoming } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function GenresHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  // Artists with a date still to come — the ones worth sending link equity to.
  const artists = ARTISTS.filter((a) => a.eventIds.some((id) => liveIds.has(id)))
    .sort((a, b) => b.eventIds.length - a.eventIds.length)
    .slice(0, 30);
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 14);
  // Finished editions swapped for their next one instead of falling back to the archive:
  // a shortlist that links a page stamped "édition terminée" is worse than a short one.
  const fests = liveEditions(FESTIVALS, today).slice(0, 16);

  const intro =
    lang === "fr"
      ? `${ALL_GENRES.length} styles suivis et ${live.length} date${live.length > 1 ? "s" : ""} à venir en Europe. Chaque genre a sa page : les événements du moment, les artistes qui le défendent et les villes où le son tourne le plus.`
      : `${ALL_GENRES.length} styles tracked and ${live.length} upcoming date${live.length > 1 ? "s" : ""} across Europe. Each genre gets its own page: what's on, the artists carrying it and the cities where it hits hardest.`;

  const trail: [string, string][] = [[t("nav.genres"), "/genres"]];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(trail, lang)} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("genrehub.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("genrehub.title")}
          </h1>
          <p className="lead">{t("genrehub.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
          </div>

          <div className="genres" style={{ marginTop: 36 }}>
            {ALL_GENRES.map((g) => {
              const k = GENRES[g];
              const n = live.filter((e) => e.genres.includes(g)).length;
              return (
                <Link className="genre" key={g} href={`${p}/genres/${genreSlug(g)}`}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(150deg,${k.c1},${k.c2})`,
                      opacity: 0.85,
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span>{g}</span>
                    <small>{genreDescL(g, lang)}</small>
                    <small style={{ marginTop: 8, fontFamily: "var(--f-mono)" }}>
                      {n > 0 ? `${n} ${t(n > 1 ? "dyn.events" : "dyn.event")}` : t("hub.past")}
                    </small>
                  </div>
                </Link>
              );
            })}
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

          {artists.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
                {t("hub.artists")}
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
