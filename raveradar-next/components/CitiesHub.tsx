import Link from "next/link";
import type { Lang } from "@/lib/types";
import { PLACES } from "@/lib/places";
import { ALL_GENRES, FESTIVALS, eventSlug, genreSlug, liveEditions, nextUp, todayISO, upcoming } from "@/lib/data";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import SearchableLinks from "./SearchableLinks";
import JsonLd from "./JsonLd";

export default function CitiesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const villes = PLACES.filter((x) => x.kind === "ville");
  const zones = PLACES.filter((x) => x.kind !== "ville");
  const live = upcoming(undefined, today);
  const next = nextUp(4, undefined, today);
  // "Top festivals" is a shortlist of names, so each finished edition is swapped for the
  // next one rather than dropped — the block keeps its famous entries and none of them
  // lands on a page stamped "édition terminée". Empty stays empty: no archive fallback.
  const fests = liveEditions(FESTIVALS, today).slice(0, 24);
  // Venues carry the club-name intent ("Berghain", "Rex Club") that a city page can't rank for.
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 16);
  // Slug + bare name only: the "📍 Rave party" prefix is decoration the pill adds,
  // not something a reader typing "lyon" should have to match.
  const placeItems = (list: typeof PLACES) => list.map((v) => ({ slug: v.slug, term: v.label }));

  const intro =
    lang === "fr"
      ? `${PLACES.length} villes, départements et régions couverts, ${live.length} événement${
          live.length > 1 ? "s" : ""
        } à venir. Choisis ta zone : chaque page réunit les festivals et les soirées électro du coin, avec les dates, les line-ups et la billetterie officielle.`
      : `${PLACES.length} cities, counties and regions covered, ${live.length} upcoming event${
          live.length > 1 ? "s" : ""
        }. Pick your area: each page gathers the local festivals and electronic events with dates, line-ups and official ticketing.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "Comment trouver une rave party près de chez moi ?",
            "Choisis ta ville ou ton département dans les listes ci-dessus : chaque page regroupe les festivals et les soirées de la zone. Pour aller plus vite, la page « Autour de moi » utilise ta position et trie les événements par distance.",
          ],
          [
            "Quelles villes et quels départements sont couverts ?",
            "Les grandes villes françaises (Lyon, Paris, Rennes, Bordeaux, Nantes, Marseille, Toulouse…), les départements qui accueillent des festivals en plein air (Drôme, Lozère, Aude, Lot, Isère, Hérault…) et les capitales européennes de la techno : Berlin, Amsterdam, Rotterdam, Londres, Barcelone.",
          ],
          [
            "Y a-t-il des soirées ce week-end ?",
            "Oui. La page « Ce week-end » rassemble tout ce qui se passe dans les prochains jours en Europe, du club au champ de festival, avec le prix d'entrée et le lien billetterie.",
          ],
          [
            "Comment sont classés les festivals ?",
            "Chaque ville a sa page « Festival » dédiée, et chaque festival sa fiche avec le line-up complet, les dates exactes et la billetterie officielle. Les éditions passées restent en ligne, signalées comme terminées.",
          ],
        ]
      : [
          [
            "How do I find a rave party near me?",
            "Pick your city or region from the lists above: each page gathers the local festivals and club nights. The \"Near me\" page uses your location and sorts events by distance.",
          ],
          [
            "Which cities and regions are covered?",
            "Major French cities (Lyon, Paris, Rennes, Bordeaux, Nantes, Marseille, Toulouse…), the French counties that host open-air festivals (Drôme, Lozère, Aude, Lot, Isère, Hérault…) and Europe's techno capitals: Berlin, Amsterdam, Rotterdam, London, Barcelona.",
          ],
          [
            "Is anything on this weekend?",
            "Yes. The \"This weekend\" page collects everything happening across Europe in the next few days, from club nights to festival fields, with entry prices and ticket links.",
          ],
          [
            "How are festivals organised?",
            "Every city has its own Festival page, and every festival its own listing with the full line-up, exact dates and official ticketing. Past editions stay online, flagged as finished.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.cities"), "/villes"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(next, lang, t("cities.title"), today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("cities.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("cities.title")}
          </h1>
          <p className="lead">{t("cities.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
          </div>

          {next.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
                {t("hub.next")}
              </h2>
              <div className="grid grid-4">
                {next.map((e) => (
                  <EventCard key={e.id} e={e} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          {/* 90 places is past the point where a reader scans a wall of pills for their
              own town. The box filters both lists at once, and every link stays in the
              server-rendered HTML — the crawler still sees the whole mesh. */}
          <SearchableLinks
            groups={[
              { title: t("cities.bigcities"), items: placeItems(villes) },
              { title: t("cities.depts"), items: placeItems(zones) },
            ]}
            hrefBase={`${p}/rave-party/`}
            labelPrefix="📍 Rave party "
            placeholder={t("filter.cities")}
            countLabel={t("filter.count")}
            emptyLabel={t("filter.none")}
            clearLabel={t("filter.clear")}
          />

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("cities.festbycity")}
          </h2>
          <div className="linkcols">
            {villes.map((v) => (
              <Link key={v.slug} href={`${p}/festival/${v.slug}`}>
                Festival {v.label}
              </Link>
            ))}
          </div>

          {fests.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
                {t("cities.topfest")}
              </h2>
              <div className="linkcols">
                {fests.map((e) => (
                  <Link key={e.id} href={`${p}/festival/${eventSlug(e)}`}>
                    ✦ {e.title}
                  </Link>
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.venues")}
          </h2>
          <div className="linkfarm">
            {venues.map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                🏛 {v.name}
              </Link>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("hub.bygenre")}
          </h2>
          <div className="linkfarm">
            {ALL_GENRES.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
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
