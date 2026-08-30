"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/types";
import type { CardEvent } from "@/lib/types";
import { countryLabel, isPast } from "@/lib/display";
import { fmtDate, imageAlt } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";

const GENRE_FILTERS = ["all", "Techno", "Hard Techno", "Hardstyle", "Drum & Bass", "Psytrance", "Trance", "House"];

/** Le calendrier arrive en prop, allégé par `cardEvents()` : importer le catalogue
 *  depuis un composant client embarquait 218 Ko compressés dans le bundle de /map,
 *  descriptions FR et EN comprises, alors qu'un marqueur lit une latitude et un titre. */
export default function MapView({ lang, today, catalogue }: { lang: Lang; today: string; catalogue: CardEvent[] }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  // The map is a "where can I go" tool, finished editions have no place on it.
  const events = useMemo(
    () => catalogue.filter((e) => !isPast(e, today)).sort((a, b) => a.date.localeCompare(b.date)),
    [catalogue, today],
  );
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const inited = useRef(false);
  const [filter, setFilter] = useState("all");

  /* La seule source de vérité du filtre. Elle alimente à la fois les marqueurs et la
     liste latérale, qui, elle, n'était pas filtrée du tout. */
  const visible = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.genres.includes(filter))),
    [events, filter],
  );

  useEffect(() => {
    if (inited.current || !mapEl.current) return;
    inited.current = true;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      const map = L.map(mapEl.current!, { zoomControl: true, scrollWheelZoom: true }).setView([50.5, 8], 5);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap · © CARTO",
        subdomains: "abcd",
      }).addTo(map);
      events.forEach((e) => {
        const m = L.marker([e.lat, e.lng], {
          icon: L.divIcon({ html: `<div class="map-pin"></div>`, className: "", iconSize: [18, 18] }),
        }).addTo(map);
        m.bindPopup(
          `<div class="pop"><h4>${e.title}</h4><p>${fmtDate(e.date, lang)} · ${e.city}, ${countryLabel(
            e.country,
            lang,
          )}</p><a href="${p}${e.path}">${t("map.viewevent")}</a></div>`,
        );
        markersRef.current[e.id] = m;
      });
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = {};
      inited.current = false;
    };
    // `t` est volontairement absent : getDict() en renvoie une nouvelle instance à
    // chaque rendu, et le mettre ici reconstruisait la carte à chaque clic de filtre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, p, events]);

  /* Synchronise les marqueurs avec le filtre. Séparé de l'init pour que changer de
     genre n'implique jamais de reconstruire la carte. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const keep = new Set(visible.map((e) => e.id));
    Object.entries(markersRef.current).forEach(([id, m]) => {
      if (keep.has(+id)) m.addTo(map);
      else map.removeLayer(m);
    });
  }, [visible]);

  const focus = (id: number) => {
    const e = events.find((x) => x.id === id)!;
    mapRef.current?.flyTo([e.lat, e.lng], 9, { duration: 1.1 });
    markersRef.current[id]?.openPopup();
  };

  return (
    <>
      <div className="chips" style={{ justifyContent: "flex-start", margin: "24px 0" }}>
        {GENRE_FILTERS.map((g) => (
          <span key={g} className={`chip ${filter === g ? "on" : ""}`} onClick={() => setFilter(g)}>
            {g === "all" ? t("country.all") : g}
          </span>
        ))}
      </div>
      <div className="map-layout">
        <div className="map-list">
          {visible.map((e) => (
            // Stays a button rather than a link: it pans the map, it doesn't navigate.
            <div
              className="mini"
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => focus(e.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  focus(e.id);
                }
              }}
            >
              {e.thumb ? (
                <img className="mthumb" src={e.thumb} alt={imageAlt(e, lang, e.isPhoto)} loading="lazy" decoding="async" />
              ) : (
                <div className="mthumb" style={{ backgroundImage: e.bg }} />
              )}
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
