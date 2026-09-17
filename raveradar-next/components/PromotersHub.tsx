import Link from "next/link";
import type { Lang } from "@/lib/types";
import {
  cardEvent,
  countryLabel,
  eventPath,
  genreSlug,
  imageSourceOf,
  imageThumb,
  slugify,
  todayISO,
} from "@/lib/data";
import {
  PROMOTERS,
  eventsForPromoter,
  promoterCities,
  promoterGenres,
  promoterRegulars,
  promoterUpcoming,
  promoterVenues,
} from "@/lib/promoters";
import { hasArtistPage } from "@/lib/artists";
import { fmtDate, imageAlt } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import ArtistPill from "./ArtistPill";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";
import Fold from "./Fold";

/**
 * Le hub des organisateurs.
 *
 * Trois étages, comme `/villes` et `/lieux` : ce que la page promet, douze marques
 * développées, puis l'annuaire complet. Chaque ligne porte son nombre de dates à
 * venir, sans quoi une pilule promettrait un agenda et tomberait sur une archive,
 * ce que la règle du compteur interdit depuis `topPlaces()`.
 */
export default function PromotersHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();

  const rows = PROMOTERS.map((promoter) => {
    const live = promoterUpcoming(promoter.slug, today);
    return {
      promoter,
      live,
      n: live.length,
      next: [...live].sort((a, b) => a.date.localeCompare(b.date))[0],
    };
  }).sort((a, b) => b.n - a.n || a.promoter.name.localeCompare(b.promoter.name));

  const open = rows.filter((r) => r.n > 0).length;
  const countries = [...new Set(PROMOTERS.map((x) => x.country))];

  const featured = rows
    .filter((r) => r.n >= 2)
    .slice(0, 12)
    .map((r) => {
      /* L'affiche d'une soirée est ici le sujet, pas un événement étranger à la page :
         c'est l'artwork de la marque. C'est la différence avec une carte de salle, qui
         ne peut montrer qu'une photo du lieu (cf. `VENUE_SHOTS`). */
      const shot = eventsForPromoter(r.promoter.slug)
        .map((e) => ({ e, src: imageThumb(e) }))
        .find((x) => x.src);
      return {
        ...r,
        shot,
        genres: promoterGenres(r.promoter.slug).slice(0, 3),
        cities: promoterCities(r.promoter.slug).slice(0, 3),
        venues: promoterVenues(r.promoter.slug).length,
        regulars: promoterRegulars(r.promoter.slug, 4).filter((x) => hasArtistPage(slugify(x.name))),
      };
    });

  const dates = rows.flatMap((r) => r.live);
  const next = [...dates].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const intro =
    lang === "fr"
      ? `${PROMOTERS.length} organisateurs référencés dans ${countries.length} pays, ${open} avec au moins une date à venir. Chaque fiche donne l'agenda complet de la marque, les salles où elle pose ses nuits et les artistes qui reviennent sur ses affiches.`
      : `${PROMOTERS.length} promoters listed across ${countries.length} countries, ${open} with at least one upcoming date. Each page gives the brand's full agenda, the rooms it books and the artists that come back on its bills.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "Quelle différence entre un organisateur et un lieu ?",
            "Le lieu est la salle, avec son adresse et sa jauge ; l'organisateur est la marque qui programme la nuit, et elle change souvent de salle. Les deux ont leur page, et elles ne disent pas la même chose : une marque qui ne programme qu'une seule salle n'a d'ailleurs pas de fiche ici, la page du lieu répond déjà, en mieux.",
          ],
          [
            "Comment une marque entre dans cet annuaire ?",
            "Elle doit avoir des dates à notre catalogue, et un programme qui déborde d'un seul lieu : au moins deux salles ou deux villes. Le calcul se refait à chaque publication, donc une marque entre d'elle-même le jour où elle programme ailleurs.",
          ],
          [
            "D'où viennent les informations sur chaque marque ?",
            "La présentation, la ville d'attache et l'année de création viennent d'une source citée au moment de la saisie (site officiel, presse, page publique de la marque). Sans source, le champ reste vide : nous préférons une absence à une approximation.",
          ],
          [
            "Vous vendez des billets pour ces soirées ?",
            "Non. Chaque date renvoie vers la billetterie annoncée par l'organisateur. Certains de ces liens sont rémunérés, ils portent alors la mention correspondante.",
          ],
        ]
      : [
          [
            "What is the difference between a promoter and a venue?",
            "The venue is the room, with its address and capacity; the promoter is the brand programming the night, and it often moves between rooms. Both have pages, and they do not say the same thing: a brand that only books one room gets no page here, because the venue page already answers, better.",
          ],
          [
            "How does a brand enter this directory?",
            "It needs dates in our catalogue and a programme that goes beyond a single room: at least two venues or two cities. The check runs at every publication, so a brand enters by itself the day it books elsewhere.",
          ],
          [
            "Where does the information on each brand come from?",
            "The description, home city and founding year come from a source cited at entry time (official site, press, the brand's own public page). With no source, the field stays empty: an absence beats an approximation.",
          ],
          [
            "Do you sell tickets for these nights?",
            "No. Each date links to the ticketing announced by the promoter. Some of those links are paid, and they carry the corresponding disclosure.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.organizers"), "/organisateurs"]];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(trail, lang), faqJsonLd(faq)]} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("promoters.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("promoters.title")}
          </h1>
          <p className="lead">{t("promoters.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
          </div>

          {featured.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "44px 0 6px" }}>
                {t("promoters.detail")}
              </h2>
              <p className="lead" style={{ fontSize: ".95rem", marginBottom: 22 }}>
                {t("promoters.detaillead").replace("{n}", String(open))}
              </p>
              <div className="venuecards">
                {featured.map((r) => (
                  <article className="venuecard" key={r.promoter.slug}>
                    {r.shot?.src ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="venuecard-shot"
                        src={r.shot.src}
                        alt={imageAlt(r.shot.e, lang, imageSourceOf(r.shot.e))}
                        width={96}
                        height={120}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="venuecard-shot venuecard-noshot" aria-hidden="true">
                        🎛
                      </span>
                    )}
                    <div className="venuecard-body">
                      <h3 className="venuecard-name">
                        <Link href={`${p}/organisateurs/${r.promoter.slug}`}>{r.promoter.name}</Link>
                      </h3>
                      <div className="venuecard-facts">
                        <span>
                          📍 {r.promoter.city}, {countryLabel(r.promoter.country, lang)}
                        </span>
                        <span>{t(`promoters.kind.${r.promoter.kind}`)}</span>
                        <span>
                          {r.n} {t(r.n > 1 ? "dyn.dates" : "dyn.date")}
                        </span>
                      </div>
                      {r.genres.length > 0 && (
                        <div className="venuecard-line">
                          <em>{t("venues.plays")}</em>
                          <div className="linkfarm">
                            {r.genres.map((g) => (
                              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                                {g}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.regulars.length > 0 && (
                        <div className="venuecard-line">
                          <em>{t("venues.regulars")}</em>
                          <div className="linkfarm">
                            {r.regulars.map((x) => (
                              <ArtistPill
                                key={x.name}
                                href={`${p}/artistes/${slugify(x.name)}`}
                                name={x.name}
                                slug={slugify(x.name)}
                                count={x.count}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {r.next && (
                        <p className="venuecard-next">
                          <em>{t("promoters.next")}</em>{" "}
                          <Link href={`${p}${eventPath(r.next)}`}>
                            {fmtDate(r.next.date, lang)} · {r.next.title}
                          </Link>
                        </p>
                      )}
                      <Link className="venuecard-go" href={`${p}/organisateurs/${r.promoter.slug}`}>
                        {t("promoters.see")}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "44px 0 16px" }}>
            {t("promoters.all")}
          </h2>
          <div className="artist-grid">
            {rows.map(({ promoter, n }) => (
              <Link key={promoter.slug} href={`${p}/organisateurs/${promoter.slug}`} className="artist-tile">
                <div className="av">🎛</div>
                <div className="artist-tile-txt">
                  <b>{promoter.name}</b>
                  <span>
                    {promoter.city}, {countryLabel(promoter.country, lang)} ·{" "}
                    {n > 0 ? `${n} ${t(n > 1 ? "dyn.events" : "dyn.event")}` : t("hub.past")}
                    <em>{promoterGenres(promoter.slug).slice(0, 3).join(" · ")}</em>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {next.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("hub.next")}
              </h2>
              <div className="grid grid-4">
                {next.map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <Fold title={<>{t("promoters.faq")}</>}>
            <div className="grid grid-2">
              {faq.map(([q, ans]) => (
                <div className="info-card" key={q}>
                  <h3 className="h-md" style={{ fontSize: "1.1rem", marginBottom: 10 }}>
                    {q}
                  </h3>
                  <p className="lead" style={{ fontSize: ".95rem" }}>
                    {ans}
                  </p>
                </div>
              ))}
            </div>
          </Fold>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
