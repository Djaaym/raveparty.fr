import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { FESTIVALS, upcoming } from "@/lib/data";
import { placeBySlug, eventsForPlace } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

export default function FestivalCityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const here = eventsForPlace(place).filter((e) => e.type === "Festival");
  const hereIds = new Set(here.map((e) => e.id));
  const nearby = upcoming(FESTIVALS)
    .filter((e) => !hereIds.has(e.id))
    .slice(0, 4);

  const intro =
    lang === "fr"
      ? `Tous les festivals de musique électronique à ${place.label} et dans les environs : techno, hardstyle, psytrance, drum & bass… Dates, line-ups et billetterie, mis à jour en continu.`
      : `Every electronic music festival in and around ${place.label}: techno, hardstyle, psytrance, drum & bass… Dates, line-ups and tickets, updated continuously.`;

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Link href={`${p}/villes`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {t("nav.cities")}
          </Link>
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            {lang === "fr" ? "Festivals" : "Festivals"} <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {place.label}
          </h2>
          {here.length > 0 ? (
            <div className="grid grid-4">
              {here.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="info-card">
              <p className="lead" style={{ fontSize: "1rem", marginBottom: 18 }}>
                {t("city.empty")}
              </p>
              <Link href={`${p}/account`} className="btn btn-primary">
                🔔 {t("city.alert")}
              </Link>
            </div>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.nearby")}
          </h2>
          <div className="grid grid-4">
            {nearby.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
