import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, COUNTRIES, GENRES, cardEvents, countryLabel, genreSlug, genreDescL, featured, upcoming, todayISO, cardEvent } from "@/lib/data";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import Hero from "./Hero";
import Reveal from "./Reveal";
import EventCard from "./EventCard";
import CountryBrowser from "./CountryBrowser";
import CtaForm from "./CtaForm";
import JsonLd from "./JsonLd";
import { siteJsonLd } from "@/lib/seo";
import { topPlaces } from "@/lib/places";

const MARQUEE = ["TECHNO", "HARDSTYLE", "DRUM & BASS", "PSYTRANCE", "TRANCE", "ACID", "WAREHOUSE"];

export default function Home({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const trending = featured(8, undefined, today);
  /* Only places with dates on, most-loaded first — see topPlaces() for why 12 and not 90.
     Split in two because a plain count ranking is all Amsterdam, Manchester and Cologne:
     true to the calendar, useless to the French reader this site is built for. */
  const cities = topPlaces(48, today);
  const citiesFr = cities.filter((c) => c.country === "France").slice(0, 10);
  const citiesEu = cities.filter((c) => c.country !== "France").slice(0, 10);

  return (
    <>
      <JsonLd data={siteJsonLd(lang)} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      {/* Les deux listes du formulaire, aplaties ici : <Hero> est un composant client,
          et lui laisser importer `COUNTRIES`/`ALL_GENRES` embarquait tout `lib/data.ts`
          dans le bundle de la page d'accueil. Voir le commentaire de Hero.tsx. */}
      <Hero
        lang={lang}
        count={live.length}
        countries={COUNTRIES.length}
        countryOptions={COUNTRIES.map((c) => ({ v: c, l: countryLabel(c, lang) }))}
        genreOptions={ALL_GENRES}
      />

      {/* marquee */}
      <div className="marquee">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </div>

      {/* trending */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("trending.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("trending.title")}
                </h2>
              </div>
              <Link href={`${p}/explore`} className="btn btn-ghost">
                {t("trending.cta")}
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-4">
            {trending.map((e) => (
              <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
            ))}
          </div>
        </div>
      </section>

      {/* by country */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("country.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("country.title")}
                </h2>
              </div>
            </div>
          </Reveal>
          {/* Les dates à venir seulement, et sans les champs qu'une carte n'affiche pas :
              le composant est client, lui laisser importer le catalogue chargeait
              218 Ko de JS sur la page d'accueil. Voir `cardEvents()`. */}
          <CountryBrowser lang={lang} today={today} events={cardEvents(live)} />
        </div>
      </section>

      {/* genres */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("genres.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("genres.title")}
                </h2>
              </div>
            </div>
          </Reveal>
          <div className="genres">
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
                      {n} {t("dyn.events")}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* value */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="grid grid-3">
              {[1, 2, 3].map((i) => (
                <div className="info-card" key={i}>
                  <h3 className="h-md">{t(`value${i}.title`)}</h3>
                  <p className="lead" style={{ fontSize: ".95rem" }}>
                    {t(`value${i}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* premium */}
      <section className="section" id="premium">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("premium.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("premium.title")}
                </h2>
              </div>
            </div>
          </Reveal>
          <div className="plans">
            <div className="plan">
              <h3 className="h-md">{t("plan.raver.title")}</h3>
              <div className="price">{t("plan.raver.price")}</div>
              <ul>
                <li>{t("plan.raver.f1")}</li>
                <li>{t("plan.raver.f2")}</li>
                <li>{t("plan.raver.f3")}</li>
                <li>{t("plan.raver.f4")}</li>
              </ul>
              <Link href={`${p}/account`} className="btn btn-ghost btn-block">
                {t("plan.raver.cta")}
              </Link>
            </div>
            <div className="plan featured">
              <span className="ribbon">{t("plan.popular")}</span>
              <h3 className="h-md">Radar+</h3>
              <div className="price">
                €6<small>{t("plan.month")}</small>
              </div>
              <ul>
                <li>{t("plan.radar.f1")}</li>
                <li>{t("plan.radar.f2")}</li>
                <li>{t("plan.radar.f3")}</li>
                <li>{t("plan.radar.f4")}</li>
                <li>{t("plan.radar.f5")}</li>
              </ul>
              <Link href={`${p}/account`} className="btn btn-primary btn-block">
                {t("plan.radar.cta")}
              </Link>
            </div>
            <div className="plan">
              <h3 className="h-md">{t("plan.promoter.title")}</h3>
              <div className="price">
                €39<small>{t("plan.month")}</small>
              </div>
              <ul>
                <li>{t("plan.promoter.f1")}</li>
                <li>{t("plan.promoter.f2")}</li>
                <li>{t("plan.promoter.f3")}</li>
                <li>{t("plan.promoter.f4")}</li>
                <li>{t("plan.promoter.f5")}</li>
              </ul>
              <Link href={`${p}/organizer`} className="btn btn-ghost btn-block">
                {t("plan.promoter.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ways in — the 90-link column dump this replaces was a link farm on a home
          page: ninety towns listed flat, most of them with nothing on. It still lives
          on /villes, one click away, where a reader who wants the exhaustive list goes.
          Here: the three ways someone actually enters the calendar, then the cities
          that genuinely have dates, each with its count so no link lies. */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("cities.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("home.ways.title")}
                </h2>
              </div>
              <Link href={`${p}/villes`} className="btn btn-ghost">
                {t("home.ways.all")}
              </Link>
            </div>
          </Reveal>
          <Reveal>
            <div className="ways">
              <Link className="way way-hero" href={`${p}/rave-party/autour-de-moi`}>
                <span className="way-ico">📍</span>
                <h3>{t("near.title")}</h3>
                <p>{t("home.way.near")}</p>
                <span className="way-go">{t("home.way.near.cta")}</span>
              </Link>
              <Link className="way" href={`${p}/rave-party/ce-week-end`}>
                <span className="way-ico">📅</span>
                <h3>{t("soon.crumb")}</h3>
                <p>{t("home.way.weekend")}</p>
                <span className="way-go">{t("home.way.weekend.cta")}</span>
              </Link>
              <Link className="way" href={`${p}/map`}>
                <span className="way-ico">🗺</span>
                <h3>{t("nav.map")}</h3>
                <p>{t("home.way.map")}</p>
                <span className="way-go">{t("home.way.map.cta")}</span>
              </Link>
            </div>
          </Reveal>

          {cities.length > 0 && (
            <>
              <h3 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("home.cities.title")}
              </h3>
              {[
                { label: t("home.cities.fr"), rows: citiesFr },
                { label: t("home.cities.eu"), rows: citiesEu },
              ]
                .filter((g) => g.rows.length > 0)
                .map((g) => (
                  <div key={g.label} style={{ marginBottom: 22 }}>
                    <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
                      {g.label}
                    </span>
                    <div className="linkfarm">
                      {g.rows.map(({ place, count }) => (
                        <Link key={place.slug} href={`${p}/rave-party/${place.slug}`}>
                          Rave party {place.label} <b>{count}</b>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              <div className="linkfarm" style={{ marginTop: 20 }}>
                {/* Two pages that lost their only home-page link elsewhere in this change:
                    /lieux went out with the column dump (it carries the club-name intent —
                    "Berghain", "Rex Club" — that no city page can rank for), and /pays gave
                    up its nav slot. "Toutes les villes" is already the section's own CTA. */}
                <Link href={`${p}/lieux`} className="more">
                  {t("home.cities.venues")}
                </Link>
                <Link href={`${p}/pays`} className="more">
                  🌍 {t("nav.countries")}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* cta */}
      <section className="section-sm">
        <div className="wrap">
          <Reveal>
            <div className="cta">
              <span className="eyebrow" style={{ justifyContent: "center" }}>
                {t("cta.eyebrow")}
              </span>
              <h2 className="h-lg" style={{ margin: "16px 0 6px" }}>
                {t("cta.title")}
              </h2>
              <p className="lead" style={{ marginInline: "auto" }}>
                {t("cta.lead")}
              </p>
              <CtaForm lang={lang} />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer lang={lang} />
    </>
  );
}
