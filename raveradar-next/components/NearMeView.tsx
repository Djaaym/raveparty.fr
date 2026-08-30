"use client";
import { useState } from "react";
import Link from "next/link";
import type { CardEvent, Lang } from "@/lib/types";
import { ALL_GENRES, genreSlug, isPast } from "@/lib/display";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/** Les dates arrivent en prop, allégées par `cardEvents()` : importer le catalogue
 *  depuis un composant client embarque tout `lib/data.ts` dans le bundle de la page. */
/**
 * Le JSON-LD et la liste des villes arrivent tout faits du serveur.
 *
 * Les construire ici obligeait à importer `lib/seo` et `lib/places`, qui lisent tous
 * deux le catalogue : 218 Ko compressés de JavaScript sur cette page, pour un bloc de
 * balisage et une colonne de liens qui ne bougent jamais après le rendu. Ce composant
 * n'est client que pour une chose, demander la position du visiteur et retrier la
 * liste, et c'est la seule chose qui doit lui coûter du JavaScript.
 */
export default function NearMeView({
  lang,
  today,
  events,
  places,
  jsonLd,
}: {
  lang: Lang;
  today: string;
  events: CardEvent[];
  places: { slug: string; label: string }[];
  jsonLd: object[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "denied">("idle");

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (geo) => {
        setPos({ lat: geo.coords.latitude, lng: geo.coords.longitude });
        setStatus("idle");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const live = events.filter((e) => !isPast(e, today)).sort((a, b) => a.date.localeCompare(b.date));
  const withDist: (CardEvent & { dist?: number })[] = pos
    ? live.map((e) => ({ ...e, dist: haversine(pos.lat, pos.lng, e.lat, e.lng) })).sort((a, b) => a.dist! - b.dist!)
    : live;

  const intro =
    lang === "fr"
      ? `${live.length} événement${live.length > 1 ? "s" : ""} à venir en Europe. Autorise la géolocalisation et la liste se réordonne du plus proche au plus loin, pratique pour savoir quoi faire ce soir sans faire trois heures de route.`
      : `${live.length} upcoming event${live.length > 1 ? "s" : ""} across Europe. Allow location access and the list reorders from closest to furthest, handy for finding something on tonight without a three-hour drive.`;

  const trail: [string, string][] = [[t("near.crumb"), "/rave-party/autour-de-moi"]];

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("near.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("near.title")}
          </h1>
          <p className="lead">{t("near.lead")}</p>
          <p className="lead">{intro}</p>

          <div style={{ marginTop: 22 }}>
            {!pos && status !== "denied" && (
              <button className="btn btn-primary" onClick={locate} disabled={status === "loading"}>
                {status === "loading" ? t("near.loading") : t("near.btn")}
              </button>
            )}
            {pos && (
              <p style={{ color: "var(--cyan)", fontFamily: "var(--f-mono)", fontSize: ".85rem" }}>
                📍 {t("near.sorted")}
              </p>
            )}
            {status === "denied" && <p style={{ color: "var(--grey)" }}>{t("near.denied")}</p>}
          </div>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
          </div>

          <div className="grid grid-4" style={{ marginTop: 28 }}>
            {withDist.map((e) => (
              <div key={e.id}>
                {e.dist != null && (
                  <span className="gpill" style={{ display: "inline-block", marginBottom: 8 }}>
                    📍 {e.dist} {t("near.km")}
                  </span>
                )}
                <EventCard e={e} lang={lang} today={today} />
              </div>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.bycity")}
          </h2>
          <div className="linkcols">
            {places.map((x) => (
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
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
