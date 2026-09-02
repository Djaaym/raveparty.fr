import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import {
  ALL_GENRES,
  EVENTS,
  GENRES,
  PHOTOS,
  countryLabel, eventsForGenre,
  genreDescL,
  genreFromSlug,
  genreSlug,
  imageThumb,
  isPast,
  todayISO,
  upcoming,
  venueLabelL, cardEvent, eventPath, imageSourceOf } from "@/lib/data";
import { rankPlaces } from "@/lib/places";
import { ARTISTS, artistGenres } from "@/lib/artists";
import { BIOS, bioText } from "@/lib/bios";
import { artistPhoto } from "@/lib/artist-photos";
import ArtistPill from "./ArtistPill";
import { VENUES } from "@/lib/venues";
import { VENUE_SHOTS } from "@/lib/venue-photos";
import { genreProfile, pickL } from "@/lib/genres";
import { fmtDate, imageAlt } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import JsonLd from "./JsonLd";

/**
 * La page d'un style.
 *
 * Elle ne montrait qu'une ligne de description (cinq mots) avant d'enchaîner sur une
 * grille de dates : quelqu'un qui arrive en cherchant « c'est quoi la hard techno »
 * n'y trouvait pas sa réponse, et quelqu'un qui connaît déjà le style n'y trouvait rien
 * qu'il ne sache. Le hub /genres, lui, avait déjà la fiche (tempo, origine, ce qu'on
 * entend), c'est la page du genre qui en avait le plus besoin.
 *
 * D'où la tête de page : le nom du style dans ses propres couleurs (celles de `GENRES`,
 * les mêmes que ses cartes partout ailleurs sur le site), l'accroche, le tempo qui bat
 * réellement au BPM du style, puis l'article, deux paragraphes, la fiche signalétique
 * et « ce que tu entends ». Le reste de la page est ensuite construit à partir des
 * données réelles du calendrier : les villes qui le programment (avec leur compte, sinon
 * le lien ment), les salles, les artistes, et une FAQ dont les réponses sont tirées de
 * la fiche et du catalogue, jamais écrite à la main pour un style en particulier.
 */
export default function GenrePage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const genre = genreFromSlug(slug);
  if (!genre) return notFound();

  const today = todayISO();
  const k = GENRES[genre];
  const prof = genreProfile(genre);
  const events = eventsForGenre(genre);
  const live = events.filter((e) => !isPast(e, today));
  const done = events.filter((e) => isPast(e, today));
  const countries = [...new Set(live.map((e) => e.country))];
  const cityCount = new Set(live.map((e) => e.city)).size;
  const liveById = new Map(live.map((e) => [e.id, e]));

  /* Les villes qui programment vraiment ce style, avec leur compte, et non les douze
     plus gros volumes de recherche de PLACES, dont la moitié n'a aucune date du genre.
     Une pilule qui promet « Techno Bordeaux » et tombe sur une page vide vaut moins
     que pas de lien du tout. */
  const cities = rankPlaces(live, 12);

  /* `Artist.genres` est une union : un festival étiqueté sur huit styles étiquette les
     cinquante noms de son affiche, et la page « Psytrance » se retrouvait à présenter
     des artistes techno. `artistGenres()` rend l'attribution quand une source la donne
     (lib/artist-genres.ts), la pondération de `rankGenres()` sinon. Les deux conditions
     comptent : `x.n > 0` veut dire « il a une date à venir dans ce style », et le test
     de genre « c'est bien ce qu'il joue », sans le second, une affiche multi-genres
     remplissait la page ; sans le premier, on afficherait un artiste sans date. */
  const artists = ARTISTS.map((a) => ({ a, n: a.eventIds.filter((id) => liveById.has(id)).length }))
    .filter((x) => x.n > 0 && artistGenres(x.a).includes(genre))
    .sort((x, y) => y.n - x.n || y.a.eventIds.length - x.a.eventIds.length || x.a.name.localeCompare(y.a.name));
  /* Une carte développée n'a de sens que s'il y a une bio sourcée à développer. */
  const featured = artists.filter((x) => BIOS[x.a.slug]).slice(0, 4);
  const featuredSlugs = new Set(featured.map((x) => x.a.slug));

  /* Genre → salle : une arête de maillage que la page n'avait pas du tout, alors que
     c'est exactement ce qu'on cherche après avoir lu la définition (« où on en joue »). */
  const byId = new Map(EVENTS.map((e) => [e.id, e]));
  const venues = VENUES.map((v) => {
    const own = v.eventIds
      .map((id) => liveById.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .sort((a, b) => a.date.localeCompare(b.date));
    /* La photo d'une salle est partagée par toutes ses dates, passées comprises, et
       seules celles marquées `kind: "venue"` montrent le lieu et pas l'affiche du soir. */
    const shot = v.eventIds
      .map((id) => byId.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({ e, src: imageThumb(e), file: PHOTOS[e.id] }))
      .find((x) => x.src && x.file && VENUE_SHOTS.has(x.file));
    return { v, own, shot };
  })
    .filter((x) => x.own.length > 0)
    .sort((a, b) => b.own.length - a.own.length || a.v.name.localeCompare(b.v.name))
    .slice(0, 6);

  /* Les affiches des trois prochaines dates, en tête de page : de vraies images avec
     leur `alt`, pas un fond CSS, c'est la règle du repo, et c'est aussi ce qui rend la
     tête de page vivante sans inventer de décor. */
  const stack = live.filter((e) => imageThumb(e)).slice(0, 3);

  const liveAll = upcoming(undefined, today);
  const otherGenres = ALL_GENRES.filter((g) => g !== genre).map((g) => ({
    g,
    n: liveAll.filter((e) => e.genres.includes(g)).length,
  }));

  const beat = prof ? Math.round(60000 / (parseInt(prof.bpm, 10) || 130)) : 0;
  const cityNames = cities.slice(0, 4).map((c) => c.place.label).join(", ");
  const artistNames = artists.slice(0, 5).map((x) => x.a.name).join(", ");
  const countryNames = countries.map((c) => countryLabel(c, lang)).join(", ");

  const intro =
    lang === "fr"
      ? `${live.length} événement${live.length > 1 ? "s" : ""} ${genre} à venir en Europe${
          countryNames ? ` (${countryNames})` : ""
        }. Dates, line-ups, lieux et billetterie officielle, mis à jour en continu.`
      : `${live.length} upcoming ${genre} event${live.length > 1 ? "s" : ""} across Europe${
          countryNames ? ` (${countryNames})` : ""
        }. Dates, line-ups, venues and official ticketing, updated continuously.`;

  /* La FAQ est engendrée par la fiche du style et par le calendrier : aucune réponse
     n'est écrite à la main pour un genre en particulier, donc aucune ne se périme sans
     qu'on s'en aperçoive. Elle est aussi éligible au résultat enrichi, ce qu'une colonne
     de liens ne sera jamais, même raison que sur /genres, /artistes et /lieux. */
  const faq: [string, string][] = !prof
    ? []
    : lang === "fr"
      ? [
          [`${genre}, c'est quoi ?`, pickL(prof.text, lang)],
          [
            `${genre} : à quel BPM ça joue ?`,
            `Le plus souvent entre ${prof.bpm} BPM. ${pickL(prof.tell, lang)} Un tempo reste un usage courant et pas une règle : un même DJ peut ouvrir plus lentement et finir bien au-dessus.`,
          ],
          [
            `Où voir un événement ${genre} en Europe ?`,
            live.length
              ? `${live.length} date${live.length > 1 ? "s sont annoncées" : " est annoncée"} dans ${countries.length} pays${
                  cityNames ? `, en ce moment surtout à ${cityNames}` : ""
                }. Chaque fiche de cette page donne le lieu, l'horaire, le tarif et la billetterie officielle.`
              : `Aucune date ${genre} n'est annoncée pour l'instant. Crée une alerte sur ce style : on te prévient dès qu'une soirée est publiée près de chez toi.`,
          ],
          [
            `Quels artistes ${genre} voir en ce moment ?`,
            artistNames
              ? `Les plus programmés sur les dates à venir : ${artistNames}. Chaque fiche artiste donne son agenda complet, les salles où il joue et les autres styles qu'il défend.`
              : `Aucun line-up ${genre} n'est encore publié pour les dates à venir. Les programmations tombent en général deux à quatre mois avant l'événement.`,
          ],
        ]
      : [
          [`What is ${genre}?`, pickL(prof.text, lang)],
          [
            `${genre}: what tempo does it play at?`,
            `Most often between ${prof.bpm} BPM. ${pickL(prof.tell, lang)} A tempo is common practice, not a rule: the same DJ may open slower and finish well above it.`,
          ],
          [
            `Where can I see ${genre} in Europe?`,
            live.length
              ? `${live.length} date${live.length > 1 ? "s are" : " is"} announced across ${countries.length} countries${
                  cityNames ? `, right now mostly in ${cityNames}` : ""
                }. Every entry on this page gives the venue, the running time, the price and the official ticket shop.`
              : `No ${genre} date is announced right now. Set an alert on the style and we'll tell you as soon as one is published near you.`,
          ],
          [
            `Which ${genre} artists are playing right now?`,
            artistNames
              ? `The most booked on upcoming dates: ${artistNames}. Every artist page gives their full calendar, the venues they play and the other styles they carry.`
              : `No ${genre} line-up has been published for the upcoming dates yet. Bills usually land two to four months before the event.`,
          ],
        ];

  const trail: [string, string][] = [
    [t("nav.genres"), "/genres"],
    [genre, `/genres/${genreSlug(genre)}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          itemListJsonLd(events, lang, `${genre}, RaveRadar`, today),
          faqJsonLd(faq),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />

          {/* Les couleurs du style sont posées une fois ici : le titre, la lueur de fond,
              la lettrine et les arêtes s'en servent, donc elles s'héritent (`display:
              contents`, aucune boîte ajoutée) au lieu d'être répétées sur cinq éléments. */}
          <div className="gpage" style={{ "--g1": k.c1, "--g2": k.c2 } as CSSProperties}>
          {/* ---- Tête de page : le style dans ses propres couleurs ---- */}
          <article className="ghero">
            <div className="ghero-main">
              <span className="ghero-kicker">
                {prof && <i className="ghero-beat" style={{ animationDuration: `${beat}ms` }} aria-hidden="true" />}
                {genreDescL(genre, lang)}
              </span>
              <h1 className="ghero-title">{genre}</h1>
              {prof && <p className="ghero-hook">{pickL(prof.hook, lang)}</p>}
              {prof && (
                <div className="ghero-specs">
                  <span>
                    <em>{t("genre.bpm")}</em>
                    <b>{prof.bpm} BPM</b>
                  </span>
                  <span>
                    <em>{t("genre.origin")}</em>
                    <b>{pickL(prof.origin, lang)}</b>
                  </span>
                  <span>
                    <em>{t("genre.dates")}</em>
                    <b>{live.length > 0 ? live.length : t("genre.nodates")}</b>
                  </span>
                </div>
              )}
              <div className="ghero-cta">
                {live.length > 0 && (
                  <a className="btn btn-primary" href="#dates">
                    {t("genre.seedates").replace("{n}", String(live.length))}
                  </a>
                )}
                <a className="btn btn-ghost" href="#alerte">
                  {t("genre.alertcta")}
                </a>
              </div>
            </div>
            {stack.length > 0 && (
              <div className="ghero-stack">
                {stack.map((e, i) => (
                  <Link className={`ghero-poster p${i + 1}`} key={e.id} href={`${p}${eventPath(e)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageThumb(e)!} alt={imageAlt(e, lang, imageSourceOf(e))} width={240} height={300} loading="lazy" decoding="async" />
                    <span>
                      <b>{e.title}</b>
                      {fmtDate(e.date, lang)} · {e.city}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          {/* ---- L'article : deux paragraphes, la fiche signalétique, ce qu'on entend ---- */}
          {prof && (
            <div className="gstory">
              <div className="gstory-text">
                <p>{pickL(prof.text, lang)}</p>
                {prof.long.map((l, i) => (
                  <p key={i}>{pickL(l, lang)}</p>
                ))}
              </div>
              <aside className="gstory-side">
                <div className="gmarks">
                  {prof.marks.map((m) => (
                    <div className="gmark" key={pickL(m.k, lang)}>
                      <em>{pickL(m.k, lang)}</em>
                      <b>{pickL(m.v, lang)}</b>
                    </div>
                  ))}
                </div>
                <div className="gtell">
                  <em>{t("genre.tell")}</em>
                  <p>{pickL(prof.tell, lang)}</p>
                </div>
              </aside>
            </div>
          )}

          <div className="stats gstats">
            <div className="stat">
              <b>{live.length}</b>
              <span>{t("genre.dates")}</span>
            </div>
            <div className="stat">
              <b>{countries.length}</b>
              <span>{t("genre.countries")}</span>
            </div>
            <div className="stat">
              <b>{cityCount}</b>
              <span>{t("genre.cities")}</span>
            </div>
            <div className="stat">
              <b>{artists.length}</b>
              <span>{t("genre.artists")}</span>
            </div>
          </div>

          <p className="lead" style={{ marginTop: 22 }}>
            {intro}
          </p>

          {/* ---- Le calendrier ---- */}
          {live.length > 0 && (
            <>
              <h2 className="h-md" id="dates" style={{ margin: "48px 0 18px", scrollMarginTop: 90 }}>
                {t("hub.next")} · {genre}
              </h2>
              <div className="grid grid-4">
                {live.map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          {cities.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("genre.wherecities")}
              </h2>
              <div className="linkfarm">
                {cities.map(({ place, count }) => (
                  <Link key={place.slug} href={`${p}/rave-party/${place.slug}`}>
                    {genre} {place.label} <b>{count}</b>
                  </Link>
                ))}
                <Link className="more" href={`${p}/villes`}>
                  {t("cities.allcities")}
                </Link>
              </div>
            </>
          )}

          {venues.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("genre.venues")}
              </h2>
              <div className="venuecards">
                {venues.map(({ v, own, shot }) => (
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
                        <span>
                          {own.length} {t(own.length > 1 ? "dyn.dates" : "dyn.date")} {genre}
                        </span>
                      </div>
                      <p className="venuecard-next">
                        <em>{t("venues.next")}</em>{" "}
                        <Link href={`${p}${eventPath(own[0])}`}>
                          {fmtDate(own[0].date, lang)} · {own[0].title}
                        </Link>
                      </p>
                      <Link className="venuecard-go" href={`${p}/lieux/${v.slug}`}>
                        {t("venues.see")}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {artists.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("genre.headliners")} · {genre}
              </h2>
              {featured.length > 0 && (
                <div className="artcards" style={{ marginBottom: 18 }}>
                  {featured.map(({ a, n }) => {
                    const bio = BIOS[a.slug]!;
                    const photo = artistPhoto(a.slug);
                    const nextDate = a.eventIds
                      .map((id) => liveById.get(id))
                      .filter((e): e is NonNullable<typeof e> => Boolean(e))
                      .sort((x, y) => x.date.localeCompare(y.date))[0];
                    return (
                      <article className="artcard" key={a.slug}>
                        {photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            className="artcard-photo"
                            src={`/artists/${photo.file}`}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="artcard-photo artcard-initial" aria-hidden="true">
                            {a.name.trim()[0]}
                          </span>
                        )}
                        <div className="artcard-body">
                          <h3 className="artcard-name">
                            <Link href={`${p}/artistes/${a.slug}`}>{a.name}</Link>
                          </h3>
                          <div className="artcard-facts">
                            {bio.origin && (
                              <span>
                                <em>{t("artists.origin")}</em> {bio.origin}
                              </span>
                            )}
                            {bio.labels && bio.labels.length > 0 && (
                              <span>
                                <em>{t("artists.labels")}</em> {bio.labels.slice(0, 2).join(", ")}
                              </span>
                            )}
                            <span>
                              <em>{t("genre.dates")}</em> {n}
                            </span>
                          </div>
                          <p className="artcard-bio">{bioText(bio, lang)}</p>
                          {nextDate && (
                            <p className="artcard-next">
                              <em>{t("artists.next")}</em>{" "}
                              <Link href={`${p}${eventPath(nextDate)}`}>
                                {fmtDate(nextDate.date, lang)} · {nextDate.city}
                              </Link>
                            </p>
                          )}
                          <Link className="artcard-go" href={`${p}/artistes/${a.slug}`}>
                            {t("artists.see")}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="linkfarm">
                {artists
                  .filter((x) => !featuredSlugs.has(x.a.slug))
                  .slice(0, 40)
                  .map(({ a, n }) => (
                    <ArtistPill key={a.slug} href={`${p}/artistes/${a.slug}`} name={a.name} slug={a.slug} count={n} />
                  ))}
                <Link className="more" href={`${p}/artistes`}>
                  {t("genre.allartists")}
                </Link>
              </div>
            </>
          )}

          {done.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")} · {genre}
              </h2>
              <div className="grid grid-4">
                {done.slice(0, 8).map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          <div id="alerte" style={{ scrollMarginTop: 90 }}>
            <AlertForm lang={lang} kind="genre" value={slug} label={genre} />
          </div>

          {faq.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("genre.faqtitle").replace("{g}", genre)}
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
            </>
          )}

          {/* ---- Les autres styles, présentés, pas une rangée de pilules nues ---- */}
          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("genre.othergenres")}
          </h2>
          <div className="ghops">
            {otherGenres.map(({ g, n }) => {
              const c = GENRES[g];
              return (
                <Link
                  className="ghop"
                  key={g}
                  href={`${p}/genres/${genreSlug(g)}`}
                  style={{ "--g1": c.c1, "--g2": c.c2 } as CSSProperties}
                >
                  <span className="ghop-bar" />
                  <b>{g}</b>
                  <span>{genreDescL(g, lang)}</span>
                  <em>
                    {n > 0 ? `${n} ${t(n > 1 ? "dyn.dates" : "dyn.date")}` : t("genre.nodates")}
                  </em>
                </Link>
              );
            })}
          </div>
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
