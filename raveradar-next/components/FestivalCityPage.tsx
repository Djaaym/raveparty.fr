import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, FESTIVALS, genreSlug, isPast, nextUp, todayISO, cardEvent } from "@/lib/data";
import { PLACES, placeBySlug, eventsForPlace } from "@/lib/places";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function FestivalCityPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const place = placeBySlug(slug);
  if (!place) return notFound();

  const today = todayISO();
  const year = today.slice(0, 4);
  const here = eventsForPlace(place).filter((e) => e.type === "Festival");
  const hereIds = new Set(here.map((e) => e.id));
  const liveHere = here.filter((e) => !isPast(e, today));
  const pastHere = here.filter((e) => isPast(e, today));
  const nearby = nextUp(4, FESTIVALS.filter((e) => !hereIds.has(e.id)), today);

  // Only link genres and venues that this place actually has content for.
  const localGenres = ALL_GENRES.filter((g) => here.some((e) => e.genres.includes(g)));
  const localVenues = VENUES.filter((v) => v.eventIds.some((id) => hereIds.has(id)));
  const otherPlaces = PLACES.filter((x) => x.slug !== place.slug);

  const intro =
    lang === "fr"
      ? `Tous les festivals de musique électronique à ${place.label} et dans les environs : techno, hardstyle, psytrance, drum & bass… Dates, line-ups et billetterie, mis à jour en continu.`
      : `Every electronic music festival in and around ${place.label}: techno, hardstyle, psytrance, drum & bass… Dates, line-ups and tickets, updated continuously.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            `Quels festivals de musique électronique à ${place.label} en ${year} ?`,
            liveHere.length
              ? `${liveHere.length} festival${liveHere.length > 1 ? "s" : ""} à venir sont référencés à ${place.label} et aux alentours : ${liveHere
                  .slice(0, 4)
                  .map((e) => e.title)
                  .join(", ")}. Chaque fiche donne les dates exactes, le line-up et la billetterie officielle.`
              : `Aucun festival n'est confirmé à ${place.label} pour le moment. Les éditions passées restent consultables ci-dessous, et une alerte te prévient dès qu'une nouvelle date tombe.`,
          ],
          [
            `Quand ont lieu les festivals à ${place.label} ?`,
            `La saison des festivals en plein air court de mai à septembre ; le reste de l'année, la programmation se déplace vers les clubs et les entrepôts. Les dates affichées ici sont celles annoncées par les organisateurs.`,
          ],
          [
            `Où acheter les billets pour un festival à ${place.label} ?`,
            `Chaque fiche festival renvoie vers la billetterie officielle de l'organisateur. On n'affiche pas de revente : le prix indiqué est le tarif d'entrée le plus bas connu.`,
          ],
          [
            `Y a-t-il des festivals gratuits à ${place.label} ?`,
            `Oui, certaines parades et scènes ouvertes sont à entrée libre — elles sont signalées « Gratuit » sur leur fiche. Pour les soirées club et les autres dates de la zone, voir la page Rave party ${place.label}.`,
          ],
        ]
      : [
          [
            `Which electronic music festivals are on in ${place.label} in ${year}?`,
            liveHere.length
              ? `${liveHere.length} upcoming festival${liveHere.length > 1 ? "s are" : " is"} listed in and around ${place.label}: ${liveHere
                  .slice(0, 4)
                  .map((e) => e.title)
                  .join(", ")}. Each listing has the exact dates, the line-up and official ticketing.`
              : `No festival is confirmed in ${place.label} right now. Past editions stay browsable below, and an alert will tell you as soon as a new date drops.`,
          ],
          [
            `When is festival season in ${place.label}?`,
            `Outdoor festival season runs from May to September; the rest of the year the programming moves into clubs and warehouses. The dates shown here are the ones announced by the promoters.`,
          ],
          [
            `Where do I buy tickets for a festival in ${place.label}?`,
            `Every festival listing links to the promoter's official ticket shop. We don't list resale: the price shown is the lowest known entry price.`,
          ],
          [
            `Are there free festivals in ${place.label}?`,
            `Yes — some parades and open stages have free entry and are flagged "Free" on their listing. For club nights and the other dates in the area, see the Rave party ${place.label} page.`,
          ],
        ];

  const trail: [string, string][] = [
    [t("nav.cities"), "/villes"],
    [place.label, `/rave-party/${place.slug}`],
    [`Festivals ${place.label}`, `/festival/${place.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(here, lang, `Festival ${place.label}`, today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <h1 className="h-lg" style={{ margin: "14px 0 10px" }}>
            Festivals <span className="gradient-text">{place.label}</span>
          </h1>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/${place.slug}`}>📍 Rave party {place.label}</Link>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            {localGenres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g} {place.label}
              </Link>
            ))}
            {localVenues.map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                🏛 {v.name}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {lang === "fr" ? "Festivals à venir" : "Upcoming festivals"} · {place.label}
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

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("cities.festbycity")}
          </h2>
          <div className="linkcols">
            {otherPlaces.map((x) => (
              <Link key={x.slug} href={`${p}/festival/${x.slug}`}>
                Festival {x.label}
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
