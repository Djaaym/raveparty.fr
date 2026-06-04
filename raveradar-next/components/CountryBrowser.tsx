"use client";
import { useMemo, useState } from "react";
import type { Lang } from "@/lib/types";
import { EVENTS, COUNTRIES, COUNTRY_FLAG, countryLabel } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import EventCard from "./EventCard";

export default function CountryBrowser({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [active, setActive] = useState<string>("all");

  const list = useMemo(
    () =>
      [...EVENTS]
        .filter((e) => active === "all" || e.country === active)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [active]
  );

  return (
    <>
      <div className="chips" style={{ justifyContent: "flex-start", marginBottom: 30 }}>
        <span className={`chip ${active === "all" ? "on" : ""}`} onClick={() => setActive("all")}>
          🌍 {t("country.all")}
        </span>
        {COUNTRIES.map((c) => {
          const n = EVENTS.filter((e) => e.country === c).length;
          return (
            <span key={c} className={`chip ${active === c ? "on" : ""}`} onClick={() => setActive(c)}>
              {COUNTRY_FLAG[c]} {countryLabel(c, lang)}{" "}
              <b style={{ opacity: 0.55, fontWeight: 600 }}>{n}</b>
            </span>
          );
        })}
      </div>
      {list.length ? (
        <div className="grid grid-4">
          {list.map((e) => (
            <EventCard key={e.id} e={e} lang={lang} />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--grey)" }}>{t("country.empty")}</p>
      )}
    </>
  );
}
