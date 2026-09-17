import Link from "next/link";
import ArtistPill from "./ArtistPill";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { cardEvent, countryLabel, genreSlug, isPast, slugify, todayISO } from "@/lib/data";
import { outboundRel } from "@/lib/display";
import { hasArtistPage } from "@/lib/artists";
import {
  PROMOTERS,
  eventsForPromoter,
  promoterBySlug,
  promoterCities,
  promoterGenres,
  promoterRegulars,
  promoterVenues,
} from "@/lib/promoters";
import { venueBySlug } from "@/lib/venues";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, promoterJsonLd } from "@/lib/seo";
import { promoterCopy } from "@/lib/pagecopy";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";
import Fold from "./Fold";

/**
 * La fiche d'un organisateur.
 *
 * Elle répond à ce qu'on tape avant d'arriver, « quelles sont les prochaines dates de
 * cette marque », et elle ouvre deux arêtes de maillage que le site n'avait pas :
 * marque vers salle et marque vers artiste. Aucune adresse n'est écrite, un
 * organisateur n'en a pas, c'est la fiche de salle qui porte le lieu.
 */
export default function PromoterPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const promoter = promoterBySlug(slug);
  if (!promoter) return notFound();

  const today = todayISO();
  const events = eventsForPromoter(slug);
  const live = events.filter((e) => !isPast(e, today));
  const done = events.filter((e) => isPast(e, today));
  const genres = promoterGenres(slug);
  const cities = promoterCities(slug);
  const venues = promoterVenues(slug);
  /* Un nom du line-up n'a pas forcément de fiche : `ARTISTS` est dérivé des line-ups
     au build, et lier un nom sans page donnerait un 404 sur une page indexée. Même
     règle que `hasArtistPage()` sur une fiche corrigée depuis `/api/event-edit`. */
  const regulars = promoterRegulars(slug, 18);
  const desc = (lang === "en" && promoter.descEn) || promoter.desc;
  const copy = promoterCopy(promoter, lang, {
    live,
    done,
    cities,
    venues,
    genres,
    regulars: regulars.slice(0, 5).map((r) => r.name),
  });
  const others = PROMOTERS.filter((x) => x.slug !== promoter.slug && x.country === promoter.country).slice(0, 12);
  const links = [promoter.site, promoter.instagram].filter((x): x is string => Boolean(x));

  const trail: [string, string][] = [
    [t("nav.organizers"), "/organisateurs"],
    [promoter.name, `/organisateurs/${promoter.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          promoterJsonLd(
            { ...promoter, desc },
            live,
            lang,
            links,
          ),
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(copy.faq),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t(`promoters.kind.${promoter.kind}`)} · {promoter.city}, {countryLabel(promoter.country, lang)}
            {promoter.since ? ` · ${t("promoters.since")} ${promoter.since}` : ""}
          </span>
          <h1 className="h-lg" style={{ margin: "10px 0 8px" }}>
            {promoter.name}
          </h1>
          <p className="lead">{desc}</p>
          <p className="lead" style={{ fontSize: ".95rem" }}>
            {copy.context}
          </p>

          <div className="linkfarm" style={{ marginTop: 18 }}>
            {genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
              </Link>
            ))}
            {links.map((href) => (
              <a key={href} href={href} target="_blank" rel={outboundRel()}>
                {href.includes("instagram.") ? "Instagram" : t("promoter.site")} ↗
              </a>
            ))}
          </div>

          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("promoter.agenda")}
          </h2>
          {live.length > 0 ? (
            <div className="grid grid-4">
              {live.map((e) => (
                <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
              ))}
            </div>
          ) : (
            <p className="lead">{t("promoter.nodates")}</p>
          )}

          {done.length > 0 && (
            <Fold title={<>{t("fest.past")}</>}>
              <div className="grid grid-4">
                {done.map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </Fold>
          )}

          {venues.length > 0 && (
            <Fold title={<>{t("promoter.venues")}</>}>
              <div className="linkfarm">
                {/* Une salle n'est liée que si elle a bien une page : un libellé qui
                    décrit un ensemble de lieux est écarté de `VENUES`, le lier
                    donnerait un 404. */}
                {venues.map((v) =>
                  venueBySlug(v.slug) ? (
                    <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                      🏛 {v.name} <span>{v.count}</span>
                    </Link>
                  ) : (
                    <span key={v.slug}>
                      🏛 {v.name} <span>{v.count}</span>
                    </span>
                  ),
                )}
              </div>
            </Fold>
          )}

          {cities.length > 0 && (
            <Fold title={<>{t("promoter.cities")}</>}>
              <div className="linkfarm">
                {cities.map((c) => {
                  /* Jamais un lien vers `/rave-party/{ville}` sans vérifier que le
                     slug existe dans `PLACES` : toutes les villes du calendrier n'ont
                     pas de page. */
                  const place = PLACES.find((x) =>
                    (x.match ?? [x.label]).some((m) => slugify(m) === slugify(c.city)),
                  );
                  return place ? (
                    <Link key={c.city} href={`${p}/rave-party/${place.slug}`}>
                      📍 Rave party {place.label} <span>{c.count}</span>
                    </Link>
                  ) : (
                    <span key={c.city}>
                      📍 {c.city} <span>{c.count}</span>
                    </span>
                  );
                })}
              </div>
            </Fold>
          )}

          {regulars.length > 0 && (
            <Fold title={<>{t("promoter.artists")}</>}>
              <div className="linkfarm">
                {regulars
                  .filter((r) => hasArtistPage(slugify(r.name)))
                  .map((r) => (
                    <ArtistPill
                      key={r.name}
                      href={`${p}/artistes/${slugify(r.name)}`}
                      name={r.name}
                      slug={slugify(r.name)}
                    />
                  ))}
              </div>
            </Fold>
          )}

          {copy.faq.length > 0 && (
            <Fold title={<>{t("copy.faqpromoter").replace("{t}", promoter.name)}</>}>
              <div className="grid grid-2">
                {copy.faq.map(([q, a]) => (
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
            </Fold>
          )}

          {others.length > 0 && (
            <Fold title={<>{t("promoter.others")}</>}>
              <div className="linkfarm">
                {others.map((o) => (
                  <Link key={o.slug} href={`${p}/organisateurs/${o.slug}`}>
                    {o.name}
                  </Link>
                ))}
              </div>
            </Fold>
          )}
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
