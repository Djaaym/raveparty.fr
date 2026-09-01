"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { BASEMAP_ATTRIB, BASEMAP_STYLE, mapPin, z } from "@/lib/basemap";

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inited = useRef(false);
  /* Le moteur de carte est ce que la fiche charge de plus lourd, et il est monté
     sur les milliers de pages qui portent le SEO du site. Il n'arrive donc qu'au
     moment où le bloc entre dans la fenêtre : la plupart des lecteurs s'arrêtent
     au line-up et ne le paient jamais. */
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near || inited.current || !ref.current) return;
    inited.current = true;
    let map: any;
    let cancelled = false;
    (async () => {
      // maplibre-gl v6 n'expose plus d'export par défaut, seulement des nommés.
      const { Map: MlMap, Marker, NavigationControl } = await import("maplibre-gl");
      if (cancelled || !ref.current) return;
      map = new MlMap({
        container: ref.current,
        style: BASEMAP_STYLE,
        center: [lng, lat],
        zoom: z(11),
        // Une carte de 280 px dans une page qui défile ne doit pas capturer la molette.
        scrollZoom: false,
        attributionControl: { compact: true, customAttribution: BASEMAP_ATTRIB },
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-left");
      new Marker({ element: mapPin() }).setLngLat([lng, lat]).addTo(map);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
      inited.current = false;
    };
  }, [near, lat, lng]);

  return (
    <div
      ref={ref}
      style={{ height: 280, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", background: "#0c0c0c" }}
    />
  );
}
