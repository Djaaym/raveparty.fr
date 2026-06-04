"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";
import { EVENTS, countryLabel, cardBg } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";

const GENRE_FILTERS = ["all", "Techno", "Hard Techno", "Hardstyle", "Drum & Bass", "Psytrance", "Free Party", "House"];

export default function MapView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const inited = useRef(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (inited.current || !mapEl.current) return;
    inited.current = true;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = L.map(mapEl.current!, { zoomControl: true, scrollWheelZoom: true }).setView([50.5, 8], 5);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap · © CARTO",
        subdomains: "abcd",
      }).addTo(map);
      EVENTS.forEach((e) => {
        const m = L.marker([e.lat, e.lng], {
          icon: L.divIcon({ html: `<div class="map-pin"></div>`, className: "", iconSize: [18, 18] }),
        }).addTo(map);
        m.bindPopup(
          `<div class="pop"><h4>${e.title}</h4><p>${fmtDate(e.date, lang)} · ${e.city}, ${countryLabel(
            e.country,
            lang
          )}</p><a href="${p}/event?id=${e.id}">${t("map.viewevent")}</a></div>`
        );
        markersRef.current[e.id] = m;
      });
    })();
    return () => {
      if (mapRef.current) mapRef.current.remove();
      inited.current = false;
    };
  }, [lang, p, t]);

  const applyFilter = (g: string) => {
    setFilter(g);
    const map = mapRef.current;
    if (!map) return;
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const e = EVENTS.find((x) => x.id === +id)!;
      const show = g === "all" || e.genres.includes(g);
      if (show) m.addTo(map);
      else map.removeLayer(m);
    });
  };

  const focus = (id: number) => {
    const e = EVENTS.find((x) => x.id === id)!;
    mapRef.current?.flyTo([e.lat, e.lng], 9, { duration: 1.1 });
    markersRef.current[id]?.openPopup();
  };

  return (
    <>
      <div className="chips" style={{ justifyContent: "flex-start", margin: "24px 0" }}>
        {GENRE_FILTERS.map((g) => (
          <span key={g} className={`chip ${filter === g ? "on" : ""}`} onClick={() => applyFilter(g)}>
            {g === "all" ? t("country.all") : g}
          </span>
        ))}
      </div>
      <div className="map-layout">
        <div className="map-list">
          {EVENTS.map((e) => (
            <div className="mini" key={e.id} onClick={() => focus(e.id)}>
              <div className="mthumb" style={{ backgroundImage: cardBg(e) }} />
              <div>
                <h4>{e.title}</h4>
                <span>
                  {e.city} · {fmtDate(e.date, lang)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div id="map" ref={mapEl} />
      </div>
    </>
  );
}
