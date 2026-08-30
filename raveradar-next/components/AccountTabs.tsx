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
import PromoterAuth from "./PromoterAuth";
import { PromoterProfileForm, PromoterSubmissions } from "./PromoterPanel";
import { usePromoter } from "./usePromoter";

type Tab = "events" | "profile" | "favs" | "alerts" | "history" | "pro";

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
  const [tab, setTab] = useState<Tab | null>(null);
  const [favIds, setFavIds] = useState<number[]>([]);
  const alerts = useAlerts();
  const { session, logout } = usePromoter();
  const account = session?.account ?? null;

  useEffect(() => {
    const sync = () => setFavIds(readFavs());
    sync();
    window.addEventListener("favs", sync);
    return () => window.removeEventListener("favs", sync);
  }, []);

  const favs = events.filter((e) => favIds.includes(e.id));
  // "Historique" is the one tab where a finished event is the point. Four fixed positions
  // in the catalogue were neither history nor current, they drifted into upcoming dates.

  /* Les onglets dépendent de la session, donc l'onglet actif aussi : un promoteur
     connecté arrive sur ses dépôts, un visiteur sur ses favoris. `tab` reste `null`
     tant que la session n'est pas connue, plutôt que d'afficher un onglet puis d'en
     changer sous les yeux du lecteur. */
  const tabs: [Tab, string][] = account
    ? [
        ["events", t("pro.tab.events")],
        ["profile", t("pro.tab.profile")],
        ["favs", t("acc.tab.favs")],
        ["alerts", t("acc.tab.alerts")],
        ["history", t("acc.tab.history")],
      ]
    : [
        ["favs", t("acc.tab.favs")],
        ["alerts", t("acc.tab.alerts")],
        ["history", t("acc.tab.history")],
        ["pro", t("pro.tab.signin")],
      ];
  const current: Tab = tab && tabs.some(([k]) => k === tab) ? tab : tabs[0][0];

  return (
    <>
      <ProfileHead lang={lang} />

      <div className="tabs" role="tablist">
        {tabs.map(([k, label]) => (
          <button
            type="button"
            role="tab"
            aria-selected={current === k}
            key={k}
            className={`tab ${current === k ? "on" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {current === "events" && account && (
        <PromoterSubmissions lang={lang} submissions={session?.submissions ?? []} status={account.status} />
      )}

      {current === "profile" && account && (
        <>
          <PromoterProfileForm lang={lang} account={account} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            {t("pro.logout")}
          </button>
        </>
      )}

      {current === "pro" && (
        <div className="pro-signin">
          <p className="lead">{t("pro.tab.signin.lead")}</p>
          <PromoterAuth lang={lang} />
        </div>
      )}

      {current === "favs" && (
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

      {current === "alerts" && (
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

      {current === "history" && (
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

    </>
  );
}

/**
 * L'en-tête du compte.
 *
 * Il affichait « R », « Salut, Raver » et un bouton « Modifier » qui pointait sur `#`.
 * Il porte maintenant ce que la session sait : l'initiale de la structure, son nom, et
 * l'état de sa validation, qui est la seule information qu'un promoteur en attente
 * cherche en arrivant ici.
 */
function ProfileHead({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const { session, loading } = usePromoter();
  const account = session?.account ?? null;

  if (loading) return <div className="profile-head skeleton" aria-hidden="true" />;

  if (!account) {
    return (
      <div className="profile-head">
        <div className="avatar">★</div>
        <div>
          <h1 className="h-md">{t("acc.hi")}</h1>
          <p style={{ color: "var(--grey)" }}>{t("acc.sub")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-head">
      <div className="avatar">{account.name.slice(0, 1).toUpperCase()}</div>
      <div>
        <h1 className="h-md">{account.name}</h1>
        <p style={{ color: "var(--grey)" }}>
          {t(`pro.kind.${account.kind}`)} · {account.city}, {account.country}
        </p>
      </div>
      <span className={`pro-badge s-${account.status}`}>{t(`pro.status.${account.status}`)}</span>
    </div>
  );
}
