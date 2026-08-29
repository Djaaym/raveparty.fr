import Link from "next/link";
import type { Lang } from "@/lib/types";
import { langPrefix } from "@/lib/i18n";

/**
 * Visible breadcrumb trail. Pair it with `breadcrumbJsonLd` so the same path is
 * exposed to crawlers, it feeds the hierarchy into the site's internal linking
 * instead of leaving deep pages orphaned behind the nav.
 */
export default function Breadcrumbs({ lang, trail }: { lang: Lang; trail: [string, string][] }) {
  const p = langPrefix(lang);
  const home = lang === "en" ? "Home" : "Accueil";

  return (
    <nav className="crumbs" aria-label={lang === "en" ? "Breadcrumb" : "Fil d'Ariane"}>
      <Link href={`${p}/`}>{home}</Link>
      {trail.map(([label, path], i) => {
        const last = i === trail.length - 1;
        return (
          <span key={path}>
            <span className="sep">›</span>
            {last ? <span aria-current="page">{label}</span> : <Link href={`${p}${path}`}>{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
