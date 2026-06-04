import Link from "next/link";
import type { Lang } from "@/lib/types";
import { PLACES } from "@/lib/places";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

export default function CitiesHub({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const villes = PLACES.filter((x) => x.kind === "ville");
  const zones = PLACES.filter((x) => x.kind !== "ville");

  const Tile = ({ slug, label }: { slug: string; label: string }) => (
    <Link
      href={`${p}/rave-party/${slug}`}
      className="chip"
      style={{ fontSize: ".95rem", padding: "12px 18px" }}
    >
      📍 Rave party {label}
    </Link>
  );

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("cities.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("cities.title")}
          </h1>
          <p className="lead">{t("cities.lead")}</p>

          <h3 className="h-md" style={{ margin: "36px 0 16px" }}>
            {t("cities.bigcities")}
          </h3>
          <div className="chips" style={{ justifyContent: "flex-start" }}>
            {villes.map((v) => (
              <Tile key={v.slug} slug={v.slug} label={v.label} />
            ))}
          </div>

          <h3 className="h-md" style={{ margin: "36px 0 16px" }}>
            {t("cities.depts")}
          </h3>
          <div className="chips" style={{ justifyContent: "flex-start" }}>
            {zones.map((v) => (
              <Tile key={v.slug} slug={v.slug} label={v.label} />
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
