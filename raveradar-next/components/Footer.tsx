import Link from "next/link";
import type { Lang } from "@/lib/types";
/* Les deux modules feuilles, pas `lib/data` ni `lib/places` : le pied de page est rendu
   à l'intérieur de composants client (la carte, la géoloc), et un import du catalogue
   depuis là embarque les 870 événements dans le bundle de ces pages. */
import { genreSlug } from "@/lib/display";
import { placeBySlug } from "@/lib/places-list";
import { getDict, langPrefix } from "@/lib/i18n";
import CookieSettingsLink from "./CookieSettingsLink";

/* Sitewide footer links: the highest-volume genres and places from docs/seo-keywords.md.
   Every page carries them, so they're the backbone of the internal-link graph. */
const FOOTER_GENRES = ["Techno", "Hard Techno", "Hardstyle", "Drum & Bass", "Psytrance", "Trance", "House"];
/* Lot, Aude et Lozère en sont sortis, et c'est le contraire d'un renoncement au volume.
   Ce sont les trois plus gros mots-clés « rave party {lieu} » du marché français, mais
   leurs pages n'ont **aucune date** : elles affichent « pas encore d'événement ». Les
   lier depuis les 13 000 pages du site, c'était envoyer tout le maillage interne vers
   trois pages vides, que Google lit comme du contenu mince, et faire au lecteur une
   promesse que la page ne tient pas. Elles restent en ligne et gardent leur formulaire
   d'alerte, elles reviendront ici le jour où elles auront trois dates (voir
   `lib/thin-pages.ts`, qui tient la même règle pour le sitemap et l'indexation). */
const FOOTER_PLACES = ["rennes", "lyon", "paris", "bordeaux", "marseille", "toulouse", "lille", "bretagne"];

export default function Footer({ lang, simple = false }: { lang: Lang; simple?: boolean }) {
  const t = getDict(lang);
  const p = langPrefix(lang);

  if (simple) {
    return (
      <footer className="footer">
        <div className="wrap">
          <div className="footer-bottom" style={{ border: 0, margin: 0, padding: 0 }}>
            <Link className="brand" href={`${p}/`}>
              <span className="dot" />
              RAVE<b>RADAR</b>
            </Link>
            <span style={{ fontFamily: "var(--f-mono)" }}>{t("footer.keep")}</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href={`${p}/`}>
              <span className="dot" />
              RAVE<b>RADAR</b>
            </Link>
            <p className="lead" style={{ fontSize: ".9rem", marginTop: 16 }}>
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h2>{t("footer.discover")}</h2>
            <Link href={`${p}/explore`}>{t("footer.allevents")}</Link>
            <Link href={`${p}/rave-party/ce-week-end`}>{t("soon.title")}</Link>
            <Link href={`${p}/rave-party/autour-de-moi`}>{t("near.title")}</Link>
            <Link href={`${p}/artistes`}>{t("nav.artists")}</Link>
            <Link href={`${p}/villes`}>{t("nav.cities")}</Link>
            <Link href={`${p}/pays`}>{t("nav.countries")}</Link>
            <Link href={`${p}/lieux`}>{t("nav.venues")}</Link>
            <Link href={`${p}/map`}>{t("nav.map")}</Link>
          </div>
          <div>
            <h2>{t("footer.genres")}</h2>
            {FOOTER_GENRES.map((g) => (
              <Link key={g} href={`${p}/genres/${genreSlug(g)}`}>
                {g}
              </Link>
            ))}
          </div>
          <div>
            <h2>{t("footer.cities")}</h2>
            {FOOTER_PLACES.map((s) => {
              const place = placeBySlug(s);
              return place ? (
                <Link key={s} href={`${p}/rave-party/${s}`}>
                  Rave party {place.label}
                </Link>
              ) : null;
            })}
          </div>
          <div>
            <h2>{t("footer.organizers")}</h2>
            <Link href={`${p}/organizer`}>{t("footer.addevent")}</Link>
            <Link href={`${p}/account`}>{t("nav.signin")}</Link>
            <Link href={`${p}/genres`}>{t("nav.genres")}</Link>
          </div>
          {/* Les quatre pages institutionnelles manquaient entièrement au site. Deux sont
              une obligation (mentions légales et confidentialité, LCEN et RGPD, dès lors
              qu'on collecte une adresse), les deux autres sont ce qui permet à un moteur
              comme à un promoteur de savoir qui édite le site. Elles se lient depuis le
              pied de page, donc depuis toutes les pages : c'est là qu'on les cherche.
              Leurs chemins sont traduits (« /a-propos » et « /en/about »), d'où la paire
              écrite ici plutôt qu'un simple préfixe. */}
          <div>
            <h2>{t("footer.legal")}</h2>
            <Link href={lang === "en" ? "/en/about" : "/a-propos"}>{t("footer.about")}</Link>
            <Link href={lang === "en" ? "/en/contact" : "/contact"}>{t("footer.contact")}</Link>
            <Link href={lang === "en" ? "/en/legal-notice" : "/mentions-legales"}>{t("footer.notice")}</Link>
            <Link href={lang === "en" ? "/en/privacy" : "/confidentialite"}>{t("footer.privacy")}</Link>
            <CookieSettingsLink lang={lang} />
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t("footer.rights")}</span>
          <span style={{ fontFamily: "var(--f-mono)" }}>{t("footer.made")}</span>
        </div>
      </div>
    </footer>
  );
}
