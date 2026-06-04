import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { EVENTS } from "@/lib/data";
import { placeBySlug, eventsForPlace } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

export default function CityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const here = eventsForPlace(place);
  const nearby = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const intro =
    lang === "fr"
      ? `Les meilleures rave parties, free parties et soirées techno à ${place.label} et aux alentours — dates, line-ups et billetterie, mis à jour en continu. Ne rate plus jamais une soirée près de chez toi.`
      : `The best rave parties, free parties and techno nights in and around ${place.label} — dates, line-ups and tickets, updated continuously. Never miss a party near you again.`;

  const faq =
    lang === "fr"
      ? [
          [`Y a-t-il une rave party à ${place.label} ce week-end ?`, `Consulte la liste ci-dessus : on référence les événements électro à ${place.label} et aux alentours, mis à jour en continu. Active une alerte pour être prévenu des nouvelles dates.`],
          [`Comment trouver une free party à ${place.label} ?`, `Les free parties sont souvent annoncées à la dernière minute. Crée une alerte « Free party » sur ${place.label} et reçois les coordonnées dès qu'elles tombent.`],
        ]
      : [
          [`Is there a rave party in ${place.label} this weekend?`, `Check the list above — we track electronic events in and around ${place.label}, updated continuously. Set an alert to hear about new dates first.`],
          [`How do I find a free party in ${place.label}?`, `Free parties are often announced last minute. Create a "Free party" alert for ${place.label} and get the coordinates as soon as they drop.`],
        ];

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Link href={`${p}/villes`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {t("nav.cities")}
          </Link>
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            Rave party <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("city.events")} · {place.label}
          </h2>
          {here.length > 0 ? (
            <div className="grid grid-4">
              {here.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="info-card">
              <p className="lead" style={{ fontSize: "1rem", marginBottom: 18 }}>
                {t("city.empty")}
              </p>
              <Link href={`${p}/account`} className="btn btn-primary">
                🔔 {t("city.alert")}
              </Link>
            </div>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.nearby")}
          </h2>
          <div className="grid grid-4">
            {nearby.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.faq")}
          </h2>
          <div className="grid grid-2">
            {faq.map(([q, a]) => (
              <div className="info-card" key={q}>
                <h3 className="h-md" style={{ fontSize: "1.1rem", marginBottom: 10 }}>
                  {q}
                </h3>
                <p className="lead" style={{ fontSize: ".95rem" }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
