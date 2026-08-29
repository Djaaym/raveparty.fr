"use client";
import { useMemo, useState } from "react";
import type { Lang } from "@/lib/types";
import type { CardEvent } from "@/lib/types";
import { COUNTRY_FLAG, countryLabel, isPast } from "@/lib/display";
import { getDict } from "@/lib/i18n";
import EventCard from "./EventCard";

/**
 * Le catalogue arrive en prop (`cardEvents()`, voir lib/data.ts) et n'est plus importé :
 * importer le catalogue depuis un composant client embarque tout `lib/data.ts`, ici
 * 218 Ko compressés dans le JavaScript de la page d'accueil pour afficher huit cartes.
 */
export default function CountryBrowser({ lang, today, events }: { lang: Lang; today: string; events: CardEvent[] }) {
  const t = getDict(lang);
  const [active, setActive] = useState<string>("all");

  /** Only countries that actually have something coming up get a chip. */
  const live = useMemo(
    () => events.filter((e) => !isPast(e, today)).sort((a, b) => a.date.localeCompare(b.date)),
    [events, today],
  );
  const countries = useMemo(() => [...new Set(live.map((e) => e.country))].sort(), [live]);

  const list = useMemo(() => live.filter((e) => active === "all" || e.country === active).slice(0, 8), [live, active]);

  return (
    <>
      <div className="chips" style={{ justifyContent: "flex-start", marginBottom: 30 }}>
        <span className={`chip ${active === "all" ? "on" : ""}`} onClick={() => setActive("all")}>
          🌍 {t("country.all")}
        </span>
        {countries.map((c) => {
          const n = live.filter((e) => e.country === c).length;
          return (
            <span key={c} className={`chip ${active === c ? "on" : ""}`} onClick={() => setActive(c)}>
              {COUNTRY_FLAG[c]} {countryLabel(c, lang)} <b style={{ opacity: 0.55, fontWeight: 600 }}>{n}</b>
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
