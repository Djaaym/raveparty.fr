"use client";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import type { CardEvent } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import EventCard from "./EventCard";
import { readFavs } from "./useFavorites";
import { removeAlert, useAlerts } from "./useAlerts";
import { alertKey } from "@/lib/alerts";
import { fmtDate } from "@/lib/format";

type Tab = "favs" | "alerts" | "history" | "settings";

/**
 * Le catalogue et l'historique arrivent en props, allégés par `cardEvents()`.
 *
 * Les favoris sont des ids en localStorage : la résolution id → événement se fait donc
 * forcément côté client, mais elle n'a besoin que de ce qu'une carte affiche. L'import
 * direct faisait entrer tout `lib/data.ts`, descriptions comprises, dans le bundle.
 */
export default function AccountTabs({
  lang,
  events,
  history,
}: {
  lang: Lang;
  events: CardEvent[];
  history: CardEvent[];
}) {
  const t = getDict(lang);
  const [tab, setTab] = useState<Tab>("favs");
  const [favIds, setFavIds] = useState<number[]>([]);
  const alerts = useAlerts();

  useEffect(() => {
    const sync = () => setFavIds(readFavs());
    sync();
    window.addEventListener("favs", sync);
    return () => window.removeEventListener("favs", sync);
  }, []);

  const favs = events.filter((e) => favIds.includes(e.id));
  // "Historique" is the one tab where a finished event is the point. Four fixed positions
  // in the catalogue were neither history nor current, they drifted into upcoming dates.
  
  const tabs: [Tab, string][] = [
    ["favs", t("acc.tab.favs")],
    ["alerts", t("acc.tab.alerts")],
    ["history", t("acc.tab.history")],
    ["settings", t("acc.tab.settings")],
  ];

  return (
    <>
      <div className="tabs">
        {tabs.map(([k, label]) => (
          <div key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
            {label}
          </div>
        ))}
      </div>

      {tab === "favs" && (
        <div>
          {favs.length ? (
            <div className="grid grid-4">
              {favs.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} />
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--grey)" }}>{t("acc.favs.empty")}</p>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div>
          <p className="lead" style={{ marginBottom: 24 }}>
            {t("acc.alerts.lead")}
          </p>
          {alerts.length ? (
            <>
              <div className="grid grid-2">
                {alerts.map((a) => (
                  <div className="alert-card" key={alertKey(a.kind, a.value)}>
                    <div>
                      <b>{a.label}</b>
                      <br />
                      <span style={{ color: "var(--grey)", fontSize: ".85rem" }}>
                        {t(`alert.kind.${a.kind}`)} · {t("acc.alerts.since").replace("{date}", fmtDate(a.at.slice(0, 10), lang))}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: "auto" }}
                      onClick={() => removeAlert(a.kind, a.value)}
                    >
                      {t("acc.alerts.remove")}
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ color: "var(--grey-2)", fontSize: ".85rem", marginTop: 18 }}>{t("acc.alerts.browser")}</p>
            </>
          ) : (
            <p style={{ color: "var(--grey)" }}>{t("acc.alerts.empty")}</p>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          <p className="lead" style={{ marginBottom: 24 }}>
            {t("acc.history.lead")}
          </p>
          <div className="grid grid-4">
            {history.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="info-card" style={{ maxWidth: 560 }}>
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("acc.prefs")}
          </h3>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="acc-name">{t("acc.displayname")}</label>
            <input id="acc-name" className="input" defaultValue="Raver" />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="acc-city">{t("acc.homecity")}</label>
            <input id="acc-city" className="input" defaultValue="Paris" />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="acc-email">{t("acc.email")}</label>
            <input id="acc-email" className="input" type="email" defaultValue="djaym.info@gmail.com" />
          </div>
          <button className="btn btn-primary">{t("acc.save")}</button>
        </div>
      )}
    </>
  );
}
