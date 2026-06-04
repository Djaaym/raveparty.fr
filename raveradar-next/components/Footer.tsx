import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";

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
            <div className="socials" style={{ marginTop: 20 }}>
              <a href="#" aria-label="Instagram">◉</a>
              <a href="#" aria-label="SoundCloud">☁</a>
              <a href="#" aria-label="X">✕</a>
              <a href="#" aria-label="Telegram">✈</a>
            </div>
          </div>
          <div>
            <h5>{t("footer.discover")}</h5>
            <Link href={`${p}/explore`}>{t("footer.allevents")}</Link>
            <Link href={`${p}/artistes`}>{t("nav.artists")}</Link>
            <Link href={`${p}/villes`}>{t("nav.cities")}</Link>
            <Link href={`${p}/lieux`}>{t("nav.venues")}</Link>
            <Link href={`${p}/explore?genre=Free Party`}>{t("footer.freeparties")}</Link>
          </div>
          <div>
            <h5>{t("footer.organizers")}</h5>
            <Link href={`${p}/organizer`}>{t("footer.addevent")}</Link>
            <a href="#">{t("footer.promoterplans")}</a>
            <a href="#">{t("footer.analytics")}</a>
            <a href="#">{t("footer.ticketing")}</a>
          </div>
          <div>
            <h5>{t("footer.company")}</h5>
            <a href="#">{t("footer.about")}</a>
            <a href="#">{t("footer.manifesto")}</a>
            <a href="#">{t("footer.careers")}</a>
            <a href="#">{t("footer.contact")}</a>
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
