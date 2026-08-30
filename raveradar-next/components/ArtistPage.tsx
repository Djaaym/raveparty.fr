import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { artistBySlug, artistGenres, artistSubGenres, eventsForArtist, relatedArtists } from "@/lib/artists";
import { bioFor, bioText } from "@/lib/bios";
import { artistPhoto } from "@/lib/artist-photos";
import { countryLabel, genreSlug, isPast, slugify, todayISO, cardEvent } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { artistSocials, sameAs } from "@/lib/socials";
import { artistJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import SocialsCard from "./SocialsCard";
import JsonLd from "./JsonLd";

export default function ArtistPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const artist = artistBySlug(slug);
  if (!artist) return notFound();
  const bio = bioFor(slug);
  const photo = artistPhoto(slug);
  const social = artistSocials(slug);

  const today = todayISO();
  const events = eventsForArtist(slug);
  const live = events.filter((e) => !isPast(e, today));
  const done = events.filter((e) => isPast(e, today));
  /* Le portrait suit l'artiste partout, pas seulement en tête de sa propre fiche :
     une grille de ronds à initiale ne distingue rien, et on a la photo. */
  const related = relatedArtists(artist, 12).map((a) => ({ a, photo: artistPhoto(a.slug) }));
  /* Les genres attribués, pas l'union brute de `Artist.genres` : cette page affichait
     tous les styles de toutes les affiches où l'artiste apparaît, ce qui mettait de la
     psytrance sur une fiche de techno industrielle. Les sous-genres viennent d'à côté
     et ne sont pas des liens, ils n'ont pas de page. */
  const genres = artistGenres(artist);
  const subs = artistSubGenres(artist);
  const countries = artist.countries.map((c) => countryLabel(c, lang)).join(", ");
  // Cities the artist plays that we actually have a page for, links the artist mesh
  // into the geographic mesh without pointing at routes that don't exist.
  const cities = PLACES.filter((pl) =>
    events.some((e) =>
      (pl.match ?? [pl.label]).some((m) => slugify(m) === slugify(e.city) || slugify(m) === slugify(e.region ?? "")),
    ),
  );

  const intro =
    lang === "fr"
      ? live.length > 0
        ? `${artist.name} est programmé sur ${live.length} date${live.length > 1 ? "s" : ""} à venir référencée${
            live.length > 1 ? "s" : ""
          } sur RaveRadar (${countries}). Découvre les prochains festivals, line-ups et billetterie.`
        : `${artist.name} n'a pas de date à venir référencée sur RaveRadar pour le moment (${countries}). Retrouve ci-dessous ses dernières apparitions et active une alerte pour être prévenu de la prochaine.`
      : live.length > 0
        ? `${artist.name} is booked for ${live.length} upcoming date${live.length > 1 ? "s" : ""} listed on RaveRadar (${countries}). Browse the festivals, line-ups and tickets.`
        : `${artist.name} has no upcoming dates listed on RaveRadar right now (${countries}). Their latest appearances are below, set an alert to hear about the next one.`;

  const trail: [string, string][] = [
    [t("nav.artists"), "/artistes"],
    [artist.name, `/artistes/${artist.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          artistJsonLd(artist.name, artist.slug, live, lang, sameAs(social), [...genres, ...subs]),
          breadcrumbJsonLd(trail, lang),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />

          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "16px 0 10px" }}>
            {photo ? (
              // Duotone-normalised in avatars.py, so a studio headshot and an
              // underexposed booth shot still sit together on the artists grid.
              <img
                className="avatar avatar-photo"
                src={`/artists/${photo.file}`}
                alt={t("artist.photoalt").replace("{name}", artist.name)}
                width={400}
                height={400}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="avatar">{artist.name.trim()[0]}</div>
            )}
            <div>
              <h1 className="h-lg" style={{ margin: 0 }}>
                {artist.name}
              </h1>
              {bio?.origin && <span className="artist-origin">{bio.origin}</span>}
            </div>
          </div>

          {/* The researched bio when we have one; the generated sentence is a
              fallback, not a substitute, it says nothing a reader can't already
              see from the dates below. */}
          {bio ? (
            <>
              <p className="lead artist-bio">{bioText(bio, lang)}</p>
              {/* `since` et `labels` étaient recherchés, stockés… et affichés nulle part
                  sur la fiche de l'artiste, seulement sur les douze cartes développées
                  de /artistes. Une donnée vérifiée qu'on ne montre pas est du travail
                  perdu, et c'est précisément ce qu'un lecteur cherche ici : d'où il
                  vient, depuis quand, chez qui il sort ses disques. */}
              {(bio.origin || bio.since || bio.labels?.length) && (
                <div className="artcard-facts artist-facts">
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
                      <em>{t("artists.labels")}</em> {bio.labels.join(", ")}
                    </span>
                  )}
                </div>
              )}
              <p className="artist-credits">
                {t("artist.sources")}{" "}
                {bio.sources.map((u, i) => (
                  <span key={u}>
                    {i > 0 && " · "}
                    <a href={u} target="_blank" rel="noopener noreferrer nofollow">
                      {new URL(u).hostname.replace(/^www\./, "")}
                    </a>
                  </span>
                ))}
              </p>
            </>
          ) : null}
          {/* Le crédit est la *condition* de réutilisation d'une photo CC BY, pas une
              note de bas de page, il s'affiche donc dès qu'il y a une photo, y compris
              quand l'artiste n'a pas de bio (il vivait dans le bloc des sources, et
              disparaissait avec elles). */}
          {photo && (
            <p className="artist-credits">
              {t("artist.photocredit").replace("{author}", photo.author).replace("{license}", photo.license)}{" "}
              <a href={photo.page} target="_blank" rel="noopener noreferrer nofollow">
                Wikimedia Commons
              </a>
            </p>
          )}
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="artist" value={artist.slug} label={artist.name} />

          <div className="card-meta" style={{ marginTop: 16 }}>
            {genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`} className="gpill">
                {g}
              </Link>
            ))}
            {subs.map((g) => (
              <span key={g} className="gpill gpill-sub">
                {g}
              </span>
            ))}
          </div>

          {/* Le compte de l'artiste, quand la recherche a pu l'attribuer sans ambiguïté.
              Un nom de scène peut cacher deux personnes, pas de compte plutôt qu'un
              compte plausible. */}
          {social && (
            <div style={{ marginTop: 28 }}>
              <SocialsCard s={social} lang={lang} owner="artist" />
            </div>
          )}

          {/* Straight to the event. These cards used to point at `/show/{artist}-{venue}-{date}`,
              a page per booking that restated the event's own line-up and ticket link, ~1 850
              near-duplicates whose only inbound links were here and on a venue page. The event
              page is the destination; `/show/` URLs now 301 onto it.

              Upcoming and finished are two lists, not one run: a reader scanning for the next
              date shouldn't have to read past last winter's. */}
          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("artist.dates")}
          </h2>
          {live.length > 0 ? (
            <div className="grid grid-4">
              {live.map((e) => (
                <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
              ))}
            </div>
          ) : (
            <p className="lead" style={{ fontSize: ".95rem" }}>
              {t("artist.nodates")}
            </p>
          )}

          {done.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("fest.past")}
              </h2>
              <div className="grid grid-4">
                {done.map((e) => (
                  <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                ))}
              </div>
            </>
          )}

          {cities.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("artist.wherecities")}
              </h2>
              <div className="linkfarm">
                {cities.map((c) => (
                  <Link key={c.slug} href={`${p}/rave-party/${c.slug}`}>
                    {artist.name} {c.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          {related.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
                {t("artist.discover")}
              </h2>
              <div className="artist-grid">
                {related.map(({ a, photo }) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`} className="artist-tile">
                    {photo ? (
                      /* alt="" volontaire : le nom est écrit juste à côté, un alt
                         descriptif le ferait annoncer deux fois. La copie indexable
                         est celle de la fiche de l'artiste, avec son vrai alt et son
                         crédit. */
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="av av-photo"
                        src={`/artists/${photo.file}`}
                        alt=""
                        width={42}
                        height={42}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="av" aria-hidden="true">
                        {a.name.trim()[0]}
                      </div>
                    )}
                    <div className="artist-tile-txt">
                      <b>{a.name}</b>
                      <span>
                        {a.eventIds.length} {t("artist.events")}
                      </span>
                    </div>
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
