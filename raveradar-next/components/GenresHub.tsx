import Link from "next/link";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, GENRES, EVENTS, genreSlug, genreDescL } from "@/lib/data";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import Reveal from "./Reveal";

export default function GenresHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("genrehub.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("genrehub.title")}
          </h1>
          <p className="lead">{t("genrehub.lead")}</p>
          <div className="genres" style={{ marginTop: 36 }}>
            {ALL_GENRES.map((g) => {
              const k = GENRES[g];
              const n = EVENTS.filter((e) => e.genres.includes(g)).length;
              return (
                <Link className="genre" key={g} href={`${p}/genres/${genreSlug(g)}`}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(150deg,${k.c1},${k.c2})`,
                      opacity: 0.85,
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span>{g}</span>
                    <small>{genreDescL(g, lang)}</small>
                    <small style={{ marginTop: 8, fontFamily: "var(--f-mono)" }}>
                      {n} {t("dyn.events")}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
