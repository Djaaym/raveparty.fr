import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { artistBySlug, artistGenres, artistSubGenres, eventsForArtist, relatedArtists } from "@/lib/artists";
import { bioFor, bioText } from "@/lib/bios";
import { artistPhoto, photoSource } from "@/lib/artist-photos";
import { countryLabel, genreSlug, isPast, slugify, todayISO, cardEvent } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import { artistSocials, sameAs } from "@/lib/socials";
import { artistJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { artistCopy } from "@/lib/pagecopy";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import AlertForm from "./AlertForm";
import SocialsCard from "./SocialsCard";
import JsonLd from "./JsonLd";
import { outboundRel } from "@/lib/display";
import Fold from "./Fold";

export default function ArtistPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const artist = artistBySlug(slug);
  if (!artist) return notFound();
  const bio = bioFor(slug);
  const photo = artistPhoto(slug);
  const source = photo ? photoSource(photo.page) : null;
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
  // Les villes distinctes où il a joué ou va jouer, passé compris : c'est la portée de
  // l'artiste, pas son agenda du moment, et ça ne se déduit pas de `live` seul.
  const townCount = new Set(events.map((x) => x.city)).size;
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

  /* La suite du texte, engendrée depuis le calendrier : la prochaine date en toutes
     lettres, les villes, et une FAQ. L'introduction ci-dessus annonce un nombre de
     dates, elle ne dit pas laquelle est la prochaine ni où, ce qui est pourtant la
     requête qu'on tape (« amelie lens agenda », « angerfist tour »). L'origine n'est
     reprise que d'une bio sourcée : la déduire du calendrier serait une affirmation
     inventée sur une personne réelle. */
  const copy = artistCopy(artist, lang, { live, done, genres, subs, origin: bio?.origin });

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
          faqJsonLd(copy.faq),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />

          {/* La tête de fiche. Elle était une pile de sept blocs de largeurs différentes
              (portrait, titre, bio, faits, sources, crédit, deux paragraphes gris), tous
              plafonnés bien avant le bord de la page. Ici, l'identité et ce qui est
              sourcé tiennent la colonne de gauche, l'alerte celle de droite, et les
              quatre chiffres du calendrier tiennent le bandeau du bas ; le texte
              engendré descend d'un cran, sous la carte, où il ne concurrence plus la
              bio. */}
          <header className="aphero">
            <div className="aphero-grid">
              <div className="aphero-main">
                <div className="aphero-id">
                  <div className="aphero-ring">
                    {photo ? (
                      // Duotone-normalised in avatars.py, so a studio headshot and an
                      // underexposed booth shot still sit together on the artists grid.
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/artists/${photo.file}`}
                        alt={t("artist.photoalt").replace("{name}", artist.name)}
                        width={400}
                        height={400}
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <div className="aphero-initial" aria-hidden="true">
                        {artist.name.trim()[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="aphero-kicker">
                      {t("artist.kind")}
                      {bio?.origin && (
                        <>
                          <i>·</i>
                          {bio.origin}
                        </>
                      )}
                    </span>
                    <h1 className="aphero-name">{artist.name}</h1>
                  </div>
                </div>

                {/* Les genres joués, remontés sous le nom : ils étaient rendus après le
                    formulaire d'alerte, donc après trois paragraphes, alors que c'est la
                    première chose qu'on vient vérifier sur une fiche d'artiste. Un
                    sous-genre n'a pas de page, donc pas de lien (règle `ARTIST_STYLES`). */}
                {(genres.length > 0 || subs.length > 0) && (
                  <div className="card-meta aphero-genres">
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
                )}

                {/* La bio sourcée quand il y en a une. Sinon le texte engendré remonte
                    ici : sur les mille sept cents artistes qui n'ont pas de bio, la
                    colonne de gauche n'aurait porté qu'un nom et trois pilules, et la
                    carte se serait ouverte sur un vide de la hauteur du rail de droite.
                    Ce n'est pas un remplissage, c'est le même texte, une ligne plus
                    haut, là où il est enfin le contenu principal de la fiche. */}
                {bio ? (
                  <p className="aphero-bio">{bioText(bio, lang)}</p>
                ) : (
                  <div className="aphero-lead">
                    <p>{intro}</p>
                    <p>{copy.context}</p>
                  </div>
                )}

                {/* `since` et `labels` étaient recherchés, stockés… et affichés nulle part
                    sur la fiche de l'artiste, seulement sur les douze cartes développées
                    de /artistes. Une donnée vérifiée qu'on ne montre pas est du travail
                    perdu, et c'est précisément ce qu'un lecteur cherche ici : d'où il
                    vient, depuis quand, chez qui il sort ses disques. */}
                {bio && (bio.origin || bio.since || bio.labels?.length) && (
                  <div className="aphero-facts">
                    {bio.origin && (
                      <div>
                        <em>{t("artists.origin")}</em>
                        <b>{bio.origin}</b>
                      </div>
                    )}
                    {bio.since && (
                      <div>
                        <em>{t("artists.since")}</em>
                        <b>{bio.since}</b>
                      </div>
                    )}
                    {bio.labels && bio.labels.length > 0 && (
                      <div>
                        <em>{t("artists.labels")}</em>
                        <b>{bio.labels.join(", ")}</b>
                      </div>
                    )}
                  </div>
                )}

                {bio && (
                  <p className="artist-credits">
                    {t("artist.sources")}{" "}
                    {bio.sources.map((u, i) => (
                      <span key={u}>
                        {i > 0 && " · "}
                        <a href={u} target="_blank" rel={outboundRel()}>
                          {new URL(u).hostname.replace(/^www\./, "")}
                        </a>
                      </span>
                    ))}
                  </p>
                )}

                {/* Le crédit est la *condition* de réutilisation d'une photo CC BY, pas une
                    note de bas de page, il s'affiche donc dès qu'il y a une photo, y compris
                    quand l'artiste n'a pas de bio (il vivait dans le bloc des sources, et
                    disparaissait avec elles). */}
                {photo && (
                  <p className="artist-credits">
                    {t(source ? "artist.photocredit" : "artist.photocreditnolink")
                      .replace("{author}", photo.author)
                      .replace("{license}", photo.license)}
                    {source && (
                      <>
                        {" "}
                        <a href={source.href} target="_blank" rel={outboundRel()}>
                          {source.label}
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>

              <AlertForm lang={lang} kind="artist" value={artist.slug} label={artist.name} />

              {/* Le calendrier en quatre nombres, sur toute la largeur de la carte : en
                  colonne à droite, ils empilaient un rail plus haut que la colonne de
                  gauche. Ils sortent tous des mêmes listes que les grilles plus bas, donc
                  ils ne peuvent pas les contredire, et une case à zéro reste affichée,
                  « aucune date à venir » est une réponse. */}
              <div className="apstats">
                  <div className="stat">
                    <b>{live.length}</b>
                    <span>{t("artist.upcoming")}</span>
                  </div>
                  <div className="stat">
                    <b>{done.length}</b>
                    <span>{t("artist.pastdates")}</span>
                  </div>
                  <div className="stat">
                    <b>{townCount}</b>
                    <span>{t("artist.cities")}</span>
                  </div>
                  <div className="stat">
                    <b>{artist.countries.length}</b>
                    <span>{t("artist.countries")}</span>
                  </div>
              </div>
            </div>
          </header>

          {/* Deux paragraphes, donc deux colonnes : en pile, l'introduction et le
              contexte engendré se lisaient comme un seul texte mal coupé, et chacun
              s'arrêtait au tiers de la page. Sans bio, ils sont déjà rendus dans la
              carte, les redoubler mettrait deux fois le même texte sur la page. */}
          {bio && (
            <div className="apstory">
              <p>{intro}</p>
              <p>{copy.context}</p>
            </div>
          )}

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
              <Fold title={<>{t("fest.past")}</>}>
                <div className="grid grid-4">
                  {done.map((e) => (
                    <EventCard key={e.id} e={cardEvent(e)} lang={lang} today={today} />
                  ))}
                </div>
              </Fold>
            </>
          )}

          {cities.length > 0 && (
            <>
              <Fold title={<>{t("artist.wherecities")}</>}>
                <div className="linkfarm">
                  {cities.map((c) => (
                    <Link key={c.slug} href={`${p}/rave-party/${c.slug}`}>
                      {artist.name} {c.label}
                    </Link>
                  ))}
                </div>
              </Fold>
            </>
          )}

          {copy.faq.length > 0 && (
            <>
              <Fold title={<>{t("copy.faqartist").replace("{t}", artist.name)}</>}>
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
            </>
          )}

          {related.length > 0 && (
            <>
              <Fold title={<>{t("artist.discover")}</>}>
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
              </Fold>
            </>
          )}
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
