import Link from "next/link";
import type { CSSProperties } from "react";
import type { Lang, RaveEvent } from "@/lib/types";
import { artistPhoto } from "@/lib/artist-photos";
import { hasArtistPage } from "@/lib/artists";
import {
  EVENTS,
  GENRES,
  countryLabel,
  eventDescL, eventVenueL,
  genreSlug,
  isLive,
  isPast,
  lastDay,
  nextEdition,
  pastEditions,
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
import { eventCopy, inCountry } from "@/lib/pagecopy";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import FavButton from "./FavButton";
import ShareRow from "./ShareRow";
import FestivalGuide from "./FestivalGuide";
import HeroImage from "./HeroImage";
import HotelsCard from "./HotelsCard";
import MiniMap from "./MiniMap";
import Breadcrumbs from "./Breadcrumbs";
import SocialsCard from "./SocialsCard";
import EventEditor from "./EventEditor";
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
  // Les éditions déjà passées du même festival. Le slug nu appartient à l'édition en
  // cours, les autres portent leur année : sans ce bloc, leurs pages n'avaient aucun lien
  // entrant depuis la fiche qui porte l'autorité de la marque.
  const older = pastEditions(e, today);
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

  /* Le contexte et la FAQ engendrés depuis le catalogue. Une fiche portant un guide
     a déjà son intro longue et sa FAQ écrites à la main : les redoubler mettrait deux
     réponses concurrentes sur la même page. Voir `lib/pagecopy.ts` pour la règle. */
  const copy = guide ? null : eventCopy(e, lang, { next, today });

  const trail: [string, string][] = [
    [t("nav.explore"), "/explore"],
    [e.title, eventPath(e)],
  ];

  const multiDay = lastDay(e) !== e.date;
  const nDays = Math.round((Date.parse(lastDay(e)) - Date.parse(e.date)) / 86_400_000) + 1;
  const desc = eventDescL(e, lang);
  /* Les trois repères du bloc « À propos ». Aucun ne redit ce que la billetterie
     affiche déjà à droite (date, salle, ville, tarif) : le format et la durée, l'heure
     d'ouverture, et la taille de l'affiche, qui ne sont écrits nulle part ailleurs sur
     la fiche. Un festival d'un seul jour n'a pas de durée à annoncer, on ne lui invente
     pas « une nuit ». */
  const format =
    nDays > 1
      ? `${e.type} · ${nDays} ${t("dyn.days")}`
      : e.type === "Festival"
        ? e.type
        : `${e.type} · ${t("dyn.night")}`;
  const bill =
    e.lineup.length > 0
      ? `${e.lineup.length} ${t(e.lineup.length > 1 ? "dyn.artists" : "dyn.artist")}`
      : t("dyn.tba");
  // Les couleurs du genre principal, comme sur /genres/{style} : la lettrine et
  // l'arête des repères s'en servent, donc elles sont posées une fois sur le bloc.
  const gc = GENRES[e.genres[0]] ?? GENRES.Techno;

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
          ...(guide
            ? [faqJsonLd(guide.faq.map((f) => [pick(f.q, lang), pick(f.a, lang)] as [string, string]))]
            : copy
              ? [faqJsonLd(copy.faq)]
              : []),
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
              {guide ? (
                <div className="info-card">
                  <h2 className="h-md">{t("event.about")}</h2>
                  <div className="guide-intro">
                    {guide.intro.map((par) => (
                      <p key={par.fr}>{pick(par, lang)}</p>
                    ))}
                  </div>
                </div>
              ) : (
                /* Deux colonnes plutôt qu'une pile de deux paragraphes gris : la
                   présentation de l'organisateur à gauche, ce que le catalogue sait à
                   droite. Le texte gardait une mesure de 56 caractères dans une carte
                   qui en fait le double, et rien ne distinguait la phrase engendrée de
                   celle qu'on a recopiée de l'affiche. */
                <section className="abt" style={{ "--g1": gc.c1, "--g2": gc.c2 } as CSSProperties}>
                  <div className="abt-grid">
                    <div>
                      <h2 className="h-md abt-title">{t("event.about")}</h2>
                      {/* La lettrine demande un paragraphe qui la porte : sur deux
                          lignes de description, une capitale de trois interlignes
                          déborde de son propre texte. */}
                      <p className={`abt-desc${desc.length > 200 ? " has-cap" : ""}`}>{desc}</p>
                      {/* Les repères restent dans la colonne du texte : une description
                          de trois lignes laissait sinon la moitié gauche de la carte
                          vide sous elle, pendant que la colonne de droite descendait
                          jusqu'en bas. */}
                      <div className="abt-marks">
                        <div className="abt-mark">
                          <em>{t("event.format")}</em>
                          <b>{format}</b>
                        </div>
                        {e.time && (
                          <div className="abt-mark">
                            <em>{t("event.doors")}</em>
                            <b>{e.time}</b>
                          </div>
                        )}
                        <div className="abt-mark">
                          <em>{t("event.lineup")}</em>
                          <b>{bill}</b>
                        </div>
                      </div>
                    </div>
                    {/* Ce que la description de l'organisateur ne dit jamais : la date
                        en toutes lettres, la salle, la taille de l'affiche et la place
                        de cette date dans la saison. Engendré, donc jamais périmé. */}
                    {copy && (
                      <div className="abt-note">
                        <em>{t("copy.context")}</em>
                        <p>{copy.context}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Une affiche de vingt noms fait quinze écrans de haut sur un téléphone,
                  et pousse le lieu, la billetterie et les blocs de maillage hors de
                  portée. Le bloc est donc replié sur mobile, et forcé ouvert au-delà de
                  720 px par le CSS (`.lineup-box`). C'est un `<details>` et pas un état
                  React : les liens du line-up restent dans le HTML rendu au serveur,
                  donc le maillage qu'un crawler suit ne bouge pas, et ça ne coûte pas un
                  octet de JavaScript à une page dont le LCP compte. */}
              {/* Un line-up vide ne se replie pas : le volet cacherait une seule phrase,
                  et il faudrait l'ouvrir pour apprendre qu'il n'y a rien dedans. C'est
                  la règle de la pilule sans compteur, un bloc qui promet et ne tient
                  rien vaut moins que le même bloc ouvert. */}
              {e.lineup.length === 0 ? (
                <div className="info-card">
                  <h2 className="h-md">{t("event.lineup")}</h2>
                  <p className="lead" style={{ fontSize: ".95rem", color: "var(--grey)", marginTop: 16 }}>
                    {t("event.lineuptba")}
                  </p>
                </div>
              ) : (
              <details className="info-card lineup-box">
                <summary className="lineup-sum">
                  <h2 className="h-md">{t("event.lineup")}</h2>
                  <span className="lineup-count">
                    {e.lineup.length} {t(e.lineup.length > 1 ? "dyn.artists" : "dyn.artist")}
                  </span>
                </summary>
                <div className="lineup">
                  {e.lineup.map((a, i) => {
                    /* Le line-up est l'endroit du site où l'on regarde le plus des noms
                       d'artistes, c'est donc le premier où le portrait doit apparaître.
                       Le slug est celui de `buildArtists()`, donc `artistPhoto()` tombe
                       sur la même clé que la fiche vers laquelle la carte pointe. */
                    const slug = slugify(a.trim());
                    const photo = artistPhoto(slug);
                    /* `ARTISTS` est construit à la compilation depuis les line-ups du
                       catalogue : un nom ajouté par une correction en direct
                       (`lib/event-edits.ts`) n'y entrera qu'au prochain déploiement.
                       Le lier tout de suite donnerait un 404, on rend donc le nom sans
                       ancre jusqu'à ce que sa fiche existe. */
                    const linked = hasArtistPage(slug);
                    const cls = `artist ${i === 0 ? "headliner" : ""}${linked ? "" : " nolink"}`;
                    const body = (
                      <>
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
                      </>
                    );
                    return linked ? (
                      <Link href={`${p}/artistes/${slug}`} className={cls} key={a}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls} key={a}>
                        {body}
                      </div>
                    );
                  })}
                </div>
              </details>
              )}

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
                {/* Ajouter à son agenda et partager : les deux gestes qui suivent
                    « j'ai trouvé ma soirée », et qui n'existaient nulle part sur le
                    site. Sur une édition terminée ils n'ont plus d'objet. */}
                {!done && <ShareRow lang={lang} id={e.id} title={e.title} />}
              </div>
            </aside>
          </div>

          {guide && <FestivalGuide guide={guide} e={e} lang={lang} today={today} />}

          {copy && copy.faq.length > 0 && (
            <>
              <div className="divider" />
              <h2 className="h-md" style={{ marginBottom: 24 }}>
                {t("copy.faqevent").replace("{t}", e.title)}
              </h2>
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
            </>
          )}

          {older.length > 0 && (
            <>
              <div className="divider" />
              <h2 className="h-md" style={{ marginBottom: 10 }}>
                {t("fest.past")}
              </h2>
              <p className="lead" style={{ fontSize: ".95rem", marginBottom: 22 }}>
                {t("event.editionsintro")}
              </p>
              <div className="grid grid-4">
                {older.map((x) => (
                  <EventCard key={x.id} e={cardEvent(x)} lang={lang} />
                ))}
              </div>
            </>
          )}

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
                {t("event.morein")} {inCountry(e.country, lang)}
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
      {/* Rendu sur toutes les fiches, mais muet pour tout le monde : sans le témoin
          `rr_admin_on`, il rend `null` sans faire la moindre requête. */}
      <EventEditor
        id={e.id}
        title={e.title}
        desc={e.desc}
        descEn={e.descEn ?? ""}
        lineup={e.lineup}
        price={e.price}
        currency={e.currency}
        priceNote={e.priceNote ?? "confirmed"}
        lang={lang}
        guided={Boolean(guide)}
      />
      <Footer lang={lang} />
    </>
  );
}
