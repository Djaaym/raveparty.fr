import Link from "next/link";
import type { Lang } from "@/lib/types";
import type { Place } from "@/lib/places";
import { PLACES, placeKeys, placeTally } from "@/lib/places";
import {
  ALL_GENRES,
  COUNTRY_FLAG,
  FESTIVALS,
  PHOTOS,
  cardEvent,
  eventPath,
  eventSlug,
  genreSlug,
  imageSourceOf,
  imageThumb,
  liveEditions,
  nextUp,
  rankGenres,
  slugify,
  todayISO,
  upcoming,
  venueLabelL,
} from "@/lib/data";
import { COUNTRIES_INDEX, countryName, eventsForCountry } from "@/lib/countries";
import { VENUES } from "@/lib/venues";
import { VENUE_SHOTS } from "@/lib/venue-photos";
import { fmtDate, imageAlt } from "@/lib/format";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";
import Breadcrumbs from "./Breadcrumbs";
import SearchableLinks from "./SearchableLinks";
import JsonLd from "./JsonLd";
import Fold from "./Fold";

export default function CitiesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const villes = PLACES.filter((x) => x.kind === "ville");
  const zones = PLACES.filter((x) => x.kind !== "ville");
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  const next = nextUp(4, undefined, today);

  /* Un seul passage sur le calendrier pour les 138 lieux. Le compte sert deux fois,
     à classer les cartes et à qualifier chaque ligne de l'annuaire, et il vient de la
     même règle de correspondance que `eventsForPlace()`, donc la page de destination
     affichera bien ce que la pilule annonce. */
  const tally = placeTally(live);
  const heldBy = (pl: Place) => tally.get(pl.slug) ?? [];

  /* Les villes qui bougent, en carte développée.
     Le hub était six murs de liens à la suite : 90 pilules de ville, puis 90 « Festival
     {ville} », puis les pays, les salles et les genres. Une pilule ne dit ni combien il
     se passe de choses, ni quoi, ni quand, et rien à l'écran ne disait que Lyon porte
     douze dates quand Brest n'en a aucune. La carte répond aux trois questions qu'on se
     pose devant une ville : combien, quoi, et où précisément. */
  const cityCard = (place: Place) => {
    const own = [...heldBy(place)].sort((a, b) => a.date.localeCompare(b.date));
    const keys = new Set(placeKeys(place));
    /* Arête de maillage ville → salle, que le hub n'avait pas : l'intention
       nom-de-club (« Rex Club », « Warehouse ») n'est portée par aucune page ville. */
    const clubs = VENUES.filter((v) => keys.has(slugify(v.city)))
      /* « Bordeaux, France » est un libellé de remplissage, pas une salle : le rendre
         en pilule « Clubs » promet un club et ouvre une fiche qui n'en est pas une.
         Même famille que `isMultiVenueLabel()`, qui teste la forme du libellé, sauf
         que celui-ci passe son test : il n'est pas générique, il est juste la ville. */
      .filter((v) => slugify(v.name.split(",")[0]) !== slugify(v.city))
      .map((v) => ({ v, n: v.eventIds.filter((id) => liveIds.has(id)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || a.v.name.localeCompare(b.v.name))
      .slice(0, 3);
    /* Une photo de LIEU, ou pas de photo du tout. `PHOTOS` mélange mainstage, salle et
       affiche d'organisateur : les trois illustrent bien un événement, une seule illustre
       un endroit. Sans ce filtre la carte de Strasbourg montrait le portrait d'un
       guitariste et celle de Lyon une affiche psychédélique, ce qui ne dit rien de la
       ville. La tuile 📍 est la même réponse que le 🏛 de `/lieux` : mieux qu'une image
       qui ment. Voir lib/venue-photos.ts. */
    const shot = own
      .map((e) => ({ e, src: imageThumb(e), file: PHOTOS[e.id] }))
      .find((x) => x.src && x.file && VENUE_SHOTS.has(x.file));
    /* Le pays majoritaire des dates du lieu, pas un champ de `Place` : il sert à
       mettre la France devant, un classement au volume brut ouvrant sur Amsterdam et
       Manchester pour un lecteur français, qui est le marché prioritaire. */
    const tal = new Map<string, number>();
    own.forEach((e) => tal.set(e.country, (tal.get(e.country) ?? 0) + 1));
    const country = [...tal.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    return { place, n: own.length, next: own[0], genres: rankGenres(own).slice(0, 3), clubs, shot, country };
  };

  const cards = villes.map(cityCard).filter((c) => c.n >= 2);
  const byCount = (a: { n: number }, b: { n: number }) => b.n - a.n;
  /* Une ville par pays sur la rangée européenne. Au volume brut elle rendait Londres,
     Manchester, Glasgow, Liverpool et Birmingham : exact vis-à-vis du calendrier, que le
     guichet britannique de Skiddle a fait gonfler, et inutile à quelqu'un qui veut savoir
     où sortir en Europe. C'est la même correction que la séparation France / Europe, d'un
     cran plus bas, et c'est de la curation, pas une donnée inventée. */
  const oncePerCountry = (list: typeof cards) => {
    const seen = new Set<string>();
    return list.filter((c) => !seen.has(c.country) && seen.add(c.country)).slice(0, 6);
  };
  /* Six et six : douze se divise par 6, 4, 3, 2 et 1, donc la grille tombe juste à
     toutes les largeurs et ne laisse jamais une rangée orpheline. */
  const spot = [
    { label: t("home.cities.fr"), rows: cards.filter((c) => c.country === "France").sort(byCount).slice(0, 6) },
    { label: t("home.cities.eu"), rows: oncePerCountry(cards.filter((c) => c.country !== "France").sort(byCount)) },
  ].filter((g) => g.rows.length > 0);

  /* L'annuaire complet, actives en tête. Le compteur est la condition d'honnêteté du
     lien : une pilule qui promet une ville et tombe sur « pas encore d'événement » vaut
     moins que pas de lien du tout. On ne retire pas pour autant les zones vides, leur
     page existe et elle est indexée : elles sont simplement annoncées comme telles,
     ce qui ne promet rien plutôt que de promettre à faux. */
  const placeItems = (list: Place[]) =>
    list
      .map((v) => ({ slug: v.slug, term: v.label, n: heldBy(v).length }))
      .sort((a, b) => b.n - a.n || a.term.localeCompare(b.term));

  const festTally = placeTally(upcoming(FESTIVALS, today));
  const fests = liveEditions(FESTIVALS, today).slice(0, 24);
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 16);
  const countries = COUNTRIES_INDEX.map((c) => ({ ...c, live: upcoming(eventsForCountry(c.name), today).length }))
    .filter((c) => c.live > 0)
    .sort((a, b) => b.live - a.live || a.name.localeCompare(b.name));

  const intro =
    lang === "fr"
      ? `${PLACES.length} villes, départements et régions couverts, ${live.length} événement${
          live.length > 1 ? "s" : ""
        } à venir. Choisis ta zone : chaque page réunit les festivals et les soirées électro du coin, avec les dates, les line-ups et la billetterie officielle.`
      : `${PLACES.length} cities, counties and regions covered, ${live.length} upcoming event${
          live.length > 1 ? "s" : ""
        }. Pick your area: each page gathers the local festivals and electronic events with dates, line-ups and official ticketing.`;

  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "Comment trouver une rave party près de chez moi ?",
            "Choisis ta ville ou ton département dans les listes ci-dessus : chaque page regroupe les festivals et les soirées de la zone. Pour aller plus vite, la page « Autour de moi » utilise ta position et trie les événements par distance.",
          ],
          [
            "Quelles villes et quels départements sont couverts ?",
            "Les grandes villes françaises (Lyon, Paris, Rennes, Bordeaux, Nantes, Marseille, Toulouse…), les départements qui accueillent des festivals en plein air (Drôme, Lozère, Aude, Lot, Isère, Hérault…) et les capitales européennes de la techno : Berlin, Amsterdam, Rotterdam, Londres, Barcelone.",
          ],
          [
            "Pourquoi certaines villes n'affichent-elles aucun chiffre ?",
            "Le chiffre est le nombre de dates à venir. Une ville sans chiffre a bien sa page, mais rien n'y est encore annoncé : soit la saison n'est pas ouverte, soit les organisateurs du coin ne publient pas encore leurs dates. La page se remplit dès qu'un événement vérifié y entre.",
          ],
          [
            "Y a-t-il des soirées ce week-end ?",
            "Oui. La page « Ce week-end » rassemble tout ce qui se passe dans les prochains jours en Europe, du club au champ de festival, avec le prix d'entrée et le lien billetterie.",
          ],
        ]
      : [
          [
            "How do I find a rave party near me?",
            "Pick your city or region from the lists above: each page gathers the local festivals and club nights. The \"Near me\" page uses your location and sorts events by distance.",
          ],
          [
            "Which cities and regions are covered?",
            "Major French cities (Lyon, Paris, Rennes, Bordeaux, Nantes, Marseille, Toulouse…), the French counties that host open-air festivals (Drôme, Lozère, Aude, Lot, Isère, Hérault…) and Europe's techno capitals: Berlin, Amsterdam, Rotterdam, London, Barcelona.",
          ],
          [
            "Why do some cities show no number?",
            "The number is how many dates are coming up. A city without one still has its page, but nothing is announced there yet: either the season has not opened, or local promoters have not published their dates. The page fills up as soon as a verified event lands in it.",
          ],
          [
            "Is anything on this weekend?",
            "Yes. The \"This weekend\" page collects everything happening across Europe in the next few days, from club nights to festival fields, with entry prices and ticket links.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.cities"), "/villes"]];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(trail, lang),
          faqJsonLd(faq),
          itemListJsonLd(next, lang, t("cities.title"), today),
        ]}
      />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("cities.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("cities.title")}
          </h1>
          <p className="lead">{t("cities.lead")}</p>
          <p className="lead">{intro}</p>

          {/* Les trois portes d'entrée, avant la moindre liste. Quelqu'un qui ne
              connaît aucun nom de ville n'a rien à faire d'un annuaire, et la géoloc
              est la seule réponse actionnable dans ce cas. Même bloc que la home,
              mêmes clés : une seule copie pour les mêmes trois portes. */}
          <div className="ways" style={{ marginTop: 26 }}>
            <Link className="way way-hero" href={`${p}/rave-party/autour-de-moi`}>
              <span className="way-ico">📍</span>
              <h3>{t("near.title")}</h3>
              <p>{t("home.way.near")}</p>
              <span className="way-go">{t("home.way.near.cta")}</span>
            </Link>
            <Link className="way" href={`${p}/rave-party/ce-week-end`}>
              <span className="way-ico">📅</span>
              <h3>{t("soon.crumb")}</h3>
              <p>{t("home.way.weekend")}</p>
              <span className="way-go">{t("home.way.weekend.cta")}</span>
            </Link>
            <Link className="way" href={`${p}/map`}>
              <span className="way-ico">🗺</span>
              <h3>{t("nav.map")}</h3>
              <p>{t("home.way.map")}</p>
              <span className="way-go">{t("home.way.map.cta")}</span>
            </Link>
          </div>

          {/* Les hubs voisins. Trois portes suffisent en tête, mais `/artistes` et
              `/explore` n'ont plus aucun lien depuis cette page sans cette rangée :
              `/lieux` et `/genres` sont repris par leurs sections plus bas. */}
          <div className="linkfarm" style={{ marginTop: 18 }}>
            <Link href={`${p}/genres`}>🎚 {t("nav.genres")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
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

          {spot.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "52px 0 8px" }}>
                {t("cities.spot")}
              </h2>
              <p className="lead" style={{ marginBottom: 20 }}>
                {t("cities.spotlead").replace("{n}", String(live.length)).replace("{c}", String(tally.size))}
              </p>
              {spot.map((g) => (
                <div key={g.label}>
                  <h3 className="citygroup">{g.label}</h3>
                  <div className="citycards">
                    {g.rows.map(({ place, n, next: nextDate, genres, clubs, shot }) => (
                      <article className="citycard" key={place.slug}>
                        <Link className="citycard-media" href={`${p}/rave-party/${place.slug}`}>
                          {shot?.src ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              className="citycard-shot"
                              src={shot.src}
                              alt={imageAlt(shot.e, lang, imageSourceOf(shot.e))}
                              width={560}
                              height={700}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="citycard-noshot" aria-hidden="true">
                              📍
                            </span>
                          )}
                          <span className="citycard-head">
                            <b>{place.label}</b>
                            <em>
                              {n} {t(n > 1 ? "dyn.dates" : "dyn.date")}
                            </em>
                          </span>
                        </Link>
                        <div className="citycard-body">
                          {genres.length > 0 && (
                            <div className="citycard-line">
                              <em>{t("venues.plays")}</em>
                              <div className="linkfarm">
                                {genres.map((g2) => (
                                  <Link key={g2} href={`${p}/genres/${genreSlug(g2)}`}>
                                    {g2}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                          {clubs.length > 0 && (
                            <div className="citycard-line">
                              <em>{t("cities.clubs")}</em>
                              <div className="linkfarm">
                                {clubs.map(({ v, n: vn }) => (
                                  <Link key={v.slug} href={`${p}/lieux/${v.slug}`}>
                                    {venueLabelL(v.name, v.nameEn, lang)} <b>{vn}</b>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                          {nextDate && (
                            <p className="citycard-next">
                              <em>{t("venues.next")}</em>{" "}
                              <Link href={`${p}${eventPath(nextDate)}`}>
                                {fmtDate(nextDate.date, lang)} · {nextDate.title}
                              </Link>
                            </p>
                          )}
                          <div className="citycard-go">
                            <Link href={`${p}/rave-party/${place.slug}`}>{t("venues.see")}</Link>
                            <Link href={`${p}/festival/${place.slug}`}>{t("cities.fests")} →</Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <h2 className="h-md" style={{ margin: "52px 0 8px" }}>
            {t("cities.all")}
          </h2>
          <p className="lead" style={{ marginBottom: 18 }}>
            {t("cities.alllead").replace("{n}", String(PLACES.length))}
          </p>
          {/* 138 zones, c'est bien au-delà du point où on parcourt un mur de pilules à
              l'œil pour y trouver sa propre ville. La boîte filtre les deux listes à la
              fois, et chaque lien reste dans le HTML rendu au serveur : le maillage
              qu'un crawler suit est exactement celui d'avant. */}
          <SearchableLinks
            groups={[
              { title: t("cities.bigcities"), items: placeItems(villes) },
              { title: t("cities.depts"), items: placeItems(zones) },
            ]}
            hrefBase={`${p}/rave-party/`}
            labelPrefix="📍 Rave party "
            placeholder={t("filter.cities")}
            countLabel={t("filter.count")}
            emptyLabel={t("filter.none")}
            clearLabel={t("filter.clear")}
            soonLabel={t("cities.soon")}
          />

          {/* Le seul lien entrant des pages `/festival/{ville}` : il ne se coupe pas,
              une page qui perd son entrée devient orpheline. Il porte en revanche son
              compte, comme tout le reste de la page. */}
          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("cities.festbycity")}
          </h2>
          <div className="linkcols">
            {villes.map((v) => {
              const n = (festTally.get(v.slug) ?? []).length;
              return (
                <Link key={v.slug} href={`${p}/festival/${v.slug}`} className={n ? undefined : "is-quiet"}>
                  Festival {v.label}
                  {n ? <> <b>{n}</b></> : null}
                </Link>
              );
            })}
          </div>

          {fests.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
                {t("cities.topfest")}
              </h2>
              <div className="linkcols">
                {fests.map((e) => (
                  <Link key={e.id} href={`${p}/festival/${eventSlug(e)}`}>
                    ✦ {e.title}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* « Pays » a quitté la nav parce qu'il disait « Villes » une deuxième fois ;
              c'est ici qu'il retrouve son entrée, les pages pays étant le parent de
              chaque page ville listée au-dessus. */}
          <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
            {t("cities.bycountry")}
          </h2>
          <div className="linkfarm">
            {countries.map((c) => (
              <Link key={c.slug} href={`${p}/pays/${c.slug}`}>
                {COUNTRY_FLAG[c.name]} {countryName(c.name, lang)} <b>{c.live}</b>
              </Link>
            ))}
            <Link href={`${p}/pays`} className="more">
              {t("cities.allcountries")}
            </Link>
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

          <Fold title={<>{t("city.faq")}</>}>
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
          </Fold>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
