import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import MapView from "./MapView";

export default function MapPageView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("map.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("map.title")}
          </h1>
          <p className="lead">{t("map.lead")}</p>
          <MapView lang={lang} />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
