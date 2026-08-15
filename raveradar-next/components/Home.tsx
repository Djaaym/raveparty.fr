import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, COUNTRIES, GENRES, genreSlug, genreDescL, featured, upcoming, todayISO } from "@/lib/data";
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
import { PLACES } from "@/lib/places";

const MARQUEE = ["TECHNO", "HARDSTYLE", "DRUM & BASS", "PSYTRANCE", "TRANCE", "ACID", "WAREHOUSE"];

export default function Home({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const trending = featured(8, undefined, today);

  return (
    <>
      <JsonLd data={siteJsonLd(lang)} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <Hero lang={lang} count={live.length} countries={COUNTRIES.length} />

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
              <EventCard key={e.id} e={e} lang={lang} today={today} />
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
          <CountryBrowser lang={lang} today={today} />
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

      {/* geo links — pushes authority from the home page down to the place pages */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">{t("cities.eyebrow")}</span>
                <h2 className="h-lg" style={{ marginTop: 14 }}>
                  {t("cities.title")}
                </h2>
              </div>
              <Link href={`${p}/villes`} className="btn btn-ghost">
                {t("trending.cta")}
              </Link>
            </div>
          </Reveal>
          <div className="linkcols">
            {PLACES.map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                Rave party {x.label}
              </Link>
            ))}
          </div>
          <div className="linkfarm" style={{ marginTop: 24 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>📅 {t("soon.title")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.title")}</Link>
            <Link href={`${p}/artistes`}>{t("nav.artists")}</Link>
            <Link href={`${p}/lieux`}>{t("nav.venues")}</Link>
            <Link href={`${p}/map`}>{t("nav.map")}</Link>
          </div>
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
