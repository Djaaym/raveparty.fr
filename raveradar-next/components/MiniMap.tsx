"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current || !ref.current) return;
    inited.current = true;
    let map: any;
    (async () => {
      const L = (await import("leaflet")).default;
      map = L.map(ref.current!, { zoomControl: true, scrollWheelZoom: false, attributionControl: false }).setView(
        [lat, lng],
        11
      );
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd" }).addTo(map);
      L.marker([lat, lng], {
        icon: L.divIcon({ html: `<div class="map-pin"></div>`, className: "", iconSize: [18, 18] }),
      }).addTo(map);
    })();
    return () => {
      if (map) map.remove();
      inited.current = false;
    };
  }, [lat, lng]);

  return (
    <div
      ref={ref}
      style={{ height: 280, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)" }}
    />
  );
}
