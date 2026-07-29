import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, COUNTRY_FLAG, genreSlug, isPast, slugify, todayISO } from "@/lib/data";
import { COUNTRIES_INDEX, countryBySlug, countryName, eventsForCountry } from "@/lib/countries";
import { PLACES } from "@/lib/places";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function CountryPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const country = countryBySlug(slug);
  if (!country) return notFound();

  const today = todayISO();
  const label = countryName(country.name, lang);
  const flag = COUNTRY_FLAG[country.name] ?? "";
  const events = eventsForCountry(country.name);
  const live = events.filter((e) => !isPast(e, today));
  const past = events.filter((e) => isPast(e, today));

  const cities = [...new Set(events.map((e) => e.city))].sort();
  const genres = ALL_GENRES.filter((g) => live.some((e) => e.genres.includes(g)));
  // Only link places and venues that actually exist as routes.
  const localPlaces = PLACES.filter((pl) =>
    events.some((e) => (pl.match ?? [pl.label]).some((m) => slugify(m) === slugify(e.city)))
  );
  const localVenues = VENUES.filter((v) => v.country === country.name).slice(0, 24);
  const others = COUNTRIES_INDEX.filter((c) => c.slug !== country.slug);

  const intro =
    lang === "fr"
      ? `${live.length} événement${live.length > 1 ? "s" : ""} de musique électronique à venir en ${label}${
          cities.length ? ` — ${cities.slice(0, 6).join(", ")}${cities.length > 6 ? "…" : ""}` : ""
        }. Festivals, clubs et warehouses : dates, line-ups et billetterie officielle, mis à jour en continu.`
      : `${live.length} upcoming electronic music event${live.length > 1 ? "s" : ""} in ${label}${
          cities.length ? ` — ${cities.slice(0, 6).join(", ")}${cities.length > 6 ? "…" : ""}` : ""
        }. Festivals, clubs and warehouses: dates, line-ups and official ticketing, updated continuously.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            `Quels sont les meilleurs festivals techno en ${label} ?`,
            live.length
              ? `Les prochaines dates référencées sont ${live
                  .slice(0, 5)
                  .map((e) => e.title)
                  .join(", ")}. Chaque fiche donne les dates, le line-up et le lien vers la billetterie officielle.`
              : `Aucune date n'est confirmée en ${label} pour le moment. Les éditions passées restent consultables et une alerte te prévient dès qu'une nouvelle date tombe.`,
          ],
          [
            `Dans quelles villes sortir en ${label} ?`,
            cities.length
              ? `On référence des événements à ${cities.slice(0, 8).join(", ")}. Chaque ville a sa propre page avec l'agenda complet.`
              : `Pas encore de ville couverte en ${label}.`,
          ],
          [
            `Comment acheter ses billets ?`,
            `Chaque fiche renvoie vers la billetterie officielle de l'organisateur. On n'affiche jamais de revente, et le prix indiqué est le tarif d'entrée le plus bas connu — signalé comme « indicatif » tant qu'il n'est pas confirmé.`,
          ],
        ]
      : [
          [
            `What are the best techno festivals in ${label}?`,
            live.length
              ? `The next listed dates are ${live
                  .slice(0, 5)
                  .map((e) => e.title)
                  .join(", ")}. Each listing has the dates, the line-up and a link to official ticketing.`
              : `No dates are confirmed in ${label} right now. Past editions stay browsable and an alert will tell you when a new date drops.`,
          ],
          [
            `Which cities should I go out in in ${label}?`,
            cities.length
              ? `We list events in ${cities.slice(0, 8).join(", ")}. Each city has its own page with the full agenda.`
              : `No city covered in ${label} yet.`,
          ],
          [
            `How do I buy tickets?`,
            `Every listing links to the promoter's official ticket shop. We never show resale, and the price shown is the lowest known entry price — flagged as indicative until it is confirmed.`,
          ],
        ];

  const trail: [string, string][] = [
    [t("nav.countries"), "/pays"],
    [label, `/pays/${country.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          ...(events.length ? [itemListJsonLd(events, lang, `${t("country.h1")} ${label}`)] : []),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            {flag} {t("country.h1")} <span className="gradient-text">{label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>📅 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
            {genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g} {label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("hub.next")} · {label}
          </h2>
          {live.length > 0 ? (
            <div className="grid grid-4">
              {live.map((e) => (
                <EventCard key={e.id} e={e} lang={lang} today={today} />
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

          {localPlaces.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("hub.bycity")} · {label}
              </h2>
              <div className="linkfarm">
                {localPlaces.map((pl) => (
                  <Link key={pl.slug} href={`${p}/rave-party/${pl.slug}`}>
                    Rave party {pl.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          {localVenues.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("hub.venues")} · {label}
              </h2>
              <div className="linkfarm">
                {localVenues.map((v) => (
                  <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                    🏛 {v.name} · {v.city}
                  </Link>
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")} · {label}
              </h2>
              <div className="grid grid-4">
                {past.slice(0, 8).map((e) => (
                  <EventCard key={e.id} e={e} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("country.others")}
          </h2>
          <div className="linkcols">
            {others.map((c) => (
              <Link key={c.slug} href={`${p}/pays/${c.slug}`}>
                {COUNTRY_FLAG[c.name] ?? ""} {t("country.h1")} {countryName(c.name, lang)}
              </Link>
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
