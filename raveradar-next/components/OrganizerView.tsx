import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import { ALL_GENRES, GENRES, TYPES } from "@/lib/data";
import { CURRENCIES } from "@/lib/submissions";
import OrganizerForm from "./OrganizerForm";

/**
 * Le studio organisateur.
 *
 * Les genres et les types arrivent en props plutôt que d'être importés par le
 * formulaire : celui-ci est un composant client, et `lib/data.ts` y embarquerait tout le
 * catalogue. Les sous-genres, eux, vivent dans un module **feuille** que le formulaire
 * importe directement, comme `CURRENCIES` : une prop de plus n'y apporterait rien.
 *
 * Les quatre étapes ne sont plus rendues ici : elles étaient décoratives, avec la
 * troisième allumée en permanence sur une page où rien n'avançait. Le formulaire porte
 * désormais un vrai assistant, dont chaque passage valide ce qui précède.
 */
export default function OrganizerView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
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
          <ul className="org-promises">
            {["org.promise1", "org.promise2", "org.promise3"].map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
          <OrganizerForm
            lang={lang}
            genres={ALL_GENRES.map((g) => ({ name: g, c1: GENRES[g].c1, c2: GENRES[g].c2 }))}
            types={TYPES}
            currencies={CURRENCIES}
          />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
