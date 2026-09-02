import Link from "next/link";
import type { Lang } from "@/lib/types";
import {
  ALL_GENRES,
  EVENTS,
  PHOTOS,
  countryLabel, genreSlug,
  imageThumb,
  nextUp,
  slugify,
  todayISO,
  upcoming,
  venueLabelL, cardEvent, eventPath, imageSourceOf } from "@/lib/data";
import { VENUES, venueGenres, venueKind, venueRegulars } from "@/lib/venues";
import { VENUE_SHOTS } from "@/lib/venue-photos";

import { fmtDate, imageAlt } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import { ARTISTS } from "@/lib/artists";
import ArtistPill from "./ArtistPill";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function VenuesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  const next = nextUp(4, undefined, today);
  const liveCount = (ids: number[]) => ids.filter((id) => liveIds.has(id)).length;
  // Venues with something still to come first; the rest stay listed alphabetically for the archive.
  const venues = [...VENUES].sort(
    (a, b) => liveCount(b.eventIds) - liveCount(a.eventIds) || a.name.localeCompare(b.name),
  );
  const open = venues.filter((v) => liveCount(v.eventIds) > 0).length;
  const countries = [...new Set(VENUES.map((v) => v.country))];
  const artistSlugs = new Set(ARTISTS.map((a) => a.slug));
  /* La photo d'une salle est partagée par toutes ses dates, passées comprises : la
     chercher seulement dans les dates à venir en priverait la moitié des cartes. */
  const BY_ALL = new Map(EVENTS.map((e) => [e.id, e]));

  /* Ce qu'une fiche de salle promet, un agenda, une programmation, des habitués,
     n'apparaissait nulle part sur le hub : 515 lignes « ville, pays · N événements »,
     donc 515 lignes qui se ressemblent. Les salles les plus actives passent en carte
     développée, avec ce qui distingue réellement un club d'un autre : ce qu'on y
     programme, qui y revient, et quand est la prochaine nuit. */
  const featured = venues
    .filter((v) => liveCount(v.eventIds) >= 2)
    .slice(0, 12)
    .map((v) => {
      const own = live
        .filter((e) => v.eventIds.includes(e.id))
        .sort((a, b) => a.date.localeCompare(b.date));
      /* Une photo de la SALLE, pas de la soirée. `PHOTOS` mélange photo de mainstage,
         photo de salle et affiche de l'organisateur : les trois illustrent bien un
         événement, une seule illustre un lieu. Sans ce filtre la carte du Bikini
         montrait le flyer d'un concert, et celle de Thuishaven une affiche de line-up.
         Voir lib/venue-photos.ts. */
      const shot = v.eventIds
        .map((id) => own.find((e) => e.id === id) ?? BY_ALL.get(id))
        .filter((e): e is NonNullable<typeof e> => Boolean(e))
        .map((e) => ({ e, src: imageThumb(e), file: PHOTOS[e.id] }))
        .find((x) => x.src && x.file && VENUE_SHOTS.has(x.file));
      return {
        v,
        next: own[0],
        n: own.length,
        genres: venueGenres(v).slice(0, 3),
        regulars: venueRegulars(v, 4).filter((r) => artistSlugs.has(slugify(r.name))),
        kind: venueKind(v),
        shot,
      };
    });

  const intro =
    lang === "fr"
      ? `${VENUES.length} lieux référencés dans ${countries.length} pays : clubs mythiques, entrepôts, hangars portuaires et plaines de festival. ${open} d'entre eux ont une date à venir. Chaque fiche donne l'agenda complet du lieu, les artistes qui y passent et la billetterie.`
      : `${VENUES.length} venues indexed across ${countries.length} countries: legendary clubs, warehouses, dockside hangars and festival fields. ${open} of them have an upcoming date. Each page gives the venue's full agenda, the artists playing there and the ticketing.`;

  /* Remplace le mur de villes en bas de page, même raison que sur /genres et /artistes :
     une page qui existe pour présenter des salles doit répondre à ce qu'on se demande à
     leur sujet, et une FAQ est éligible au résultat enrichi, pas une colonne de liens. */
  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "Qu'est-ce qu'on trouve sur la page d'un lieu ?",
            "L'agenda complet de la salle (les dates à venir et les soirées passées, qui restent en ligne) les artistes qui y jouent, les genres qu'on y programme et le lien vers la billetterie officielle de chaque nuit.",
          ],
          [
            "Comment sont choisis les lieux référencés ?",
            `Ils ne sont pas choisis : ils sont déduits du calendrier. Dès qu'un événement vérifié a lieu quelque part, la salle obtient sa page, d'où ces ${VENUES.length} lieux dans ${countries.length} pays. En revanche un libellé qui décrit un ensemble de lieux (« Divers lieux, Rennes », « 40 lieux dans toute la ville ») n'est pas une salle et n'a pas de page : sans adresse ni agenda propre, elle serait vide.`,
          ],
          [
            "Que veut dire « habitués » sur une salle ?",
            "Les artistes qui reviennent le plus souvent sur les affiches du lieu, comptés sur notre catalogue. Un nom vu une seule fois n'y figure pas, sur un club qui n'a que deux dates référencées, tout le monde serait « régulier », ce qui ne voudrait plus rien dire.",
          ],
          [
            "Warehouse, club, plaine de festival : quelle différence ?",
            "Le lieu change la nuit. Un club a une jauge, des horaires et une programmation régulière ; un entrepôt est souvent temporaire, avec une sono surdimensionnée et pas d'heure de fin ; une plaine de festival se vit sur plusieurs jours, en extérieur. Chaque fiche indique le type dominant des dates qu'on y a référencées.",
          ],
          [
            "Vous donnez l'adresse et les horaires ?",
            "L'horaire annoncé par l'organisateur figure sur chaque date, et la carte situe le lieu. Pour l'adresse exacte, la jauge et les conditions d'entrée, le site officiel de la salle fait foi, on renvoie vers lui plutôt que de recopier une information qu'on ne peut pas tenir à jour.",
          ],
        ]
      : [
          [
            "What's on a venue page?",
            "The room's full agenda (upcoming dates and past nights, which stay online) the artists who play there, the genres programmed and a link to each night's official ticketing.",
          ],
          [
            "How are venues selected?",
            `They aren't selected, they are derived from the calendar. As soon as a verified event happens somewhere, that room gets its page, hence ${VENUES.length} venues across ${countries.length} countries. A label describing a set of places ("various venues", "40 locations across the city") is not a room and gets no page: with no address and no agenda of its own, it would be empty.`,
          ],
          [
            "What does \"regulars\" mean on a venue?",
            "The artists appearing most often on that room's bills, counted across our catalogue. A name seen only once doesn't qualify, in a club with two indexed dates, everyone would be a \"regular\", which would mean nothing.",
          ],
          [
            "Warehouse, club, festival field, what's the difference?",
            "The place shapes the night. A club has a capacity, opening hours and regular programming; a warehouse is often temporary, with an oversized rig and no closing time; a festival field runs over several days, outdoors. Each page shows the dominant type of the dates we've indexed there.",
          ],
          [
            "Do you list the address and opening hours?",
            "The time announced by the promoter is on each date, and the map places the venue. For the exact address, capacity and entry conditions, the room's official site is authoritative, we link to it rather than copying information we cannot keep current.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.venues"), "/lieux"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          itemListJsonLd(next, lang, t("venues.title"), today),
          faqJsonLd(faq),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("venues.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("venues.title")}
          </h1>
          <p className="lead">{t("venues.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/map`}>🗺 {t("nav.map")}</Link>
          </div>

          {featured.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "44px 0 6px" }}>
                {t("venues.detail")}
              </h2>
              <p className="lead" style={{ fontSize: ".95rem", marginBottom: 22 }}>
                {t("venues.detaillead").replace("{n}", String(open))}
              </p>
              <div className="venuecards">
                {featured.map(({ v, next: nextDate, n, genres, regulars, kind, shot }) => (
                  <article className="venuecard" key={v.slug}>
                    {shot?.src ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="venuecard-shot"
                        src={shot.src}
                        alt={imageAlt(shot.e, lang, imageSourceOf(shot.e))}
                        width={96}
                        height={120}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="venuecard-shot venuecard-noshot" aria-hidden="true">
                        🏛
                      </span>
                    )}
                    <div className="venuecard-body">
                      <h3 className="venuecard-name">
                        <Link href={`${p}/lieux/${v.slug}`}>{venueLabelL(v.name, v.nameEn, lang)}</Link>
                      </h3>
                      <div className="venuecard-facts">
                        <span>
                          📍 {v.city}, {countryLabel(v.country, lang)}
                        </span>
                        {kind && <span>{kind}</span>}
                        <span>
                          {n} {t(n > 1 ? "dyn.dates" : "dyn.date")}
                        </span>
                      </div>
                      {genres.length > 0 && (
                        <div className="venuecard-line">
                          <em>{t("venues.plays")}</em>
                          <div className="linkfarm">
                            {genres.map((g) => (
                              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                                {g}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {regulars.length > 0 && (
                        <div className="venuecard-line">
                          <em>{t("venues.regulars")}</em>
                          <div className="linkfarm">
                            {regulars.map((r) => (
                              <ArtistPill
                                key={r.name}
                                href={`${p}/artistes/${slugify(r.name)}`}
                                name={r.name}
                                slug={slugify(r.name)}
                                count={r.count}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {nextDate && (
                        <p className="venuecard-next">
                          <em>{t("venues.next")}</em>{" "}
                          <Link href={`${p}${eventPath(nextDate)}`}>
                            {fmtDate(nextDate.date, lang)} · {nextDate.title}
                          </Link>
                        </p>
                      )}
                      <Link className="venuecard-go" href={`${p}/lieux/${v.slug}`}>
                        {t("venues.see")}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <h2 className="h-md" style={{ margin: "44px 0 16px" }}>
            {t("venues.all")}
          </h2>
          <div className="artist-grid">
            {venues.map((v) => {
              const n = liveCount(v.eventIds);
              return (
                <Link key={v.slug} href={`${p}/lieux/${v.slug}`} className="artist-tile">
                  <div className="av">🏛</div>
                  <div className="artist-tile-txt">
                    <b>{venueLabelL(v.name, v.nameEn, lang)}</b>
                    <span>
                      {v.city}, {countryLabel(v.country, lang)} ·{" "}
                      {n > 0 ? `${n} ${t(n > 1 ? "dyn.events" : "dyn.event")}` : t("hub.past")}
                      {/* Ce qu'on y programme : sans ça, 515 lignes se ressemblent toutes. */}
                      <em>{venueGenres(v).slice(0, 3).join(" · ")}</em>
                    </span>
                  </div>
                </Link>
              );
            })}
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
            {t("venues.faq")}
          </h2>
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
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
