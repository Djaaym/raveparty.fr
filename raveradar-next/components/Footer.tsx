import Link from "next/link";
import type { Lang } from "@/lib/types";
import { genreSlug } from "@/lib/data";
import { placeBySlug } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";

/* Sitewide footer links: the highest-volume genres and places from docs/seo-keywords.md.
   Every page carries them, so they're the backbone of the internal-link graph. */
const FOOTER_GENRES = ["Techno", "Hard Techno", "Hardstyle", "Drum & Bass", "Psytrance", "Free Party", "House"];
const FOOTER_PLACES = ["lot", "aude", "lozere", "rennes", "lyon", "paris", "bordeaux", "bretagne"];

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
        </div>
        <div className="footer-bottom">
          <span>{t("footer.rights")}</span>
          <span style={{ fontFamily: "var(--f-mono)" }}>{t("footer.made")}</span>
        </div>
      </div>
    </footer>
  );
}
