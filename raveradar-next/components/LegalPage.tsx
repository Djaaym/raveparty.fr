import type { Lang } from "@/lib/types";
import type { LegalBlock } from "@/lib/legal";
import { pickL } from "@/lib/legal";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getDict } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";

/**
 * Le gabarit des quatre pages institutionnelles (à propos, contact, mentions légales,
 * confidentialité).
 *
 * Un seul composant pour les quatre : ce sont des pages de texte, elles n'ont ni grille
 * ni donnée du catalogue, et quatre copies du même squelette divergeraient à la
 * première correction. Le contenu vient de `lib/legal.ts`, ce fichier ne décide que de
 * la mise en page.
 *
 * `Breadcrumbs` et `breadcrumbJsonLd` comme partout ailleurs : la règle du projet vaut
 * aussi pour les pages qui ne portent pas de trafic, c'est ce qui les rattache à
 * l'arborescence au lieu de les laisser orphelines derrière le pied de page.
 */
export default function LegalPage({
  lang,
  path,
  title,
  lead,
  blocks,
  updated,
}: {
  lang: Lang;
  path: string;
  title: string;
  lead: string;
  blocks: LegalBlock[];
  /** Date de dernière mise à jour, au format ISO. Une page de conditions sans date ne dit pas si elle est à jour. */
  updated?: string;
}) {
  const t = getDict(lang);
  const crumb: [string, string][] = [[title, path]];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumb, lang)} />
      <Nav lang={lang} />
      <main className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <Breadcrumbs lang={lang} trail={crumb} />
        <h1 className="h-xl" style={{ margin: "18px 0 14px" }}>
          {title}
        </h1>
        <p className="lead" style={{ maxWidth: 760 }}>
          {lead}
        </p>
        {updated && (
          <p style={{ color: "var(--grey)", fontFamily: "var(--f-mono)", fontSize: ".85rem", marginTop: 10 }}>
            {t("legal.updated")} {new Date(updated).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        <div className="prose" style={{ maxWidth: 760, marginTop: 40 }}>
          {blocks.map((b) => (
            <section key={pickL(b.h, lang)} style={{ marginBottom: 36 }}>
              <h2 className="h-md" style={{ fontSize: "1.25rem", marginBottom: 12 }}>
                {pickL(b.h, lang)}
              </h2>
              {b.p.map((p, i) => (
                <p key={i} className="lead" style={{ fontSize: ".97rem", marginBottom: 12 }}>
                  {pickL(p, lang)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
