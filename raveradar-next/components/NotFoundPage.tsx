import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";

/**
 * Le corps de la page 404, partagé par les deux arbres de langue.
 *
 * Il n'existait aucune 404 sur le site : au bout d'une chaîne qui redirige les slugs
 * renommés (`middleware.ts`), les éditions qui changent de main (`lib/editions.ts`) et
 * une soixantaine d'URL retirées (`next.config.mjs`), une adresse inconnue tombait sur
 * l'écran par défaut de Next, fond blanc, en anglais, sans nav ni issue.
 *
 * Les portes de sortie ne sont pas décoratives : quelqu'un qui arrive ici cherchait une
 * date, pas la page d'accueil. On lui propose l'agenda, les prochaines dates, les villes
 * et la carte, c'est-à-dire les quatre façons d'entrer dans le catalogue.
 */
export default function NotFoundPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  return (
    /* `lang` est déclaré ici et pas seulement sur `<html>` : Next rend la frontière
       `not-found` dans une enveloppe à lui (`<html id="__next_error__">`) quand le
       projet a deux layouts racines, et cette enveloppe n'hérite pas de l'attribut du
       groupe. Le porter sur le contenu donne quand même la bonne langue à un lecteur
       d'écran, ce qui est la seule chose qui compte sur une page en `noindex`. */
    <div lang={lang}>
      <Nav lang={lang} />
      <main className="wrap" style={{ padding: "80px 0 90px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--f-mono)", color: "var(--grey)", letterSpacing: ".2em" }}>404</p>
        <h1 className="h-xl" style={{ margin: "14px 0 16px" }}>
          {t("nf.title")}
        </h1>
        <p className="lead" style={{ maxWidth: 560, margin: "0 auto" }}>
          {t("nf.lead")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
          <Link href={`${p}/explore`} className="btn btn-primary">
            {t("footer.allevents")}
          </Link>
          <Link href={`${p}/rave-party/ce-week-end`} className="btn btn-ghost">
            {t("soon.crumb")}
          </Link>
          <Link href={`${p}/villes`} className="btn btn-ghost">
            {t("nav.cities")}
          </Link>
          <Link href={`${p}/map`} className="btn btn-ghost">
            {t("nav.map")}
          </Link>
        </div>
      </main>
      <Footer lang={lang} simple />
    </div>
  );
}
