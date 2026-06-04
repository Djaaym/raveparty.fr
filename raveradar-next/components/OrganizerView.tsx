import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import OrganizerForm from "./OrganizerForm";

export default function OrganizerView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const steps = [t("org.step1"), t("org.step2"), t("org.step3"), t("org.step4")];
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">{t("org.eyebrow")}</span>
          <h1 className="h-lg" style={{ margin: "14px 0 8px" }}>
            {t("org.title")}
          </h1>
          <p className="lead">{t("org.lead")}</p>
          <div className="steps" style={{ marginTop: 36 }}>
            {steps.map((s, i) => (
              <div className={`step ${i < 3 ? "on" : ""}`} key={s}>
                <span className="num">{i + 1}</span> {s}
              </div>
            ))}
          </div>
          <OrganizerForm lang={lang} />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
