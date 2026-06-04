import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { countryLabel } from "@/lib/data";
import { venueBySlug, eventsForVenue } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

export default function VenuePage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const venue = venueBySlug(slug);
  if (!venue) return notFound();
  const events = eventsForVenue(slug);

  const intro =
    lang === "fr"
      ? `Tout l'agenda de ${venue.name} à ${venue.city} : line-ups, dates et billetterie des prochaines soirées et festivals.`
      : `The full agenda for ${venue.name} in ${venue.city}: line-ups, dates and tickets for upcoming parties and festivals.`;

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Link href={`${p}/lieux`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {t("nav.venues")}
          </Link>
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("venue.eyebrow")} · {venue.city}, {countryLabel(venue.country, lang)}
          </span>
          <h1 className="h-lg" style={{ margin: "10px 0 8px" }}>
            {venue.name}
          </h1>
          <p className="lead">{intro}</p>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("venue.agenda")}
          </h2>
          <div className="grid grid-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
