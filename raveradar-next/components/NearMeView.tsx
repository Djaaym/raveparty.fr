"use client";
import { useState } from "react";
import type { Lang, RaveEvent } from "@/lib/types";
import { EVENTS, isPast } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function NearMeView({ lang, today }: { lang: Lang; today: string }) {
  const t = getDict(lang);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "denied">("idle");

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStatus("idle");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const live = EVENTS.filter((e) => !isPast(e, today));
  const withDist: (RaveEvent & { dist?: number })[] = pos
    ? live.map((e) => ({ ...e, dist: haversine(pos.lat, pos.lng, e.lat, e.lng) })).sort((a, b) => a.dist! - b.dist!)
    : [...live].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("near.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("near.title")}
          </h1>
          <p className="lead">{t("near.lead")}</p>

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

          <div className="grid grid-4" style={{ marginTop: 28 }}>
            {withDist.map((e) => (
              <div key={e.id}>
                {e.dist != null && (
                  <span className="gpill" style={{ display: "inline-block", marginBottom: 8 }}>
                    📍 {e.dist} {t("near.km")}
                  </span>
                )}
                <EventCard e={e} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
