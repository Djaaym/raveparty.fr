import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { artistBySlug, eventsForArtist, relatedArtists } from "@/lib/artists";
import { bioFor, bioText } from "@/lib/bios";
import { countryLabel, genreSlug, isPast, slugify, todayISO } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { showsForArtist } from "@/lib/shows";
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
  const social = artistSocials(slug);

  const today = todayISO();
  const events = eventsForArtist(slug);
  const live = events.filter((e) => !isPast(e, today));
  const shows = showsForArtist(slug);
  const showHref = new Map(shows.map((sh) => [sh.eventId, `${p}/show/${sh.slug}`]));
  const related = relatedArtists(artist, 12);
  const countries = artist.countries.map((c) => countryLabel(c, lang)).join(", ");
  // Cities the artist plays that we actually have a page for — links the artist mesh
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
        : `${artist.name} has no upcoming dates listed on RaveRadar right now (${countries}). Their latest appearances are below — set an alert to hear about the next one.`;

  const trail: [string, string][] = [
    [t("nav.artists"), "/artistes"],
    [artist.name, `/artistes/${artist.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={[
          artistJsonLd(artist.name, artist.slug, live, lang, sameAs(social)),
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
            {bio?.photo ? (
              // Duotone-normalised in avatars.py, so a studio headshot and an
              // underexposed booth shot still sit together on the artists grid.
              <img
                className="avatar avatar-photo"
                src={`/artists/${bio.photo.file}`}
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
              fallback, not a substitute — it says nothing a reader can't already
              see from the dates below. */}
          {bio ? (
            <>
              <p className="lead artist-bio">{bioText(bio, lang)}</p>
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
                {bio.photo && (
                  <>
                    {" — "}
                    {t("artist.photocredit")
                      .replace("{author}", bio.photo.author)
                      .replace("{license}", bio.photo.license)}{" "}
                    <a href={bio.photo.page} target="_blank" rel="noopener noreferrer nofollow">
                      Wikimedia Commons
                    </a>
                  </>
                )}
              </p>
            </>
          ) : null}
          <p className="lead">{intro}</p>

          <AlertForm lang={lang} kind="artist" value={artist.slug} label={artist.name} />

          <div className="card-meta" style={{ marginTop: 16 }}>
            {artist.genres.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`} className="gpill">
                {g}
              </Link>
            ))}
          </div>

          {/* Le compte de l'artiste, quand la recherche a pu l'attribuer sans ambiguïté.
              Un nom de scène peut cacher deux personnes — pas de compte plutôt qu'un
              compte plausible. */}
          {social && (
            <div style={{ marginTop: 28 }}>
              <SocialsCard s={social} lang={lang} owner="artist" />
            </div>
          )}

          {/* One section, not two. The text list of shows and the grid of events were
              the same dates twice over — but they pointed at different pages, and the
              `/show/` pages are only ever linked from here and from a venue page. So the
              grid survives and inherits the show link: on an artist page, "Amelie Lens at
              Hilvarenbeek" is a better destination than the festival's general page. */}
          <h2 className="h-md" style={{ margin: "40px 0 18px" }}>
            {t("artist.dates")}
          </h2>
          <div className="grid grid-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} today={today} href={showHref.get(e.id)} />
            ))}
          </div>

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
                {related.map((a) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`} className="artist-tile">
                    <div className="av">{a.name.trim()[0]}</div>
                    <div>
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
