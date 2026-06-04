import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import ExploreClient from "./ExploreClient";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function ExploreView({ lang, searchParams }: { lang: Lang; searchParams: SP }) {
  const t = getDict(lang);
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("explore.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("explore.title")}
          </h1>
          <p className="lead">{t("explore.lead")}</p>
          <ExploreClient
            lang={lang}
            initialGenre={one(searchParams.genre)}
            initialCountry={one(searchParams.country)}
            initialQ={one(searchParams.q)}
          />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
