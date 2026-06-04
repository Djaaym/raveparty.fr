import Link from "next/link";
import type { Lang } from "@/lib/types";
import { EVENTS } from "@/lib/data";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

/** Events starting within the next `days` days (computed at build/render time). */
export default function WeekendView({ lang, days = 12 }: { lang: Lang; days?: number }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 86400000);
  const soon = EVENTS.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= new Date(now.toDateString()) && d <= horizon;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("soon.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("soon.title")}
          </h1>
          <p className="lead">{t("soon.lead")}</p>

          {soon.length > 0 ? (
            <div className="grid grid-4" style={{ marginTop: 36 }}>
              {soon.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="info-card" style={{ marginTop: 36 }}>
              <p className="lead" style={{ fontSize: "1rem", marginBottom: 16 }}>
                {t("soon.empty")}
              </p>
              <Link href={`${p}/explore`} className="btn btn-primary">
                {t("soon.all")}
              </Link>
            </div>
          )}
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
