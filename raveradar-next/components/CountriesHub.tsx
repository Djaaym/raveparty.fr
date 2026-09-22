import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, COUNTRY_FLAG, genreSlug, isPast, nextUp, todayISO, cardEvent } from "@/lib/data";
import { COUNTRIES_INDEX, countryName, eventsForCountry } from "@/lib/countries";
import { PLACES } from "@/lib/places";
import { countriesHubCopy } from "@/lib/pagecopy";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";
import Fold from "./Fold";

export default function CountriesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();

  const rows = COUNTRIES_INDEX.map((c) => {
    const all = eventsForCountry(c.name);
    return { ...c, live: all.filter((e) => !isPast(e, today)), all };
  }).sort((a, b) => b.live.length - a.live.length || a.name.localeCompare(b.name));

  const next = rows.flatMap((r) => r.live).sort((a, b) => a.date.localeCompare(b.date));

  /* Le hub était un sommaire : un compteur de pays, une grille de drapeaux, et rien
     qui réponde aux questions qu'on se pose devant une liste de pays. Mesuré sur le
     tableau de bord privé, 4,2 secondes d'attention moyenne, la pire du site, et
     c'était le seul hub sans FAQ. Le contexte et les questions sortent tous les deux
     du calendrier (lib/pagecopy.ts) : rien n'est écrit à la main pour un pays, donc
     rien ne peut se périmer sans qu'on s'en aperçoive. */
  const copy = countriesHubCopy(lang, {
    rows: rows.map((r) => ({ name: r.name, live: r.live })),
    places: PLACES.length,
    today,
  });

  const trail: [string, string][] = [[t("nav.countries"), "/pays"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          itemListJsonLd(next.slice(0, 30), lang, t("countries.title"), today),
          faqJsonLd(copy.faq),
        ]}
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
          <p className="lead">{copy.context}</p>

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
          {/* Douze et non huit : la grille est en `auto-fill`, donc son nombre de
              colonnes suit la fenêtre (1, 2, 4, 6). Douze se divise par 6, 4, 3, 2 et
              1, elle tombe donc juste à toutes les largeurs produites, là où huit
              laissait une rangée orpheline de deux cartes à 1 920 px. */}
          <div className="grid grid-4">
            {nextUp(12, undefined, today).map((e) => (
              <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
            ))}
          </div>

          <Fold title={<>{t("hub.bycity")}</>}>
            <div className="linkcols">
              {PLACES.map((x) => (
                <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                  Rave party {x.label}
                </Link>
              ))}
            </div>
          </Fold>

          <Fold title={<>{t("hub.bygenre")}</>}>
            <div className="linkfarm">
              {ALL_GENRES.map((g) => (
                <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                  {g}
                </Link>
              ))}
            </div>
          </Fold>

          <Fold title={<>{t("countries.faq")}</>}>
            <div className="grid grid-2">
              {copy.faq.map(([q, a]) => (
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
          </Fold>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
