import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import AccountTabs from "./AccountTabs";

export default function AccountView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <div className="profile-head">
            <div className="avatar">R</div>
            <div>
              <h1 className="h-md">{t("acc.hi")}</h1>
              <p style={{ color: "var(--grey)" }}>{t("acc.sub")}</p>
            </div>
            <a href="#" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>
              {t("acc.edit")}
            </a>
          </div>
          <AccountTabs lang={lang} />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
