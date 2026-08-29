import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, EVENTS, genreSlug, isPast, nextUp, todayISO, cardEvent } from "@/lib/data";
import { PLACES, placeBySlug, eventsForPlace } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import JsonLd from "./JsonLd";

export default function CityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const today = todayISO();
  const here = eventsForPlace(place);
  // Upcoming and finished as two lists: `eventsForPlace` returns upcoming-first, but
  // run together the archive just trails off the end of the grid with no boundary.
  const liveHere = here.filter((e) => !isPast(e, today));
  const pastHere = here.filter((e) => isPast(e, today));
  const hereIds = new Set(here.map((e) => e.id));
  const nearby = nextUp(4, EVENTS.filter((e) => !hereIds.has(e.id)), today);

  // Sibling places of the same kind, the horizontal mesh between geo pages.
  const siblings = PLACES.filter((x) => x.slug !== place.slug && x.kind === place.kind).slice(0, 12);
  const otherKinds = PLACES.filter((x) => x.kind !== place.kind).slice(0, 12);
  // Genres that actually have something on here, so the link always lands on content.
  const localGenres = ALL_GENRES.filter((g) => here.some((e) => e.genres.includes(g)));

  const intro =
    lang === "fr"
      ? `Les meilleurs festivals électro et soirées techno à ${place.label} et aux alentours, dates, line-ups et billetterie, mis à jour en continu. Ne rate plus jamais une soirée près de chez toi.`
      : `The best electronic festivals and techno nights in and around ${place.label}, dates, line-ups and tickets, updated continuously. Never miss a party near you again.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            `Y a-t-il une rave party à ${place.label} ce week-end ?`,
            `Consulte la liste ci-dessus : on référence les événements électro à ${place.label} et aux alentours, mis à jour en continu. Active une alerte pour être prévenu des nouvelles dates.`,
          ],
          [
            `Comment être prévenu des nouvelles dates à ${place.label} ?`,
            `Crée une alerte sur ${place.label} : dès qu'un festival ou une soirée est confirmé dans la zone, tu reçois la date, le line-up et le lien billetterie par mail.`,
          ],
          [
            `Quels festivals de musique électronique près de ${place.label} ?`,
            `Retrouve tous les festivals techno, house, hardstyle et psytrance de la zone sur la page Festival ${place.label}, avec les dates, les line-ups et la billetterie officielle.`,
          ],
          [
            `Combien coûte une soirée techno à ${place.label} ?`,
            `Les tarifs vont de l'entrée libre (parades, scènes ouvertes) à 40-90 € pour un festival. Chaque fiche événement affiche le prix d'entrée le plus bas connu et le lien vers la billetterie officielle.`,
          ],
        ]
      : [
          [
            `Is there a rave party in ${place.label} this weekend?`,
            `Check the list above, we track electronic events in and around ${place.label}, updated continuously. Set an alert to hear about new dates first.`,
          ],
          [
            `How do I hear about new dates in ${place.label}?`,
            `Set an alert for ${place.label}: as soon as a festival or a club night is confirmed in the area, you get the date, the line-up and the ticket link by email.`,
          ],
          [
            `Which electronic music festivals are near ${place.label}?`,
            `Every techno, house, hardstyle and psytrance festival in the area is listed on the Festival ${place.label} page, with dates, line-ups and official ticketing.`,
          ],
          [
            `How much does a techno night in ${place.label} cost?`,
            `Anywhere from free (parades, open stages) to €40-90 for a festival. Each event page shows the lowest known entry price and links to the official ticket shop.`,
          ],
        ];

  const trail: [string, string][] = [
    [t("nav.cities"), "/villes"],
    [place.label, `/rave-party/${place.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(here, lang, `Rave party ${place.label}`, today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            Rave party <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="city" value={place.slug} label={place.label} />

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/festival/${place.slug}`}>
              🎪 {lang === "fr" ? "Festivals" : "Festivals"} {place.label}
            </Link>
            <Link href={`${p}/rave-party/ce-week-end`}>📅 {lang === "fr" ? "Ce week-end" : "This weekend"}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {lang === "fr" ? "Autour de moi" : "Near me"}</Link>
            {localGenres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g} {place.label}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("city.events")} · {place.label}
          </h2>
          {liveHere.length > 0 ? (
            <div className="grid grid-4">
              {liveHere.map((e) => (
                <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
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

          {pastHere.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")} · {place.label}
              </h2>
              <div className="grid grid-4">
                {pastHere.slice(0, 8).map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.nearby")}
          </h2>
          <div className="grid grid-4">
            {nearby.map((e) => (
              <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("city.otherplaces")}
          </h2>
          <div className="linkcols">
            {[...siblings, ...otherKinds].map((x) => (
              <Link key={x.slug} href={`${p}/rave-party/${x.slug}`}>
                Rave party {x.label}
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
