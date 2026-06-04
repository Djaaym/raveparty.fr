import Link from "next/link";
import type { Lang } from "@/lib/types";
import { countryLabel } from "@/lib/data";
import { VENUES } from "@/lib/venues";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

export default function VenuesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("venues.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("venues.title")}
          </h1>
          <p className="lead">{t("venues.lead")}</p>

          <div className="artist-grid" style={{ marginTop: 36 }}>
            {VENUES.map((v) => (
              <Link key={v.slug} href={`${p}/lieux/${v.slug}`} className="artist-tile">
                <div className="av">🏛</div>
                <div>
                  <b>{v.name}</b>
                  <span>
                    {v.city}, {countryLabel(v.country, lang)} · {v.eventIds.length}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
