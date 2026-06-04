import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ARTISTS } from "@/lib/artists";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

export default function ArtistsHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("artists.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("artists.title")}
          </h1>
          <p className="lead">{t("artists.lead")}</p>

          <div className="artist-grid" style={{ marginTop: 36 }}>
            {ARTISTS.map((a) => (
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
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
