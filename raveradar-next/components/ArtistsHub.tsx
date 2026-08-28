import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, genreSlug, nextUp, todayISO, upcoming, cardEvent, eventPath } from "@/lib/data";
import { ARTISTS, artistGenres, artistSubGenres } from "@/lib/artists";
import { BIOS, bioText } from "@/lib/bios";
import { ARTIST_PHOTOS, artistPhoto } from "@/lib/artist-photos";

import { VENUES } from "@/lib/venues";
import { fmtDate } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import ArtistDirectory from "./ArtistDirectory";
import JsonLd from "./JsonLd";

export default function ArtistsHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  const next = nextUp(4, undefined, today);
  // Artists booked on a date that hasn't happened yet — the useful half of the directory.
  const headliners = ARTISTS.filter((a) => a.eventIds.some((id) => liveIds.has(id))).sort(
    (a, b) => b.eventIds.length - a.eventIds.length,
  );
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 14);
  /* Chaque ligne de l'annuaire porte désormais ses genres — 1 860 artistes "présentés"
     un peu, à la place d'un nom et d'un compte. Ce sont des indices dans ALL_GENRES, pas
     des libellés : "Hard Techno" écrit sur chaque ligne qui le joue, c'est le même
     kilo-octet répété des centaines de fois pour deux mots. */
  const gi = new Map(ALL_GENRES.map((g, i) => [g, i]));
  /* Les sous-genres sont internés de la même façon, mais dans leur propre table : ils
     ne sont pas des clés de GENRES (ils n'ont pas de page), et ils ne sont connus qu'à
     l'exécution — d'où la table construite ici plutôt qu'une constante. */
  const subLabels: string[] = [];
  const si = new Map<string, number>();
  const subIndex = (label: string): number => {
    const hit = si.get(label);
    if (hit !== undefined) return hit;
    si.set(label, subLabels.push(label) - 1);
    return subLabels.length - 1;
  };
  const artistItems = ARTISTS.map((a) => ({
    slug: a.slug,
    name: a.name,
    n: a.eventIds.length,
    photo: artistPhoto(a.slug)?.file,
    g: artistGenres(a)
      .slice(0, 3)
      .map((g) => gi.get(g))
      .filter((i): i is number => i !== undefined),
    sg: artistSubGenres(a).slice(0, 2).map(subIndex),
  }));

  /* La vraie « présentation » d'un artiste, c'est sa bio sourcée : on ne peut pas en
     écrire 1 860, mais 147 existent et 138 portent une date à venir. Les plus programmés
     passent en carte développée ici (portrait, origine, labels, bio, prochaine date) ;
     les autres restent à un clic dans l'annuaire, où leur ligne dit au moins ce qu'ils
     jouent. Une carte sans bio n'aurait rien à développer — d'où le filtre sur BIOS. */
  const detailed = headliners.filter((a) => BIOS[a.slug]);
  const featured = detailed
    .slice(0, 12)
    .map((a) => {
      const bio = BIOS[a.slug]!;
      const next = live
        .filter((e) => a.eventIds.includes(e.id))
        .sort((x, y) => x.date.localeCompare(y.date))[0];
      return { a, bio, photo: artistPhoto(a.slug), next, genres: [...artistGenres(a), ...artistSubGenres(a)].slice(0, 4) };
    });
  /* A CC BY photo may be reused *provided* the author and licence travel with it —
     that is the condition, not a footnote. A 42 px avatar has no room for a credit
     line, so the page carries them all here, once, for the portraits it shows. */
  const credits = ARTISTS.map((a) => ARTIST_PHOTOS[a.slug] && { name: a.name, ...ARTIST_PHOTOS[a.slug]! })
    .filter((c): c is { name: string; file: string; author: string; license: string; page: string } => Boolean(c))
    .sort((x, y) => x.name.localeCompare(y.name));

  const intro =
    lang === "fr"
      ? `${ARTISTS.length} artistes référencés à partir des line-ups publiés : DJs techno, live hardstyle, sélecteurs house, MCs drum & bass. ${
          headliners.length
        } d'entre eux ont au moins une date à venir en Europe. Chaque fiche artiste liste ses prochains sets, les lieux où il joue et les genres qu'il défend.`
      : `${ARTISTS.length} artists indexed from published line-ups: techno DJs, hardstyle live acts, house selectors, drum & bass MCs. ${
          headliners.length
        } of them have at least one upcoming date in Europe. Every artist page lists their next sets, the venues they play and the genres they carry.`;

  /* Ce qui remplace le mur de 90 villes en bas de page — mêmes raisons que sur /genres :
     une page qui existe pour présenter des artistes doit répondre à ce qu'on se demande
     à leur sujet, et une FAQ est éligible au résultat enrichi, ce qu'une colonne de liens
     ne sera jamais. */
  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "D'où viennent ces artistes et ces bios ?",
            `Les ${ARTISTS.length} artistes sont extraits des line-ups publiés par les organisateurs : dès qu'un nom apparaît sur une affiche, il obtient sa fiche et son agenda. Les ${detailed.length} biographies détaillées, elles, sont recherchées une par une et citent leurs sources en bas de fiche. Un artiste qu'on n'a pas pu vérifier n'a pas de bio inventée — il garde ses dates, c'est tout.`,
          ],
          [
            "Comment savoir quand mon artiste préféré joue près de chez moi ?",
            "Ouvre sa fiche : elle liste ses prochaines dates, les salles où il joue et les villes concernées. Tu peux y créer une alerte sur son nom — on te prévient dès qu'une nouvelle date est annoncée, avant que la billetterie ne soit épuisée.",
          ],
          [
            "Pourquoi certains artistes n'ont-ils pas de photo ?",
            "Parce qu'on ne publie que des portraits sous licence explicite, pris sur Wikimedia Commons, avec l'auteur et la licence affichés sous l'image. Une photo de presse ou un cliché Instagram reste une œuvre protégée. Et on ne génère jamais de portrait par IA pour une personne réelle : produire une image réaliste et reconnaissable de quelqu'un, ce n'est pas illustrer, c'est inventer.",
          ],
          [
            "Deux artistes portent le même nom — comment vous faites ?",
            "On les distingue par indicatif de pays dans le line-up, comme le fait le milieu : « Jazzy (CH) » n'est pas « Jazzy (IE) ». C'est un cas réel du catalogue, et le seul moyen honnête de ne pas fusionner deux carrières sur une même page.",
          ],
          [
            "Comment chercher par style plutôt que par nom ?",
            "Le champ de recherche de l'annuaire accepte aussi les genres : tape « hardstyle » ou « drum & bass » et la liste se réduit aux artistes qui les jouent. Chaque page de genre donne aussi ses têtes d'affiche.",
          ],
        ]
      : [
          [
            "Where do these artists and biographies come from?",
            `The ${ARTISTS.length} artists are extracted from line-ups published by promoters: as soon as a name appears on a bill, it gets its page and its calendar. The ${detailed.length} detailed biographies are researched one by one and cite their sources at the foot of the page. An artist we could not verify gets no invented bio — they simply keep their dates.`,
          ],
          [
            "How do I know when my favourite artist plays near me?",
            "Open their page: it lists their upcoming dates, the venues they play and the cities involved. You can set an alert on their name there — we tell you as soon as a new date is announced, before tickets sell out.",
          ],
          [
            "Why do some artists have no photo?",
            "Because we only publish portraits under an explicit licence, sourced from Wikimedia Commons, with the author and licence shown under the image. A press shot or an Instagram picture is a copyrighted work whoever publishes it. And we never generate an AI portrait of a real person: producing a realistic, recognisable image of someone is not illustration, it is invention.",
          ],
          [
            "Two artists share a name — how do you handle that?",
            "We separate them by country tag in the line-up, the way the scene does: \"Jazzy (CH)\" is not \"Jazzy (IE)\". It is a real case in this catalogue, and the only honest way to avoid merging two careers onto one page.",
          ],
          [
            "How do I search by style rather than by name?",
            "The directory's search box takes genres too: type \"hardstyle\" or \"drum & bass\" and the list narrows to the artists who play them. Each genre page also lists its headliners.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.artists"), "/artistes"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          itemListJsonLd(next, lang, t("artists.title"), today),
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
            {t("artists.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("artists.title")}
          </h1>
          <p className="lead">{t("artists.lead")}</p>
          <p className="lead">{intro}</p>

          {featured.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "44px 0 6px" }}>
                {t("artists.detail")}
              </h2>
              <p className="lead" style={{ fontSize: ".95rem", marginBottom: 22 }}>
                {t("artists.detaillead").replace("{n}", String(detailed.length))}
              </p>
              <div className="artcards">
                {featured.map(({ a, bio, photo, next: nextDate, genres }) => (
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
                        {bio.since && (
                          <span>
                            <em>{t("artists.since")}</em> {bio.since}
                          </span>
                        )}
                        {bio.labels && bio.labels.length > 0 && (
                          <span>
                            <em>{t("artists.labels")}</em> {bio.labels.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                      <p className="artcard-bio">{bioText(bio, lang)}</p>
                      <div className="linkfarm artcard-genres">
                        {genres.map((g) => (
                          <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                            {g}
                          </Link>
                        ))}
                      </div>
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
                ))}
              </div>
            </>
          )}

          {/* The directory is what this page is for, so it comes first — filter
              included. It used to sit below the "next dates" grid, four screens
              down, which is where search boxes go to be never used. */}
          <h2 className="h-md" style={{ margin: "40px 0 0" }}>
            {t("artists.az")}
          </h2>
          <ArtistDirectory
            items={artistItems}
            hrefBase={`${p}/artistes/`}
            placeholder={t("filter.artists")}
            countLabel={t("filter.count")}
            emptyLabel={t("filter.none")}
            clearLabel={t("filter.clear")}
            dateLabel={t("dyn.event")}
            datesLabel={t("dyn.events")}
            artistLabel={t("dyn.artist")}
            artistsLabel={t("dyn.artists")}
            jumpLabel={t("artists.jump")}
            genres={ALL_GENRES}
            subs={subLabels}
          />

          {credits.length > 0 && (
            <details className="az-credits">
              <summary>{t("artists.credits").replace("{n}", String(credits.length))}</summary>
              <ul>
                {credits.map((c) => (
                  <li key={c.file}>
                    {c.name} — {c.author}, {c.license} (
                    <a href={c.page} target="_blank" rel="noopener noreferrer nofollow">
                      Wikimedia Commons
                    </a>
                    )
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="linkfarm" style={{ marginTop: 44 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
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

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("artists.faq")}
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
