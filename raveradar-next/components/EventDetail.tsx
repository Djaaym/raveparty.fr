import Link from "next/link";
import type { Lang, RaveEvent } from "@/lib/types";
import { artistPhoto } from "@/lib/artist-photos";
import {
  EVENTS,
  countryLabel,
  eventDescL, eventVenueL,
  genreSlug,
  isLive,
  isPast,
  lastDay,
  nextEdition,
  slugify,
  ticketRel,
  ticketUrl,
  todayISO,
  upcoming, cardEvent, eventPath } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { fmtDate, priceLabel } from "@/lib/format";
import { guideFor, guideParentOf, pick } from "@/lib/guides";
import { getDict, langPrefix } from "@/lib/i18n";
import { eventSocials, sameAs } from "@/lib/socials";
import { breadcrumbJsonLd, eventJsonLd, faqJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import FavButton from "./FavButton";
import FestivalGuide from "./FestivalGuide";
import HeroImage from "./HeroImage";
import HotelsCard from "./HotelsCard";
import MiniMap from "./MiniMap";
import Breadcrumbs from "./Breadcrumbs";
import SocialsCard from "./SocialsCard";
import JsonLd from "./JsonLd";

/** The place page that best matches this event, its department first, then its city. */
function placeFor(e: RaveEvent) {
  const norm = (s: string) => slugify(s);
  return (
    PLACES.find((p) => e.region && norm(p.label) === norm(e.region)) ??
    PLACES.find((p) => (p.match ?? [p.label]).some((m) => norm(m) === norm(e.city)))
  );
}

export default function EventDetail({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const done = isPast(e);
  const live = isLive(e);
  const next = done ? nextEdition(e) : undefined;
  const place = placeFor(e);
  const today = todayISO();
  const venue = eventVenueL(e, lang);

  // A city-wide, week-long programme (ADE) gets a long-form guide; the parties
  // inside it get a pointer back up to it.
  const guide = guideFor(e);
  const parent = guideParentOf(e);
  const parentEvent = parent ? EVENTS.find((x) => x.title === parent.festival && x.date.startsWith(`${parent.year}`)) : undefined;
  const subEvents = guide
    ? guide.subEventIds.map((id) => EVENTS.find((x) => x.id === id)).filter((x): x is RaveEvent => !!x)
    : undefined;

  // Un programme-ombrelle n'a pas de salle : son `venue` est un libellé, pas une adresse,
  // donc pas de compte de club sur lequel retomber.
  const social = eventSocials(e, !guide);

  // Related: same genre and still ahead, a finished event is a dead end for the reader.
  const related = upcoming()
    .filter((x) => x.id !== e.id && x.genres.some((gg) => e.genres.includes(gg)))
    .slice(0, 4);
  // Same country, so the page also feeds the geographic cluster.
  const sameCountry = upcoming()
    .filter((x) => x.id !== e.id && x.country === e.country && !related.some((r) => r.id === x.id))
    .slice(0, 6);

  const trail: [string, string][] = [
    [t("nav.explore"), "/explore"],
    [e.title, eventPath(e)],
  ];

  const multiDay = lastDay(e) !== e.date;

  return (
    <>
      <JsonLd
        data={[
          eventJsonLd(e, lang, {
            subEvents,
            superEvent: parentEvent,
            sameAs: social?.from === "event" ? sameAs(social.s) : undefined,
          }),
          breadcrumbJsonLd(trail, lang),
          ...(guide ? [faqJsonLd(guide.faq.map((f) => [pick(f.q, lang), pick(f.a, lang)] as [string, string]))] : []),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />

          <div className="event-hero" style={{ marginTop: 16 }}>
            <HeroImage e={e} lang={lang} />
            <div>
              <div className="event-hero-meta">
                <span className="tag type">{e.type}</span>
                {live && <span className="tag live">{t("event.livenow")}</span>}
                {done && <span className="tag past">{t("event.pastbadge")}</span>}
                {e.genres.map((gg) => (
                  <Link className="tag type" key={gg} href={`${p}/genres/${genreSlug(gg)}`}>
                    {gg}
                  </Link>
                ))}
              </div>
              <h1 className="h-xl" style={{ fontSize: "clamp(2.2rem,6vw,4.5rem)" }}>
                {e.title}
              </h1>
              <p className="lead" style={{ marginTop: 10, color: "var(--white)" }}>
                📍{" "}
                {/* A city-wide programme has no venue page, its `venue` is a label, not an address. */}
                {guide ? (
                  venue
                ) : (
                  <Link href={`${p}/lieux/${slugify(e.venue)}`} style={{ color: "inherit" }}>
                    {venue}
                  </Link>
                )}{" "}
                ·{" "}
                {place ? (
                  <Link href={`${p}/rave-party/${place.slug}`} style={{ color: "inherit" }}>
                    {e.city}
                  </Link>
                ) : (
                  e.city
                )}
                , {countryLabel(e.country, lang)}
              </p>
            </div>
          </div>

          {done && (
            <div className="notice" style={{ marginTop: 20 }}>
              <span>
                {t("event.pastnotice")} <b>{fmtDate(lastDay(e), lang)}</b>.
              </span>
              {next ? (
                <Link href={`${p}${eventPath(next)}`} className="btn btn-primary btn-sm">
                  {t("event.nextedition")} · {fmtDate(next.date, lang)}
                </Link>
              ) : (
                <Link href={`${p}/explore`} className="btn btn-ghost btn-sm">
                  {t("event.seeupcoming")}
                </Link>
              )}
            </div>
          )}

          {/* The single most useful sentence on a programme page: this is a week, not a night. */}
          {guide && (
            <div className="notice guide-hook" style={{ marginTop: 20 }}>
              <span className="eyebrow">⚠ {t("guide.warning")}</span>
              {pick(guide.hook, lang)}
            </div>
          )}

          {parent && parentEvent && (
            <div className="notice" style={{ marginTop: 20 }}>
              <span>
                {t("guide.partof")} <b>{parent.festival}</b> {parent.year}.
              </span>
              <Link href={`${p}${eventPath(parentEvent)}`} className="btn btn-primary btn-sm">
                {t("guide.seeprogram")}
              </Link>
            </div>
          )}

          <div className="event-layout">
            <div>
              <div className="info-card">
                <h2 className="h-md">{t("event.about")}</h2>
                {guide ? (
                  <div className="guide-intro">
                    {guide.intro.map((par) => (
                      <p key={par.fr}>{pick(par, lang)}</p>
                    ))}
                  </div>
                ) : (
                  <p className="lead" style={{ fontSize: "1rem" }}>
                    {eventDescL(e, lang)}
                  </p>
                )}
              </div>

              <div className="info-card">
                <h2 className="h-md">{t("event.lineup")}</h2>
                {e.lineup.length === 0 && (
                  <p className="lead" style={{ fontSize: ".95rem", color: "var(--grey)" }}>
                    {t("event.lineuptba")}
                  </p>
                )}
                <div className="lineup">
                  {e.lineup.map((a, i) => {
                    /* Le line-up est l'endroit du site où l'on regarde le plus des noms
                       d'artistes — c'est donc le premier où le portrait doit apparaître.
                       Le slug est celui de `buildArtists()`, donc `artistPhoto()` tombe
                       sur la même clé que la fiche vers laquelle la carte pointe. */
                    const photo = artistPhoto(slugify(a.trim()));
                    return (
                      <Link
                        href={`${p}/artistes/${slugify(a.trim())}`}
                        className={`artist ${i === 0 ? "headliner" : ""}`}
                        key={a}
                      >
                        {photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            className="av av-photo"
                            src={`/artists/${photo.file}`}
                            alt=""
                            width={44}
                            height={44}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="av" aria-hidden="true">
                            {a.trim()[0]}
                          </div>
                        )}
                        <div>
                          <b>{a.trim()}</b>
                          <span>{i === 0 ? t("event.headliner") : t("event.djset")}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Là où huit dégradés faisaient semblant d'être une galerie : les comptes
                  de l'organisateur. C'est le seul endroit de la page où l'on peut voir
                  l'affiche du jour et le line-up complet, et ça reste chez lui. */}
              {social && <SocialsCard s={social.s} lang={lang} owner={social.from} ownerName={social.name} />}

              <div className="info-card">
                <h2 className="h-md">{t("event.location")}</h2>
                <MiniMap lat={e.lat} lng={e.lng} />
              </div>

              {/* « C'est où » appelle « et je dors où ». Jamais sur une édition
                  terminée : proposer un hôtel pour une nuit passée n'a aucun sens,
                  et c'est la même règle que les blocs de mise en avant. */}
              {!done && <HotelsCard e={e} lang={lang} />}
            </div>

            <aside>
              <div className="ticket-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="eyebrow">{t("event.tickets")}</span>
                  <FavButton id={e.id} />
                </div>
                <div className="h-lg" style={{ margin: "14px 0 4px" }}>
                  {priceLabel(e, lang)}
                </div>
                <p style={{ color: "var(--grey)", fontSize: ".85rem", marginBottom: 18 }}>
                  {e.priceNote === "estimated" ? t("dyn.priceest") : t("event.fromprice")}
                </p>
                <div className="ticket-row">
                  <span>{t("event.date")}</span>
                  <b>
                    {fmtDate(e.date, lang)}
                    {multiDay && ` → ${fmtDate(lastDay(e), lang)}`}
                  </b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.venue")}</span>
                  <b>
                    {guide ? (
                      venue
                    ) : (
                      <Link href={`${p}/lieux/${slugify(e.venue)}`} style={{ color: "var(--cyan)" }}>
                        {venue}
                      </Link>
                    )}
                  </b>
                </div>
                <div className="ticket-row">
                  <span>{t("event.city")}</span>
                  <b>
                    {e.city}, {countryLabel(e.country, lang)}
                  </b>
                </div>
                {done ? (
                  <div className="btn btn-ghost btn-block" style={{ marginTop: 18, cursor: "default" }}>
                    {t("event.pastbadge")}
                  </div>
                ) : ticketUrl(e) ? (
                  <a
                    href={ticketUrl(e)!}
                    target="_blank"
                    rel={ticketRel(e)}
                    className="btn btn-primary btn-block"
                    style={{ marginTop: 18 }}
                    // The one click on this page that is worth money. The tracker already
                    // logs it as an outbound click; `data-goal` also promotes it to a
                    // counted objective on /suivi, so it has its own line rather than
                    // being one row among every Instagram link on the site.
                    data-goal="billetterie"
                  >
                    {t("event.gettickets")}
                  </a>
                ) : (
                  <div className="btn btn-ghost btn-block" style={{ marginTop: 18, cursor: "default" }}>
                    {t("event.freeentry")}
                  </div>
                )}
                <Link href={`${p}/map`} className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
                  {t("event.viewmap")}
                </Link>
              </div>
            </aside>
          </div>

          {guide && <FestivalGuide guide={guide} e={e} lang={lang} today={today} />}

          {related.length > 0 && (
            <>
              <div className="divider" />
              <h2 className="h-md" style={{ marginBottom: 24 }}>
                {t("event.related")}
              </h2>
              <div className="grid grid-4">
                {related.map((r) => (
                  <EventCard key={r.id} e={cardEvent(r)} lang={lang} />
                ))}
              </div>
            </>
          )}

          {sameCountry.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("event.morein")} {countryLabel(e.country, lang)}
              </h2>
              <div className="linkfarm">
                {sameCountry.map((x) => (
                  <Link key={x.id} href={`${p}${eventPath(x)}`}>
                    {x.title} · {x.city}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
