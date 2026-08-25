import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, GENRES, FESTIVALS, eventSlug, genreSlug, genreDescL, liveEditions, todayISO, upcoming } from "@/lib/data";
import { rankPlaces } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { VENUES } from "@/lib/venues";
import { genreProfile, pickL } from "@/lib/genres";
import { getDict, langPrefix } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import Nav from "./Nav";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

export default function GenresHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const today = todayISO();
  const live = upcoming(undefined, today);
  const liveIds = new Set(live.map((e) => e.id));
  // Artists with a date still to come — the ones worth sending link equity to.
  const artists = ARTISTS.filter((a) => a.eventIds.some((id) => liveIds.has(id)))
    .sort((a, b) => b.eventIds.length - a.eventIds.length)
    .slice(0, 30);
  const venues = [...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length).slice(0, 14);
  // Finished editions swapped for their next one instead of falling back to the archive:
  // a shortlist that links a page stamped "édition terminée" is worse than a short one.
  const fests = liveEditions(FESTIVALS, today).slice(0, 16);

  const intro =
    lang === "fr"
      ? `${ALL_GENRES.length} styles suivis et ${live.length} date${live.length > 1 ? "s" : ""} à venir en Europe. Chaque genre a sa page : les événements du moment, les artistes qui le défendent et les villes où le son tourne le plus.`
      : `${ALL_GENRES.length} styles tracked and ${live.length} upcoming date${live.length > 1 ? "s" : ""} across Europe. Each genre gets its own page: what's on, the artists carrying it and the cities where it hits hardest.`;

  /* Ce qui remplace le mur de 90 villes en bas de page. Une page qui existe pour
     expliquer des styles doit répondre aux questions qu'on se pose vraiment à leur
     sujet — et une FAQ est aussi ce que Google affiche en résultat enrichi, ce qu'une
     colonne de liens ne fera jamais. Les réponses tirent leurs faits de lib/genres.ts. */
  const faq: [string, string][] =
    lang === "fr"
      ? [
          [
            "Quelle différence entre techno et hard techno ?",
            "Le tempo et le kick. La techno tourne entre 125 et 150 BPM avec un kick net et régulier ; la hard techno monte à 145-170 avec un kick saturé, distordu, et des breaks mélodiques empruntés à la trance que la techno classique n'a pas. Ce sont deux pages distinctes ici, avec deux agendas distincts.",
          ],
          [
            "C'est quoi le BPM, et pourquoi ça compte ?",
            "Le BPM (battements par minute) est la vitesse du morceau, et c'est le repère le plus fiable pour situer un style : la house tourne autour de 125, la techno 130-140, la drum & bass 174, le hardcore au-delà de 180. Chaque fiche de genre ci-dessus affiche sa fourchette — un tempo est un usage courant, pas une règle.",
          ],
          [
            "Je débute : par quel genre commencer ?",
            "La house et la techno sont les deux troncs dont presque tout le reste dérive, et ce sont les plus faciles à aborder en club. Si tu cherches quelque chose de plus immédiat, l'EDM et le hardstyle jouent sur des structures très lisibles, avec montée et drop annoncés. La page « Ce week-end » te dira ce qui se joue près de chez toi dans les prochains jours.",
          ],
          [
            "Warehouse, c'est un style de musique ?",
            "Non, et c'est assumé : c'est un lieu — entrepôt, hangar, ancienne usine. On le garde comme catégorie parce que c'est ce que les gens cherchent, et parce que le format change réellement la soirée : sono surdimensionnée, béton, pas d'heure de fin. Ce qu'on y joue, c'est surtout de la techno et de la hard techno.",
          ],
          [
            "Comment trouver une soirée dans mon style ?",
            "Ouvre la page du genre : elle liste toutes les dates à venir en Europe, les artistes qui le défendent et les villes où il tourne le plus. Tu peux aussi créer une alerte sur un genre pour être prévenu dès qu'une date est annoncée près de chez toi.",
          ],
        ]
      : [
          [
            "What's the difference between techno and hard techno?",
            "Tempo and kick. Techno runs 125–150 BPM with a clean, steady kick; hard techno climbs to 145–170 with a saturated, distorted kick and melodic breaks borrowed from trance that classic techno doesn't have. They are two separate pages here, with two separate calendars.",
          ],
          [
            "What is BPM, and why does it matter?",
            "BPM (beats per minute) is the speed of a track, and it is the most reliable way to place a style: house sits around 125, techno 130–140, drum & bass 174, hardcore beyond 180. Every genre card above shows its range — a tempo is common practice, not a rule.",
          ],
          [
            "I'm new to this — which genre should I start with?",
            "House and techno are the two trunks nearly everything else grows from, and the easiest way in at a club. If you want something more immediate, EDM and hardstyle use very legible structures, with the build and drop announced. The \"This weekend\" page will show you what's on near you over the next few days.",
          ],
          [
            "Is warehouse actually a music genre?",
            "No, and that's deliberate: it's a place — a warehouse, a hangar, a former factory. We keep it as a category because it is what people search for, and because the format genuinely changes the night: an oversized rig, concrete, no closing time. What gets played there is mostly techno and hard techno.",
          ],
          [
            "How do I find a night in my style?",
            "Open the genre's page: it lists every upcoming date across Europe, the artists carrying the style and the cities where it plays most. You can also set an alert on a genre to hear about new dates near you as they are announced.",
          ],
        ];

  const trail: [string, string][] = [[t("nav.genres"), "/genres"]];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(trail, lang), faqJsonLd(faq)]} />
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Breadcrumbs lang={lang} trail={trail} />
          <span className="eyebrow" style={{ display: "block", marginTop: 14 }}>
            {t("genrehub.eyebrow")}
          </span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("genrehub.title")}
          </h1>
          <p className="lead">{t("genrehub.lead")}</p>
          <p className="lead">{intro}</p>

          <div className="linkfarm" style={{ marginTop: 20 }}>
            <Link href={`${p}/rave-party/ce-week-end`}>🔥 {t("soon.crumb")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>📍 {t("near.crumb")}</Link>
            <Link href={`${p}/villes`}>🌍 {t("nav.cities")}</Link>
            <Link href={`${p}/artistes`}>🎧 {t("nav.artists")}</Link>
            <Link href={`${p}/lieux`}>🏛 {t("nav.venues")}</Link>
            <Link href={`${p}/explore`}>▦ {t("nav.explore")}</Link>
          </div>

          {/* La grille de tuiles carrées disait un style en cinq mots ("Fréquences forest
              & goa") : joli, mais elle ne répondait à aucune des questions que se pose
              quelqu'un devant la liste — à quelle vitesse ça joue, d'où ça vient, en quoi
              la hard techno n'est pas la techno. La fiche vit dans lib/genres.ts ; ici on
              l'affiche, avec le compte de dates et les villes où ce style tourne vraiment. */}
          <div className="genrecards">
            {ALL_GENRES.map((g) => {
              const k = GENRES[g];
              const own = live.filter((e) => e.genres.includes(g));
              const cities = rankPlaces(own, 4);
              const prof = genreProfile(g);
              const href = `${p}/genres/${genreSlug(g)}`;
              return (
                <article className="genrecard" key={g}>
                  <span className="genrecard-bar" style={{ background: `linear-gradient(120deg,${k.c1},${k.c2})` }} />
                  <div className="genrecard-body">
                    <h2 className="genrecard-title">
                      <Link href={href}>{g}</Link>
                    </h2>
                    <p className="genrecard-tag">{genreDescL(g, lang)}</p>
                    <div className="genrecard-facts">
                      {prof && (
                        <span>
                          <em>{t("genre.bpm")}</em> {prof.bpm} BPM
                        </span>
                      )}
                      {prof && (
                        <span>
                          <em>{t("genre.origin")}</em> {pickL(prof.origin, lang)}
                        </span>
                      )}
                      <span>
                        <em>{t("genre.upcoming")}</em>{" "}
                        {own.length > 0 ? `${own.length} ${t(own.length > 1 ? "dyn.dates" : "dyn.date")}` : t("genre.nodates")}
                      </span>
                    </div>
                    {prof && <p className="genrecard-text">{pickL(prof.text, lang)}</p>}
                    {prof && (
                      <p className="genrecard-tell">
                        <em>{t("genre.tell")}</em> {pickL(prof.tell, lang)}
                      </p>
                    )}
                    {cities.length > 0 && (
                      <div className="linkfarm genrecard-cities">
                        {cities.map(({ place, count }) => (
                          <Link key={place.slug} href={`${p}/rave-party/${place.slug}`}>
                            {place.label} <b>{count}</b>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link className="genrecard-go" href={href}>
                      {t("genre.see")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {artists.length > 0 && (
            <>
              <h2 className="h-md" style={{ margin: "48px 0 16px" }}>
                {t("hub.artists")}
              </h2>
              <div className="linkfarm">
                {artists.map((a) => (
                  <Link key={a.slug} href={`${p}/artistes/${a.slug}`}>
                    {a.name}
                  </Link>
                ))}
              </div>
            </>
          )}

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

          <h2 className="h-md" style={{ margin: "48px 0 18px" }}>
            {t("genrehub.faq")}
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
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
